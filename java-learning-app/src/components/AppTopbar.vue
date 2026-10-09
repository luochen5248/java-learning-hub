<script setup lang="ts">
/**
 * AppTopbar.vue —— 顶部栏
 *
 * 两种形态：
 *  - brand：首页专属，logo + 产品名 + 副标题；
 *  - 普通：返回按钮 + 标题。
 * 两种形态右上角都有主题入口（.tb-actions > button.tb-icon）。
 */
import { RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'
import { ICON_BACK, ICON_MOON, ICON_SUN } from './icons'
import { useThemeStore } from '../stores/theme'
import { useUiStore } from '../stores/ui'

withDefaults(
  defineProps<{
    /** 首页品牌态 */
    brand?: boolean
    /** 标题（非品牌态必填） */
    title?: string
    /** 返回目标路由，缺省则不显示返回按钮 */
    back?: string
  }>(),
  { brand: false, title: '', back: '' }
)

const theme = useThemeStore()
const ui = useUiStore()

// 用变量而非模板里的静态 src：静态 src 会被 Vite 当成模块导入去解析，
// 而 public/assets 下的图片是运行时资源（与课程数据里的 cover 路径同一套写法）。
const logo = 'assets/img/logo.png'
</script>

<template>
  <header class="topbar">
    <template v-if="brand">
      <img class="brand-logo" :src="logo" alt="" />
      <div class="brand-txt">
        <div class="brand-t">Java 后端学习</div>
        <div class="brand-s">从 Vue 出发 · 10 模块</div>
      </div>
    </template>
    <template v-else>
      <RouterLink v-if="back" class="tb-back" :to="back" aria-label="返回">
        <AppIcon :path="ICON_BACK" :size="20" />
      </RouterLink>
      <div class="tb-title">{{ title }}</div>
    </template>

    <span class="tb-actions">
      <button
        type="button"
        class="tb-icon"
        :aria-label="theme.isDark ? '切换到浅色主题' : '切换到深色主题'"
        @click="ui.openTheme()"
      >
        <AppIcon :path="theme.isDark ? ICON_SUN : ICON_MOON" :size="18" />
      </button>
    </span>
  </header>
</template>
