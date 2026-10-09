/**
 * router/index.ts —— hash 路由
 *
 * 用 hash 模式（createWebHashHistory）而不是 history 模式：
 * 产物跑在安卓 WebView 的 file/asset 协议下，history 模式的深链会 404。
 * 路由名与旧版 parseHash() 的判定结果一一对应，保证老书签（#/lesson/xxx）仍可直达。
 */

import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/route', name: 'route', component: () => import('../views/RouteView.vue') },
    { path: '/module/:id', name: 'module', component: () => import('../views/ModuleView.vue'), props: true },
    { path: '/lesson/:id', name: 'lesson', component: () => import('../views/LessonView.vue'), props: true },
    { path: '/quiz', name: 'quiz', component: () => import('../views/QuizView.vue') },
    { path: '/quiz/run', name: 'quizRun', component: () => import('../views/QuizRunView.vue') },
    { path: '/flashcard', name: 'flashcard', component: () => import('../views/FlashcardView.vue') },
    { path: '/me', name: 'me', component: () => import('../views/MeView.vue') },
    { path: '/:pathMatch(.*)*', name: '404', component: () => import('../views/NotFoundView.vue') },
  ],
  scrollBehavior() {
    // 与旧版一致：每次路由切换回到顶部
    return { top: 0 }
  },
})

/**
 * 动画兜底：极少数环境（例如不产生渲染帧的无头浏览器）里 CSS 动画会停在起始帧，
 * 页面会一直是 opacity:0。这里在动画早该跑完的时间点直接撤掉 animation，
 * 让元素回落到「基础态即可见」的静态样式。正常浏览器里没有任何视觉影响。
 */
router.afterEach(() => {
  window.setTimeout(() => {
    const page = document.querySelector<HTMLElement>('.page')
    if (page) page.style.animation = 'none'
    const ringFg = document.querySelector<HTMLElement>('.ring-fg')
    if (ringFg) ringFg.style.animation = 'none'
  }, 900)
})

export default router
