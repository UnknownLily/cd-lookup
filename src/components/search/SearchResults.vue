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
  }, { rootMargin: '400px 0px 400px 0px' })

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
      <div>
        <h2>结果展示</h2>
        <p>默认卡片布局，支持切换到高密度列表布局。</p>
      </div>
      <div class="results-count">{{ totalCount > 0 ? `已返回 ${results.length} / ${totalCount}` : '等待查询' }}</div>
    </header>

    <div v-if="status === 'idle'" class="results-empty">
      <v-icon icon="mdi-magnify-scan" size="40" />
      <h3>先设定筛选条件再开始查询</h3>
      <p>由于后端响应较慢，建议先用年份、制作方、作品类型等条件缩小范围，再点击应用。</p>
    </div>

    <div v-else-if="status === 'error' && results.length === 0" class="results-empty">
      <v-icon icon="mdi-alert-circle-outline" size="40" />
      <h3>请求失败</h3>
      <p>后端接口当前没有返回可用结果，请稍后重试或收窄筛选范围。</p>
    </div>

    <div v-else-if="status === 'empty'" class="results-empty">
      <v-icon icon="mdi-file-search-outline" size="40" />
      <h3>没有匹配结果</h3>
      <p>可以尝试放宽年份范围、减少标签限制，或切换到不同的关键词组合。</p>
    </div>

    <template v-else>
      <div v-if="isInitialLoading" :class="viewMode === 'card' ? 'results-grid' : 'results-list'">
        <v-skeleton-loader
          v-for="index in 8"
          :key="index"
          :type="viewMode === 'card' ? 'image, article, actions' : 'list-item-three-line, image'"
          class="skeleton-item"
        />
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
  border: 1px dashed rgba(130, 104, 76, 0.26);
  background: rgba(255, 250, 244, 0.65);
  border-radius: 28px;
  padding: 32px;
  color: rgba(31, 45, 51, 0.72);
}

.results-empty h3 {
  margin: 0;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
}

.results-empty p {
  max-width: 560px;
  margin: 0;
}

.skeleton-item {
  border-radius: 28px;
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
}
</style>
