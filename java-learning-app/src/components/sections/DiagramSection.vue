<script setup lang="ts">
/**
 * DiagramSection.vue —— 内联 SVG 图解
 *
 * 深层设计约束：图解一律包在固定深色容器 .diagram-canvas（#0F1B2D）里，
 * 因此浅色主题下这 31 张「深色底调过色」的 SVG 不改也能正常阅读；
 * 容器内部重新声明深色语境变量，主题切换不影响图内文字/描边对比度。
 */
import { computed } from 'vue'
import { sanitizeSvg } from '../../lib/sanitize'

const props = defineProps<{ caption?: string; svg?: string }>()
const svg = computed(() => sanitizeSvg(props.svg))
</script>

<template>
  <figure class="diagram">
    <div class="diagram-canvas" v-html="svg"></div>
    <figcaption v-if="caption" class="fig-cap">图解 · {{ caption }}</figcaption>
  </figure>
</template>
