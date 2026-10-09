/**
 * course.ts —— 课程内容 Schema 类型定义
 *
 * 这里只描述「数据长什么样」，不含任何渲染逻辑。
 * 两套类型分工明确：
 *  - RawModule：数据文件里书写的形状，字段可省略（加载时统一兜底）；
 *  - CourseModule：加载归一化之后的形状，字段全部齐备，可直接渲染。
 */

export type PhaseId = 'phase1' | 'phase2' | 'phase3'

/** 课程正文支持的 10 种内容块 */
export type SectionType =
  | 'text'
  | 'steps'
  | 'code'
  | 'compare'
  | 'table'
  | 'diagram'
  | 'img'
  | 'tip'
  | 'warn'
  | 'fe'

/**
 * 内容块。用「单一接口 + 全可选字段」而不是联合类型：
 * 数据文件是逐字迁移的历史内容，字段书写顺序与可选性不完全统一，
 * 联合类型会因为多余字段报错，这里按 type 区分语义即可。
 */
export interface Section {
  type: SectionType
  /** text / tip / warn / fe 的富文本（会被白名单清洗） */
  html?: string
  /** steps / compare / table 的标题 */
  title?: string
  /** steps 的条目 */
  items?: string[]
  /** code 的语言标识 */
  lang?: string
  /** code 的文件名标签 */
  filename?: string
  /** code 的源码原文 */
  code?: string
  /** compare / table 的表头 */
  head?: string[]
  /** compare / table 的行数据 */
  rows?: string[][]
  /** diagram / img 的图注 */
  caption?: string
  /** diagram 的内联 SVG */
  svg?: string
  /** img 的图片地址 */
  src?: string
}

/** 随堂测验题 */
export interface QuizQuestion {
  q: string
  options: string[]
  answer: number
  explain?: string
}

/** 闪卡 */
export interface Flashcard {
  id?: string
  front: string
  back: string
  tag?: string
}

/** 一课 */
export interface Lesson {
  id: string
  title: string
  minutes?: number
  goal?: string
  sections?: Section[]
  quiz?: QuizQuestion[]
}

/** 数据文件导出的模块（未归一化） */
export interface RawModule {
  id: string
  order?: number
  title: string
  subtitle?: string
  phase?: PhaseId
  phaseName?: string
  icon?: string
  cover?: string
  minutes?: number
  summary?: string
  lessons: Lesson[]
  flashcards?: Flashcard[]
  missing?: boolean
}

/** 归一化之后的模块 */
export interface CourseModule {
  id: string
  order: number
  title: string
  subtitle: string
  phase: PhaseId
  phaseName: string
  icon: string
  cover: string
  minutes: number
  summary: string
  lessons: Lesson[]
  flashcards: Flashcard[]
  /** 内容文件缺失时的占位标记 */
  missing: boolean
}

/** 学习阶段 */
export interface Phase {
  id: PhaseId
  name: string
  short: string
  color: string
}

/** 模块兜底元信息（内容文件缺失时首页依然完整） */
export interface ModuleMeta {
  id: string
  file: string
  phase: PhaseId
  icon: string
  title: string
  subtitle: string
  cover: string
  minutes: number
}

/** 刷题池里的题（带来源信息，供错题本与「回到原课」使用） */
export interface PoolQuestion {
  key: string
  moduleId: string
  moduleTitle: string
  phase: PhaseId
  lessonId: string
  lessonTitle: string
  lessonIndex: number
  qIndex: number
  q: string
  options: string[]
  answer: number
  explain: string
}

/** 闪卡池里的卡（带来源信息） */
export interface PoolFlashcard {
  key: string
  moduleId: string
  moduleTitle: string
  phase: PhaseId
  front: string
  back: string
  tag: string
}

/** 刷题模式 */
export type QuizModeId = 'all' | 'module' | 'random' | 'wrong'

export interface QuizMode {
  id: QuizModeId
  title: string
  desc: string
  count: number
  icon: string
  disabled?: boolean
}

/** 「按模块选」列表项 */
export interface ModuleQuestionCount {
  id: string
  title: string
  phase: PhaseId
  color: string
  minutes: number
  count: number
}
