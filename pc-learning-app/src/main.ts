/**
 * main.ts —— 应用壳 + hash 路由
 *
 * 布局：左侧导航 + 顶栏（JDK 状态、全屏）+ 内容区；
 * 页面模块只负责往 #view 里渲染，返回 { title, crumb } 供顶栏显示。
 */

import './styles/app.css'
import { pc } from './lib/pc-api'
import { render as renderHome } from './ui/home'
import { renderCourse, renderLesson } from './ui/learn'
import { render as renderPlay } from './ui/play'
import { render as renderCards } from './ui/cards'
import { render as renderSettings } from './ui/settings'

/* ---------------- 壳 ---------------- */

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div class="shell">
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-icon">☕</div>
      <div>
        <div class="brand-name">Java 学习中枢</div>
        <div class="brand-sub">PC EDITION</div>
      </div>
    </div>
    <div class="nav-item" data-nav="#/"><span class="ico">🏠</span>首页<span class="key">1</span></div>
    <div class="nav-item" data-nav="#/course"><span class="ico">📚</span>课程学习<span class="key">2</span></div>
    <div class="nav-item" data-nav="#/play"><span class="ico">⌨️</span>在线练习<span class="key">3</span></div>
    <div class="nav-item" data-nav="#/cards"><span class="ico">🃏</span>闪卡复习<span class="key">4</span></div>
    <div class="nav-item" data-nav="#/settings"><span class="ico">⚙️</span>设置<span class="key">5</span></div>
    <div class="sidebar-foot">
      v1.0.0 · 内置 JDK<br />
      离线学习 · 本地练码<br />
      Ctrl+1~5 快速切换
    </div>
  </aside>
  <div class="main">
    <header class="topbar">
      <div class="topbar-title" id="tb-title">首页</div>
      <div class="topbar-crumb" id="tb-crumb"></div>
      <div class="topbar-spacer"></div>
      <div class="jdk-pill" id="jdk-pill" title="内置 JDK 运行环境状态">
        <span class="dot"></span><span id="jdk-txt">正在检测内置 JDK…</span>
      </div>
      <button class="icon-btn" id="fs-btn" title="全屏切换（F11）">⛶</button>
    </header>
    <main class="content" id="view"></main>
  </div>
</div>`

/* ---------------- 工具 ---------------- */

export function toast(msg: string, ms = 2200) {
  document.querySelector('.toast')?.remove()
  const el = document.createElement('div')
  el.className = 'toast'
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), ms)
}

/** 顶栏状态显示（供设置/练习页刷新调用） */
export async function refreshJdkPill() {
  const pill = document.getElementById('jdk-pill')
  const txt = document.getElementById('jdk-txt')
  if (!pill || !txt) return
  if (!pc) {
    pill.classList.remove('ok')
    pill.classList.add('bad')
    txt.textContent = '浏览器预览 · 无内置 JDK'
    return
  }
  try {
    const info = await pc.jdkInfo()
    pill.classList.toggle('ok', info.found)
    pill.classList.toggle('bad', !info.found)
    const v = (info.version.match(/version "([^"]+)"/) || [])[1] || ''
    txt.textContent = info.found ? `内置 JDK ${v}` : '未找到内置 JDK'
  } catch {
    pill.classList.remove('ok')
    pill.classList.add('bad')
    txt.textContent = 'JDK 状态未知'
  }
}

/* ---------------- 路由 ---------------- */

type PageResult = { title?: string; crumb?: string }
type PageFn = (root: HTMLElement, params: Record<string, string>) => PageResult | void

function parseHash(): { path: string; params: Record<string, string> } {
  const raw = location.hash.replace(/^#/, '') || '/'
  const [pathPart, queryPart] = raw.split('?')
  const segs = pathPart.split('/').filter(Boolean)
  const params: Record<string, string> = {}
  new URLSearchParams(queryPart || '').forEach((v, k) => {
    params[k] = v
  })
  if (segs[0] === 'lesson' && segs[1]) params.mod = segs[1]
  if (segs[0] === 'lesson' && segs[2]) params.lesson = segs[2]
  return { path: '/' + (segs[0] || ''), params }
}

const ROUTES: Array<[string, PageFn]> = [
  ['/', renderHome],
  ['/course', renderCourse],
  ['/lesson', renderLesson],
  ['/play', renderPlay],
  ['/cards', renderCards],
  ['/settings', renderSettings],
]

function renderRoute() {
  const { path, params } = parseHash()
  const view = document.getElementById('view')!
  const route = ROUTES.find(([p]) => p === path) || ROUTES[0]

  // 侧栏高亮
  const navKey = path === '/lesson' ? '/course' : path
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', (el as HTMLElement).dataset.nav === `#${navKey}`)
  })
  // 练习页是全高应用型布局，去掉内容区留白
  view.classList.toggle('flush', path === '/play')

  const ret = route[1](view, params) || {}
  document.getElementById('tb-title')!.textContent = ret.title || 'Java 学习中枢'
  document.getElementById('tb-crumb')!.textContent = ret.crumb || ''
  view.scrollTop = 0
}

window.addEventListener('hashchange', renderRoute)

/* 侧栏点击导航 */
document.querySelectorAll<HTMLElement>('.nav-item').forEach((el) => {
  el.addEventListener('click', () => {
    location.hash = el.dataset.nav || '#/'
  })
})

/* Ctrl+1~5 快速切换 */
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && !e.shiftKey && !e.altKey) {
    const idx = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(e.code)
    if (idx >= 0) {
      e.preventDefault()
      location.hash = ['/', '/course', '/play', '/cards', '/settings'][idx]
    }
  }
})

/* ---------------- 全屏 + JDK ---------------- */

const fsBtn = document.getElementById('fs-btn')!

function paintFsBtn(isFullScreen: boolean) {
  fsBtn.textContent = isFullScreen ? '◗' : '⛶'
  fsBtn.title = isFullScreen ? '退出全屏（F11）' : '进入全屏（F11）'
}

fsBtn.addEventListener('click', () => {
  if (!pc) {
    toast('浏览器预览模式不支持全屏 API 切换，请用应用内 F11')
    return
  }
  void pc.fullscreen()
})

if (pc) {
  pc.onWinState((s) => paintFsBtn(s.isFullScreen))
  void pc.getState().then((s) => paintFsBtn(s.isFullScreen))
} else {
  paintFsBtn(false)
}

void refreshJdkPill()

/* 首帧 */
renderRoute()
