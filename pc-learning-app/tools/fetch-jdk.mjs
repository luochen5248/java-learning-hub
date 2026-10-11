/**
 * fetch-jdk.mjs —— 下载并解压内置 JDK（Temurin 21 LTS, Windows x64）
 *
 * 用法：npm run fetch-jdk
 * - 从清华 Adoptium 镜像解析最新的 JDK 21 Windows x64 zip
 * - 下载到 .tmp-jdk/，解压到 resources/jdk/（electron-builder extraResources 打包）
 * - 已存在则跳过（--force 可强制重新下载）
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const DEST = path.join(ROOT, 'resources', 'jdk')
const TMP = path.join(ROOT, '.tmp-jdk')
const LIST_URL = 'https://mirrors.tuna.tsinghua.edu.cn/Adoptium/21/jdk/x64/windows/'

const force = process.argv.includes('--force')

function log(msg) {
  process.stdout.write(`${msg}\n`)
}

/** 已就绪则跳过 */
function javaExeOf(dir) {
  const direct = path.join(dir, 'bin', 'java.exe')
  if (fs.existsSync(direct)) return direct
  if (fs.existsSync(dir)) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        const c = path.join(dir, e.name, 'bin', 'java.exe')
        if (fs.existsSync(c)) return c
      }
    }
  }
  return null
}

async function resolveZipUrl() {
  log(`[1/4] 读取镜像目录列表：${LIST_URL}`)
  const res = await fetch(LIST_URL)
  if (!res.ok) throw new Error(`镜像目录请求失败：HTTP ${res.status}`)
  const html = await res.text()
  const names = [...html.matchAll(/OpenJDK21U-jdk_x64_windows_hotspot_([\d._]+)\.zip/g)].map(
    (m) => m[0],
  )
  if (names.length === 0) throw new Error('目录列表里没有找到 JDK 21 Windows x64 zip')
  // 版本串按数字逐段比较，取最大
  const parsed = names.map((n) => {
    const v = n.match(/hotspot_([\d._]+)\.zip/)[1]
    return { name: n, parts: v.split(/[._]/).map((x) => parseInt(x, 10) || 0) }
  })
  parsed.sort((a, b) => {
    for (let i = 0; i < Math.max(a.parts.length, b.parts.length); i++) {
      const d = (a.parts[i] || 0) - (b.parts[i] || 0)
      if (d !== 0) return d
    }
    return 0
  })
  const picked = parsed[parsed.length - 1].name
  log(`      选中：${picked}`)
  return LIST_URL + picked
}

async function download(url, dest) {
  log(`[2/4] 下载中…`)
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`下载失败：HTTP ${res.status}`)
  const total = Number(res.headers.get('content-length') || 0)
  const file = fs.createWriteStream(dest)
  const { Readable } = await import('node:stream')
  await Readable.fromWeb(res.body).pipe(file)
  await new Promise((ok, bad) => {
    file.on('finish', ok)
    file.on('error', bad)
  })
  const mb = total ? `（${(total / 1024 / 1024).toFixed(1)} MB）` : ''
  log(`      完成${mb}`)
}

function extract(zip, dest) {
  log('[3/4] 解压到 resources/jdk …')
  fs.mkdirSync(dest, { recursive: true })
  // Windows 10+ 自带 bsdtar，支持 zip
  execFileSync('tar', ['-xf', zip, '-C', dest], { stdio: 'inherit' })
  // 把 jdk-21.x.x+x/ 的内容上提一层，让 resources/jdk/bin/java.exe 直接存在
  const entries = fs.readdirSync(dest, { withFileTypes: true }).filter((e) => e.isDirectory())
  if (entries.length === 1 && !fs.existsSync(path.join(dest, 'bin'))) {
    const inner = path.join(dest, entries[0].name)
    for (const item of fs.readdirSync(inner)) {
      fs.renameSync(path.join(inner, item), path.join(dest, item))
    }
    fs.rmdirSync(inner)
  }
}

function verify(dest) {
  log('[4/4] 校验 java -version …')
  const exe = javaExeOf(dest)
  if (!exe) throw new Error('解压后未找到 bin/java.exe')
  const out = execFileSync(exe, ['-version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim()
  log(out.split('\n')[0])
  log(`JDK 就绪：${exe}`)
}

const existing = javaExeOf(DEST)
if (existing && !force) {
  log(`JDK 已存在，跳过下载：${existing}（--force 可强制重下）`)
} else {
  fs.mkdirSync(TMP, { recursive: true })
  const zip = path.join(TMP, 'jdk21-win-x64.zip')
  const url = await resolveZipUrl()
  await download(url, zip)
  extract(zip, DEST)
  verify(DEST)
}
