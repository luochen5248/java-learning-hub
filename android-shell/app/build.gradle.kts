plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.learn.javahub"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.learn.javahub"
        minSdk = 24            // Android 7.0，WebView 兼容性最好
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            // 纯 WebView 壳，没有反射密集的代码，先不开混淆，保证签名后能正常跑
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    // assets 里是纯静态站点，个别类型不压缩以保证 file:// 下加载正常
    androidResources {
        noCompress += listOf("json", "woff2")
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    // OnBackPressedDispatcher + WindowInsets API
    implementation("androidx.activity:activity-ktx:1.9.3")
    // WebViewAssetLoader：把 assets 映射到 https 域加载，解决 file:// 下 ES Module 被 CORS 拦截
    implementation("androidx.webkit:webkit:1.11.0")
}