/**
 * icons.ts —— 全站图标路径常量
 *
 * 统一约定：viewBox 0 0 24 24，fill=none，stroke=currentColor，
 * stroke-width 1.8，linecap/linejoin 均为 round（见 AppIcon.vue）。
 * 只抽路径不抽组件，便于同样一份路径同时用于 SVG 字符串（地铁图）与组件渲染。
 */

export const ICON_HOME = '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>'
export const ICON_USER =
  '<circle cx="12" cy="8" r="3.4"/><path d="M4.5 20c1.4-3.6 4.1-5.4 7.5-5.4s6.1 1.8 7.5 5.4"/>'
export const ICON_BACK = '<path d="M15 5l-7 7 7 7"/>'
export const ICON_CHEV = '<path d="M9 5l7 7-7 7"/>'
export const ICON_CHECK =
  '<path d="M5 13l4 4L19 7"/>'
export const ICON_CLOSE = '<path d="M7 7l10 10M17 7L7 17"/>'

export const ICON_ALL = '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>'
export const ICON_MODULE =
  '<rect x="3.5" y="4" width="7" height="7" rx="1.6"/><rect x="13.5" y="4" width="7" height="7" rx="1.6"/><rect x="3.5" y="13" width="7" height="7" rx="1.6"/><rect x="13.5" y="13" width="7" height="7" rx="1.6"/>'
export const ICON_RANDOM = '<path d="M4 7h3l3.5 10H20"/><path d="M17 4l3 3-3 3"/><path d="M14 14l2.5 3H20"/>'
export const ICON_WRONG = '<path d="M5 5l14 14M19 5L5 19"/>'
export const ICON_CARD =
  '<rect x="3.5" y="4.5" width="17" height="12" rx="2"/><path d="M8 20h8"/><path d="M8 9.5l2.6 2.5L8 14.5"/>'
/** 底部 tabbar 的「刷题」图标，复用闪卡图标保持视觉统一 */
export const ICON_QUIZ = ICON_CARD

/** 主题入口图标（浅色 / 深色两态） */
export const ICON_SUN =
  '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"/>'
export const ICON_MOON = '<path d="M20 14.2A8 8 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2z"/>'

/** 空状态占位图标 */
export const ICON_EMPTY =
  '<path d="M4 7h16M4 12h10M4 17h13" stroke-linecap="round"/>'

export const MODE_ICON: Record<string, string> = {
  all: ICON_ALL,
  module: ICON_MODULE,
  random: ICON_RANDOM,
  wrong: ICON_WRONG,
}

/** 地铁图站点短标签（首页紧凑图空间有限，用短名） */
export const SHORT_LABEL: Record<string, string> = {
  m01: 'IDEA',
  m02: 'Maven',
  m03: 'Java',
  m04: 'Boot',
  m05: 'MySQL',
  m06: 'MyBatis',
  m07: '分层',
  m08: '部署',
  m09: 'Redis',
  m10: 'Docker',
}
