<script setup lang="ts">
/** StepsSection.vue —— 编号步骤列表 */
import { computed } from 'vue'
import { sanitizeHtml } from '../../lib/sanitize'

const props = defineProps<{ title?: string; items?: string[] }>()

const safeItems = computed(() => (Array.isArray(props.items) ? props.items : []).map((it) => sanitizeHtml(it)))
</script>

<template>
  <div class="steps-wrap">
    <div v-if="title" class="blk-title">{{ title }}</div>
    <ol class="steps">
      <li v-for="(it, i) in safeItems" :key="i" class="step">
        <span class="step-no">{{ i + 1 }}</span>
        <span class="step-txt" v-html="it"></span>
      </li>
    </ol>
  </div>
</template>
