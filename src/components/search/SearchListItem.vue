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
      <div v-if="item.coverUrl" class="list-cover-frame">
        <v-img :src="item.coverUrl" :alt="item.title" class="list-cover-image" contain height="156" />
      </div>
      <div v-else class="list-cover-fallback">暂无封面</div>
    </div>

    <div class="list-body">
      <div
        v-if="item.coverUrl"
        class="list-body-art"
        :style="{
          backgroundImage: `url(${item.coverUrl})`,
        }"
        aria-hidden="true"
      />
      <div class="list-body-wash" aria-hidden="true" />

      <div class="list-body-content">
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
  display: grid;
  place-items: center;
  padding: 16px 10px;
  background: linear-gradient(180deg, rgba(70, 106, 116, 0.08), rgba(142, 75, 42, 0.04));
}

.list-cover-frame {
  width: 100%;
  height: 100%;
  min-height: 156px;
  display: grid;
  place-items: center;
}

.list-cover-image {
  width: 100%;
  max-width: 168px;
}

.list-cover-fallback {
  height: 100%;
  min-height: 156px;
  display: grid;
  place-items: center;
  color: rgba(31, 45, 51, 0.55);
}

.list-body {
  position: relative;
  overflow: hidden;
  padding: 18px 20px;
  display: grid;
  gap: 14px;
  isolation: isolate;
}

.list-body-content {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 14px;
}

.list-body-art {
  position: absolute;
  inset: -18% -4% -18% 52%;
  background-position: center;
  background-size: cover;
  opacity: 0.48;
  filter: blur(26px) saturate(1.18);
  transform: scale(1.12);
}

.list-body-wash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 82% 24%, rgba(206, 170, 123, 0.28), transparent 22%),
    radial-gradient(circle at 74% 68%, rgba(101, 70, 124, 0.14), transparent 28%),
    linear-gradient(90deg, rgba(255, 250, 244, 0.95) 0%, rgba(255, 250, 244, 0.9) 36%, rgba(250, 244, 236, 0.72) 66%, rgba(245, 235, 224, 0.58) 100%);
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

  .list-cover {
    padding: 18px 18px 0;
  }

  .list-header {
    flex-direction: column;
  }

  .list-body-art {
    inset: 44% -8% -10% -8%;
    opacity: 0.32;
  }

  .dense-section {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
