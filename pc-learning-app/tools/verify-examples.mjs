/**
 * verify-examples.mjs —— 用内置 JDK 批量实测 examples.ts 中的全部示例
 *
 * 用法：npm run verify-examples （需先 npm run fetch-jdk）
 * - 用 vite 自带的 esbuild 把 examples.ts 编译成可 import 的 mjs
 * - 逐个示例写入临时目录 → java 单文件运行 → 与 expect 字段比对
 * - 全部通过退出码 0；任何不一致会打印 diff
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const { resolveJavaExe, runJavaFile } = require(path.join(ROOT, 'electron', 'jdk.cjs'))

const isPackaged = false
const javaExe = resolveJavaExe(isPackaged)
if (!javaExe) {
  console.error('未找到内置 JDK，请先执行：npm run fetch-jdk')
  process.exit(2)
}
console.log(`JDK：${javaExe}`)

/* 用 esbuild 把 examples.ts 编译为 mjs 再导入 */
const OUT = path.join(ROOT, '.tmp-verify')
fs.mkdirSync(OUT, { recursive: true })
const esbuild = require('esbuild')
await esbuild.build({
  entryPoints: [path.join(ROOT, 'src', 'data', 'examples.ts')],
  bundle: true,
  format: 'esm',
  outfile: path.join(OUT, 'examples.mjs'),
  logLevel: 'silent',
})
const { EXAMPLES } = await import(
  `file://${path.join(OUT, 'examples.mjs').replace(/\\/g, '/')}`
)

console.log(`共 ${EXAMPLES.length} 个示例，开始逐个实测…\n`)

let pass = 0
const fails = []
for (const ex of EXAMPLES) {
  let workDir = ''
  try {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'javahub-verify-'))
    const javaFile = path.join(workDir, `${ex.className}.java`)
    fs.writeFileSync(javaFile, ex.code, 'utf8')
    const r = await runJavaFile(javaExe, workDir, javaFile)

    if (r.status !== 'done') {
      fails.push({ ex, why: `status=${r.status}`, stderr: r.stderr, stdout: r.stdout, expect: ex.expect })
      console.log(`✗ ${ex.id} ${ex.title} —— ${r.status}`)
      continue
    }
    if (r.exitCode !== 0) {
      fails.push({ ex, why: `exitCode=${r.exitCode}`, stderr: r.stderr, stdout: r.stdout, expect: ex.expect })
      console.log(`✗ ${ex.id} ${ex.title} —— 退出码 ${r.exitCode}`)
      continue
    }
    const got = r.stdout.replace(/\r\n/g, '\n').trim()
    const want = String(ex.expect || '').replace(/\r\n/g, '\n').trim()
    if (got === want) {
      pass++
      console.log(`✓ ${ex.id} ${ex.title}（${r.durationMs}ms）`)
    } else {
      fails.push({ ex, why: '输出与 expect 不一致', stderr: r.stderr, stdout: got, expect: want })
      console.log(`✗ ${ex.id} ${ex.title} —— 输出不一致`)
    }
  } catch (err) {
    fails.push({ ex, why: String(err), stderr: '', stdout: '', expect: ex.expect })
    console.log(`✗ ${ex.id} ${ex.title} —— 异常：${err}`)
  } finally {
    if (workDir) {
      try {
        fs.rmSync(workDir, { recursive: true, force: true })
      } catch {
        /* ignore */
      }
    }
  }
}

console.log(`\n========== 结果：${pass}/${EXAMPLES.length} 通过 ==========`)
for (const f of fails) {
  console.log(`\n----- ${f.ex.id} ${f.ex.title}（${f.why}）-----`)
  console.log(`[预期 expect]`)
  console.log(f.expect)
  console.log(`[实际 stdout]`)
  console.log(f.stdout)
  if (f.stderr) {
    console.log(`[stderr]`)
    console.log(f.stderr)
  }
}

fs.rmSync(OUT, { recursive: true, force: true })
process.exit(fails.length === 0 ? 0 : 1)
