/**
 * preload.cjs —— 安全桥接层
 *
 * 只暴露白名单方法，渲染层通过 window.pcApi 访问能力；
 * contextIsolation + sandbox 开启，渲染层拿不到 Node 能力。
 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('pcApi', {
  /** 运行一段 Java 源码（单文件源码模式） */
  runJava: (className, code) => ipcRenderer.invoke('run-java', { className, code }),
  /** 内置 JDK 状态：{ found, version, javaExe } */
  jdkInfo: () => ipcRenderer.invoke('jdk-info'),
  /** 全屏：true 进全屏 / false 退出 / 缺省则切换 */
  fullscreen: (on) => ipcRenderer.invoke('win:fullscreen', on),
  /** 当前窗口状态 */
  getState: () => ipcRenderer.invoke('win:get-state'),
  /** 订阅窗口状态变化（全屏/最大化） */
  onWinState: (cb) => {
    ipcRenderer.on('win:state', (_e, state) => cb(state))
  },
  /** 进程信息（版本号展示用） */
  versions: {
    app: process.versions.electron || '',
    chrome: process.versions.chrome || '',
  },
})
