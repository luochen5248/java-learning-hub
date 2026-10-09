import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/app.css'
import App from './App.vue'
import router from './router'
import { useProgressStore } from './stores/progress'
import { useCourseStore } from './stores/course'

const app = createApp(App)

app.use(createPinia())
app.use(router)

/**
 * 启动顺序：先读本机进度，再异步加载课程数据。
 * 数据加载不阻塞挂载：App.vue 在 course.loading 期间渲染启动过渡屏（.splash），
 * 加载完成后自动切换到真实内容，避免白屏。
 */
useProgressStore().load()
useCourseStore().load()

app.mount('#app')
