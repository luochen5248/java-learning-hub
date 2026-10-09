<script setup lang="ts">
/**
 * TableSection.vue —— 表格（table 普通表 / compare 对比表）
 *
 * 两者结构一致，只有体例不同（.tbl-plain vs .tbl-cmp），用 variant 区分，
 * 避免复制一份只差一个 class 的组件。
 *
 * 手机适配：宽表格在 .tbl-wrap 里横向滑动（CSS 已有），
 * 这里负责「可滑动提示」——内容溢出时显示滑动提示，
 * 用户滑过一次或内容不再溢出（旋转屏/字体变化）时自动隐藏。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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

/* ---- 可滑动提示 ---- */
const wrapEl = ref<HTMLElement | null>(null)
const overflow = ref(false) // 内容宽度超出容器
const slid = ref(false) // 用户已经滑过
const hintVisible = ref(false)

function measure() {
  const el = wrapEl.value
  if (!el) return
  overflow.value = el.scrollWidth - el.clientWidth > 12
  if (!overflow.value) slid.value = false
  hintVisible.value = overflow.value && !slid.value
}

function onScroll() {
  const el = wrapEl.value
  if (!el) return
  // 往左滑过 24px 即视为已发现可滑动，提示淡出并不再出现
  if (el.scrollLeft > 24) slid.value = true
  hintVisible.value = overflow.value && !slid.value
}

let ro: ResizeObserver | undefined

onMounted(() => {
  measure()
  // 容器尺寸变化（旋转屏、字体加载完成）时重新判断是否溢出
  if (typeof ResizeObserver !== 'undefined' && wrapEl.value) {
    ro = new ResizeObserver(measure)
    ro.observe(wrapEl.value)
  }
  window.addEventListener('resize', measure, { passive: true })
})

onBeforeUnmount(() => {
  ro?.disconnect()
  window.removeEventListener('resize', measure)
})
</script>

<template>
  <div v-if="title" class="blk-title">{{ title }}</div>
  <div class="tbl-wrap" :class="{ 'tbl-slidable': hintVisible }">
    <div ref="wrapEl" class="tbl-scroll" @scroll.passive="onScroll">
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
    <Transition name="tbl-hint">
      <div v-if="hintVisible" class="tbl-hint" aria-hidden="true">左右滑动查看</div>
    </Transition>
  </div>
</template>
