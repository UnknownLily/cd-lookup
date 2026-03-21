import { FILTER_GROUPS, findFilterDefinition, isListFilter } from '../config/filters'
import { getTagSuggestions } from './tagSuggestions'
import { FIELD_LABELS, cloneCriteria, normalizeTextList, type ListFilterKey, type SearchCriteriaDraft } from '../types/search'

interface KeywordMatch {
  key: ListFilterKey
  value: string
}

export interface KeywordSuggestion {
  key: ListFilterKey
  value: string
  fieldLabel: string
}

export interface KeywordResolutionResult {
  criteria: SearchCriteriaDraft
  noticeMessage: string | null
}

const REMOTE_RESOLUTION_KEYS: ListFilterKey[] = ['circle', 'event', 'coverchar']

function normalizeTerm(value: string): string {
  return value.trim().toLocaleLowerCase('zh-CN')
}

function isExactMatch(left: string, right: string): boolean {
  return normalizeTerm(left) === normalizeTerm(right)
}

function isLooseMatch(candidate: string, term: string): boolean {
  const normalizedCandidate = normalizeTerm(candidate)
  const normalizedTerm = normalizeTerm(term)
  return normalizedTerm.length > 0 && normalizedCandidate.includes(normalizedTerm)
}

function createResolvedCriteria(criteria: SearchCriteriaDraft, match: KeywordMatch): SearchCriteriaDraft {
  const nextCriteria = cloneCriteria(criteria)
  nextCriteria.keyword = ''
  nextCriteria[match.key] = normalizeTextList([...nextCriteria[match.key], match.value])
  return nextCriteria
}

function createNoticeMessage(keyword: string, match: KeywordMatch, mode: 'exact' | 'loose'): string {
  const fieldLabel = FIELD_LABELS[match.key] ?? match.key
  if (mode === 'exact') {
    return `已将关键词“${keyword.trim()}”识别为${fieldLabel}：${match.value}`
  }

  return `已将关键词“${keyword.trim()}”补全为${fieldLabel}：${match.value}`
}

function collectStaticMatches(term: string): KeywordMatch[] {
  const matches: KeywordMatch[] = []

  for (const group of FILTER_GROUPS) {
    for (const filter of group.filters) {
      if (!isListFilter(filter)) {
        continue
      }

      for (const item of filter.items) {
        if (isExactMatch(item, term)) {
          matches.push({
            key: filter.key,
            value: item,
          })
        }
      }
    }
  }

  return matches
}

async function collectRemoteMatches(term: string, signal?: AbortSignal): Promise<{ exactMatches: KeywordMatch[]; looseMatches: KeywordMatch[] }> {
  const exactMatches: KeywordMatch[] = []
  const looseMatches: KeywordMatch[] = []

  await Promise.all(
    REMOTE_RESOLUTION_KEYS.map(async (key) => {
      const filter = findFilterDefinition(key)
      if (!filter || !isListFilter(filter) || !filter.suggestionSource) {
        return
      }

      const result = await getTagSuggestions({
        term,
        staticItems: filter.items,
        suggestionSource: filter.suggestionSource,
        signal,
      })

      const exactValues = result.suggestions.filter((item) => isExactMatch(item, term))
      for (const value of exactValues) {
        exactMatches.push({ key, value })
      }

      if (exactValues.length === 0) {
        const looseValues = result.suggestions.filter((item) => isLooseMatch(item, term))
        if (looseValues.length === 1) {
          looseMatches.push({ key, value: looseValues[0] })
        }
      }
    }),
  )

  return { exactMatches, looseMatches }
}

function dedupeMatches(matches: KeywordMatch[]): KeywordMatch[] {
  const seen = new Set<string>()
  return matches.filter((match) => {
    const cacheKey = `${match.key}::${normalizeTerm(match.value)}`
    if (seen.has(cacheKey)) {
      return false
    }

    seen.add(cacheKey)
    return true
  })
}

function formatAmbiguousFields(matches: KeywordMatch[]): string {
  return dedupeMatches(matches)
    .map((match) => FIELD_LABELS[match.key] ?? match.key)
    .join('、')
}

function toSuggestion(match: KeywordMatch): KeywordSuggestion {
  return {
    key: match.key,
    value: match.value,
    fieldLabel: FIELD_LABELS[match.key] ?? match.key,
  }
}

function collectStaticSuggestions(term: string): KeywordMatch[] {
  const matches: KeywordMatch[] = []

  for (const group of FILTER_GROUPS) {
    for (const filter of group.filters) {
      if (!isListFilter(filter)) {
        continue
      }

      for (const item of filter.items) {
        if (isLooseMatch(item, term)) {
          matches.push({
            key: filter.key,
            value: item,
          })
        }
      }
    }
  }

  return matches
}

export async function getKeywordSuggestions(term: string, signal?: AbortSignal): Promise<KeywordSuggestion[]> {
  const keyword = term.trim()
  if (!keyword) {
    return []
  }

  const matches = collectStaticSuggestions(keyword)

  await Promise.all(
    REMOTE_RESOLUTION_KEYS.map(async (key) => {
      const filter = findFilterDefinition(key)
      if (!filter || !isListFilter(filter) || !filter.suggestionSource) {
        return
      }

      const result = await getTagSuggestions({
        term: keyword,
        staticItems: filter.items,
        suggestionSource: filter.suggestionSource,
        signal,
      })

      for (const value of result.suggestions.slice(0, 4)) {
        matches.push({ key, value })
      }
    }),
  )

  return dedupeMatches(matches).slice(0, 12).map(toSuggestion)
}

export async function resolveKeywordCriteria(criteria: SearchCriteriaDraft, signal?: AbortSignal): Promise<KeywordResolutionResult> {
  const keyword = criteria.keyword.trim()
  if (!keyword) {
    return {
      criteria: cloneCriteria(criteria),
      noticeMessage: null,
    }
  }

  const staticMatches = collectStaticMatches(keyword)
  const remoteMatches = await collectRemoteMatches(keyword, signal)
  const exactMatches = dedupeMatches([...staticMatches, ...remoteMatches.exactMatches])

  if (exactMatches.length === 1) {
    return {
      criteria: createResolvedCriteria(criteria, exactMatches[0]),
      noticeMessage: createNoticeMessage(keyword, exactMatches[0], 'exact'),
    }
  }

  if (exactMatches.length > 1) {
    throw new Error(`关键词“${keyword}”同时匹配多个字段：${formatAmbiguousFields(exactMatches)}。请直接在筛选面板中选择。`)
  }

  const looseMatches = dedupeMatches(remoteMatches.looseMatches)
  if (looseMatches.length === 1) {
    return {
      criteria: createResolvedCriteria(criteria, looseMatches[0]),
      noticeMessage: createNoticeMessage(keyword, looseMatches[0], 'loose'),
    }
  }

  if (looseMatches.length > 1) {
    throw new Error(`关键词“${keyword}”存在多个候选标签，暂时无法自动归类。请改用筛选面板中的标签输入。`)
  }

  throw new Error(`关键词“${keyword}”未识别为可筛选标签。请输入制作方、发售展会或封面角色等明确名称，或直接在筛选面板中选择。`)
}
