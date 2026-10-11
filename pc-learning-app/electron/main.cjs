/**
 * main.cjs —— Electron 主进程
 *
 * 职责：窗口（启动最大化 + F11 全屏）、内置 JDK 的 IPC 运行器、
 * contextIsolation/sandbox 全开的安全渲染加载。
 */
const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { resolveJavaExe, javaVersion, runJavaFile } = require('./jdk.cjs')

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || ''

/** className 白名单：防止经文件名注入路径 */
const CLASS_NAME_RE = /^[A-Za-z][A-Za-z0-9_]{0,63}$/

/** 同一时间只允许一个运行任务（简单可靠的并发控制） */
let running = false

app.setAppUserModelId('com.javahub.pc')

// 单实例锁：重复启动时聚焦已有窗口
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

/** @type {BrowserWindow | null} */
let win = null

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 680,
    show: false,
    backgroundColor: '#0b1020',
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  })

  if (DEV_SERVER_URL) {
    win.loadURL(DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist-pc', 'index.html'))
  }

  win.once('ready-to-show', () => {
    if (!win) return
    win.maximize() // 启动即最大化
    win.show()
  })

  // 状态变化同步给渲染层（全屏/最大化按钮联动）
  const pushState = () => {
    if (!win || win.isDestroyed()) return
    win.webContents.send('win:state', {
      isFullScreen: win.isFullScreen(),
      isMaximized: win.isMaximized(),
    })
  }
  win.on('maximize', pushState)
  win.on('unmaximize', pushState)
  win.on('enter-full-screen', pushState)
  win.on('leave-full-screen', pushState)
  win.on('closed', () => {
    win = null
  })
}

function buildMenu() {
  const template = [
    {
      label: '视图',
      submenu: [
        { label: '全屏切换', accelerator: 'F11', click: () => toggleFullscreen() },
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', click: (_m, w) => w && w.reload() },
        { type: 'separator' },
        { label: '放大', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: '重置缩放', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: '退出', accelerator: 'Alt+F4', role: 'quit' },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function toggleFullscreen() {
  if (!win) return false
  const next = !win.isFullScreen()
  win.setFullScreen(next)
  return next
}

/* ---------------- IPC ---------------- */

ipcMain.handle('win:fullscreen', (_e, on) => {
  if (!win) return false
  if (typeof on === 'boolean') {
    win.setFullScreen(on)
    return on
  }
  return toggleFullscreen()
})

ipcMain.handle('win:get-state', () => {
  if (!win) return { isFullScreen: false, isMaximized: false }
  return { isFullScreen: win.isFullScreen(), isMaximized: win.isMaximized() }
})

ipcMain.handle('jdk-info', async () => {
  const javaExe = resolveJavaExe(app.isPackaged)
  if (!javaExe) {
    return { found: false, version: '', javaExe: '' }
  }
  const version = (await javaVersion(javaExe)) || ''
  return { found: true, version, javaExe }
})

ipcMain.handle('run-java', async (_e, payload) => {
  const { className, code } = payload || {}
  if (typeof className !== 'string' || !CLASS_NAME_RE.test(className)) {
    return { status: 'error', exitCode: -1, stdout: '', stderr: '类名不合法', durationMs: 0 }
  }
  if (typeof code !== 'string' || code.length === 0 || code.length > 120_000) {
    return { status: 'error', exitCode: -1, stdout: '', stderr: '代码为空或过长（上限 12 万字符）', durationMs: 0 }
  }
  if (running) {
    return { status: 'busy', exitCode: -1, stdout: '', stderr: '已有任务在运行，请稍候', durationMs: 0 }
  }
  const javaExe = resolveJavaExe(app.isPackaged)
  if (!javaExe) {
    return { status: 'error', exitCode: -1, stdout: '', stderr: '未找到内置 JDK，请重新安装应用', durationMs: 0 }
  }

  running = true
  let workDir = ''
  try {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'javahub-run-'))
    const javaFile = path.join(workDir, `${className}.java`)
    fs.writeFileSync(javaFile, code, 'utf8')
    const result = await runJavaFile(javaExe, workDir, javaFile)
    return result
  } catch (err) {
    return { status: 'error', exitCode: -1, stdout: '', stderr: String(err), durationMs: 0 }
  } finally {
    running = false
    if (workDir) {
      try {
        fs.rmSync(workDir, { recursive: true, force: true })
      } catch {
        /* 清理失败不影响结果返回 */
      }
    }
  }
})

/* ---------------- 生命周期 ---------------- */

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.whenReady().then(() => {
  buildMenu()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
