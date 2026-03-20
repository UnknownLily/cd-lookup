import {
  RANGE_BOUNDS,
  isRangeAtDefault,
  hasActiveCriteria,
  type ApiCriteriaPayload,
  type ItemField,
  type QueryResponse,
  type RangeFilterKey,
  type SearchCriteriaDraft,
} from '../types/search'

const API_BASE = 'https://thwiki.cc/rest/asktrack/v0'
const EXTRA_CRITERIA: ApiCriteriaPayload = {
  name: [],
  alname: null,
  circle: null,
  time: null,
  cover: null,
}

function buildApiUrl(endpoint: string): string {
  const origin = encodeURIComponent(window.location.origin).replace(/\./g, '%2E')
  const divider = endpoint.includes('?') ? '&' : '?'
  return `${API_BASE}${endpoint}${divider}origin=${origin}`
}

function buildRangeCriteria(key: RangeFilterKey, value: [number, number]): string[] | null {
  const [start, end] = value
  const bounds = RANGE_BOUNDS[key]

  if (isRangeAtDefault(key, value)) {
    return null
  }

  if (start === end) {
    return start === 0 ? ['=', start.toString()] : [start.toString()]
  }

  if (start === bounds.min) {
    return [`<=${end}`]
  }

  if (end === bounds.max) {
    return [`>=${start}`]
  }

  return [`>=${start}`, `<=${end}`]
}

export function toApiCriteria(criteria: SearchCriteriaDraft): ApiCriteriaPayload | null {
  if (!hasActiveCriteria(criteria)) {
    return null
  }

  const payload: ApiCriteriaPayload = {
    ...EXTRA_CRITERIA,
  }

  if (criteria.keyword.trim()) {
    payload.name = [criteria.keyword.trim()]
  }

  for (const key of Object.keys(RANGE_BOUNDS) as RangeFilterKey[]) {
    const criteriaValue = buildRangeCriteria(key, criteria[key])
    if (criteriaValue) {
      payload[key as ItemField] = criteriaValue
    }
  }

  for (const key of ['event', 'circle', 'coverchar', 'region', 'work', 'state', 'property', 'rate', 'only'] as const) {
    if (criteria[key].length > 0) {
      payload[key as ItemField] = [...criteria[key]]
    }
  }

  return payload
}

export async function fetchSearchPage(
  criteria: SearchCriteriaDraft,
  options: { offset?: number; limit?: number; signal?: AbortSignal } = {},
): Promise<QueryResponse> {
  const payload = toApiCriteria(criteria)

  if (!payload) {
    throw new Error('至少需要一个搜索条件')
  }

  const offset = options.offset ?? 0
  const limit = options.limit ?? 24
  const response = await fetch(buildApiUrl(`/query?limit=${limit}&offset=${offset}`), {
    method: 'POST',
    body: JSON.stringify(payload),
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error(`接口请求失败：${response.status}`)
  }

  return (await response.json()) as QueryResponse
}
