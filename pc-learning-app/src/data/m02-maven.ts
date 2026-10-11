import type { RawModule } from '../types/course'

/**
 * m02 · Maven —— 课程数据
 *
 * 定位：把 Maven 讲成「后端世界的 npm」，只讲够用，不深入插件机制。
 * 基线：JDK 17 + Maven 3.9，Windows 视角。Schema 遵循 plan.md §4，SVG 遵循 §5。
 */

export const module: RawModule = {
  id: 'm02',
  order: 2,
  title: 'Maven 依赖管理',
  subtitle: '后端世界的 npm + vite',
  phase: 'phase1',
  phaseName: '阶段一 · 快速上手',
  icon: '📦',
  cover: 'assets/img/m02-maven.jpg',
  minutes: 140,
  summary:
    'Maven 是 Java 世界的构建与依赖管理工具，几乎等价于「npm + vite 打包命令」。这一模块用你已经熟悉的 npm 心智去对齐它：pom.xml 就是 package.json，本地仓库就是 node_modules，mvn package 就是 npm run build。最后用一课避坑清单收拢依赖冲突、SNAPSHOT 快照、仓库缓存损坏等公司项目里的高频翻车点。学完你能自己搭一个可构建、可打包、依赖不报错的 Java 项目。',

  /* ---------------- 闪卡 10 张 ---------------- */
  flashcards: [
    { front: 'Maven 项目的核心配置文件叫什么？', back: 'pom.xml（Project Object Model），地位等同于前端的 package.json', tag: '概念' },
    { front: 'Maven 本地仓库默认在哪个目录？', back: 'C:\\Users\\用户名\\.m2\\repository，等价 node_modules', tag: '配置' },
    { front: 'Maven 的全局配置文件是哪一个？', back: 'settings.xml，在 ~/.m2/ 下，默认不存在、需要自己新建', tag: '配置' },
    { front: '依赖的坐标三要素是什么？', back: 'GAV：groupId（组织）+ artifactId（库名）+ version（版本）', tag: '依赖' },
    { front: '把项目装到本地仓库的命令？', back: 'mvn install：打包并把 jar 放进 ~/.m2/repository', tag: '命令' },
    { front: '打包并生成 jar 的命令？', back: 'mvn package，产物落在 target/ 目录（对应前端的 dist/）', tag: '命令' },
    { front: '跳过测试执行但仍编译测试代码的参数？', back: '-DskipTests；-Dmaven.test.skip=true 更狠，连编译都跳过', tag: '命令' },
    { front: '查看依赖树、排查版本冲突的命令？', back: 'mvn dependency:tree，IDEA Maven 面板也有依赖图', tag: '命令' },
    { front: 'scope 为 test 的依赖特点？', back: '只在编译与运行测试代码时生效，打包不进产物，等价 devDependencies', tag: '依赖' },
    { front: 'Maven 解决依赖冲突的两条原则？', back: '路径最近优先；路径相同时先声明者优先。也可 exclusions 排除', tag: '坑点' },
    { front: '运行时抛 NoSuchMethodError / ClassNotFoundException 先怀疑什么？', back: '依赖冲突。mvn dependency:tree -Dverbose 查同库多版本，用父 pom 的 dependencyManagement 统一锁版本', tag: '坑点' },
    { front: 'SNAPSHOT 快照依赖为什么危险？', back: '同一个版本号内容会变，今天能跑明天报错。生产发布必须用固定版本号', tag: '坑点' },
    { front: 'Maven 下载依赖一直失败，先检查什么？', back: '本地仓库里的 .lastUpdated 残留文件——上次下载中断的标记，删掉它再 mvn -U 强制刷新', tag: '坑点' },
  ],

  lessons: [
    /* ============================ L01 ============================ */
    {
      id: 'm02-l01',
      title: 'Maven 是什么：把它当成 npm 就行',
      minutes: 25,
      goal: '理解 Maven 解决什么问题，并把它的每个概念准确对应到你已经熟悉的 npm/systemd概念上。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>没有 Maven 的年代，Java 项目要手动去官网下载一个个 <code>.jar</code> 文件丢进 <code>lib/</code> 目录，版本不对就运行时报错——就像前端在没有 npm 的年代，手动下载 jQuery 放进 <code>static/</code>。</p>
<p>Maven 一次性解决三件事：</p>
<ul><li><strong>依赖管理</strong>：写一行坐标，自动下载 jar 及其传递依赖。</li>
<li><strong>构建生命周期</strong>：一条命令完成编译、测试、打包（≈ <code>npm run build</code>）。</li>
<li><strong>项目标准化</strong>：约定好源码放哪、资源放哪，团队协作不再争论目录怎么摆。</li></ul>
<p>本课程统一使用 <strong>Maven 3.9</strong>。IDEA 自带捆绑版（Bundled Maven 3），也可以自行安装。</p>`,
        },
        {
          type: 'fe',
          html: String.raw`<p>如果你用过 npm + Vite，那 Maven 你已经会了八成。唯一的心理准备是：<strong>Maven 比 npm 严格</strong>，它强制规定目录结构，不像前端那样可以随便把源码放在任何地方。</p>`,
        },
        {
          type: 'compare',
          title: 'npm / 前端 ↔ Maven 概念对照',
          head: ['npm / 前端', 'Maven', '说明'],
          rows: [
            ['package.json', 'pom.xml', '项目清单 + 依赖声明，Maven 叫 POM（Project Object Model）'],
            ['node_modules', '本地仓库 ~/.m2/repository', '都是本地缓存；区别是 node_modules 在项目内，而 .m2 是全局共享的'],
            ['npm registry', '中央仓库 Maven Central + 各类镜像', '默认仓库在国外，国内必须换源，见本课最后一节'],
            ['.npmrc', 'settings.xml', '配置镜像源、私服账号'],
            ['package-lock.json', '无直接等价物', 'Maven 靠显式锁定版本号，所以版本必须写全'],
            ['npm run build', 'mvn package', '产物分别是 dist/ 和 target/'],
            ['npm install', 'mvn install', '注意语义不同：Maven 的 install 是「打包并安装到本地仓库」'],
            ['dependencies', 'dependencies（scope=compile）', '默认范围，打包进去'],
            ['devDependencies', 'scope 为 test 的依赖', '只在跑单元测试时生效'],
            ['vite.config.ts', 'pom.xml 里的 build 段', '打包行为与插件配置'],
          ],
        },
        {
          type: 'diagram',
          caption: '依赖在三个位置之间如何流转',
          svg: String.raw`<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m02-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="12" fill="#0F1B2D"/>
  <text x="340" y="38" text-anchor="middle" font-size="17" fill="#E2E8F0">依赖仓库流转：项目 ↔ 本地仓库 ↔ 远程仓库</text>

  <g>
    <rect x="24" y="118" width="168" height="120" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
    <text x="108" y="150" text-anchor="middle" font-size="14" fill="#E2E8F0">你的项目</text>
    <text x="108" y="174" text-anchor="middle" font-size="13" fill="#94A3B8">pom.xml 声明依赖</text>
    <text x="108" y="200" text-anchor="middle" font-size="12" fill="#94A3B8">groupId:artifactId:version</text>
    <text x="108" y="222" text-anchor="middle" font-size="12" fill="#22D3EE">≈ package.json</text>
  </g>

  <path d="M196 158 L246 158" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m02-a)"/>
  <text x="221" y="150" text-anchor="middle" font-size="11" fill="#22D3EE">先查本地</text>
  <path d="M246 196 L196 196" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m02-a)"/>
  <text x="221" y="216" text-anchor="middle" font-size="11" fill="#22D3EE">命中即用</text>

  <g>
    <rect x="252" y="108" width="180" height="140" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.6"/>
    <text x="342" y="140" text-anchor="middle" font-size="14" fill="#E2E8F0">本地仓库</text>
    <text x="342" y="162" text-anchor="middle" font-size="12" fill="#94A3B8">~/.m2/repository</text>
    <text x="342" y="186" text-anchor="middle" font-size="12" fill="#94A3B8">按 GAV 分层存放 jar</text>
    <text x="342" y="210" text-anchor="middle" font-size="12" fill="#F59E0B">≈ node_modules</text>
    <text x="342" y="232" text-anchor="middle" font-size="11" fill="#94A3B8">全局共享，不在项目里</text>
  </g>

  <path d="M436 150 L486 150" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m02-a)"/>
  <text x="461" y="142" text-anchor="middle" font-size="11" fill="#22D3EE">缺失则下载</text>
  <path d="M486 198 L436 198" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m02-a)"/>
  <text x="461" y="218" text-anchor="middle" font-size="11" fill="#22D3EE">缓存到本地</text>

  <g>
    <rect x="492" y="118" width="164" height="120" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.6"/>
    <text x="574" y="150" text-anchor="middle" font-size="14" fill="#E2E8F0">远程仓库</text>
    <text x="574" y="174" text-anchor="middle" font-size="13" fill="#94A3B8">阿里云镜像 / Central</text>
    <text x="574" y="200" text-anchor="middle" font-size="12" fill="#94A3B8">默认在国外，必须换源</text>
    <text x="574" y="222" text-anchor="middle" font-size="12" fill="#22D3EE">≈ npm registry</text>
  </g>

  <g>
    <rect x="120" y="272" width="440" height="60" rx="10" fill="#16233A" stroke="#22D3EE" stroke-width="1.4"/>
    <text x="340" y="298" text-anchor="middle" font-size="13" fill="#E2E8F0">mvn install 会把本项目打好的 jar 也放进本地仓库</text>
    <text x="340" y="320" text-anchor="middle" font-size="12" fill="#94A3B8">届时它就成了「别人可以引用的那个依赖」</text>
  </g>
  <path d="M342 252 L342 268" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m02-a)"/>
</svg>`,
        },
        {
          type: 'text',
          html: String.raw`<p>还要提前记住：<strong>本地仓库是全局的，不在你的项目目录里</strong>。这与 <code>node_modules</code> 不同。好处是同样的 jar 在磁盘上只有一份，多个项目共享；代价是你删了项目也删不掉依赖，需要用时才 <code>settings.xml</code> 里指定的路径去找。</p>`,
        },
        {
          type: 'table',
          title: 'Maven 约定的标准目录结构（对照前端项目）',
          head: ['Maven 目录', '放什么', '前端对照'],
          rows: [
            ['src/main/java', 'Java 源码', 'src/ 目录'],
            ['src/main/resources', '配置文件（application.yml 等）', 'src/assets、.env'],
            ['src/test/java', '单元测试代码', '__tests__ / *.spec.ts'],
            ['src/test/resources', '测试用配置', '测试 fixture'],
            ['target', '构建产物（编译后的 class、jar）', 'dist/'],
            ['pom.xml', '项目与依赖清单', 'package.json'],
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '先确认 Maven 可用',
          code: String.raw`# 查看 Maven 与 JDK 版本（一行命令同时确认三件事）
mvn -v

# 输出大致如下：
# Apache Maven 3.9.x
# Maven home: D:\apache-maven-3.9.9
# Java version: 17.0.x, vendor: Eclipse Adoptium
# Default locale: zh_CN, platform encoding: UTF-8`,
        },
        {
          type: 'tip',
          html: String.raw`<p><strong>约定优于配置（Convention over Configuration）</strong>是 Maven 的核心哲学：目录结构不用配，照约定放就行。这与 Spring Boot 的设计思想一脉相承——后面你会反复见到这个词。</p>
<p>这也是为什么本课程不教你研究 Maven 的插件和自定义目录——那是留给构建工程师的事。对我们而言，Maven 只要会「加依赖、跑命令、换源」三件事就够用了。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能说出 pom.xml、<code>~/.m2/repository</code>、settings.xml 分别对应前端的什么。</li>
<li><code>mvn -v</code> 能输出 Maven 3.9.x 且 Java version 显示 17。</li>
<li>知道 Java 源码要放在 <code>src/main/java</code> 而不是随便一个目录。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: 'Maven 本地仓库的默认位置是哪里？',
          options: [
            '项目根目录下的 lib 文件夹',
            '用户主目录下的 .m2/repository',
            'IDEA 安装目录下的 repository',
            '项目根目录下的 node_modules',
          ],
          answer: 1,
          explain:
            '本地仓库默认是 ~/.m2/repository（Windows 即 C:\\Users\\<用户名>\\.m2\\repository），是全局共享的，不在项目目录内。',
        },
        {
          q: '下列命令与前端命令的类比，不正确的是？',
          options: [
            'mvn package ≈ npm run build',
            'pom.xml ≈ package.json',
            'mvn install ≈ npm install',
            'target 目录 ≈ dist 目录',
          ],
          answer: 2,
          explain:
            'mvn install 的含义是「打包并安装到本地仓库」，让别人能引用你的项目，与 npm install（下载依赖到本地）语义不同。单纯下载依赖在 Maven 里没有单独命令，构建时自动完成。',
        },
        {
          q: 'Java 源码按照 Maven 约定应该放在哪个目录？',
          options: ['src/main/java', 'src', 'src/resources', 'source'],
          answer: 0,
          explain:
            'Maven 强制约定：主源码 src/main/java，配置文件 src/main/resources，测试 src/test/java。放在其他位置编译时会被忽略。',
        },
      ],
    },

    /* ============================ L02 ============================ */
    {
      id: 'm02-l02',
      title: 'pom.xml 与依赖管理',
      minutes: 30,
      goal: '看懂 pom.xml 的每个节点，学会用 GAV 坐标加依赖、理解依赖传递与版本冲突排查。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p><code>pom.xml</code> 是 Maven 项目的心脏。它比 <code>package.json</code> 啰嗦不少，但常用节点其实只有四五个。我们先看一个最小可用版本。</p>`,
        },
        {
          type: 'code',
          lang: 'xml',
          filename: 'pom.xml（最小可用版）',
          code: String.raw`<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <!-- 本项目自己的坐标：groupId 通常是倒写的域名 -->
  <groupId>com.example</groupId>
  <artifactId>hello-maven</artifactId>
  <version>1.0-SNAPSHOT</version>

  <!-- 基于 JDK 17 编译；SNAPSHOT 表示开发中的快照版本 -->
  <properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.apache.commons</groupId>
      <artifactId>commons-lang3</artifactId>
      <version>3.14.0</version>
    </dependency>
  </dependencies>
</project>`,
        },
        {
          type: 'table',
          title: '依赖节点的三个必填字段：GAV 坐标',
          head: ['字段', '含义', '类比 npm', '示例'],
          rows: [
            ['groupId', '组织 / 公司标识，通常倒写域名', '包名的作用域 @scope', 'org.apache.commons'],
            ['artifactId', '项目 / 库名', '包名本身', 'commons-lang3'],
            ['version', '版本号，必须写全', '版本号', '3.14.0'],
            ['scope', '生效范围（可选）', 'dependencies vs devDependencies', 'test / provided'],
          ],
        },
        {
          type: 'text',
          html: String.raw`<p>加了依赖之后，你可以在本地仓库里亲眼看到它的落点：<code>~/.m2/repository/org/apache/commons/commons-lang3/3.14.0/</code>。目录层级就是 groupId 的点换成斜杠，再拼 artifactId 和 version——Maven 的仓库布局就是这么朴素。</p>`,
        },
        {
          type: 'table',
          title: 'scope 作用域对照',
          head: ['scope', '编译时', '测试时', '打包时', '典型场景'],
          rows: [
            ['compile（默认）', '✅', '✅', '✅', '绝大多数业务依赖'],
            ['test', '❌', '✅', '❌', 'JUnit 单元测试'],
            ['provided', '✅', '✅', '❌', '容器会提供，例如 Tomcat 自带的 Servlet API'],
            ['runtime', '❌', '✅', '✅', '运行时才需要，如 MySQL 驱动'],
          ],
        },
        {
          type: 'steps',
          title: '依赖冲突排查三步法',
          items: [
            String.raw`先看现象：运行时报 <code>NoSuchMethodError</code>、<code>ClassNotFoundException</code>，或某个类的行为与文档不符——多半是同一个 jar 的两个版本同时存在。`,
            String.raw`命令行敲 <code>mvn dependency:tree</code>，从输出里找重复出现的 artifactId，Maven 会用「omitted for conflict with x.x.x」标出被淘汰的版本。`,
            String.raw`IDEA 里更直观：右侧 <strong>Maven 面板</strong> → 选中项目 → 工具栏的 <strong>Show Dependencies</strong>（或右键 Diagrams → Show Dependencies），红实线就是冲突路径。`,
            String.raw`处理：要么在 pom 里<strong>显式声明</strong>你想要的版本（最近优先会让它胜出），要么在引入方里用 <code>exclusions</code> 把传递依赖排除掉。`,
          ],
        },
        {
          type: 'code',
          lang: 'xml',
          filename: '用 exclusions 排除传递依赖',
          code: String.raw`<dependency>
  <groupId>com.example</groupId>
  <artifactId>some-lib</artifactId>
  <version>1.2.0</version>
  <exclusions>
    <!-- some-lib 内部依赖了旧版 commons-logging，这里把它排除 -->
    <exclusion>
      <groupId>commons-logging</groupId>
      <artifactId>commons-logging</artifactId>
    </exclusion>
  </exclusions>
</dependency>`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>理解仲裁原则，别记忆每一条规则。</strong>Maven 面对同一个依赖的多个版本时：<strong>路径最近者优先</strong>（你的 pom 里直接写的，胜过层层传递来的）；<strong>路径长度相同时，先声明者优先</strong>。所以「在 pom 里显式写死版本」永远是最省心的解法。</p>
<p><strong>注意：</strong>Maven 不像 npm 有 lock 文件帮你锁定传递依赖，它每次都重新仲裁。因此 pom 里写明版本很重要。</p>`,
        },
        {
          type: 'fe',
          html: String.raw`<p>Spring Boot 项目之所以能「加依赖不写版本号」，是因为 pom 里继承了 <code>spring-boot-starter-parent</code>，它的 <code>dependencyManagement</code> 节点已经替你仲裁好了几百个依赖的版本。</p>
<p>这就像 monorepo 里在根目录统一锁版本：子包引用时只写名字不写版本，避免各包版本打架。m04 建 Spring Boot 项目时你会亲眼见到。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能手写出一个最小 pom.xml，包含 modelVersion、GAV、properties、dependencies。</li>
<li>能从 Maven Central 上复制一个依赖的 GAV 并加进项目。</li>
<li>会用 <code>mvn dependency:tree</code> 查看依赖树，能说出版本冲突的两条仲裁原则。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: '依赖的 GAV 坐标指的是哪三个字段？',
          options: [
            'group / artifact / version',
            'groupId / artifactId / version',
            'package / name / version',
            'groupId / name / tag',
          ],
          answer: 1,
          explain:
            'groupId（组织）+ artifactId（库名）+ version（版本）三者唯一确定一个依赖制品，缺任何一个都无法定位 jar。',
        },
        {
          q: '想让某个依赖只在运行测试时生效、打包时不进入产物，scope 应该填？',
          options: ['compile', 'test', 'provided', 'runtime'],
          answer: 1,
          explain:
            'scope=test 对应 npm 的 devDependencies，只在编译和执行测试代码时用；provided 含义是「运行环境已有，别打进包里」，常用于 Servlet API。',
        },
        {
          q: '同一个依赖出现了 1.2 与 1.5 两个版本，Maven 默认会怎么处理？',
          options: [
            '总是选择版本号更高的 1.5',
            '总是选择先声明的那个',
            '路径最近者优先；路径相同时先声明者优先',
            '随机选一个，因此必须手动指定',
          ],
          answer: 2,
          explain:
            'Maven 采用「最近优先 + 先声明优先」，而不是「取最高版本」。这也是为什么在自己的 pom 里显式写版本最可控。',
        },
      ],
    },

    /* ============================ L03 ============================ */
    {
      id: 'm02-l03',
      title: '生命周期与常用命令',
      minutes: 30,
      goal: '记住 clean / compile / test / package / install 五个高频命令及其顺序关系，能在命令行里跑通一次完整构建。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>Maven 的生命周期（Lifecycle）可以理解成<strong>一条有固定顺序的流水线</strong>。关键一句话：<strong>执行后面的阶段，会先自动把前面的阶段全部跑一遍</strong>。</p>
<p>所以你敲 <code>mvn package</code>，Maven 会先 validate → compile → test → 最后才是 package。理解了这一点，你就不会困惑「为什么我没让他跑测试，它却在跑测试」。</p>`,
        },
        {
          type: 'diagram',
          caption: '生命周期流水线：后面的阶段包含前面的阶段',
          svg: String.raw`<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m02-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="12" fill="#0F1B2D"/>
  <text x="340" y="38" text-anchor="middle" font-size="17" fill="#E2E8F0">Maven 构建流水线（阶段有序，向后包含）</text>

  <g font-size="13">
    <rect x="28" y="96" width="108" height="64" rx="10" fill="#1B2A44" stroke="#94A3B8" stroke-width="1.4"/>
    <text x="82" y="124" text-anchor="middle" fill="#E2E8F0">clean</text>
    <text x="82" y="144" text-anchor="middle" font-size="11" fill="#94A3B8">删掉 target</text>

    <rect x="160" y="96" width="108" height="64" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.4"/>
    <text x="214" y="124" text-anchor="middle" fill="#E2E8F0">compile</text>
    <text x="214" y="144" text-anchor="middle" font-size="11" fill="#94A3B8">编译主源码</text>

    <rect x="292" y="96" width="108" height="64" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.4"/>
    <text x="346" y="124" text-anchor="middle" fill="#E2E8F0">test</text>
    <text x="346" y="144" text-anchor="middle" font-size="11" fill="#94A3B8">跑单元测试</text>

    <rect x="424" y="96" width="108" height="64" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.4"/>
    <text x="478" y="124" text-anchor="middle" fill="#E2E8F0">package</text>
    <text x="478" y="144" text-anchor="middle" font-size="11" fill="#94A3B8">打成 jar</text>

    <rect x="556" y="96" width="94" height="64" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.4"/>
    <text x="603" y="124" text-anchor="middle" fill="#E2E8F0">install</text>
    <text x="603" y="144" text-anchor="middle" font-size="11" fill="#94A3B8">入本地库</text>
  </g>

  <g stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m02-b)">
    <line x1="138" y1="128" x2="156" y2="128"/>
    <line x1="270" y1="128" x2="288" y2="128"/>
    <line x1="402" y1="128" x2="420" y2="128"/>
    <line x1="534" y1="128" x2="552" y2="128"/>
  </g>

  <g>
    <rect x="60" y="212" width="560" height="64" rx="10" fill="#16233A" stroke="#22D3EE" stroke-width="1.4"/>
    <text x="340" y="238" text-anchor="middle" font-size="13" fill="#E2E8F0">执行 mvn package，等价于先跑完 compile + test 再打包</text>
    <text x="340" y="262" text-anchor="middle" font-size="12" fill="#94A3B8">所以最常用组合是：mvn clean package -DskipTests</text>
  </g>

  <g>
    <rect x="60" y="292" width="560" height="48" rx="10" fill="#16233A" stroke="#F59E0B" stroke-width="1.4"/>
    <text x="340" y="318" text-anchor="middle" font-size="12" fill="#E2E8F0">产物位置：target/classes（编译结果） · target/xxx-1.0-SNAPSHOT.jar（打包结果）</text>
  </g>
</svg>`,
        },
        {
          type: 'compare',
          title: 'Maven 命令 ↔ 前端命令',
          head: ['Maven 命令', '做什么', '前端对照'],
          rows: [
            ['mvn clean', '删除 target 目录', 'rimraf dist'],
            ['mvn compile', '编译 src/main/java 到 target/classes', 'tsc 类型检查 + 转译'],
            ['mvn test', '编译并运行 src/test/java 的测试', 'vitest run'],
            ['mvn package', '打包成 jar 放在 target/', 'npm run build'],
            ['mvn install', '打包 + 安装到本地仓库', 'npm publish 到本地 registry'],
            ['mvn clean package -DskipTests', '干净打包且跳过测试', 'npm run build --no-verify（日常最常用）'],
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '一次完整构建（Windows 终端）',
          code: String.raw`# 进入项目根目录（pom.xml 所在的那一层）
cd D:\code\hello-maven

# 1. 编译：产物出现在 target\classes
mvn compile

# 2. 打包：产物出现在 target\hello-maven-1.0-SNAPSHOT.jar
mvn package

# 3. 干净构建（先删 target 再打包），并跳过测试
mvn clean package -DskipTests

# 4. 安装到本地仓库，其他项目就能引用它了
mvn install

# 5. 查看依赖树（排查版本冲突）
mvn dependency:tree

# 6. 临时指定某个参数运行（这里是 dev 环境的示例）
java -jar target\hello-maven-1.0-SNAPSHOT.jar --spring.profiles.active=dev`,
        },
        {
          type: 'fe',
          html: String.raw`<p><code>target/</code> 就是 <code>dist/</code>。区别在于：<code>dist/</code> 里是 HTML/CSS/JS，交给 Nginx 或 CDN；<code>target/</code> 里是 <code>.class</code> 字节码和 jar，交给 JVM 运行。</p>
<p>另外，IDEA 会把 <code>target/</code> 自动标记为 Excluded（在目录上标记为橙色），你在 Project 面板里可能直接看不到它——这不是 Bug，去 Windows 资源管理器里看就找到了。</p>`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑 1：<code>-DskipTests</code> 与 <code>-Dmaven.test.skip=true</code> 不是一回事。</strong>前者<strong>跳过测试的执行但仍然编译测试代码</strong>（推荐，测试代码有语法错误能立即发现）；后者连编译都跳过，速度快但可能把写坏的测试一直藏着。</p>
<p><strong>坑 2：<code>java -jar</code> 报 <code>no main manifest attribute</code>。</strong>Maven 打出的普通 jar 里<strong>不包含依赖，也没有指定入口类</strong>。Spring Boot 项目需要 <code>spring-boot-maven-plugin</code> 重新打包成可执行 fat jar——这个坑在 <strong>m08 打包部署</strong>会完整解决，这里先记住现象。</p>
<p><strong>坑 3：命令必须在 pom.xml 所在目录执行。</strong>在子目录里敲 mvn 会报 <code>The goal you specified requires a project to execute</code>。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能按顺序说出 clean → compile → test → package → install 五个阶段。</li>
<li>能独立完成一次 <code>mvn clean package -DskipTests</code>，并在 <code>target/</code> 里找到 jar 文件。</li>
<li>理解为什么 <code>mvn package</code> 会顺带跑测试。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: '执行 mvn package 时，Maven 会做下列哪件事？',
          options: [
            '只执行打包这一个动作',
            '自动先执行其之前的 compile、test 等阶段',
            '只执行 clean 和 package',
            '必须先手动执行 mvn test 否则报错',
          ],
          answer: 1,
          explain:
            '生命周期阶段是有序且向后包含的：执行 package 会依次触发 validate、compile、test 等前面的所有阶段。想跳过测试需显式加 -DskipTests。',
        },
        {
          q: '关于 -DskipTests 和 -Dmaven.test.skip=true 的区别，正确的是？',
          options: [
            '两者完全等价',
            '-DskipTests 跳过测试执行但会编译测试代码；-Dmaven.test.skip=true 连编译都跳过',
            '-Dmaven.test.skip=true 会跳过编译，但仍会执行已有测试',
            '两者都不能跳过测试',
          ],
          answer: 1,
          explain:
            '-DskipTests 只跳过执行、仍编译，能暴露测试代码的语法错误，日常推荐用它。',
        },
        {
          q: 'mvn dependency:tree 这条命令的主要作用是？',
          options: [
            '查看项目的目录树',
            '生成依赖调用关系图并产出 HTML 报告',
            '打印依赖树，用于排查传递依赖与版本冲突',
            '把依赖打包成一棵压缩包',
          ],
          answer: 2,
          explain:
            'dependency:tree 是排查「同一个 jar 出现两个版本」的首选工具，冲突版本会被标注 omitted for conflict。',
        },
      ],
    },

    /* ============================ L04 ============================ */
    {
      id: 'm02-l04',
      title: '换源与 IDEA 集成',
      minutes: 25,
      goal: '配置阿里云镜像解决下载慢的问题，并让 IDEA 正确识别 Maven home 与 settings.xml。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>Maven 默认的中央仓库在国外，国内直连经常卡在 <code>Downloading ...</code> 几十秒然后超时。<strong>这是初学者遇到频率最高的问题，没有之一。</strong></p>
<p>解法就是把下载源换成国内镜像，原理和你给 npm 配淘宝镜像一模一样。</p>`,
        },
        {
          type: 'fe',
          html: String.raw`<p>对照前端：</p>
<ul><li><code>settings.xml</code> ≈ <code>.npmrc</code></li>
<li>配阿里云镜像 ≈ <code>npm config set registry https://registry.npmmirror.com</code></li>
<li><code>~/.m2</code> ≈ <code>~/.npm</code>（全局缓存目录）</li></ul>`,
        },
        {
          type: 'steps',
          title: '第一步：创建 settings.xml',
          items: [
            String.raw`先看看有没有：打开文件管理器，进入 <code>C:\Users\&lt;你的用户名&gt;\.m2\</code>。`,
            String.raw`如果里面没有 <code>settings.xml</code>（<strong>默认就是没有的</strong>），新建一个文本文档，重命名它为 <code>settings.xml</code>。`,
            String.raw`Windows 默认隐藏扩展名，务必先在「查看」里勾选<strong>文件扩展名</strong>，否则会创建成 <code>settings.xml.txt</code> 而完全不起作用。`,
            String.raw`用记事本或 IDEA 打开，粘贴下面这段内容并保存（注意文件编码选 UTF-8）。`,
          ],
        },
        {
          type: 'code',
          lang: 'xml',
          filename: 'C:\\Users\\<你的用户名>\\.m2\\settings.xml',
          code: String.raw`<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                              https://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <!-- 阿里云公共仓库：mirrorOf 为 * 时代理所有仓库请求 -->
    <mirror>
      <id>aliyunmaven</id>
      <name>阿里云公共仓库</name>
      <url>https://maven.aliyun.com/repository/public</url>
      <mirrorOf>*</mirrorOf>
    </mirror>
  </mirrors>
</settings>`,
        },
        {
          type: 'tip',
          html: String.raw`<p><strong>mirrorOf 填 <code>*</code> 表示代理所有仓库</strong>，是最省心也最常用的写法。如果你的公司有私有仓库（Nexus），则通常写成 <code>*,!company-repo</code> 表示「除 company-repo 之外全部走镜像」。</p>`,
        },
        {
          type: 'steps',
          title: '第二步：让 IDEA 用上这份配置',
          items: [
            String.raw`打开 <code>File → Settings → Build, Execution, Deployment → Build Tools → Maven</code>。`,
            String.raw`<strong>Maven home path</strong>：下拉选择 <code>Bundled (Maven 3)</code>（IDEA 自带的 3.9，零配置），或选 Use Maven wrapper / 自己安装的目录。`,
            String.raw`<strong>User settings file</strong>：勾选 <code>Override</code>，指向刚才的 <code>C:\Users\&lt;用户名&gt;\.m2\settings.xml</code>。不勾选 Override 的话，IDEA 用的就是这份默认路径，效果相同。`,
            String.raw`<strong>Local repository</strong>：一般留默认（<code>~/.m2/repository</code>）即可，勾选 Override 可以改到别的盘解救 C 盘。`,
            String.raw`IDEA 右侧 <strong>Maven 面板</strong>（没有的话从菜单 <code>View → Tool Windows → Maven</code> 打开），面板左上角刷新图标就是 <strong>Reload All Maven Projects</strong>。`,
            String.raw`想省事可以开启自动重载：<code>Settings → Build Tools → Maven → Importing</code>，勾选 Reload project after changes in the build script。`,
          ],
        },
        {
          type: 'table',
          title: 'Maven 面板生命周期双击即可执行（不用敲命令）',
          head: ['面板分组', '双击效果', '等价命令'],
          rows: [
            ['Lifecycle → clean', '删除 target', 'mvn clean'],
            ['Lifecycle → compile', '编译源码', 'mvn compile'],
            ['Lifecycle → test', '运行测试', 'mvn test'],
            ['Lifecycle → package', '打包', 'mvn package'],
            ['Lifecycle → install', '安装到本地仓库', 'mvn install'],
            ['Dependencies', '展开看所有依赖及其来源', 'mvn dependency:tree'],
          ],
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑 1：改了 pom.xml，IDEA 里还是报红。</strong>这是没重新导入导致的。点 Maven 面板左上角的刷新按钮 <strong>Reload All Maven Projects</strong>，或右键 pom.xml → Maven → Reload project。</p>
<p><strong>坑 2：命令行能跑，IDEA 里跑不了（或反过来）。</strong>两者可能用了不同的 Maven 和不同的 settings.xml。用 <code>mvn -v</code> 看命令行的 Maven home，再和 IDEA 设置里的 Maven home path 对比。</p>
<p><strong>坑 3：IDEA 右下角弹 Import Changes / 依赖下划线红色。</strong>新项目首次打开时 IDEA 会提示信任与导入，选 Trust Project 并等待右下角进度条跑完再写代码。</p>
<p><strong>坑 4：<code>mvn -v</code> 报「不是内部或外部命令」。</strong>Maven 的 bin 目录没进 Path。最快的解法是<strong>别自己在命令行用 Maven</strong>，全部通过 IDEA 的 Maven 面板操作。</p>`,
        },
        {
          type: 'table',
          title: 'mvn 常见报错速查（Windows）',
          head: ['报错 / 现象', '原因', '怎么办'],
          rows: [
            ['mvn 不是内部或外部命令', 'Maven 未安装或 Path 未配置', '用 IDEA 内置 Bundled Maven，或配 MAVEN_HOME + Path 追加 %MAVEN_HOME%\\bin'],
            ['一直卡在 Downloading', '没换源，直连国外仓库', '配置阿里云镜像 settings.xml'],
            ['Could not find artifact xxx', 'GAV 写错，或依赖不在任何仓库里', '去 search.maven.org 核对坐标'],
            ['BUILD FAILURE: 不再支持源选项 8', 'pom 里编译版本低于项目的 JDK', '把 maven.compiler.source/target 改成 17'],
            ['Cannot access xxx in offline mode', '勾选了 Work offline', 'Maven 面板取消 Toggle Offline Mode（那个小云图标）'],
          ],
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li><code>settings.xml</code> 已配好阿里云镜像，新建一个项目加依赖能在 10 秒内下完。</li>
<li>IDEA 的 Maven home 与 User settings file 路径是你自己指定的那个。</li>
<li>知道改完 pom 要点 Reload All Maven Projects。</li></ul>
<p>下一模块进入 <strong>Java 语法</strong>——我们会用纯内存的待办清单小练习，为 m04 的 Spring Boot 铺路。</p>`,
        },
      ],
      quiz: [
        {
          q: 'settings.xml 的默认位置是？',
          options: [
            '项目根目录下',
            'C:\\Users\\<用户名>\\.m2\\settings.xml',
            'IDEA 安装目录下',
            '与 pom.xml 同级',
          ],
          answer: 1,
          explain:
            'Maven 的用户级配置文件在 ~/.m2/settings.xml，而这个目录下默认只有 repository 文件夹，settings.xml 需要你自己创建。',
        },
        {
          q: '在 IDEA 中修改了 pom.xml 添加新依赖，代码里 import 仍报红，最应该先做？',
          options: [
            '重启电脑',
            '点击 Maven 面板的 Reload All Maven Projects',
            '删除 target 目录',
            '重新安装 IDEA',
          ],
          answer: 1,
          explain:
            'IDEA 需要重新导入才能同步依赖到项目的 classpath。Reload 是最直接的解法；也可以在设置里开启自动重载避免每次手动点。',
        },
        {
          q: '关于国内使用 Maven 必须换源的原因，下列说法正确的是？',
          options: [
            '中央仓库不提供开源依赖',
            '默认中央仓库在国外，直连下载慢或超时',
            '阿里云镜像拥有独家依赖',
            '不换源就无法安装 Maven',
          ],
          answer: 1,
          explain:
            '镜像仓库的内容与中央仓库是一致的，纯粹是网络速度问题。配置 mirrorOf 为 * 之后，所有仓库请求都改走国内节点。',
        },
      ],
    },

    /* ============================ L05 ============================ */
    {
      id: 'm02-l05',
      title: '避坑清单：Maven 翻车 Top 6',
      minutes: 30,
      goal: '收拢公司项目里最高频的 6 个 Maven 坑：依赖冲突、SNAPSHOT、scope 误用、仓库缓存损坏、镜像劫持、JDK 错位。每个坑按「现象 → 原因 → 修法」给出可执行的排查动作。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>前面四课讲的是「怎么用」，这一课讲「炸了怎么办」。这 6 个坑覆盖了新人接手 Java 项目第一周最可能遇到的故障——尤其是<strong>依赖冲突</strong>，它几乎是所有 <code>NoSuchMethodError</code> / <code>ClassNotFoundException</code> 的第一嫌疑人。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 1：依赖冲突（出现率第一）。</strong>你的项目依赖 A 和 B，A 要 commons-lang:3.12，B 要 3.5——Maven <strong>不会真的引入两个版本，只会留下一个</strong>。仲裁规则：路径最短优先；深度相同则先声明优先。被淘汰版本里的类如果恰好在运行期被用到，就炸：</p>
<ul><li><code>java.lang.NoSuchMethodError</code>——类在、方法没了（旧版本被选中）；</li>
<li><code>java.lang.NoClassDefFoundError</code>——整个类都不在。</li></ul>
<p>最阴险的是：<strong>编译期没事，启动或运行到某条路径才炸</strong>，因为编译用的是你直接声明的版本。</p>`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '排查三步',
          code: `# 第一步：看依赖树，verbose 模式会标出冲突与被忽略的版本
mvn dependency:tree -Dverbose

# 只盯可疑的库（Windows 用 findstr，Mac/Linux 用 grep）
mvn dependency:tree -Dverbose -Dincludes=com.google.guava:guava

# 第二步：在父 pom 的 dependencyManagement 里一锤定音（推荐，别到处写 exclusion）
# <dependencyManagement> 只是「预定义版本」，不会真的引入依赖；
# 一旦这个库出现在依赖树任何位置，都会被强制统一成这里声明的版本
# <dependencyManagement>
#   <dependencies>
#     <dependency>
#       <groupId>com.google.guava</groupId>
#       <artifactId>guava</artifactId>
#       <version>33.0.0-jre</version>
#     </dependency>
#   </dependencies>
# </dependencyManagement>

# 第三步：改完再跑一次依赖树确认只剩一个版本
mvn dependency:tree -Dincludes=com.google.guava:guava`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>为什么推荐 dependencyManagement 而不是到处写 exclusion？</strong>exclusion 要在<strong>每一个</strong>引入冲突库的依赖上写一遍，漏一处就复发，而且新人看不懂这段历史。dependencyManagement 在父 pom 写一处全局生效，优先级高于一切仲裁规则。IDEA 里打开 pom 底部的「Dependency Analyzer」标签页，可以图形化看冲突，比命令行直观。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 2：SNAPSHOT 快照依赖。</strong><code>1.0-SNAPSHOT</code> 的含义是「这个版本还没定稿，内容随时会变」——Maven 会定期去远端检查有没有新快照。后果：同一个版本号，今天和昨天下载到的 jar 内容不同，生产环境行为不可复现。公司项目口径：<strong>自己发布的包用固定版本号（1.0.0），只在内部联调期临时用 SNAPSHOT</strong>；看到别人的依赖带 SNAPSHOT 后缀，先问清楚什么时候转正。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 3：scope 用错，运行时类找不到。</strong>scope 决定依赖出现在哪个阶段。最高频事故是把<strong>运行时需要的库</strong>（MySQL 驱动、redis 客户端）声明成 <code>test</code> 或 <code>provided</code>——编译期一切正常（test/provided 都参与编译），一启动就 <code>ClassNotFoundException: com.mysql.cj.jdbc.Driver</code>。</p>`,
        },
        {
          type: 'table',
          title: 'scope 误用速查',
          head: ['scope', '参与编译', '打进 jar', '典型误用后果'],
          rows: [
            ['compile（默认）', '是', '是', '无'],
            ['provided', '是', '否', '运行时类缺失，如误把驱动设为 provided'],
            ['runtime', '否', '是', '代码里 import 不到，但运行期可用（驱动推荐写法之一）'],
            ['test', '否', '否', '运行时类缺失，如误把驱动设成 test'],
            ['system', '是', '否', '依赖本地路径 jar，别人机器必挂，禁用'],
          ],
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 4：本地仓库缓存损坏，怎么刷都拉不下来。</strong>网络中断时 Maven 会在本地仓库留下 <code>*.lastUpdated</code> 标记文件，之后它认为「这个版本下载过了但失败」，直接拒绝重试。现象是：同事那边好好的，你这边死活 <code>Could not resolve dependencies</code>：</p>`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '清理缓存重试',
          code: `# 方法一：强制刷新，忽略失败标记
mvn clean install -U

# 方法二：手动删残留标记（Windows PowerShell，进本地仓库目录后执行）
cd $env:USERPROFILE\\.m2\\repository
Get-ChildItem -Recurse -Filter *.lastUpdated | Remove-Item -Force

# 方法三：整个目录删掉让它重下（最后手段）
Remove-Item -Recurse -Force $env:USERPROFILE\\.m2\\repository\\com\\example\\xxx`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 5：settings.xml 的 mirrorOf 把私服也劫走了。</strong>公司项目通常配内部私服（Nexus/Artifactory）托管二方包。如果你为了下载快把镜像配成 <code>&lt;mirrorOf&gt;*&lt;/mirrorOf&gt;</code>，<strong>所有仓库请求（包括公司私服）都会被劫到国内镜像</strong>，内部包永远 404。公司项目里镜像要么删掉、要么把私服排除：<code>&lt;mirrorOf&gt;*,!internal-repo&lt;/mirrorOf&gt;</code>（internal-repo 是私服在 pom 里的 id）。反过来，报 <code>Could not find artifact com.company:xxx</code> 时第一个要检查的就是 settings.xml 有没有把私服放行。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 6：mvn 用的 JDK 不是你以为的那个。</strong>命令行里 <code>java -version</code> 是 17，但 mvn 构建用的 JDK 由 <code>JAVA_HOME</code> 决定，两者经常不一致。现象是 <code>invalid target release: 17</code>（mvn 用着 JDK 11 编译 target 17 的项目）或中文注释乱码。检查顺序：</p>`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '核对 JDK',
          code: `# 看 mvn 实际用的 JDK（第一行 Java version 就是）
mvn -version

# 不一致就改 JAVA_HOME（PowerShell 临时改，仅当前窗口生效）
$env:JAVA_HOME = "C:\\Program Files\\Java\\jdk-17"

# IDEA 里另有一处：Settings → Build Tools → Maven → Runner → JRE，也要选对`,
        },
        {
          type: 'table',
          title: 'Maven 报错速查表（建议截图保存）',
          head: ['报错 / 现象', '第一嫌疑', '修法'],
          rows: [
            ['NoSuchMethodError / NoClassDefFoundError', '依赖冲突', 'dependency:tree -Dverbose + dependencyManagement 锁版本'],
            ['Could not resolve dependencies', '缓存损坏 / 私服不通', '删 .lastUpdated 后 mvn -U；查 settings.xml 私服配置'],
            ['Could not find artifact com.company:xxx', '私服被镜像劫走', 'mirrorOf 排除私服 id'],
            ['invalid target release: 17', 'mvn 用错 JDK', '核对 mvn -version 与 JAVA_HOME'],
            ['启动时驱动类找不到', 'scope 误用', '驱动 scope 改回 compile / runtime'],
            ['同事能打包你不能', '本地差异', '先 diff settings.xml 和本地仓库缓存，再问网络'],
          ],
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>对照前端记忆：</strong>依赖冲突 ≈ node_modules 里同时存在两个版本的包（pnpm 会隔离，npm 扁平化后也会仲裁）；dependencyManagement ≈ 根 package.json 的 resolutions/overrides；SNAPSHOT ≈ <code>next</code> / canary 标签，天天变；.lastUpdated 缓存损坏 ≈ npm 缓存坏了要 <code>npm cache clean</code>。心智完全对得上，只是 Maven 的仲裁规则更古老、报错更隐晦。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>遇到 NoSuchMethodError 能条件反射跑 <code>mvn dependency:tree -Dverbose</code>。</li>
<li>知道 dependencyManagement 与 exclusion 的取舍。</li>
<li>能自己清理 .lastUpdated 缓存、核对 mvn 使用的 JDK。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: '项目运行时抛 NoSuchMethodError，编译期却一切正常。最可能的 cause 与第一排查动作是？',
          options: [
            'JDK 版本太低 → 升级 JDK',
            '依赖冲突：运行期加载了另一个版本的类 → mvn dependency:tree -Dverbose',
            '代码有语法错误 → 重新编译',
            'settings.xml 没配镜像 → 先换源',
          ],
          answer: 1,
          explain:
            '编译期正常说明「你直接引用的版本」有这个方法；运行期炸说明 classpath 上实际生效的是另一个（更旧的）版本。用 verbose 依赖树找出同库多版本，再用 dependencyManagement 统一。',
        },
        {
          q: '关于 SNAPSHOT 快照依赖，说法正确的是？',
          options: [
            'SNAPSHOT 版本号固定，内容也固定，可放心用于生产',
            'SNAPSHOT 内容会随远端更新而变化，生产发布必须用固定版本号',
            'SNAPSHOT 下载更快，适合 CI 环境',
            'SNAPSHOT 与 RELEASE 的唯一区别是命名习惯',
          ],
          answer: 1,
          explain:
            'SNAPSHOT 表示「未定稿」，Maven 会定期拉取远端最新快照，同一版本号内容可能不同，导致生产行为不可复现。内部联调可临时使用，对外发布一律固定版本。',
        },
        {
          q: '把 MySQL 驱动的 scope 错写成 test，启动应用时会怎样？',
          options: [
            '编译报错，ClassNotFound',
            '编译正常，启动建数据源时抛 ClassNotFoundException: com.mysql.cj.jdbc.Driver',
            '完全没影响，test 只影响测试',
            '打包直接失败',
          ],
          answer: 1,
          explain:
            'test scope 参与测试编译但打包不进产物，所以主代码编译没问题，运行时 classpath 上没有驱动类。数据源初始化发生在启动期，于是启动炸。驱动 scope 用默认 compile 或 runtime。',
        },
        {
          q: '同事项目能正常拉取公司内部私服的包，你这边一直 Could not find artifact。先检查什么？',
          options: [
            '重装 Maven',
            '你的 settings.xml 里 mirrorOf 是否为 *，把私服请求劫持到了公共镜像',
            '让同事把 jar 发给你手动 install',
            '把私服地址写进 pom 的 dependencyManagement',
          ],
          answer: 1,
          explain:
            'mirrorOf * 会劫持所有仓库请求，包括公司私服，内部包在公共镜像上当然不存在。修法是排除私服 id（*,!internal-repo）或删掉镜像配置。dependencyManagement 只管版本，不管仓库地址。',
        },
      ],
    },
  ],
};
