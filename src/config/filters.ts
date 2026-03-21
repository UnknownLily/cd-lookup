import type { FilterKey, ListFilterKey, RangeFilterKey } from '../types/search'

export interface RangeFilterDefinition {
  key: RangeFilterKey
  type: 'range'
  min: number
  max: number
  formatter?: (value: number) => string
}

export interface ListFilterDefinition {
  key: ListFilterKey
  type: 'checklist' | 'taglist'
  items: string[]
  hintKey?: string
  suggestionSource?: string
}

export type FilterDefinition = RangeFilterDefinition | ListFilterDefinition

export interface FilterGroup {
  id: string
  titleKey: string
  descriptionKey: string
  filters: FilterDefinition[]
}

function formatDuration(value: number): string {
  const minute = Math.floor(value / 60)
  const second = Math.floor(value % 60)
  return `${minute}:${second.toString().padStart(2, '0')}`
}

export const FILTER_GROUPS: FilterGroup[] = [
  {
    id: 'timeline',
    titleKey: 'filters.groups.timeline.title',
    descriptionKey: 'filters.groups.timeline.description',
    filters: [
      { key: 'establish', type: 'range', min: 2000, max: 2032 },
      { key: 'year', type: 'range', min: 2000, max: 2032 },
      { key: 'time', type: 'range', min: 0, max: 2100, formatter: formatDuration },
    ],
  },
  {
    id: 'publishing',
    titleKey: 'filters.groups.publishing.title',
    descriptionKey: 'filters.groups.publishing.description',
    filters: [
      { key: 'event', type: 'taglist', items: [], hintKey: 'filters.hints.event', suggestionSource: '发售展会建议' },
      { key: 'circle', type: 'taglist', items: [], hintKey: 'filters.hints.circle', suggestionSource: '制作方建议' },
      {
        key: 'coverchar',
        type: 'taglist',
        items: ['博丽灵梦', '雾雨魔理沙'],
        hintKey: 'filters.hints.coverchar',
        suggestionSource: '封面角色建议',
      },
    ],
  },
  {
    id: 'taxonomy',
    titleKey: 'filters.groups.taxonomy.title',
    descriptionKey: 'filters.groups.taxonomy.description',
    filters: [
      { key: 'region', type: 'checklist', items: ['日本', '中国', '台湾', '香港', '韩国', '美国', '英国', '德国', '加拿大'] },
      { key: 'work', type: 'checklist', items: ['同人音乐', '同人游戏', '同人志', '同人动画', '周边', '其他'] },
      { key: 'state', type: 'checklist', items: ['活动', '休止', '解散'] },
      { key: 'property', type: 'checklist', items: ['单曲', 'Demo', '合作', '精选集', 'B面', '盒装', 'Live', '混音集', '原声集', '印象集'] },
      { key: 'rate', type: 'checklist', items: ['R18', 'R15', '一般向'] },
      { key: 'only', type: 'taglist', items: [], hintKey: 'filters.hints.only' },
    ],
  },
  {
    id: 'track-meta',
    titleKey: 'filters.groups.trackMeta.title',
    descriptionKey: 'filters.groups.trackMeta.description',
    filters: [
      { key: 'style', type: 'taglist', items: [], hintKey: 'filters.hints.style', suggestionSource: '风格类型建议' },
      { key: 'ogmusic', type: 'taglist', items: [], hintKey: 'filters.hints.ogmusic', suggestionSource: '曲目原曲建议' },
      { key: 'ogmusicno', type: 'range', min: 0, max: 30 },
      { key: 'ogwork', type: 'taglist', items: [], hintKey: 'filters.hints.ogwork', suggestionSource: '曲目来源建议' },
      { key: 'ogworkno', type: 'range', min: 0, max: 20 },
      { key: 'noth', type: 'checklist', items: ['非东方'] },
      { key: 'original', type: 'checklist', items: ['原创'] },
    ],
  },
  {
    id: 'track-credits',
    titleKey: 'filters.groups.trackCredits.title',
    descriptionKey: 'filters.groups.trackCredits.description',
    filters: [
      { key: 'arrange', type: 'taglist', items: [], hintKey: 'filters.hints.arrange', suggestionSource: '编曲建议' },
      { key: 'lyric', type: 'taglist', items: [], hintKey: 'filters.hints.lyric', suggestionSource: '作词建议' },
      { key: 'compose', type: 'taglist', items: [], hintKey: 'filters.hints.compose', suggestionSource: '作曲建议' },
      { key: 'vocal', type: 'taglist', items: [], hintKey: 'filters.hints.vocal', suggestionSource: '演唱建议' },
      { key: 'script', type: 'taglist', items: [], hintKey: 'filters.hints.script', suggestionSource: '剧本建议' },
      { key: 'dub', type: 'taglist', items: [], hintKey: 'filters.hints.dub', suggestionSource: '配音建议' },
      { key: 'perform', type: 'taglist', items: [], hintKey: 'filters.hints.perform' },
    ],
  },
]

export function isRangeFilter(filter: FilterDefinition): filter is RangeFilterDefinition {
  return filter.type === 'range'
}

export function isListFilter(filter: FilterDefinition): filter is ListFilterDefinition {
  return filter.type === 'checklist' || filter.type === 'taglist'
}

export function findFilterDefinition(key: FilterKey): FilterDefinition | undefined {
  for (const group of FILTER_GROUPS) {
    const filter = group.filters.find((item) => item.key === key)
    if (filter) {
      return filter
    }
  }

  return undefined
}
