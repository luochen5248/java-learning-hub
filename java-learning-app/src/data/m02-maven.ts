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
  minutes: 110,
  summary:
    'Maven 是 Java 世界的构建与依赖管理工具，几乎等价于「npm + vite 打包命令」。这一模块用你已经熟悉的 npm 心智去对齐它：pom.xml 就是 package.json，本地仓库就是 node_modules，mvn package 就是 npm run build。学完你能自己搭一个可构建、可打包、依赖不报错的 Java 项目。',

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
  ],
};
