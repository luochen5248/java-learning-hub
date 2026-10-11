import type { RawModule } from '../types/course'

/**
 * m01 · IntelliJ IDEA 使用 —— 课程数据
 *
 * 读者画像：熟悉 Vue3 + TS + Vite 的前端工程师，Windows 11 + IDEA 2024.2.4 + JDK 17。
 * Schema 严格遵循 plan.md §4；SVG 遵循 §5（viewBox 0 0 680 360，marker id 带 m01 前缀）。
 */

export const module: RawModule = {
  id: 'm01',
  order: 1,
  title: 'IntelliJ IDEA 使用',
  subtitle: '把 VSCode 的手感迁移到 IDEA',
  phase: 'phase1',
  phaseName: '阶段一 · 快速上手',
  icon: '🛠',
  cover: 'assets/img/m01-idea.jpg',
  minutes: 90,
  summary:
    '先把工具链装对：JDK 17 怎么装、环境变量怎么配、IDEA 界面怎么认。再学会新建项目、运行程序和打断点调试——这是前端同学从 console.log 走向 Debug 的第一步。学完你能在 IDEA 里熟练地写代码、跑代码、查问题。',

  /* ---------------- 闪卡 10 张 ---------------- */
  flashcards: [
    { front: 'Windows 上查看 JDK 版本的命令？', back: '命令行执行 java -version，正确安装时会输出 openjdk version "17.x.x"', tag: '命令' },
    { front: '配置 JDK 需要设置哪两个环境变量？', back: 'JAVA_HOME 指向 JDK 根目录；Path 追加 %JAVA_HOME%\\bin。不再需要 CLASSPATH', tag: '配置' },
    { front: '下载 JDK 前怎么判别 CPU 架构？', back: 'Win+R 输 msinfo32 看系统类型：x64 选 x64 包，ARM64 选 AArch64 包', tag: '配置' },
    { front: 'IDEA 里的「万能修复」快捷键？', back: 'Alt+Enter：报错修复、自动导包、生成变量、改签名全靠它', tag: '快捷键' },
    { front: '格式化代码的快捷键？', back: 'Ctrl+Alt+L（Windows），对应 VSCode 里 Prettier 的 Shift+Alt+F', tag: '快捷键' },
    { front: '跳转到定义 / 查看实现分别是？', back: '跳转定义 Ctrl+B（VSCode 是 F12）；跳转实现 Ctrl+Alt+B', tag: '快捷键' },
    { front: '调试相关的四个快捷键？', back: 'Shift+F9 启动调试；F8 单步跳过；F7 单步进入；F9 跳到下一个断点', tag: '调试' },
    { front: 'IDEA 普通 Java 项目的编译产物在哪？', back: 'out\\production\\模块名；Maven 项目则在 target\\classes', tag: '项目结构' },
    { front: 'IDEA 里统一 UTF-8 在哪设置？', back: 'Settings → Editor → File Encodings，三处编码都选 UTF-8', tag: '配置' },
    { front: 'Project 对应前端的什么？', back: 'Project ≈ 工作区；Run Configuration ≈ package.json 的 scripts', tag: '概念' },
  ],

  lessons: [
    /* ============================ L01 ============================ */
    {
      id: 'm01-l01',
      title: '安装与首次配置（JDK 17）',
      minutes: 30,
      goal: '在 Windows 上装好 JDK 17 与 IDEA 2024.2.4，让 java -version 正确输出版本号，并理解「源码 → 编译 → JVM」这条链路。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>写后端的第一道门槛不是语法，是<strong>环境</strong>。前端同学对此应该很有共鸣：Node 版本不对，<code>npm install</code> 就能卡你一整天。Java 这边对应的就是 <strong>JDK（Java Development Kit）</strong>。</p>
<p>本课程的统一基线是 <strong>JDK 17（LTS）</strong>。JDK 8 和 JDK 17 都是长期支持版，但 JDK 17 是新一代的事实标准，Spring Boot 3.x 强制要求 JDK 17 起步。既然从零开始，直接上 17 最省事。</p>
<p>本课的终点很明确：命令行里敲 <code>java -version</code> 能打印出 17.x，并且你能用「记事本 + 命令行」和「IDEA」两种方式各跑通一次 HelloWorld。</p>`,
        },
        {
          type: 'fe',
          html: String.raw`<p>三个概念先对齐：</p>
<ul><li><strong>JDK</strong> ≈ Node.js 运行时 + 编译器，没有它 Java 代码一行都跑不起来。</li>
<li><strong>IntelliJ IDEA</strong> ≈ WebStorm（同属 JetBrains 家，操作逻辑几乎一样）。</li>
<li><strong>JVM</strong> ≈ 浏览器的 JS 引擎角色：不管你在 Windows 还是 Linux，字节码都跑在 JVM 上，这是 Java「一次编写到处运行」的来源。</li></ul>`,
        },
        {
          type: 'steps',
          title: '第一步：先判别你的 CPU 架构（别下错安装包）',
          items: [
            String.raw`按 <code>Win + R</code>，输入 <code>msinfo32</code> 回车，打开「系统信息」。`,
            String.raw`右侧「系统摘要」里找到<strong>系统类型</strong>这一行。`,
            String.raw`显示<strong>「基于 x64 的电脑」</strong>→ 选 x64 / x86_64 安装包；显示<strong>「基于 ARM64 的电脑」</strong>→ 选 AArch64 安装包。`,
            String.raw`也可以走图形界面：<code>Win + I</code> → 系统 → 关于 → 设备规格 → 系统类型。`,
          ],
        },
        {
          type: 'table',
          title: '系统类型与安装包选择',
          head: ['你的机器', '下载格式', '说明'],
          rows: [
            ['Windows x64（绝大多数）', 'Windows x64 的 .msi 安装包', '双击下一步安装，自动写注册表，推荐新手'],
            ['Windows ARM64（Surface / 骁龙本）', 'Windows AArch64 版本', '选错会提示「此应用无法在你的电脑上运行」'],
            ['想装在自定义目录', '同版本的 .zip 压缩包', '解压即可用，但环境变量要自己配'],
          ],
        },
        {
          type: 'steps',
          title: '第二步：安装 JDK 17 并配置环境变量',
          items: [
            String.raw`下载 <strong>Eclipse Temurin 17（LTS）</strong>——这是 OpenJDK 社区发行版，免费可用于商业，避免授权风险。`,
            String.raw`安装时记住安装路径，建议用一个<strong>没有中文和空格</strong>的目录，例如 <code>D:\Java\jdk-17</code>。`,
            String.raw`装完打开文件夹确认：根目录里应该能看到 <code>bin</code>、<code>conf</code>、<code>lib</code> 三个文件夹——这就是 JDK 的根。`,
            String.raw`新建系统变量 <code>JAVA_HOME</code>，值填 JDK 根目录（<code>D:\Java\jdk-17</code>），<strong>不要</strong>填到 bin 这一层。`,
            String.raw`编辑系统变量 <code>Path</code>，新增一条 <code>%JAVA_HOME%\bin</code>，并把它上移到靠前的位置。`,
            String.raw`务必<strong>关掉旧的命令行窗口重新打开</strong>——环境变量的修改不会影响已经打开的终端。`,
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'Windows 终端（PowerShell 或 CMD 均可）',
          code: String.raw`# 1. 验证版本：看到 17.x 就说明环境对了
java -version

# 2. 确认命中的是哪个路径（装了多个 JDK 时必须查）
where java

# 3. 编译器 javac 也要能找到，它和 java 在同一个 bin 目录
javac -version

# 4. 看 JAVA_HOME 是否生效
echo %JAVA_HOME%`,
        },
        {
          type: 'tip',
          html: String.raw`<p><strong>为什么不用配 CLASSPATH？</strong>很多老教程会让你加一堆 CLASSPATH 配置，那是 JDK 1.4 时代的事了。JDK 1.5 之后默认就能在当前目录找 class，<strong>只需要 JAVA_HOME 和 Path 两个变量</strong>。网上看到让你配 CLASSPATH 的教程，多半是直接抄的十年前的内容。</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'HelloWorld.java',
          code: String.raw`// 注意：文件名必须叫 HelloWorld.java，与 public 类名完全一致
// Java 强制要求「public 类名 == 文件名」，写错会编译失败
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java 17!");
    }
}`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '命令行编译并运行',
          code: String.raw`cd D:\code\hello

# 编译：把源码翻译成字节码，生成一个 HelloWorld.class 文件
javac HelloWorld.java

# 运行：注意这里写的是类名 HelloWorld，不是 HelloWorld.class
java HelloWorld

# 输出：Hello, Java 17!`,
        },
        {
          type: 'diagram',
          caption: 'Java 源码 → 编译 → JVM 运行全流程',
          svg: String.raw`<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m01-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="12" fill="#0F1B2D"/>
  <text x="340" y="38" text-anchor="middle" font-size="17" fill="#E2E8F0">Java 源码 → 编译 → JVM 运行</text>

  <g>
    <rect x="24" y="70" width="132" height="76" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
    <text x="90" y="100" text-anchor="middle" font-size="14" fill="#E2E8F0">HelloWorld.java</text>
    <text x="90" y="122" text-anchor="middle" font-size="12" fill="#94A3B8">源码（你写的）</text>
  </g>
  <line x1="160" y1="108" x2="212" y2="108" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m01-a)"/>
  <text x="186" y="100" text-anchor="middle" font-size="12" fill="#22D3EE">javac</text>

  <g>
    <rect x="216" y="70" width="132" height="76" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.6"/>
    <text x="282" y="100" text-anchor="middle" font-size="14" fill="#E2E8F0">HelloWorld.class</text>
    <text x="282" y="122" text-anchor="middle" font-size="12" fill="#94A3B8">字节码（中间产物）</text>
  </g>
  <line x1="352" y1="108" x2="404" y2="108" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m01-a)"/>
  <text x="378" y="100" text-anchor="middle" font-size="12" fill="#22D3EE">java</text>

  <g>
    <rect x="408" y="70" width="132" height="76" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.6"/>
    <text x="474" y="100" text-anchor="middle" font-size="14" fill="#E2E8F0">JVM 虚拟机</text>
    <text x="474" y="122" text-anchor="middle" font-size="12" fill="#94A3B8">加载并执行字节码</text>
  </g>

  <line x1="474" y1="150" x2="474" y2="188" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m01-a)"/>

  <g>
    <rect x="150" y="192" width="380" height="66" rx="10" fill="#16233A" stroke="#22D3EE" stroke-width="1.4"/>
    <text x="340" y="218" text-anchor="middle" font-size="14" fill="#E2E8F0">JVM 内部：类加载 → 字节码校验 → 解释执行 / JIT 热点编译</text>
    <text x="340" y="240" text-anchor="middle" font-size="12" fill="#94A3B8">字节码与操作系统无关，这是「一次编写、到处运行」的关键</text>
  </g>

  <line x1="340" y1="262" x2="340" y2="296" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m01-a)"/>

  <g>
    <rect x="196" y="300" width="288" height="44" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.4"/>
    <text x="340" y="328" text-anchor="middle" font-size="13" fill="#E2E8F0">Windows / macOS / Linux（宿主操作系统）</text>
  </g>
</svg>`,
        },
        {
          type: 'text',
          html: String.raw`<p>现在进 IDEA 再跑一遍同样的代码，你会立刻体会到 IDE 的价值：上面那两条命令（编译 + 指定 classpath）<strong>IDEA 全部替你做了</strong>。点一下绿色三角，控制台就出结果。</p>
<p>IDEA 2024.2.4 的界面按区域认识即可：</p>
<ul><li><strong>左侧 Project 面板</strong>：文件树，≈ VSCode 的资源管理器。快捷键 <code>Alt + 1</code> 收起/展开。</li>
<li><strong>中间编辑区</strong>：标签页切换 ≈ VSCode 编辑器组。</li>
<li><strong>底部工具窗口</strong>：Terminal / Run / Debug / Problems，快捷键分别是 <code>Alt+F12</code>、<code>Alt+4</code>、<code>Alt+5</code>。</li>
<li><strong>右侧边栏</strong>：Maven（下一个模块的主战场）、Database（m05 会用到，需 <strong>Ultimate 版</strong>）、Git。</li></ul>`,
        },
        {
          type: 'steps',
          title: '第三步：首次启动的四项必改配置',
          items: [
            String.raw`<strong>主题</strong>：<code>File → Settings → Appearance</code>，暗色可选 Darcula（推荐 IntelliJ Light 之外的深色主题，长时间看代码更舒服）。`,
            String.raw`<strong>字体</strong>：<code>Settings → Editor → Font</code>，建议 JetBrains Mono，Size 14，行高 1.2。`,
            String.raw`<strong>编码</strong>：<code>Settings → Editor → File Encodings</code>，<strong>三处</strong>全部改成 UTF-8（见下方坑点）。`,
            String.raw`<strong>自动导包</strong>：<code>Settings → Editor → General → Auto Import</code>，勾选 Add unambiguous imports on the fly，敲类名自动补 import，体验接近前端 ESLint 自动修复。`,
          ],
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑 1：<code>java -version</code> 提示「不是内部或外部命令」。</strong>九成是环境变量没生效。按顺序排查：① 关掉终端重新打开；② 检查 <code>JAVA_HOME</code> 是不是指向了 bin 目录（应该指向 JDK 根）；③ 命令行敲 <code>where java</code>，看真正命中的是哪个路径；④ 机器里可能预装了旧 JRE，<code>Path</code> 里谁排在前面谁生效。</p>
<p><strong>坑 2：中文乱码。</strong>IDEA 需要确认 Settings → Editor → File Encodings 里 Global Encoding、Project Encoding、Default encoding for properties files <strong>三处都是 UTF-8</strong>，且底部勾选了 Transparent native-to-ascii conversion。这也是为什么更推荐 IDEA 而不是 VSCode 写 Java——VSCode 的 Java 控制台更容易出现编码不一致。</p>`,
        },
        {
          type: 'tip',
          html: String.raw`<p><strong>社区版（Community Edition）完全够用。</strong>入门阶段需要的功能——Java 编辑、调试、Maven、Git——社区版全都有（<strong>但 Database 面板是 Ultimate 版专属</strong>，社区版没有，m05 我们会给出 DBeaver / 命令行的替代方案）。请通过 JetBrains 官网获取社区版或使用正版授权，不要去找来路不明的激活方式，那类内容本课程不提供。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>命令行 <code>java -version</code> 输出 17.x。</li>
<li><code>javac HelloWorld.java</code> 与 <code>java HelloWorld</code> 命令行跑通一次，亲眼看到生成的 <code>.class</code> 文件。</li>
<li>IDEA 打开同一个文件，点绿色三角跑出同样结果。</li>
<li>IDEA 三处编码已确认为 UTF-8。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: '配置 JDK 17 环境变量时，JAVA_HOME 应该指向哪个目录？',
          options: [
            'JDK 根目录下的 bin 目录',
            'JDK 的安装根目录（能看到 bin、conf、lib 的那一层）',
            '随便一个 Java 文件所在目录',
            'JRE 的安装目录',
          ],
          answer: 1,
          explain:
            'JAVA_HOME 指向 JDK 根目录（如 D:\\Java\\jdk-17），Path 里再追加 %JAVA_HOME%\\bin。指到 bin 会导致后续 Maven、Tomcat 等工具找不到 JDK 内的其他文件。',
        },
        {
          q: '关于 CLASSPATH 环境变量，下列说法正确的是？',
          options: [
            '必须配置，否则 javac 无法编译',
            'JDK 1.5 之后不再需要配置，只要 JAVA_HOME 和 Path 即可',
            '只有 Windows 11 需要配置',
            '它用来指定 JDK 的安装位置',
          ],
          answer: 1,
          explain:
            'JDK 1.5 之后默认会在当前目录查找 class，CLASSPATH 成了历史包袱。网上很多需要配 CLASSPATH 的教程是十年前的旧内容。',
        },
        {
          q: '执行 javac HelloWorld.java 之后，再要运行程序，正确的命令是？',
          options: ['java HelloWorld.class', 'java HelloWorld', 'javac HelloWorld', 'java Run HelloWorld'],
          answer: 1,
          explain:
            'javac 负责编译，生成 HelloWorld.class 字节码；java 后面跟的是「类名」而不是文件名，写成 java HelloWorld.class 会报「找不到或无法加载主类」。',
        },
      ],
    },

    /* ============================ L02 ============================ */
    {
      id: 'm01-l02',
      title: '新建项目、运行与 Debug 断点',
      minutes: 30,
      goal: '在 IDEA 里新建第一个 Java 项目，学会 Run Configuration 和断点调试，把 console.log 的习惯换成 Debug。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>前端同学查 bug 的第一反应是 <code>console.log</code>。这个习惯在后端会明显拖慢你：Java 每次改代码都要重新编译，打一次日志意味着「改代码 → 重启 → 复现」的循环。</p>
<p>更好的做法是<strong>断点调试</strong>：程序停在某一行，你可以看此刻所有变量的值、调用栈，还能一行一行往前推。这一课把它练熟，后面看 Spring Boot 源码全靠它。</p>`,
        },
        {
          type: 'steps',
          title: '第一步：新建 Java 项目',
          items: [
            String.raw`欢迎页点 <strong>New Project</strong>（已在项目里则点左上角 <code>File → New → Project</code>）。`,
            String.raw`左侧选 <strong>Java</strong>，右侧 Build system 选 <strong>IntelliJ</strong>（先不用 Maven，Maven 下一模块专门讲）。`,
            String.raw`Project SDK 下拉选 <strong>17</strong>；如果下拉为空，点 Add SDK → Download JDK，选 Version 17、Vendor Eclipse Temurin 下载即可。`,
            String.raw`Location 填一个无中文无空格的路径，例如 <code>D:\code\java-hello</code>，点 Create。`,
            String.raw`左侧 Project 面板里会看到 <code>java-hello</code> 项目和一个 <code>src</code> 目录。<code>src</code> 就是源码根目录，地位等于前端项目里的 <code>src</code>。`,
          ],
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'src/Main.java',
          code: String.raw`import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<String> todos = List.of("写第一个接口", "连数据库", "加缓存");

        int total = todos.size();
        int done = 0;
        for (String title : todos) {
            if (title.startsWith("写")) {   // 在这一行打个断点试试
                done++;
            }
            System.out.println("待办：" + title);
        }

        System.out.printf("共 %d 条，其中 %d 条已开工%n", total, done);
    }
}`,
        },
        {
          type: 'text',
          html: String.raw`<p>运行方式有三种，从上到下优先级依次是「局部 → 整体」：</p>
<ul><li>在编辑器里右键 → <strong>Run 'Main.main()'</strong>（<code>Ctrl + Shift + F10</code>）。</li>
<li>点击 <code>main</code> 方法左侧的<strong>绿色三角</strong>。</li>
<li>顶部工具栏选好运行配置后点绿色三角形（<code>Shift + F10</code> 运行 / <code>Shift + F9</code> 调试）。</li></ul>
<p>运行配置的使用感受，几乎等同于你在 <code>package.json</code> 里定义一个 <code>"dev": "vite"</code> 然后点 NPM Scripts 面板里的小三角。</p>`,
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>Run Configuration ≈ package.json 的 scripts。</strong></p>
<ul><li><strong>Main class</strong> ≈ 你的入口命令（<code>vite</code> / <code>node index.js</code>）。</li>
<li><strong>Program arguments</strong> ≈ <code>npm run dev -- --port 3000</code> 里那两个横杠后面的参数。</li>
<li><strong>VM options</strong> ≈ Node 的 <code>NODE_OPTIONS</code>（如 <code>-Dfile.encoding=UTF-8</code>）。</li>
<li><strong>Environment variables</strong> ≈ 前端的 <code>.env</code>。</li></ul>
<p>入口：<code>Run → Edit Configurations</code>（或工具栏下拉那一项）。后面 Spring Boot 项目 IDEA 会自动帮你生成一份配置。</p>`,
        },
        {
          type: 'steps',
          title: '第二步：打断点调试（前端换 Java 最重要的一步）',
          items: [
            String.raw`在行号与代码之间的空白处<strong>单击</strong>，出现一个红点，这就是行断点（再点一次取消）。`,
            String.raw`右键或以 <code>Shift + F9</code> 启动 <strong>Debug 'Main.main()'</strong>，程序会在断点那一行<strong>暂停</strong>——注意这一行还没执行。`,
            String.raw`底部弹出 Debug 工具窗口，左侧是<strong>调用栈 Frames</strong>，右侧是<strong>变量 Variables</strong> 面板。`,
            String.raw`按 <code>F8</code>（Step Over）执行当前行走到下一行；遇到方法调用想进去就用 <code>F7</code>（Step Into）。`,
            String.raw`想知道任意表达式此刻的值，选中代码按 <code>Alt + F8</code>（Evaluate Expression）临时求值，相当于 DevTools 的 Console 里手敲表达式。`,
            String.raw`想让程序只在某个条件下停：右键红点 → Condition，填 <code>title.equals("加缓存")</code>，这就是<strong>条件断点</strong>，比删了日志重新跑快得多。`,
            String.raw`调试结束点红色方块 Stop（<code>Ctrl + F2</code>），控制台线程会退出。`,
          ],
        },
        {
          type: 'diagram',
          caption: 'Debug 模式的界面布局：看清「执行到哪」和「值是多少」',
          svg: String.raw`<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m01-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="12" fill="#0F1B2D"/>
  <text x="340" y="38" text-anchor="middle" font-size="17" fill="#E2E8F0">Debug 工具窗口速览</text>

  <g>
    <rect x="24" y="58" width="320" height="150" rx="10" fill="#16233A" stroke="#3B82F6" stroke-width="1.5"/>
    <text x="184" y="80" text-anchor="middle" font-size="13" fill="#22D3EE">编辑器（Editor）</text>
    <rect x="40" y="92" width="288" height="26" rx="6" fill="#1B2A44"/>
    <text x="52" y="110" font-size="12" fill="#94A3B8">if (title.startsWith("写")) {</text>
    <rect x="40" y="122" width="288" height="30" rx="6" fill="#3A2338" stroke="#EF4444" stroke-width="1.4"/>
    <circle cx="54" cy="137" r="6" fill="#EF4444"/>
    <text x="70" y="142" font-size="12" fill="#E2E8F0">done++;        ← 当前暂停行</text>
    <rect x="40" y="156" width="288" height="26" rx="6" fill="#1B2A44"/>
    <text x="52" y="174" font-size="12" fill="#94A3B8">System.out.println("待办：" + title);</text>
  </g>

  <line x1="350" y1="133" x2="392" y2="133" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m01-b)"/>

  <g>
    <rect x="396" y="58" width="260" height="150" rx="10" fill="#16233A" stroke="#10B981" stroke-width="1.5"/>
    <text x="526" y="80" text-anchor="middle" font-size="13" fill="#22D3EE">Variables 变量面板</text>
    <text x="412" y="106" font-size="12" fill="#94A3B8">todos = ["写第一个接口", ...]</text>
    <text x="412" y="128" font-size="12" fill="#94A3B8">title = "写第一个接口"</text>
    <text x="412" y="150" font-size="12" fill="#F59E0B">done = 0   ← 下一步才变 1</text>
    <text x="412" y="176" font-size="12" fill="#94A3B8">total = 3</text>
  </g>

  <g>
    <rect x="24" y="228" width="632" height="104" rx="10" fill="#16233A" stroke="#F59E0B" stroke-width="1.5"/>
    <text x="340" y="252" text-anchor="middle" font-size="13" fill="#22D3EE">调试按钮条（从左往右）</text>
    <g font-size="12" fill="#E2E8F0">
      <rect x="40" y="266" width="112" height="34" rx="8" fill="#1B2A44" stroke="#3B82F6"/>
      <text x="96" y="288" text-anchor="middle">F9 恢复运行</text>
      <rect x="164" y="266" width="112" height="34" rx="8" fill="#1B2A44" stroke="#3B82F6"/>
      <text x="220" y="288" text-anchor="middle">F8 单步跳过</text>
      <rect x="288" y="266" width="112" height="34" rx="8" fill="#1B2A44" stroke="#3B82F6"/>
      <text x="344" y="288" text-anchor="middle">F7 单步进入</text>
      <rect x="412" y="266" width="112" height="34" rx="8" fill="#1B2A44" stroke="#3B82F6"/>
      <text x="468" y="288" text-anchor="middle">Shift+F8 跳出</text>
      <rect x="536" y="266" width="104" height="34" rx="8" fill="#1B2A44" stroke="#F59E0B"/>
      <text x="588" y="288" text-anchor="middle">Alt+F8 求值</text>
    </g>
  </g>
</svg>`,
        },
        {
          type: 'table',
          title: '调试快捷键（Windows）与前端对照',
          head: ['动作', 'IDEA', 'Chrome DevTools', '什么时候用'],
          rows: [
            ['开始调试', 'Shift + F9', 'F5 / 打开 Sources 面板', '第一次运行就想知道变量变化'],
            ['单步跳过', 'F8', 'F10', '不想进入被调用的方法'],
            ['单步进入', 'F7', 'F11', '想看一个方法内部怎么走的'],
            ['跳出当前方法', 'Shift + F8', 'Shift + F11', '误入了 JDK 源码想回到自己的代码'],
            ['跳到下一个断点', 'F9', 'F8 继续', '已经看完当前位置，继续往下'],
            ['临时求值', 'Alt + F8', 'Console 里敲表达式', '想立刻算一个表达式的值'],
          ],
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑点：改了代码没重新编译。</strong>IDEA 不像 Vite 有秒级 HMR。Java 属于编译型语言，改完代码要重新触发编译再运行：菜单 <code>Build → Recompile</code>（<code>Ctrl + Shift + F9</code>）或直接重新 Run/Debug。如果发现「明明改了代码但运行结果没变」，先想这一步。</p>
<p><strong>坑点：断点打在空行或注释行。</strong>红色空心圆圈表示这一行没有可执行代码，程序不会停。断点要打在有语句的那一行。</p>`,
        },
        {
          type: 'tip',
          html: String.raw`<p><strong>养成习惯：调试每个你不理解的新框架。</strong>后面学 Spring Boot 时，你会遇到「为什么加个注解就有这个功能」的困惑。最快的办法不是搜博客，而是在源码方法上打断点，走一遍调用栈看谁调了它。这个习惯在前端赛道同样适用，但在后端收益更大——因为后端的框架代码量远超你看过的 npm 包。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能独立新建 Java 项目，能在 src 下创建 <code>Main.java</code> 并运行。</li>
<li>能在某一行打断点，用 F8/F7 单步执行，在 Variables 面板看到变量值。</li>
<li>能设置一个条件断点。</li>
<li>知道在哪儿配置 Program arguments 和 VM options。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: '在 IDEA 中，想要启动断点调试运行的快捷键是？',
          options: ['Shift + F10', 'Shift + F9', 'Ctrl + Alt + L', 'Alt + F8'],
          answer: 1,
          explain:
            'Shift+F9 是 Debug 运行，Shift+F10 是普通运行。Alt+F8 是调试过程中的「临时求值」，Ctrl+Alt+L 是格式化代码。',
        },
        {
          q: '调试时想要「执行当前行但不进入被调用的方法内部」，应该按？',
          options: ['F7（Step Into）', 'F8（Step Over）', 'Shift + F8（Step Out）', 'F9（Resume）'],
          answer: 1,
          explain:
            'F8 单步跳过，把被调用方法当一整步执行完；F7 会进入方法体；Shift+F8 是跳出当前方法回到调用处；F9 是继续跑到下一个断点。',
        },
        {
          q: '关于 Run Configuration，下列说法错误的是？',
          options: [
            '可以设置 Program arguments 给 main 方法传参',
            '可以设置 VM options，作用类似前端的 NODE_OPTIONS',
            '它相当于 package.json 里的 scripts',
            '一个项目只能有一份 Run Configuration，无法新建第二份',
          ],
          answer: 3,
          explain:
            '一个项目可以有多份运行配置（如不同 main 类、不同 profile），在 Run → Edit Configurations 里点左上角加号新建，工具栏下拉切换。',
        },
      ],
    },

    /* ============================ L03 ============================ */
    {
      id: 'm01-l03',
      title: 'VSCode ↔ IDEA 心智迁移',
      minutes: 30,
      goal: '把「工作区 / 终端 / 任务」这套 VSCode 心智，完整映射到 IDEA 的 Project / Run Configuration / 工具窗口，并记住高频快捷键。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>IDEA 让人抗拒的从来不是功能，而是「找不到东西在哪」。这一课的目标就是一次把地图给你。</p>
<p>先说结论：<strong>两者的心智模型高度一致</strong>，差距在命名。你不用重学，只需要做一次翻译。</p>`,
        },
        {
          type: 'compare',
          title: 'VSCode ↔ IntelliJ IDEA 概念对照表',
          head: ['VSCode / 前端', 'IntelliJ IDEA', '说明'],
          rows: [
            ['Workspace（工作区）', 'Project（项目）', '一个窗口打开一个项目；IDEA 里还能拆分 Module，类似 monorepo 的 packages'],
            ['根目录的 .vscode/settings.json', '.idea 目录 + Project Structure', 'IDE 配置存放位置，都不建议手改'],
            ['package.json 的 scripts', 'Run / Debug Configuration', '定义一组可重复运行的命令'],
            ['Ctrl + ` 打开集成终端', 'Alt + F12 打开 Terminal', '都能在 IDE 内直接敲命令'],
            ['NPM Scripts 面板', '右侧 Maven 面板', '双击即执行一个构建任务，下一模块重点'],
            ['ESLint / 保存自动修复', 'Inspection + Alt+Enter', 'IDEA 的静态检查更强，能发现潜在的空指针'],
            ['launch.json 调试配置', 'Run Configuration 的 Debug 模式', '本质都是告诉 IDE 怎么启动并附加调试器'],
            ['command + 点击跳转定义', 'Ctrl + 点击 / Ctrl + B', '都能跳到 node_modules 或 JDK 源码里'],
            ['Prettier 格式化', 'Ctrl + Alt + L', 'IDEA 自带格式化，不需要额外插件'],
          ],
        },
        {
          type: 'table',
          title: '高频快捷键对照（Windows）——建议打印出来贴在显示器旁',
          head: ['用途', 'VSCode', 'IDEA', '备注'],
          rows: [
            ['全局搜索文件', 'Ctrl + P', 'Ctrl + Shift + N', 'IDEA 里双击 Shift 是「搜索一切」'],
            ['全文搜索', 'Ctrl + Shift + F', 'Ctrl + Shift + F', '完全一致'],
            ['搜索命令/动作', 'Ctrl + Shift + P', 'Ctrl + Shift + A', '记不住快捷键就搜动作名'],
            ['跳转定义', 'F12', 'Ctrl + B', 'IDEA 也可用 Ctrl+点击进入'],
            ['万能修复', 'Ctrl + .', 'Alt + Enter', 'IDEA 的杀手锏，务必形成肌肉记忆'],
            ['重命名重构', 'F2', 'Shift + F6', 'Java 的重构比 TS 可靠得多'],
            ['格式化', 'Shift + Alt + F', 'Ctrl + Alt + L', ''],
            ['注释当前行', 'Ctrl + /', 'Ctrl + /', '一致'],
            ['复制当前行', 'Shift + Alt + ↓', 'Ctrl + D', ''],
            ['查看当前文件的成员', 'Ctrl + Shift + O', 'Ctrl + F12', '看一个类有哪些方法很好用'],
            ['撤销', 'Ctrl + Z', 'Ctrl + Z', '一致'],
          ],
        },
        {
          type: 'steps',
          title: '迁移期必须养成的四个习惯',
          items: [
            String.raw`<strong>看到红色波浪线先按 <code>Alt + Enter</code></strong>，不要手动补 import。缺依赖、拼写错误、返回值没接收，它都能给出修复方案。`,
            String.raw`<strong>任何操作找不到入口就用 <code>Ctrl + Shift + A</code></strong> 搜英文动作名（例如搜 "maven" 就能看到 Reload All Maven Projects）。`,
            String.raw`<strong>学会 Alt+1 / Alt+4 / Alt+5 / Alt+F12 这套面板快捷键</strong>，把鼠标伸手調整面板的习惯去掉，效率提升最明显。`,
            String.raw`<strong>写 Java 时把自动保存当成默认（本来就是）</strong>，但记住「自动保存 ≠ 自动部署」，运行前 IDE 会自动编译，不用手动 Save All。`,
          ],
        },
        {
          type: 'table',
          title: 'IDEA 右侧/底部常用工具窗口（后面模块会用到）',
          head: ['工具窗口', '快捷键', '什么时候打开', '对应模块'],
          rows: [
            ['Project', 'Alt + 1', '管理文件与源码目录', 'm01'],
            ['Maven', '右侧边栏点击', '刷新依赖、双击生命周期命令', 'm02'],
            ['Run / Debug', 'Alt + 4 / Alt + 5', '看程序输出、看调用栈', 'm01'],
            ['Terminal', 'Alt + F12', '执行 Windows 命令（mvn、git、docker）', 'm02 / m10'],
            ['Database', '右侧边栏点击', '连 MySQL、写 SQL、看表数据（仅 Ultimate 版）', 'm05'],
            ['Git / Commit', 'Alt + 0 / Alt + 9（版本不同略有差异）', '提交代码、解决冲突', '通用'],
          ],
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>一句话记忆：</strong>IDEA 就是「WebStorm + 官方 eslint/prettier + 调试器 + NPM Scripts 面板 + 数据库面板」捆在一起。</p>
<p>前端同学最容易忽略的是 <strong>Database 面板</strong>——它相当于给后端配的「Redux DevTools」，能直接看到数据库里的状态长什么样。m05 我们会用它，但要注意它<strong>只在 Ultimate 版里才有</strong>：如果你是社区版，别慌，m05 会给出 DBeaver / 命令行的等价替代路线，内容完全一样。</p>`,
        },
        {
          type: 'tip',
          html: String.raw`<p><strong>关于 VSCode 写 Java：</strong>技术上可行，需要安装官方的 Extension Pack for Java 插件包；没装全会出现「找不到主类」「代码不提示」。但同一份代码在 VSCode 里控制台中文乱码的概率明显高于 IDEA。既然目标是学后端而不是折腾编辑器，本课程全程以 IDEA 为准。</p>`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑点：以为社区版少了关键功能。</strong>Web 开发（Spring Boot 全家桶）<strong>确实只有 Ultimate 版</strong>才提供专属提示和框架向导，<strong>Database 面板也只在 Ultimate 版里有</strong>；但本课程的所有代码在社区版里都能照写、照跑——我们是通过 Maven 依赖引入 Spring Boot，而不是依赖 IDE 的框架向导，看数据库也准备了 DBeaver / 命令行两条替代路线。这也是本课程选择社区版友好写法的原因。</p>
<p><strong>坑点：中文教程里的菜单名对不上。</strong>IDEA 版本迭代快，菜单路径会变。找不到时一律用 <code>Ctrl + Shift + A</code> 搜动作名，比记路径可靠。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>不看文档能说出 Project / Module / Run Configuration 对应的前端概念。</li>
<li>能手敲 Alt+Enter、Ctrl+B、Ctrl+Alt+L、Shift+F6 这四个快捷键。</li>
<li>知道 Maven 面板在右侧边栏、Terminal 是 Alt+F12（Database 面板仅在 Ultimate 版有）。</li></ul>
<p>下一模块我们进入 <strong>Maven</strong>——后端世界的 npm。届时右侧 Maven 面板会成为你每天点最多次的地方。</p>`,
        },
      ],
      quiz: [
        {
          q: '在 IDEA 里，能根据报错自动提供修复方案（补 import、创建变量等）的快捷键是？',
          options: ['Ctrl + B', 'Alt + Enter', 'Ctrl + Shift + N', 'Ctrl + F12'],
          answer: 1,
          explain:
            'Alt+Enter 是 IDEA 的「万能修复」，对应 VSCode 的 Ctrl+.（灯泡）。Ctrl+B 跳转定义，Ctrl+Shift+N 搜文件，Ctrl+F12 查看当前类的成员。',
        },
        {
          q: '下列概念迁移，对应关系正确的是？',
          options: [
            'Project ≈ 一个 npm 包',
            'Run Configuration ≈ package.json 的 scripts',
            'Maven 面板 ≈ 浏览器的 Network 面板',
            'Terminal ≈ 前端的 Redux DevTools',
          ],
          answer: 1,
          explain:
            'Run Configuration 定义了一组可重复运行的启动方式，最接近 package.json 的 scripts。Project 对应的是整个工作区，而不是单个包。',
        },
        {
          q: '想在 IDEA 里打开内置终端执行 mvn 命令，快捷键是？',
          options: ['Alt + F12', 'Alt + 4', 'Alt + 5', 'Ctrl + Shift + A'],
          answer: 0,
          explain:
            'Alt+F12 打开 Terminal。Alt+4 是 Run 窗口，Alt+5 是 Debug 窗口，Ctrl+Shift+A 是全局动作搜索。',
        },
      ],
    },
  ],
};
