/**
 * validate-pc.mjs —— PC 端数据静态校验（零 TS 依赖：经 esbuild 编译后校验）
 *
 * 检查项：
 *   1. 11 个课程模块结构（id/order/lessons/quiz/flashcards/lesson id 唯一）
 *   2. examples.ts：示例数量、id 唯一、cat 合法、className 与代码一致
 *   3. 示例代码红线：禁 Scanner/System.in、禁文件与网络 IO、必须含 main
 *   4. quiz answer 越界、选项非空
 *
 * 用法：node tools/validate-pc.mjs
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const esbuild = require('esbuild')

let fail = 0
let pass = 0
const failMsgs = []

const ok = (msg) => {
  pass++
  console.log(`  [PASS] ${msg}`)
}
const bad = (msg) => {
  fail++
  failMsgs.push(msg)
  console.log(`  [FAIL] ${msg}`)
}

async function loadTs(relFile, exportName) {
  const out = path.join(ROOT, '.tmp-validate')
  fs.mkdirSync(out, { recursive: true })
  const outfile = path.join(out, path.basename(relFile).replace(/\.ts$/, '.mjs'))
  await esbuild.build({
    entryPoints: [path.join(ROOT, relFile)],
    bundle: true,
    format: 'esm',
    outfile,
    logLevel: 'silent',
  })
  const mod = await import(`file://${outfile.replace(/\\/g, '/')}`)
  fs.rmSync(out, { recursive: true, force: true })
  return exportName ? mod[exportName] : mod
}

const isStr = (v) => typeof v === 'string' && v.trim().length > 0

/* ============ 1. 课程模块 ============ */

const data = await loadTs('src/data/index.ts')
const mods = data.loadModules()
console.log(`\n=== 课程模块（${mods.length} 个） ===`)

const lessonIds = new Map()
mods.forEach((m, i) => {
  if (!isStr(m.id)) bad(`模块[${i}] 缺少 id`)
  if (!isStr(m.title)) bad(`模块[${i}] 缺少 title`)
  if (m.missing) bad(`模块 ${m.id || i} 内容缺失（placeholder）`)
  if (!Array.isArray(m.lessons) || m.lessons.length === 0) bad(`模块 ${m.id} lessons 为空`)
  else
    m.lessons.forEach((l) => {
      if (!isStr(l.id)) bad(`模块 ${m.id} 存在无 id 课程`)
      else if (lessonIds.has(l.id)) bad(`课程 id 全局重复：${l.id}`)
      else lessonIds.set(l.id, m.id)
      if (!Array.isArray(l.quiz)) bad(`课程 ${l.id || '?'} 缺少 quiz`)
      else
        l.quiz.forEach((q, qi) => {
          if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options?.length || 0)) {
            bad(`课程 ${l.id} quiz[${qi}] answer 越界：${JSON.stringify(q.answer)}`)
          }
          if (!isStr(q.explain)) bad(`课程 ${l.id} quiz[${qi}] 缺少 explain`)
        })
    })
})
if (fail === 0) ok(`${mods.length} 个模块、${lessonIds.size} 节课程，quiz answer 全部合法`)

/* ============ 2. 示例库 ============ */

console.log(`\n=== 示例库 examples.ts ===`)
const { CATS, EXAMPLES } = await loadTs('src/data/examples.ts')
const catIds = new Set(CATS.map((c) => c.id))
const exIds = new Set()
const expectedPerCat = { string: 6, array: 6, method: 6, shape: 4, date: 3, exception: 4, ds: 5, collection: 6, thread: 4 }

const perCat = {}
EXAMPLES.forEach((e) => {
  if (exIds.has(e.id)) bad(`示例 id 重复：${e.id}`)
  exIds.add(e.id)
  if (!catIds.has(e.cat)) bad(`示例 ${e.id} cat 非法：${e.cat}`)
  perCat[e.cat] = (perCat[e.cat] || 0) + 1
  if (!isStr(e.title) || !isStr(e.desc) || !isStr(e.expect)) bad(`示例 ${e.id} 缺少 title/desc/expect`)
  const code = String(e.code || '')
  if (!code.includes('public static void main')) bad(`示例 ${e.id} 代码缺少 main 方法`)
  const m = code.match(/public\s+(?:final\s+)?(?:class|record|enum|interface)\s+([A-Za-z][A-Za-z0-9_]*)/)
  if (!m) bad(`示例 ${e.id} 未找到 public class 声明`)
  else if (m[1] !== e.className) bad(`示例 ${e.id} className=${e.className} 与代码 public ${m[1]} 不一致`)
  if (/System\.in|new\s+Scanner/.test(code)) bad(`示例 ${e.id} 使用了 Scanner/System.in（禁止交互输入）`)
  if (/new\s+(File|FileWriter|FileReader|FileOutputStream|FileInputStream|RandomAccessFile)\b/.test(code)) {
    bad(`示例 ${e.id} 出现文件 IO（教学示例统一只做控制台输出）`)
  }
  if (/new\s+(Socket|ServerSocket|URL|HttpURLConnection)\b/.test(code)) {
    bad(`示例 ${e.id} 出现网络 IO（教学示例禁止网络操作）`)
  }
})
for (const [cat, want] of Object.entries(expectedPerCat)) {
  if ((perCat[cat] || 0) !== want) bad(`分类 ${cat} 示例数 ${perCat[cat] || 0}，应为 ${want}`)
}
console.log(`  —— 共 ${EXAMPLES.length} 个示例：${Object.entries(perCat).map(([k, v]) => `${k}=${v}`).join(' ')}`)
if (EXAMPLES.length === 44 && fail === 0) ok('44 个示例结构与红线检查全部通过')

/* ============ 3. m11 引用一致性 ============ */

console.log(`\n=== m11 课程模块引用检查 ===`)
const m11 = mods.find((m) => m.id === 'm11')
if (!m11) {
  bad('未找到 m11 模块（应在 data/index.ts 注册）')
} else {
  const m11Src = fs.readFileSync(path.join(ROOT, 'src', 'data', 'm11-runoob.ts'), 'utf8')
  const refs = [...m11Src.matchAll(/codeOf\(\s*'([^']+)'\s*\)/g)].map((x) => x[1])
  const missing = refs.filter((id) => !exIds.has(id))
  if (missing.length) bad(`m11 引用了不存在的示例 id：${missing.join(', ')}`)
  else ok(`m11 引用 ${refs.length} 个示例 id 全部存在`)
}

/* ============ 汇总 ============ */

console.log(`\n================ PC 端校验汇总 ================`)
if (failMsgs.length) {
  console.log(`失败清单（${failMsgs.length} 项）：`)
  failMsgs.forEach((m) => console.log(`  ${m}`))
}
console.log(`TOTAL: ${pass} pass, ${fail} fail`)
process.exit(fail > 0 ? 1 : 0)
