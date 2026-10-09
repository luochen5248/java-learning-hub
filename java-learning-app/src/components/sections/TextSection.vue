<script setup lang="ts">
/** TextSection.vue —— 富文本段落（走白名单清洗后渲染） */
import { computed } from 'vue'
import { sanitizeHtml } from '../../lib/sanitize'

const props = defineProps<{ html?: string }>()
const safe = computed(() => sanitizeHtml(props.html))
</script>

<template>
  <div class="prose" v-html="safe"></div>
</template>
