/**
 * quizRun.ts —— 刷题「一轮」的运行态（Pinia）
 *
 * 为什么用 store 而不是组件内 ref：
 *  刷题是「模式选择页 → 答题页」两步跳转，答题页还要能「再练一轮」回到同一轮，
 *  本轮题目列表与作答进度必须跨路由存活，否则一跳转就丢。
 *  生命周期语义仍与旧的模块级变量一致：离开刷题流程、重新选题即重置，
 *  不做持久化（刷新页面等于重新开始一轮，符合「一轮一练」的直觉）。
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { pickList } from '../lib/quiz'
import type { CourseModule, PoolQuestion, QuizModeId } from '../types/course'

export interface QuizPick {
  oi: number
  ok: boolean
}

export const useQuizRunStore = defineStore('quizRun', () => {
  const mode = ref<QuizModeId | ''>('')
  const modId = ref('')
  const label = ref('')
  const list = ref<PoolQuestion[]>([])
  const i = ref(0)
  const picks = ref<(QuizPick | undefined)[]>([])
  const right = ref(0)

  /** 本轮是否已结束（答完全部题 → 展示成绩页） */
  function finished(): boolean {
    return list.value.length > 0 && i.value >= list.value.length
  }

  function modeLabel(m: QuizModeId | '', moduleMap: Map<string, CourseModule>): string {
    if (m === 'module') {
      const mod = moduleMap.get(modId.value)
      return mod ? mod.title : modId.value
    }
    return ({ all: '全部练习', random: '随机 20 题', wrong: '错题重做' } as Record<string, string>)[m] || '练习'
  }

  /**
   * 开始一轮练习。
   * @param m 模式
   * @param mod 模块 id（仅 module 模式需要）
   * @param pool 全量题池
   * @param wrongKeys 当前错题 key（wrong 模式用）
   * @param moduleMap 用于取模块标题作为标题文案
   */
  function start(
    m: QuizModeId | '',
    mod: string,
    pool: PoolQuestion[],
    wrongKeys: string[],
    moduleMap: Map<string, CourseModule>
  ): void {
    mode.value = m
    modId.value = mod || ''
    list.value = pickList(m, pool, modId.value, wrongKeys)
    label.value = modeLabel(m, moduleMap)
    i.value = 0
    picks.value = []
    right.value = 0
  }

  /** 用同一模式与范围重开一轮 */
  function restart(pool: PoolQuestion[], wrongKeys: string[], moduleMap: Map<string, CourseModule>): void {
    start(mode.value, modId.value, pool, wrongKeys, moduleMap)
  }

  /** 记录本题选项；返回是否判对（已答过返回 null，不允许改选） */
  function answer(oi: number): boolean | null {
    const q = list.value[i.value]
    if (!q) return null
    if (picks.value[i.value]) return null
    const ok = oi === q.answer
    picks.value[i.value] = { oi, ok }
    if (ok) right.value++
    return ok
  }

  function next(): void {
    i.value++
  }

  return { mode, modId, label, list, i, picks, right, finished, start, restart, answer, next }
})
