<script setup lang="ts">
/**
 * QuizBlock.vue —— 课程页「随堂测验」
 *
 * 交互：一次定选（答过不可改），就地反馈（正确项绿边、错选项红边）+ 展开解析。
 * 作答记录写入 progress store（按 lessonId + 题序），重进课程页仍保留。
 */
import { computed } from 'vue'
import type { QuizQuestion } from '../types/course'
import { sanitizeHtml } from '../lib/sanitize'
import { useProgressStore } from '../stores/progress'

const props = defineProps<{
  lessonId: string
  quiz?: QuizQuestion[]
}>()

const progress = useProgressStore()

const questions = computed(() => (Array.isArray(props.quiz) ? props.quiz : []))
const answers = computed(() => {
  const rec = progress.getQuizRecord(props.lessonId)
  return (rec && rec.answers) || {}
})

function optionClass(qi: number, oi: number): string {
  const picked = answers.value[String(qi)]
  if (!picked) return 'quiz-opt'
  const q = questions.value[qi]
  if (!q) return 'quiz-opt'
  if (Number(q.answer) === oi) return 'quiz-opt is-right'
  if (picked.pick === oi) return 'quiz-opt is-wrong'
  return 'quiz-opt'
}

function tagText(qi: number): string {
  const q = questions.value[qi]
  const picked = answers.value[String(qi)]
  if (!q || !picked) return ''
  return picked.ok ? '答对了' : '正确答案：' + String.fromCharCode(65 + Number(q.answer))
}

function pick(qi: number, oi: number): void {
  if (answers.value[String(qi)]) return
  const q = questions.value[qi]
  if (!q) return
  progress.recordAnswer(props.lessonId, qi, oi, Number(q.answer) === oi)
}

const letter = (i: number): string => String.fromCharCode(65 + i)
</script>

<template>
  <section v-if="questions.length" class="quiz" :data-lesson="lessonId">
    <div class="sec-title"><span class="sec-bar"></span>随堂测验</div>

    <div v-for="(q, qi) in questions" :key="qi" class="quiz-item">
      <div class="quiz-q"><span class="quiz-no">{{ qi + 1 }}</span><span>{{ q.q }}</span></div>
      <div class="quiz-opts">
        <button
          v-for="(o, oi) in q.options"
          :key="oi"
          type="button"
          :class="optionClass(qi, oi)"
          :disabled="!!answers[String(qi)]"
          @click="pick(qi, oi)"
        >
          <span class="quiz-key">{{ letter(oi) }}</span>
          <span class="quiz-txt">{{ o }}</span>
        </button>
      </div>
      <div class="quiz-explain" :class="{ 'is-open': !!answers[String(qi)] }">
        <span
          class="quiz-tag"
          :class="answers[String(qi)]?.ok ? 'is-ok' : 'is-no'"
        >{{ tagText(qi) }}</span>
        <div class="quiz-explain-txt prose" v-html="sanitizeHtml(q.explain || '')"></div>
      </div>
    </div>
  </section>
</template>
