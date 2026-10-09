<script setup lang="ts">
/**
 * CodeSection.vue —— 代码块（固定深色底 + 自研高亮 + 一键复制）
 *
 * 复制优先用 navigator.clipboard；非安全上下文（部分 WebView / http）会失败，
 * 此时回退到 textarea + execCommand。两种都失败才提示「复制失败」。
 */
import { computed, ref } from 'vue'
import { highlight, langLabel } from '../../lib/highlight'

const props = defineProps<{
  lang?: string
  filename?: string
  code?: string
}>()

const codeEl = ref<HTMLElement | null>(null)
const btnText = ref('复制')
const btnOk = ref(false)

const lang = computed(() => props.lang || 'text')
const label = computed(() => langLabel(lang.value))
const body = computed(() => highlight(props.code, lang.value))

let restoreTimer: number | null = null

async function copy(): Promise<void> {
  const el = codeEl.value
  if (!el) return
  const text = el.textContent || ''
  let ok = false
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      ok = true
    }
  } catch (e) {
    /* 非安全上下文会失败，走下面的兜底 */
  }
  if (!ok) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      ok = document.execCommand('copy')
      ta.remove()
    } catch (e) {
      ok = false
    }
  }
  btnText.value = ok ? '已复制' : '复制失败'
  btnOk.value = ok
  if (restoreTimer !== null) window.clearTimeout(restoreTimer)
  restoreTimer = window.setTimeout(() => {
    btnText.value = '复制'
    btnOk.value = false
  }, 1400)
}
</script>

<template>
  <div class="code" :data-lang="lang">
    <div class="code-head">
      <span class="code-dots"><i></i><i></i><i></i></span>
      <span v-if="filename" class="code-file">{{ filename }}</span>
      <span class="code-lang">{{ label }}</span>
      <button type="button" class="code-copy" :class="{ 'is-ok': btnOk }" @click="copy">
        {{ btnText }}
      </button>
    </div>
    <pre class="code-pre"><code ref="codeEl" v-html="body"></code></pre>
  </div>
</template>
