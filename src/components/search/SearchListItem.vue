<script setup lang="ts">
import TagActionMenu from './TagActionMenu.vue'
import type { SearchResultItem, SearchTag } from '../../types/search'

defineProps<{
  item: SearchResultItem
}>()

const emit = defineEmits<{
  addTag: [tag: SearchTag]
  setTag: [tag: SearchTag]
}>()
</script>

<template>
  <v-card class="list-item" variant="flat">
    <div class="list-cover">
      <v-img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" cover height="156" />
      <div v-else class="list-cover-fallback">暂无封面</div>
    </div>

    <div class="list-body">
      <div class="list-header">
        <div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.subtitle }}</p>
          <div v-if="item.aliases.length > 0" class="list-aliases">
            <span v-for="alias in item.aliases.slice(0, 3)" :key="alias">{{ alias }}</span>
          </div>
        </div>

        <v-btn
          color="primary"
          variant="tonal"
          append-icon="mdi-open-in-new"
          :href="item.wikiUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          前往 Wiki
        </v-btn>
      </div>

      <div v-if="item.meta.length > 0" class="list-meta">
        <span v-for="line in item.meta" :key="line">{{ line }}</span>
      </div>

      <div v-if="item.primaryTags.length > 0" class="list-tags">
        <TagActionMenu
          v-for="tag in item.primaryTags"
          :key="`${item.id}-${tag.field}-${tag.value}`"
          :tag="tag"
          @add="emit('addTag', $event)"
          @set="emit('setTag', $event)"
        />
      </div>

      <div v-if="item.links.length > 0" class="list-links">
        <v-btn
          v-for="link in item.links.slice(0, 2)"
          :key="link.key"
          size="small"
          variant="text"
          color="secondary"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ link.label }}
        </v-btn>
      </div>

      <div class="dense-sections">
        <div v-for="section in item.detailSections.slice(0, 3)" :key="section.key" class="dense-section">
          <strong>{{ section.label }}</strong>
          <div class="dense-tags">
            <TagActionMenu
              v-for="tag in section.tags.slice(0, 6)"
              :key="`${item.id}-${tag.field}-${tag.value}`"
              :tag="tag"
              @add="emit('addTag', $event)"
              @set="emit('setTag', $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.list-item {
  display: grid;
  grid-template-columns: 188px minmax(0, 1fr);
  gap: 0;
  overflow: hidden;
  border: 1px solid rgba(130, 104, 76, 0.12);
  background: rgba(255, 250, 244, 0.98);
}

.list-cover {
  background: linear-gradient(180deg, rgba(70, 106, 116, 0.08), rgba(142, 75, 42, 0.04));
}

.list-cover-fallback {
  height: 100%;
  min-height: 156px;
  display: grid;
  place-items: center;
  color: rgba(31, 45, 51, 0.55);
}

.list-body {
  padding: 18px 20px;
  display: grid;
  gap: 14px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.list-header h3 {
  margin: 0;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 1.16rem;
}

.list-header p {
  margin: 6px 0 0;
  color: rgba(31, 45, 51, 0.68);
}

.list-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: rgba(31, 45, 51, 0.6);
  font-size: 0.92rem;
}

.list-aliases {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  margin-top: 10px;
  color: rgba(31, 45, 51, 0.56);
  font-size: 0.86rem;
}

.list-tags,
.dense-tags,
.list-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dense-sections {
  display: grid;
  gap: 10px;
}

.dense-section {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.dense-section strong {
  color: rgba(31, 45, 51, 0.64);
  font-size: 0.86rem;
}

@media (max-width: 720px) {
  .list-item {
    grid-template-columns: 1fr;
  }

  .list-header {
    flex-direction: column;
  }

  .dense-section {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
