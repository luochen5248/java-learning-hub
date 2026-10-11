/**
 * pc-api.ts —— window.pcApi 的类型声明与薄封装
 *
 * preload.cjs 通过 contextBridge 暴露能力；这里只做三件事：
 * 1. 声明类型；2. 统一判空（开发态用浏览器打开时降级为不可用）；
 * 3. 给页面层一个稳定入口。
 */

export interface RunResult {
  status: 'done' | 'timeout' | 'error' | 'busy'
  exitCode: number
  stdout: string
  stderr: string
  durationMs: number
}

export interface JdkInfo {
  found: boolean
  version: string
  javaExe: string
}

export interface WinState {
  isFullScreen: boolean
  isMaximized: boolean
}

interface PcApiShape {
  runJava(className: string, code: string): Promise<RunResult>
  jdkInfo(): Promise<JdkInfo>
  fullscreen(on?: boolean): Promise<boolean>
  getState(): Promise<WinState>
  onWinState(cb: (s: WinState) => void): void
  versions: { app: string; chrome: string }
}

/** Electron 之外的普通浏览器里没有 pcApi，降级为 null 并由页面提示 */
export const pc: PcApiShape | null =
  typeof window !== 'undefined' && (window as unknown as { pcApi?: PcApiShape }).pcApi
    ? (window as unknown as { pcApi: PcApiShape }).pcApi
    : null
