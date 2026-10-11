/**
 * jdk.cjs —— 内置 JDK 定位与执行器（主进程专用）
 *
 * 约定：JDK 由 tools/fetch-jdk.mjs 下载解压到 resources/jdk/，
 * 打包时经 electron-builder extraResources 复制到安装目录 resources/jdk/。
 * 目录结构容忍一层嵌套（jdk-21.0.x+y/bin/java.exe 或 jdk/bin/java.exe）。
 */
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const RUN_TIMEOUT_MS = 15_000
const MAX_OUTPUT_BYTES = 256 * 1024

/** 在给定目录下定位 bin/java.exe（容忍一层版本目录嵌套） */
function findJavaExe(baseDir) {
  if (!baseDir || !fs.existsSync(baseDir)) return null
  const direct = path.join(baseDir, 'bin', 'java.exe')
  if (fs.existsSync(direct)) return direct
  let entries = []
  try {
    entries = fs.readdirSync(baseDir, { withFileTypes: true })
  } catch {
    return null
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      const candidate = path.join(baseDir, e.name, 'bin', 'java.exe')
      if (fs.existsSync(candidate)) return candidate
    }
  }
  return null
}

/** 解析当前环境下 JDK 的根目录 */
function jdkRoot(isPackaged) {
  // __dirname = <app>/electron；开发态 JDK 放在 <app>/resources/jdk
  const devRoot = path.join(__dirname, '..', 'resources', 'jdk')
  if (!isPackaged && fs.existsSync(devRoot)) return devRoot
  if (isPackaged && process.resourcesPath) {
    const packed = path.join(process.resourcesPath, 'jdk')
    if (fs.existsSync(packed)) return packed
  }
  // 打包态找不到时回退开发态路径，便于 --dir 绿色包调试
  return devRoot
}

function resolveJavaExe(isPackaged) {
  return findJavaExe(jdkRoot(isPackaged))
}

/** Windows 下结束整个进程树 */
function killTree(pid) {
  if (process.platform === 'win32') {
    try {
      spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true })
    } catch {
      /* 忽略：进程可能已退出 */
    }
  } else {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      /* 同上 */
    }
  }
}

/** 运行 java -version 拿到版本信息（版本信息输出在 stderr） */
function javaVersion(javaExe) {
  return new Promise((resolve) => {
    let out = ''
    try {
      const child = spawn(javaExe, ['-version'], { windowsHide: true })
      child.stderr.on('data', (d) => {
        out += d.toString('utf8')
      })
      child.on('error', () => resolve(null))
      child.on('close', () => resolve(out.trim()))
    } catch {
      resolve(null)
    }
  })
}

/**
 * 单文件源码运行：`java Xxx.java`（JDK 11+ 特性，免 javac）。
 * 返回 { status, exitCode, stdout, stderr, durationMs, javaExe }
 */
function runJavaFile(javaExe, workDir, javaFile) {
  return new Promise((resolve) => {
    const started = Date.now()
    const args = [
      '-Dfile.encoding=UTF-8',
      '-Dstdout.encoding=UTF-8',
      '-Dstderr.encoding=UTF-8',
      '-XX:+UseSerialGC',
      '-Xss2m',
      javaFile,
    ]
    let stdout = Buffer.alloc(0)
    let stderr = Buffer.alloc(0)
    let timedOut = false
    let settled = false

    const child = spawn(javaExe, args, { cwd: workDir, windowsHide: true })
    const timer = setTimeout(() => {
      timedOut = true
      killTree(child.pid)
    }, RUN_TIMEOUT_MS)

    const cap = (buf, chunk) => (buf.length < MAX_OUTPUT_BYTES ? Buffer.concat([buf, chunk]) : buf)
    child.stdout.on('data', (c) => {
      stdout = cap(stdout, c)
    })
    child.stderr.on('data', (c) => {
      stderr = cap(stderr, c)
    })
    const finish = (exitCode) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      const dec = (b) => b.toString('utf8').replace(/\r\n/g, '\n')
      resolve({
        status: timedOut ? 'timeout' : 'done',
        exitCode,
        stdout: dec(stdout) + (stdout.length >= MAX_OUTPUT_BYTES ? '\n…（输出过长已截断）' : ''),
        stderr: dec(stderr) + (stderr.length >= MAX_OUTPUT_BYTES ? '\n…（输出过长已截断）' : ''),
        durationMs: Date.now() - started,
        javaExe,
      })
    }
    child.on('error', (err) => {
      settled = true
      clearTimeout(timer)
      resolve({
        status: 'error',
        exitCode: -1,
        stdout: '',
        stderr: String(err && err.message ? err.message : err),
        durationMs: Date.now() - started,
        javaExe,
      })
    })
    child.on('close', (code) => finish(code == null ? -1 : code))
  })
}

module.exports = { resolveJavaExe, javaVersion, runJavaFile, os }
