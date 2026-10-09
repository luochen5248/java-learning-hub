<script setup lang="ts">
/**
 * AppTabbar.vue —— 固定底部导航（首页 / 刷题 / 我的）
 *
 * 选中态映射与旧版 syncTab 一致：
 *   route|module|lesson → 首页；quiz|quizRun|flashcard → 刷题；me → 我的。
 */
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'
import { ICON_HOME, ICON_QUIZ, ICON_USER } from './icons'

const route = useRoute()

const TABS = [
  { id: 'home', to: '/', name: '首页', ico: ICON_HOME },
  { id: 'quiz', to: '/quiz', name: '刷题', ico: ICON_QUIZ },
  { id: 'me', to: '/me', name: '我的', ico: ICON_USER },
]

const TAB_OF_ROUTE: Record<string, string> = {
  home: 'home',
  route: 'home',
  module: 'home',
  lesson: 'home',
  quiz: 'quiz',
  quizRun: 'quiz',
  flashcard: 'quiz',
  me: 'me',
}

const active = computed(() => TAB_OF_ROUTE[String(route.name || '')] || 'home')
</script>

<template>
  <nav class="tabbar">
    <RouterLink
      v-for="t in TABS"
      :key="t.id"
      class="tab"
      :class="{ 'is-on': active === t.id }"
      :to="t.to"
    >
      <AppIcon :path="t.ico" :size="20" />
      <span>{{ t.name }}</span>
    </RouterLink>
  </nav>
</template>
