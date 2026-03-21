<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { getKeywordSuggestions, type KeywordSuggestion } from '../../services/keywordResolver'
import type { SearchTag, ViewMode } from '../../types/search'

const props = defineProps<{
  keyword: string
  quickTags: SearchTag[]
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

const selectedSuggestionItems = computed<KeywordSuggestion[]>(() =>
  props.quickTags.map((tag) => ({
    key: tag.field as KeywordSuggestion['key'],
    value: tag.value,
    fieldLabel: tag.label,
  })),
)

const suggestionItems = ref<KeywordSuggestion[]>([])
const suggestionLoading = ref(false)
const suggestionHint = ref('输入已知标签后可直接选择建议项。')
const suggestionMenuOpen = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let currentController: AbortController | null = null

async function loadSuggestions(term: string): Promise<void> {
  currentController?.abort()

  if (!term.trim()) {
    suggestionItems.value = []
    suggestionHint.value = '输入制作方、发售展会或封面角色后，可直接从下拉建议中选择。'
    suggestionLoading.value = false
    suggestionMenuOpen.value = false
    return
  }

  currentController = new AbortController()
  suggestionLoading.value = true
  suggestionHint.value = '正在加载自动归类建议…'

  try {
    suggestionItems.value = await getKeywordSuggestions(term, currentController.signal)
    suggestionMenuOpen.value = suggestionItems.value.length > 0
    suggestionHint.value = suggestionItems.value.length > 0
      ? '建议项会显示它将归入的筛选字段。'
      : '没有找到建议项，你仍可直接输入后再应用。'
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      suggestionItems.value = []
      suggestionHint.value = '建议接口暂不可用，可继续直接输入。'
      suggestionMenuOpen.value = false
    }
  } finally {
    suggestionLoading.value = false
  }
}

watch(
  () => props.keyword,
  (term) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      void loadSuggestions(term)
    }, 250)
  },
  { immediate: true },
)

function handleKeywordInput(value: unknown): void {
  emit('updateKeyword', String(value ?? ''))
}

function handleSuggestionPick(item: KeywordSuggestion): void {
  suggestionMenuOpen.value = false
  emit('addQuickTag', {
    field: item.key,
    label: item.fieldLabel,
    value: item.value,
    filterable: true,
  })
  emit('updateKeyword', '')
}

function handleKeywordFocus(): void {
  if (props.keyword.trim() && suggestionItems.value.length > 0) {
    suggestionMenuOpen.value = true
  }
}

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  currentController?.abort()
})

const emit = defineEmits<{
  updateKeyword: [value: string]
  apply: []
  clear: []
  openFilters: []
  addQuickTag: [tag: SearchTag]
  removeQuickTag: [tag: SearchTag]
  updateViewMode: [mode: ViewMode]
}>()
</script>

<template>
  <v-card class="top-bar" variant="flat">
    <div class="top-main">
      <div class="top-search">
        <div class="intro-copy">
          <span class="eyebrow">THB Music Lookup</span>
          <h1>同人音乐专辑查询</h1>
          <p>本页面直接于<a href="https://thwiki.cc/%E5%90%8C%E4%BA%BA%E9%9F%B3%E4%B9%90%E4%B8%93%E8%BE%91%E6%9F%A5%E8%AF%A2" target="_blank" rel="noopener noreferrer">THBWiki的对应词条</a>中获取，并自动生成</p>
        </div>

        <v-menu
          v-model="suggestionMenuOpen"
          :close-on-content-click="false"
          :open-on-click="false"
          :open-on-focus="false"
          location="bottom"
          offset="10"
        >
          <template #activator="{ props: menuProps }">
            <v-text-field
              v-bind="menuProps"
              class="keyword-input"
              rounded="xl"
              :model-value="keyword"
              :hint="suggestionHint"
              persistent-hint
              label="快捷标签"
              placeholder="输入制作方、发售展会或封面角色，应用时会自动归入筛选"
              prepend-inner-icon="mdi-magnify"
              clearable
              @update:model-value="handleKeywordInput"
              @focus="handleKeywordFocus"
              @click:clear="emit('updateKeyword', '')"
              @keyup.enter="emit('apply')"
            >
              <template #append-inner>
                <div class="keyword-actions">
                  <v-progress-circular
                    v-if="suggestionLoading"
                    size="18"
                    width="2"
                    indeterminate
                    color="primary"
                  />
                  <v-btn
                    variant="text"
                    density="comfortable"
                    icon="mdi-chevron-down"
                    class="keyword-toggle"
                    @click.stop="suggestionMenuOpen = !suggestionMenuOpen"
                  />
                </div>
              </template>
            </v-text-field>
          </template>

          <v-card class="keyword-menu" rounded="xl" variant="flat">
            <div class="keyword-tip">
              <div class="keyword-tip-head">
                <div class="keyword-tip-title">自动归类建议</div>
                <span class="keyword-tip-badge">单次正式查询</span>
              </div>
              <div class="keyword-tip-text">下拉项会显示这个词会被归入哪个筛选字段，确认后再应用即可。</div>
            </div>

            <v-list class="keyword-list" density="comfortable">
              <v-list-item
                v-for="item in suggestionItems"
                :key="`${item.key}-${item.value}`"
                :title="item.value"
                :subtitle="item.fieldLabel"
                @click="handleSuggestionPick(item)"
              />
            </v-list>
          </v-card>
        </v-menu>

        <div v-if="selectedSuggestionItems.length > 0" class="quick-tags-row">
          <v-chip
            v-for="item in selectedSuggestionItems"
            :key="`${item.key}-${item.value}`"
            size="small"
            closable
            class="quick-tag-chip"
            @click:close="emit('removeQuickTag', { field: item.key, label: item.fieldLabel, value: item.value, filterable: true })"
          >
            {{ `${item.fieldLabel}：${item.value}` }}
          </v-chip>
        </div>
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
  background: linear-gradient(180deg, var(--surface-panel-strong), var(--surface-panel-soft));
  border: 1px solid var(--theme-border-soft);
  box-shadow: var(--shadow-elevated);
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

.keyword-input :deep(.v-field__append-inner) {
  align-self: center;
  padding-top: 0;
}

.quick-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.quick-tag-chip {
  max-width: min(240px, 32vw);
}

.quick-tag-chip :deep(.v-chip__content) {
  overflow: hidden;
  text-overflow: ellipsis;
}

.keyword-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.keyword-toggle {
  margin-inline-end: -6px;
}

.keyword-menu {
  width: min(720px, calc(100vw - 48px));
  border: 1px solid var(--theme-border-soft);
  box-shadow: 0 20px 40px rgba(56, 44, 34, 0.12);
  overflow: hidden;
}

.keyword-list {
  padding: 8px;
}

.keyword-tip {
  padding: 12px 16px 10px;
  border-bottom: 1px solid var(--theme-border-soft);
}

.keyword-tip-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.keyword-tip-title {
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--text-strong);
}

.keyword-tip-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--theme-fill-secondary);
  color: rgb(var(--v-theme-secondary));
  font-size: 0.76rem;
  white-space: nowrap;
}

.keyword-tip-text {
  margin-top: 4px;
  font-size: 0.82rem;
  color: var(--text-muted);
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
  color: var(--text-soft);
}

.intro-copy a {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
  text-decoration-color: rgba(var(--v-theme-primary), 0.32);
  text-underline-offset: 0.16em;
  transition:
    color 160ms ease,
    text-decoration-color 160ms ease;
}

.intro-copy a:visited {
  color: rgb(var(--v-theme-primary));
}

.intro-copy a:hover,
.intro-copy a:focus-visible {
  color: rgb(var(--v-theme-accent));
  text-decoration-color: rgba(var(--v-theme-accent), 0.6);
}

.intro-copy a[target='_blank']::after {
  content: '↗';
  display: inline-block;
  margin-left: 0.18em;
  font-size: 0.82em;
  line-height: 1;
  transform: translateY(-0.04em);
}

.eyebrow {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--theme-fill-secondary);
  color: rgb(var(--v-theme-secondary));
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
  border-top: 1px solid var(--theme-border-soft);
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
  color: var(--text-muted);
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
  background: var(--theme-fill-soft);
  color: rgb(var(--v-theme-primary));
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
