import type { RawModule } from '../types/course'

/**
 * m08 打包与部署（3 课）
 *
 * 贯穿项目位置：把 m07 完成的「待办清单 API」打成可执行 jar，
 * 先在本地 Windows 跑通，再学会多环境配置，最后放到 Linux 服务器上后台运行。
 *
 * 命令视角：Windows（你的电脑）为主；Linux 命令全部标注「服务器环境」。
 * 环境基线：JDK 17 + Spring Boot 3.2.x + Maven 3.9
 */

/* ---------------- 图解 1：从源码到跑起来的五步 ---------------- */

const SVG_BUILD_FLOW = `<svg viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m08a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="300" rx="12" fill="#0F1B2D"/>
  <text x="340" y="40" text-anchor="middle" font-size="17" fill="#E2E8F0">从源码到对外服务：jar 的五步旅程</text>
  <text x="340" y="64" text-anchor="middle" font-size="13" fill="#94A3B8">fat jar = 你的代码 + 全部依赖 + 内嵌 Tomcat，一个文件就是一台服务器</text>

  <rect x="16" y="106" width="116" height="64" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="74" y="134" text-anchor="middle" font-size="13" fill="#E2E8F0">① 源码</text>
  <text x="74" y="154" text-anchor="middle" font-size="12" fill="#94A3B8">pom.xml</text>

  <rect x="151" y="106" width="116" height="64" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="209" y="134" text-anchor="middle" font-size="13" fill="#E2E8F0">② mvn clean</text>
  <text x="209" y="154" text-anchor="middle" font-size="12" fill="#94A3B8">package</text>

  <rect x="286" y="106" width="116" height="64" rx="10" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.5"/>
  <text x="344" y="134" text-anchor="middle" font-size="13" fill="#E2E8F0">③ target/</text>
  <text x="344" y="154" text-anchor="middle" font-size="12" fill="#94A3B8">app.jar</text>

  <rect x="421" y="106" width="116" height="64" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="479" y="134" text-anchor="middle" font-size="13" fill="#E2E8F0">④ java -jar</text>
  <text x="479" y="154" text-anchor="middle" font-size="12" fill="#94A3B8">app.jar</text>

  <rect x="556" y="106" width="116" height="64" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.5"/>
  <text x="614" y="134" text-anchor="middle" font-size="13" fill="#E2E8F0">⑤ 内嵌 Tomcat</text>
  <text x="614" y="154" text-anchor="middle" font-size="12" fill="#94A3B8">监听 :8080</text>

  <line x1="132" y1="138" x2="149" y2="138" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m08a)"/>
  <line x1="267" y1="138" x2="284" y2="138" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m08a)"/>
  <line x1="402" y1="138" x2="419" y2="138" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m08a)"/>
  <line x1="537" y1="138" x2="554" y2="138" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m08a)"/>

  <rect x="16" y="200" width="648" height="66" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="340" y="228" text-anchor="middle" font-size="12.5" fill="#E2E8F0">前端对照：npm run build 产出 dist/，还得配 nginx 才能对外服务；</text>
  <text x="340" y="250" text-anchor="middle" font-size="12.5" fill="#94A3B8">Java 的 jar 自带 Tomcat，java -jar 一条命令就是一个能收 HTTP 请求的进程。</text>
</svg>`;

/* ---------------- 图解 2：配置优先级金字塔 ---------------- */

const SVG_CONFIG_PRIORITY = `<svg viewBox="0 0 680 340" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m08b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#F59E0B"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="340" rx="12" fill="#0F1B2D"/>
  <text x="340" y="28" text-anchor="middle" font-size="17" fill="#E2E8F0">配置优先级：谁离"启动那一刻"越近，谁说话越算数</text>

  <line x1="62" y1="300" x2="62" y2="52" stroke="#F59E0B" stroke-width="1.8" marker-end="url(#arr-m08b)"/>
  <text x="62" y="322" text-anchor="middle" font-size="12" fill="#F59E0B">低</text>
  <text x="62" y="42" text-anchor="middle" font-size="12" fill="#F59E0B">高</text>

  <rect x="110" y="52" width="460" height="46" rx="8" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.8"/>
  <text x="340" y="80" text-anchor="middle" font-size="14" fill="#E2E8F0">命令行参数 --server.port=9090</text>

  <rect x="142" y="108" width="396" height="46" rx="8" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.5"/>
  <text x="340" y="136" text-anchor="middle" font-size="14" fill="#E2E8F0">环境变量 SERVER_PORT=9090</text>

  <rect x="174" y="164" width="332" height="46" rx="8" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="340" y="192" text-anchor="middle" font-size="14" fill="#E2E8F0">外部配置 ./config/application.yml</text>

  <rect x="206" y="220" width="268" height="46" rx="8" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="340" y="248" text-anchor="middle" font-size="14" fill="#E2E8F0">jar 内 application-prod.yml</text>

  <rect x="238" y="276" width="204" height="46" rx="8" fill="#1B2A44" stroke="#64748B" stroke-width="1.5"/>
  <text x="340" y="304" text-anchor="middle" font-size="14" fill="#94A3B8">代码里的默认值</text>

  <text x="340" y="334" text-anchor="middle" font-size="12" fill="#94A3B8">上面的覆盖下面的：改端口不用重新打包，命令行加一个参数就行</text>
</svg>`;

/* ---------------- 图解 3：本地构建 → 上传 → 服务器运行 ---------------- */

const SVG_DEPLOY_FLOW = `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m08c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="360" rx="12" fill="#0F1B2D"/>
  <text x="340" y="30" text-anchor="middle" font-size="17" fill="#E2E8F0">一次最朴素的部署：本地打包 → 上传 → 服务器后台跑</text>

  <rect x="16" y="52" width="252" height="248" rx="12" fill="#132338" stroke="#3B82F6" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="142" y="78" text-anchor="middle" font-size="14" fill="#22D3EE">Windows 本地（你的电脑）</text>

  <rect x="38" y="96" width="208" height="48" rx="8" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="142" y="125" text-anchor="middle" font-size="12.5" fill="#E2E8F0">mvn clean package -DskipTests</text>

  <rect x="38" y="156" width="208" height="48" rx="8" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.5"/>
  <text x="142" y="185" text-anchor="middle" font-size="12.5" fill="#E2E8F0">target/todo-api.jar（fat jar）</text>

  <rect x="38" y="216" width="208" height="48" rx="8" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="142" y="245" text-anchor="middle" font-size="12.5" fill="#E2E8F0">java -jar 本地先验证一次</text>

  <line x1="142" y1="144" x2="142" y2="154" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m08c)"/>
  <line x1="142" y1="204" x2="142" y2="214" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m08c)"/>

  <rect x="412" y="52" width="252" height="248" rx="12" fill="#132338" stroke="#10B981" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="538" y="78" text-anchor="middle" font-size="14" fill="#22D3EE">Linux 服务器（云服务器）</text>

  <rect x="434" y="96" width="208" height="48" rx="8" fill="#1B2A44" stroke="#10B981" stroke-width="1.5"/>
  <text x="538" y="125" text-anchor="middle" font-size="12.5" fill="#E2E8F0">scp 上传 → /opt/todo-api/</text>

  <rect x="434" y="156" width="208" height="48" rx="8" fill="#1B2A44" stroke="#10B981" stroke-width="1.5"/>
  <text x="538" y="185" text-anchor="middle" font-size="12.5" fill="#E2E8F0">nohup java -jar app.jar &amp;</text>

  <rect x="434" y="216" width="208" height="48" rx="8" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="538" y="245" text-anchor="middle" font-size="12.5" fill="#E2E8F0">tail -f app.log + 放行端口</text>

  <line x1="538" y1="144" x2="538" y2="154" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m08c)"/>
  <line x1="538" y1="204" x2="538" y2="214" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m08c)"/>

  <line x1="268" y1="120" x2="410" y2="120" stroke="#F59E0B" stroke-width="2" marker-end="url(#arr-m08c)"/>
  <text x="339" y="110" text-anchor="middle" font-size="12" fill="#F59E0B">scp / sftp 上传（走 22 端口）</text>

  <rect x="16" y="312" width="648" height="40" rx="8" fill="#1B2A44" stroke="#EF4444" stroke-width="1.5"/>
  <text x="340" y="337" text-anchor="middle" font-size="12.5" fill="#E2E8F0">应用起来了但浏览器打不开？先怀疑安全组 / 防火墙，别急着改代码</text>
</svg>`;

/* ---------------- 模块数据 ---------------- */

export const module: RawModule = {
  id: 'm08',
  order: 8,
  title: '打包与部署',
  subtitle: '把待办清单 API 打成 jar，跑在你自己的电脑上，也跑在服务器上',
  phase: 'phase2',
  phaseName: '阶段二 · 写出完整后端',
  icon: '🚀',
  cover: 'assets/img/m08-package.jpg',
  minutes: 135,
  summary:
    '写完的代码只有跑在别人能访问到的地方才算交付。这一模块带你走完最后一段路：用 Maven 打出可执行的 fat jar，用 profile 区分开发/测试/生产三套配置，再用一份够用的 Linux 命令把 jar 放到服务器上后台运行、看日志、排端口。收尾的避坑清单专治「没有主清单属性」「配置外置不生效」「服务器乱码」这些上线当天的经典故障。学完你就拥有了一条完整的「改代码 → 打包 → 上线」流水线。',

  flashcards: [
    { front: 'Spring Boot 项目打包成可执行 jar 用什么命令？', back: 'mvn clean package（常加 -DskipTests 跳过测试），产物在 target/ 目录下，名字为 artifactId-版本.jar', tag: '命令' },
    { front: '什么叫 fat jar？它和普通 jar 的区别？', back: 'fat jar 把你的代码、全部依赖 jar、内嵌 Tomcat 打进同一个文件，java -jar 就能独立运行，不需要外部 Tomcat', tag: '概念' },
    { front: 'java -jar 报 no main manifest attribute 怎么解？', back: 'jar 没走 spring-boot-maven-plugin 的 repackage。检查 pom 里是否有该插件，或被 maven-jar-plugin 配置覆盖了', tag: '坑点' },
    { front: '-DskipTests 和 -Dmaven.test.skip=true 有什么区别？', back: '前者跳过测试执行但仍编译测试代码；后者连测试代码的编译一起跳过，打包更快但语法错误也不会暴露', tag: '命令' },
    { front: '运行时切换环境/端口的启动参数怎么写？', back: 'java -jar app.jar --spring.profiles.active=prod --server.port=9090；命令行参数优先级高于配置文件', tag: '配置' },
    { front: 'Spring Boot 配置优先级从高到低？', back: '命令行参数 > 环境变量 > jar 外部配置文件 > jar 内配置文件 > 代码默认值', tag: '配置' },
    { front: '生产配置为什么要放在 jar 外面？', back: '用 --spring.config.location=./config/ 或放 jar 同级 config/ 目录，改配置不必重新打包，也避免密码进 jar', tag: '配置' },
    { front: 'Windows 上 8080 端口被占用怎么查怎么杀？', back: 'netstat -ano | findstr :8080 找到 PID，再 taskkill /PID 进程号 /F 强制结束', tag: '命令' },
    { front: 'Linux 上让 jar 后台运行并把日志存下来怎么写？', back: 'nohup java -jar app.jar > app.log 2>&1 & ，之后 tail -f app.log 实时看日志', tag: '命令' },
    { front: '服务器能跑但外网访问不了，第一怀疑什么？', back: '云服务器安全组未放行端口，或本机防火墙（firewall-cmd / ufw）没开端口，不是代码问题', tag: '坑点' },
    { front: 'Linux 上查端口占用并杀进程的命令？', back: 'ss -tlnp | grep :8080（或 lsof -i:8080）拿 PID，kill -9 PID 结束', tag: '命令' },
    { front: '服务器上看中文日志乱码，两个修法？', back: '启动加 -Dfile.encoding=UTF-8；终端/系统层面 export LANG=zh_CN.UTF-8', tag: '坑点' },
    { front: 'java 默认堆多大？生产为什么要显式 -Xms -Xmx？', back: '默认约为物理内存 1/4。不显式设置时容器/小内存机器上会 OOM 或浪费，且 -Xms -Xmx 设成同值可避免运行期抖动', tag: '坑点' },
  ],

  lessons: [
    /* ============ 第 1 课 ============ */
    {
      id: 'm08-l01',
      title: '打 jar 包并在本地运行',
      minutes: 30,
      goal: '把「待办清单 API」打成一个可执行 jar，在 Windows 上用 java -jar 跑起来并 curl 通一个接口。',
      sections: [
        {
          type: 'text',
          html:
            '<p><strong>此刻你在项目的哪一步：</strong>m07 已经把待办清单 API 重构成 Controller / Service / Mapper 三层，接口、事务、统一返回都齐了。但到目前为止，你一直是在 IDEA 里点那个绿色三角启动的——这叫「开发态运行」。要把它交给别人，或者放到服务器上，你需要一个<strong>产物</strong>。</p>' +
            '<p>前端的产物是 <code>npm run build</code> 之后的 <code>dist/</code>：一堆 HTML/JS/CSS 静态文件，还得配个 nginx 才能对外服务。Java 后端的产物是 <code>mvn package</code> 之后的 <code>target/xxx.jar</code>——<strong>一个文件就是一台服务器</strong>，因为它把 Tomcat 也一起打包进去了。这节课就把这个 jar 打出来、跑起来。</p>',
        },
        {
          type: 'fe',
          html:
            '<p><strong>前端视角对照：</strong></p>' +
            '<ul><li><code>npm run build</code> ≈ <code>mvn clean package</code>：产出可部署物</li>' +
            '<li><code>dist/</code> ≈ <code>target/</code>：构建输出目录（Maven 的产物目录就叫 target，与前端 dist 一个意思）</li>' +
            '<li>nginx 托管 dist ≈ <strong>不需要</strong>，jar 自带 Tomcat</li>' +
            '<li><code>node server.js</code> ≈ <code>java -jar app.jar</code>：一条命令起一个进程监听端口</li></ul>' +
            '<p>唯一要扭转的直觉：前端的构建产物是<strong>死的静态资源</strong>，Java 的构建产物是<strong>活的可执行程序</strong>。</p>',
        },
        {
          type: 'code',
          lang: 'xml',
          filename: 'pom.xml（关键片段）',
          code: `<build>
    <finalName>todo-api</finalName>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <mainClass>com.example.todoapi.TodoApiApplication</mainClass>
            </configuration>
        </plugin>
    </plugins>
</build>`,
        },
        {
          type: 'text',
          html:
            '<p>上面这段通常由 <code>spring-boot-starter-parent</code> 自动继承好，你在新建 Spring Boot 项目时一般<strong>已经存在</strong>，不需要手写。它的作用是在 <code>package</code> 阶段做一次 <code>repackage</code>：把普通 jar 重新打包成 fat jar（也叫 uber jar）。</p>' +
            '<p><code>&lt;finalName&gt;</code> 决定产物文件名，写上它 jar 名就是 <code>todo-api.jar</code>，否则默认是 <code>artifactId-版本号.jar</code>（如 <code>todo-api-0.0.1-SNAPSHOT.jar</code>）。</p>',
        },
        {
          type: 'tip',
          html:
            '<p><strong>关于 mainClass：全文统一用 <code>com.example.todoapi.TodoApiApplication</code>。</strong>这就是 m04 里 IDEA 自动生成的那个启动类——从 m04 到 m10，贯穿项目的包名、类名、数据库名都<strong>不再变动</strong>，本模块出现的所有配置片段都直接沿用它们。</p>' +
            '<p>为什么特意交代：<code>mainClass</code> 填错（比如写成 <code>com.learn.todo.TodoApplication</code>，一个你从没建过的包）会直接报 <code>ClassNotFoundException: Unable to find main class</code>。如果你已经把自己项目里的启动类改了名（比如换成了自己的域名包），那就<strong>把这一行改成你自己的全限定类名</strong>，后面的示例代码里的包名也一并对齐即可。</p>',
        },
        {
          type: 'steps',
          title: '打包并本地运行（Windows / CMD 或 PowerShell 均可）',
          items: [
            '关掉 IDEA 里正在运行的项目（否则 8080 端口会被占住）',
            '在项目根目录（有 pom.xml 的那层）打开终端，执行 <code>mvn clean package -DskipTests</code>',
            '看到 BUILD SUCCESS 后，进入 <code>target</code> 目录，确认生成了 <code>todo-api.jar</code>',
            '执行 <code>java -jar todo-api.jar</code>，观察控制台出现 Started TodoApiApplication',
            '浏览器或 curl 访问 <code>http://localhost:8080/api/todos</code>，能拿到 JSON 就算通关',
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'Windows · CMD 完整命令序列',
          code: `REM 1) 清理并打包（跳过测试，加快构建）
mvn clean package -DskipTests

REM 2) 进入产物目录，看看产出
cd target
dir todo-api.jar

REM 3) 直接前台运行（能实时看到日志，Ctrl+C 停止）
java -jar todo-api.jar

REM 4) 另开一个终端窗口验证接口
curl http://localhost:8080/api/todos`,
        },
        {
          type: 'table',
          title: 'target 目录里都有什么',
          head: ['路径', '作用', '前端对照'],
          rows: [
            ['target/classes/', '编译后的 .class 文件', 'dist/assets/ 的中间产物'],
            ['target/todo-api.jar', 'fat jar：可执行的最终产物', 'dist/ 整个目录'],
            ['target/todo-api.jar.original', 'repackage 前的原始普通 jar', '无（构建中间物）'],
            ['target/maven-status/', '编译状态记录', 'Vite 的缓存目录'],
            ['target/surefire-reports/', '单元测试报告', 'vitest 的报告'],
          ],
        },
        {
          type: 'diagram',
          caption: '源码 → 打包 → fat jar → java -jar → 内嵌 Tomcat 的五步流程',
          svg: SVG_BUILD_FLOW,
        },
        {
          type: 'warn',
          html:
            '<p><strong>坑 1：<code>java -jar</code> 报 no main manifest attribute。</strong>说明打出来的是普通 jar 而不是 fat jar。检查 <code>pom.xml</code> 里有没有 <code>spring-boot-maven-plugin</code>，或者是否被你自己加的 <code>maven-jar-plugin</code> 覆盖了配置。用 IDEA 时也要确认执行的是 Maven 的 package 生命周期，而不是只点了编译。</p>' +
            '<p><strong>坑 2：端口被占用</strong>（Web server failed to start. Port 8080 was already in use）。多半是 IDEA 里那个实例还没停。Windows 排查：</p>' +
            '<p><code>netstat -ano | findstr :8080</code> → 记下最后一列的 PID → <code>taskkill /PID 12345 /F</code></p>' +
            '<p><strong>坑 3：jar 名带中文或空格</strong>。<code>java -jar 我的 项目.jar</code> 在命令行里会被拆成两个参数。一律用英文小写 + 短横线的文件名。</p>',
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'Windows · 后台运行与日志',
          code: `REM 方式一：CMD 里用 start /B 后台跑，日志重定向到文件
start /B java -jar todo-api.jar > app.log 2>&1

REM 实时看日志（Windows 没有 tail，用 PowerShell）
powershell -Command "Get-Content app.log -Wait -Tail 50"

REM 方式二：PowerShell 原生写法（推荐，可拿回进程对象）
$p = Start-Process java -ArgumentList '-jar','todo-api.jar' -RedirectStandardOutput app.log -RedirectStandardError err.log -PassThru
$p.Id          # 进程号，记下来用于停止
Stop-Process -Id $p.Id

REM 方式三：javaw 无控制台窗口运行（适合双击就跑，但看不到日志）
javaw -jar todo-api.jar`,
        },
        {
          type: 'tip',
          html:
            '<p><strong>前台还是后台？</strong>本地调试一律<strong>前台</strong>跑（<code>java -jar app.jar</code>），日志直接打在屏幕上，<code>Ctrl+C</code> 就能停，最省心。只有放到服务器上才需要考虑后台与日志重定向。</p>' +
            '<p><strong>本课产出物检查清单：</strong>① <code>target/todo-api.jar</code> 存在且大小在 20MB 以上（太小说明依赖没打进去）；② <code>java -jar</code> 能启动；③ <code>curl http://localhost:8080/api/todos</code> 返回 JSON。</p>',
        },
      ],
      quiz: [
        {
          q: 'Spring Boot 项目执行 mvn package 后，为什么 java -jar 能直接提供 HTTP 服务？',
          options: [
            'Maven 在打包时自动安装并启动了 Tomcat 服务',
            '打成的是 fat jar，内嵌了 Tomcat 和全部依赖',
            'java -jar 命令会自动下载并启动 Web 容器',
            '因为 pom.xml 里配置了 server.port',
          ],
          answer: 1,
          explain:
            '<p>fat jar 里包含三样东西：你编译后的 class、pom 里声明的全部依赖 jar、以及内嵌的 Tomcat。启动时 Spring Boot 会在内部拉起 Tomcat 并监听端口，因此不需要外部 Web 服务器。</p>',
        },
        {
          q: '执行 java -jar app.jar 时提示 no main manifest attribute，最可能的原因是？',
          options: [
            'JDK 版本装错了',
            'jar 没有经过 spring-boot-maven-plugin 的 repackage，缺少启动类声明',
            '8080 端口被占用',
            'pom.xml 里没有写 server.port',
          ],
          answer: 1,
          explain:
            '<p>普通 jar 的 MANIFEST.MF 里没有 Main-Class 和 Spring Boot 的启动器信息。必须由 spring-boot-maven-plugin 在 package 阶段执行 repackage 重写成可执行 jar。</p>',
        },
        {
          q: 'Windows 上发现 8080 端口被别的进程占着，正确的排查命令是？',
          options: [
            'lsof -i:8080',
            'netstat -ano | findstr :8080 然后 taskkill /PID 进程号 /F',
            'ps -ef | grep java',
            'kill -9 8080',
          ],
          answer: 1,
          explain:
            '<p>Windows 用 netstat -ano 找监听端口的进程 PID，再用 taskkill /F 强制结束。lsof、ps -ef、kill -9 都是 Linux/macOS 的命令。</p>',
        },
      ],
    },

    /* ============ 第 2 课 ============ */
    {
      id: 'm08-l02',
      title: '多环境打包与配置外置',
      minutes: 35,
      goal: '用 profile 区分 dev / prod 两套配置，并在不重新打包的前提下用启动参数覆盖端口与环境。',
      sections: [
        {
          type: 'text',
          html:
            '<p>真实项目至少要面对两套以上环境：你本机（连本地 MySQL、开 SQL 日志）、测试环境、生产环境（连线上库、日志级别调高、端口不同）。<strong>把配置写死在代码里，然后每次上线手动改一遍</strong>——这是最容易出事故的做法。</p>' +
            '<p>Spring Boot 的解法叫 <strong>profile</strong>：一份主配置 <code>application.yml</code> 放公共项，再按环境放 <code>application-dev.yml</code>、<code>application-prod.yml</code>，启动时用一行参数决定用哪套。命令行参数的优先级高于任何配置文件，所以你永远有机会在启动那一刻临时改点东西。</p>',
        },
        {
          type: 'fe',
          html:
            '<p><strong>前端视角：</strong>这就是 Vite 的 <code>mode</code> + <code>.env</code> / <code>.env.production</code>。</p>' +
            '<ul><li><code>.env.development</code> ≈ <code>application-dev.yml</code></li>' +
            '<li><code>vite build --mode production</code> ≈ <code>--spring.profiles.active=prod</code></li>' +
            '<li><code>import.meta.env.VITE_API_BASE</code> ≈ <code>@Value("${...}")</code> 或 <code>@ConfigurationProperties</code></li></ul>' +
            '<p>最大的区别：前端的 env 在<strong>构建时</strong>就被替换进产物了，改了必须重新 build；Java 的配置在<strong>启动时</strong>才读取，改了重启即可，甚至可以放在 jar 外面。</p>',
        },
        {
          type: 'code',
          lang: 'yaml',
          filename: 'src/main/resources/application.yml',
          code: `spring:
  application:
    name: todo-api
  profiles:
    active: dev          # 默认环境，可被启动参数覆盖

server:
  port: 8080

logging:
  level:
    root: info`,
        },
        {
          type: 'code',
          lang: 'yaml',
          filename: 'src/main/resources/application-dev.yml',
          code: `spring:
  datasource:
    url: jdbc:mysql://localhost:3306/todo_db?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf8mb4
    username: root
    password: root

mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl   # 开发环境打印 SQL`,
        },
        {
          type: 'code',
          lang: 'yaml',
          filename: 'src/main/resources/application-prod.yml',
          code: `spring:
  datasource:
    url: jdbc:mysql://mysql:3306/todo_db?serverTimezone=Asia/Shanghai
    username: root
    password: \${DB_PASSWORD:}        # 从环境变量注入，不写死在文件里

  data:
    redis:
      host: redis
      port: 6379

server:
  port: 8080

logging:
  level:
    root: warn
    com.example.todoapi: info`,
        },
        {
          type: 'steps',
          title: '一次多环境打包的完整动作',
          items: [
            '在 resources 下放好 application.yml + application-dev.yml + application-prod.yml',
            '打包：<code>mvn clean package -DskipTests</code>（注意：<strong>打出来的 jar 包含全部 profile 文件</strong>，不是只打一个环境的）',
            '本地跑开发环境：<code>java -jar todo-api.jar --spring.profiles.active=dev</code>',
            '模拟生产 + 换端口：<code>java -jar todo-api.jar --spring.profiles.active=prod --server.port=9090</code>',
            '把生产配置挪到 jar 外：<code>java -jar todo-api.jar --spring.config.location=./config/</code>',
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'Windows · 启动参数实战',
          code: `REM 基本：指定环境
java -jar todo-api.jar --spring.profiles.active=prod

REM 环境 + 端口（命令行参数覆盖配置文件里的 server.port）
java -jar todo-api.jar --spring.profiles.active=prod --server.port=9090

REM 配置外置：读 jar 同级 config 目录下的 application-prod.yml
java -jar todo-api.jar --spring.config.location=./config/

REM 用环境变量传数据库密码（推荐，密码不落盘到 jar）
set DB_PASSWORD=MySecret123
java -jar todo-api.jar --spring.profiles.active=prod

REM 想知道最终生效了哪些配置？启动时加一行看环境变量与配置源
java -jar todo-api.jar --spring.profiles.active=prod --debug`,
        },
        {
          type: 'diagram',
          caption: 'Spring Boot 配置优先级：命令行参数最优先',
          svg: SVG_CONFIG_PRIORITY,
        },
        {
          type: 'compare',
          title: 'Maven profile 与 Spring profile 的分工',
          head: ['', 'Maven profile（构建期）', 'Spring profile（运行期）'],
          rows: [
            ['生效时机', 'mvn package 时决定打进 jar 的内容', 'java -jar 启动时决定读哪份配置'],
            ['配置位置', 'pom.xml 的 &lt;profiles&gt;', 'application-{profile}.yml'],
            ['典型用途', '按环境打包不同的依赖、资源过滤', '按环境切换数据库地址、日志级别、端口'],
            ['命令示例', 'mvn package -P prod', 'java -jar app.jar --spring.profiles.active=prod'],
            ['前端对照', 'vite build --mode 决定产物内容', '运行时读取的 .env'],
          ],
        },
        {
          type: 'code',
          lang: 'xml',
          filename: 'pom.xml · Maven profile（可选，进阶用法）',
          code: `<profiles>
    <profile>
        <id>dev</id>
        <activation><activeByDefault>true</activeByDefault></activation>
        <properties><build.env>dev</build.env></properties>
    </profile>
    <profile>
        <id>prod</id>
        <properties><build.env>prod</build.env></properties>
    </profile>
</profiles>`,
        },
        {
          type: 'warn',
          html:
            '<p><strong>坑 1：改了 yml 没生效。</strong>YAML 用<strong>空格</strong>缩进，Tab 会直接抛 <code>ScannerException</code>；冒号后面<strong>必须有一个空格</strong>（<code>port:8080</code> 是错的，<code>port: 8080</code> 才对）。另外确认你改的是 <code>target/classes</code> 之外、真正被打包的那份 <code>src/main/resources</code> 下的文件。</p>' +
            '<p><strong>坑 2：生产密码打进了 jar。</strong>jar 是一个 zip，谁拿到都能解压看到明文。正确做法是 yml 里写占位 <code>${DB_PASSWORD}</code>，启动时由环境变量注入。</p>' +
            '<p><strong>坑 3：<code>--spring.profiles.active</code> 写在了 <code>-jar</code> 前面。</strong><code>java --spring.profiles.active=prod -jar app.jar</code> 是错的——这个参数会被 JVM 当成 JVM 参数而报错。所有 Spring 参数必须放在 <strong>jar 名之后</strong>。</p>',
        },
        {
          type: 'tip',
          html:
            '<p><strong>本课产出物检查清单：</strong>① 项目里有 dev 和 prod 两份 profile 配置；② 同一份 jar 用不同参数能连不同库、起在不同端口；③ 生产密码来自环境变量而不是明文 yml。</p>' +
            '<p>下一步（m08-l03）：这个 jar 怎么送到 Linux 服务器上跑起来。</p>',
        },
      ],
      quiz: [
        {
          q: '关于 mvn package 打出的 jar 与 profile 的关系，正确的是？',
          options: [
            '打包时必须用 -P prod 指定环境，否则 jar 跑不起来',
            '打出来的 jar 包含全部 profile 配置，用哪个由启动参数决定',
            'dev 配置不会被打进 jar，只有 prod 会',
            'profile 文件在打包时会被加密',
          ],
          answer: 1,
          explain:
            '<p>所有 application-*.yml 都会被打进 jar。运行时用 --spring.profiles.active=xxx 决定激活哪一份，这就是"一次构建、多处部署"的基础。</p>',
        },
        {
          q: '下面哪个配置源的优先级最高？',
          options: [
            'jar 内的 application.yml',
            'jar 同级 config/ 目录下的配置文件',
            '命令行参数 --server.port=9090',
            '代码里 @Value 的默认值',
          ],
          answer: 2,
          explain:
            '<p>优先级从高到低：命令行参数 > 环境变量 > jar 外部配置文件 > jar 内部配置文件 > 代码默认值。越靠近"启动那一刻"的配置源越优先。</p>',
        },
        {
          q: '生产环境的数据库密码，推荐怎么写？',
          options: [
            '直接明文写在 application-prod.yml 里',
            '写在 yml 的 ${DB_PASSWORD} 占位，由环境变量注入',
            '写在 Java 代码的常量里',
            '放在 pom.xml 的 properties 中',
          ],
          answer: 1,
          explain:
            '<p>jar 本质是 zip，明文密码等于公开。用占位符 + 环境变量（或配置中心）注入，密码不落盘到产物里。</p>',
        },
      ],
    },

    /* ============ 第 3 课 ============ */
    {
      id: 'm08-l03',
      title: 'Linux 最小命令集与上线',
      minutes: 35,
      goal: '用一份够用的 Linux 命令把 jar 传到服务器、后台运行、看日志，并知道访问不了时该查什么。',
      sections: [
        {
          type: 'text',
          html:
            '<p><strong>从此刻起命令都跑在服务器上（Linux），不是你的 Windows。</strong>你需要在 Windows 上用终端工具连过去：Windows 11 自带的 <strong>Windows Terminal / PowerShell 里直接敲 ssh</strong> 就行，也可以用 Xshell、FinalShell、MobaXterm。下面的命令分两组：<strong># 本地</strong> 表示在你的 Windows 上执行，<strong># 服务器</strong> 表示连上服务器后执行。</p>' +
            '<p>你不需要成为运维。目标只有三个：把文件传上去、让它一直在后台跑、出问题时能看到日志。</p>',
        },
        {
          type: 'compare',
          title: 'Linux ↔ Windows 命令对照（够用版）',
          head: ['想做的事', 'Linux（服务器）', 'Windows（你的电脑）'],
          rows: [
            ['看当前目录 / 列文件', 'pwd / ls -lh', 'cd / dir'],
            ['进入目录', 'cd /opt/todo-api', 'cd D:\\app'],
            ['看文件内容', 'cat app.log', 'type app.log'],
            ['实时跟踪日志', 'tail -f app.log', 'Get-Content app.log -Wait'],
            ['查 Java 进程', 'ps -ef | grep java', 'tasklist | findstr java'],
            ['杀进程', 'kill -9 进程号', 'taskkill /PID 进程号 /F'],
            ['查端口占用', 'ss -lntp | grep 8080', 'netstat -ano | findstr :8080'],
            ['复制文件', 'cp a.jar b.jar', 'copy a.jar b.jar'],
            ['删除目录', 'rm -rf 目录名', 'rd /s /q 目录名'],
            ['给脚本加执行权限', 'chmod +x run.sh', '（无对应概念）'],
          ],
        },
        {
          type: 'steps',
          title: '从零到跑起来的六个动作',
          items: [
            '本地打包：<code>mvn clean package -DskipTests</code>',
            '上传：<code>scp target/todo-api.jar root@服务器IP:/opt/todo-api/</code>（Windows PowerShell 自带 scp）',
            '登录：<code>ssh root@服务器IP</code>',
            '放行端口：云服务器控制台的安全组里加一条 TCP 8080，以及服务器本机防火墙',
            '后台启动：<code>nohup java -jar todo-api.jar --spring.profiles.active=prod > app.log 2>&1 &</code>',
            '验证：<code>curl http://localhost:8080/api/todos</code>，再用你本机浏览器访问 <code>http://服务器IP:8080/api/todos</code>',
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '本地 Windows · 上传与登录',
          code: `# 本地（Windows PowerShell / CMD 都可以，系统自带 scp 与 ssh）
scp target/todo-api.jar root@123.45.67.89:/opt/todo-api/
# 第一次连接会问 Are you sure you want to continue connecting? 输入 yes

ssh root@123.45.67.89

# 顺手把生产配置也传上去（放 jar 同级，运行时用 --spring.config.location 读）
scp src/main/resources/application-prod.yml root@123.45.67.89:/opt/todo-api/`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '服务器 Linux · 后台运行与日志',
          code: `# 连上服务器后，先进目录
cd /opt/todo-api
ls -lh

# 后台运行：nohup 忽略挂断信号，& 放进后台，> app.log 2>&1 把标准输出和错误都写进日志
nohup java -jar todo-api.jar --spring.profiles.active=prod > app.log 2>&1 &

# 立刻确认它活着（回车后会显示进程号）
ps -ef | grep java

# 实时看日志（Ctrl+C 退出跟踪，不会停掉应用）
tail -f app.log

# 只想看最后 100 行
tail -n 100 app.log

# 停掉应用：先查 PID 再杀
ps -ef | grep todo-api.jar
kill -9 12345`,
        },
        {
          type: 'warn',
          html:
            '<p><strong>坑 1：SSH 一断开进程就死了。</strong>少了 <code>nohup</code> 或忘了末尾的 <code>&amp;</code>，进程会挂在你的 SSH 会话上，窗口一关就被回收。正确姿势是完整写法 <code>nohup ... &gt; app.log 2&gt;&amp;1 &amp;</code>，或者交给 systemd（见下）。</p>' +
            '<p><strong>坑 2：应用起来了，浏览器却打不开。</strong>这是<strong>部署第一高频问题</strong>，原因几乎总是端口没放行，跟代码无关。两道门都要开：</p>' +
            '<ul><li>云厂商控制台的<strong>安全组</strong>（阿里云/腾讯云/华为云都有，入站规则加 TCP 8080）</li>' +
            '<li>服务器本机防火墙：<code>firewall-cmd --zone=public --add-port=8080/tcp --permanent &amp;&amp; firewall-cmd --reload</code>（CentOS/RHEL）或 <code>ufw allow 8080</code>（Ubuntu）</li></ul>' +
            '<p><strong>坑 3：Windows 编辑的脚本传到 Linux 报 <code>\\r: command not found</code>。</strong>CRLF 换行符问题。在 IDEA 里把文件换行符改成 LF（右下角可切换），或在服务器上执行 <code>sed -i \'s/\\r$//\' run.sh</code>。</p>' +
            '<p><strong>坑 4：Linux 路径区分大小写</strong>，<code>App.jar</code> 和 <code>app.jar</code> 是两个文件。</p>',
        },
        {
          type: 'code',
          lang: 'properties',
          filename: '/etc/systemd/system/todo-api.service（服务器）',
          code: `[Unit]
Description=Todo API Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/todo-api
ExecStart=/usr/bin/java -jar /opt/todo-api/todo-api.jar --spring.profiles.active=prod
Restart=on-failure
RestartSec=5
StandardOutput=append:/opt/todo-api/app.log
StandardError=append:/opt/todo-api/app.log

[Install]
WantedBy=multi-user.target`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '服务器 · 用 systemd 托管（推荐，能开机自启）',
          code: `# 写好后让 systemd 重新加载配置
systemctl daemon-reload

# 开机自启 + 立刻启动
systemctl enable --now todo-api

# 常用四件套
systemctl status todo-api      # 看状态与最近几行日志
systemctl restart todo-api     # 重启（改了 jar 之后）
systemctl stop todo-api        # 停止
journalctl -u todo-api -f      # 跟踪系统托管的日志

# 更新版本的固定流程
systemctl stop todo-api
# （本地重新 scp 上传新的 jar）
systemctl start todo-api`,
        },
        {
          type: 'diagram',
          caption: '本地构建 → scp 上传 → 服务器后台运行 的完整部署链路',
          svg: SVG_DEPLOY_FLOW,
        },
        {
          type: 'tip',
          html:
            '<p><strong>nohup 还是 systemd？</strong>临时验证用 nohup 最快；要长期跑一定上 systemd——它能在进程崩溃时自动重启、开机自启、统一管日志，不用你写 shell 脚本兜底。</p>' +
            '<p><strong>本课产出物检查清单：</strong>① 能用 ssh 登录服务器并用 scp 传文件；② jar 在服务器上后台跑着，断开 SSH 后依然存活；③ 能从自己电脑的浏览器访问到 <code>http://服务器IP:8080/api/todos</code>。</p>' +
            '<p><strong>预告：</strong>你刚刚手工走完了「装 JDK → 传 jar → 配环境 → 启进程」这一整套。下个模块先学 Redis 缓存，最后在 m10 用 Docker 把这套动作压缩成一条 <code>docker compose up -d</code>。</p>',
        },
      ],
      quiz: [
        {
          q: 'nohup java -jar app.jar > app.log 2>&1 & 这行命令里，末尾的 & 的作用是？',
          options: [
            '把命令放到后台执行，SSH 断开后进程仍在',
            '把标准输出追加到日志',
            '表示以管理员权限运行',
            '指定使用生产环境配置',
          ],
          answer: 0,
          explain:
            '<p>& 让命令进入后台；前面的 nohup 保证进程忽略终端挂断信号；> app.log 2>&1 把标准输出和错误输出都重定向进同一个日志文件。三者配合才是完整的后台运行写法。</p>',
        },
        {
          q: '应用在服务器上已启动、本机 curl localhost:8080 也通，但你电脑浏览器访问不了，最可能的原因是？',
          options: [
            'Spring Boot 没配置 server.port',
            '云服务器安全组或本机防火墙没有放行 8080 端口',
            'jar 包没有打成 fat jar',
            'JDK 版本不对',
          ],
          answer: 1,
          explain:
            '<p>本机 curl 通说明应用本身正常。外网访问不了要看两道门：云控制台安全组的入站规则，以及服务器本机防火墙（firewall-cmd / ufw）。</p>',
        },
        {
          q: '想让 jar 在服务器重启后自动启动、崩溃后自动拉起，应该用？',
          options: [
            'nohup java -jar app.jar &',
            '写一个 systemd service 并用 systemctl enable 设置开机自启',
            '每次手动 ssh 上去执行 java -jar',
            '在 crontab 里加一条 @reboot 就行',
          ],
          answer: 1,
          explain:
            '<p>systemd 的 Restart=on-failure 负责崩溃自动拉起，systemctl enable 负责开机自启，journalctl 负责统一看日志，是长期运行服务的标准做法。</p>',
        },
      ],
    },

    /* ============ 第 4 课 避坑清单 ============ */
    {
      id: 'm08-l04',
      title: '避坑清单：上线当天翻车 Top 6',
      minutes: 35,
      goal: '收拢「打包成功但跑不起来 / 跑起来但不对劲」的 6 个经典故障：没有主清单属性、配置外置不生效、后台运行丢输出、服务器乱码、内存参数缺失、拿旧 jar 上线。每个坑都给出从现象到根因的排查路径。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>「本地明明好好的，一上服务器就不行」是后端新人的成人礼。这一课的 6 个坑按出现频率排序，全部发生在<strong>打包与部署环节</strong>——代码没错，错的是打包方式、启动参数和运行环境。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 1：java -jar 报 no main manifest attribute。</strong>现象：打包成功，一运行就炸：</p>
<pre>target/todo-api-1.0.0.jar中没有主清单属性（no main manifest attribute, in todo-api-1.0.0.jar）</pre>
<p>原因：这只说明打出了一个<strong>普通 jar</strong>（只有你的 class，没有「从哪启动、依赖在哪」的信息）。可执行 jar 需要 spring-boot-maven-plugin 的 <code>repackage</code> 目标把依赖和启动器塞进去。排查两处：</p>`,
        },
        {
          type: 'code',
          lang: 'xml',
          filename: 'pom.xml 检查两处',
          code: `<!-- 检查 1：build.plugins 里必须有 spring-boot-maven-plugin -->
<build>
  <plugins>
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
    </plugin>
  </plugins>
</build>

<!-- 检查 2：如果同时配置了 maven-jar-plugin 自己指定 manifest，会覆盖 repackage 的产物 -->
<!-- 解决：删掉 maven-jar-plugin 的自定义配置，或把 repackage 显式绑定到 package 阶段 -->

<!-- 验证：重新 mvn clean package，看 target 里是否多出一个 *.jar.original -->
<!-- xxx.jar（fat jar，几十 MB）+ xxx.jar.original（瘦 jar，几百 KB）= repackage 成功 -->`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 2：配置外置不生效，改了配置像没改。</strong>你已经把 application-prod.yml 放在 jar 旁边，改了端口却还是 8080。先把优先级钉死（从高到低）：<strong>启动命令行参数 &gt; 环境变量 &gt; jar 外置配置 &gt; jar 内配置</strong>。外置不生效的三个高频原因：</p>
<ul><li><strong>目录不对</strong>：Spring Boot 默认找的是「jar 所在目录」和「jar 同级的 config/ 子目录」。你放到了别的路径还不加 --spring.config.location，等于没放；</li>
<li><strong>被启动脚本覆盖</strong>：start.sh 里写死了 --server.port=8080，命令行参数优先级最高，你改 yml 当然没用——<strong>先看启动脚本再怀疑配置</strong>；</li>
<li><strong>文件名不对</strong>：application-prod.yml 需要激活 prod profile 才加载；profile 没激活时它整个被忽略。</li></ul>
<p>快速定位：启动时加 <code>--debug</code>，或日志里搜「The following profiles are active」确认激活了哪个 profile。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 3：nohup 后台运行，日志丢了 / 进程莫名退出。</strong>正确姿势的细节都在符号上：</p>`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '后台运行正解',
          code: `# 反面教材 1：重定向顺序写反，2>&1 放在 > app.log 前面 → 错误流没进文件
nohup java -jar app.jar 2>&1 > app.log &

# 正确写法：先把标准输出指向 app.log，再把 2>&1（错误流跟到标准输出当前指向的地方）
nohup java -jar app.jar > app.log 2>&1 &

# 反面教材 2：退出终端后进程也死了——用的是会话绑定的 & 而没有 nohup/setsid
java -jar app.jar &          # SSH 断开时可能被 SIGHUP 杀掉

# 正确姿势（推荐直接用 systemd，见 m08-l03）：临时场景才用 nohup
nohup java -jar app.jar --spring.profiles.active=prod > /var/log/todo/app.log 2>&1 &

# 验证：ps -ef | grep app.jar 看进程；tail -f app.log 看日志；kill PID 优雅停止`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 4：服务器上中文乱码 / 时间差 8 小时。</strong>都是「默认值依赖运行环境」惹的祸。乱码：日志输出用了平台默认编码，Linux 默认 C/POSIX 时中文直接问号。时区：jar 里 new Date() 用系统时区，服务器默认 UTC：</p>`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '编码与时区双修',
          code: `# 修乱码：JVM 参数指定编码（Java 18+ 默认 UTF-8，但服务器常是 JDK 17）
nohup java -Dfile.encoding=UTF-8 -jar app.jar > app.log 2>&1 &

# 修系统层面编码（CentOS / Ubuntu）
export LANG=zh_CN.UTF-8      # 写进 /etc/profile 或 systemd 的 Environment=

# 修时区：三选一
timedatectl set-timezone Asia/Shanghai                # 整机
java -Duser.timezone=Asia/Shanghai -jar app.jar       # JVM 级
# spring.jackson.time-zone=Asia/Shanghai              # Jackson 序列化级`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 5：没设堆参数，2G 小服务器直接 OOM。</strong>JVM 默认最大堆 ≈ 物理内存的 1/4。2G 内存的服务器上默认堆只有 ~512MB，看着够用；但如果机器是 16G，JVM 默认拿 4G，再加上系统和其他进程——<strong>容器/小内存机器上必炸</strong>。生产启动参数模板：</p>`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '生产启动参数模板',
          code: `nohup java \\
  -Xms512m -Xmx512m \\            # 初始堆 = 最大堆：避免运行期扩容抖动
  -Xss512k \\                      # 每线程栈大小（并发线程多时可调小防 OOM）
  -Dfile.encoding=UTF-8 \\
  -Duser.timezone=Asia/Shanghai \\
  -XX:+HeapDumpOnOutOfMemoryError \\      # OOM 时自动转储，事后能分析
  -XX:HeapDumpPath=/var/log/todo/ \\
  -jar todo-api-1.0.0.jar \\      # 2G 内存小服务器的保守起点；观测后调优
  > app.log 2>&1 &`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 6：把旧 jar 传上去了。</strong>最冤种的事故：排查两小时，最后发现服务器上跑的还是上周的包。<strong>三步自查：</strong>① 本地打包前先 <code>mvn clean package</code>（clean 清掉上次的 target）；② 对比本地与服务器 jar 的 MD5：<code>certutil -hashfile app.jar MD5</code>（Windows）/ <code>md5sum app.jar</code>（Linux）；③ 启动日志第一行打印版本号（Spring Boot 启动 banner 或自定义日志），一眼确认版本。给工程加一条纪律：<strong>部署脚本里打包、上传、重启、验证四步一条龙，不手工跳步</strong>。</p>`,
        },
        {
          type: 'table',
          title: '上线故障速查表',
          head: ['现象', '第一嫌疑', '修法'],
          rows: [
            ['no main manifest attribute', '缺 repackage 插件', '补 spring-boot-maven-plugin 后 clean package'],
            ['改外置配置没反应', '目录错 / 被启动参数覆盖 / profile 未激活', '核对 config/ 位置；查启动脚本；日志确认 active profile'],
            ['SSH 断开服务就死', '没用 nohup / 未配 systemd', 'nohup ... & 或上 systemd（l03）'],
            ['日志中文问号', 'file.encoding / LANG', '-Dfile.encoding=UTF-8 + export LANG'],
            ['时间差 8 小时', '时区默认 UTC', 'timedatectl 或 -Duser.timezone'],
            ['2G 小机器 OOM', 'JVM 默认堆不合身', '-Xms -Xmx 显式设置 + OOM 转储'],
            ['修的问题又出现', '跑的是旧 jar', 'clean package + MD5 对比 + 启动日志版本号'],
          ],
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>对照前端记忆：</strong>no main manifest ≈ package.json 没有 main / bin 字段，node 不知道从哪进；配置外置优先级 ≈ Vite 的 define 与 .env 覆盖顺序；nohup 丢日志 ≈ console.log 重定向少写了 stderr（<code>node app.js &gt; log 2&gt;&amp;1</code> 同款符号）。<strong>部署的本质是把「运行环境的默认值」全部换成显式声明</strong>——这一课所有坑都是某个默认值在服务器上和你本地不一样。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>亲手复现一次 no main manifest 并修好。</li>
<li>写一份自己的「生产启动命令模板」存进项目脚本。</li>
<li>部署脚本四步一条龙：打包、上传、重启、日志验证。</li></ul>
<p>到这里，阶段二「写出完整后端」全部完成。阶段三用 Redis 和 Docker 给项目上强度。</p>`,
        },
      ],
      quiz: [
        {
          q: 'mvn package 成功，java -jar 却报 no main manifest attribute。最可能的原因是？',
          options: [
            'JDK 版本不匹配',
            'pom 里缺少（或被覆盖了）spring-boot-maven-plugin 的 repackage，打出来的是普通瘦 jar',
            'application.yml 语法错误',
            '服务器端口被占用',
          ],
          answer: 1,
          explain:
            '普通 jar 没有 Main-Class 与依赖信息，无法独立运行。补上 spring-boot-maven-plugin 并 clean package，成功后 target 里会出现 fat jar 和 *.jar.original 两个文件。',
        },
        {
          q: 'jar 旁边放了 application-prod.yml 却没生效，启动脚本里带 --server.port=8080。真实原因是？',
          options: [
            'yml 文件编码不对',
            '命令行参数优先级高于外置配置文件，端口被启动脚本里的参数覆盖',
            'Spring Boot 不支持外置配置',
            '需要把 yml 改名成 bootstrap.yml',
          ],
          answer: 1,
          explain:
            '优先级：命令行参数 > 环境变量 > jar 外配置 > jar 内配置。排查「配置不生效」永远先看启动脚本带没带参数，再查文件位置与 profile 是否激活。',
        },
        {
          q: '关于 nohup java -jar app.jar 的日志重定向，写法正确的是？',
          options: [
            'nohup java -jar app.jar 2>&1 > app.log &',
            'nohup java -jar app.jar > app.log 2>&1 &',
            'nohup java -jar app.jar & log app.log',
            'java -jar app.jar >> app.log &（前台会话里直接 &）',
          ],
          answer: 1,
          explain:
            '2>&1 的含义是「错误流跟随标准输出当前指向」，必须放在 > app.log 之后，标准输出先指到文件，错误流才能跟进。写反了错误信息只会打到终端（终端一关就丢）。长期运行建议直接上 systemd。',
        },
        {
          q: '2G 内存的服务器跑 Spring Boot，最稳妥的 JVM 参数是？',
          options: [
            '不设参数，让 JVM 自动管理',
            '-Xms2g -Xmx2g，把 2G 全给 JVM',
            '-Xms512m -Xmx512m，给系统和元空间留余量，观测后再调',
            '-Xmx4096m，先超卖了再说',
          ],
          answer: 2,
          explain:
            '系统本身、元空间、线程栈都要吃内存，2G 机器给 JVM 512M 起步最稳。Xms=Xmx 避免扩容抖动，配 HeapDumpOnOutOfMemoryError 便于事后分析。超卖只会换来内核 OOM killer。',
        },
      ],
    },
  ],
};

export default module;
