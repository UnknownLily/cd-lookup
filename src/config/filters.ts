import type { FilterKey, ListFilterKey, RangeFilterKey } from '../types/search'

export interface RangeFilterDefinition {
  key: RangeFilterKey
  label: string
  type: 'range'
  min: number
  max: number
  formatter?: (value: number) => string
}

export interface ListFilterDefinition {
  key: ListFilterKey
  label: string
  type: 'checklist' | 'taglist'
  items: string[]
  hint?: string
  suggestionSource?: string
}

export type FilterDefinition = RangeFilterDefinition | ListFilterDefinition

export interface FilterGroup {
  id: string
  title: string
  description: string
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
    title: '时间与时长',
    description: '成立年份、发行年份、时长',
    filters: [
      { key: 'establish', label: '成立年份', type: 'range', min: 2000, max: 2032 },
      { key: 'year', label: '发行年份', type: 'range', min: 2000, max: 2032 },
      { key: 'time', label: '时长', type: 'range', min: 0, max: 2100, formatter: formatDuration },
    ],
  },
  {
    id: 'publishing',
    title: '发售与制作',
    description: '发售展会、制作方、封面角色',
    filters: [
      { key: 'event', label: '发售展会', type: 'taglist', items: [], hint: '支持输入搜索并手动添加标签。', suggestionSource: '发售展会建议' },
      { key: 'circle', label: '制作方', type: 'taglist', items: [], hint: '可直接输入社团或制作方名称。', suggestionSource: '制作方建议' },
      {
        key: 'coverchar',
        label: '封面角色',
        type: 'taglist',
        items: ['博丽灵梦', '雾雨魔理沙'],
        hint: '示例标签来自 demo，可继续手动输入。',
        suggestionSource: '封面角色建议',
      },
    ],
  },
  {
    id: 'taxonomy',
    title: '分类属性',
    description: '地区、作品类型、社团状态、属性、分级',
    filters: [
      { key: 'region', label: '地区', type: 'checklist', items: ['日本', '中国', '台湾', '香港', '韩国', '美国', '英国', '德国', '加拿大'] },
      { key: 'work', label: '作品类型', type: 'checklist', items: ['同人音乐', '同人游戏', '同人志', '同人动画', '周边', '其他'] },
      { key: 'state', label: '社团状态', type: 'checklist', items: ['活动', '休止', '解散'] },
      { key: 'property', label: '属性', type: 'checklist', items: ['单曲', 'Demo', '合作', '精选集', 'B面', '盒装', 'Live', '混音集', '原声集', '印象集'] },
      { key: 'rate', label: '分级', type: 'checklist', items: ['R18', 'R15', '一般向'] },
      { key: 'only', label: '仅限条件', type: 'taglist', items: [], hint: '预留字段，支持以后扩展。' },
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
