/**
 * store.ts —— 本地学习进度（localStorage）
 *
 * PC 端单机使用，不引入后端与同步；只记录「已完成课程」与「刷题正确数」。
 */

const KEY_PROGRESS = 'pc-progress-v1'
const KEY_QUIZ = 'pc-quiz-v1'

interface ProgressShape {
  /** 已完成课程的 lessonId 集合 */
  lessons: string[]
}

interface QuizShape {
  /** lessonId -> 最近一次答题正确数 */
  right: Record<string, number>
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...(JSON.parse(raw) as T) } : fallback
  } catch {
    return fallback
  }
}

function write(key: string, val: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* 存储不可用时静默降级，不影响学习 */
  }
}

export function getProgress(): ProgressShape {
  return read<ProgressShape>(KEY_PROGRESS, { lessons: [] })
}

export function isLessonDone(lessonId: string): boolean {
  return getProgress().lessons.includes(lessonId)
}

export function markLessonDone(lessonId: string) {
  const p = getProgress()
  if (!p.lessons.includes(lessonId)) {
    p.lessons.push(lessonId)
    write(KEY_PROGRESS, p)
  }
}

export function clearProgress() {
  write(KEY_PROGRESS, { lessons: [] })
  write(KEY_QUIZ, { right: {} })
}

export function setQuizRight(lessonId: string, right: number) {
  const q = read<QuizShape>(KEY_QUIZ, { right: {} })
  q.right[lessonId] = right
  write(KEY_QUIZ, q)
}
