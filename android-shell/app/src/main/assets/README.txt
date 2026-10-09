========================================================================
JavaHub · assets 说明（打包前必读）
========================================================================

这个目录就是 WebView 的根目录。app/src/main/assets/index.html 必须存在，
否则应用启动后显示提示页（而不是你想要的课程内容）。

注意：从 Web 端工程改版为 Vue 3 + Vite 之后，这里放的是【构建产物】，不是源码。

【第一步：构建】
在 java-learning-app 目录下执行：
    npm install      （只需首次）
    npm run build    （产出 dist/）

【第二步：拷贝 dist 里的内容】
正确结构是：
    app/src/main/assets/index.html
    app/src/main/assets/static/      （Vite 打出的 js / css）
    app/src/main/assets/assets/      （AI 插画等图片）

错误结构是（多套了一层，应用会显示提示页）：
    app/src/main/assets/java-learning-app/index.html

【怎么拷贝（Windows PowerShell，在 android-shell 目录下执行）】
    Copy-Item ..\java-learning-app\dist\* .\app\src\main\assets\ -Recurse -Force

【怎么拷贝（Windows CMD）】
    xcopy ..\java-learning-app\dist\* .\app\src\main\assets\ /E /I /Y

【怎么拷贝（macOS / Linux）】
    cp -r ../java-learning-app/dist/* ./app/src/main/assets/

【怎么拷贝（IDEA / Android Studio GUI）】
    用系统文件管理器打开 java-learning-app/dist，全选（Ctrl+A）→ 复制 →
    粘贴到 android-shell/app/src/main/assets/ → 确认覆盖。

切记：不要拷贝 java-learning-app 源码目录本身（src/、node_modules/、package.json
都不需要进 APK）。

【拷完之后】
命令行方式需要重新 Run 或 Build；Android Studio 每次 Run 会自动重新打包 assets，
若用的是 Build > Generate Signed Bundle / APK，也会被打进包里。

【怎么确认拷对了】
    目录里有 index.html 且旁边有 static/ → 说明正确
    应用显示"assets 里还没有 index.html" → 说明没拷成功或多套了一层目录

【体积提醒】
图片位于 assets/assets/img，每张几十 KB，整个站点通常几 MB，对 APK 体积影响可忽略。
若想进一步瘦身，可在拷贝前压缩 dist/assets/img 下的 jpg（质量 80 即可）。
