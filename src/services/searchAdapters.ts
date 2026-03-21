import {
  ITEM_PROP_TYPE,
  isListFilterKey,
  getFieldLabel,
  type DataTypeId,
  type DataValueMap,
  type ItemField,
  type RawItem,
  type SearchDetailSection,
  type SearchResultLink,
  type SearchResultItem,
  type SearchTag,
} from '../types/search'
import { getCurrentIntlLocale as getIntlLocale, t as translate } from '../i18n'

const HIDDEN_FIELDS = new Set<ItemField | string>(['id', 'self', 'name', 'alname', 'time', 'cover'])
const PRIMARY_TAG_FIELDS: ItemField[] = ['arrange', 'vocal', 'lyric', 'ogmusic', 'ogwork', 'work', 'property', 'rate', 'region', 'event', 'coverchar']
const DETAIL_FIELD_ORDER: ItemField[] = [
  'circle',
  'arrange',
  'vocal',
  'lyric',
  'ogmusic',
  'ogwork',
  'compose',
  'perform',
  'script',
  'dub',
  'event',
  'coverchar',
  'work',
  'property',
  'rate',
  'region',
  'state',
  'style',
  'ogmusicno',
  'ogworkno',
  'original',
  'noth',
]

function formatValue(typeId: DataTypeId, value: DataValueMap[DataTypeId]): string {
  switch (typeId) {
    case '_wpg':
      return (value as DataValueMap['_wpg']).displaytitle || (value as DataValueMap['_wpg']).fulltext
    case '_txt':
      return value as DataValueMap['_txt']
    case '_num':
      return (value as DataValueMap['_num']).toString(10)
    case '_dat':
      return new Date(value as DataValueMap['_dat']).toLocaleDateString(getIntlLocale())
    case '_pri':
      return `${(value as DataValueMap['_pri']).value} ${(value as DataValueMap['_pri']).unit}`
    case '_dur': {
      const secondSource = value as DataValueMap['_dur']
      const minute = Math.floor(secondSource / 60)
      const second = Math.floor(secondSource % 60)
      return `${minute}:${second.toString().padStart(2, '0')}`
    }
    case '_lin':
      return (value as DataValueMap['_lin']).alter || (value as DataValueMap['_lin']).url
  }
}

function getValues(item: RawItem, field: ItemField): string[] {
  const rawValues = item[field]
  if (!rawValues || rawValues.length === 0) {
    return []
  }

  const typeId = ITEM_PROP_TYPE[field]
  return rawValues.map((value) => formatValue(typeId, value as never))
}

function buildTags(field: ItemField, values: string[]): SearchTag[] {
  return values.map((value) => ({
    field,
    label: getFieldLabel(field),
    value,
    filterable: isListFilterKey(field),
  }))
}

function buildDetailSections(item: RawItem): SearchDetailSection[] {
  return DETAIL_FIELD_ORDER.map((field) => ({
    key: field,
    label: getFieldLabel(field),
    tags: buildTags(field, getValues(item, field)),
  })).filter((section) => section.tags.length > 0)
}

function buildPrimaryTags(item: RawItem): SearchTag[] {
  return PRIMARY_TAG_FIELDS.flatMap((field) => buildTags(field, getValues(item, field))).slice(0, 12)
}

function buildLinks(item: RawItem): SearchResultLink[] {
  const links: SearchResultLink[] = []

  for (const field of ['official', 'shop'] as const) {
    const rawValues = item[field]
    if (!rawValues || rawValues.length === 0) {
      continue
    }

    for (const rawValue of rawValues) {
      links.push({
        key: `${field}-${rawValue.url}`,
        label: getFieldLabel(field),
        url: rawValue.url,
      })
    }
  }

  return links
}

export function adaptSearchResult(item: RawItem): SearchResultItem {
  const title = item.name?.[0] ?? (item.self.displaytitle || item.self.fulltext)
  const subtitle = getValues(item, 'circle').join(' / ') || translate('searchResult.subtitleFallback')
  const albumNames = getValues(item, 'alname').filter((value) => value !== title)
  const durationText = item.time?.[0] ? formatValue('_dur', item.time[0]) : null
  const coverUrl = item.cover?.[0]?.fullurl ?? null
  const meta = [
    item.year?.[0] ? translate('searchResult.metaYear', { value: item.year[0] }) : null,
    durationText ? translate('searchResult.metaDuration', { value: durationText }) : null,
    getValues(item, 'event')[0] ? translate('searchResult.metaEvent', { value: getValues(item, 'event')[0] }) : null,
  ].filter((value): value is string => Boolean(value))

  return {
    id: item.id,
    title,
    subtitle,
    albumNames,
    wikiUrl: item.self.fullurl,
    coverUrl,
    durationText,
    meta,
    primaryTags: buildPrimaryTags(item),
    detailSections: buildDetailSections(item).filter((section) => !HIDDEN_FIELDS.has(section.key)),
    links: buildLinks(item),
  }
}
