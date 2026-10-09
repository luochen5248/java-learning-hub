<script setup lang="ts">
/**
 * ThemeDrawer.vue —— 主题设置抽屉（三态：跟随系统 / 浅色 / 深色）
 *
 * 用 AntD 的 Drawer + Segmented 承载交互，配色由 a-config-provider 的算法自动跟随；
 * 面板内部只做「读偏好 / 写偏好」，实际落盘与 DOM 同步都在 theme store 里完成。
 */
import { computed } from 'vue'
import { Drawer as ADrawer, Segmented as ASegmented } from 'ant-design-vue'
import { useThemeStore, type ThemePref } from '../stores/theme'
import { useUiStore } from '../stores/ui'

const theme = useThemeStore()
const ui = useUiStore()

const OPTIONS = [
  { label: '跟随系统', value: 'system' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
]

/** Segmented 的 value 类型是 string | number，这里收敛回 ThemePref */
const value = computed(() => theme.pref)

function onChange(v: string | number): void {
  theme.setPref(String(v) as ThemePref)
}
</script>

<template>
  <a-drawer
    :open="ui.themeOpen"
    title="主题设置"
    placement="bottom"
    :height="230"
    :footer="null"
    @close="ui.closeTheme()"
  >
    <div class="theme-panel">
      <div class="theme-label">外观模式</div>
      <a-segmented block :options="OPTIONS" :value="value" @change="onChange" />
      <div class="theme-hint">
        选择「跟随系统」后，App 会随手机深色模式自动切换；当前生效的是
        <strong>{{ theme.isDark ? '深色' : '浅色' }}</strong> 主题。
        代码块与图解始终使用深色底，保证配色对比度。
      </div>
    </div>
  </a-drawer>
</template>
