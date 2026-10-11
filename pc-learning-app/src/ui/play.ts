/**
 * play.ts —— 在线练习页：左编辑器 / 右输出，点击运行调用内置 JDK
 *
 * - 左侧示例分类树（runoob 精选 44 例 + 课程代码跳转预填）
 * - CodeMirror 5（Java 语法高亮、行号、括号匹配、Ctrl+Enter 运行）
 * - 输出面板区分 stdout / stderr / 超时，并可对照示例预期输出
 */

import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/clike/clike.js'
import 'codemirror/addon/edit/closebrackets.js'
import 'codemirror/addon/edit/matchbrackets.js'
import 'codemirror/addon/selection/active-line.js'
import { CATS, EXAMPLES, type Example } from '../data/examples'
import { pc } from '../lib/pc-api'
import { escapeHtml } from '../lib/sanitize'

/* 从 Java 源码提取第一个类名（供单文件源码运行命名 .java 文件） */
function extractClassName(code: string): string {
  const m = code.match(/(?:class|record|enum|interface)\s+([A-Za-z][A-Za-z0-9_]*)/)
  return m ? m[1] : 'Main'
}

let editor: CodeMirror.Editor | null = null
let current: Example | null = null

export function render(root: HTMLElement, params: Record<string, string>) {
  root.innerHTML = `
  <div class="play">
    <div class="play-toolbar">
      <div>
        <div class="t" id="ex-title">在线练习</div>
        <div class="d" id="ex-desc"></div>
      </div>
      <div class="sp"></div>
      <span class="cls" id="ex-cls"></span>
      <button class="btn sm ghost" id="reset-btn" title="恢复示例原始代码">↺ 重置</button>
      <button class="btn primary" id="run-btn">▶ 运行（Ctrl+Enter）</button>
    </div>
    <div class="play-main">
      <div class="play-left">
        <aside class="ex-sidebar" id="ex-sidebar"></aside>
        <div class="editor-pane">
          <div class="editor-head">
            <span id="ed-file">Main.java</span>
            <span class="sp"></span>
            <span>UTF-8 · 单文件源码模式</span>
          </div>
          <div class="editor-wrap" id="editor-wrap"></div>
        </div>
      </div>
      <div class="play-right">
        <div class="out-head">
          <span>运行输出</span>
          <span id="out-badge"></span>
          <span class="sp"></span>
          <span id="out-meta"></span>
        </div>
        <div class="out-body" id="out-body">
          <div class="out-empty">
            <div class="big">⌨️</div>
            左侧选择一个示例，或直接编写你的 Java 代码，<br />
            点击「运行」在内置 JDK 中查看结果
          </div>
        </div>
      </div>
    </div>
  </div>`

  /* 示例侧栏 */
  const sidebar = root.querySelector<HTMLElement>('#ex-sidebar')!
  sidebar.innerHTML = CATS.map((cat) => {
    const list = EXAMPLES.filter((e) => e.cat === cat.id)
    if (list.length === 0) return ''
    return `
    <div class="ex-cat open" data-cat="${cat.id}">
      <div class="ex-cat-head"><span>${cat.icon}</span><span>${cat.name}</span><span class="arr">▶</span></div>
      ${list
        .map((e) => `<div class="ex-item" data-ex="${e.id}" title="${escapeHtml(e.title)}">${escapeHtml(e.title)}</div>`)
        .join('')}
    </div>`
  }).join('')

  sidebar.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    const head = t.closest<HTMLElement>('.ex-cat-head')
    if (head) {
      head.parentElement!.classList.toggle('open')
      return
    }
    const item = t.closest<HTMLElement>('[data-ex]')
    if (item) {
      loadExample(root, item.dataset.ex || '')
    }
  })

  /* CodeMirror 初始化 */
  editor = CodeMirror(root.querySelector<HTMLElement>('#editor-wrap')!, {
    value: '',
    mode: 'text/x-java',
    theme: 'pchub',
    lineNumbers: true,
    indentUnit: 4,
    smartIndent: true,
    tabSize: 4,
    indentWithTabs: false,
    autoCloseBrackets: true,
    matchBrackets: true,
    styleActiveLine: true,
    extraKeys: {
      'Ctrl-Enter': () => void runCode(root),
      'Cmd-Enter': () => void runCode(root),
    },
  } as CodeMirror.EditorConfiguration)

  editor.on('change', () => {
    const code = editor!.getValue()
    root.querySelector<HTMLElement>('#ex-cls')!.textContent = `${extractClassName(code)}.java`
  })

  /* 工具条 */
  root.querySelector<HTMLButtonElement>('#run-btn')!.addEventListener('click', () => void runCode(root))
  root.querySelector<HTMLButtonElement>('#reset-btn')!.addEventListener('click', () => {
    if (current) {
      editor!.setValue(current.code)
      toastMsg(root, '已恢复示例原始代码')
    }
  })

  /* 初始内容优先级：课程页跳转预填 > URL 指定示例 > 首个示例 */
  let pending: { className: string; code: string; title: string } | null = null
  try {
    const raw = sessionStorage.getItem('pc-play-pending')
    if (raw) {
      pending = JSON.parse(raw)
      sessionStorage.removeItem('pc-play-pending')
    }
  } catch {
    pending = null
  }

  if (pending) {
    current = null
    editor!.setValue(pending.code)
    root.querySelector<HTMLElement>('#ex-title')!.textContent = pending.title || '未保存的代码'
    root.querySelector<HTMLElement>('#ex-desc')!.textContent = params.src === 'lesson' ? '来自课程内容，点击运行查看结果' : ''
    root.querySelector<HTMLElement>('#ed-file')!.textContent = `${pending.className}.java`
    root.querySelector<HTMLElement>('#ex-cls')!.textContent = `${pending.className}.java`
    clearActive(root)
  } else {
    loadExample(root, params.ex || EXAMPLES[0]?.id || '')
  }

  /* 浏览器预览提示 */
  if (!pc) {
    renderOutput(root, {
      status: 'error',
      exitCode: -1,
      stdout: '',
      stderr: '当前是浏览器预览模式：运行 Java 需要打开 PC 桌面应用（内置 JDK）。打包安装后即可直接运行。',
      durationMs: 0,
    })
  }

  return { title: '在线练习', crumb: '内置 JDK · 单文件源码运行' }
}

/* ---------------- 示例载入 ---------------- */

function loadExample(root: HTMLElement, exId: string) {
  const ex = EXAMPLES.find((e) => e.id === exId) || EXAMPLES[0]
  if (!ex || !editor) return
  current = ex
  editor.setValue(ex.code)
  root.querySelector<HTMLElement>('#ex-title')!.textContent = ex.title
  root.querySelector<HTMLElement>('#ex-desc')!.textContent = ex.desc
  root.querySelector<HTMLElement>('#ed-file')!.textContent = `${ex.className}.java`
  root.querySelector<HTMLElement>('#ex-cls')!.textContent = `${ex.className}.java`
  root.querySelector<HTMLElement>('#out-body')!.innerHTML = `
    <div class="out-empty">
      <div class="big">▶</div>
      点击「运行」或按 Ctrl+Enter 查看输出
    </div>`
  root.querySelector<HTMLElement>('#out-badge')!.innerHTML = ''
  root.querySelector<HTMLElement>('#out-meta')!.textContent = ''
  clearActive(root)
  root.querySelector<HTMLElement>(`[data-ex="${ex.id}"]`)?.classList.add('active')
  root.querySelector<HTMLElement>(`[data-cat="${ex.cat}"]`)?.classList.add('open')
  editor.focus()
}

function clearActive(root: HTMLElement) {
  root.querySelectorAll('.ex-item.active').forEach((el) => el.classList.remove('active'))
}

function toastMsg(root: HTMLElement, msg: string) {
  // 简易行内提示：借用输出 meta 位置
  root.querySelector<HTMLElement>('#out-meta')!.textContent = msg
  setTimeout(() => {
    const el = root.querySelector<HTMLElement>('#out-meta')
    if (el && el.textContent === msg) el.textContent = ''
  }, 1800)
}

/* ---------------- 运行 ---------------- */

async function runCode(root: HTMLElement) {
  const runBtn = root.querySelector<HTMLButtonElement>('#run-btn')!
  if (!pc || !editor) {
    renderOutput(root, {
      status: 'error',
      exitCode: -1,
      stdout: '',
      stderr: '当前是浏览器预览模式：运行 Java 需要打开 PC 桌面应用（内置 JDK）。',
      durationMs: 0,
    })
    return
  }
  const code = editor.getValue()
  if (!code.trim()) {
    renderOutput(root, { status: 'error', exitCode: -1, stdout: '', stderr: '代码为空，先写点什么吧。', durationMs: 0 })
    return
  }

  runBtn.disabled = true
  runBtn.textContent = '⏳ 运行中…'
  renderOutput(root, null) // 运行中占位

  const result = await pc.runJava(extractClassName(code), code)

  runBtn.disabled = false
  runBtn.textContent = '▶ 运行（Ctrl+Enter）'
  renderOutput(root, result)

  // 与示例预期输出比对（一致时给正反馈）
  if (current && result.status === 'done') {
    const same = result.stdout.trim() === current.expect.trim()
    const badge = root.querySelector<HTMLElement>('#out-badge')!
    if (same && result.exitCode === 0) {
      badge.insertAdjacentHTML('beforeend', `<span class="badge ok" style="margin-left:8px">✔ 与预期输出一致</span>`)
    }
  }
}

interface RunResultLike {
  status: 'done' | 'timeout' | 'error' | 'busy'
  exitCode: number
  stdout: string
  stderr: string
  durationMs: number
}

function renderOutput(root: HTMLElement, r: RunResultLike | null) {
  const badge = root.querySelector<HTMLElement>('#out-badge')!
  const meta = root.querySelector<HTMLElement>('#out-meta')!
  const body = root.querySelector<HTMLElement>('#out-body')!

  if (r === null) {
    badge.innerHTML = ''
    meta.textContent = ''
    body.innerHTML = `<div class="out-empty"><div class="big">⏳</div>正在编译并运行…</div>`
    return
  }

  const statusText: Record<RunResultLike['status'], string> = {
    done: r.exitCode === 0 ? '运行成功' : `异常退出（code ${r.exitCode}）`,
    timeout: '运行超时（15 秒强制结束）',
    error: '无法运行',
    busy: '任务繁忙',
  }
  const cls = r.status === 'done' && r.exitCode === 0 ? 'ok' : r.status === 'timeout' ? 'tmo' : 'err'
  badge.innerHTML = `<span class="badge ${cls}">${statusText[r.status]}</span>`
  meta.textContent = r.durationMs ? `${(r.durationMs / 1000).toFixed(2)} s` : ''

  const stdoutHtml = r.stdout ? `<div class="out-stdout">${escapeHtml(r.stdout)}</div>` : ''
  const stderrHtml = r.stderr ? `<div class="out-stderr">${escapeHtml(r.stderr)}</div>` : ''
  body.innerHTML =
    stdoutHtml + stderrHtml ||
    `<div class="out-empty"><div class="big">🤔</div>程序没有输出<br/><span style="font-size:12px">试试 System.out.println(...)？</span></div>`
}
