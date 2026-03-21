export type ViewMode = 'card' | 'list'

import { t } from '../i18n'

export const RANGE_FILTER_KEYS = ['establish', 'year', 'time', 'ogmusicno', 'ogworkno'] as const
export const LIST_FILTER_KEYS = [
  'event',
  'circle',
  'coverchar',
  'region',
  'work',
  'state',
  'property',
  'rate',
  'only',
  'style',
  'ogmusic',
  'ogwork',
  'noth',
  'original',
  'arrange',
  'lyric',
  'compose',
  'vocal',
  'script',
  'dub',
  'perform',
] as const

export type RangeFilterKey = (typeof RANGE_FILTER_KEYS)[number]
export type ListFilterKey = (typeof LIST_FILTER_KEYS)[number]
export type FilterKey = RangeFilterKey | ListFilterKey

export interface SearchCriteriaDraft {
  keyword: string
  establish: [number, number]
  year: [number, number]
  time: [number, number]
  ogmusicno: [number, number]
  ogworkno: [number, number]
  event: string[]
  circle: string[]
  coverchar: string[]
  region: string[]
  work: string[]
  state: string[]
  property: string[]
  rate: string[]
  only: string[]
  style: string[]
  ogmusic: string[]
  ogwork: string[]
  noth: string[]
  original: string[]
  arrange: string[]
  lyric: string[]
  compose: string[]
  vocal: string[]
  script: string[]
  dub: string[]
  perform: string[]
}

export interface SearchTag {
  field: string
  label: string
  value: string
  filterable: boolean
}

export interface SearchDetailSection {
  key: string
  label: string
  tags: SearchTag[]
}

export interface SearchResultLink {
  key: string
  label: string
  url: string
}

export interface SearchResultItem {
  id: string
  title: string
  subtitle: string
  aliases: string[]
  wikiUrl: string
  coverUrl: string | null
  durationText: string | null
  meta: string[]
  primaryTags: SearchTag[]
  detailSections: SearchDetailSection[]
  links: SearchResultLink[]
}

export type SearchStatus = 'idle' | 'loading' | 'loadingMore' | 'success' | 'empty' | 'error'

export type DataTypeId = '_wpg' | '_txt' | '_num' | '_dat' | '_pri' | '_dur' | '_lin'

export interface WpgValue {
  fulltext: string
  fullurl: string
  namespace: number
  exists: boolean
  displaytitle: string
}

export interface PriValue {
  value: number
  unit: string
}

export interface LinValue {
  url: string
  alter: string
}

export interface DataValueMap {
  _wpg: WpgValue
  _txt: string
  _num: number
  _dat: number
  _pri: PriValue
  _dur: number
  _lin: LinValue
}

export const ITEM_PROP_TYPE = {
  self: '_wpg',
  circle: '_wpg',
  date: '_dat',
  time: '_dur',
  arrange: '_wpg',
  compose: '_wpg',
  lyric: '_wpg',
  script: '_wpg',
  dub: '_wpg',
  perform: '_wpg',
  vocal: '_wpg',
  name: '_txt',
  alname: '_txt',
  event: '_wpg',
  year: '_num',
  ogmusicno: '_num',
  ogworkno: '_num',
  rate: '_txt',
  property: '_txt',
  style: '_txt',
  only: '_txt',
  ogmusic: '_wpg',
  ogwork: '_wpg',
  noth: '_txt',
  original: '_txt',
  price: '_pri',
  eventprice: '_pri',
  shopprice: '_pri',
  cover: '_wpg',
  official: '_lin',
  shop: '_lin',
  coverchar: '_wpg',
  region: '_txt',
  establish: '_num',
  work: '_txt',
  state: '_txt',
} as const

export type ItemField = keyof typeof ITEM_PROP_TYPE

export type RawItem = {
  id: string
  self: WpgValue
} & {
  [K in ItemField]?: Array<DataValueMap[(typeof ITEM_PROP_TYPE)[K]]>
}

export interface QueryResponse {
  count: number
  hash: string
  more: boolean
  offset: number
  prints: string[]
  query: string
  results: RawItem[]
  serializer: string
  time: number
  version: number
}

export type ApiCriteriaPayload = Partial<Record<ItemField, string[] | null>>

export const RANGE_BOUNDS: Record<RangeFilterKey, { min: number; max: number }> = {
  establish: { min: 2000, max: 2032 },
  year: { min: 2000, max: 2032 },
  time: { min: 0, max: 2100 },
  ogmusicno: { min: 0, max: 30 },
  ogworkno: { min: 0, max: 20 },
}

const FIELD_LABEL_KEYS: Record<string, string> = {
  establish: 'fields.establish',
  year: 'fields.year',
  time: 'fields.time',
  ogmusicno: 'fields.ogmusicno',
  ogworkno: 'fields.ogworkno',
  event: 'fields.event',
  circle: 'fields.circle',
  coverchar: 'fields.coverchar',
  region: 'fields.region',
  work: 'fields.work',
  state: 'fields.state',
  property: 'fields.property',
  rate: 'fields.rate',
  only: 'fields.only',
  style: 'fields.style',
  ogmusic: 'fields.ogmusic',
  ogwork: 'fields.ogwork',
  noth: 'fields.noth',
  original: 'fields.original',
  arrange: 'fields.arrange',
  lyric: 'fields.lyric',
  compose: 'fields.compose',
  vocal: 'fields.vocal',
  script: 'fields.script',
  dub: 'fields.dub',
  perform: 'fields.perform',
  official: 'fields.official',
  shop: 'fields.shop',
  cover: 'fields.cover',
}

const FILTER_VALUE_LABEL_KEYS: Partial<Record<ListFilterKey, Record<string, string>>> = {
  region: {
    日本: 'filters.options.region.日本',
    中国: 'filters.options.region.中国',
    台湾: 'filters.options.region.台湾',
    香港: 'filters.options.region.香港',
    韩国: 'filters.options.region.韩国',
    美国: 'filters.options.region.美国',
    英国: 'filters.options.region.英国',
    德国: 'filters.options.region.德国',
    加拿大: 'filters.options.region.加拿大',
  },
  work: {
    同人音乐: 'filters.options.work.同人音乐',
    同人游戏: 'filters.options.work.同人游戏',
    同人志: 'filters.options.work.同人志',
    同人动画: 'filters.options.work.同人动画',
    周边: 'filters.options.work.周边',
    其他: 'filters.options.work.其他',
  },
  state: {
    活动: 'filters.options.state.活动',
    休止: 'filters.options.state.休止',
    解散: 'filters.options.state.解散',
  },
  property: {
    单曲: 'filters.options.property.单曲',
    Demo: 'filters.options.property.Demo',
    合作: 'filters.options.property.合作',
    精选集: 'filters.options.property.精选集',
    B面: 'filters.options.property.B面',
    盒装: 'filters.options.property.盒装',
    Live: 'filters.options.property.Live',
    混音集: 'filters.options.property.混音集',
    原声集: 'filters.options.property.原声集',
    印象集: 'filters.options.property.印象集',
  },
  rate: {
    R18: 'filters.options.rate.R18',
    R15: 'filters.options.rate.R15',
    一般向: 'filters.options.rate.一般向',
  },
  noth: {
    非东方: 'filters.options.noth.非东方',
  },
  original: {
    原创: 'filters.options.original.原创',
  },
}

export function getFieldLabel(field: string): string {
  const key = FIELD_LABEL_KEYS[field]
  return key ? t(key) : field
}

export function getFilterValueLabel(field: string, value: string): string {
  if (!isListFilterKey(field)) {
    return value
  }

  const key = FILTER_VALUE_LABEL_KEYS[field]?.[value]
  return key ? t(key) : value
}

export function createDefaultCriteria(): SearchCriteriaDraft {
  return {
    keyword: '',
    establish: [RANGE_BOUNDS.establish.min, RANGE_BOUNDS.establish.max],
    year: [RANGE_BOUNDS.year.min, RANGE_BOUNDS.year.max],
    time: [RANGE_BOUNDS.time.min, RANGE_BOUNDS.time.max],
    ogmusicno: [RANGE_BOUNDS.ogmusicno.min, RANGE_BOUNDS.ogmusicno.max],
    ogworkno: [RANGE_BOUNDS.ogworkno.min, RANGE_BOUNDS.ogworkno.max],
    event: [],
    circle: [],
    coverchar: [],
    region: [],
    work: [],
    state: [],
    property: [],
    rate: [],
    only: [],
    style: [],
    ogmusic: [],
    ogwork: [],
    noth: [],
    original: [],
    arrange: [],
    lyric: [],
    compose: [],
    vocal: [],
    script: [],
    dub: [],
    perform: [],
  }
}

export function cloneCriteria(criteria: SearchCriteriaDraft): SearchCriteriaDraft {
  return {
    keyword: criteria.keyword,
    establish: [...criteria.establish] as [number, number],
    year: [...criteria.year] as [number, number],
    time: [...criteria.time] as [number, number],
    ogmusicno: [...criteria.ogmusicno] as [number, number],
    ogworkno: [...criteria.ogworkno] as [number, number],
    event: [...criteria.event],
    circle: [...criteria.circle],
    coverchar: [...criteria.coverchar],
    region: [...criteria.region],
    work: [...criteria.work],
    state: [...criteria.state],
    property: [...criteria.property],
    rate: [...criteria.rate],
    only: [...criteria.only],
    style: [...criteria.style],
    ogmusic: [...criteria.ogmusic],
    ogwork: [...criteria.ogwork],
    noth: [...criteria.noth],
    original: [...criteria.original],
    arrange: [...criteria.arrange],
    lyric: [...criteria.lyric],
    compose: [...criteria.compose],
    vocal: [...criteria.vocal],
    script: [...criteria.script],
    dub: [...criteria.dub],
    perform: [...criteria.perform],
  }
}

export function isListFilterKey(field: string): field is ListFilterKey {
  return (LIST_FILTER_KEYS as readonly string[]).includes(field)
}

export function normalizeTextList(values: string[]): string[] {
  const seen = new Set<string>()

  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .filter((value) => {
      if (seen.has(value)) {
        return false
      }

      seen.add(value)
      return true
    })
}

export function isRangeAtDefault(key: RangeFilterKey, value: [number, number]): boolean {
  return value[0] === RANGE_BOUNDS[key].min && value[1] === RANGE_BOUNDS[key].max
}

export function hasActiveCriteria(criteria: SearchCriteriaDraft): boolean {
  if (criteria.keyword.trim().length > 0) {
    return true
  }

  if (!isRangeAtDefault('establish', criteria.establish)) {
    return true
  }

  if (!isRangeAtDefault('year', criteria.year)) {
    return true
  }

  if (!isRangeAtDefault('time', criteria.time)) {
    return true
  }

  if (!isRangeAtDefault('ogmusicno', criteria.ogmusicno)) {
    return true
  }

  if (!isRangeAtDefault('ogworkno', criteria.ogworkno)) {
    return true
  }

  return LIST_FILTER_KEYS.some((key) => criteria[key].length > 0)
}

export function summarizeCriteria(criteria: SearchCriteriaDraft): string[] {
  const summary: string[] = []

  if (criteria.keyword.trim()) {
    summary.push(t('summary.keyword', { value: criteria.keyword.trim() }))
  }

  for (const key of RANGE_FILTER_KEYS) {
    if (!isRangeAtDefault(key, criteria[key])) {
      const [start, end] = criteria[key]
      summary.push(t('summary.range', { label: getFieldLabel(key), start, end }))
    }
  }

  for (const key of LIST_FILTER_KEYS) {
    if (criteria[key].length > 0) {
      const values = criteria[key]
        .slice(0, 2)
        .map((value) => getFilterValueLabel(key, value))
        .join(t('summary.separator'))
      const suffix = criteria[key].length > 2 ? t('summary.listMoreSuffix') : ''
      summary.push(t('summary.list', { label: getFieldLabel(key), value: `${values}${suffix}` }))
    }
  }

  return summary
}
