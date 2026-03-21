import type { SearchResultItem, SearchStatus } from '../types/search'

const SITE_NAME = '同人音乐专辑查询'
const SITE_ALT_NAME = 'THB Music Lookup'
const DEFAULT_DESCRIPTION = '基于 THBWiki 数据的东方同人音乐专辑检索工具，支持按制作方、发售展会、发行年份、原曲、编曲、演唱等条件筛选。'
const DEFAULT_KEYWORDS = '东方Project,THBWiki,同人音乐,专辑查询,东方同人音乐,专辑筛选'
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://cd.lilywhite.cc').replace(/\/+$/, '')
const OG_IMAGE_PATH = '/og-image.svg'
const OG_IMAGE_WIDTH = '1200'
const OG_IMAGE_HEIGHT = '630'
const OG_IMAGE_ALT = '同人音乐专辑查询分享图'

export interface SearchPageSeoInput {
  hasActiveSearch: boolean
  summary: string[]
  totalCount: number
  status: SearchStatus
  results: SearchResultItem[]
}

function toPageUrl(pathWithSearch: string): string {
  if (!SITE_URL) {
    return pathWithSearch
  }

  return new URL(pathWithSearch, `${SITE_URL}/`).toString()
}

function getCanonicalUrl(): string {
  return toPageUrl('/')
}

function getOgImageUrl(): string {
  return toPageUrl(OG_IMAGE_PATH)
}

function getCurrentUrl(input: SearchPageSeoInput): string {
  if (typeof window === 'undefined') {
    return input.hasActiveSearch ? toPageUrl('/') : getCanonicalUrl()
  }

  const url = new URL(window.location.href)
  url.hash = ''
  const pathWithSearch = `${url.pathname}${url.search}` || '/'
  return toPageUrl(pathWithSearch)
}

function buildTitle(input: SearchPageSeoInput): string {
  if (!input.hasActiveSearch) {
    return `${SITE_NAME} | 东方同人音乐筛选工具`
  }

  const summaryText = input.summary.slice(0, 2).join('，') || '筛选结果'

  if (input.status === 'error') {
    return `${summaryText} - 查询失败 | ${SITE_NAME}`
  }

  if (input.status === 'empty') {
    return `${summaryText} - 无匹配结果 | ${SITE_NAME}`
  }

  if (input.totalCount > 0) {
    return `${summaryText} - ${input.totalCount} 条结果 | ${SITE_NAME}`
  }

  return `${summaryText} - 查询中 | ${SITE_NAME}`
}

function buildDescription(input: SearchPageSeoInput): string {
  if (!input.hasActiveSearch) {
    return DEFAULT_DESCRIPTION
  }

  const summaryText = input.summary.slice(0, 4).join('；')
  const resultText = input.status === 'empty'
    ? '当前没有匹配专辑。'
    : input.totalCount > 0
      ? `当前共找到 ${input.totalCount} 张匹配专辑。`
      : input.status === 'error'
        ? '当前查询失败，请稍后重试。'
        : '正在根据已选条件查询专辑。'

  return `${summaryText ? `当前筛选：${summaryText}。` : ''}${resultText} 支持查看专辑信息、参与者字段与原曲标签。`
}

function buildStructuredData(input: SearchPageSeoInput, title: string, description: string, canonicalUrl: string, currentUrl: string): Array<Record<string, unknown>> {
  const website: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: SITE_ALT_NAME,
    url: canonicalUrl,
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'zh-CN',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${canonicalUrl}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  const webPage: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': input.hasActiveSearch ? 'SearchResultsPage' : 'WebPage',
    name: title,
    url: input.hasActiveSearch ? currentUrl : canonicalUrl,
    description,
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: canonicalUrl,
    },
  }

  if (input.results.length > 0) {
    webPage.mainEntity = {
      '@type': 'ItemList',
      itemListElement: input.results.slice(0, 10).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        url: item.wikiUrl,
      })),
    }
  }

  return [website, webPage]
}

export function createSearchPageHead(input: SearchPageSeoInput) {
  const canonicalUrl = getCanonicalUrl()
  const currentUrl = getCurrentUrl(input)
  const ogImageUrl = getOgImageUrl()
  const title = buildTitle(input)
  const description = buildDescription(input)
  const robots = input.hasActiveSearch
    ? 'noindex,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
    : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1'
  const structuredData = JSON.stringify(buildStructuredData(input, title, description, canonicalUrl, currentUrl))

  return {
    htmlAttrs: {
      lang: 'zh-CN',
    },
    title,
    link: [
      {
        key: 'canonical',
        rel: 'canonical',
        href: canonicalUrl,
      },
    ],
    meta: [
      {
        key: 'description',
        name: 'description',
        content: description,
      },
      {
        key: 'keywords',
        name: 'keywords',
        content: DEFAULT_KEYWORDS,
      },
      {
        key: 'robots',
        name: 'robots',
        content: robots,
      },
      {
        key: 'twitter:card',
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        key: 'twitter:title',
        name: 'twitter:title',
        content: title,
      },
      {
        key: 'twitter:description',
        name: 'twitter:description',
        content: description,
      },
      {
        key: 'twitter:image',
        name: 'twitter:image',
        content: ogImageUrl,
      },
      {
        key: 'twitter:image:alt',
        name: 'twitter:image:alt',
        content: OG_IMAGE_ALT,
      },
      {
        key: 'og:locale',
        property: 'og:locale',
        content: 'zh_CN',
      },
      {
        key: 'og:type',
        property: 'og:type',
        content: 'website',
      },
      {
        key: 'og:site_name',
        property: 'og:site_name',
        content: SITE_NAME,
      },
      {
        key: 'og:title',
        property: 'og:title',
        content: title,
      },
      {
        key: 'og:description',
        property: 'og:description',
        content: description,
      },
      {
        key: 'og:url',
        property: 'og:url',
        content: currentUrl,
      },
      {
        key: 'og:image',
        property: 'og:image',
        content: ogImageUrl,
      },
      {
        key: 'og:image:width',
        property: 'og:image:width',
        content: OG_IMAGE_WIDTH,
      },
      {
        key: 'og:image:height',
        property: 'og:image:height',
        content: OG_IMAGE_HEIGHT,
      },
      {
        key: 'og:image:alt',
        property: 'og:image:alt',
        content: OG_IMAGE_ALT,
      },
    ],
    script: [
      {
        key: 'search-page-structured-data',
        type: 'application/ld+json',
        innerHTML: structuredData,
      },
    ],
  }
}
