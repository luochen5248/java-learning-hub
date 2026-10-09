<script setup lang="ts">
/**
 * HomeView.vue —— 首页
 * hero + 继续学习 + 地铁线路图（学习路线）+ 三阶段模块列表 + 页脚
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PHASES } from '../data'
import AppTopbar from '../components/AppTopbar.vue'
import AppIcon from '../components/AppIcon.vue'
import SubwayMap from '../components/SubwayMap.vue'
import ModuleRow from '../components/ModuleRow.vue'
import EmptyState from '../components/EmptyState.vue'
import { ICON_CHEV } from '../components/icons'
import { useCourseStore } from '../stores/course'
import { useProgressStore } from '../stores/progress'

const router = useRouter()
const course = useCourseStore()
const progress = useProgressStore()

const overall = computed(() => progress.overallProgress())

/** 继续学习卡片：有未完成课 → 显示课程；全部完成 → 复习；无内容 → 空态 */
const nextInfo = computed(() => {
  const next = progress.nextLesson()
  if (!next) return null
  const m = course.moduleOf(next.moduleId || '')
  const idx = m ? m.lessons.findIndex((l) => l.id === next.id) + 1 : 0
  const lesson = m ? m.lessons.find((l) => l.id === next.id) : undefined
  const mins = lesson ? Number(lesson.minutes) || 0 : 0
  const meta = m ? m.id.toUpperCase() + ' · 第 ' + idx + ' 课 · ' + mins + ' 分钟' : ''
  return { id: next.id, title: next.title, meta }
})

/** 三阶段分组 */
const stages = computed(() =>
  PHASES.map((ph) => {
    const mods = course.catalog.filter((m) => m.phase === ph.id)
    const lessons = mods.reduce((n, m) => n + m.lessons.length, 0)
    return { ...ph, mods, lessons }
  }).filter((s) => s.mods.length > 0)
)

function onMapClick(e: MouseEvent): void {
  const el = (e.target as HTMLElement).closest('[data-station]')
  const id = el && el.getAttribute('data-station')
  if (id) router.push('/module/' + encodeURIComponent(id))
}

// 首图缺失时隐藏 <img>，保留渐变底
const heroMissing = ref(false)
// 运行时相对路径（public/assets 下的图片不走 Vite 模块解析）
const heroSrc = 'assets/img/hero.jpg'
</script>

<template>
  <AppTopbar brand />
  <div class="page">
    <section class="hero">
      <img
        class="hero-bg"
        :class="{ 'is-missing': heroMissing }"
        :src="heroSrc"
        alt=""
        @error="heroMissing = true"
      />
      <div class="hero-mask"></div>
      <div class="hero-body">
        <div class="hero-kicker">写给 Vue3 + TypeScript 工程师</div>
        <h1 class="hero-title">用 Java 写出<br />能上线的后端</h1>
        <div class="hero-sub">先动手写 Web 接口，写的过程中补齐原理。</div>
        <div class="hero-stat"><b>{{ overall.total }}</b> 课 · <b>10</b> 模块 · 贯穿「待办清单 API」</div>
      </div>
    </section>

    <div class="pad">
      <!-- 继续学习 -->
      <RouterLink v-if="nextInfo" class="continue" :to="'/lesson/' + nextInfo.id">
        <span class="continue-l">
          <span class="continue-k">继续学习</span>
          <span class="continue-t">{{ nextInfo.title }}</span>
          <span class="continue-m">{{ nextInfo.meta }}</span>
        </span>
        <span class="continue-btn">开始</span>
      </RouterLink>
      <div v-else-if="overall.total > 0" class="continue is-finish">
        <span class="continue-l">
          <span class="continue-k">全部学完</span>
          <span class="continue-t">待办清单 API 已跑通全流程</span>
          <span class="continue-m">可以回头挑一课复习，或直接去做自己的项目</span>
        </span>
        <span class="continue-btn is-plain">复习</span>
      </div>
      <EmptyState v-else title="课程内容建设中" desc="课程数据文件还没有落盘，先看看下面的学习路线。" />

      <!-- 学习路线 -->
      <section class="route">
        <div class="sec-title">
          <span class="sec-bar"></span>学习路线
          <RouterLink class="sec-more" to="/route">全览<AppIcon :path="ICON_CHEV" :size="14" /></RouterLink>
        </div>
        <div class="route-map" @click="onMapClick">
          <SubwayMap variant="compact" />
        </div>
        <div class="legend">
          <span v-for="p in PHASES" :key="p.id" class="legend-i">
            <i :style="{ background: p.color }"></i>{{ p.short }}
          </span>
          <span class="legend-i is-tip"><i class="dot-done"></i>已完成</span>
        </div>
      </section>

      <!-- 三阶段模块列表 -->
      <section v-for="s in stages" :key="s.id" class="stage">
        <div class="stage-head" :style="{ '--pc': s.color }">
          <span class="stage-dot"></span>
          <span class="stage-name">{{ s.name }}</span>
          <span class="stage-count">{{ s.mods.length }} 模块 · {{ s.lessons }} 课</span>
        </div>
        <div class="stage-list">
          <ModuleRow v-for="m in s.mods" :key="m.id" :mod="m" :color="s.color" />
        </div>
      </section>

      <div class="foot">数据保存在本机浏览器 / App 本地存储，换设备不会同步。</div>
    </div>
  </div>
</template>
