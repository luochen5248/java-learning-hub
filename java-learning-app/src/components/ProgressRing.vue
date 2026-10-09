<script setup lang="ts">
/**
 * ProgressRing.vue —— 环形总进度（「我的」页头部）
 * R=54；周长与终点偏移由内联 CSS 变量 --circ / --off 给出，
 * 动画只负责「长出来」，静态值就是终点，动画被暂停也不会错位。
 */
import { computed } from 'vue'

const props = defineProps<{ percent: number }>()

const R = 54
const C = 2 * Math.PI * R

const circ = computed(() => C.toFixed(1))
const off = computed(() => (C * (1 - props.percent / 100)).toFixed(1))
</script>

<template>
  <div class="ring-wrap">
    <svg class="ring" viewBox="0 0 130 130">
      <circle class="ring-bg" cx="65" cy="65" :r="R" />
      <circle
        class="ring-fg"
        cx="65"
        cy="65"
        :r="R"
        :stroke-dasharray="circ"
        :stroke-dashoffset="off"
        :style="{ '--circ': circ, '--off': off }"
      />
    </svg>
    <div class="ring-txt">
      <b class="tnum">{{ percent }}</b><span>%</span><em>总进度</em>
    </div>
  </div>
</template>
