<script setup lang="ts">
/**
 * LessonView.vue —— 课程页
 * 目标 → 内容块 → 随堂测验 → 上一课 / 标记完成并下一课
 */
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppTopbar from '../components/AppTopbar.vue'
import SectionRenderer from '../components/SectionRenderer.vue'
import QuizBlock from '../components/QuizBlock.vue'
import EmptyState from '../components/EmptyState.vue'
import { useCourseStore } from '../stores/course'
import { useProgressStore } from '../stores/progress'

const props = defineProps<{ id: string }>()

const router = useRouter()
const course = useCourseStore()
const progress = useProgressStore()

const item = computed(() => course.lessonOf(props.id))
/** 课程列表里「第 N 课」（模块内序号） */
const idx = computed(() => {
  const it = item.value
  if (!it) return 0
  return it.module.lessons.findIndex((l) => l.id === props.id) + 1
})
const sib = computed(() => progress.siblingLessons(props.id))
const done = computed(() => progress.isDone(props.id))
const sections = computed(() => (item.value && item.value.lesson.sections) || [])
const quiz = computed(() => (item.value && item.value.lesson.quiz) || [])

function completeNext(): void {
  const it = item.value
  if (!it || !sib.value.next) return
  progress.markDone(props.id)
  router.push('/lesson/' + sib.value.next)
}

function toggleDone(): void {
  progress.toggleDone(props.id)
}
</script>

<template>
  <template v-if="item">
    <AppTopbar
      :title="item.module.id.toUpperCase() + ' · 第 ' + idx + ' 课'"
      :back="'/module/' + item.module.id"
    />
    <div class="page">
      <div class="pad">
        <div class="lesson-kicker">
          {{ item.module.title }} · 约 {{ Number(item.lesson.minutes) || 0 }} 分钟
        </div>
        <h1 class="lesson-title">{{ item.lesson.title }}</h1>

        <div v-if="item.lesson.goal" class="goal">
          <span class="goal-label">本课目标</span>
          <div class="goal-txt">{{ item.lesson.goal }}</div>
        </div>

        <div class="sections">
          <SectionRenderer v-for="(s, i) in sections" :key="i" :section="s" />
        </div>

        <QuizBlock :lesson-id="id" :quiz="quiz" />

        <div class="lesson-foot">
          <RouterLink
            v-if="sib.prev"
            class="btn btn-ghost"
            :to="'/lesson/' + sib.prev"
          >上一课</RouterLink>
          <span v-else class="btn btn-ghost is-off">没有上一课</span>

          <button v-if="sib.next" type="button" class="btn btn-primary" @click="completeNext">
            {{ done ? '下一课' : '标记完成并下一课' }}
          </button>
          <button v-else type="button" class="btn btn-primary" @click="toggleDone">
            {{ done ? '已完成 ✓' : '标记完成' }}
          </button>
        </div>
      </div>
    </div>
  </template>

  <template v-else>
    <AppTopbar title="课程" back="/" />
    <div class="page">
      <div class="pad"><EmptyState title="课程不存在或建设中" desc="回到模块页看看其它课程。" /></div>
    </div>
  </template>
</template>
