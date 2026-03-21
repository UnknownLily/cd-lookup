<script setup lang="ts">
import { ref } from 'vue'
import type { SearchTag } from '../../types/search'

const props = defineProps<{
  tag: SearchTag
}>()

const emit = defineEmits<{
  add: [tag: SearchTag]
  set: [tag: SearchTag]
}>()

const open = ref(false)

async function copyValue(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.tag.value)
  } finally {
    open.value = false
  }
}

function addToFilter(): void {
  emit('add', props.tag)
  open.value = false
}

function setAsFilter(): void {
  emit('set', props.tag)
  open.value = false
}
</script>

<template>
  <v-menu v-model="open" location="bottom start">
    <template #activator="{ props: activatorProps }">
      <v-chip
        v-bind="activatorProps"
        class="tag-chip"
        color="secondary"
        variant="tonal"
      >
        {{ tag.value }}
      </v-chip>
    </template>

    <v-list class="tag-menu-list" min-width="220" density="compact" rounded="xl">
      <v-list-subheader>{{ tag.label }}</v-list-subheader>
      <v-list-item prepend-icon="$copyContent" title="复制文本" @click="copyValue" />
      <v-list-item
        prepend-icon="$addFilter"
        title="添加进筛选条件"
        :disabled="!tag.filterable"
        @click="addToFilter"
      />
      <v-list-item
        prepend-icon="$applyFilter"
        title="设置为筛选条件"
        :disabled="!tag.filterable"
        @click="setAsFilter"
      />
      <v-divider class="my-1" />
      <v-list-item prepend-icon="$closeCircle" title="取消" @click="open = false" />
    </v-list>
  </v-menu>
</template>

<style scoped>
.tag-chip {
  cursor: pointer;
  color: rgb(var(--v-theme-secondary));
  background: rgba(var(--v-theme-secondary), 0.1);
  border: 1px solid rgba(var(--v-theme-secondary), 0.08);
}

.tag-menu-list {
  border-radius: var(--search-menu-radius) !important;
}

.tag-menu-list :deep(.v-list-item) {
  border-radius: 14px;
}
</style>
