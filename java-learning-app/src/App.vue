<script setup lang="ts">
/**
 * App.vue —— 应用外壳
 *
 * 三件事：
 *  1. 用 a-config-provider 把「浅色/深色」算法喂给 Ant Design Vue，
 *     保证 Drawer / Segmented 这类组件的弹层配色与自研样式表同步。
 *  2. 挂载路由视图；课程数据未就绪时显示启动过渡屏 .splash。
 *  3. 固定底部 tabbar 与全局主题抽屉。
 */
import { ConfigProvider as AConfigProvider } from 'ant-design-vue'
import AppTabbar from './components/AppTabbar.vue'
import ThemeDrawer from './components/ThemeDrawer.vue'
import { useThemeStore } from './stores/theme'
import { useCourseStore } from './stores/course'

const theme = useThemeStore()
const course = useCourseStore()
</script>

<template>
  <a-config-provider :theme="theme.antdThemeConfig">
    <div class="app-shell">
      <div v-if="course.loading" class="splash">
        <div class="splash-bar"><i></i></div>
        <span>正在加载课程…</span>
      </div>
      <router-view v-else />
      <AppTabbar />
    </div>
    <ThemeDrawer />
  </a-config-provider>
</template>
