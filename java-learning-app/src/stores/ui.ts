/**
 * ui.ts —— 全局 UI 开关（目前只有主题抽屉）
 *
 * 单独抽一个极小的 store，是为了让「顶栏的主题按钮」与「App 根节点的抽屉」
 * 不必靠层层 props / emit 传递：顶栏只管调用 openTheme()，抽屉监听开关。
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const themeOpen = ref(false)

  function openTheme(): void {
    themeOpen.value = true
  }

  function closeTheme(): void {
    themeOpen.value = false
  }

  return { themeOpen, openTheme, closeTheme }
})
