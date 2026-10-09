package com.learn.javahub

import android.annotation.SuppressLint
import android.content.res.Configuration
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatDelegate
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewAssetLoader

/**
 * JavaHub —— 纯 WebView 壳
 *
 * 职责非常薄：把 assets 里的静态站点（index.html + css + js + 图片）塞进一个全屏 WebView。
 * 所有学习内容、路由、进度存储都在 Web 层（localStorage）完成，这里不碰业务逻辑。
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    /**
     * assets 通过 WebViewAssetLoader 映射到 https://appassets.androidplatform.net/assets/ 加载。
     * 为什么不用 file://：站点是 ES Module，Chromium 在 file:// 下会按 CORS 拦截模块加载
     * （origin 为 null）；而 file 放行开关（setAllowUniversalAccessFromFileURLs）在
     * targetSdk>=30 时已被系统忽略，故必须改用 https 域映射。
     */
    private val assetLoader: WebViewAssetLoader by lazy {
        WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        // 跟随系统深浅色：放在 super.onCreate 之前，保证首帧就按当前系统模式解析资源
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)

        super.onCreate(savedInstanceState)

        // 1) 安全区交给系统托管：WebView 落在状态栏 / 导航栏内侧，页面标题不会被状态栏遮住。
        //    此前用「边到边（false）+ 手动补 inset」在 WebView 上兜不住：
        //    WebView 里 env(safe-area-inset-top) 恒为 0，而 insets 监听器又容易错过分发时机，
        //    两层同时失效就会顶到状态栏。改成系统托管后，刘海屏 / 手势导航条也一并由系统适配。
        WindowCompat.setDecorFitsSystemWindows(window, true)
        applyBarAppearance()

        webView = WebView(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            // 底色走 DayNight 资源：浅色主题用浅底、深色主题用深底，避免加载瞬间闪现反色
            setBackgroundColor(ContextCompat.getColor(this@MainActivity, R.color.bg_root))
            overScrollMode = View.OVER_SCROLL_NEVER

            // ---- WebView 设置 ----
            settings.apply {
                javaScriptEnabled = true                       // 站点是 ES Module，必须开
                domStorageEnabled = true                       // 学习进度存在 localStorage，必须开
                databaseEnabled = true
                loadWithOverviewMode = true
                useWideViewPort = true
                builtInZoomControls = false
                displayZoomControls = false
                allowFileAccess = false                        // 站点由 WebViewAssetLoader 的 https 域提供，不再需要 file://
                allowContentAccess = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mediaPlaybackRequiresUserGesture = false
                textZoom = 100                                  // 忽略系统字体缩放，保证排版一致
                // 配色完全由 Web 层（三态主题）控制，禁止系统再强制反色一次。
                // 用 WebSettingsCompat 而不是 WebSettings.forceDark：后者在 API 33 已废弃，
                // 且该兼容方法内部会自动按系统版本选择 forceDark / setAlgorithmicDarkeningAllowed。
                WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false)
            }

            // 关键：把所有 https://appassets.androidplatform.net/assets/... 的请求交回 assets 读取，
            // 让 ES Module 在 https 同源下加载，绕开 file:// 的 CORS 拦截；
            // 其余域名返回 null，走 WebView 默认行为。
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? {
                    return assetLoader.shouldInterceptRequest(request.url)
                }

                // 站内（appassets 域）与 about: 留在 WebView 内；
                // 站外 http(s) 链接返回 true 表示"我不管"，交给系统处理，避免 WebView 显示错误页
                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean {
                    val url = request?.url?.toString() ?: return false
                    return !(url.startsWith(ASSET_ORIGIN) || url.startsWith("about:"))
                }
            }

            // index.html 里有 console 输出与可能的 alert，保留 WebChromeClient 才能正常工作
            webChromeClient = WebChromeClient()

            // Web 层主题变化时回调原生：三态主题里「浅色/深色」是站内选择，跟系统不一致，
            // 只有页面自己知道当前该用哪套配色，据此校正状态栏 / 导航栏图标明暗
            addJavascriptInterface(ThemeBridge(), JS_THEME_IFACE)
        }

        setContentView(webView)

        // 2) 键盘弹出时由系统 resize（AndroidManifest 已声明 windowSoftInputMode="adjustResize"），
        //    不再手动补 inset —— 系统托管安全区后再补一次会叠成双重留白

        // 3) 返回键优先交给页面回退历史，退无可退时才关闭 App
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false            // 临时解禁，让系统默认行为结束 Activity
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        // 4) 旋转 / 切深色模式不重建页面：configChanges 已在 AndroidManifest 中声明
        //    （uiMode 变化时由 onConfigurationChanged 重新应用状态栏明暗与底色）
        if (savedInstanceState == null) {
            loadHome()
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    /**
     * 设置状态栏 / 导航栏图标的明暗。
     *
     * @param darkOverride 传 null 表示按当前系统深浅色判断（首帧、系统切换时用）；
     *                     Web 层回调时会传入它自己实际生效的主题，覆盖「App 内选了深色、系统却是浅色」的不一致。
     */
    @Suppress("DEPRECATION")
    private fun applyBarAppearance(darkOverride: Boolean? = null) {
        val dark = darkOverride ?: isSystemDark()
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = !dark       // 浅色底才用深色图标
            isAppearanceLightNavigationBars = !dark
        }
        // 状态栏 / 导航栏底色跟页面主题走：站内选的主题可能与系统深浅色不一致，
        // 若只改图标明暗，状态栏会留下一条与页面不同的色带
        val bg = if (dark) COLOR_BG_DARK else COLOR_BG_LIGHT
        window.statusBarColor = bg
        window.navigationBarColor = bg
    }

    /** 当前系统是否处于深色模式 */
    private fun isSystemDark(): Boolean =
        (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
            Configuration.UI_MODE_NIGHT_YES

    /**
     * 系统深浅色切换：AndroidManifest 已声明 uiMode 不重建 Activity，故必须在这里手动重新应用，
     * 否则状态栏图标会停留在旧配色上。
     */
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        applyBarAppearance()
        if (::webView.isInitialized) {
            webView.setBackgroundColor(ContextCompat.getColor(this, R.color.bg_root))
        }
    }

    /** 暴露给 Web 层的最小接口：只上报「当前生效的是不是深色主题」 */
    private inner class ThemeBridge {
        @JavascriptInterface
        fun setDark(dark: Boolean) {
            runOnUiThread { applyBarAppearance(dark) }
        }
    }

    /** 加载首页；assets 未拷贝时给出可读提示，而不是白屏 */
    private fun loadHome() {
        val hasIndex = try {
            assets.open("index.html").use { true }
        } catch (e: Exception) {
            false
        }

        if (hasIndex) {
            webView.loadUrl(INDEX_URL)
        } else {
            webView.loadDataWithBaseURL(
                null,
                MISSING_ASSETS_HTML,
                "text/html",
                "utf-8",
                null
            )
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onDestroy() {
        // 释放 WebView，避免内存泄漏与残留进程
        (webView.parent as? ViewGroup)?.removeView(webView)
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        // 与 WebViewAssetLoader 的默认域名一致：assets/ 下的站点被映射到该 https 域
        private const val ASSET_ORIGIN = "https://appassets.androidplatform.net"
        private const val INDEX_URL = "https://appassets.androidplatform.net/assets/index.html"

        // Web 层通过 window.JavaHubTheme.setDark(isDark) 回调原生，让状态栏图标跟随页面实际主题
        private const val JS_THEME_IFACE = "JavaHubTheme"

        // 与 Web 端 CSS 变量的底色取同一个值（深色 :root / 浅色 [data-theme='light']），
        // 保证状态栏底色严格跟随页面主题，而不是只看系统深浅色
        private const val COLOR_BG_DARK = 0xFF0B1220.toInt()
        private const val COLOR_BG_LIGHT = 0xFFF7F9FD.toInt()

        private const val MISSING_ASSETS_HTML = """
            <!DOCTYPE html>
            <html lang="zh-CN"><head><meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <style>
              body{background:#0B1220;color:#E2E8F0;font-family:system-ui,'Microsoft YaHei',sans-serif;
                   display:flex;align-items:center;justify-content:center;height:100vh;margin:0;
                   flex-direction:column;gap:12px;padding:24px;text-align:center}
              code{background:#111A2C;border:1px solid #3B82F6;border-radius:8px;padding:8px 12px;color:#22D3EE}
              p{color:#94A3B8;font-size:14px;line-height:1.7}
              @media (prefers-color-scheme: light){
                body{background:#F7F9FD;color:#0F1E36}
                code{background:#FFFFFF;border-color:#2563EB;color:#0E7490}
                p{color:#46566E}
              }
            </style></head>
            <body>
              <h2>assets 里还没有 index.html</h2>
              <p>请先在 <strong>java-learning-app</strong> 目录执行 <code>npm run build</code>，<br>
                 再把 <strong>dist</strong> 里的全部内容拷贝到 <strong>app/src/main/assets/</strong> 后重新运行。</p>
              <p>PowerShell：<br><code>Copy-Item ..\..\java-learning-app\dist\* app\src\main\assets\ -Recurse -Force</code></p>
              <p>详情见 android-shell/README.md</p>
            </body></html>
        """
    }
}