<script setup lang="ts">
import { computed } from 'vue'
import type { ViewMode } from '../../types/search'

const props = defineProps<{
  keyword: string
  viewMode: ViewMode
  summary: string[]
  totalCount: number
  canSearch: boolean
  hasPendingChanges: boolean
  isLoading: boolean
  isRefreshing: boolean
}>()

const statusBadgeText = computed(() => {
  if (props.hasPendingChanges) {
    return '有待应用的筛选变更'
  }

  if (props.isRefreshing) {
    return '正在按新条件查询'
  }

  return ''
})

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
          class="keyword-input"
          rounded="xl"
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
        <v-btn class="mobile-filters top-action-btn" variant="outlined" prepend-icon="mdi-tune-variant" @click="emit('openFilters')">
          筛选
        </v-btn>

        <v-btn-toggle
          class="view-toggle"
          mandatory
          divided
          :model-value="viewMode"
          @update:model-value="emit('updateViewMode', $event)"
        >
          <v-btn value="card" icon="mdi-view-grid-outline" aria-label="卡片布局" />
          <v-btn value="list" icon="mdi-format-list-bulleted" aria-label="列表布局" />
        </v-btn-toggle>

        <v-btn class="top-action-btn" color="primary" :loading="isLoading" :disabled="!canSearch" @click="emit('apply')">
          应用筛选
        </v-btn>
        <v-btn class="top-action-btn" variant="text" @click="emit('clear')">清空</v-btn>
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
        <div class="status-pill-slot">
          <span class="pending-pill" :class="{ 'pending-pill-hidden': !statusBadgeText }">{{ statusBadgeText || '占位状态文案' }}</span>
        </div>
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: start;
}

.top-search {
  display: grid;
  gap: 18px;
  flex: 1;
}

.keyword-input :deep(.v-field) {
  border-radius: var(--search-input-radius);
}

.keyword-input :deep(.v-field__outline) {
  --v-field-border-radius: var(--search-input-radius);
}

.keyword-input :deep(.v-field__input) {
  min-height: 56px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.top-action-btn,
.view-toggle {
  border-radius: var(--search-control-radius);
}

.top-action-btn :deep(.v-btn__overlay),
.top-action-btn :deep(.v-btn__underlay) {
  border-radius: inherit;
}

.view-toggle :deep(.v-btn) {
  border-radius: var(--search-control-radius);
}

.view-toggle :deep(.v-btn__overlay),
.view-toggle :deep(.v-btn__underlay) {
  border-radius: inherit;
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
  align-content: start;
  gap: 12px;
  flex-wrap: nowrap;
  justify-content: end;
  min-height: 2.75rem;
}

.top-meta {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid rgba(130, 104, 76, 0.12);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
}

.summary-chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-content: start;
  min-height: 2rem;
}

.status-panel {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: end;
  flex-wrap: nowrap;
}

.meta-text {
  color: rgba(31, 45, 51, 0.6);
  font-size: 0.92rem;
}

.status-pill-slot {
  display: flex;
  justify-content: flex-end;
  min-width: 12.5rem;
  min-height: 2rem;
}

.pending-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(191, 125, 69, 0.16);
  color: #8e4b2a;
  font-size: 0.88rem;
  white-space: nowrap;
}

.pending-pill-hidden {
  visibility: hidden;
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

  .top-main {
    display: flex;
  }

  .top-meta {
    display: flex;
  }

  .top-actions,
  .status-panel {
    justify-content: start;
  }

  .top-actions {
    flex-wrap: wrap;
    min-height: 0;
  }

  .status-panel {
    flex-wrap: wrap;
  }

  .status-pill-slot {
    min-width: 0;
  }

  .mobile-filters {
    display: inline-flex;
  }
}
</style>
