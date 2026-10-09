# Java 后端学习 App

面向 **Vue3 + TypeScript** 工程师的 Java 后端学习应用。
技术栈：**Vue 3 + TypeScript + Vite + Ant Design Vue + Pinia**，构建出纯静态产物，可离线运行，
塞进安卓 WebView 就能打包成 APK。

教学理念：**先动手写 Web 开发阶段的后端代码，在写的过程中逐步补原理**。
贯穿实战项目「待办清单 API」：10 个模块、39 课。

---

## 一、开发与构建

在本目录（`java-learning-app/`）下执行：

```bash
npm install        # 首次安装依赖
npm run dev        # 开发服务器（热更新）
npm run typecheck  # vue-tsc 类型检查
npm run build      # 产出 dist/（纯静态，可离线）
npm run preview    # 本地预览构建产物
```

> 构建产物 `dist/` 不要直接双击 `index.html`：Chrome 在 `file://` 下会拦截 ES Module，
> 请用 `npm run preview` 或任意静态服务器预览。
> 打包进安卓 WebView 不受此限制——壳工程用 `WebViewAssetLoader` 把 assets 映射到
> `https://appassets.androidplatform.net/assets/` 加载，详见 `android-shell/README.md`。

**主题**：右上角图标打开主题设置，支持「跟随系统 / 浅色 / 深色」三态，偏好存在
`localStorage` 的 `jla.theme.v1`；安卓壳的状态栏图标会跟着一起切换明暗。

---

## 二、目录结构

```
java-learning-app/
├── index.html            应用入口（含首屏主题预置脚本，避免浅色用户先闪一下深色）
├── vite.config.ts        Vite 配置（base './' 相对路径，安卓 WebView 必需）
├── src/
│   ├── main.ts           启动：Pinia + 路由 + 预载课程数据
│   ├── App.vue           应用壳（AntD ConfigProvider + 顶栏 / 路由出口 / tabbar / 主题抽屉）
│   ├── router/index.ts   hash 路由（8 条 + 404）
│   ├── stores/           Pinia：course / progress / theme / quizRun / ui
│   ├── views/            9 个视图（首页 / 路线 / 模块 / 课程 / 刷题 / 答题 / 闪卡 / 我的 / 404）
│   ├── components/       通用组件（顶栏、tabbar、地铁图、进度环、图标…）
│   │   └── sections/     section 渲染器（text / steps / code / table / diagram / img / note）
│   ├── lib/              quiz（题池聚合）/ highlight（自研高亮）/ sanitize（HTML 白名单清洗）
│   ├── styles/app.css    全部样式（双主题变量：:root 深色、[data-theme=light] 浅色）
│   └── data/             课程数据（TS，遵循 Schema）+ index.ts 模块注册表
└── public/assets/img/    AI 插画（logo / hero / m01~m10 封面）
```

### 页面与路由

| 路由 | 页面 | 内容 |
|---|---|---|
| `#/` | 首页 | hero 横幅、继续学习、地铁线路图、三阶段模块列表 |
| `#/route` | 路线全览 | 大号线路图 + 按阶段分组的模块列表 |
| `#/module/:id` | 模块页 | 封面横幅、模块简介、课程列表（编号 + 完成勾选） |
| `#/lesson/:id` | 课程页 | 目标 → 正文 sections → 随堂测验 → 标记完成 / 下一课 |
| `#/quiz` | 刷题 | 模式选择：全部练习 / 按模块选 / 随机 20 题 / 错题重做 + 闪卡入口 |
| `#/quiz/run` | 答题 | 题干 → 选项 → 即时判对错 → 解析 → 下一题；末题为本轮成绩页 |
| `#/flashcard` | 闪卡速记 | 3D 翻面记忆，已掌握默认跳过，可切「包含已掌握」，支持左右滑动 |
| `#/me` | 我的 | 总进度环、学习统计、练习数据（答题数 / 正确率 / 闪卡 / 错题）、快捷入口、重置 |

底部 tabbar 为 3 项：首页 / 刷题 / 我的；闪卡入口在刷题页内，不占 tab。

---

## 三、如何新增课程数据文件

1. 在 `src/data/` 下新建文件，**文件名必须**是 `m01-idea.ts` ~ `m10-docker.ts` 中的一个
   （与 `src/data/index.ts` 里的 `MODULE_META` 约定一致）。
2. 默认导出 `module` 对象（类型见 `src/types/course.ts` 的 `RawModule`）：

```ts
const module: RawModule = {
  id: 'm01', order: 1,
  title: 'IntelliJ IDEA 使用',
  subtitle: '一句话副标题',
  phase: 'phase1',                 // phase1 快速上手 | phase2 写出后端 | phase3 原理进阶
  phaseName: '阶段一 · 快速上手',
  icon: '🛠',
  cover: 'assets/img/m01-idea.jpg',
  minutes: 90,
  summary: '模块简介 2~3 句话',
  lessons: [
    {
      id: 'm01-l01', title: '课程标题', minutes: 15,
      goal: '一句话学习目标',
      sections: [ /* 见下 */ ],
      quiz: [
        { q: '题干', options: ['A', 'B', 'C', 'D'], answer: 1, explain: '解析' }
      ]
    }
  ],
  // 可选：模块级闪卡，进入「闪卡速记」页
  flashcards: [
    { id: 'c01', tag: '命令', front: '正面问题', back: '背面答案' }
  ]
}

export default module
```

3. **不需要改动任何框架代码**：`src/data/index.ts` 会自动 import 该文件并与内置的
   `MODULE_META` 兜底信息合并；文件缺失或报错时该模块降级显示，不会白屏。
   `lesson.quiz` 里的题会自动汇入「刷题」页题池（当前全站共 117 题），
   `module.flashcards` 会汇入闪卡池（当前全站共 100 张）；两者都可省略。

### section 类型（渲染器全部支持）

```ts
{ type: 'text',    html: '<p>…</p>' }                       // 富文本（p/strong/em/code/ul/ol/li/blockquote/br 等白名单标签）
{ type: 'steps',   title: '操作步骤', items: ['步骤1', '步骤2'] }
{ type: 'code',    lang: 'java', filename: 'Demo.java', code: '…' }
{ type: 'compare', title: 'TS ↔ Java', head: ['TS','Java','说明'], rows: [[…]] }
{ type: 'table',   title: '…', head: ['列1','列2'], rows: [[…]] }
{ type: 'diagram', caption: '图题', svg: '<svg viewBox="0 0 680 360">…</svg>' }
{ type: 'img',     src: 'assets/img/…', caption: '…' }
{ type: 'tip',     html: '…' }                              // 绿色提示
{ type: 'warn',    html: '…' }                              // 红色坑点
{ type: 'fe',      html: '…' }                              // 蓝色「前端视角」类比
```

- `code.lang` 支持：`java / sql / yaml / xml / bash / properties / dockerfile / js / ts / json`。
- `diagram.svg` 建议 `viewBox="0 0 680 360"`，配色见项目计划 §5（节点 `#1B2A44`、描边 `#3B82F6`/`#22D3EE`/`#F59E0B`）。
- 数据文件只写纯数据，不写 DOM 与逻辑；字符串里的引号注意转义。
- 类型检查：`npm run typecheck`；构建：`npm run build`，构建不通过时按报错行定位。

---

## 四、学习进度

- 进度保存在浏览器/App 的 `localStorage`（key：`jla.progress.v1`，payload 版本 `v:2`），包含四部分：
  - `done` — 已完成课程 id 集合
  - `quiz` — 课程内随堂测验作答记录
  - `records` — 刷题记录 `{ key: { c, w, last, at } }`，`last` 为最后一次结果，错题本以它为准（答错入集、答对移出）
  - `cards` — 闪卡掌握态 `{ key: { m, at } }`
- 题目 key 格式为 `moduleId::lessonId::题序`，闪卡 key 为 `moduleId::fc::cardId`（未给 `id` 时用数组下标）。
- 读取失败（隐私模式 / 脏数据 / 旧版本）会降级为内存态，不阻塞启动；旧版本 payload 缺 `records`/`cards` 时按空处理。
- 换设备、清缓存不会同步，也不会自动上传。
- 「我的」页可一键重置（需连点两次确认，重置会清空上述四部分）。

---

## 五、打包成安卓 App

1. 在本目录执行 `npm run build`，产出 `dist/`。
2. 把 `dist/` 里的全部内容拷贝到 `android-shell/app/src/main/assets/`（平铺，不要多套一层）。
3. 用 Android Studio 打开 `android-shell/` 打包，详细步骤见 `android-shell/README.md`。

App 支持「浅色 / 深色 / 跟随系统」三态主题，系统状态栏图标会随当前主题自动切换明暗。
