/**
 * render.ts —— 课程内容块渲染器（PC 版全新实现）
 *
 * 覆盖 course.ts 定义的 10 种 section：text/steps/code/compare/table/
 * diagram/img/tip/warn/fe，全部输出转义/清洗后的静态 HTML，
 * 交互（代码跳练习、quiz 判分）由页面层事件委托处理。
 */

import type { Section, QuizQuestion } from '../types/course'
import { escapeHtml, sanitizeHtml, sanitizeSvg } from './sanitize'
import { highlight, langLabel } from './highlight'

/* ---------------- 代码块「去练习页跑」支持 ---------------- */

const runMap = new Map<string, { className: string; code: string; title: string }>()
let runSeq = 0

export function takeRunPayload(id: string) {
  return runMap.get(id)
}

function extractClassName(code: string): string {
  const m = code.match(/(?:class|record|enum|interface)\s+([A-Za-z][A-Za-z0-9_]*)/)
  return m ? m[1] : ''
}

/* ---------------- 各类内容块 ---------------- */

function codeBlock(s: Section): string {
  const code = String(s.code || '')
  const lang = s.lang || 'java'
  const runId = `r${++runSeq}`
  const cls = extractClassName(code)
  if (cls && lang === 'java') {
    runMap.set(runId, { className: cls, code, title: s.filename || cls })
  }
  const hasRun = !!(cls && lang === 'java')
  return `
  <div class="sec-block code-wrap" style="padding:0">
    <div class="code-bar">
      <span class="fname">${escapeHtml(s.filename || langLabel(lang))}</span>
      <span class="sp"></span>
      ${hasRun ? `<span class="run-mini" data-run="${runId}">▶ 在练习页打开</span>` : ''}
    </div>
    <pre class="codeblock">${highlight(code, lang)}</pre>
  </div>`
}

function stepsBlock(s: Section): string {
  const items = (s.items || []).map(
    (it, i) => `<div class="steps-item"><span class="no">${i + 1}</span><span>${it}</span></div>`,
  )
  return `
  <div class="sec-block card">
    ${s.title ? `<div class="steps-title">${escapeHtml(s.title)}</div>` : ''}
    ${items.join('')}
  </div>`
}

function tableBlock(s: Section): string {
  const head = (s.head || []).map((h) => `<th>${h}</th>`).join('')
  const rows = (s.rows || [])
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')
  return `
  <div class="sec-block card">
    ${s.title ? `<div class="tbl-title">${escapeHtml(s.title)}</div>` : ''}
    <div class="tablebox"><table class="tbl"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>
  </div>`
}

/** 类型 → 内容块 HTML（fe/前端对照块按富文本渲染） */
export function sectionHtml(s: Section): string {
  switch (s.type) {
    case 'text':
    case 'fe':
      return `<div class="sec-block card rich">${sanitizeHtml(s.html)}</div>`
    case 'steps':
      return stepsBlock(s)
    case 'code':
      return codeBlock(s)
    case 'compare':
    case 'table':
      return tableBlock(s)
    case 'diagram':
      return `
      <div class="sec-block card diagram-box">
        ${sanitizeSvg(s.svg)}
        ${s.caption ? `<div class="diagram-cap">${escapeHtml(s.caption)}</div>` : ''}
      </div>`
    case 'img':
      return `
      <div class="sec-block card imgbox">
        <img src="${escapeHtml(s.src || '')}" alt="${escapeHtml(s.caption || '')}" loading="lazy" />
        ${s.caption ? `<div class="diagram-cap">${escapeHtml(s.caption)}</div>` : ''}
      </div>`
    case 'tip':
      return `<div class="sec-block card rich tipbox"><div class="b-label">💡 提示</div>${sanitizeHtml(s.html)}</div>`
    case 'warn':
      return `<div class="sec-block card rich warnbox"><div class="b-label">⚠️ 注意</div>${sanitizeHtml(s.html)}</div>`
    default:
      return ''
  }
}

/* ---------------- 随堂测验 ---------------- */

export function quizHtml(questions: QuizQuestion[]): string {
  return questions
    .map((q, qi) => {
      const opts = q.options
        .map((o, oi) => {
          const letter = String.fromCharCode(65 + oi)
          return `<div class="quiz-opt" data-q="${qi}" data-i="${oi}"><span class="abcd">${letter}</span><span>${escapeHtml(o)}</span></div>`
        })
        .join('')
      return `
      <div class="quiz-item card" data-quiz-item="${qi}">
        <div class="quiz-q">${qi + 1}. ${escapeHtml(q.q)}</div>
        ${opts}
        <div class="quiz-explain" style="display:none"></div>
      </div>`
    })
    .join('')
}

/** 判分一题：点击后锁定该题并揭示正误与解析 */
export function judgeQuiz(root: HTMLElement, qi: number, oi: number, q: QuizQuestion): void {
  const item = root.querySelector<HTMLElement>(`[data-quiz-item="${qi}"]`)
  if (!item || item.dataset.locked === '1') return
  item.dataset.locked = '1'
  item.querySelectorAll<HTMLElement>('.quiz-opt').forEach((el) => {
    const i = Number(el.dataset.i)
    if (i === q.answer) el.classList.add('right')
    else if (i === oi) el.classList.add('wrong')
  })
  const ex = item.querySelector<HTMLElement>('.quiz-explain')
  if (ex && q.explain) {
    ex.textContent = `解析：${q.explain}`
    ex.style.display = 'block'
  }
}
