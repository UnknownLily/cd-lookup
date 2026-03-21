import {
  LIST_FILTER_KEYS,
  RANGE_BOUNDS,
  isRangeAtDefault,
  hasActiveCriteria,
  type ApiCriteriaPayload,
  type ItemField,
  type QueryResponse,
  type RangeFilterKey,
  type SearchCriteriaDraft,
} from '../types/search'
import { LocalizedError, createMessage } from '../i18n'

const API_BASE = import.meta.env.DEV ? '/api/asktrack/v0' : 'https://thwiki.cc/rest/asktrack/v0'
const EXTRA_CRITERIA: ApiCriteriaPayload = {
  name: [],
  alname: null,
  circle: null,
  time: null,
  cover: null,
  year: null,
  event: null,
  coverchar: null,
  work: null,
  property: null,
  rate: null,
  region: null,
  state: null,
  style: null,
  ogmusic: null,
  ogmusicno: null,
  ogwork: null,
  ogworkno: null,
  original: null,
  noth: null,
  arrange: null,
  lyric: null,
  compose: null,
  vocal: null,
  script: null,
  dub: null,
  perform: null,
  official: null,
  shop: null,
}

function buildApiUrl(endpoint: string): string {
  if (import.meta.env.DEV) {
    return `${API_BASE}${endpoint}`
  }

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

  for (const key of LIST_FILTER_KEYS) {
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
    throw new LocalizedError(createMessage('errors.atLeastOneCriteria'))
  }

  const offset = options.offset ?? 0
  const limit = options.limit ?? 24
  const response = await fetch(buildApiUrl(`/query?limit=${limit}&offset=${offset}`), {
    method: 'POST',
    body: JSON.stringify(payload),
    signal: options.signal,
    headers: {
      Accept: 'application/json,text/plain,*/*',
      'Content-Type': 'text/plain;charset=UTF-8',
    },
  })

  if (!response.ok) {
    throw new LocalizedError(createMessage('errors.apiRequestFailed', { status: response.status }))
  }

  return (await response.json()) as QueryResponse
}
