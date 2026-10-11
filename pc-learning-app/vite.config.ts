import { defineConfig } from 'vite'

/**
 * PC 端渲染层构建配置：
 * - base './'：Electron 以 file:// 加载产物，必须使用相对路径
 * - outDir dist-pc：与 Electron 主进程 main.cjs 中的加载路径约定一致
 * - 纯 TypeScript 无框架插件，产物体积小、启动快
 */
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist-pc',
    emptyOutDir: true,
    target: 'chrome120',
  },
  server: {
    port: 5174,
    strictPort: true,
  },
})
