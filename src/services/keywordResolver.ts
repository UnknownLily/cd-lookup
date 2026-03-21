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

const REMOTE_RESOLUTION_KEYS: ListFilterKey[] = ['circle', 'event', 'coverchar', 'ogmusic', 'ogwork', 'arrange', 'lyric', 'compose', 'vocal', 'script', 'dub']
const CREDIT_RESOLUTION_KEYS = new Set<ListFilterKey>(['arrange', 'lyric', 'compose', 'vocal', 'script', 'dub', 'perform'])
const SUGGESTION_PRIORITY: ListFilterKey[] = ['circle', 'event', 'coverchar', 'ogmusic', 'ogwork', 'region', 'work', 'state', 'property', 'rate', 'noth', 'original', 'style', 'only', 'arrange', 'lyric', 'compose', 'vocal', 'script', 'dub', 'perform']

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

function isCreditResolutionKey(key: ListFilterKey): boolean {
  return CREDIT_RESOLUTION_KEYS.has(key)
}

function compareMatchPriority(left: KeywordMatch, right: KeywordMatch): number {
  const leftIndex = SUGGESTION_PRIORITY.indexOf(left.key)
  const rightIndex = SUGGESTION_PRIORITY.indexOf(right.key)
  return leftIndex - rightIndex || left.value.localeCompare(right.value, 'zh-CN')
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

function sortMatches(matches: KeywordMatch[]): KeywordMatch[] {
  return [...matches].sort(compareMatchPriority)
}

function selectPreferredMatch(matches: KeywordMatch[]): KeywordMatch | null {
  const uniqueMatches = sortMatches(dedupeMatches(matches))
  if (uniqueMatches.length === 1) {
    return uniqueMatches[0]
  }

  const nonCreditMatches = uniqueMatches.filter((match) => !isCreditResolutionKey(match.key))
  if (nonCreditMatches.length === 1) {
    return nonCreditMatches[0]
  }

  return null
}

function formatAmbiguousFields(matches: KeywordMatch[]): string {
  return sortMatches(dedupeMatches(matches))
    .map((match) => FIELD_LABELS[match.key] ?? match.key)
    .join('、')
}

function formatAmbiguousCandidates(matches: KeywordMatch[]): string {
  return sortMatches(dedupeMatches(matches))
    .slice(0, 6)
    .map((match) => `${FIELD_LABELS[match.key] ?? match.key}：${match.value}`)
    .join('；')
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

  return sortMatches(dedupeMatches(matches)).slice(0, 12).map(toSuggestion)
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
  const preferredExactMatch = selectPreferredMatch(exactMatches)

  if (preferredExactMatch) {
    return {
      criteria: createResolvedCriteria(criteria, preferredExactMatch),
      noticeMessage: createNoticeMessage(keyword, preferredExactMatch, 'exact'),
    }
  }

  if (exactMatches.length > 1) {
    throw new Error(`关键词“${keyword}”同时匹配多个字段：${formatAmbiguousFields(exactMatches)}。候选为：${formatAmbiguousCandidates(exactMatches)}。请从下拉建议中明确选择，或直接在筛选面板中添加。`)
  }

  const looseMatches = dedupeMatches(remoteMatches.looseMatches)
  const preferredLooseMatch = selectPreferredMatch(looseMatches)
  if (preferredLooseMatch) {
    return {
      criteria: createResolvedCriteria(criteria, preferredLooseMatch),
      noticeMessage: createNoticeMessage(keyword, preferredLooseMatch, 'loose'),
    }
  }

  if (looseMatches.length > 1) {
    throw new Error(`关键词“${keyword}”存在多个候选标签：${formatAmbiguousCandidates(looseMatches)}。请从下拉建议中明确选择，或改用筛选面板中的标签输入。`)
  }

  throw new Error(`关键词“${keyword}”未识别为可筛选标签。请输入制作方、发售展会、原曲、原曲出处或参与者名称，或直接在筛选面板中选择。`)
}
