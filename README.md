# JavaHub · 面向前端工程师的 Java 后端入门

[![构建安卓 APK](https://github.com/luochen5248/java-learning-hub/actions/workflows/android-apk.yml/badge.svg)](https://github.com/luochen5248/java-learning-hub/actions/workflows/android-apk.yml)

面向 **Vue3 + TypeScript** 工程师的 Java 后端学习应用。10 个模块、39 课，
图文并茂 + 流程图讲解，配随堂测验、刷题、闪卡。支持浅色 / 深色 / 跟随系统三态主题，
可打包成安卓 App 离线使用。

![JavaHub](java-learning-app/public/assets/img/hero.jpg)

---

## 一、这是什么

前端转后端常见的两个坑：一是被 Java 教材从「面向对象三大特性」开始劝退，
二是学的例子离真实 Web 开发太远，学完还是不知道怎么接数据库、怎么发接口。

本项目反过来走：**先用 IDEA + Maven 把工程跑起来，在写 Web 接口的过程中逐步补原理**。
全站贯穿一个实战项目「**待办清单 API**」，边写边学，学到的东西立刻能落到代码上。

- 面向人群：有 Vue / TypeScript 基础，想补 Java 后端的前端工程师
- 学习路径：阶段一快速上手 → 阶段二写出完整后端 → 阶段三原理补课与进阶
- 核心承诺：每节课都有可复制的代码、看得懂的图、马上能做的题

---

## 二、下载安装（安卓）

去 [**Releases**](https://github.com/luochen5248/java-learning-hub/releases/latest) 下载最新的 `app-debug.apk`：

| 项目 | 说明 |
|---|---|
| 系统要求 | Android 7.0 及以上（minSdk 24） |
| 签名 | debug 签名，适合个人安装体验 |
| 安装体积 | 约 9.6 MB |
| 内容 | 完全离线，安装后无需联网 |

**安装步骤**：把 APK 传到手机 → 点击安装 → 若提示「禁止安装未知来源应用」，在系统设置里允许即可。

也可以直接用浏览器访问网页版（纯静态，无需后端）：

```bash
cd java-learning-app
npm install
npm run dev      # 本地开发服务器
```

---

## 三、课程内容（10 模块 / 39 课 / 累计约 19.7 小时）

### 阶段一 · 快速上手

| 模块 | 标题 | 时长 |
|---|---|---|
| m01 | IntelliJ IDEA 使用 —— 把 VSCode 的手感迁移到 IDEA | 90 min |
| m02 | Maven 依赖管理 —— 后端世界的 npm + vite | 110 min |
| m03 | Java 够用语法 —— 对照 TypeScript 学，只学用得上的 | 160 min |

### 阶段二 · 写出完整后端

| 模块 | 标题 | 时长 |
|---|---|---|
| m04 | Spring Boot 起步 —— IoC/DI 与第一个 Web 接口 | 120 min |
| m05 | MySQL 数据库 —— 建库建表与 CRUD、JOIN 查询 | 150 min |
| m06 | 连接数据库 · MyBatis-Plus —— 连接池原理与条件构造器 | 120 min |
| m07 | 业务分层 —— 三层架构、DTO/VO、事务 | 130 min |
| m08 | 打包与部署 —— 打 jar 包、多环境、Linux 命令 | 100 min |

### 阶段三 · 原理补课与进阶

| 模块 | 标题 | 时长 |
|---|---|---|
| m09 | Redis 缓存 —— 五大数据类型与缓存三兄弟 | 100 min |
| m10 | Docker 容器化 —— 镜像、Dockerfile、compose 一键部署 | 100 min |

---

## 四、功能特性

- **图文并茂**：31 张手绘风格 SVG 流程图 + 13 张 AI 插画，逻辑关系一眼看懂
- **九种内容块**：富文本、操作步骤、代码高亮、对比表（TS ↔ Java）、表格、流程图、配图、提示、坑点、前端视角类比
- **随堂测验**：每课 1~3 题，选完立即判对错并展示解析（全站 117 题）
- **刷题模式**：全部练习 / 按模块选 / 随机 20 题 / 错题重做，错题本自动维护
- **闪卡速记**：3D 翻面记忆，已掌握默认跳过，支持左右滑动（全站 100 张）
- **学习进度**：完成勾选、总进度环、答题正确率、学习时长统计，全部本地保存
- **三态主题**：浅色 / 深色 / 跟随系统，App 里连系统状态栏图标都会跟着切换
- **离线可用**：纯静态产物，无任何后端依赖，数据不上传

---

## 五、技术栈

| 层 | 选型 |
|---|---|
| 前端框架 | Vue 3.5（`<script setup>` + TypeScript） |
| 构建工具 | Vite 5 + vue-tsc |
| UI 组件 | Ant Design Vue 4.2（按需引入 Drawer / Segmented / ConfigProvider） |
| 状态管理 | Pinia 2 |
| 路由 | Vue Router 4（hash 路由，适配 WebView） |
| 代码高亮 | 自研零依赖高亮器（无第三方运行时依赖） |
| 安卓壳 | Kotlin + AppCompatActivity + WebView + WebViewAssetLoader |
| 云端构建 | GitHub Actions（Node 20 + JDK 17 + Android SDK 34 + Gradle 8.7） |

---

## 六、目录结构

```
.
├── .github/workflows/android-apk.yml   # 云端构建 APK 的流水线
├── java-learning-app/                  # Vue3 前端工程（课程内容 + 全部界面）
│   ├── src/
│   │   ├── data/                       # 课程数据（m01~m10，纯数据不写逻辑）
│   │   ├── views/                      # 9 个页面视图
│   │   ├── components/                 # 通用组件 + section 渲染器
│   │   ├── stores/                     # Pinia：course / progress / theme / quizRun / ui
│   │   ├── lib/                        # 刷题题池、代码高亮、HTML 白名单清洗
│   │   └── styles/app.css              # 全部样式（双主题 CSS 变量）
│   └── public/assets/img/              # logo / hero / m01~m10 封面插画
└── android-shell/                      # 安卓 WebView 壳工程（Kotlin）
    └── app/src/main/                   # 壳代码与资源（assets 由 CI 构建时注入）
```

---

## 七、本地开发

```bash
cd java-learning-app

npm install        # 首次安装依赖
npm run dev        # 开发服务器（热更新）
npm run typecheck  # vue-tsc 类型检查
npm run build      # 产出 dist/（纯静态，可离线）
npm run preview    # 本地预览构建产物
```

> 构建产物 `dist/` 不要直接双击 `index.html`：浏览器在 `file://` 下会拦截 ES Module，
> 请用 `npm run preview` 或任意静态服务器预览。

### 新增课程内容

在 `java-learning-app/src/data/` 下新建 `mXX-*.ts` 并导出 `module` 对象即可，
**不需要改动任何框架代码**——模块注册表会自动加载并与兜底元信息合并；
单个模块报错时只会降级显示「建设中」，不会白屏。字段与 section 类型说明见
[java-learning-app/README.md](java-learning-app/README.md)。

---

## 八、打包成安卓 App

### 方式一：云端一键构建（推荐，无需装 Android Studio）

推送代码到 `main` 分支，或在仓库 **Actions** 页面手动点 `Run workflow`，
流水线会自动完成「构建 Web 站点 → 注入 assets → 编译 APK」，
跑完后在该次运行的 **Artifacts** 区域下载 `javahub-debug-apk`。

### 方式二：本地构建

1. `cd java-learning-app && npm run build` 产出 `dist/`
2. 把 `dist/` 里的全部内容**平铺**拷到 `android-shell/app/src/main/assets/`
3. 用 Android Studio 打开 `android-shell/` 打包

详细步骤（含签名、常见报错排查）见 [android-shell/README.md](android-shell/README.md)。

---

## 九、学习进度存储

进度保存在设备本地的 `localStorage`（key `jla.progress.v1`），包含已完成课程、
随堂测验作答、刷题记录（含错题本）、闪卡掌握态四部分。不上传、不联网、换设备不同步。
「我的」页可一键重置（需连点两次确认）。

---

## 十、开源协议

本项目采用 [MIT License](https://opensource.org/licenses/MIT) 开源，欢迎学习、修改与分发。
