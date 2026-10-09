<script setup lang="ts">
/**
 * ImgSection.vue —— 位图配图（加载失败降级为占位色块，不出现破图）
 * 用 Vue 的 @error 处理，替代旧版全局 window.__JLImgError。
 */
import { ref } from 'vue'

defineProps<{ caption?: string; src?: string }>()

const missing = ref(false)

function onError(): void {
  missing.value = true
}
</script>

<template>
  <figure class="figure">
    <img
      class="pic"
      :class="{ 'is-missing': missing }"
      loading="lazy"
      decoding="async"
      :src="missing ? undefined : src"
      :alt="caption || ''"
      @error="onError"
    />
    <figcaption v-if="caption" class="fig-cap">{{ caption }}</figcaption>
  </figure>
</template>
