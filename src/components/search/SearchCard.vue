<script setup lang="ts">
import { ref, watch } from 'vue'
import TagActionMenu from './TagActionMenu.vue'
import type { SearchResultItem, SearchTag } from '../../types/search'

const props = defineProps<{
  item: SearchResultItem
}>()

const emit = defineEmits<{
  addTag: [tag: SearchTag]
  setTag: [tag: SearchTag]
}>()

const isDarkCover = ref(false)
let toneAnalysisToken = 0

watch(
  () => props.item.coverUrl,
  (coverUrl) => {
    toneAnalysisToken += 1
    const currentToken = toneAnalysisToken
    isDarkCover.value = false

    if (!coverUrl) {
      return
    }

    void detectCoverTone(coverUrl, currentToken)
  },
  { immediate: true },
)

async function detectCoverTone(coverUrl: string, currentToken: number): Promise<void> {
  try {
    const image = await loadImageElement(coverUrl)
    const luminance = sampleTopAreaLuminance(image)

    if (currentToken !== toneAnalysisToken) {
      return
    }

    isDarkCover.value = luminance < 118
  } catch {
    if (currentToken !== toneAnalysisToken) {
      return
    }

    isDarkCover.value = false
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image-load-failed'))
    image.src = src
  })
}

function sampleTopAreaLuminance(image: HTMLImageElement): number {
  const canvas = document.createElement('canvas')
  const width = 32
  const height = 32
  const sampleHeight = 18

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    return 255
  }

  context.drawImage(image, 0, 0, width, height)
  const { data } = context.getImageData(0, 0, width, sampleHeight)

  let weightedLuminance = 0
  let totalWeight = 0

  for (let y = 0; y < sampleHeight; y += 1) {
    const verticalWeight = 1.2 - y / sampleHeight / 2

    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const alpha = data[index + 3] / 255

      if (alpha <= 0) {
        continue
      }

      const red = data[index]
      const green = data[index + 1]
      const blue = data[index + 2]
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue
      const weight = verticalWeight * alpha

      weightedLuminance += luminance * weight
      totalWeight += weight
    }
  }

  return totalWeight > 0 ? weightedLuminance / totalWeight : 255
}
</script>

<template>
  <v-card class="result-card" :class="{ 'tone-dark': isDarkCover }" variant="flat">
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
      <v-img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title" class="cover-image" cover height="320" />
      <div v-else class="cover-fallback">
        <span>暂无封面</span>
      </div>
    </div>

    <div class="card-body" aria-hidden="true"></div>

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
            append-icon="$externalLink"
            :href="item.wikiUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            前往 Wiki
          </v-btn>

          <v-btn
            v-for="link in item.links.slice(0, 2)"
            :key="link.key"
            class="result-link-btn"
            size="small"
            variant="tonal"
            color="secondary"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ link.label }}
          </v-btn>
        </div>
      </div>

      <div class="detail-list">
        <div v-for="section in item.detailSections.slice(0, 6)" :key="section.key" class="detail-section">
          <div class="detail-label">{{ section.label }}</div>
          <div class="tag-row">
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
  </v-card>
</template>

<style scoped>
.result-card {
  --card-title-color: rgba(31, 45, 51, 0.94);
  --card-body-color: var(--text-soft);
  --card-muted-color: var(--text-muted);
  --card-link-color: rgba(31, 45, 51, 0.82);
  --card-link-opacity: 0.78;
  --card-action-fg: rgb(var(--v-theme-primary));
  --card-action-bg: rgb(255, 233, 240);
  --card-action-border: rgba(var(--v-theme-primary), 0.18);
  --card-action-hover-fg: rgb(var(--v-theme-primary));
  --card-action-hover-bg: rgb(255, 223, 233);
  --card-action-hover-border: rgba(var(--v-theme-primary), 0.28);
  --card-summary-text-shadow: none;
  overflow: hidden;
  position: relative;
  background: linear-gradient(180deg, var(--surface-panel-strong), var(--surface-panel-soft));
  border: 1px solid var(--theme-border-soft);
  box-shadow: var(--shadow-card-depth);
  isolation: isolate;
  transition:
    transform 240ms ease,
    box-shadow 240ms ease,
    border-color 240ms ease;
}

.result-card.tone-dark:hover,
.result-card.tone-dark:focus-within {
  --card-title-color: rgba(255, 249, 251, 0.96);
  --card-body-color: rgba(255, 242, 247, 0.88);
  --card-muted-color: rgba(255, 237, 244, 0.78);
  --card-summary-text-shadow: 0 1px 2px rgba(17, 10, 14, 0.32);
  --card-action-bg: rgb(90, 61, 75);
  --card-action-border: rgba(255, 235, 242, 0.22);
  --card-action-hover-fg: rgba(255, 249, 251, 0.98);
  --card-action-hover-bg: rgb(109, 75, 90);
  --card-action-hover-border: rgba(255, 240, 245, 0.32);
}

.result-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.54),
    inset 0 -1px 0 rgba(var(--v-theme-primary), 0.06);
  z-index: 6;
}

.result-card:hover,
.result-card:focus-within {
  transform: translateY(-4px);
  border-color: rgba(var(--v-theme-primary), 0.24);
  box-shadow: var(--shadow-card-depth-hover);
}

.result-action-btn,
.result-link-btn {
  border-radius: var(--search-control-radius);
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.result-action-btn {
  color: var(--card-action-fg) !important;
  background: var(--card-action-bg) !important;
  border: 1px solid var(--card-action-border);
  box-shadow: 0 8px 18px rgba(92, 52, 68, 0.12);
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.result-action-btn :deep(.v-btn__content),
.result-action-btn :deep(.v-icon) {
  color: inherit;
}

.result-action-btn:hover,
.result-action-btn:focus-visible {
  color: var(--card-action-hover-fg) !important;
  background: var(--card-action-hover-bg) !important;
  border-color: var(--card-action-hover-border);
  box-shadow: 0 12px 24px rgba(92, 52, 68, 0.18);
  transform: translateY(-1px);
}

.result-link-btn {
  opacity: var(--card-link-opacity);
  color: var(--card-link-color) !important;
  background: rgba(255, 255, 255, 0.92) !important;
  border: 1px solid rgba(var(--v-theme-secondary), 0.12);
  box-shadow: 0 6px 14px rgba(92, 52, 68, 0.08);
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.result-link-btn:hover,
.result-link-btn:focus-visible {
  background: rgba(255, 255, 255, 0.98) !important;
  border-color: rgba(var(--v-theme-secondary), 0.2);
  box-shadow: 0 10px 20px rgba(92, 52, 68, 0.12);
  transform: translateY(-1px);
}

.card-cover {
  position: relative;
  z-index: 1;
  background: linear-gradient(180deg, rgba(var(--v-theme-accent), 0.1), rgba(var(--v-theme-primary), 0.08));
}

.card-cover::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 220px;
  pointer-events: none;
  opacity: 0;
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(255, 247, 250, 0) 0%, rgba(255, 245, 249, 0.025) 16%, rgba(252, 239, 244, 0.1) 34%, rgba(249, 234, 240, 0.26) 54%, rgba(247, 231, 237, 0.44) 76%, rgba(245, 228, 234, 0.62) 100%),
    radial-gradient(circle at 50% 100%, rgba(255, 250, 252, 0.14), transparent 60%);
  transition: opacity 220ms ease;
}

.cover-image {
  position: relative;
  z-index: 1;
}

.cover-image :deep(.v-img__img),
.cover-image :deep(.v-img__picture) {
  transition: filter 220ms ease, opacity 220ms ease, transform 220ms ease;
}

.card-image-blur,
.card-image-wash {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 240ms ease;
}

.result-card:hover .card-image-blur,
.result-card:focus-within .card-image-blur,
.result-card:hover .card-image-wash,
.result-card:focus-within .card-image-wash,
.result-card:hover .card-cover::after,
.result-card:focus-within .card-cover::after {
  opacity: 1;
}

.result-card:hover .cover-image :deep(.v-img__img),
.result-card:focus-within .cover-image :deep(.v-img__img),
.result-card:hover .cover-image :deep(.v-img__picture),
.result-card:focus-within .cover-image :deep(.v-img__picture) {
  -webkit-mask-image: linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 64%, rgba(0, 0, 0, 0.92) 74%, rgba(0, 0, 0, 0.62) 86%, rgba(0, 0, 0, 0) 100%);
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 64%, rgba(0, 0, 0, 0.92) 74%, rgba(0, 0, 0, 0.62) 86%, rgba(0, 0, 0, 0) 100%);
}

.card-image-blur {
  z-index: 2;
  background-position: center;
  background-size: cover;
  filter: blur(26px) saturate(1.14);
  transform: scale(1.12);
  -webkit-mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.09) 10%, rgba(0, 0, 0, 0.24) 24%, rgba(0, 0, 0, 0.5) 44%, rgba(0, 0, 0, 0.82) 68%, rgba(0, 0, 0, 1) 100%);
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.09) 10%, rgba(0, 0, 0, 0.24) 24%, rgba(0, 0, 0, 0.5) 44%, rgba(0, 0, 0, 0.82) 68%, rgba(0, 0, 0, 1) 100%);
}

.card-image-wash {
  z-index: 3;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(251, 242, 246, 0.02) 10%, rgba(249, 236, 241, 0.08) 22%, rgba(248, 232, 238, 0.24) 38%, rgba(247, 231, 237, 0.5) 58%, rgba(246, 229, 235, 0.76) 78%, rgba(245, 227, 234, 0.94) 100%),
    radial-gradient(circle at 18% 22%, rgba(255, 250, 252, 0.14), transparent 22%),
    radial-gradient(circle at 84% 14%, rgba(var(--v-theme-accent), 0.12), transparent 24%);
  -webkit-mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.03) 12%, rgba(0, 0, 0, 0.12) 26%, rgba(0, 0, 0, 0.32) 44%, rgba(0, 0, 0, 0.64) 66%, rgba(0, 0, 0, 0.9) 84%, rgba(0, 0, 0, 1) 100%);
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.03) 12%, rgba(0, 0, 0, 0.12) 26%, rgba(0, 0, 0, 0.32) 44%, rgba(0, 0, 0, 0.64) 66%, rgba(0, 0, 0, 0.9) 84%, rgba(0, 0, 0, 1) 100%);
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
  min-height: 252px;
}

.card-hover {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  min-height: 252px;
  padding: 18px 20px 20px;
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transform: translateY(calc(100% - 252px));
  transition: transform 240ms ease;
  background:
    linear-gradient(180deg, rgba(255, 247, 250, 0) 0%, rgba(255, 245, 249, 0.006) 24%, rgba(252, 239, 244, 0.04) 38%, rgba(249, 234, 240, 0.14) 54%, rgba(247, 231, 237, 0.4) 74%, rgba(245, 228, 234, 0.82) 100%),
    radial-gradient(circle at 84% 10%, rgba(var(--v-theme-accent), 0.14), transparent 26%);
}

.card-hover::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -320px;
  bottom: 0;
  pointer-events: none;
  opacity: 0;
  background:
    linear-gradient(180deg, rgba(255, 247, 250, 0) 0%, rgba(255, 245, 249, 0.008) 20%, rgba(252, 239, 244, 0.04) 34%, rgba(249, 234, 240, 0.12) 50%, rgba(247, 231, 237, 0.28) 70%, rgba(245, 228, 234, 0.52) 100%),
    radial-gradient(circle at 24% 18%, rgba(255, 250, 252, 0.16), transparent 24%),
    radial-gradient(circle at 80% 8%, rgba(var(--v-theme-accent), 0.14), transparent 28%);
  backdrop-filter: blur(14px) saturate(1.08);
  -webkit-backdrop-filter: blur(14px) saturate(1.08);
  -webkit-mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.02) 12%, rgba(0, 0, 0, 0.08) 26%, rgba(0, 0, 0, 0.22) 42%, rgba(0, 0, 0, 0.5) 64%, rgba(0, 0, 0, 0.84) 84%, rgba(0, 0, 0, 1) 100%);
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.02) 12%, rgba(0, 0, 0, 0.08) 26%, rgba(0, 0, 0, 0.22) 42%, rgba(0, 0, 0, 0.5) 64%, rgba(0, 0, 0, 0.84) 84%, rgba(0, 0, 0, 1) 100%);
  transition: opacity 220ms ease;
}

.card-heading h3 {
  margin: 0;
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-size: 1.2rem;
  line-height: 1.35;
  color: var(--card-title-color);
  text-shadow: var(--card-summary-text-shadow);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.card-heading p {
  margin: 6px 0 0;
  color: var(--card-body-color);
  text-shadow: var(--card-summary-text-shadow);
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  color: var(--card-muted-color);
  font-size: 0.92rem;
  text-shadow: var(--card-summary-text-shadow);
}

.alias-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 8px;
  color: var(--card-muted-color);
  font-size: 0.86rem;
  text-shadow: var(--card-summary-text-shadow);
}

.card-summary {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 10px;
  min-height: 172px;
}

.card-heading {
  min-height: 0;
}

.detail-list {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 10px;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transform: translateY(12px);
  transition: max-height 240ms ease, opacity 180ms ease, transform 240ms ease;
}

.detail-section {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.detail-label {
  font-size: 0.84rem;
  color: rgba(31, 45, 51, 0.62);
  font-weight: 700;
  line-height: 1.7;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.result-card:hover .card-hover,
.result-card:focus-within .card-hover {
  transform: translateY(0);
}

.result-card:hover .card-hover::before,
.result-card:focus-within .card-hover::before {
  opacity: 1;
}

.result-card:hover .detail-list,
.result-card:focus-within .detail-list {
  max-height: 380px;
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 720px) {
  .card-summary {
    gap: 8px;
  }
}

@media (max-width: 720px) {
  .detail-section {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
