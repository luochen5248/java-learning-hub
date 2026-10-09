/**
 * quiz.ts —— 刷题题池 / 闪卡池 聚合
 *
 * 纯数据模块：只把模块里的 quiz / flashcards 摊平成两个池子，不碰 DOM、不读 store。
 * 内容数据缺失、结构异常、题目字段不全时都在这里被过滤掉，页面层拿到的永远是干净数组。
 *
 * 题目 key 与 progress store 的 questionKey 保持同一格式（moduleId::lessonId::题序），
 * 错题本、答题记录、闪卡掌握态全部依赖它做稳定标识。
 */

import { phaseOf } from '../data'
import type {
  CourseModule,
  ModuleQuestionCount,
  PoolFlashcard,
  PoolQuestion,
  QuizMode,
  QuizModeId,
} from '../types/course'

/* ---------------- 题池 ---------------- */

function pickModuleId(lesson: { moduleId?: string; id?: string }, fallback: string): string {
  if (typeof lesson.moduleId === 'string' && lesson.moduleId) return lesson.moduleId
  if (typeof lesson.id === 'string') {
    const seg = lesson.id.split('-')
    if (seg.length >= 2 && /^m\d+$/i.test(seg[0])) return seg[0].toLowerCase()
  }
  return fallback
}

/** 聚合全部题目；missing 模块与结构不全的题会被跳过 */
export function buildQuestionPool(modules: CourseModule[]): PoolQuestion[] {
  const pool: PoolQuestion[] = []
  if (!Array.isArray(modules)) return pool

  for (const m of modules) {
    if (!m || m.missing || !Array.isArray(m.lessons)) continue
    const moduleId = m.id
    const moduleTitle = m.title || ''

    for (let li = 0; li < m.lessons.length; li++) {
      const lesson = m.lessons[li]
      if (!lesson || !Array.isArray(lesson.quiz)) continue
      const lessonId = lesson.id || ''
      if (!lessonId) continue
      const lm = pickModuleId(lesson, moduleId)

      for (let qi = 0; qi < lesson.quiz.length; qi++) {
        const q = lesson.quiz[qi]
        // 题目结构校验：题干与选项必须齐备，否则跳过（内容漏字段不该让刷题页崩）
        if (!q || typeof q.q !== 'string' || !q.q.trim()) continue
        const options = Array.isArray(q.options) ? q.options.filter((o) => typeof o === 'string') : []
        if (options.length < 2) continue
        const answer = Number(q.answer)
        if (!(answer >= 0 && answer < options.length)) continue

        pool.push({
          key: lm + '::' + lessonId + '::' + qi,
          moduleId: lm,
          moduleTitle,
          phase: m.phase || 'phase1',
          lessonId,
          lessonTitle: lesson.title || '',
          lessonIndex: li,
          qIndex: qi,
          q: q.q,
          options,
          answer,
          explain: typeof q.explain === 'string' ? q.explain : '',
        })
      }
    }
  }
  return pool
}

/** 按 moduleId 分组统计题量，保持模块原有顺序 */
export function countByModule(modules: CourseModule[], pool: PoolQuestion[]): ModuleQuestionCount[] {
  const counts = new Map<string, number>()
  for (const q of pool) counts.set(q.moduleId, (counts.get(q.moduleId) || 0) + 1)
  return (Array.isArray(modules) ? modules : [])
    .filter((m) => m && !m.missing)
    .map((m) => ({
      id: m.id,
      title: m.title,
      phase: m.phase || 'phase1',
      color: phaseOf(m.phase || 'phase1').color,
      minutes: m.minutes,
      count: counts.get(m.id) || 0,
    }))
}

/** 洗牌（Fisher-Yates），随机 20 题用；传入 rng 便于测试 */
export function shuffle<T>(list: T[], rng?: () => number): T[] {
  const r = typeof rng === 'function' ? rng : Math.random
  const arr = list.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    const t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
  return arr
}

/* ---------------- 闪卡池 ---------------- */

/** 聚合闪卡；front/back 缺一视为无效卡 */
export function buildFlashcardPool(modules: CourseModule[]): PoolFlashcard[] {
  const pool: PoolFlashcard[] = []
  if (!Array.isArray(modules)) return pool

  for (const m of modules) {
    if (!m || m.missing) continue
    const list = Array.isArray(m.flashcards) ? m.flashcards : []
    if (!list.length) continue

    for (let i = 0; i < list.length; i++) {
      const c = list[i]
      if (!c) continue
      const front = typeof c.front === 'string' ? c.front.trim() : ''
      const back = typeof c.back === 'string' ? c.back.trim() : ''
      if (!front || !back) continue
      const cid = typeof c.id === 'string' && c.id ? c.id : String(i)
      pool.push({
        key: (m.id || '') + '::fc::' + cid,
        moduleId: m.id,
        moduleTitle: m.title || '',
        phase: m.phase || 'phase1',
        front,
        back,
        tag: typeof c.tag === 'string' ? c.tag : '',
      })
    }
  }
  return pool
}

/* ---------------- 模式目录 ---------------- */

export function buildModes(pool: PoolQuestion[], modules: CourseModule[], wrongCount: number): QuizMode[] {
  return [
    { id: 'all', title: '全部练习', desc: '按模块顺序把全部题目过一遍', count: pool.length, icon: 'all' },
    { id: 'module', title: '按模块选', desc: '挑一个模块集中攻克', count: countByModule(modules, pool).length, icon: 'module' },
    { id: 'random', title: '随机 20 题', desc: '打乱顺序抽 20 题，检验真实掌握度', count: Math.min(20, pool.length), icon: 'random' },
    { id: 'wrong', title: '错题重做', desc: wrongCount > 0 ? '只练做错过的题，答对一次即移出' : '还没有错题，先去练几道', count: wrongCount || 0, icon: 'wrong', disabled: !wrongCount },
  ]
}

/** 按模式取出本轮题目列表；空数组表示该模式当前无可用题目 */
export function pickList(
  mode: QuizModeId | '',
  pool: PoolQuestion[],
  modId: string,
  wrongList: string[]
): PoolQuestion[] {
  if (!Array.isArray(pool)) return []
  if (mode === 'module') return pool.filter((q) => q.moduleId === modId)
  if (mode === 'random') return shuffle(pool).slice(0, 20)
  if (mode === 'wrong') {
    const set = new Set(Array.isArray(wrongList) ? wrongList : [])
    return pool.filter((q) => set.has(q.key))
  }
  return pool.slice()
}
