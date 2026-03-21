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
  <v-card class="result-card" variant="flat">
    <div
      v-if="item.coverUrl"
      class="card-image-blur"
      :style="{
        backgroundImage: `url(${item.coverUrl})`,
      }"
      aria-hidden="true"
    />
    <div v-if="item.coverUrl" class="card-image-wash" aria-hidden="true" />

    <div class="card-cover">
      <v-img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" cover height="320" />
      <div v-else class="cover-fallback">
        <span>暂无封面</span>
      </div>
    </div>

    <div class="card-body">
      <div class="card-hover">
        <div class="card-summary">
          <div class="card-heading">
            <h3>{{ item.title }}</h3>
            <p>{{ item.subtitle }}</p>
            <div v-if="item.aliases.length > 0" class="alias-row">
              <span v-for="alias in item.aliases.slice(0, 2)" :key="alias">别名: {{ alias }}</span>
            </div>
            <div v-if="item.meta.length > 0" class="card-meta">
              <span v-for="line in item.meta" :key="line">{{ line }}</span>
            </div>
          </div>

          <div class="card-actions">
            <v-btn
              class="result-action-btn"
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
        </div>

        <div class="detail-list">
          <div v-if="item.primaryTags.length > 0" class="detail-section">
            <div class="detail-label">主要标签</div>
            <div class="tag-row">
              <TagActionMenu
                v-for="tag in item.primaryTags"
                :key="`${item.id}-${tag.field}-${tag.value}`"
                :tag="tag"
                @add="emit('addTag', $event)"
                @set="emit('setTag', $event)"
              />
            </div>
          </div>

          <div v-if="item.links.length > 0" class="detail-section">
            <div class="detail-label">外部链接</div>
            <div class="link-row">
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

          <div v-for="section in item.detailSections.slice(0, 4)" :key="section.key" class="detail-section">
            <div class="detail-label">{{ section.label }}</div>
            <div class="tag-row">
              <TagActionMenu
                v-for="tag in section.tags.slice(0, 4)"
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
.result-card {
  overflow: hidden;
  position: relative;
  background: linear-gradient(180deg, var(--surface-panel-strong), var(--surface-panel-soft));
  border: 1px solid var(--theme-border-soft);
  box-shadow: var(--shadow-elevated);
  isolation: isolate;
}

.result-action-btn,
.result-link-btn {
  border-radius: var(--search-control-radius);
}

.result-action-btn {
  color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.14) !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.result-action-btn :deep(.v-btn__content),
.result-action-btn :deep(.v-icon) {
  color: inherit;
}

.result-link-btn {
  opacity: 0.78;
}

.card-cover {
  position: relative;
  z-index: 1;
  background: linear-gradient(180deg, rgba(var(--v-theme-accent), 0.1), rgba(var(--v-theme-primary), 0.08));
}

.card-image-blur,
.card-image-wash {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 240ms ease;
}

.card-image-blur {
  z-index: 2;
  background-position: center;
  background-size: cover;
  filter: blur(26px) saturate(1.14);
  transform: scale(1.12);
  mask-image: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.04) 10%,
    rgba(0, 0, 0, 0.14) 22%,
    rgba(0, 0, 0, 0.34) 38%,
    rgba(0, 0, 0, 0.64) 54%,
    rgba(0, 0, 0, 0.9) 70%,
    rgba(0, 0, 0, 1) 82%,
    rgba(0, 0, 0, 1) 100%
  );
}

.card-image-wash {
  z-index: 3;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(251, 242, 246, 0.04) 14%, rgba(249, 236, 241, 0.14) 28%, rgba(248, 232, 238, 0.34) 44%, rgba(247, 231, 237, 0.6) 60%, rgba(246, 229, 235, 0.8) 76%, rgba(245, 227, 234, 0.94) 100%),
    radial-gradient(circle at 18% 22%, rgba(255, 250, 252, 0.14), transparent 22%),
    radial-gradient(circle at 84% 14%, rgba(var(--v-theme-accent), 0.12), transparent 24%);
  mask-image: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.03) 12%,
    rgba(0, 0, 0, 0.12) 24%,
    rgba(0, 0, 0, 0.3) 40%,
    rgba(0, 0, 0, 0.58) 56%,
    rgba(0, 0, 0, 0.86) 72%,
    rgba(0, 0, 0, 1) 84%,
    rgba(0, 0, 0, 1) 100%
  );
}

.cover-fallback {
  height: 320px;
  display: grid;
  place-items: center;
  color: rgba(31, 45, 51, 0.55);
  background:
    radial-gradient(circle at top, rgba(var(--v-theme-primary), 0.3), transparent 40%),
    linear-gradient(135deg, rgba(var(--v-theme-accent), 0.14), rgba(var(--v-theme-primary), 0.1));
}

.card-body {
  position: relative;
  z-index: 4;
  min-height: 224px;
}

.card-heading h3 {
  margin: 0;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 1.2rem;
  line-height: 1.35;
}

.card-heading p {
  margin: 6px 0 0;
  color: var(--text-soft);
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 0.92rem;
}

.alias-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.86rem;
}

.card-hover {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 236px;
  padding: 8px 20px 20px;
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transform: translateY(calc(100% - 224px));
  transition: transform 240ms ease;
}

.card-hover::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -360px;
  bottom: 0;
  pointer-events: none;
  opacity: 0;
  background:
    linear-gradient(180deg, rgba(255, 247, 250, 0.01) 0%, rgba(255, 245, 249, 0.05) 12%, rgba(252, 239, 244, 0.16) 28%, rgba(249, 234, 240, 0.4) 48%, rgba(247, 231, 237, 0.66) 70%, rgba(245, 228, 234, 0.82) 100%),
    radial-gradient(circle at 24% 18%, rgba(255, 250, 252, 0.12), transparent 24%),
    radial-gradient(circle at 80% 8%, rgba(var(--v-theme-accent), 0.1), transparent 28%);
  transition: opacity 220ms ease;
}

.card-summary {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 172px;
  justify-content: space-between;
}

.result-card:hover .card-hover,
.result-card:focus-within .card-hover {
  transform: translateY(0);
}

.result-card:hover .card-image-blur,
.result-card:focus-within .card-image-blur,
.result-card:hover .card-image-wash,
.result-card:focus-within .card-image-wash {
  opacity: 1;
}

.result-card:hover .card-hover::before,
.result-card:focus-within .card-hover::before {
  opacity: 1;
}

.detail-list {
  position: relative;
  z-index: 1;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transform: translateY(12px);
  transition: max-height 240ms ease, opacity 180ms ease, transform 240ms ease;
}

.result-card:hover .detail-list,
.result-card:focus-within .detail-list {
  max-height: 380px;
  opacity: 1;
  transform: translateY(0);
}

.detail-section {
  display: grid;
  gap: 6px;
}

.detail-label {
  font-size: 0.82rem;
  color: rgba(31, 45, 51, 0.56);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.tag-row {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.link-row {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
