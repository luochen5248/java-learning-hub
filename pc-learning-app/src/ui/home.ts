/**
 * home.ts —— 首页：英雄区 + 学习统计 + 三阶段模块卡片
 */

import { loadModules, PHASES } from '../data'
import { getProgress } from '../lib/store'

export function render(root: HTMLElement): { title: string; crumb: string } {
  const mods = loadModules()
  const lessons = mods.flatMap((m) => m.lessons)
  const quizCount = mods.reduce((n, m) => n + m.lessons.reduce((k, l) => k + (l.quiz?.length || 0), 0), 0)
  const cardCount = mods.reduce((n, m) => n + m.flashcards.length, 0)
  const done = getProgress().lessons
  const doneCount = lessons.filter((l) => done.includes(l.id)).length

  // 继续学习：第一个未完成的课程
  let resume: { mod: string; lesson: string; label: string } | null = null
  for (const m of mods) {
    for (const l of m.lessons) {
      if (!done.includes(l.id)) {
        resume = { mod: m.id, lesson: l.id, label: `${m.title} · ${l.title}` }
        break
      }
    }
    if (resume) break
  }

  const phaseGroups = PHASES.map((ph) => {
    const list = mods.filter((m) => m.phase === ph.id)
    return `
    <div class="sec-title">${ph.name}</div>
    <div class="module-grid">
      ${list
        .map((m, i) => {
          const md = m.lessons.filter((l) => done.includes(l.id)).length
          return `
        <div class="module-card" data-go="#/lesson/${m.id}/${m.lessons[0]?.id || ''}">
          <img class="cover" src="${m.cover}" alt="" loading="lazy" onerror="this.style.display='none'" />
          <span class="num">M${String(mods.indexOf(m) + 1).padStart(2, '0')}</span>
          <h3>${m.icon} ${m.title}</h3>
          <p>${m.subtitle}</p>
          <div class="meta">
            <span class="tag phase-chip p${ph.id.slice(-1)}">${ph.short}</span>
            <span>${m.minutes} 分钟</span>
            <span>·</span><span>${m.lessons.length} 课</span>
            ${m.lessons.length ? `<span style="margin-left:auto;color:${md === m.lessons.length ? 'var(--green)' : 'var(--faint)'}">${md}/${m.lessons.length}</span>` : ''}
          </div>
        </div>`
        })
        .join('')}
    </div>`
  }).join('')

  root.innerHTML = `
    <div class="hero">
      <h1>把 Java 学成你的第二武器</h1>
      <p>面向前端工程师的 Java 后端学习中枢 PC 版：11 个模块 ${lessons.length} 节课程，内置 JDK 让每个示例点开就跑，runoob 实例精选随时上手练。</p>
      <div class="hero-actions">
        <button class="btn primary" data-go="#/course">📚 开始学习</button>
        <button class="btn" data-go="#/play">⌨️ 在线练习</button>
        ${resume ? `<button class="btn ghost" data-go="#/lesson/${resume.mod}/${resume.lesson}">▶ 继续学习：${resume.label}</button>` : ''}
      </div>
    </div>

    <div class="stat-row">
      <div class="stat"><b>${mods.length}</b><span>课程模块</span></div>
      <div class="stat"><b>${lessons.length}</b><span>精讲课程</span></div>
      <div class="stat"><b>${quizCount}</b><span>随堂测验题</span></div>
      <div class="stat"><b>${cardCount}</b><span>闪卡</span></div>
      <div class="stat"><b>${lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0}%</b><span>学习进度</span></div>
    </div>

    ${phaseGroups}
  `

  root.querySelectorAll<HTMLElement>('[data-go]').forEach((el) => {
    el.addEventListener('click', () => {
      location.hash = el.dataset.go || '#/'
    })
  })

  return { title: '首页', crumb: 'Java 学习中枢 · PC 版' }
}
