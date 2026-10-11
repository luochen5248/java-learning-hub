/** HTML 转义：所有来自课程数据的字符串都先过这里，天然防注入 */
export function escapeHtml(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/* ---------------- HTML 白名单清洗 ---------------- */

// 富文本只允许这些标签（与数据编写约定一致 + 少量排版补充）
const ALLOW_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'code', 'pre', 'ul', 'ol', 'li',
  'blockquote', 'h4', 'h5', 'a', 'span', 'hr', 'sub', 'sup', 'del',
])
const VOID_TAGS = new Set(['br', 'hr'])

/**
 * 清洗富文本：删除脚本/事件属性/非白名单标签（保留其内部文字）。
 * 白名单标签只保留安全属性（a 的 href 仅允许 http/https/#）。
 */
export function sanitizeHtml(html: unknown): string {
  const src = String(html == null ? '' : html)
  // 先整段干掉 script / style / iframe，避免被标签拆解后残留可执行内容
  const safe = src
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*style[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/<\s*iframe[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')

  return safe.replace(
    /<\/?([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g,
    (full: string, tagName: string, attrs: string) => {
      const name = tagName.toLowerCase()
      if (!ALLOW_TAGS.has(name)) return '' // 非白名单：只丢标签，留文字
      const isClose = full[1] === '/'

      if (isClose) return VOID_TAGS.has(name) ? '' : '</' + name + '>'
      if (VOID_TAGS.has(name)) return '<' + name + '>'

      let keep = ''
      if (name === 'a') {
        const href = (attrs.match(/href\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i) || [])[1] || ''
        const url = href.replace(/^["']|["']$/g, '')
        if (/^(https?:\/\/|#|\/|\.\/)/i.test(url)) {
          keep = ' href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer"'
        }
      }
      return '<' + name + keep + '>'
    }
  )
}

/** SVG 清洗：只去掉脚本与事件属性，其余交由 CSS 容器控制尺寸 */
export function sanitizeSvg(svg: unknown): string {
  return String(svg == null ? '' : svg)
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
}
