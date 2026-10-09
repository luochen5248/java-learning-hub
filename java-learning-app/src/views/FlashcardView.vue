<script setup lang="ts">
/**
 * FlashcardView.vue —— 闪卡速记
 *
 * 浏览状态（当前张 / 是否翻面 / 是否包含已掌握）刻意留在组件内：
 * 离开页面即重置，符合「速记一轮」的直觉；掌握态本身写在 progress store 里不丢。
 *
 * 移动端手势：左右滑动位移 ≥ 40px 且以横向为主才翻卡；
 * 滑动后 400ms 内忽略紧随其后的 click，避免「滑动 + 点击」连翻两次。
 */
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppTopbar from '../components/AppTopbar.vue'
import EmptyState from '../components/EmptyState.vue'
import { useCourseStore } from '../stores/course'
import { useProgressStore } from '../stores/progress'

const course = useCourseStore()
const progress = useProgressStore()

const i = ref(0)
const flipped = ref(false)
const includeDone = ref(false)

/** 当前要显示的卡片：默认剔除已掌握的 */
const list = computed(() =>
  includeDone.value ? course.fcPool : course.fcPool.filter((c) => !progress.isCardDone(c.key))
)
const idx = computed(() => Math.min(i.value, Math.max(0, list.value.length - 1)))
const card = computed(() => list.value[idx.value])
const cardDone = computed(() => (card.value ? progress.isCardDone(card.value.key) : false))
const mastered = computed(() => progress.masteredCardCount())
const prog = computed(() => (list.value.length ? Math.round(((idx.value + 1) / list.value.length) * 100) : 0))
const skipped = computed(() => course.fcPool.length - list.value.length)

function flip(): void {
  flipped.value = !flipped.value
}

function go(delta: number): void {
  const n = list.value.length
  if (!n) return
  i.value = (idx.value + delta + n) % n
  flipped.value = false
}

function master(): void {
  const c = card.value
  if (!c) return
  progress.toggleCardDone(c.key)
  flipped.value = false
  // 标记后可能从「未掌握」列表里消失，自动回退一位，避免停在空位
  if (!includeDone.value) i.value = Math.min(i.value, Math.max(0, list.value.length - 1))
}

function showDone(): void {
  includeDone.value = true
  i.value = 0
  flipped.value = false
}

function toggleInclude(): void {
  includeDone.value = !includeDone.value
  i.value = 0
  flipped.value = false
}

/* ---- 移动端滑动 ---- */
let touchX = 0
let touchY = 0
let justSwiped = false

function onTouchStart(e: TouchEvent): void {
  if (!e.touches.length) return
  touchX = e.touches[0].clientX
  touchY = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent): void {
  if (!e.changedTouches.length) return
  const t = e.changedTouches[0]
  const dx = t.clientX - touchX
  const dy = t.clientY - touchY
  if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
  justSwiped = true
  window.setTimeout(() => {
    justSwiped = false
  }, 400)
  go(dx < 0 ? 1 : -1)
}

function onClickCard(): void {
  if (justSwiped) {
    justSwiped = false
    return
  }
  flip()
}
</script>

<template>
  <!-- 没有闪卡数据 -->
  <template v-if="!course.fcPool.length">
    <AppTopbar title="闪卡速记" back="/quiz" />
    <div class="page">
      <div class="pad">
        <EmptyState
          title="闪卡还在建设中"
          desc="每张卡片正面是问题、背面是答案，点击卡片翻面。内容组落盘后自动出现。"
        />
        <div class="q-foot"><RouterLink class="btn btn-primary" to="/quiz">去刷题</RouterLink></div>
      </div>
    </div>
  </template>

  <!-- 这一轮全部掌握 -->
  <template v-else-if="!list.length">
    <AppTopbar title="闪卡速记" back="/quiz" />
    <div class="page">
      <div class="pad">
        <EmptyState title="这一轮全部掌握了" desc="把「包含已掌握」打开可以复习已掌握的卡片。" />
        <div class="q-foot">
          <button type="button" class="btn btn-ghost" @click="showDone">包含已掌握</button>
          <RouterLink class="btn btn-primary" to="/quiz">去刷题</RouterLink>
        </div>
      </div>
    </div>
  </template>

  <!-- 速记中 -->
  <template v-else>
    <AppTopbar title="闪卡速记" back="/quiz" />
    <div class="page">
      <div class="pad">
        <div class="q-bar"><i :style="{ width: prog + '%' }"></i></div>
        <div class="q-meta">
          <span class="tnum">{{ idx + 1 }} / {{ list.length }}</span>
          <span class="q-src">{{ card?.moduleTitle }}</span>
          <span class="tnum q-right">已掌握 {{ mastered }}</span>
        </div>

        <div
          class="fc-stage"
          @touchstart.passive="onTouchStart"
          @touchend.passive="onTouchEnd"
          @click="onClickCard"
        >
          <div class="fc-inner" :class="{ 'is-flipped': flipped }">
            <div class="fc-face fc-front">
              <span class="fc-tag">{{ card?.tag || '速记' }}</span>
              <div class="fc-text">{{ card?.front }}</div>
              <div class="fc-hint">点击卡片看答案</div>
            </div>
            <div class="fc-face fc-back">
              <span class="fc-tag">{{ card?.tag || '速记' }}</span>
              <div class="fc-text">{{ card?.back }}</div>
              <div class="fc-hint">再次点击翻回正面</div>
            </div>
          </div>
        </div>

        <div class="q-foot fc-foot">
          <button type="button" class="btn btn-ghost" @click="go(-1)">上一张</button>
          <button
            type="button"
            class="btn fc-master"
            :class="{ 'is-on': cardDone }"
            @click="master"
          >
            {{ cardDone ? '已掌握 ✓' : '标记已掌握' }}
          </button>
          <button type="button" class="btn btn-ghost" @click="go(1)">下一张</button>
        </div>

        <button
          type="button"
          class="fc-toggle"
          :class="{ 'is-on': includeDone }"
          @click="toggleInclude"
        >
          {{ includeDone ? '✓ ' : '' }}包含已掌握的卡片（当前跳过 {{ skipped }} 张）
        </button>
        <div class="foot">左右滑动也可以翻卡（移动端）</div>
      </div>
    </div>
  </template>
</template>
