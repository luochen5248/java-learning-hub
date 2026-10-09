<script setup lang="ts">
/**
 * MeView.vue —— 我的
 * 总进度环 + 关键统计 + 练习数据 + 快捷入口 + 各模块进度 + 重置
 */
import { computed, ref, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { phaseOf } from '../data'
import AppTopbar from '../components/AppTopbar.vue'
import AppIcon from '../components/AppIcon.vue'
import ProgressRing from '../components/ProgressRing.vue'
import PctBar from '../components/PctBar.vue'
import { ICON_CARD, ICON_QUIZ } from '../components/icons'
import { useCourseStore } from '../stores/course'
import { useProgressStore } from '../stores/progress'

const course = useCourseStore()
const progress = useProgressStore()

const overall = computed(() => progress.overallProgress())
const mins = computed(() => progress.minutesDone())
const ans = computed(() => progress.answerStats())
const mastered = computed(() => progress.masteredCardCount())
const totalCards = computed(() => course.fcPool.length)

/** 各模块进度明细（带阶段色） */
const reports = computed(() =>
  progress.moduleReports().map((r) => {
    const mod = course.moduleOf(r.id)
    return { ...r, color: phaseOf(mod && mod.phase).color }
  })
)

/* ---- 重置：两段确认（3 秒内再点一次才真正执行） ---- */
const resetStep = ref(0)
let resetTimer: number | null = null

const resetText = computed(() => (resetStep.value === 1 ? '再点一次确认重置' : '重置学习进度'))

function onReset(): void {
  if (resetStep.value === 0) {
    resetStep.value = 1
    if (resetTimer !== null) window.clearTimeout(resetTimer)
    resetTimer = window.setTimeout(() => {
      resetStep.value = 0
      resetTimer = null
    }, 3000)
    return
  }
  resetStep.value = 0
  if (resetTimer !== null) {
    window.clearTimeout(resetTimer)
    resetTimer = null
  }
  progress.resetAll()
}

onUnmounted(() => {
  if (resetTimer !== null) window.clearTimeout(resetTimer)
})
</script>

<template>
  <AppTopbar title="我的" />
  <div class="page">
    <div class="pad">
      <div class="me-card">
        <ProgressRing :percent="overall.percent" />
        <div class="stats">
          <div class="stat"><b class="tnum">{{ overall.done }}</b><span>已完成课</span></div>
          <div class="stat"><b class="tnum">{{ mins }}</b><span>学习分钟</span></div>
          <div class="stat">
            <b class="tnum">{{ ans.answered ? ans.rate : '--' }}</b><span>答题正确率</span>
          </div>
        </div>
      </div>

      <div v-if="overall.done === 0" class="me-empty">
        <div class="me-empty-t">还没有开始</div>
        <div class="me-empty-d">
          从阶段一的第一站出发，跟着这条线走完 10 站，你就能独立写出并部署一个 Java 后端。
        </div>
        <RouterLink class="btn btn-primary" to="/module/m01">从第一站开始</RouterLink>
      </div>

      <div class="sec-title"><span class="sec-bar"></span>练习数据</div>
      <div class="grid4">
        <div class="g4"><b class="tnum">{{ ans.answered }}</b><span>累计答题</span></div>
        <div class="g4"><b class="tnum">{{ ans.answered ? ans.rate + '%' : '--' }}</b><span>正确率</span></div>
        <div class="g4">
          <b class="tnum">{{ mastered }}<i class="g4-sub">/{{ totalCards }}</i></b><span>已掌握闪卡</span>
        </div>
        <div class="g4" :class="{ 'is-warn': ans.wrongCount }">
          <b class="tnum">{{ ans.wrongCount }}</b><span>错题</span>
        </div>
      </div>

      <div class="sec-title"><span class="sec-bar"></span>快捷入口</div>
      <div class="shortcuts">
        <RouterLink class="sc" to="/quiz">
          <AppIcon :path="ICON_QUIZ" :size="17" />
          <span>刷题</span><em class="tnum">{{ course.qPool.length }} 题</em>
        </RouterLink>
        <RouterLink class="sc" to="/flashcard">
          <AppIcon :path="ICON_CARD" :size="17" />
          <span>闪卡速记</span><em class="tnum">{{ totalCards }} 张</em>
        </RouterLink>
      </div>

      <div class="sec-title"><span class="sec-bar"></span>各模块进度</div>
      <div class="me-list">
        <div v-for="r in reports" :key="r.id" class="me-row">
          <span class="me-dot" :style="{ background: r.color }"></span>
          <span class="me-t">{{ r.title }}</span>
          <span class="me-bar"><PctBar :done="r.done" :total="r.total" :color="r.color" /></span>
          <span class="me-n tnum">{{ r.done }}/{{ r.total }}</span>
        </div>
      </div>

      <button type="button" class="btn btn-danger" @click="onReset">{{ resetText }}</button>

      <div class="foot">数据保存在本机浏览器 / App 本地存储，换设备不会同步。</div>
    </div>
  </div>
</template>
