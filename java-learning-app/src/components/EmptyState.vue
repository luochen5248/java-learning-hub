<script setup lang="ts">
/** EmptyState.vue —— 空状态占位（数据缺失 / 无内容 / 404 共用） */
import AppIcon from './AppIcon.vue'
import { ICON_EMPTY } from './icons'

defineProps<{
  title: string
  desc?: string
}>()
</script>

<template>
  <div class="empty">
    <div class="empty-icon"><AppIcon :path="ICON_EMPTY" :size="26" :stroke="1.6" /></div>
    <div class="empty-title">{{ title }}</div>
    <div class="empty-desc">{{ desc || '' }}</div>
  </div>
</template>
