<script setup lang="ts">
/** NoteSection.vue —— 三色提示框（tip 提示 / warn 坑点 / fe 前端视角） */
import { computed } from 'vue'
import { sanitizeHtml } from '../../lib/sanitize'

const props = defineProps<{
  variant: 'tip' | 'warn' | 'fe'
  html?: string
}>()

const META = {
  tip: { cls: 'note-tip', label: '提示' },
  warn: { cls: 'note-warn', label: '坑点' },
  fe: { cls: 'note-fe', label: '前端视角' },
} as const

const meta = computed(() => META[props.variant] || META.tip)
const safe = computed(() => sanitizeHtml(props.html))
</script>

<template>
  <div class="note" :class="meta.cls">
    <div class="note-head">
      <span class="note-dot"></span><span class="note-label">{{ meta.label }}</span>
    </div>
    <div class="note-body prose" v-html="safe"></div>
  </div>
</template>
