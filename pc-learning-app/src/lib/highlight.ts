/**
 * highlight.ts —— 零依赖代码高亮（离线可用，禁止外部 CDN）
 *
 * 思路：先把源码切成「注释 / 字符串 / 注解 / 数字 / 关键字 / 类型 / 标点」几类 token，
 * 每类套一个 span，非 token 原文照抄（统一做 HTML 转义，天然防注入）。
 *
 * 说明：这里刻意保留项目自研实现而不是换成官方 highlight.js ——
 * 自研版只有百余行、零依赖、token class（tk-c / tk-s / ...）与既有样式表一一对应，
 * 换成官方库既要重写整套 token 配色，体积也从 3KB 涨到几十 KB，收益不抵成本。
 *
 * 支持：java / sql / yaml / xml / bash / properties / dockerfile / js / ts / json
 * 未登记的语言：只做转义，不做染色（保证不报错）。
 */

import { escapeHtml } from './sanitize'

/* ---------------- 语言配置 ---------------- */

const JAVA_KW = [
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
  'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
  'for', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
  'package', 'private', 'protected', 'public', 'record', 'return', 'short', 'static', 'sealed',
  'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try',
  'var', 'void', 'volatile', 'while', 'yield', 'true', 'false', 'null',
]

const JAVA_TYPES = [
  'String', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Character', 'Object', 'System',
  'List', 'Map', 'Set', 'ArrayList', 'HashMap', 'HashSet', 'Optional', 'Stream', 'Collectors',
  'Math', 'Arrays', 'Thread', 'Exception', 'RuntimeException', 'IOException',
]

const SQL_KW = [
  'select', 'from', 'where', 'and', 'or', 'not', 'insert', 'into', 'values', 'update', 'set',
  'delete', 'create', 'table', 'database', 'drop', 'alter', 'add', 'column', 'primary', 'key',
  'foreign', 'references', 'unique', 'default', 'null', 'is', 'in', 'like', 'between', 'order',
  'by', 'group', 'having', 'join', 'left', 'right', 'inner', 'outer', 'on', 'as', 'distinct',
  'limit', 'offset', 'count', 'sum', 'avg', 'max', 'min', 'case', 'when', 'then', 'else', 'end',
  'index', 'view', 'use', 'show', 'describe', 'desc', 'asc', 'union', 'with', 'exists', 'auto_increment',
]

const JS_KW = [
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch',
  'case', 'break', 'continue', 'new', 'class', 'extends', 'super', 'this', 'typeof', 'instanceof',
  'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'finally', 'throw',
  'interface', 'type', 'enum', 'implements', 'public', 'private', 'readonly', 'as', 'of', 'in',
  'true', 'false', 'null', 'undefined', 'void', 'delete', 'yield',
]

const JS_TYPES = [
  'String', 'Number', 'Boolean', 'Object', 'Array', 'Promise', 'Map', 'Set', 'Date', 'JSON',
  'console', 'window', 'document', 'Math', 'Error', 'RegExp',
]

const BASH_KW = [
  'cd', 'ls', 'll', 'pwd', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'echo', 'touch', 'chmod', 'chown',
  'sudo', 'apt', 'yum', 'curl', 'wget', 'tar', 'zip', 'unzip', 'grep', 'awk', 'sed', 'find',
  'ps', 'kill', 'top', 'df', 'du', 'ssh', 'scp', 'git', 'mvn', 'java', 'javac', 'docker',
  'docker-compose', 'mysql', 'redis-cli', 'systemctl', 'service', 'nohup', 'export', 'source',
  'if', 'then', 'fi', 'else', 'elif', 'for', 'while', 'do', 'done', 'case', 'esac', 'function',
  'return', 'exit', 'set', 'unset', 'alias',
]

const DOCKER_KW = [
  'FROM', 'RUN', 'CMD', 'LABEL', 'MAINTAINER', 'EXPOSE', 'ENV', 'ADD', 'COPY', 'ENTRYPOINT',
  'VOLUME', 'USER', 'WORKDIR', 'ARG', 'ONBUILD', 'STOPSIGNAL', 'HEALTHCHECK', 'SHELL', 'AS',
]

interface LangConfig {
  kw?: string[]
  types?: string[]
  block?: boolean
  slash?: boolean
  hash?: boolean
  dash?: boolean
  anno?: boolean
  dollar?: boolean
  flag?: boolean
  upper?: boolean
  ci?: boolean
  str?: boolean
}

// 通用配置：block=支持 /* */，slash=支持 //，hash=支持 #，dash=支持 --
const CONFIG: Record<string, LangConfig> = {
  java: { kw: JAVA_KW, types: JAVA_TYPES, block: true, slash: true, anno: true },
  js: { kw: JS_KW, types: JS_TYPES, block: true, slash: true },
  ts: { kw: JS_KW, types: JS_TYPES, block: true, slash: true },
  sql: { kw: SQL_KW, block: true, dash: true, ci: true },
  bash: { kw: BASH_KW, hash: true, dollar: true, flag: true },
  dockerfile: { kw: DOCKER_KW, hash: true, upper: true, flag: true },
  json: { str: true },
}

/* ---------------- 通用分词器 ---------------- */

type TokenClass = 'c' | 's' | 'k' | 't' | 'n' | 'a' | 'v' | 'f' | 'p'

function span(cls: TokenClass, text: string): string {
  return '<span class="tk tk-' + cls + '">' + escapeHtml(text) + '</span>'
}

/**
 * 按优先级拼接一个大正则，逐个 exec 扫描。
 * 顺序很关键：块注释 → 字符串 → 行注释（否则 URL 里的 // 会被误判成注释）
 */
function buildRegex(cfg: LangConfig): RegExp {
  const parts: string[] = []
  if (cfg.block) parts.push('(\\/\\*[\\s\\S]*?\\*\\/)')            // 1 块注释
  parts.push('("(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'|`(?:\\\\.|[^`\\\\])*`)') // 2 字符串
  if (cfg.hash) parts.push('(#[^\\n]*)')                            // 3 # 注释
  if (cfg.slash) parts.push('(\\/\\/[^\\n]*)')                      // 4 // 注释
  if (cfg.dash) parts.push('(--[^\\n]*)')                           // 5 -- 注释
  if (cfg.anno) parts.push('(@[A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)*)') // 6 注解
  if (cfg.dollar) parts.push('(\\$\\{?[A-Za-z_]\\w*\\}?)')          // 7 shell 变量
  if (cfg.flag) parts.push('((?:^|\\s)--?[A-Za-z][\\w-]*)')         // 8 命令行参数
  parts.push('(\\b0[xX][0-9a-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?[fFdDlL]?\\b)') // 9 数字
  if (cfg.kw && cfg.kw.length) parts.push('(\\b(?:' + cfg.kw.join('|') + ')\\b)') // 10 关键字
  if (cfg.types && cfg.types.length) parts.push('(\\b(?:' + cfg.types.join('|') + ')\\b)') // 11 类型
  return new RegExp(parts.join('|'), 'gm' + (cfg.ci ? 'i' : ''))
}

// 分组下标 → class，顺序与 buildRegex 的分组顺序一一对应
function classAt(cfg: LangConfig, i: number): TokenClass | null {
  const order: TokenClass[] = []
  if (cfg.block) order.push('c')
  order.push('s')
  if (cfg.hash) order.push('c')
  if (cfg.slash) order.push('c')
  if (cfg.dash) order.push('c')
  if (cfg.anno) order.push('a')
  if (cfg.dollar) order.push('v')
  if (cfg.flag) order.push('f')
  order.push('n')
  if (cfg.kw && cfg.kw.length) order.push('k')
  if (cfg.types && cfg.types.length) order.push('t')
  return order[i - 1] || null
}

function generic(code: string, cfg: LangConfig): string {
  const re = buildRegex(cfg)
  let out = ''
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) out += escapeHtml(code.slice(last, m.index))
    let cls: TokenClass | null = null
    for (let i = 1; i < m.length; i++) {
      if (m[i] !== undefined) {
        cls = classAt(cfg, i)
        break
      }
    }
    // shell 参数分组把前导空白也吃进来了，只染色参数本身
    let text = m[0]
    if (cls === 'f') {
      const lead = (text.match(/^\s*/) || [''])[0].length
      out += escapeHtml(text.slice(0, lead))
      text = text.slice(lead)
    }
    out += cls ? span(cls, text) : escapeHtml(text)
    last = m.index + m[0].length
    if (m[0].length === 0) re.lastIndex++ // 防空匹配死循环
  }
  out += escapeHtml(code.slice(last))
  return out
}

/* ---------------- XML ---------------- */

function xml(code: string): string {
  const re = /(<!--[\s\S]*?-->)|(<\/?)([A-Za-z_][\w:.-]*)|([A-Za-z_][\w:.-]*)(?=\s*=)|("[^"\n]*"|'[^'\n]*')|(\/?>)/g
  let out = ''
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) out += escapeHtml(code.slice(last, m.index))
    if (m[1]) out += span('c', m[1])
    else if (m[2]) out += span('p', m[2]) + span('t', m[3])
    else if (m[4]) out += span('a', m[4])
    else if (m[5]) out += span('s', m[5])
    else if (m[6]) out += span('p', m[6])
    last = m.index + m[0].length
  }
  out += escapeHtml(code.slice(last))
  return out
}

/* ---------------- properties（key=value，逐行） ---------------- */

function properties(code: string): string {
  return code
    .split('\n')
    .map((line) => {
      if (/^\s*[#!]/.test(line)) return span('c', line)
      const i = line.indexOf('=')
      const j = line.indexOf(':')
      const cut = i >= 0 ? i : j
      if (cut < 0) return escapeHtml(line)
      return span('k', line.slice(0, cut)) + span('p', line[cut]) + span('s', line.slice(cut + 1))
    })
    .join('\n')
}

/* ---------------- YAML（key: value，逐行 + token） ---------------- */

function highlightInline(text: string, re: RegExp): string {
  let out = ''
  let last = 0
  let m: RegExpExecArray | null
  re.lastIndex = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out += escapeHtml(text.slice(last, m.index))
    out += m[1] ? span('s', m[1]) : m[2] ? span('c', m[2]) : m[3] ? span('k', m[3]) : span('n', m[4])
    last = m.index + m[0].length
  }
  return out + escapeHtml(text.slice(last))
}

function yaml(code: string): string {
  const keyRe = /^(\s*(?:-\s+)?)([A-Za-z_][\w.\-/]*)(:)/
  const valRe = /("[^"\n]*"|'[^'\n]*')|(#[^\n]*)|(\b(?:true|false|null|yes|no|on|off)\b)|(\b\d+(?:\.\d+)?\b)/g
  return code
    .split('\n')
    .map((line) => {
      const km = line.match(keyRe)
      if (km) {
        const head = escapeHtml(km[1]) + span('k', km[2]) + span('p', km[3])
        const rest = line.slice(km[0].length)
        return head + highlightInline(rest, valRe)
      }
      // 纯列表项 / 注释行
      if (/^\s*#/.test(line)) return span('c', line)
      if (/^\s*-\s*/.test(line)) {
        const lead = (line.match(/^\s*-\s*/) || [''])[0]
        return span('p', lead) + highlightInline(line.replace(/^\s*-\s*/, ''), valRe)
      }
      return escapeHtml(line)
    })
    .join('\n')
}

/* ---------------- 出口 ---------------- */

/**
 * 高亮一段代码。
 * @param code 源码原文
 * @param lang java/sql/yaml/xml/bash/properties/dockerfile/js/ts/json
 */
export function highlight(code: unknown, lang?: string): string {
  const src = String(code == null ? '' : code)
  const key = String(lang || '').toLowerCase()
  if (key === 'xml' || key === 'html' || key === 'pom') return xml(src)
  if (key === 'properties' || key === 'props') return properties(src)
  if (key === 'yml' || key === 'yaml') return yaml(src)
  const cfg = CONFIG[key]
  if (cfg) return generic(src, cfg)
  // 未登记语言：也要转义，避免内容里的 < > 破坏结构
  return escapeHtml(src)
}

/** 语言显示名（代码块右上角小标签用） */
export function langLabel(lang?: string): string {
  const map: Record<string, string> = {
    java: 'Java', sql: 'SQL', yaml: 'YAML', yml: 'YAML', xml: 'XML', bash: 'Shell',
    properties: 'properties', props: 'properties', dockerfile: 'Dockerfile',
    js: 'JS', ts: 'TS', json: 'JSON',
  }
  const key = String(lang || '').toLowerCase()
  return map[key] || String(lang || 'text')
}
