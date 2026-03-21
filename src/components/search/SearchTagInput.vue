<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { getTagSuggestions } from '../../services/tagSuggestions'

const props = defineProps<{
  label: string
  hint?: string
  modelValue: string[]
  items: string[]
  suggestionSource?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const search = ref('')
const loading = ref(false)
const suggestions = ref<string[]>([])
const statusMessage = ref(props.hint ?? '')
const sourceBadge = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let currentController: AbortController | null = null

function normalize(values: unknown[]): string[] {
  const seen = new Set<string>()
  return values
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0)
    .filter((value) => {
      if (seen.has(value)) {
        return false
      }

      seen.add(value)
      return true
    })
}

const items = computed(() => normalize([...props.modelValue, ...suggestions.value]).slice(0, 50))

async function loadSuggestions(term: string): Promise<void> {
  currentController?.abort()
  currentController = new AbortController()

  loading.value = true
  statusMessage.value = term.trim()
    ? '正在搜索匹配标签…'
    : props.hint ?? '可直接输入，也可从建议列表中选择。'

  try {
    const result = await getTagSuggestions({
      term,
      staticItems: props.items,
      selected: props.modelValue,
      suggestionSource: props.suggestionSource,
      signal: currentController.signal,
    })

    suggestions.value = result.suggestions

    if (!term.trim()) {
      sourceBadge.value = result.remoteAvailable ? '可用远程建议' : '当前为本地候选'
    } else if (result.source === 'remote') {
      sourceBadge.value = '远程建议'
    } else if (result.source === 'mixed') {
      sourceBadge.value = '远程 + 本地匹配'
    } else {
      sourceBadge.value = result.remoteAvailable ? '本地匹配' : '本地回退'
    }

    if (term.trim() && suggestions.value.length === 0) {
      statusMessage.value = '没有匹配建议，你仍然可以直接输入并保留该标签。'
    } else if (!result.remoteAvailable && term.trim()) {
      statusMessage.value = result.errorMessage
        ? `远程建议不可用，当前仅显示本地匹配。${result.errorMessage}`
        : '远程建议不可用，当前仅显示本地匹配。'
    } else {
      statusMessage.value = props.hint ?? '支持远程建议与手动输入。'
    }
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      statusMessage.value = '建议接口暂不可用，已退回本地搜索。'
      sourceBadge.value = '本地回退'
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => search.value,
  (term) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      void loadSuggestions(term)
    }, 350)
  },
)

watch(
  () => props.items,
  () => {
    void loadSuggestions(search.value)
  },
  { deep: true },
)

function handleModelValue(value: unknown): void {
  if (!Array.isArray(value)) {
    emit('update:modelValue', [])
    return
  }

  emit('update:modelValue', normalize(value))
}

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  currentController?.abort()
})
</script>

<template>
  <v-combobox
    class="tag-input"
    rounded="xl"
    :label="label"
    :hint="statusMessage"
    persistent-hint
    :items="items"
    :model-value="modelValue"
    :loading="loading"
    :search="search"
    multiple
    clearable
    chips
    closable-chips
    hide-selected
    hide-no-data
    no-filter
    menu-icon="mdi-magnify"
    @update:search="search = String($event ?? '')"
    @update:model-value="handleModelValue"
  >
    <template #prepend-item>
      <div class="search-tip">
        <div class="search-tip-head">
          <div class="search-tip-title">高数量标签搜索</div>
          <span v-if="sourceBadge" class="source-badge">{{ sourceBadge }}</span>
        </div>
        <div class="search-tip-text">输入关键字后会优先做本地筛选，并在可用时拉取远程建议。</div>
      </div>
    </template>
  </v-combobox>
</template>

<style scoped>
.tag-input {
  width: 100%;
}

.search-tip {
  padding: 12px 16px 10px;
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.16);
}

.search-tip-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.search-tip-title {
  font-size: 0.86rem;
  font-weight: 700;
  color: rgba(31, 45, 51, 0.82);
}

.source-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-secondary), 0.14);
  color: rgb(var(--v-theme-secondary));
  font-size: 0.76rem;
  white-space: nowrap;
}

.search-tip-text {
  margin-top: 4px;
  font-size: 0.82rem;
  color: rgba(31, 45, 51, 0.58);
}

:deep(.v-field) {
  border-radius: var(--search-input-radius);
}

:deep(.v-field__outline) {
  --v-field-border-radius: var(--search-input-radius);
}

:deep(.v-field__input) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  align-content: flex-start;
  gap: 8px;
  padding-top: 10px;
  padding-bottom: 10px;
  overflow-x: visible;
  overflow-y: visible;
  min-height: 56px;
}

:deep(.v-combobox__selection) {
  flex: 0 0 auto;
  max-width: 100%;
  margin-inline-end: 0;
}

:deep(.v-chip) {
  flex: 0 0 auto;
  max-width: 100%;
  white-space: nowrap;
}

:deep(.v-field__append-inner),
:deep(.v-field__clearable) {
  align-self: center;
  padding-top: 0;
}
</style>
