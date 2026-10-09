/**
 * theme.ts —— 三态主题（跟随系统 / 浅色 / 深色）
 *
 * 三件事必须一起做，缺一就会出现「界面是浅色、AntD 弹层是深色」这种花屏：
 *  1. documentElement[data-theme] —— 驱动自研样式表里的 CSS 变量；
 *  2. Ant Design Vue 的算法（defaultAlgorithm / darkAlgorithm）—— 驱动 AntD 组件；
 *  3. meta[theme-color] / meta[color-scheme] —— 驱动安卓 WebView 状态栏与原生控件配色。
 *
 * 偏好值写入 localStorage 的 jla.theme.v1，与 index.html 里的首屏预置脚本共用同一个 key。
 */

import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { theme as antdTheme } from 'ant-design-vue'

export type ThemePref = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'jla.theme.v1'

const FONT_STACK =
  'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Helvetica Neue", sans-serif'

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch (e) {
    /* 隐私模式下读不到，用默认值 */
  }
  return 'system'
}

export const useThemeStore = defineStore('theme', () => {
  const pref = ref<ThemePref>(readPref())

  const mq =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null

  // 系统级深浅色。初始值直接取 matchMedia，避免首帧判断错一次
  const systemDark = ref(mq ? mq.matches : true)

  const isDark = computed(() => pref.value === 'dark' || (pref.value === 'system' && systemDark.value))

  if (mq) {
    const onChange = (e: MediaQueryListEvent) => {
      systemDark.value = e.matches
    }
    // 旧版 WebView 只有已废弃的 addListener
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange)
    else if (typeof (mq as unknown as { addListener?: (cb: (e: MediaQueryListEvent) => void) => void }).addListener === 'function') {
      ;(mq as unknown as { addListener: (cb: (e: MediaQueryListEvent) => void) => void }).addListener(onChange)
    }
  }

  function apply(): void {
    const root = document.documentElement
    const dark = isDark.value
    root.setAttribute('data-theme', dark ? 'dark' : 'light')

    const tc = document.querySelector('meta[name="theme-color"]')
    if (tc) tc.setAttribute('content', dark ? '#0B1220' : '#F3F6FC')
    const scheme = document.querySelector('meta[name="color-scheme"]')
    if (scheme) scheme.setAttribute('content', dark ? 'dark light' : 'light dark')

    // 通知安卓壳同步状态栏图标：三态主题里「浅色 / 深色」是站内选择，可能与系统不一致，
    // 原生侧只看系统会把图标明暗判断反。接口由 MainActivity 的 ThemeBridge 注入，浏览器里为 undefined。
    const bridge = (
      window as unknown as { JavaHubTheme?: { setDark?: (dark: boolean) => void } }
    ).JavaHubTheme
    bridge?.setDark?.(dark)
  }

  function setPref(next: ThemePref): void {
    if (next !== 'system' && next !== 'light' && next !== 'dark') return
    pref.value = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch (e) {
      /* 写不进就只在本次会话生效 */
    }
  }

  watch(isDark, apply, { immediate: true })

  /**
   * AntD 主题配置。
   * 只覆盖少量种子 token：主色、圆角、字体、控件高度。
   * 面板底色之类的值交给 darkAlgorithm / defaultAlgorithm 自己算，
   * 一旦手动覆盖 colorBg* 很容易在 Drawer / Popover / Select 上出现层次错乱。
   */
  const antdThemeConfig = computed(() =>
    isDark.value
      ? {
          algorithm: antdTheme.darkAlgorithm,
          token: {
            colorPrimary: '#3B82F6',
            colorInfo: '#3B82F6',
            colorBgElevated: '#16223A',
            colorBgContainer: '#111A2C',
            colorBorder: 'rgba(148, 163, 184, 0.22)',
            borderRadius: 10,
            controlHeight: 38,
            fontFamily: FONT_STACK,
          },
        }
      : {
          algorithm: antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#2563EB',
            colorInfo: '#2563EB',
            borderRadius: 10,
            controlHeight: 38,
            fontFamily: FONT_STACK,
          },
        }
  )

  return { pref, systemDark, isDark, setPref, antdThemeConfig }
})
