/**
 * course.ts —— 课程目录与题库聚合（Pinia）
 *
 * 职责：
 *  - 启动时加载 10 个模块，注入 progress store 的目录索引；
 *  - 对外提供 moduleMap / lessonMap / qPool / fcPool 等派生数据，
 *    页面只读这些派生值，不再各自维护一份 Map，避免多页面各存一份导致状态不一致。
 */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loadModules } from '../data'
import { buildFlashcardPool, buildQuestionPool } from '../lib/quiz'
import { useProgressStore } from './progress'
import type { CourseModule, Lesson, PoolFlashcard, PoolQuestion } from '../types/course'

export interface LessonHit {
  lesson: Lesson
  module: CourseModule
}

export const useCourseStore = defineStore('course', () => {
  const progress = useProgressStore()

  const loading = ref(true)
  const catalog = ref<CourseModule[]>([])

  const moduleMap = computed(() => {
    const map = new Map<string, CourseModule>()
    for (const m of catalog.value) map.set(m.id, m)
    return map
  })

  const lessonMap = computed(() => {
    const map = new Map<string, LessonHit>()
    for (const m of catalog.value) {
      for (const l of m.lessons || []) map.set(l.id, { lesson: l, module: m })
    }
    return map
  })

  /** 全部题目（含来源信息），刷题 / 错题本 / 我的页共用 */
  const qPool = computed<PoolQuestion[]>(() => buildQuestionPool(catalog.value))

  /** 全部闪卡 */
  const fcPool = computed<PoolFlashcard[]>(() => buildFlashcardPool(catalog.value))

  /** 当前站点：第一个未全部完成的模块；全完成则停在最后一站 */
  const currentStation = computed<string | null>(() => {
    for (const m of catalog.value) {
      if (m.missing) continue
      if (progress.moduleProgress(m.id).percent < 100) return m.id
    }
    for (let i = catalog.value.length - 1; i >= 0; i--) {
      if (!catalog.value[i].missing) return catalog.value[i].id
    }
    return null
  })

  async function load(): Promise<void> {
    loading.value = true
    try {
      const list = await loadModules()
      catalog.value = list
      progress.setCatalog(list)
    } finally {
      loading.value = false
    }
  }

  function moduleOf(id: string): CourseModule | undefined {
    return moduleMap.value.get(id)
  }

  function lessonOf(id: string): LessonHit | undefined {
    return lessonMap.value.get(id)
  }

  /** 模块在目录中的序号（用于「第 N 课」这类展示） */
  function lessonIndexOf(moduleId: string, lessonId: string): number {
    const m = moduleMap.value.get(moduleId)
    if (!m) return 0
    return m.lessons.findIndex((l) => l.id === lessonId) + 1
  }

  return {
    loading,
    catalog,
    moduleMap,
    lessonMap,
    qPool,
    fcPool,
    currentStation,
    load,
    moduleOf,
    lessonOf,
    lessonIndexOf,
  }
})
