<script setup lang="ts">
/**
 * ModuleView.vue —— 模块页
 * 模块头图 + 统计 + 简介 + 课程列表（完成态打勾）
 */
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { phaseOf } from '../data'
import AppTopbar from '../components/AppTopbar.vue'
import AppIcon from '../components/AppIcon.vue'
import PctBar from '../components/PctBar.vue'
import EmptyState from '../components/EmptyState.vue'
import { ICON_CHECK } from '../components/icons'
import { sanitizeHtml } from '../lib/sanitize'
import { useCourseStore } from '../stores/course'
import { useProgressStore } from '../stores/progress'

const props = defineProps<{ id: string }>()

const course = useCourseStore()
const progress = useProgressStore()

const mod = computed(() => course.moduleOf(props.id))
const ph = computed(() => phaseOf(mod.value && mod.value.phase))
const p = computed(() => (mod.value ? progress.moduleProgress(mod.value.id) : { done: 0, total: 0, percent: 0 }))
const coverMissing = ref(false)

const rows = computed(() => {
  const m = mod.value
  if (!m) return []
  return m.lessons.map((l, i) => ({
    lesson: l,
    no: String(i + 1).padStart(2, '0'),
    done: progress.isDone(l.id),
    minutes: Number(l.minutes) || 0,
    goal: l.goal ? String(l.goal).slice(0, 22) : '',
  }))
})

const summary = computed(() => (mod.value && mod.value.summary ? sanitizeHtml(mod.value.summary) : ''))
</script>

<template>
  <AppTopbar v-if="!mod" title="模块" back="/" />
  <div v-if="!mod" class="page">
    <div class="pad"><EmptyState title="模块不存在" desc="回到首页看看学习路线吧。" /></div>
  </div>

  <template v-else>
    <AppTopbar :title="mod.id.toUpperCase() + ' · ' + mod.title" back="/" />
    <div class="page">
      <div class="mod-hero" :style="{ '--pc': ph.color }">
        <img
          class="mod-cover"
          :class="{ 'is-missing': coverMissing }"
          :src="mod.cover"
          alt=""
          @error="coverMissing = true"
        />
        <div class="mod-hero-mask"></div>
        <div class="mod-hero-body">
          <div class="mod-hero-phase">{{ ph.name }}</div>
          <h1 class="mod-hero-t">{{ mod.title }}</h1>
          <div class="mod-hero-s">{{ mod.subtitle || '' }}</div>
        </div>
      </div>

      <div class="pad">
        <div class="mod-stat">
          <span><b>{{ mod.lessons.length }}</b> 课</span>
          <span><b>{{ mod.minutes }}</b> 分钟</span>
          <span><b>{{ p.done }}</b> 已完成</span>
          <span class="mod-stat-bar">
            <PctBar :done="p.done" :total="p.total" :color="ph.color" />
          </span>
        </div>

        <div v-if="summary" class="mod-summary prose" v-html="summary"></div>

        <div class="sec-title"><span class="sec-bar"></span>课程列表</div>
        <div class="ls-list">
          <RouterLink
            v-for="r in rows"
            :key="r.lesson.id"
            class="ls-row"
            :class="{ 'is-done': r.done }"
            :to="'/lesson/' + r.lesson.id"
          >
            <span class="ls-no">{{ r.no }}</span>
            <span class="ls-body">
              <span class="ls-t">{{ r.lesson.title }}</span>
              <span class="ls-m">{{ r.minutes }} 分钟{{ r.goal ? ' · ' + r.goal : '' }}</span>
            </span>
            <span class="ls-check">
              <AppIcon v-if="r.done" :path="ICON_CHECK" :size="14" :stroke="2.6" />
            </span>
          </RouterLink>

          <EmptyState v-if="!mod.lessons.length" title="本模块建设中" desc="内容正在编写，先去学前面的模块。" />
        </div>
      </div>
    </div>
  </template>
</template>
