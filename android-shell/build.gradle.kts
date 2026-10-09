// 顶层构建文件：只声明插件版本，不在这里写具体配置
plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}

// 清理任务：./gradlew clean 时顺带清掉本地.properties 里指定的 SDK 之外的构建缓存
tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}