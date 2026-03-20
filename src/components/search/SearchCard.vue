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
  background: linear-gradient(180deg, rgba(255, 252, 247, 0.98), rgba(248, 242, 232, 0.96));
  border: 1px solid rgba(130, 104, 76, 0.12);
  box-shadow: 0 24px 48px rgba(61, 49, 39, 0.08);
}

.result-action-btn,
.result-link-btn {
  border-radius: var(--search-control-radius);
}

.card-cover {
  background: linear-gradient(180deg, rgba(70, 106, 116, 0.08), rgba(142, 75, 42, 0.04));
}

.cover-fallback {
  height: 320px;
  display: grid;
  place-items: center;
  color: rgba(31, 45, 51, 0.55);
  background:
    radial-gradient(circle at top, rgba(191, 125, 69, 0.3), transparent 40%),
    linear-gradient(135deg, rgba(70, 106, 116, 0.12), rgba(142, 75, 42, 0.08));
}

.card-body {
  position: relative;
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
  color: rgba(31, 45, 51, 0.72);
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  color: rgba(31, 45, 51, 0.58);
  font-size: 0.92rem;
}

.alias-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 8px;
  color: rgba(31, 45, 51, 0.56);
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
  transition: transform 240ms ease, box-shadow 240ms ease;
  box-shadow: 0 -10px 28px rgba(31, 45, 51, 0.1);
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
    linear-gradient(180deg, rgba(255, 250, 244, 0.08) 0%, rgba(255, 250, 244, 0.16) 10%, rgba(255, 249, 242, 0.5) 26%, rgba(249, 242, 234, 0.86) 52%, rgba(247, 239, 230, 0.97) 100%),
    radial-gradient(circle at 24% 18%, rgba(255, 255, 255, 0.26), transparent 24%),
    radial-gradient(circle at 80% 8%, rgba(207, 164, 129, 0.18), transparent 28%);
  backdrop-filter: blur(14px) saturate(1.1);
  border-top: 1px solid rgba(255, 255, 255, 0.18);
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
  transform: translateY(-18px);
  box-shadow: 0 -18px 42px rgba(31, 45, 51, 0.14);
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
