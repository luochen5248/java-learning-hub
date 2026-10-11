/**
 * learn.ts —— 课程学习：模块总览 + 左树右内容学习视图
 *
 * - renderCourse：按三阶段列出全部模块（含完成进度）
 * - renderLesson：左侧全量课程树（模块可折叠），右侧课程正文 +
 *   代码块（跳练习）+ 随堂测验 + 上一课/下一课导航
 */

import { loadModules, type CourseModule } from '../data'
import type { Lesson } from '../types/course'
import { sectionHtml, quizHtml, judgeQuiz, takeRunPayload } from '../lib/render'
import { getProgress, isLessonDone, markLessonDone, setQuizRight } from '../lib/store'

/* 树的折叠状态跨路由保留（内存级） */
const openMods = new Set<string>()

/* ============ 模块总览 ============ */

export function renderCourse(root: HTMLElement): { title: string; crumb: string } {
  const mods = loadModules()
  const done = new Set(getProgress().lessons)

  const groups = ['phase1', 'phase2', 'phase3']
    .map((ph, idx) => {
      const list = mods.filter((m) => m.phase === ph)
      if (list.length === 0) return ''
      const phName = ['阶段一 · 快速上手', '阶段二 · 写出完整后端', '阶段三 · 原理补课与进阶'][idx]
      return `
      <div class="sec-title">${phName}</div>
      <div class="module-grid">
        ${list
          .map((m) => courseCard(m, done))
          .join('')}
      </div>`
    })
    .join('')

  root.innerHTML = `<h2 style="margin:4px 0 18px;font-size:22px">全部课程</h2>${groups}`
  bindGo(root)
  return { title: '课程学习', crumb: `共 ${mods.length} 个模块` }
}

function courseCard(m: CourseModule, done: Set<string>): string {
  const md = m.lessons.filter((l) => done.has(l.id)).length
  const pct = m.lessons.length ? Math.round((md / m.lessons.length) * 100) : 0
  return `
  <div class="module-card" data-go="#/lesson/${m.id}/${m.lessons[0]?.id || ''}">
    <img class="cover" src="${m.cover}" alt="" loading="lazy" onerror="this.style.display='none'" />
    <span class="num">M${String(m.order).padStart(2, '0')}</span>
    <h3>${m.icon} ${m.title}</h3>
    <p>${m.subtitle}</p>
    <div class="meta">
      <span>${m.minutes} 分钟</span>
      ${m.lessons.length ? `<span>· ${md}/${m.lessons.length} 已学</span>` : '<span>· 建设中</span>'}
      <span style="margin-left:auto">${pct === 100 ? '✅' : pct + '%'}</span>
    </div>
  </div>`
}

function bindGo(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-go]').forEach((el) => {
    el.addEventListener('click', () => {
      location.hash = el.dataset.go || '#/'
    })
  })
}

/* ============ 学习视图 ============ */

export function renderLesson(root: HTMLElement, params: Record<string, string>): { title: string; crumb: string } {
  const mods = loadModules()
  const mod = mods.find((m) => m.id === params.mod) || mods[0]
  const lesson = mod.lessons.find((l) => l.id === params.lesson) || mod.lessons[0]

  // 当前模块在树里默认展开
  openMods.add(mod.id)

  root.innerHTML = `
  <div class="learn">
    <aside class="tree card" id="tree">${treeHtml(mods, mod.id, lesson?.id || '')}</aside>
    <section class="lesson-body" id="lesson-body">${lesson ? lessonHtml(mod, lesson) : emptyLessonHtml(mod)}</section>
  </div>`

  bindTree(root, mods, mod, lesson?.id || '')
  bindLessonBody(root, mod, lesson)

  return {
    title: lesson ? lesson.title : mod.title,
    crumb: `${mod.title}${lesson ? ' · ' + lesson.title : ''}`,
  }
}

function treeHtml(mods: CourseModule[], activeMod: string, activeLesson: string): string {
  return mods
    .map((m) => {
      const open = openMods.has(m.id)
      return `
      <div class="tree-mod ${open ? 'open' : ''}" data-mod="${m.id}">
        <div class="tree-mod-head" data-toggle="${m.id}">
          <span>${m.icon}</span><span>${m.title}</span><span class="arr">▶</span>
        </div>
        ${open
          ? m.lessons
              .map((l) => {
                const done = isLessonDone(l.id)
                return `
            <div class="tree-lesson ${l.id === activeLesson && m.id === activeMod ? 'active' : ''}"
                 data-lesson="${m.id}/${l.id}" title="${l.title}">
              <span>${l.title}</span>${done ? '<span class="done">✔</span>' : ''}
            </div>`
              })
              .join('')
          : ''}
      </div>`
    })
    .join('')
}

function bindTree(root: HTMLElement, mods: CourseModule[], activeMod: CourseModule, activeLesson: string) {
  const tree = root.querySelector<HTMLElement>('#tree')!
  tree.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    const toggle = t.closest<HTMLElement>('[data-toggle]')
    if (toggle) {
      const id = toggle.dataset.toggle!
      if (openMods.has(id)) openMods.delete(id)
      else openMods.add(id)
      tree.innerHTML = treeHtml(mods, activeMod.id, activeLesson)
      return
    }
    const item = t.closest<HTMLElement>('[data-lesson]')
    if (item) {
      location.hash = `#/lesson/${item.dataset.lesson}`
    }
  })
}

function emptyLessonHtml(mod: CourseModule): string {
  return `
  <div class="empty card">
    <div class="big">🚧</div>
    <p>${mod.title} 内容建设中，先学其他模块吧。</p>
  </div>`
}

function lessonHtml(mod: CourseModule, lesson: Lesson): string {
  const sections = (lesson.sections || []).map(sectionHtml).join('')
  const quiz = lesson.quiz?.length
    ? `<div class="sec-title">随堂测验 · ${lesson.quiz.length} 题</div><div class="quizbox">${quizHtml(lesson.quiz)}</div>`
    : ''
  const flat = loadModules().flatMap((m) => m.lessons.map((l) => ({ m, l })))
  const idx = flat.findIndex((x) => x.l.id === lesson.id)
  const prev = idx > 0 ? flat[idx - 1] : null
  const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null
  const done = isLessonDone(lesson.id)

  return `
  <div class="lesson-head card">
    <span class="tag phase-chip p${mod.phase.slice(-1)}">${mod.icon} ${mod.title}</span>
    <h1>${lesson.title}</h1>
    ${lesson.goal ? `<div class="goal">🎯 ${lesson.goal}</div>` : ''}
    <div style="margin-top:10px;color:var(--faint);font-size:12.5px">
      约 ${lesson.minutes || 10} 分钟 ${done ? ' · <span style="color:var(--green)">已完成 ✔</span>' : ''}
    </div>
  </div>

  ${sections}
  ${quiz}

  <div class="lesson-nav">
    ${prev ? `<button class="btn" data-nav-lesson="${prev.m.id}/${prev.l.id}">← ${prev.l.title}</button>` : '<span></span>'}
    <button class="btn primary" id="done-btn">${done ? '✅ 已完成' : '标记本课完成'}</button>
    ${next ? `<button class="btn" data-nav-lesson="${next.m.id}/${next.l.id}">${next.l.title} →</button>` : '<span></span>'}
  </div>`
}

function bindLessonBody(root: HTMLElement, mod: CourseModule, lesson: Lesson | undefined) {
  const body = root.querySelector<HTMLElement>('#lesson-body')!
  if (!lesson) return

  // 1. 代码块「去练习页跑」
  body.addEventListener('click', (e) => {
    const t = e.target as HTMLElement

    const runBtn = t.closest<HTMLElement>('[data-run]')
    if (runBtn) {
      const payload = takeRunPayload(runBtn.dataset.run || '')
      if (payload) {
        try {
          sessionStorage.setItem('pc-play-pending', JSON.stringify(payload))
        } catch {
          /* 忽略：练习页只是不带预填内容 */
        }
        location.hash = '#/play?src=lesson'
      }
      return
    }

    // 2. 随堂测验判分
    const opt = t.closest<HTMLElement>('.quiz-opt')
    if (opt && lesson.quiz) {
      judgeQuiz(body, Number(opt.dataset.q), Number(opt.dataset.i), lesson.quiz[Number(opt.dataset.q)])
      return
    }

    // 3. 上一课/下一课
    const nav = t.closest<HTMLElement>('[data-nav-lesson]')
    if (nav) {
      location.hash = `#/lesson/${nav.dataset.navLesson}`
    }
  })

  // 4. 完成按钮 + 测验全对自动完成
  const doneBtn = body.querySelector<HTMLButtonElement>('#done-btn')!
  doneBtn.addEventListener('click', () => {
    markLessonDone(lesson.id)
    doneBtn.textContent = '✅ 已完成'
    refreshTreeDone(root)
  })

  if (lesson.quiz?.length) {
    const quiz = lesson.quiz
    body.addEventListener('click', () => {
      // 每次点击后检查：所有题都锁定 → 统计答对数；全对则自动完成本课
      const items = body.querySelectorAll<HTMLElement>('[data-quiz-item]')
      let allLocked = items.length > 0
      items.forEach((item) => {
        if (item.dataset.locked !== '1') allLocked = false
      })
      if (allLocked) {
        const right = quiz.filter((_, qi) => {
          const item = body.querySelector<HTMLElement>(`[data-quiz-item="${qi}"]`)
          return item !== null && item.querySelectorAll('.quiz-opt.wrong').length === 0
        }).length
        setQuizRight(lesson.id, right)
        if (right === quiz.length && !isLessonDone(lesson.id)) {
          markLessonDone(lesson.id)
          doneBtn.textContent = '✅ 已完成'
          refreshTreeDone(root)
        }
      }
    })
  }
}

/** 完成状态变化后重绘树（保留展开态） */
function refreshTreeDone(root: HTMLElement) {
  const tree = root.querySelector<HTMLElement>('#tree')
  if (!tree) return
  const active = tree.querySelector('.tree-lesson.active')?.getAttribute('data-lesson')?.split('/') || []
  const mods = loadModules()
  tree.innerHTML = treeHtml(mods, active[0] || '', active[1] || '')
}
