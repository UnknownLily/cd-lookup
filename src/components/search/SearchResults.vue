<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SearchCard from './SearchCard.vue'
import SearchListItem from './SearchListItem.vue'
import type { SearchResultItem, SearchStatus, SearchTag, ViewMode } from '../../types/search'

const props = defineProps<{
  results: SearchResultItem[]
  viewMode: ViewMode
  status: SearchStatus
  totalCount: number
  more: boolean
  isLoadingMore: boolean
  isInitialLoading: boolean
}>()

const emit = defineEmits<{
  loadMore: []
  addTag: [tag: SearchTag]
  setTag: [tag: SearchTag]
  updateViewMode: [mode: ViewMode]
}>()

const sentinel = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

function setupObserver(): void {
  observer?.disconnect()
  if (!sentinel.value) {
    return
  }

  observer = new IntersectionObserver((entries) => {
    const first = entries[0]
    if (first?.isIntersecting && props.more && !props.isLoadingMore && props.status !== 'loading') {
      emit('loadMore')
    }
  })

  observer.observe(sentinel.value)
}

onMounted(async () => {
  await nextTick()
  setupObserver()
})

watch([() => props.more, () => props.isLoadingMore, () => props.viewMode, sentinel], async () => {
  await nextTick()
  setupObserver()
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <section class="results-panel">
    <header class="results-head">
      <div class="results-title-block">
        <h2>结果展示</h2>
        <p>默认卡片布局，支持切换到高密度列表布局。</p>
      </div>
      <div class="results-toolbar">
        <div class="results-count">{{ totalCount > 0 ? `已返回 ${results.length} / ${totalCount}` : '等待查询' }}</div>
        <div class="view-switcher">
          <span class="view-switcher-label">布局</span>
          <v-btn-toggle
            class="view-toggle"
            mandatory
            divided
            :model-value="viewMode"
            @update:model-value="emit('updateViewMode', $event)"
          >
            <v-btn value="card" icon="$viewCard" aria-label="卡片布局" />
            <v-btn value="list" icon="$viewList" aria-label="列表布局" />
          </v-btn-toggle>
        </div>
      </div>
    </header>

    <div v-if="status === 'idle'" class="results-empty">
      <v-icon icon="$searchScan" size="40" />
      <h3>先设定筛选条件再开始查询</h3>
      <p>由于后端响应较慢，建议先用年份、制作方、作品类型等条件缩小范围，再点击应用。</p>
    </div>

    <div v-else-if="status === 'error' && results.length === 0" class="results-empty">
      <v-icon icon="$alertCircleOutline" size="40" />
      <h3>请求失败</h3>
      <p>后端接口当前没有返回可用结果，请稍后重试或收窄筛选范围。</p>
    </div>

    <div v-else-if="status === 'empty'" class="results-empty">
      <v-icon icon="$fileSearchOutline" size="40" />
      <h3>没有匹配结果</h3>
      <p>可以尝试放宽年份范围、减少标签限制，或切换到不同的关键词组合。</p>
    </div>

    <template v-else>
      <div v-if="isInitialLoading && viewMode === 'card'" class="results-grid">
        <div v-for="index in 8" :key="`card-skeleton-${index}`" class="card-skeleton">
          <div class="skeleton-cover" />
          <div class="skeleton-body">
            <div class="skeleton-line skeleton-line-title" />
            <div class="skeleton-line" />
            <div class="skeleton-line skeleton-line-short" />
            <div class="skeleton-line skeleton-line-medium" />
            <div class="skeleton-actions">
              <div class="skeleton-pill" />
              <div class="skeleton-pill" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="isInitialLoading" class="results-list">
        <div v-for="index in 8" :key="`list-skeleton-${index}`" class="list-skeleton">
          <div class="list-skeleton-cover" />
          <div class="list-skeleton-body">
            <div class="skeleton-line skeleton-line-title" />
            <div class="skeleton-line" />
            <div class="skeleton-line skeleton-line-medium" />
            <div class="skeleton-line skeleton-line-short" />
            <div class="skeleton-tags">
              <div class="skeleton-pill" />
              <div class="skeleton-pill" />
              <div class="skeleton-pill skeleton-pill-short" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="viewMode === 'card'" class="results-grid">
        <SearchCard
          v-for="item in results"
          :key="item.id"
          :item="item"
          @add-tag="emit('addTag', $event)"
          @set-tag="emit('setTag', $event)"
        />
      </div>

      <div v-else class="results-list">
        <SearchListItem
          v-for="item in results"
          :key="item.id"
          :item="item"
          @add-tag="emit('addTag', $event)"
          @set-tag="emit('setTag', $event)"
        />
      </div>

      <div ref="sentinel" class="sentinel" aria-hidden="true" />

      <div v-if="isLoadingMore" class="load-more-state">
        <v-progress-circular color="primary" indeterminate />
        <span>正在加载更多结果…</span>
      </div>
    </template>
  </section>
</template>

<style scoped>
.results-panel {
  display: grid;
  gap: 18px;
}

.results-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
}

.results-title-block {
  min-width: 0;
}

.results-head h2 {
  margin: 0;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 1.45rem;
}

.results-head p {
  margin: 8px 0 0;
  color: rgba(31, 45, 51, 0.62);
}

.results-count {
  color: rgba(31, 45, 51, 0.58);
  font-size: 0.95rem;
}

.results-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: end;
}

.view-switcher {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(var(--v-theme-primary), 0.14);
  background: rgba(255, 250, 244, 0.88);
  box-shadow: 0 10px 24px rgba(92, 52, 68, 0.08);
}

.view-switcher-label {
  color: rgba(31, 45, 51, 0.62);
  font-size: 0.9rem;
  letter-spacing: 0.04em;
}

.view-toggle {
  flex-shrink: 0;
}

.view-toggle :deep(.v-btn) {
  min-width: 44px;
  color: rgba(31, 45, 51, 0.62);
  transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.view-toggle :deep(.v-btn:hover) {
  color: rgba(31, 45, 51, 0.82);
}

.view-toggle :deep(.v-btn--active) {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-primary), 0.18), 0 8px 20px rgba(92, 52, 68, 0.12);
}

.view-toggle :deep(.v-btn--active:hover) {
  color: rgb(var(--v-theme-primary));
}

.view-toggle :deep(.v-btn--active .v-icon) {
  transform: scale(1.05);
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}

.results-list {
  display: grid;
  gap: 14px;
}

.results-empty {
  min-height: 320px;
  display: grid;
  place-items: center;
  gap: 12px;
  text-align: center;
  border: 1px dashed var(--theme-border-strong);
  background: rgba(255, 246, 249, 0.72);
  border-radius: 28px;
  padding: 32px;
  color: var(--text-soft);
}

.results-empty h3 {
  margin: 0;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
}

.results-empty p {
  max-width: 560px;
  margin: 0;
}

.card-skeleton,
.list-skeleton {
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid var(--theme-border-soft);
  background: var(--surface-panel-muted);
  box-shadow: var(--shadow-soft);
}

.card-skeleton {
  display: grid;
}

.list-skeleton {
  display: grid;
  grid-template-columns: 188px minmax(0, 1fr);
}

.skeleton-cover,
.list-skeleton-cover,
.skeleton-line,
.skeleton-pill {
  background: linear-gradient(90deg, rgba(219, 213, 205, 0.62), rgba(244, 240, 235, 0.95), rgba(219, 213, 205, 0.62));
  background-size: 240% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-cover {
  height: 196px;
}

.list-skeleton-cover {
  min-height: 160px;
}

.skeleton-body,
.list-skeleton-body {
  display: grid;
  gap: 12px;
  padding: 20px;
}

.skeleton-line {
  height: 14px;
  border-radius: 999px;
}

.skeleton-line-title {
  height: 28px;
  width: 92%;
}

.skeleton-line-short {
  width: 52%;
}

.skeleton-line-medium {
  width: 78%;
}

.skeleton-actions,
.skeleton-tags {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.skeleton-actions {
  justify-content: end;
}

.skeleton-pill {
  width: 84px;
  height: 40px;
  border-radius: 14px;
}

.skeleton-pill-short {
  width: 64px;
}

.sentinel {
  height: 1px;
}

.load-more-state {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  color: rgba(31, 45, 51, 0.66);
  padding: 12px 0 24px;
}

@media (max-width: 720px) {
  .results-head {
    flex-direction: column;
    align-items: start;
  }

  .results-toolbar {
    width: 100%;
    justify-content: space-between;
  }

  .view-switcher {
    padding-left: 12px;
  }

  .list-skeleton {
    grid-template-columns: 1fr;
  }

  .list-skeleton-cover {
    min-height: 180px;
  }
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}
</style>
