<script setup lang="ts">
/**
 * QuizView.vue —— 刷题模式选择
 * 四种模式（全部 / 按模块 / 随机 20 / 错题重做）+ 按模块展开面板 + 闪卡入口
 */
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppTopbar from '../components/AppTopbar.vue'
import AppIcon from '../components/AppIcon.vue'
import EmptyState from '../components/EmptyState.vue'
import { ICON_CARD, MODE_ICON } from '../components/icons'
import { buildModes, countByModule } from '../lib/quiz'
import { useCourseStore } from '../stores/course'
import { useProgressStore } from '../stores/progress'
import { useQuizRunStore } from '../stores/quizRun'
import type { QuizModeId } from '../types/course'

const router = useRouter()
const course = useCourseStore()
const progress = useProgressStore()
const quizRun = useQuizRunStore()

/** 模块展开面板是否打开 */
const showModules = ref(false)

const stats = computed(() => progress.answerStats())
const wrongKeys = computed(() => progress.wrongList(course.qPool).map((w) => w.key))
const modes = computed(() => buildModes(course.qPool, course.catalog, wrongKeys.value.length))
const modCounts = computed(() => countByModule(course.catalog, course.qPool))

function start(mode: QuizModeId | '', modId: string): void {
  quizRun.start(mode, modId, course.qPool, wrongKeys.value, course.moduleMap)
  router.push('/quiz/run')
}

function onMode(mode: QuizModeId | ''): void {
  if (mode === 'module') {
    showModules.value = !showModules.value
    return
  }
  start(mode, '')
}
</script>

<template>
  <AppTopbar title="刷题" />
  <div class="page">
    <div class="pad">
      <div v-if="course.qPool.length" class="quiz-sum">
        <span><b class="tnum">{{ stats.answered }}</b>累计答题</span>
        <span><b class="tnum">{{ stats.answered ? stats.rate + '%' : '--' }}</b>正确率</span>
        <span><b class="tnum">{{ stats.wrongCount }}</b>错题</span>
      </div>

      <template v-if="course.qPool.length">
        <button
          v-for="m in modes"
          :key="m.id"
          type="button"
          class="mode"
          :class="{ 'is-off': m.disabled }"
          :disabled="m.disabled"
          @click="onMode(m.id)"
        >
          <span class="mode-ico"><AppIcon :path="MODE_ICON[m.icon] || MODE_ICON.all" :size="18" /></span>
          <span class="mode-l">
            <span class="mode-t">{{ m.title }}</span>
            <span class="mode-d">{{ m.desc }}</span>
          </span>
          <span class="mode-n tnum">{{ m.count }}</span>
        </button>

        <div v-if="showModules" class="mode-panel">
          <button
            v-for="m in modCounts"
            :key="m.id"
            type="button"
            class="mode-row"
            :class="{ 'is-off': m.count === 0 }"
            :disabled="m.count === 0"
            @click="start('module', m.id)"
          >
            <span class="me-dot" :style="{ background: m.color }"></span>
            <span class="me-t">{{ m.title }}</span>
            <span class="me-n tnum">{{ m.count }} 题</span>
          </button>
          <EmptyState v-if="!modCounts.length" title="题库建设中" desc="课程数据落盘后这里会出现模块列表。" />
        </div>
      </template>

      <EmptyState
        v-else
        title="题库还在建设中"
        desc="课程数据文件落盘后，这里会自动出现全部练习模式。"
      />

      <!-- 闪卡速记入口 -->
      <RouterLink class="mode mode-fc" :class="{ 'is-off': !course.fcPool.length }" to="/flashcard">
        <span class="mode-ico"><AppIcon :path="ICON_CARD" :size="18" /></span>
        <span class="mode-l">
          <span class="mode-t">闪卡速记</span>
          <span class="mode-d">
            {{ course.fcPool.length ? '每模块 10 张，翻面记忆，已掌握自动跳过' : '闪卡数据建设中，先去刷题吧' }}
          </span>
        </span>
        <span class="mode-n tnum">{{ course.fcPool.length ? course.fcPool.length + ' 张' : '—' }}</span>
      </RouterLink>
    </div>
  </div>
</template>
