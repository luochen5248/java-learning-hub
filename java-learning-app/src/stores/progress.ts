/**
 * progress.ts —— 学习进度存取与进度计算（Pinia）
 *
 * 设计边界：
 *  - 只管数据，不碰 DOM；页面渲染由各视图组件负责。
 *  - 课程目录（catalog）由 course store 在数据加载完成后注入，用于计算百分比。
 *  - localStorage 在部分环境（隐私模式 / 旧 WebView）会抛异常，全部读写都做了降级：
 *    读不到就用内存态，写不进就静默失败，绝不因为存储不可用而白屏。
 */

import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { CourseModule } from '../types/course'

/** 存储 key 名保持不变：done / cards 要跨版本继承历史进度 */
const STORAGE_KEY = 'jla.progress.v1'

export interface QuizAnswer {
  pick: number
  ok: boolean
}
export interface QuizRecord {
  answers: Record<string, QuizAnswer>
}
export interface AnswerRecord {
  c: number
  w: number
  last: number
  at: number
}
export interface CardRecord {
  m: boolean
  at: number
}
export interface LessonInfo {
  moduleId: string
  title: string
  minutes: number
}
export interface ProgressSlice {
  done: number
  total: number
  percent: number
}
export interface ModuleReport extends ProgressSlice {
  id: string
  title: string
  missing: boolean
}
export interface AnswerStats {
  answered: number
  correct: number
  wrongCount: number
  rate: number
}

interface CatalogIndex {
  modules: CourseModule[]
  lessonIndex: Map<string, LessonInfo>
  moduleLessons: Map<string, string[]>
  ordered: string[]
}

/**
 * 版本兼容说明：
 *  - done / cards 的 key 不依赖题序或题面（lessonId / moduleId::fc::cardId），改结构也不受影响，跨版本继承。
 *  - quiz / records 的 key 绑定题目身份。版本不匹配时一律**重置**对应字段，不做迁移，
 *    否则旧错题本会静默指向另一道题。
 *
 * 维护提醒：修改任何一课的 quiz（增删题、改题干、改选项顺序）后，
 * 错题记录会错位，需要在下次发版时清空 records。
 */

/* ---------------- 内存态 ---------------- */

const state = reactive({
  done: new Set<string>(),          // 已完成课程 id 集合
  quiz: {} as Record<string, QuizRecord>,      // lessonId -> { answers: { 0: {pick, ok} } }
  records: {} as Record<string, AnswerRecord>, // 题目 key -> { c, w, last, at }
  cards: {} as Record<string, CardRecord>,     // 闪卡 key -> { m, at }
})

// 课程目录索引（不算入持久化，每次启动由 setCatalog 重建）
let index: CatalogIndex = {
  modules: [],
  lessonIndex: new Map(),
  moduleLessons: new Map(),
  ordered: [],
}

/* ---------------- 持久化 ---------------- */

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch (e) {
    return null // 存储不可用：退化为纯内存进度
  }
}

function writeRaw(text: string): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, text)
    return true
  } catch (e) {
    return false
  }
}

/**
 * 稳定字符串哈希（FNV-1a 32bit），用于把「题面 / 卡片正面」折成固定长度的 key 片段。
 * 选它的原因：实现只有几行、确定性跨会话、无依赖。
 */
export function hashText(s: unknown): string {
  const str = typeof s === 'string' ? s : String(s == null ? '' : s)
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    // h *= 16777619，用移位避免大整数精度问题
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h.toString(36)
}

export const useProgressStore = defineStore('progress', () => {
  function load(): void {
    const raw = readRaw()
    if (!raw) return
    let data: Record<string, unknown> | null = null
    try {
      data = JSON.parse(raw)
    } catch (e) {
      return // 脏数据直接丢弃，不阻塞启动
    }
    if (!data || typeof data !== 'object') return

    // done 不依赖任何 key 结构（就是 lessonId 集合），跨版本直接继承
    if (Array.isArray(data.done)) {
      state.done = new Set((data.done as unknown[]).filter((x): x is string => typeof x === 'string'))
    }
    if (data.quiz && typeof data.quiz === 'object') state.quiz = data.quiz as Record<string, QuizRecord>
    if (data.records && typeof data.records === 'object') {
      state.records = data.records as Record<string, AnswerRecord>
    }
    if (data.cards && typeof data.cards === 'object') state.cards = data.cards as Record<string, CardRecord>
  }

  function save(): void {
    writeRaw(
      JSON.stringify({
        v: 2,
        done: Array.from(state.done),
        quiz: state.quiz,
        records: state.records,
        cards: state.cards,
      })
    )
  }

  /* ---------------- 目录注入 ---------------- */

  function setCatalog(modules: CourseModule[]): void {
    const lessonIndex = new Map<string, LessonInfo>()
    const moduleLessons = new Map<string, string[]>()
    const ordered: string[] = []

    for (const m of modules || []) {
      const ids: string[] = []
      for (const l of m.lessons || []) {
        ids.push(l.id)
        lessonIndex.set(l.id, {
          moduleId: m.id,
          title: l.title,
          minutes: Number(l.minutes) || 0,
        })
        ordered.push(l.id)
      }
      moduleLessons.set(m.id, ids)
    }

    index = { modules: Array.isArray(modules) ? modules.slice() : [], lessonIndex, moduleLessons, ordered }
  }

  /* ---------------- 完成态 ---------------- */

  function isDone(lessonId: string): boolean {
    return state.done.has(lessonId)
  }

  function markDone(lessonId: string): void {
    if (!lessonId) return
    state.done.add(lessonId)
    save()
  }

  function unmarkDone(lessonId: string): void {
    state.done.delete(lessonId)
    save()
  }

  /** 切换完成态，返回切换后的布尔值 */
  function toggleDone(lessonId: string): boolean {
    if (state.done.has(lessonId)) state.done.delete(lessonId)
    else state.done.add(lessonId)
    save()
    return state.done.has(lessonId)
  }

  /* ---------------- 进度计算 ---------------- */

  function moduleProgress(moduleId: string): ProgressSlice {
    const ids = index.moduleLessons.get(moduleId) || []
    const total = ids.length
    let done = 0
    for (const id of ids) if (state.done.has(id)) done++
    return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
  }

  function overallProgress(): ProgressSlice {
    const total = index.ordered.length
    let done = 0
    for (const id of index.ordered) if (state.done.has(id)) done++
    return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
  }

  /** 已完成课程累计分钟数 */
  function minutesDone(): number {
    let sum = 0
    for (const id of state.done) {
      const info = index.lessonIndex.get(id)
      if (info) sum += info.minutes
    }
    return sum
  }

  /** 第一门未完成课（全局顺序），全部完成则返回 null */
  function nextLesson(): { id: string; moduleId: string | null; title: string } | null {
    for (const id of index.ordered) {
      if (!state.done.has(id)) {
        const info = index.lessonIndex.get(id)
        return { id, moduleId: info ? info.moduleId : null, title: info ? info.title : '' }
      }
    }
    return null
  }

  /** 在全局有序列表里找上一课 / 下一课 */
  function siblingLessons(lessonId: string): { prev: string | null; next: string | null; index: number } {
    const i = index.ordered.indexOf(lessonId)
    return {
      prev: i > 0 ? index.ordered[i - 1] : null,
      next: i >= 0 && i < index.ordered.length - 1 ? index.ordered[i + 1] : null,
      index: i,
    }
  }

  function getLessonInfo(lessonId: string): LessonInfo | null {
    return index.lessonIndex.get(lessonId) || null
  }

  /* ---------------- 测验记录（课程页内） ---------------- */

  function getQuizRecord(lessonId: string): QuizRecord | null {
    return state.quiz[lessonId] || null
  }

  function recordAnswer(lessonId: string, qIndex: number, pick: number, ok: boolean): void {
    if (!lessonId) return
    if (!state.quiz[lessonId]) state.quiz[lessonId] = { answers: {} }
    state.quiz[lessonId].answers[String(qIndex)] = { pick, ok }
    save()
  }

  /* ---------------- 题目级记录 / 错题本 ---------------- */

  /**
   * 生成稳定的题目 key：moduleId + lessonId + 题序。
   * 抽成独立函数，保证「答题写入」与「错题本筛选」永远用同一套 key。
   */
  function questionKey(moduleId: string, lessonId: string, qIndex: number): string {
    return (moduleId || '') + '::' + (lessonId || '') + '::' + qIndex
  }

  function ensureRecord(key: string): AnswerRecord {
    if (!state.records[key]) state.records[key] = { c: 0, w: 0, last: -1, at: 0 }
    return state.records[key]
  }

  /**
   * 记录一次全局作答（刷题页用），同时维护错题本：
   * 答错 → 进入错题本；答对一次 → 移出错题本（以最后一次结果为准）。
   */
  function answerQuestion(key: string, ok: boolean): boolean {
    if (!key) return false
    const rec = ensureRecord(key)
    if (ok) rec.c++
    else rec.w++
    rec.last = ok ? 1 : 0
    rec.at = Date.now()
    save()
    return !!ok
  }

  function getRecord(key: string): AnswerRecord | null {
    return state.records[key] || null
  }

  /** 该题当前是否在错题本里 */
  function isWrong(key: string): boolean {
    const rec = state.records[key]
    return !!rec && rec.last === 0
  }

  /** 错题本：返回 [{ key, c, w, at }]，可按传入的题目池过滤掉已下架的题 */
  function wrongList(pool?: { key: string }[]): { key: string; c: number; w: number; at: number }[] {
    const allow = pool ? new Set(pool.map((q) => q.key)) : null
    const out: { key: string; c: number; w: number; at: number }[] = []
    for (const key of Object.keys(state.records)) {
      if (allow && !allow.has(key)) continue
      const rec = state.records[key]
      if (rec && rec.last === 0) out.push({ key, c: rec.c || 0, w: rec.w || 0, at: rec.at || 0 })
    }
    return out
  }

  /* ---------------- 闪卡掌握态 ---------------- */

  function isCardDone(key: string): boolean {
    const rec = state.cards[key]
    return !!(rec && rec.m)
  }

  function setCardDone(key: string, done: boolean): void {
    if (!key) return
    state.cards[key] = { m: !!done, at: Date.now() }
    save()
  }

  function toggleCardDone(key: string): boolean {
    setCardDone(key, !isCardDone(key))
    return isCardDone(key)
  }

  /* ---------------- 统计 ---------------- */

  /** 全局答题统计（课程页 + 刷题页合并，按题目 key 累计次数） */
  function answerStats(): AnswerStats {
    let answered = 0
    let correct = 0
    let wrongCount = 0
    for (const key of Object.keys(state.records)) {
      const rec = state.records[key]
      if (!rec) continue
      answered += (rec.c || 0) + (rec.w || 0)
      correct += rec.c || 0
      if (rec.last === 0) wrongCount++ // 当前仍在错题本的题数
    }
    return {
      answered,
      correct,
      wrongCount,
      rate: answered ? Math.round((correct / answered) * 100) : 0,
    }
  }

  /** 已掌握闪卡数 */
  function masteredCardCount(): number {
    let n = 0
    for (const key of Object.keys(state.cards)) {
      if (state.cards[key] && state.cards[key].m) n++
    }
    return n
  }

  /* ---------------- 其它 ---------------- */

  function resetAll(): void {
    state.done = new Set<string>()
    state.quiz = {}
    state.records = {}
    state.cards = {}
    save()
  }

  /** 给「我的」页用的各模块进度明细 */
  function moduleReports(): ModuleReport[] {
    return index.modules.map((m) => {
      const p = moduleProgress(m.id)
      return { id: m.id, title: m.title, missing: !!m.missing, ...p }
    })
  }

  return {
    // 持久化
    load,
    save,
    setCatalog,
    // 完成态
    isDone,
    markDone,
    unmarkDone,
    toggleDone,
    // 进度
    moduleProgress,
    overallProgress,
    minutesDone,
    nextLesson,
    siblingLessons,
    getLessonInfo,
    // 课程页测验
    getQuizRecord,
    recordAnswer,
    // 题目级 / 错题本
    questionKey,
    answerQuestion,
    getRecord,
    isWrong,
    wrongList,
    // 闪卡
    isCardDone,
    setCardDone,
    toggleCardDone,
    // 统计
    answerStats,
    masteredCardCount,
    // 其它
    resetAll,
    moduleReports,
  }
})
