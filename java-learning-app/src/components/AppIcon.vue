<script setup lang="ts">
/**
 * AppIcon.vue —— 统一图标渲染
 *
 * 用法：<AppIcon :path="ICON_HOME" :size="20" />
 * path 只接受本仓库 icons.ts 里定义的路径常量（内部常量，不存在注入风险），
 * 因此这里用 v-html 直接渲染 path 片段。
 */
withDefaults(
  defineProps<{
    /** SVG 内部路径片段 */
    path: string
    /** 边长（px） */
    size?: number
    /** 线宽 */
    stroke?: number
  }>(),
  { size: 18, stroke: 1.8 }
)
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="path"
  />
</template>
