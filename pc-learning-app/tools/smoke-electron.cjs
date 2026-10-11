/* 一次性冒烟测试：不显示窗口，验证 Electron 启动、渲染加载、内置 JDK 解析后自动退出 */
const path = require('node:path')
const { app, BrowserWindow } = require('electron')

app.whenReady().then(async () => {
  try {
    const { resolveJavaExe, javaVersion } = require('../electron/jdk.cjs')
    const exe = resolveJavaExe(app.isPackaged)
    console.log('SMOKE java.exe:', exe || '未找到')
    if (exe) console.log('SMOKE version:', (await javaVersion(exe)).split('\n')[0])

    const win = new BrowserWindow({
      show: false,
      webPreferences: { preload: path.join(__dirname, '..', 'electron', 'preload.cjs') },
    })
    await win.loadFile(path.join(__dirname, '..', 'dist-pc', 'index.html'))
    const eval1 = await win.webContents.executeJavaScript('typeof window.pcApi === "object" ? "pcApi-ok" : "pcApi-missing"')
    const eval2 = await win.webContents.executeJavaScript('document.querySelector(".brand-name")?.textContent || "no-brand"')
    console.log('SMOKE preload:', eval1)
    console.log('SMOKE ui:', eval2)
    console.log('SMOKE OK')
    app.exit(0)
  } catch (err) {
    console.error('SMOKE FAIL:', err)
    app.exit(1)
  }
})
