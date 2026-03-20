<script setup lang="ts">
import type { ViewMode } from '../../types/search'

defineProps<{
  keyword: string
  viewMode: ViewMode
  summary: string[]
  totalCount: number
  canSearch: boolean
  hasPendingChanges: boolean
  isLoading: boolean
  isRefreshing: boolean
}>()

const emit = defineEmits<{
  updateKeyword: [value: string]
  apply: []
  clear: []
  openFilters: []
  updateViewMode: [mode: ViewMode]
}>()
</script>

<template>
  <v-card class="top-bar" variant="flat">
    <div class="top-main">
      <div class="top-search">
        <div class="intro-copy">
          <span class="eyebrow">THB Music Lookup</span>
          <h1>慢查询友好的音乐检索界面</h1>
          <p>默认保留上一批结果，等待新查询返回，避免因为后端缓慢而让页面看起来失去响应。</p>
        </div>

        <v-text-field
          :model-value="keyword"
          label="关键词"
          placeholder="输入标题、社团或你想找的线索"
          prepend-inner-icon="mdi-magnify"
          clearable
          @update:model-value="emit('updateKeyword', String($event ?? ''))"
          @keyup.enter="emit('apply')"
        />
      </div>

      <div class="top-actions">
        <v-btn class="mobile-filters" variant="outlined" prepend-icon="mdi-tune-variant" @click="emit('openFilters')">
          筛选
        </v-btn>

        <v-btn-toggle
          mandatory
          divided
          :model-value="viewMode"
          @update:model-value="emit('updateViewMode', $event)"
        >
          <v-btn value="card" icon="mdi-view-grid-outline" aria-label="卡片布局" />
          <v-btn value="list" icon="mdi-format-list-bulleted" aria-label="列表布局" />
        </v-btn-toggle>

        <v-btn color="primary" :loading="isLoading" :disabled="!canSearch" @click="emit('apply')">
          应用筛选
        </v-btn>
        <v-btn variant="text" @click="emit('clear')">清空</v-btn>
      </div>
    </div>

    <div class="top-meta">
      <div class="summary-chips">
        <v-chip v-for="item in summary.slice(0, 8)" :key="item" variant="tonal" color="secondary">
          {{ item }}
        </v-chip>
        <span v-if="summary.length === 0" class="meta-text">尚未应用筛选条件</span>
      </div>

      <div class="status-panel">
        <span class="meta-text">{{ totalCount > 0 ? `当前总结果数 ${totalCount}` : '应用条件后开始查询' }}</span>
        <span v-if="hasPendingChanges" class="pending-pill">有待应用的筛选变更</span>
        <span v-else-if="isRefreshing" class="pending-pill">正在按新条件查询</span>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.top-bar {
  background: linear-gradient(180deg, rgba(255, 250, 244, 0.96), rgba(250, 244, 236, 0.92));
  border: 1px solid rgba(130, 104, 76, 0.12);
  box-shadow: 0 24px 48px rgba(56, 44, 34, 0.08);
  padding: 24px;
}

.top-main {
  display: flex;
  gap: 24px;
  justify-content: space-between;
}

.top-search {
  display: grid;
  gap: 18px;
  flex: 1;
}

.intro-copy h1 {
  margin: 6px 0 8px;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  line-height: 1.15;
}

.intro-copy p {
  margin: 0;
  max-width: 720px;
  color: rgba(31, 45, 51, 0.68);
}

.eyebrow {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(70, 106, 116, 0.1);
  color: #466a74;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.top-actions {
  display: flex;
  align-items: start;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: end;
}

.top-meta {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(130, 104, 76, 0.12);
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
}

.summary-chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.status-panel {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: end;
  flex-wrap: wrap;
}

.meta-text {
  color: rgba(31, 45, 51, 0.6);
  font-size: 0.92rem;
}

.pending-pill {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(191, 125, 69, 0.16);
  color: #8e4b2a;
  font-size: 0.88rem;
}

.mobile-filters {
  display: none;
}

@media (max-width: 960px) {
  .top-bar {
    padding: 20px;
  }

  .top-main,
  .top-meta {
    flex-direction: column;
    align-items: stretch;
  }

  .top-actions,
  .status-panel {
    justify-content: start;
  }

  .mobile-filters {
    display: inline-flex;
  }
}
</style>
