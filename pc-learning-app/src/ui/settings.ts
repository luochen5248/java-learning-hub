/**
 * settings.ts —— 设置页：JDK 状态、环境信息、进度管理
 */

import { pc } from '../lib/pc-api'
import { getProgress, clearProgress } from '../lib/store'
import { loadModules } from '../data'

export function render(root: HTMLElement) {
  const done = getProgress().lessons.length
  const totalLessons = loadModules().reduce((n, m) => n + m.lessons.length, 0)

  root.innerHTML = `
  <div class="settings">
    <h2 style="margin:4px 0 18px;font-size:22px">设置</h2>

    <div class="card" style="margin-bottom:16px">
      <div class="set-row">
        <div class="info">
          <b>内置 JDK 运行环境</b>
          <span id="jdk-detail">正在检测…</span>
        </div>
        <span class="tag" id="jdk-state">…</span>
      </div>
      <div class="set-row">
        <div class="info">
          <b>运行方式</b>
          <span>JDK 11+ 单文件源码模式（java 文件名.java），无需手动编译；单次运行最长 15 秒自动结束。</span>
        </div>
      </div>
      <div class="set-row">
        <div class="info">
          <b>全屏</b>
          <span>按 F11 或顶栏 ⛶ 按钮切换全屏；Ctrl+滚轮缩放界面。</span>
        </div>
      </div>
      <div class="set-row">
        <div class="info">
          <b>运行环境版本</b>
          <span id="ver-detail">Electron -</span>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="set-row">
        <div class="info">
          <b>学习进度</b>
          <span>已完成 ${done} / ${totalLessons} 节课程，数据保存在本机浏览器存储中。</span>
        </div>
        <button class="btn danger sm" id="clear-btn">清空全部进度</button>
      </div>
      <div class="set-row">
        <div class="info">
          <b>关于</b>
          <span>Java 学习中枢 PC 版 · 内容改编自 runoob.com 与自研课程 · 仅供学习使用</span>
        </div>
      </div>
    </div>
  </div>`

  /* JDK 状态 */
  const stateEl = root.querySelector<HTMLElement>('#jdk-state')!
  const detailEl = root.querySelector<HTMLElement>('#jdk-detail')!
  if (!pc) {
    stateEl.textContent = '浏览器预览'
    detailEl.textContent = '在浏览器中打开时不具备 JDK 能力，请使用打包后的桌面应用。'
  } else {
    void pc.jdkInfo().then((info) => {
      if (info.found) {
        stateEl.textContent = '就绪'
        stateEl.style.color = 'var(--green)'
        detailEl.innerHTML = `${info.version.split('\n')[0]}<br /><code class="path">${info.javaExe}</code>`
      } else {
        stateEl.textContent = '未找到'
        stateEl.style.color = 'var(--red)'
        detailEl.textContent = '内置 JDK 缺失，请重新安装应用。'
      }
    })
    root.querySelector<HTMLElement>('#ver-detail')!.textContent =
      `Electron ${pc.versions.app} · Chromium ${pc.versions.chrome}`
  }

  /* 清空进度 */
  root.querySelector<HTMLButtonElement>('#clear-btn')!.addEventListener('click', () => {
    if (confirm('确定清空全部学习进度吗？此操作不可恢复。')) {
      clearProgress()
      root.querySelector<HTMLElement>('#clear-btn')!.textContent = '已清空 ✔'
    }
  })

  return { title: '设置', crumb: '环境与进度' }
}
