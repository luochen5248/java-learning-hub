<script setup lang="ts">
/**
 * TableSection.vue —— 表格（table 普通表 / compare 对比表）
 *
 * 两者结构一致，只有体例不同（.tbl-plain vs .tbl-cmp），用 variant 区分，
 * 避免复制一份只差一个 class 的组件。
 */
import { computed } from 'vue'
import { sanitizeHtml } from '../../lib/sanitize'

const props = withDefaults(
  defineProps<{
    title?: string
    head?: string[]
    rows?: string[][]
    variant?: 'table' | 'compare'
  }>(),
  { variant: 'table' }
)

const safeHead = computed(() => (Array.isArray(props.head) ? props.head : []).map((h) => sanitizeHtml(h)))
const safeRows = computed(() =>
  (Array.isArray(props.rows) ? props.rows : []).map((r) => (Array.isArray(r) ? r : []).map((c) => sanitizeHtml(c)))
)
const cls = computed(() => (props.variant === 'compare' ? 'tbl-cmp' : 'tbl-plain'))
</script>

<template>
  <div v-if="title" class="blk-title">{{ title }}</div>
  <div class="tbl-wrap">
    <table class="tbl" :class="cls">
      <thead v-if="safeHead.length">
        <tr>
          <th v-for="(h, i) in safeHead" :key="i" v-html="h"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, ri) in safeRows" :key="ri">
          <td v-for="(c, ci) in r" :key="ci" v-html="c"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
