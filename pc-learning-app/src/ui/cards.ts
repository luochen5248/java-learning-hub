/**
 * cards.ts —— 闪卡复习：全模块闪卡池 + 翻卡 + 模块过滤
 */

import { loadModules } from '../data'
import type { Flashcard } from '../types/course'

interface CardItem extends Flashcard {
  modTitle: string
  modId: string
}

let pool: CardItem[] = []
let idx = 0
let filterMod = ''

export function render(root: HTMLElement, params: Record<string, string>) {
  const mods = loadModules()
  filterMod = params.mod || filterMod || ''
  idx = 0

  const all: CardItem[] = []
  mods.forEach((m) => {
    m.flashcards.forEach((f) => all.push({ ...f, modTitle: m.title, modId: m.id }))
  })
  pool = filterMod ? all.filter((c) => c.modId === filterMod) : all

  root.innerHTML = `
  <div class="cards-wrap">
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px">
      <button class="btn sm ${filterMod ? 'ghost' : 'primary'}" data-filter="">全部（${all.length}）</button>
      ${mods
        .filter((m) => m.flashcards.length > 0)
        .map(
          (m) =>
            `<button class="btn sm ${filterMod === m.id ? 'primary' : 'ghost'}" data-filter="${m.id}">${m.icon} ${m.title}（${m.flashcards.length}）</button>`,
        )
        .join('')}
    </div>
    <div id="card-stage"></div>
  </div>`

  root.querySelectorAll<HTMLElement>('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      filterMod = btn.dataset.filter || ''
      const hash = filterMod ? `#/cards?mod=${filterMod}` : '#/cards'
      if (location.hash === hash) {
        // 同 hash 重复点击不会触发 hashchange，手动刷新
        render(root, { mod: filterMod })
      } else {
        location.hash = hash
      }
    })
  })

  paintStage(root)
  return { title: '闪卡复习', crumb: `${pool.length} 张卡片` }
}

function paintStage(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('#card-stage')!
  if (pool.length === 0) {
    stage.innerHTML = `<div class="empty card"><div class="big">🃏</div><p>这个模块还没有闪卡</p></div>`
    return
  }
  const card = pool[Math.min(idx, pool.length - 1)]
  stage.innerHTML = `
  <div class="flashcard" id="fc">
    <div class="flashcard-inner">
      <div class="flash-face front">
        <span class="fc-tag tag">${card.tag || card.modTitle}</span>
        <div class="fc-text">${card.front}</div>
        <div class="fc-hint">点击卡片查看答案</div>
      </div>
      <div class="flash-face back">
        <span class="fc-tag tag">${card.modTitle}</span>
        <div class="fc-text">${card.back}</div>
        <div class="fc-hint">点击返回正面</div>
      </div>
    </div>
  </div>
  <div class="cards-ctrl">
    <button class="btn" id="prev-btn">← 上一张</button>
    <span class="idx">${idx + 1} / ${pool.length}</span>
    <button class="btn" id="next-btn">下一张 →</button>
  </div>`

  stage.querySelector<HTMLElement>('#fc')!.addEventListener('click', () => {
    stage.querySelector<HTMLElement>('#fc')!.classList.toggle('flipped')
  })
  stage.querySelector<HTMLButtonElement>('#prev-btn')!.addEventListener('click', () => {
    idx = (idx - 1 + pool.length) % pool.length
    paintStage(root)
  })
  stage.querySelector<HTMLButtonElement>('#next-btn')!.addEventListener('click', () => {
    idx = (idx + 1) % pool.length
    paintStage(root)
  })
}
