<script setup lang="ts">
/**
 * QuizRunView.vue —— 答题视图（同时承担本轮成绩页）
 *
 * 一轮状态放在 quizRun store 里跨路由存活；作答即时判对错，
 * 并把结果写入 progress store（维护错题本：答错入本、答对一次移出）。
 */
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppTopbar from '../components/AppTopbar.vue'
import AppIcon from '../components/AppIcon.vue'
import EmptyState from '../components/EmptyState.vue'
import { ICON_CHECK, ICON_CLOSE } from '../components/icons'
import { sanitizeHtml } from '../lib/sanitize'
import { useCourseStore } from '../stores/course'
import { useProgressStore } from '../stores/progress'
import { useQuizRunStore } from '../stores/quizRun'

const router = useRouter()
const course = useCourseStore()
const progress = useProgressStore()
const quizRun = useQuizRunStore()

const q = computed(() => quizRun.list[quizRun.i])
const pick = computed(() => quizRun.picks[quizRun.i])
const total = computed(() => quizRun.list.length)
const prog = computed(() => (total.value ? Math.round((quizRun.i / total.value) * 100) : 0))
const rate = computed(() => (total.value ? Math.round((quizRun.right / total.value) * 100) : 0))
const nextLabel = computed(() => (quizRun.i === total.value - 1 ? '查看本轮成绩' : '下一题'))
const letter = (i: number): string => String.fromCharCode(65 + i)

function optionClass(oi: number): string {
  const p = pick.value
  const cur = q.value
  if (!p || !cur) return 'quiz-opt'
  if (oi === cur.answer) return 'quiz-opt is-right'
  if (oi === p.oi) return 'quiz-opt is-wrong'
  return 'quiz-opt'
}

function choose(oi: number): void {
  const cur = q.value
  if (!cur || pick.value) return
  const ok = quizRun.answer(oi)
  if (ok !== null) progress.answerQuestion(cur.key, ok)
}

function next(): void {
  quizRun.next()
}

function restart(): void {
  const wrongKeys = progress.wrongList(course.qPool).map((w) => w.key)
  quizRun.restart(course.qPool, wrongKeys, course.moduleMap)
  router.replace('/quiz/run')
}
</script>

<template>
  <!-- 未开始 -->
  <template v-if="!quizRun.mode">
    <AppTopbar title="刷题" back="/quiz" />
    <div class="page">
      <div class="pad">
        <EmptyState title="还没有开始练习" desc="先回到模式选择，挑一种练法。" />
        <div class="q-foot"><RouterLink class="btn btn-primary" to="/quiz">去选题型</RouterLink></div>
      </div>
    </div>
  </template>

  <!-- 本轮无题 -->
  <template v-else-if="!total">
    <AppTopbar :title="quizRun.label" back="/quiz" />
    <div class="page">
      <div class="pad">
        <EmptyState
          title="本轮没有题目"
          :desc="quizRun.mode === 'wrong' ? '错题本是空的，先去练几道题吧。' : '这个范围里还没有题目。'"
        />
        <div class="q-foot"><RouterLink class="btn btn-primary" to="/quiz">换一种练法</RouterLink></div>
      </div>
    </div>
  </template>

  <!-- 本轮成绩 -->
  <template v-else-if="quizRun.finished()">
    <AppTopbar :title="quizRun.label" back="/quiz" />
    <div class="page">
      <div class="pad">
        <div class="result">
          <div class="result-kicker">本轮完成</div>
          <div class="result-score tnum">{{ quizRun.right }}<span>/{{ total }}</span></div>
          <div class="result-rate tnum">正确率 {{ rate }}%</div>
          <div class="result-note">
            {{ rate >= 80 ? '这一组已经很稳了，可以去挑战下一模块。' : '错的题已经进错题本，稍后用「错题重做」再过一遍。' }}
          </div>
          <div class="q-foot">
            <RouterLink class="btn btn-ghost" to="/quiz">返回模式选择</RouterLink>
            <button type="button" class="btn btn-primary" @click="restart">再练一轮</button>
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- 答题 -->
  <template v-else>
    <AppTopbar :title="quizRun.label" back="/quiz" />
    <div class="page">
      <div class="pad">
        <div class="q-bar"><i :style="{ width: prog + '%' }"></i></div>
        <div class="q-meta">
          <span class="tnum">{{ quizRun.i + 1 }} / {{ total }}</span>
          <span class="q-src">{{ q?.moduleTitle }} · {{ q?.lessonTitle }}</span>
          <span class="tnum q-right">对 {{ quizRun.right }}</span>
        </div>

        <div class="q-body">
          <div class="quiz-q">
            <span class="quiz-no tnum">{{ quizRun.i + 1 }}</span><span>{{ q?.q }}</span>
          </div>
          <div class="quiz-opts">
            <button
              v-for="(o, oi) in q?.options || []"
              :key="oi"
              type="button"
              :class="optionClass(oi)"
              :disabled="!!pick"
              @click="choose(oi)"
            >
              <span class="quiz-key">{{ letter(oi) }}</span>
              <span class="quiz-txt">{{ o }}</span>
              <span class="quiz-mark">
                <AppIcon
                  v-if="pick && oi === q?.answer"
                  :path="ICON_CHECK"
                  :size="15"
                  :stroke="2.6"
                />
                <AppIcon
                  v-else-if="pick && oi === pick.oi"
                  :path="ICON_CLOSE"
                  :size="15"
                  :stroke="2.6"
                />
              </span>
            </button>
          </div>

          <div v-if="pick" class="quiz-explain is-open">
            <span class="quiz-tag" :class="pick.ok ? 'is-ok' : 'is-no'">
              {{ pick.ok ? '答对了' : '正确答案：' + letter(q?.answer ?? 0) }}
            </span>
            <div class="quiz-explain-txt prose" v-html="sanitizeHtml(q?.explain || '暂无解析。')"></div>
            <RouterLink class="explain-src" :to="'/lesson/' + (q?.lessonId || '')">
              回到《{{ q?.lessonTitle || q?.lessonId }}》复习
            </RouterLink>
          </div>
        </div>

        <div class="q-foot">
          <button type="button" class="btn btn-primary" :disabled="!pick" @click="next">
            {{ nextLabel }}
          </button>
        </div>
      </div>
    </div>
  </template>
</template>
