# JavaHub · 安卓 WebView 壳工程

这个工程**不写任何业务代码**，它只做一件事：把 `java-learning-app` 构建出的静态站点
装进一个全屏 WebView，打包成 APK 安装到手机上。

- 应用内容：10 个模块 / 39 课 Java 后端入门课程（面向前端工程师）
- Web 端技术栈：Vue 3 + TypeScript + Vite + Ant Design Vue（构建产物在 `dist/`）
- 壳子技术栈：Kotlin + AndroidX + WebView
- 构建工具：AGP 8.5.2 / Gradle 8.7 / JDK 17 / compileSdk 34 / minSdk 24

> ⚠️ **重要说明：本工程未在本机编译验证。**
> 生成这个壳工程的机器上没有安装 Android SDK 与 Gradle，因此**没有跑过一次真实的
> `assembleDebug`**，也没有在真机上运行过。请按下面第 3~5 步在你自己的机器上完成首次构建；
> 预期会遇到的第一次构建耗时 10~25 分钟（下载 Gradle + Android SDK 组件 + 依赖），
> 之后增量构建通常 1 分钟以内。若遇到报错，先看第 8 节「常见问题」。

---

## 1. 目录结构

```
android-shell/
├── settings.gradle.kts                     # 仓库与模块声明
├── build.gradle.kts                        # 顶层：只声明 AGP / Kotlin 插件版本
├── gradle.properties                       # Gradle 与 AndroidX 配置
├── gradle/wrapper/gradle-wrapper.properties# Gradle 8.7 下载地址（刻意不含二进制 jar）
├── README.md                               # 你正在读的这份文件
└── app/
    ├── build.gradle.kts                    # compileSdk 34 / minSdk 24 / Kotlin / 依赖
    ├── proguard-rules.pro                  # 默认空壳（release 未开混淆）
    └── src/main/
        ├── AndroidManifest.xml             # 含 configChanges（旋转不重载）
        ├── java/com/learn/javahub/MainActivity.kt
        ├── res/
        │   ├── values/themes.xml           # DayNight 主题（跟随系统深浅色）
        │   ├── values/colors.xml           # 浅色底色（与 Web 端 --bg 同色系）
        │   ├── values/bools.xml            # 浅色：状态栏/导航栏图标用深色
        │   ├── values-night/colors.xml     # 深色底色
        │   ├── values-night/bools.xml      # 深色：状态栏/导航栏图标用浅色
        │   ├── values/strings.xml
        │   ├── drawable/ic_launcher_foreground.xml   # 矢量图标：咖啡杯 + 花括号
        │   ├── mipmap-anydpi-v26/ic_launcher.xml     # Android 8.0+ 自适应图标
        │   ├── mipmap/ic_launcher.xml                # Android 7.x 兜底图标
        │   └── xml/network_security_config.xml
        └── assets/README.txt               # 打包前拷 assets 的说明（不会影响运行）
```

> **为什么没有 `gradle-wrapper.jar`？**
> 二进制 jar 无法用文本方式分发和校验，容易在传输中损坏。Android Studio 打开工程时会自动
> 补全 `gradle-wrapper.jar` 和 `gradlew` 脚本。如果你需要命令行构建，在已装 Gradle 的机器上执行一次
> `gradle wrapper --gradle-version 8.7` 即可生成。

---

## 2. 环境要求

| 项目 | 要求 | 说明 |
|---|---|---|
| JDK | **17**（AGP 8.x 硬性要求） | JDK 11 或更低会直接报 `Android Gradle plugin requires Java 17` |
| Android Studio | **Meerkat (2024.3.1) 或更新** | 老版本自带的 AGP 太低，无法编译 SDK 34 |
| Gradle | 8.7（wrapper 自动下载） | AGP 8.5 要求 Gradle ≥ 8.7 |
| Android SDK Platform | **API 34** | SDK Manager 里勾选 |
| Build-Tools | 34.0.0（SDK Manager 默认勾选） | |
| 手机系统 | Android 7.0 及以上（minSdk 24） | |

检查 JDK 版本（应为 17.x）：

```powershell
java -version
```

检查 Gradle 用到的 JDK（Android Studio 里）：
`Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK` → 选 **jbr-17**（IDE 自带的那个就行）。

---

## 3. 构建网站并拷进 assets（最容易漏的一步）

**第一步：先构建**（在 `java-learning-app` 目录下执行）：

```powershell
npm install      # 只需首次
npm run build    # 产出 dist/
```

**第二步：再拷贝** `dist` 里的内容（在 `android-shell` 目录下执行）：

```powershell
Copy-Item ..\java-learning-app\dist\* .\app\src\main\assets\ -Recurse -Force
```

macOS / Linux：

```bash
cp -r ../java-learning-app/dist/* ./app/src/main/assets/
```

拷完确认目录结构是**平铺**的：

```
app/src/main/assets/
├── index.html      ← 必须有，且直接在这一层
├── static/         ← Vite 打出的 js / css
└── assets/         ← 网站自己的图片目录，注意是 assets 里的 assets
```

- 只拷 `dist/` 里的内容，**别拷源码目录**（`src/`、`node_modules/` 都不需要进 APK）。
- 若是 `assets/java-learning-app/index.html`（多了一层），应用会显示提示页。
- 每次更新网站内容后，重新 `npm run build` 并执行这条拷贝命令即可。

---

## 4. 用 Android Studio 打开并运行到手机

1. **打开工程**：Android Studio → `File → Open`，选择 `android-shell` 这个**文件夹**（不是它的父目录）。
   首次打开会提示 "Trust Project"，选 `Trust`。
2. **等待 Gradle Sync**：右下角会显示 `Gradle sync in progress…`。这一步会自动下载 Gradle 8.7 和依赖，
   **10~25 分钟都属正常**，取决于网速。如果卡在 `Downloading https://services.gradle.org/...`，
   换个网络或配置国内镜像（见第 8 节第 4 条）。
3. **检查 SDK**：如果顶部出现 `SDK location not found`，点提示里的 `Install SDK`，
   或手动 `File → Settings → Languages & Frameworks → Android SDK`，
   勾选 `Android 14.0 (API 34)` 与 `Android SDK Build-Tools 34`，点 `Apply`。
4. **插上手机**：
   - 手机上打开 `设置 → 关于手机 → 连续点击「版本号」7 次` 进入开发者模式
   - `设置 → 开发者选项 → 打开「USB 调试」`
   - 用**数据线**连电脑，USB 模式选「传输文件 / MTP」
   - 手机上弹出的「允许 USB 调试」对话框点**允许**（勾选"一直允许"）
5. **选设备**：Android Studio 顶部工具栏的设备下拉框里应出现你的手机型号，选中它。
   没出现就点 `Run → Available Devices` 排查（USB 线、驱动、手机授权）。
6. **点绿色 ▶ Run**（`Shift+F10`）。第一次 Build 会比较久（编 Kotlin + 打 assets + 装包）。
7. **看效果**：手机自动安装并打开，界面就是课程首页，可以左右滑动、点进课程、答题、标记完成。
8. **看日志**：`Run` 窗口底部 `Logcat` 里筛选 `chromium` 或 `MainActivity`。
   - JS 报错（白屏时最常见）会在 `chromium: [INFO:CONSOLE] Uncaught ...` 里
   - 如果 `static/` 目录漏拷，JS 会 404，首页会停在启动页不动

---

## 5. Build APK 的输出位置

### 5.1 Debug APK（自己用，安装最简单）

`Build → Build Bundle(s) / APK(s) → Build APK(s)`，完成后 IDE 会弹一个通知
「APK(s) generated successfully」，点 **locate** 直接定位。默认路径：

```
android-shell/app/build/outputs/apk/debug/app-debug.apk
```

也可以命令行（需先生成 wrapper，或用 Android Studio 自带的 Terminal）：

```powershell
./gradlew assembleDebug     # macOS/Linux: ./gradlew assembleDebug
```

### 5.2 Release APK / AAB（要发布给别人）

`Build → Generate Signed Bundle / APK…`，见下一节。

---

## 6. 签名入门（Build → Generate Signed App Bundle / APK）

Android 要求每个 APK 都必须**签名**才能安装。Debug 版本由 Android Studio 用
自动生成的 debug 证书签名，所以第 4 步能直接装；Release 必须你自己来。

第一次签名（创建一个永久证书，**保管好 keystore 文件 + 密码，丢了就无法更新已上架的应用**）：

1. `Build → Generate Signed Bundle / APK…`
2. 选择 **Generate Signed App Bundle / APK**（不是 Generate Signed App Bundle / APK → APK / App Bundle 都可以）
3. 在 `Key store path` 右边点 `Create new…`
   - `Key store path`：选一个**长期存放**的位置，例如 `D:\keys\javahub.jks`
   - `Password` / `Confirm`：设置密码（记下来）
   - `Key alias`：`javahub`
   - `Validity (Years)`：`25`（Google Play 要求至少到 2033 年，25 年最省事）
   - `First and Last Name` 等资料：随便填真实信息即可，填完点 OK
4. 回到签名页，`Alias` 选刚建的 `javahub`，`Password` 填 alias 密码
5. 点 `Next`：
   - 想要直接生成安装包 → 选 **APK** → 选 `release` → 勾选 `Export signed APK`
   - 上架 Google Play → 选 **App Bundle** → 选 `release`
6. 构建完成后点 **locate**，产物在：

```
app/build/outputs/apk/release/app-release.apk        # 安装包
app/build/outputs/bundle/release/app-release.aab     # 上架用
```

**安装 release APK 到手机**：把 apk 传到手机点击安装，或

```powershell
adb install -r app\build\outputs\apk\release\app-release.apk
```

（`adb` 在 Android SDK 的 `platform-tools` 目录下，已加入 Path 时可直接用。）

---

## 7. MainActivity 做了什么

| 需求 | 实现 | 位置 |
|---|---|---|
| 加载首页 | `webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")` | `loadHome()` |
| ES Module 加载 | `WebViewAssetLoader` 把 `assets/` 映射到 https 域，规避 `file://` 下 ES Module 被 CORS 拦截 | `assetLoader` / `shouldInterceptRequest` |
| 启用 JavaScript | `settings.javaScriptEnabled = true`（站点是 ES Module，必须开） | `onCreate` |
| localStorage（学习进度） | `settings.domStorageEnabled = true` | `onCreate` |
| WebChromeClient | `webChromeClient = WebChromeClient()`，保证 console / alert 正常 | `onCreate` |
| 返回键回退 history | `canGoBack()` → `goBack()`，否则 `finish()` | `onBackPressedDispatcher` 回调 |
| 深浅色跟随系统 | `AppCompatDelegate.setDefaultNightMode(MODE_NIGHT_FOLLOW_SYSTEM)` + `values-night` 资源 | `onCreate` |
| 状态栏图标明暗 | `applyBarAppearance()`：浅色底用深色图标，深色底用浅色图标 | `onCreate` / `onConfigurationChanged` |
| 系统切换主题不重建 | 重新应用状态栏配色与 WebView 底色 | `onConfigurationChanged` |
| Web 主题同步原生 | Web 层调 `window.JavaHubTheme.setDark(isDark)` 校正状态栏图标（站内主题可能与系统不一致） | `ThemeBridge` |
| 旋转不重载 | `android:configChanges="orientation\|screenSize\|..."` | `AndroidManifest.xml` |
| 安全区适配 | `WindowInsetsCompat` 给 WebView 补 padding，避开刘海与手势条 | `onCreate` |
| assets 没拷贝时提示 | 检查 `assets.open("index.html")`，显示可读的排查指引 | `loadHome()` |

---

## 8. 常见问题（≥5 条，按遇到概率排序）

### 1. `Android Gradle plugin requires Java 17 to run.`

**现象**：Sync 或 Build 直接失败。

**原因**：AGP 8.x 不再支持 JDK 11 及以下。

**解决**：`Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK`
改成 **jbr-17**（IDE 自带）或本机 JDK 17 的路径；命令行则确认 `java -version` 是 17，
并检查 `JAVA_HOME`。

### 2. `SDK location not found` / `Failed to find target with hash string 'android-34'`

**原因**：没装 API 34 平台，或 `local.properties` 缺 SDK 路径。

**解决**：点提示里的 `Install SDK` 自动装；或手动在 SDK Manager 勾选
`Android 14.0 (API 34)`。仍报错则在工程根目录建 `local.properties` 写一行：

```properties
sdk.dir=C\\:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk
```

（Windows 路径里的 `:` 要写成 `\\:`）

### 3. 应用打开是**白屏**，或提示"assets 里还没有 index.html"

**排查顺序**（按概率）：

1. **assets 没拷贝**——最常见。确认 `app/src/main/assets/index.html` 存在（看第 3 节）。
2. **多套了一层目录**——路径应是 `assets/index.html` 而不是 `assets/java-learning-app/index.html`。
3. **JS 报错导致白屏**——`Run` 窗口的 Logcat 搜 `chromium: [INFO:CONSOLE]`，
   看有没有 `Uncaught SyntaxError` / `Failed to resolve module`。
   本地先在浏览器里打开 `index.html` 验证一遍，能跑通再拷进来。
4. **没开 JavaScript**——`MainActivity` 里必须是 `javaScriptEnabled = true`
   （已开；若你改过代码请检查）。
5. **构建产物不完整**——`dist/` 只拷了一半，或漏了 `static/` 目录（Vite 打出的 js/css 全在里面）。
   重新执行 `npm run build`，再把 `dist/*` 整体拷一遍。
6. **改回了 `file://` 加载**——壳工程默认用 `WebViewAssetLoader` 走
   `https://appassets.androidplatform.net/assets/` 加载。若你手动把 `INDEX_URL` 改回
   `file:///android_asset/index.html`，站点是 ES Module，会被 WebView 按 CORS 拦截而白屏——
   注意 `setAllowUniversalAccessFromFileURLs(true)` 这类 file 放行开关在 `targetSdk >= 30`
   时已被系统忽略，绕不过去，请保持 https 域加载。

### 4. Gradle Sync 卡在 `Downloading https://services.gradle.org/...` 或依赖下载极慢

**原因**：Gradle 发行包与 Maven 依赖都在境外。

**解决**：编辑 `settings.gradle.kts` 的两个仓库块，加上国内镜像（放在 `google()` / `mavenCentral()` **之前**）：

```kotlin
maven { url = uri("https://maven.aliyun.com/repository/public") }
maven { url = uri("https://maven.aliyun.com/repository/gradle-plugin") }
maven { url = uri("https://maven.aliyun.com/repository/google") }
```

然后 `File → Settings → Build Tools → Gradle` 里也可以配
`Gradle User Home` 的 `init.gradle` 全局镜像。

### 5. 返回键按一下直接退出应用，不能回退到上一个页面

**原因**：回调注册在 `onBackPressedDispatcher` 上，但 `canGoBack()` 始终返回 `false`。

**说明**：本工程用的是 **hash 路由**（`#/lesson/m01-l01`），每次跳转会往 history 里 **push** 一条记录，
`canGoBack()` 应该返回 `true`。若确实为 `false`：

1. 确认 `MainActivity` 里注册了 `onBackPressedDispatcher.addCallback`，且 callback 的
   `isEnabled` 初值为 `true`（本工程写成 `isEnabled = false; onBackPressedDispatcher.onBackPressed()` 收尾，
   这一句在退无可退时**临时解禁**并交还系统，是正确写法）。
2. 检查 `app/build.gradle.kts` 里是否引入了别的返回键处理库（如 `navigation-fragment`）。
3. 检查网站是否用了 `location.replace()` 替换历史记录——如果有，`canGoBack()` 必然是 `false`。

### 6. 手机连不上 / Run 按钮是灰的

- USB 线必须是**数据线**（有些充电线没有数据芯）。
- 手机开启开发者选项 + USB 调试，手机上弹窗点"允许"。
- 装厂商 USB 驱动（小米/华为/oppo 需额外装）。
- 实在不行用无线调试：`开发者选项 → 无线调试`，Android Studio 顶部设备框里用 `Pair Devices` 配对。

### 7. 安装 APK 时提示 `INSTALL_FAILED_UPDATE_INCOMPATIBLE` 或"应用未安装"

**原因**：手机上已有**不同证书**签名的同名应用（常见于先装 debug 再装 release）。

**解决**：先卸载再装。

```powershell
adb uninstall com.learn.javahub
```

> 注意：卸载会清空数据，包括 localStorage 里的学习进度。

### 8. 状态栏与内容重叠 / 手势条遮住最后一课

**原因**：边到边（edge-to-edge）已启用但没做 inset 适配。

**解决**：本工程在 `MainActivity` 里用 `ViewCompat.setOnApplyWindowInsetsListener`
给 WebView 补了 padding。若你把 WebView 换成了别的容器，记得同步这段逻辑。

### 9. `Could not find method 'compileSdk' / DSL 报错

**原因**：Gradle 插件版本与写法不匹配（本工程用的是 AGP 8.x 的 Kotlin DSL 写法，
`sdkVersion`/`compileSdkVersion` 之类的旧写法已废弃）。

**解决**：确认 `build.gradle.kts` 用的是 `compileSdk = 34`（属性写法，不是函数调用），
且顶层 `build.gradle.kts` 里 AGP 版本是 `8.x`。

### 10. Android Studio 里改了代码，手机上没变化

**解决**：

1. 改了 **网站内容** → 先 `npm run build`，再重新拷贝 assets（改动在 `assets/` 里，
   不属于 Kotlin 代码，IDE 不会自动同步）：
   ```powershell
   Copy-Item ..\java-learning-app\dist\* .\app\src\main\assets\ -Recurse -Force
   ```
2. 改了 **MainActivity** → 点 `Run` 重新部署即可。
3. 缓存导致页面显示旧内容 → 应用内下拉刷新或清除 `localStorage`。

---

## 9. 一页速查

```powershell
# 1) 构建网站（在 java-learning-app 目录）→ 再拷贝产物（在 android-shell 目录）
#    cd ..\java-learning-app ; npm run build ; cd ..\android-shell
Copy-Item ..\java-learning-app\dist\* .\app\src\main\assets\ -Recurse -Force

# 2) 打开工程
#    Android Studio → File → Open → 选 android-shell 文件夹 → Trust

# 3) 插手机开 USB 调试 → 点 Run

# 4) 出包
#    Build → Build Bundle(s) / APK(s) → Build APK(s)
#    产物：app/build/outputs/apk/debug/app-debug.apk

# 5) 签名发布
#    Build → Generate Signed App Bundle / APK → Create new keystore → 选 APK/release
#    产物：app/build/outputs/apk/release/app-release.apk
```