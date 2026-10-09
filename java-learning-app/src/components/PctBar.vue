<script setup lang="ts">
/**
 * PctBar.vue —— 细进度条（模块行 / 我的页 / 模块页统计条共用）
 * 颜色通过 CSS 变量 --pc 注入，条内宽度按百分比计算。
 */
import { computed } from 'vue'

const props = defineProps<{
  done: number
  total: number
  /** 阶段色，例如 #3B82F6 */
  color: string
}>()

const percent = computed(() => (props.total ? Math.round((props.done / props.total) * 100) : 0))
</script>

<template>
  <span class="pbar" :style="{ '--pc': color }">
    <i :style="{ width: percent + '%' }"></i>
  </span>
</template>
