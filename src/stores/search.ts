import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type { LocationQuery } from 'vue-router'
import { fetchSearchPage } from '../services/searchApi'
import { adaptSearchResult } from '../services/searchAdapters'
import { resolveKeywordCriteria } from '../services/keywordResolver'
import { buildSearchRouteQuery, parseSearchRouteQuery } from '../services/searchRoute'
import {
  FIELD_LABELS,
  cloneCriteria,
  createDefaultCriteria,
  hasActiveCriteria,
  isListFilterKey,
  normalizeTextList,
  summarizeCriteria,
  type ListFilterKey,
  type RangeFilterKey,
  type SearchCriteriaDraft,
  type SearchResultItem,
  type SearchStatus,
  type SearchTag,
  type ViewMode,
} from '../types/search'

const PAGE_SIZE = 24
const QUICK_TAG_KEYS: ListFilterKey[] = ['circle', 'event', 'coverchar']

function normalizeError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return '查询已取消'
  }

  if (error instanceof Error) {
    return error.message
  }

  return '请求失败，请稍后重试。'
}

export const useSearchStore = defineStore('search', () => {
  const draftCriteria = ref<SearchCriteriaDraft>(createDefaultCriteria())
  const appliedCriteria = ref<SearchCriteriaDraft>(createDefaultCriteria())
  const viewMode = ref<ViewMode>('card')
  const results = ref<SearchResultItem[]>([])
  const status = ref<SearchStatus>('idle')
  const totalCount = ref(0)
  const nextOffset = ref(0)
  const more = ref(false)
  const errorMessage = ref<string | null>(null)
  const noticeMessage = ref<string | null>(null)
  const activeRequestId = ref(0)
  const hasBootstrapped = ref(false)
  const activeController = shallowRef<AbortController | null>(null)
  const effectiveCriteria = ref<SearchCriteriaDraft>(createDefaultCriteria())

  const canSearch = computed(() => hasActiveCriteria(draftCriteria.value))
  const hasPendingChanges = computed(
    () => JSON.stringify(buildSearchRouteQuery(draftCriteria.value, viewMode.value)) !== JSON.stringify(buildSearchRouteQuery(appliedCriteria.value, viewMode.value)),
  )
  const isInitialLoading = computed(() => status.value === 'loading' && results.value.length === 0)
  const isRefreshing = computed(() => status.value === 'loading' && results.value.length > 0)
  const isLoadingMore = computed(() => status.value === 'loadingMore')
  const routeQuery = computed(() => buildSearchRouteQuery(appliedCriteria.value, viewMode.value))
  const appliedSummary = computed(() => summarizeCriteria(appliedCriteria.value))
  const quickTags = computed<SearchTag[]>(() =>
    QUICK_TAG_KEYS.flatMap((key) =>
      draftCriteria.value[key].map((value) => ({
        field: key,
        label: FIELD_LABELS[key] ?? key,
        value,
        filterable: true,
      })),
    ),
  )

  function resetResults(): void {
    status.value = 'idle'
    totalCount.value = 0
    nextOffset.value = 0
    more.value = false
    results.value = []
    errorMessage.value = null
    noticeMessage.value = null
    effectiveCriteria.value = createDefaultCriteria()
  }

  function cancelActiveRequest(): void {
    activeController.value?.abort()
    activeController.value = null
  }

  function updateKeyword(value: string): void {
    draftCriteria.value.keyword = value
  }

  function updateRangeFilter(key: RangeFilterKey, value: [number, number]): void {
    draftCriteria.value[key] = [...value] as [number, number]
  }

  function updateListFilter(key: ListFilterKey, value: string[]): void {
    draftCriteria.value[key] = normalizeTextList(value)
  }

  function setViewMode(mode: ViewMode): void {
    viewMode.value = mode
  }

  function addTagToDraft(field: string, value: string, replace = false): boolean {
    if (!isListFilterKey(field)) {
      return false
    }

    draftCriteria.value[field] = replace
      ? [value]
      : normalizeTextList([...draftCriteria.value[field], value])

    return true
  }

  function removeTagFromDraft(field: string, value: string): boolean {
    if (!isListFilterKey(field)) {
      return false
    }

    draftCriteria.value[field] = draftCriteria.value[field].filter((item) => item !== value)
    return true
  }

  async function runSearch(criteria: SearchCriteriaDraft): Promise<void> {
    const requestId = activeRequestId.value + 1
    activeRequestId.value = requestId
    cancelActiveRequest()

    const controller = new AbortController()
    activeController.value = controller
    const hadResults = results.value.length > 0
    const submittedSignature = JSON.stringify(buildSearchRouteQuery(criteria, viewMode.value))

    status.value = 'loading'
    errorMessage.value = null
    noticeMessage.value = null
    nextOffset.value = 0
    more.value = false

    try {
      const resolution = await resolveKeywordCriteria(criteria, controller.signal)
      if (activeRequestId.value !== requestId) {
        return
      }

      effectiveCriteria.value = cloneCriteria(resolution.criteria)
      noticeMessage.value = resolution.noticeMessage

      const response = await fetchSearchPage(resolution.criteria, { limit: PAGE_SIZE, offset: 0, signal: controller.signal })
      if (activeRequestId.value !== requestId) {
        return
      }

      appliedCriteria.value = cloneCriteria(resolution.criteria)
      if (JSON.stringify(buildSearchRouteQuery(draftCriteria.value, viewMode.value)) === submittedSignature) {
        draftCriteria.value = cloneCriteria(resolution.criteria)
      }

      const adapted = response.results.map(adaptSearchResult)
      results.value = adapted
      totalCount.value = response.count
      nextOffset.value = adapted.length
      more.value = response.more
      status.value = adapted.length > 0 ? 'success' : 'empty'
      errorMessage.value = null
    } catch (error) {
      if (activeRequestId.value !== requestId) {
        return
      }

      const message = normalizeError(error)
      if (hadResults) {
        status.value = 'success'
        errorMessage.value = `新查询失败，当前仍显示上一次成功结果。${message}`
      } else if (message === '查询已取消') {
        status.value = 'idle'
        errorMessage.value = null
      } else {
        status.value = 'error'
        results.value = []
        totalCount.value = 0
        errorMessage.value = message
        noticeMessage.value = null
      }
    } finally {
      if (activeRequestId.value === requestId) {
        activeController.value = null
      }
    }
  }

  async function loadMore(): Promise<void> {
    if (!more.value || status.value === 'loadingMore' || status.value === 'loading' || !hasActiveCriteria(effectiveCriteria.value)) {
      return
    }

    const requestId = activeRequestId.value + 1
    activeRequestId.value = requestId
    cancelActiveRequest()

    const controller = new AbortController()
    activeController.value = controller
    status.value = 'loadingMore'
    errorMessage.value = null

    try {
      const response = await fetchSearchPage(effectiveCriteria.value, {
        limit: PAGE_SIZE,
        offset: nextOffset.value,
        signal: controller.signal,
      })
      if (activeRequestId.value !== requestId) {
        return
      }

      results.value = [...results.value, ...response.results.map(adaptSearchResult)]
      totalCount.value = response.count
      nextOffset.value += response.results.length
      more.value = response.more
      status.value = results.value.length > 0 ? 'success' : 'empty'
    } catch (error) {
      if (activeRequestId.value !== requestId) {
        return
      }

      const message = normalizeError(error)
      status.value = results.value.length > 0 ? 'success' : 'error'
      errorMessage.value = message === '查询已取消' ? null : `加载更多失败。${message}`
    } finally {
      if (activeRequestId.value === requestId) {
        activeController.value = null
      }
    }
  }

  async function applyDraft(): Promise<void> {
    appliedCriteria.value = cloneCriteria(draftCriteria.value)

    if (!hasActiveCriteria(appliedCriteria.value)) {
      cancelActiveRequest()
      resetResults()
      return
    }

    await runSearch(appliedCriteria.value)
  }

  async function clearAll(): Promise<void> {
    cancelActiveRequest()
    draftCriteria.value = createDefaultCriteria()
    appliedCriteria.value = createDefaultCriteria()
    resetResults()
  }

  async function initializeFromRoute(query: LocationQuery): Promise<void> {
    const parsed = parseSearchRouteQuery(query)
    draftCriteria.value = cloneCriteria(parsed.criteria)
    appliedCriteria.value = cloneCriteria(parsed.criteria)
    viewMode.value = parsed.viewMode
    hasBootstrapped.value = true

    if (hasActiveCriteria(parsed.criteria)) {
      await runSearch(parsed.criteria)
      return
    }

    resetResults()
  }

  return {
    draftCriteria,
    appliedCriteria,
    viewMode,
    results,
    status,
    totalCount,
    more,
    errorMessage,
    noticeMessage,
    hasBootstrapped,
    canSearch,
    hasPendingChanges,
    isInitialLoading,
    isRefreshing,
    isLoadingMore,
    routeQuery,
    appliedSummary,
    quickTags,
    updateKeyword,
    updateRangeFilter,
    updateListFilter,
    setViewMode,
    addTagToDraft,
    removeTagFromDraft,
    loadMore,
    applyDraft,
    clearAll,
    initializeFromRoute,
  }
})
