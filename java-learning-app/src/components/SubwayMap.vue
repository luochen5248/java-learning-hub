<script setup lang="ts">
/**
 * SubwayMap.vue —— 地铁线路图（首页视觉签名）
 *
 * 10 个模块 = 10 个站点，一条贯穿的线路按三阶段分色。
 * 已完成站点实心打卡，当前站点脉冲呼吸（prefers-reduced-motion 下自动静止）。
 *
 * 站点着色交给样式表（.st-ring / .st-core 用 CSS 变量 --station-fill / --sc），
 * 内联 style 只注入阶段色 --sc，这样同一份 SVG 在浅色主题下自动变成「白底彩环」。
 * 站点可点击：用 SVG 字符串 + v-html 渲染，点击交给父级事件委托（data-station）。
 */
import { computed } from 'vue'
import { phaseOf } from '../data'
import { escapeHtml } from '../lib/sanitize'
import { SHORT_LABEL } from './icons'
import { useCourseStore } from '../stores/course'
import { useProgressStore } from '../stores/progress'

const props = withDefaults(
  defineProps<{
    variant?: 'compact' | 'full'
  }>(),
  { variant: 'compact' }
)

const course = useCourseStore()
const progress = useProgressStore()

const svg = computed(() => {
  const full = props.variant === 'full'
  const W = full ? 680 : 460
  const H = full ? 196 : 148
  const padX = full ? 46 : 30
  const y = full ? 108 : 76
  const r = full ? 8 : 6.5
  const fs = full ? 12 : 10
  const gap = (W - padX * 2) / 9
  const catalog = course.catalog
  const xs = catalog.map((_, i) => padX + gap * i)
  if (!catalog.length) return ''

  const currentId = course.currentStation
  const doneIds = catalog
    .filter((m) => progress.moduleProgress(m.id).percent === 100 && !m.missing)
    .map((m) => m.id)

  // 1) 底轨：暗蓝色，保证线路连续不断（颜色由 .st-track 按主题切换）
  let out =
    '<svg class="metro" viewBox="0 0 ' +
    W +
    ' ' +
    H +
    '" role="img" aria-label="学习路线图">' +
    '<line class="st-track" x1="' +
    xs[0] +
    '" y1="' +
    y +
    '" x2="' +
    xs[xs.length - 1] +
    '" y2="' +
    y +
    '" stroke-width="5" stroke-linecap="round"/>'

  // 2) 分阶段着色的上行线段
  for (let i = 0; i < xs.length - 1; i++) {
    const color = phaseOf(catalog[i].phase).color
    out +=
      '<line x1="' +
      xs[i] +
      '" y1="' +
      y +
      '" x2="' +
      xs[i + 1] +
      '" y2="' +
      y +
      '" stroke="' +
      color +
      '" stroke-width="2.6" stroke-linecap="round" opacity="0.75"/>'
  }

  // 3) 站点
  catalog.forEach((m, i) => {
    const cx = xs[i]
    const color = phaseOf(m.phase).color
    const done = doneIds.indexOf(m.id) >= 0
    const isCur = m.id === currentId
    const below = i % 2 === 0 // 标签上下交错，避免相邻文字挤在一起
    const ly = below ? y + (full ? 30 : 26) : y - (full ? 20 : 18)
    const label = SHORT_LABEL[m.id] || m.title

    out +=
      '<g class="st' +
      (isCur ? ' is-cur' : '') +
      (done ? ' is-done' : '') +
      '" data-station="' +
      escapeHtml(m.id) +
      '" style="--sc:' +
      escapeHtml(color) +
      '">'
    out +=
      '<circle class="st-hit" cx="' + cx + '" cy="' + y + '" r="' + (full ? 22 : 18) + '" fill="transparent"/>'
    if (isCur) {
      out += '<circle class="st-pulse" cx="' + cx + '" cy="' + y + '" r="' + r + '" fill="none" stroke-width="2"/>'
    }
    out +=
      '<circle class="st-ring' +
      (done ? ' is-filled' : '') +
      '" cx="' +
      cx +
      '" cy="' +
      y +
      '" r="' +
      r +
      '" stroke-width="2.2"/>'
    if (done) {
      // 已完成：彩色实心环里留一个小「扣分白点」，靠 --station-core 跟随主题
      out += '<circle class="st-core" cx="' + cx + '" cy="' + y + '" r="' + (r * 0.34).toFixed(1) + '"/>'
    }
    if (isCur && !done) {
      out +=
        '<circle class="st-core is-filled" cx="' + cx + '" cy="' + y + '" r="' + (r * 0.38).toFixed(1) + '"/>'
    }
    out +=
      '<text class="st-label" x="' +
      cx +
      '" y="' +
      ly +
      '" text-anchor="middle" font-size="' +
      fs +
      '">' +
      escapeHtml(label) +
      '</text>'
    out += '</g>'
  })

  // 4) 起点 / 终点文字标记
  out +=
    '<text class="st-end" x="' +
    xs[0] +
    '" y="' +
    (y - (full ? 40 : 34)) +
    '" text-anchor="start" font-size="' +
    (fs - 1) +
    '">起点</text>'
  out +=
    '<text class="st-end" x="' +
    xs[xs.length - 1] +
    '" y="' +
    (y - (full ? 40 : 34)) +
    '" text-anchor="end" font-size="' +
    (fs - 1) +
    '">上线</text>'
  out += '</svg>'
  return out
})
</script>

<template>
  <!-- 站点点击由父级容器事件委托处理（[data-station]） -->
  <div v-html="svg"></div>
</template>
