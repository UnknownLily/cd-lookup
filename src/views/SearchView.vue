<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchFiltersPanel from '../components/search/SearchFiltersPanel.vue'
import SearchResults from '../components/search/SearchResults.vue'
import SearchTopBar from '../components/search/SearchTopBar.vue'
import { routeQuerySignature } from '../services/searchRoute'
import { useSearchStore } from '../stores/search'
import type { SearchTag, ViewMode } from '../types/search'

const store = useSearchStore()
const route = useRoute()
const router = useRouter()
const mobileFiltersOpen = ref(false)

const statusBanner = computed(() => {
  if (store.isRefreshing) {
    return {
      type: 'info' as const,
      text: '正在按新条件查询，当前仍显示上一批成功结果。后端响应较慢，请稍候。',
    }
  }

  if (store.errorMessage) {
    return {
      type: 'warning' as const,
      text: store.errorMessage,
    }
  }

  return null
})

async function syncUrl(): Promise<void> {
  await router.replace({ query: store.routeQuery })
}

async function applyFilters(): Promise<void> {
  await store.applyDraft()
  mobileFiltersOpen.value = false
  await syncUrl()
}

async function clearFilters(): Promise<void> {
  await store.clearAll()
  mobileFiltersOpen.value = false
  await syncUrl()
}

async function updateViewMode(mode: ViewMode): Promise<void> {
  store.setViewMode(mode)
  await syncUrl()
}

function handleTagAdd(tag: SearchTag): void {
  store.addTagToDraft(tag.field, tag.value, false)
}

function handleTagSet(tag: SearchTag): void {
  store.addTagToDraft(tag.field, tag.value, true)
}

function handleRangeUpdate(key: Parameters<typeof store.updateRangeFilter>[0], value: Parameters<typeof store.updateRangeFilter>[1]): void {
  store.updateRangeFilter(key, value)
}

function handleListUpdate(key: Parameters<typeof store.updateListFilter>[0], value: Parameters<typeof store.updateListFilter>[1]): void {
  store.updateListFilter(key, value)
}

onMounted(async () => {
  if (!store.hasBootstrapped) {
    await store.initializeFromRoute(route.query)
  }
})

watch(
  () => route.query,
  async (query) => {
    if (!store.hasBootstrapped) {
      return
    }

    if (routeQuerySignature(query) !== routeQuerySignature(store.routeQuery)) {
      await store.initializeFromRoute(query)
    }
  },
  { deep: true },
)
</script>

<template>
  <v-app>
    <v-main class="page-main">
      <div class="page-shell">
        <SearchTopBar
          :keyword="store.draftCriteria.keyword"
          :view-mode="store.viewMode"
          :summary="store.appliedSummary"
          :total-count="store.totalCount"
          :can-search="store.canSearch"
          :has-pending-changes="store.hasPendingChanges"
          :is-loading="store.status === 'loading'"
          :is-refreshing="store.isRefreshing"
          @update-keyword="store.updateKeyword"
          @apply="applyFilters"
          @clear="clearFilters"
          @open-filters="mobileFiltersOpen = true"
          @update-view-mode="updateViewMode"
        />

        <v-alert
          v-if="statusBanner"
          :type="statusBanner.type"
          variant="tonal"
          rounded="xl"
          border="start"
          class="status-banner"
        >
          {{ statusBanner.text }}
        </v-alert>

        <div class="page-layout">
          <aside class="sidebar desktop-only">
            <SearchFiltersPanel
              :draft-criteria="store.draftCriteria"
              @update-range="handleRangeUpdate"
              @update-list="handleListUpdate"
            />
          </aside>

          <section class="content-column">
            <SearchResults
              :results="store.results"
              :view-mode="store.viewMode"
              :status="store.status"
              :total-count="store.totalCount"
              :more="store.more"
              :is-loading-more="store.isLoadingMore"
              :is-initial-loading="store.isInitialLoading"
              @load-more="store.loadMore"
              @add-tag="handleTagAdd"
              @set-tag="handleTagSet"
            />
          </section>
        </div>
      </div>

      <v-navigation-drawer v-model="mobileFiltersOpen" temporary location="left" width="360" class="mobile-only">
        <div class="drawer-inner">
          <SearchFiltersPanel
            :draft-criteria="store.draftCriteria"
            @update-range="handleRangeUpdate"
            @update-list="handleListUpdate"
          />
          <div class="drawer-actions">
            <v-btn variant="text" @click="mobileFiltersOpen = false">关闭</v-btn>
            <v-btn color="primary" :loading="store.status === 'loading'" @click="applyFilters">应用筛选</v-btn>
          </div>
        </div>
      </v-navigation-drawer>
    </v-main>
  </v-app>
</template>

<style scoped>
.page-main {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(212, 169, 117, 0.1), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
}

.page-shell {
  max-width: 1480px;
  margin: 0 auto;
  padding: 28px;
  display: grid;
  gap: 20px;
}

.status-banner {
  backdrop-filter: blur(8px);
}

.page-layout {
  display: grid;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.sidebar {
  position: sticky;
  top: 24px;
}

.content-column {
  min-width: 0;
}

.drawer-inner {
  display: grid;
  grid-template-rows: 1fr auto;
  height: 100%;
  gap: 16px;
  padding: 18px 14px 22px;
}

.drawer-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.mobile-only {
  display: none;
}

@media (max-width: 960px) {
  .page-shell {
    padding: 18px;
  }

  .page-layout {
    grid-template-columns: 1fr;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }
}
</style>
