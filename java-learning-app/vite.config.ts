import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * 构建约束：
 *  1. base 必须是相对路径 './'。产物最终跑在安卓 WebView 的
 *     https://appassets.androidplatform.net/assets/ 下，绝对路径会 404 白屏。
 *  2. assetsDir 用 'static'，避免和 public/assets（课程图片目录）撞名。
 *  3. 课程数据用动态 import 分模块加载，Vite 会自动按模块切 chunk。
 */
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    chunkSizeWarningLimit: 1600,
  },
})
