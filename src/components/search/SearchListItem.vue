<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import TagActionMenu from './TagActionMenu.vue'
import { getFieldLabel, type SearchResultItem, type SearchTag } from '../../types/search'

defineProps<{
  item: SearchResultItem
}>()

const emit = defineEmits<{
  addTag: [tag: SearchTag]
  setTag: [tag: SearchTag]
}>()

const { t } = useI18n()
</script>

<template>
  <v-card class="list-item" variant="flat">
    <div class="list-cover">
      <div v-if="item.coverUrl" class="list-cover-frame">
        <v-img :src="item.coverUrl" :alt="item.title" class="list-cover-image" contain height="156" />
      </div>
      <div v-else class="list-cover-fallback">{{ t('app.noCover') }}</div>
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
        <div class="list-summary">
          <div class="list-header">
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.subtitle }}</p>
              <div v-if="item.albumNames.length > 0" class="list-album-names">
                <span v-for="albumName in item.albumNames.slice(0, 3)" :key="albumName">{{ albumName }}</span>
              </div>
            </div>

            <v-btn
              class="result-action-btn"
              color="primary"
              variant="tonal"
              append-icon="$externalLink"
              :href="item.wikiUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ t('app.wikiAction') }}
            </v-btn>
          </div>

          <div v-if="item.meta.length > 0" class="list-meta">
            <span v-for="line in item.meta" :key="line">{{ line }}</span>
          </div>

          <div v-if="item.links.length > 0" class="list-links">
            <v-btn
              class="result-link-btn"
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
        </div>

        <div class="dense-sections">
          <div v-for="section in item.detailSections.slice(0, 8)" :key="section.key" class="dense-section">
            <strong>{{ getFieldLabel(section.key) }}</strong>
            <div class="dense-tags">
              <TagActionMenu
                v-for="tag in section.tags.slice(0, 4)"
                :key="`${item.id}-${tag.field}-${tag.value}`"
                :tag="tag"
                compact
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
  border: 1px solid var(--theme-border-soft);
  background: var(--surface-panel-strong);
  box-shadow: var(--shadow-soft);
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease;
  position: relative;
}

.list-item::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.48),
    inset 0 -1px 0 rgba(var(--v-theme-primary), 0.05);
}

.list-item:hover,
.list-item:focus-within {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.22);
  box-shadow:
    0 14px 28px rgba(56, 44, 34, 0.08),
    0 26px 44px rgba(56, 44, 34, 0.06),
    0 2px 6px rgba(255, 255, 255, 0.42) inset;
}

.result-action-btn,
.result-link-btn {
  border-radius: var(--search-control-radius);
}

.result-action-btn {
  color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.12) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.result-action-btn :deep(.v-btn__content),
.result-action-btn :deep(.v-icon) {
  color: inherit;
}

.result-link-btn {
  opacity: 0.78;
}

.list-cover {
  display: grid;
  place-items: center;
  padding: 16px 10px;
  background: linear-gradient(180deg, rgba(var(--v-theme-accent), 0.1), rgba(var(--v-theme-primary), 0.08));
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
  color: var(--text-muted);
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
  grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
  gap: 18px 26px;
  align-items: start;
}

.list-summary {
  display: grid;
  gap: 14px;
  min-width: 0;
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
    radial-gradient(circle at 82% 24%, rgba(var(--v-theme-accent), 0.18), transparent 22%),
    radial-gradient(circle at 74% 68%, rgba(var(--v-theme-secondary), 0.1), transparent 28%),
    linear-gradient(90deg, rgba(255, 248, 250, 0.95) 0%, rgba(255, 246, 249, 0.9) 34%, rgba(249, 236, 242, 0.74) 64%, rgba(246, 229, 236, 0.58) 100%);
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
  line-height: 1.35;
}

.list-header p {
  margin: 6px 0 0;
  color: var(--text-soft);
}

.list-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.list-album-names {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 0.86rem;
}

.dense-tags,
.list-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dense-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px 18px;
  align-content: start;
}

.dense-section {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.dense-section strong {
  color: var(--text-soft);
  font-size: 0.86rem;
  line-height: 1.75;
}

.dense-tags {
  gap: 6px;
}

@media (max-width: 860px) {
  .list-item {
    grid-template-columns: 168px minmax(0, 1fr);
  }

  .list-body-content {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .dense-sections {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

@media (max-width: 720px) {
  .dense-sections {
    grid-template-columns: 1fr;
    gap: 10px;
  }
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
