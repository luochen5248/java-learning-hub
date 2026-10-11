import type { RawModule } from '../types/course'

/**
 * m10 Docker 容器化（3 课）
 *
 * 贯穿项目位置：m08 手工把 jar 传上服务器，m09 又手工装 Redis ——
 * 这一模块把「装 JDK + 传 jar + 装 Redis + 连 MySQL + 配环境变量」
 * 压缩成一条 docker compose up -d，并交付整套部署方式。
 *
 * 环境基线：Docker 24+ / Docker Compose v2（docker compose 子命令）/ MySQL 8 / Redis 7 / JDK 17
 * 命令视角：Windows（PowerShell / CMD）为主。
 */

/* ---------------- 图解 1：镜像 / 容器 / 仓库 三角关系 ---------------- */

const SVG_IMAGE_CONTAINER = `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m10a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="360" rx="12" fill="#0F1B2D"/>
  <text x="340" y="28" text-anchor="middle" font-size="16" fill="#E2E8F0">镜像、容器、仓库：像类、对象与 npm registry</text>

  <rect x="30" y="60" width="170" height="72" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="115" y="88" text-anchor="middle" font-size="14" fill="#E2E8F0">Dockerfile</text>
  <text x="115" y="110" text-anchor="middle" font-size="12" fill="#94A3B8">构建配方（源码）</text>

  <rect x="255" y="60" width="170" height="72" rx="10" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.5"/>
  <text x="340" y="88" text-anchor="middle" font-size="14" fill="#E2E8F0">镜像 Image</text>
  <text x="340" y="110" text-anchor="middle" font-size="12" fill="#94A3B8">只读模板 ≈ class</text>

  <rect x="480" y="46" width="170" height="52" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.5"/>
  <text x="565" y="70" text-anchor="middle" font-size="13.5" fill="#E2E8F0">容器 A（实例）</text>
  <text x="565" y="88" text-anchor="middle" font-size="11.5" fill="#94A3B8">正在跑：端口 8081</text>

  <rect x="480" y="110" width="170" height="52" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.5"/>
  <text x="565" y="134" text-anchor="middle" font-size="13.5" fill="#E2E8F0">容器 B（实例）</text>
  <text x="565" y="152" text-anchor="middle" font-size="11.5" fill="#94A3B8">正在跑：端口 8082</text>

  <rect x="255" y="196" width="170" height="72" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="340" y="224" text-anchor="middle" font-size="14" fill="#E2E8F0">仓库 Registry</text>
  <text x="340" y="246" text-anchor="middle" font-size="12" fill="#94A3B8">Docker Hub ≈ npm registry</text>

  <line x1="200" y1="96" x2="253" y2="96" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m10a)"/>
  <text x="226" y="86" text-anchor="middle" font-size="11" fill="#94A3B8">build</text>

  <path d="M425,84 L455,84 L455,72 L478,72" fill="none" stroke="#10B981" stroke-width="1.8" marker-end="url(#arr-m10a)"/>
  <path d="M425,108 L455,108 L455,136 L478,136" fill="none" stroke="#10B981" stroke-width="1.8" marker-end="url(#arr-m10a)"/>
  <text x="452" y="196" text-anchor="middle" font-size="11" fill="#10B981">run</text>

  <line x1="340" y1="132" x2="340" y2="194" stroke="#F59E0B" stroke-width="1.8" marker-end="url(#arr-m10a)"/>
  <text x="352" y="168" font-size="11" fill="#F59E0B">push / pull</text>

  <rect x="30" y="196" width="170" height="72" rx="10" fill="#1B2A44" stroke="#64748B" stroke-width="1.5"/>
  <text x="115" y="224" text-anchor="middle" font-size="14" fill="#E2E8F0">你的代码仓库</text>
  <text x="115" y="246" text-anchor="middle" font-size="12" fill="#94A3B8">git / GitHub</text>

  <rect x="16" y="288" width="648" height="56" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="340" y="312" text-anchor="middle" font-size="12.5" fill="#E2E8F0">一句话记住：镜像是"类"，容器是"对象"，仓库是"包仓库"，Dockerfile 是"构建脚本"</text>
  <text x="340" y="332" text-anchor="middle" font-size="12" fill="#94A3B8">同一个镜像可以 run 出很多容器，互不影响 —— 这就是"环境一致"的根本原因</text>
</svg>`;

/* ---------------- 图解 2：镜像分层（Dockerfile 每条指令 = 一层） ---------------- */

const SVG_IMAGE_LAYERS = `<svg viewBox="0 0 680 380" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m10b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="380" rx="12" fill="#0F1B2D"/>
  <text x="340" y="26" text-anchor="middle" font-size="16" fill="#E2E8F0">多阶段构建：构建阶段的产物被"搬运"到运行阶段</text>

  <rect x="30" y="46" width="270" height="300" rx="12" fill="#132338" stroke="#3B82F6" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="165" y="70" text-anchor="middle" font-size="13.5" fill="#22D3EE">阶段一：build（构建）</text>
  <text x="165" y="90" text-anchor="middle" font-size="11.5" fill="#94A3B8">FROM maven + JDK 17</text>

  <rect x="50" y="102" width="230" height="46" rx="8" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="165" y="130" text-anchor="middle" font-size="12" fill="#E2E8F0">FROM maven:3.9 AS build</text>

  <rect x="50" y="156" width="230" height="46" rx="8" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="165" y="184" text-anchor="middle" font-size="12" fill="#E2E8F0">COPY pom.xml / src</text>

  <rect x="50" y="210" width="230" height="46" rx="8" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="165" y="238" text-anchor="middle" font-size="12" fill="#E2E8F0">RUN mvn clean package</text>

  <rect x="50" y="264" width="230" height="46" rx="8" fill="#1B2A44" stroke="#10B981" stroke-width="1.5"/>
  <text x="165" y="288" text-anchor="middle" font-size="12" fill="#E2E8F0">/build/target/*.jar</text>
  <text x="165" y="303" text-anchor="middle" font-size="11" fill="#94A3B8">唯一被带出去的东西</text>

  <rect x="380" y="46" width="270" height="300" rx="12" fill="#132338" stroke="#10B981" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="515" y="70" text-anchor="middle" font-size="13.5" fill="#22D3EE">阶段二：runtime（运行）</text>
  <text x="515" y="90" text-anchor="middle" font-size="11.5" fill="#94A3B8">只有 JRE，没有 Maven</text>

  <rect x="400" y="102" width="230" height="46" rx="8" fill="#1B2A44" stroke="#10B981" stroke-width="1.5"/>
  <text x="515" y="130" text-anchor="middle" font-size="12" fill="#E2E8F0">FROM eclipse-temurin:17-jre</text>

  <rect x="400" y="156" width="230" height="46" rx="8" fill="#1B2A44" stroke="#10B981" stroke-width="1.5"/>
  <text x="515" y="184" text-anchor="middle" font-size="12" fill="#E2E8F0">COPY --from=build app.jar</text>

  <rect x="400" y="210" width="230" height="46" rx="8" fill="#1B2A44" stroke="#10B981" stroke-width="1.5"/>
  <text x="515" y="238" text-anchor="middle" font-size="12" fill="#E2E8F0">WORKDIR /app  EXPOSE 8080</text>

  <rect x="400" y="264" width="230" height="46" rx="8" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.5"/>
  <text x="515" y="292" text-anchor="middle" font-size="12" fill="#E2E8F0">ENTRYPOINT java -jar</text>

  <path d="M280,287 L340,287 L340,179 L398,179" fill="none" stroke="#F59E0B" stroke-width="2" marker-end="url(#arr-m10b)"/>
  <text x="340" y="272" text-anchor="middle" font-size="11" fill="#F59E0B">COPY --from=build</text>

  <text x="340" y="362" text-anchor="middle" font-size="12" fill="#94A3B8">不用多阶段：镜像 700MB+ ；用了多阶段：通常 200MB 上下，Maven 与源码根本没进最终镜像</text>
</svg>`;

/* ---------------- 图解 3：docker compose 三容器拓扑 ---------------- */

const SVG_COMPOSE_TOPOLOGY = `<svg viewBox="0 0 680 380" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m10c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="380" rx="12" fill="#0F1B2D"/>
  <text x="340" y="24" text-anchor="middle" font-size="16" fill="#E2E8F0">docker compose：一套编排拉起后端 + MySQL + Redis</text>

  <rect x="16" y="38" width="648" height="200" rx="12" fill="#132338" stroke="#3B82F6" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="40" y="60" font-size="13" fill="#22D3EE">Docker 主机（你的 Windows 11）</text>

  <rect x="46" y="76" width="588" height="142" rx="10" fill="#0F1B2D" stroke="#22D3EE" stroke-width="1.5"/>
  <text x="340" y="98" text-anchor="middle" font-size="12" fill="#94A3B8">compose 默认网络：服务之间用「服务名」互相访问</text>

  <rect x="76" y="112" width="200" height="86" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.8"/>
  <text x="176" y="138" text-anchor="middle" font-size="13.5" fill="#E2E8F0">app</text>
  <text x="176" y="158" text-anchor="middle" font-size="11.5" fill="#94A3B8">todo-api（自建镜像）</text>
  <text x="176" y="176" text-anchor="middle" font-size="11.5" fill="#F59E0B">8080 → 宿主 8080</text>

  <rect x="466" y="112" width="150" height="86" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.8"/>
  <text x="541" y="138" text-anchor="middle" font-size="13.5" fill="#E2E8F0">mysql</text>
  <text x="541" y="158" text-anchor="middle" font-size="11.5" fill="#94A3B8">mysql:8</text>
  <text x="541" y="176" text-anchor="middle" font-size="11.5" fill="#94A3B8">3306 内部端口</text>

  <rect x="292" y="112" width="150" height="86" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.8"/>
  <text x="367" y="138" text-anchor="middle" font-size="13.5" fill="#E2E8F0">redis</text>
  <text x="367" y="158" text-anchor="middle" font-size="11.5" fill="#94A3B8">redis:7</text>
  <text x="367" y="176" text-anchor="middle" font-size="11.5" fill="#94A3B8">6379 内部端口</text>

  <line x1="276" y1="146" x2="290" y2="146" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m10c)"/>
  <line x1="466" y1="170" x2="278" y2="170" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m10c)"/>
  <text x="360" y="210" text-anchor="middle" font-size="11" fill="#94A3B8">app 里写 jdbc:mysql://mysql:3306 与 spring.data.redis.host=redis</text>

  <rect x="46" y="256" width="280" height="72" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="186" y="282" text-anchor="middle" font-size="13" fill="#E2E8F0">数据卷 mysql-data</text>
  <text x="186" y="302" text-anchor="middle" font-size="11.5" fill="#94A3B8">容器删了数据还在</text>
  <text x="186" y="320" text-anchor="middle" font-size="11.5" fill="#94A3B8">/var/lib/mysql 具名卷</text>

  <rect x="354" y="256" width="280" height="72" rx="10" fill="#1B2A44" stroke="#EF4444" stroke-width="1.5"/>
  <text x="494" y="282" text-anchor="middle" font-size="13" fill="#E2E8F0">注意：容器内没有 localhost</text>
  <text x="494" y="302" text-anchor="middle" font-size="11.5" fill="#94A3B8">localhost 指的是容器自己</text>
  <text x="494" y="320" text-anchor="middle" font-size="11.5" fill="#94A3B8">连宿主要用 host.docker.internal</text>

  <path d="M186,218 L186,254" fill="none" stroke="#F59E0B" stroke-width="1.8" marker-end="url(#arr-m10c)"/>
  <path d="M541,198 L541,254" fill="none" stroke="#F59E0B" stroke-width="1.8" marker-end="url(#arr-m10c)"/>

  <rect x="16" y="330" width="648" height="46" rx="6" fill="#1B2A44" stroke="#10B981" stroke-width="1.2"/>
  <text x="340" y="344" text-anchor="middle" font-size="11.5" fill="#E2E8F0">一条命令启动：docker compose up -d</text>
  <text x="340" y="360" text-anchor="middle" font-size="11.5" fill="#94A3B8">一条命令查看：docker compose logs -f app</text>
  <text x="340" y="373" text-anchor="middle" font-size="11.5" fill="#94A3B8">一条命令下线：docker compose down（数据卷保留，要连数据一起清掉加 -v）</text>
</svg>`;

/* ---------------- 模块数据 ---------------- */

export const module: RawModule = {
  id: 'm10',
  order: 10,
  title: 'Docker 容器化',
  subtitle: '镜像、容器、仓库与 Dockerfile，用 compose 一键拉起全家桶',
  phase: 'phase3',
  phaseName: '阶段三 · 原理补课与进阶',
  icon: '🐳',
  cover: 'assets/img/m10-docker.jpg',
  minutes: 145,
  summary:
    'm08 你手工装了 JDK、传了 jar、改了防火墙；m09 又手工装了一个 Redis。这一模块把这些动作全部收进 Docker：先把「待办清单 API」打成一个自带 JRE 的镜像，再用一份 docker-compose.yml 把应用、MySQL、Redis 三个容器编排在一起，一条命令拉起、数据卷持久化、curl 验证接口。收尾的避坑清单专治镜像拉取失败、容器秒退、日志膨胀、容器时区这些环境问题。K8s、Swarm 属于超出入门范围的内容，本模块不展开，但读完你就能独立交付一个小项目的完整部署。',

  flashcards: [
    { front: '镜像和容器的关系是什么？', back: '镜像是只读模板（≈ class），容器是镜像跑起来的实例（≈ 对象）。同一镜像可以 run 出多个互不影响的容器', tag: '概念' },
    { front: 'Dockerfile 是什么？', back: '构建镜像的配方文件。一条指令对应镜像的一层，类比 package.json + 构建脚本之于 dist/', tag: '概念' },
    { front: '为什么 Spring Boot 镜像推荐多阶段构建？', back: '构建阶段用 maven+JDK 打 jar，运行阶段只留 JRE，最终镜像不含 Maven 与源码，体积从 700MB+ 降到 200MB 上下', tag: '命令' },
    { front: 'docker run 常用参数有哪些？', back: '-d 后台、--name 命名、-p 主机端口:容器端口、-e 环境变量、-v 数据卷、--rm 用完自动删', tag: '命令' },
    { front: '容器里连不上宿主机的 MySQL？', back: '容器内 localhost 指容器自己。Windows/Mac 用 host.docker.internal，Linux 需额外配置；或把 MySQL 也放进 compose 用服务名访问', tag: '坑点' },
    { front: '为什么容器一删数据就没了？', back: '容器文件系统是临时的。必须用 -v 挂载数据卷（如 -v mysql-data:/var/lib/mysql）做持久化', tag: '坑点' },
    { front: 'depends_on 能保证 MySQL 初始化完成吗？', back: '不能，它只保证启动顺序。用 healthcheck + condition: service_healthy，或给应用配置连接重试', tag: '坑点' },
    { front: 'compose 里服务名有什么特殊作用？', back: '服务名就是容器内网里的 hostname，应用连库写 jdbc:mysql://mysql:3306 而不是 localhost', tag: '配置' },
    { front: '进入正在运行的容器看日志/配置怎么操作？', back: 'docker logs -f <容器> 看日志；docker exec -it <容器> bash 进容器内部；docker ps / ps -a 看状态', tag: '命令' },
    { front: 'Windows 上装 Docker Desktop 的硬性前提？', back: 'Windows 10/11 需开启 WSL2（wsl --install）或 Hyper-V；BIOS 里打开虚拟化。首次启动会下载 WSL 内核', tag: '坑点' },
    { front: 'docker pull 超时/失败，先查什么？', back: 'docker info | grep -A5 Mirrors 看加速器配了没。国内需在 daemon.json（或 Docker Desktop 设置）配 registry-mirrors', tag: '坑点' },
    { front: '容器起来几秒就退出（Exited），怎么排查？', back: 'docker logs <容器> 看退出日志。常见根因：CMD 不是前台常驻进程（容器主进程退出=容器退出）', tag: '坑点' },
    { front: '容器日志无限膨胀怎么防？', back: '全局或按容器配 log-driver json-file + max-size/max-file，如 compose 里 logging.options.max-size: "50m"', tag: '坑点' },
  ],

  lessons: [
    /* ============ 第 1 课 ============ */
    {
      id: 'm10-l01',
      title: '核心概念：镜像、容器与仓库',
      minutes: 30,
      goal: '用类与对象、git 仓库这两组前端熟悉的比喻理解 Docker 三个核心概念，并在 Windows 上把 Docker Desktop 跑起来。',
      sections: [
        {
          type: 'text',
          html:
            '<p><strong>此刻你在项目的哪一步：</strong>m08 你手工做了一整套上线动作：装 JDK、上传 jar、配防火墙、开端口；m09 又手工装了一个 Redis。这些步骤在<strong>每台新机器上都要重做一遍</strong>，而且每遍都可能略有不同——这就是「环境不一致」这个运维灾难的源头。</p>' +
            '<p>Docker 的思路朴素得惊人：<strong>把「操作系统 + 运行时 + 你的应用 + 依赖」打成一个文件</strong>，拷到哪台机器上解压就能跑。别人不再需要配环境，他们只需要「跑一下这个文件」。</p>',
        },
        {
          type: 'fe',
          html:
            '<p><strong>三个比喻，前端视角：</strong></p>' +
            '<ul>' +
            '<li><strong>镜像 Image ≈ class</strong>：一个只读的模板，描述「运行这个应用需要什么」。</li>' +
            '<li><strong>容器 Container ≈ 对象</strong>：镜像跑起来的实例。同样一个镜像可以 run 出 10 个容器，它们<strong>互相隔离</strong>，改一个不影响另一个——这正是「本地能跑、线上也能跑」的根本原因。</li>' +
            '<li><strong>仓库 Registry ≈ npm registry / GitHub</strong>：镜像集中存放的地方。别人不用你给 jar，给一个镜像名就能拉下来跑。</li>' +
            '<li><strong>Dockerfile ≈ 构建脚本</strong>：像 <code>package.json</code> 加构建配置之于 <code>dist/</code>，Dockerfile 之于镜像。</li>' +
            '</ul>' +
            '<p>还有一个更贴切的对比：<code>git pull</code> 拉的是<strong>源码</strong>，还需要你本地有 JDK、Maven 才能编译；<code>docker pull</code> 拉的是<strong>连运行时都打包好的成品</strong>，什么都不用装。</p>',
        },
        {
          type: 'diagram',
          caption: '镜像、容器、仓库的三角关系',
          svg: SVG_IMAGE_CONTAINER,
        },
        {
          type: 'compare',
          title: '容器 vs 虚拟机：最容易搞混的一组',
          head: ['', '容器（Docker）', '虚拟机（VMware / 云服务器）'],
          rows: [
            ['包含什么', '只打包应用 + 依赖 + 运行时', '含完整操作系统（几 GB）'],
            ['启动速度', '秒级（进程级启动）', '分钟级（要启动一个 OS）'],
            ['体积', '几十 MB ~ 几百 MB', '几 GB ~ 几十 GB'],
            ['隔离方式', '共享宿主内核，进程级隔离（namespace + cgroup）', '虚拟机自带内核，硬件级隔离'],
            ['运行前提', '要 Docker 引擎', '要虚拟化支持'],
            ['典型用途', '应用打包、微服务、CI/CD、本地环境复现', '完全隔离的测试环境、不同操作系统'],
          ],
        },
        {
          type: 'steps',
          title: 'Windows 11 上安装 Docker Desktop（含 WSL2 要点）',
          items: [
            '确认系统：Win+R 输入 <code>winver</code>，需要 Windows 10 21H2 / Windows 11 或更高，版本号 19045+ / 22H2+',
            '开启硬件虚拟化：任务管理器 → 性能 → CPU → 「虚拟化：已启用」；若显示"已禁用"，需进 BIOS 打开 Intel VT-x / AMD-V',
            '装 WSL2：以管理员身份打开 PowerShell，执行 <code>wsl --install</code>（会自动装 WSL2 与 Linux 内核，需重启电脑）',
            '安装 Docker Desktop：从官网下载 Windows 版 Installer，安装时勾选「Use WSL 2 instead of Hyper-V」',
            '首次启动 Docker Desktop 会在右上角托盘等图标，等 whale 图标稳定不再转圈即引擎就绪',
            '验证：打开 PowerShell 执行 <code>docker version</code>，能同时看到 Client 与 Server 两段信息即成功',
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'Windows · PowerShell 验证与安装 WSL2',
          code: `# 在 PowerShell 里先确认虚拟化与 WSL 状态
systeminfo | Select-String "Hyper-V"          # 虚拟化需求是否满足
wsl --status                                # 查看 WSL 版本（应为 2）
wsl --list --verbose                         # 看已安装发行版与 WSL 版本

# 没装 WSL2 时，以管理员身份执行
wsl --install

# 装完 Docker Desktop 后验证引擎（Client + Server 都要有）
docker version
docker info

# 拉一个镜像试试（拉不动见下方 warn）
docker pull hello-world
docker run --rm hello-world`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'Windows · 最有冲击力的一条命令',
          code: `# 一条命令拥有一个 MySQL 数据库，不需要安装、不需要配服务、不需要初始化
docker run -d --name mysql8 -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8

# 进入数据库看一眼
docker exec -it mysql8 mysql -uroot -proot -e "show databases;"

# 停止并删除（数据随容器一起没了，下次会重讲怎么用数据卷保住它）
docker stop mysql8
docker rm mysql8`,
        },
        {
          type: 'warn',
          html:
            '<p><strong>坑 1：Docker Desktop 装不上 / WSL2 报错。</strong>先跑 <code>systeminfo</code> 看「Hyper-V 需求」那一段，如果显示「检测到虚拟机监控程序已将禁用 Hyper-V 的功能」，就是<strong>虚拟化没在 BIOS 打开</strong>，Docker 无法启动。</p>' +
            '<p><strong>坑 2：拉镜像超时。</strong>Docker Hub 在国内访问很慢。解决：在 Docker Desktop → Settings → Docker Engine 里配置镜像加速器，例如：</p>' +
            '<pre class="code-inline">{\n  "registry-mirrors": ["https://docker.m.daocloud.io"]\n}</pre>' +
            '<p>点 Apply &amp; Restart 生效。国内多个加速器可同时配置。</p>' +
            '<p><strong>坑 3：WSL2 版本过旧。</strong>执行 <code>wsl --update</code> 更新内核，再 <code>wsl --shutdown</code> 重新启动。</p>' +
            '<p><strong>坑 4：占内存。</strong>Docker Desktop 默认会吃掉不少内存，8GB 内存的机器跑 MySQL + Redis + 应用会吃力。可在 Settings → Resources 里手动调小 Docker 的内存上限。</p>',
        },
        {
          type: 'tip',
          html:
            '<p><strong>本课产出物检查清单：</strong>① <code>docker version</code> 能看到 Client 和 Server；② 能 <code>docker pull hello-world</code> 并成功运行；③ 能用一条 <code>docker run</code> 起 MySQL 并 <code>docker exec</code> 进去执行 SQL；④ 能对「镜像 = class，容器 = object」这个类比说清楚。</p>' +
            '<p>下一课：给待办清单 API 写一个 Dockerfile，把「装 JDK 编译 jar 再启动」这一整套变成一条 docker build。</p>',
        },
      ],
      quiz: [
        {
          q: '关于镜像与容器，下面说法正确的是？',
          options: [
            '镜像是正在运行的进程，容器是它的模板',
            '镜像是只读模板，容器是镜像运行起来的实例，同一镜像可启多个容器',
            '一个镜像只能启动一个容器',
            '容器删除后镜像会自动一起删除',
          ],
          answer: 1,
          explain:
            '<p>镜像是不可变的模板（类），容器是它的运行实例（对象）。同一镜像可以 run 出多个互相隔离的容器；删容器不影响镜像，删镜像也不影响已跑起来的容器。</p>',
        },
        {
          q: '在 Windows 11 上启动 Docker Desktop 失败，最该先检查什么？',
          options: [
            'Docker Hub 账号有没有登录',
            'BIOS 里的 CPU 虚拟化（Intel VT-x / AMD-V）是否开启',
            '有没有安装 Git',
            '磁盘剩余空间是否超过 100GB',
          ],
          answer: 1,
          explain:
            '<p>Docker 依赖虚拟化。任务管理器 → 性能 → CPU 里"虚拟化：已禁用"就必须进 BIOS 打开。另外 WSL2 也需要 <code>wsl --install</code> 安装。</p>',
        },
        {
          q: '关于容器和虚拟机的区别，正确的是？',
          options: [
            '容器体积比虚拟机大，启动更慢',
            '容器共享宿主内核，秒级启动；虚拟机自带操作系统，体积大、启动慢',
            '容器不能隔离，虚拟机才能隔离',
            '虚拟机必须装 Docker 才能运行',
          ],
          answer: 1,
          explain:
            '<p>容器是进程级隔离、共享宿主内核，所以轻量且秒启；虚拟机自带完整操作系统，隔离更强但体积大、启动慢。</p><p>补一句：Windows / macOS 上 Docker Desktop 实际上是先在 WSL2 或 Hyper-V 里起一台轻量 Linux 虚拟机，容器共享的是<strong>那台 Linux VM 的内核</strong>，而不是 Windows 内核。</p>',
        },
      ],
    },

    /* ============ 第 2 课 ============ */
    {
      id: 'm10-l02',
      title: '常用命令与多阶段 Dockerfile',
      minutes: 35,
      goal: '掌握 docker 日常命令，并能为「待办清单 API」写一个多阶段 Dockerfile，构建出可运行的镜像。',
      sections: [
        {
          type: 'text',
          html:
            '<p>这一课分两半：前半是<strong>命令速查</strong>（够用就行，不背，用到就查），后半是<strong>写 Dockerfile</strong>，把你的待办清单 API 变成一个镜像。</p>' +
            '<p>为什么对 Spring Boot 要用<strong>多阶段构建</strong>？因为构建和运行需要的东西完全不同：构建时需要 Maven 和完整 JDK，运行的时候只需要一个 JRE 和那个 jar。不做多阶段，Maven、源码、构建缓存全被打进镜像，体积轻松 700MB 起。</p>',
        },
        {
          type: 'table',
          title: 'Docker 常用命令速查',
          head: ['命令', '作用', '类比'],
          rows: [
            ['docker version / info', '看客户端与引擎版本、总体配置', 'npm -v'],
            ['docker pull 镜像名:标签', '从仓库拉镜像', 'npm install 包名'],
            ['docker images', '看本地有哪些镜像', '看 node_modules'],
            ['docker build -t 名字:标签 .', '用当前目录的 Dockerfile 构建镜像', 'npm run build'],
            ['docker run [参数] 镜像', '创建并启动一个容器', 'node server.js'],
            ['docker ps / docker ps -a', '看运行中 / 所有容器', '看进程列表'],
            ['docker logs -f 容器', '实时看日志', 'tail -f app.log'],
            ['docker exec -it 容器 bash', '进入容器内部执行命令', 'ssh 进服务器'],
            ['docker stop / start 容器', '停 / 启动已有容器', 'Ctrl+C / 重新执行'],
            ['docker rm 容器', '删除容器（容器内的数据一并没了）', 'rm -rf'],
            ['docker rmi 镜像', '删除镜像', '删除构建产物'],
            ['docker system prune -a', '清理无用容器/网络/镜像（谨慎）', 'rimraf node_modules'],
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'Windows · docker run 参数详解',
          code: `REM 最完整的开发期用法（本项目的待办清单 API）
docker run -d ^
  --name todo-api ^
  -p 8080:8080 ^
  -e SPRING_PROFILES_ACTIVE=prod ^
  -e MYSQL_HOST=mysql ^
  -v D:\\data\\todo-logs:/app/logs ^
  todo-api:1.0

REM 参数含义
REM   -d              后台运行（detached）
REM   --name todo-api 给容器起名，之后 stop/logs/exec 都用它
REM   -p 8080:8080    宿主机 8080 -> 容器 8080，不写就访问不到
REM   -e KEY=VALUE    给容器塞环境变量，Spring Boot 可直接读 SPRING_ 前缀的变量
REM   -v 主机路径:容器路径  挂载目录，容器删除后数据仍在
REM   --rm            容器停止后自动删除，适合一次性容器

REM 观察与操作
docker ps                     # 只看运行中的
docker ps -a                  # 含已停止的
docker logs -f todo-api       # 实时日志
docker exec -it todo-api bash # 进容器（镜像有 bash 才有；alpine 用 sh）
docker stop todo-api
docker start todo-api
docker rm todo-api            # 删容器
docker rmi todo-api:1.0       # 删镜像`,
        },
        {
          type: 'code',
          lang: 'dockerfile',
          filename: 'Dockerfile（项目根目录，与 pom.xml 同级）',
          code: `# ---------- 阶段一：构建 ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# 先只拷 pom.xml，让依赖下载单独成层：
# 代码没变时这一层命中缓存，改代码重建会快很多
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ---------- 阶段二：运行 ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

# 只把 jar 从构建阶段搬过来，源码和 Maven 都不进最终镜像
COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080
ENV TZ=Asia/Shanghai
# 用 sh -c 才能让 JVM 展开 $JAVA_OPTS 这类环境变量
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]`,
        },
        {
          type: 'text',
          html:
            '<p><strong>逐行说明几个关键指令：</strong></p>' +
            '<ul>' +
            '<li><code>FROM</code> —— 指定基础镜像，决定了运行时环境。<code>eclipse-temurin:17-jre</code> 是 OpenJDK 官方镜像，只含 JRE，比 <code>17-jdk</code> 小很多。</li>' +
            '<li><code>WORKDIR</code> —— 设置工作目录，后续 <code>RUN</code>/<code>COPY</code>/<code>ENTRYPOINT</code> 都相对于它。</li>' +
            '<li><code>COPY</code> —— 拷贝文件到镜像。<code>COPY --from=build</code> 表示从另一个构建阶段取，这是多阶段构建的关键。</li>' +
            '<li><code>RUN</code> —— 构建时执行的命令（如 <code>mvn package</code>），它的结果会固化到镜像层里。</li>' +
            '<li><code>EXPOSE</code> —— 声明端口，<strong>只是文档性质</strong>，不写也能用，但写上更规范。</li>' +
            '<li><code>ENTRYPOINT</code> —— 容器启动时执行的命令。<code>exec 数组形式</code>（<code>["java","-jar","..."]</code>）信号传递更干净；但要用环境变量就得改成 <code>sh -c "..."</code>。</li>' +
            '</ul>' +
            '<p><strong>分层缓存的规则：</strong>每一层以上一层的哈希为准，一旦某层变了，它之后的层全部重建。所以要把「几乎不变的依赖」放前面、「频繁变化的源码」放后面。</p>',
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '.dockerignore（与 Dockerfile 同级）',
          code: `target/
.git/
.idea/
*.iml
node_modules/
*.log
README.md
.dockerignore
`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'Windows · 构建与运行',
          code: `REM 在 Dockerfile 所在目录执行，最后的 . 是「构建上下文」（当前目录）
docker build -t todo-api:1.0 .

REM 构建成功后看一眼镜像大小（多阶段应该只有 200MB 上下）
docker images todo-api

REM 起一个容器：注意 -p 把端口暴露到 Windows，浏览器直接访问 localhost:8080
docker run -d --name todo-api -p 8080:8080 todo-api:1.0

REM 验证接口
curl http://localhost:8080/api/todos

REM 看日志确认启动成功（重点看有没有 Started TodoApplication）
docker logs -f todo-api

REM 改了代码要重新部署？标准三步
docker stop todo-api
docker rm todo-api
docker build -t todo-api:1.1 .
docker run -d --name todo-api -p 8080:8080 todo-api:1.1`,
        },
        {
          type: 'diagram',
          caption: '多阶段构建：只有 jar 被搬进最终镜像',
          svg: SVG_IMAGE_LAYERS,
        },
        {
          type: 'warn',
          html:
            '<p><strong>坑 1：镜像体积失控。</strong>不用多阶段构建，或者把 <code>target/</code>、<code>.git/</code> 打进构建上下文，镜像轻松 700MB+。写 <code>.dockerignore</code> 能显著减小体积并加速构建。</p>' +
            '<p><strong>坑 2：容器一起来就退出。</strong><code>docker ps</code> 一看不在列表里。用 <code>docker ps -a</code> + <code>docker logs &lt;容器名&gt;</code> 看报错。常见原因：配置文件路径不对、数据库连不上、端口被占用、<code>ENTRYPOINT</code> 写错导致主进程立刻结束。</p>' +
            '<p><strong>坑 3：容器起不来，报 <code>address already in use</code>。</strong>宿主机的 8080 已经被占用（很可能是你本地还开着 IDEA 里那个实例）。换个端口：<code>-p 9090:8080</code>，或者先把占用的进程关掉。</p>' +
            '<p><strong>坑 4：Windows 上从记事本抄的 shell 脚本进容器报 <code>\\r: command not found</code>。</strong>CRLF 换行符问题。Dockerfile 与脚本统一用 LF，编辑器右下角可切换行尾格式。</p>' +
            '<p><strong>坑 5：<code>docker build</code> 时依赖下载卡住。</strong>国内网络拉 Maven 依赖慢。可以在 <code>RUN mvn</code> 前加一行 <code>RUN mvn -B -q dependency:go-offline</code> 单独缓存依赖层，或配置国内镜像源。</p>',
        },
        {
          type: 'tip',
          html:
            '<p><strong>为什么镜像里要用 <code>eclipse-temurin:17-jre</code> 而不是本机装的 JDK？</strong>因为这正是 Docker 解决「环境不一致」的精髓：你的镜像里那份 JDK/JRE 版本<strong>由 Dockerfile 精确锁定</strong>，别人拉到的镜像跑出来的行为和你的电脑完全一样，不受对方装的是 JDK 8 还是 21 影响。</p>' +
            '<p><strong>本课产出物检查清单：</strong>① 写出多阶段 Dockerfile 并成功 <code>docker build</code>；② <code>docker images</code> 里镜像体积明显小于单阶段版本；③ <code>docker run -p 8080:8080</code> 后 curl 能通接口；④ 能用 <code>docker logs</code> 与 <code>docker exec</code> 排查问题。</p>',
        },
      ],
      quiz: [
        {
          q: 'docker run -d -p 8080:8080 todo-api:1.0 中，-p 8080:8080 的含义是？',
          options: [
            '把容器的 8080 端口映射到宿主机的 8080 端口',
            '指定容器内部监听的端口为 8080',
            '给容器分配 8080 的内存',
            '设置容器名与端口的关系标签',
          ],
          answer: 0,
          explain:
            '<p>格式是 -p 宿主机端口:容器端口。宿主机端口可以随便换（-p 9090:8080 就映射到宿主机的 9090），容器端口则要和 EXPOSE 及应用实际监听的一致。</p>',
        },
        {
          q: 'Spring Boot 项目用多阶段构建的主要目的是？',
          options: [
            '让镜像支持更多架构',
            '最终镜像只保留 jar 与 JRE，不含 Maven 和源码，体积大幅缩小',
            '加快 docker pull 的速度',
            '让容器能同时跑两个应用',
          ],
          answer: 1,
          explain:
            '<p>构建阶段用 maven + JDK 打 jar，运行阶段只用 JRE 再把 jar 搬过来。这样镜像从 700MB+ 降到 200MB 上下，也减少了攻击面。</p>',
        },
        {
          q: 'docker build 之后容器「一启动就退出」，正确的排查顺序是？',
          options: [
            '直接重装 Docker Desktop',
            'docker ps -a 找到容器，再 docker logs 看具体报错',
            '把 Dockerfile 全部删掉重写',
            'docker system prune -a 清空所有数据',
          ],
          answer: 1,
          explain:
            '<p>容器退出后仍在 docker ps -a 里能看到。docker logs 是最直接的排查入口，常见原因是配置错误、依赖服务连不上或 ENTRYPOINT 写错。</p>',
        },
      ],
    },

    /* ============ 第 3 课 ============ */
    {
      id: 'm10-l03',
      title: 'docker-compose 一键部署全家桶',
      minutes: 35,
      goal: '用一份 docker-compose.yml 同时编排应用、MySQL、Redis 三服务，掌握数据卷持久化与服务名寻址，并用 curl 验证接口。',
      sections: [
        {
          type: 'text',
          html:
            '<p>一个真实的后端项目跑起来至少要三样东西：应用进程、MySQL、Redis。手工起是三条命令，起顺序还得记住，挂了还得一个个收拾。</p>' +
            '<p><strong>Docker Compose</strong> 就是一份 <code>docker-compose.yml</code> 声明式清单：你写「我要这三个服务、这样连、这样挂载」，一条 <code>docker compose up -d</code> 全部拉起，一条 <code>docker compose down</code> 全部销毁。</p>' +
            '<p>这份文件就是<strong>项目的部署说明书</strong>，新人 clone 下来照着跑一条命令就能起环境——这正是「环境一致」真正落地的地方。</p>',
        },
        {
          type: 'code',
          lang: 'yaml',
          filename: 'docker-compose.yml',
          code: `services:
  # ---- 应用（用本地 Dockerfile 构建） ----
  app:
    build: .
    image: todo-api:1.0
    container_name: todo-api
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/todo_db?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf8mb4
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: root123
      SPRING_DATA_REDIS_HOST: redis
      SPRING_DATA_REDIS_PORT: 6379
      TZ: Asia/Shanghai

  # ---- MySQL 8 ----
  mysql:
    image: mysql:8
    container_name: todo-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: todo_db         # 容器首次启动时自动建这个库（与 m05 建的库名保持一致）
      TZ: Asia/Shanghai
    ports:
      - "3306:3306"   # 本机已装 MySQL 8 会冲突：左侧改成 "3307:3306" 即可；生产环境不要把 3306 暴露到宿主机
    volumes:
      - mysql-data:/var/lib/mysql   # 具名卷：容器删了数据还在
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1", "-uroot", "-proot123"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  # ---- Redis 7 ----
  redis:
    image: redis:7
    container_name: todo-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  mysql-data:      # 具名卷声明（建议显式写出来）
  redis-data:`,
        },
        {
          type: 'code',
          lang: 'yaml',
          filename: 'application-prod.yml（配合 compose，被环境变量覆盖的部分可省）',
          code: `# 用环境变量注入，默认值给本地开发用；compose 里给了 SPRING_* 环境变量时会覆盖
spring:
  datasource:
    url: \${SPRING_DATASOURCE_URL:jdbc:mysql://localhost:3306/todo_db?serverTimezone=Asia/Shanghai}
    username: \${SPRING_DATASOURCE_USERNAME:root}
    password: \${SPRING_DATASOURCE_PASSWORD:root123}
  data:
    redis:
      host: \${SPRING_DATA_REDIS_HOST:localhost}
      port: \${SPRING_DATA_REDIS_PORT:6379}`,
        },
        {
          type: 'steps',
          title: '一次完整的 compose 部署流程',
          items: [
            '在项目根目录（与 Dockerfile 同级）创建 docker-compose.yml',
            '构建并启动全部服务：<code>docker compose up -d --build</code>',
            '看状态：<code>docker compose ps</code>，三个服务都应该是 Up/healthy',
            '看应用日志：<code>docker compose logs -f app</code>，等出现 Started TodoApplication',
            '验证接口：<code>curl http://localhost:8080/api/todos</code>',
            '进 MySQL 确认表和数据：<code>docker compose exec mysql mysql -uroot -proot123 -e "use todo_db; show tables;"</code>',
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'Windows · compose 常用命令',
          code: `# 启动（-d 后台；--build 顺便重新构建镜像）
docker compose up -d --build

# 只重启应用（改了代码后最常用）
docker compose up -d --build app
docker compose restart app

# 看状态 / 日志 / 资源占用
docker compose ps
docker compose logs -f app
docker compose top

# 进某个容器执行命令
docker compose exec mysql mysql -uroot -proot123 -e "use todo_db; select * from todo_list;"
docker compose exec redis redis-cli

# 下线（容器和默认网络都删掉，具名卷保留）
docker compose down

# 连数据卷一起彻底删除（会丢数据，慎用）
docker compose down -v`,
        },
        {
          type: 'diagram',
          caption: 'compose 三容器拓扑：服务名即内网 hostname，数据卷负责持久化',
          svg: SVG_COMPOSE_TOPOLOGY,
        },
        {
          type: 'table',
          title: 'compose 关键字段速查',
          head: ['字段', '作用', '常见错误'],
          rows: [
            ['image', '指定使用哪个镜像（本地已有或从仓库拉）', '拼错镜像名导致拉不到'],
            ['build', '用当前目录的 Dockerfile 构建镜像；写成 <code>build: .</code>', '路径写错导致找不到 Dockerfile'],
            ['ports', '宿主机端口:容器端口', '漏写导致外部访问不到；端口冲突启动失败'],
            ['environment', '给容器注入环境变量', '变量名写错，Spring Boot 读不到'],
            ['depends_on', '只保证<strong>启动顺序</strong>，不保证"就绪"', '误以为它会等到数据库能连才启动 app'],
            ['volumes', '挂载数据卷（具名卷或宿主机目录）', '不写则容器删除后数据全丢'],
            ['restart', '重启策略，如 unless-stopped', '不写则宿主机重启后容器不会自启'],
            ['healthcheck', '定义健康检查，配合 condition 使用', '命令写错导致一直 unhealthy'],
          ],
        },
        {
          type: 'warn',
          html:
            '<p><strong>坑 1：容器里连不上数据库，报 Communications link failure。</strong>最常见的原因是地址写成了 <code>localhost</code>——在容器里，<code>localhost</code> 指的是<strong>容器自己</strong>，不是宿主机，也不是别的容器。解法：compose 里同网络的服务用<strong>服务名</strong>互访（<code>jdbc:mysql://mysql:3306/todo_db</code>）。若确实要连宿主机的服务，Windows/Mac 用 <code>host.docker.internal</code>，Linux 需要额外配置 <code>--add-host=host.docker.internal:host-gateway</code>。</p>' +
            '<p><strong>坑 2：<code>depends_on</code> 写得再对也会偶发连不上。</strong>它只保证「启动顺序」，不保证「MySQL 已初始化完毕」。上面的 compose 已经用 <code>healthcheck</code> + <code>condition: service_healthy</code> 解决；入门阶段更简单的兜底是<strong>给应用配置连接重试</strong>，或启动失败后 <code>docker compose restart app</code> 一次。</p>' +
            '<p><strong>坑 3：<code>docker compose down</code> 之后数据没了。</strong>如果数据没有挂载到卷，容器删除即数据删除。带卷的容器删除时会提示「包含数据卷」并询问；写卷声明的 <code>volumes:</code> 块能让 compose 正确管理它。</p>' +
            '<p><strong>坑 4：YAML 里缩进用错。</strong>compose 文件对空格敏感，禁止 Tab。缩进层级错了不会提示，只会报「找不到 service xxx」。</p>',
        },
        {
          type: 'compare',
          title: '手工部署（m08/m09） vs compose 部署（m10）',
          head: ['环节', '手工部署', 'compose 部署'],
          rows: [
            ['装 JDK / Maven', '每台机器手动装，还要配环境变量', '写进 Dockerfile，换机器不用装'],
            ['装 MySQL / Redis', '手动安装、配密码、开服务', '一条 services 声明，自动拉起'],
            ['配置数据库地址', '改 application-prod.yml', 'compose 的 environment 注入，不改代码'],
            ['启动 / 更新', 'ssh 上去 kill 进程再重启', 'docker compose up -d --build app'],
            ['换一台机器', '从头再来一遍', '拷贝仓库 + 一条 up'],
            ['数据持久化', '依赖数据库自身的数据目录配置', 'volumes 声明，重建容器不丢数据'],
          ],
        },
        {
          type: 'tip',
          html:
            '<p><strong>贯穿项目收官。</strong>回望这一路：m04 建了第一个能 curl 通的接口，m05 建了表，m06 接了 MyBatis-Plus，m07 重构成三层架构，m08 打成了 jar 部署上服务器，m09 加了 Redis 缓存，m10 用一条 <code>docker compose up -d</code> 把应用 + MySQL + Redis 全部拉起。回到 m09 的那条预告——「手工装环境那一整套，现在被压缩成了一条命令」，到这里算是真正闭环了。</p>' +
            '<p><strong>接下来可以往外延伸的方向</strong>（本课程不展开，但知道有这些东西在就行）：镜像推私有仓库（Harbor）、用 CI 自动构建测试（GitHub Actions）、多机编排（K8s）。前端工程师掌握到「能把一个 Spring Boot 项目用 Docker 打包并一键部署」这个程度，已经足够应付绝大多数中小项目。</p>' +
            '<p><strong>本课产出物检查清单：</strong>① 写出三服务 compose 文件并 <code>docker compose up -d</code> 成功；② <code>docker compose ps</code> 三个服务都健康；③ curl 接口通；④ 重启 Docker Desktop 后数据仍在（验证数据卷生效）。</p>',
        },
      ],
      quiz: [
        {
          q: '应用容器要连同一个 compose 里的 MySQL，连接地址应该写？',
          options: ['jdbc:mysql://localhost:3306/todo_db', 'jdbc:mysql://127.0.0.1:3306/todo_db', 'jdbc:mysql://mysql:3306/todo_db', 'jdbc:mysql://host.docker.internal:3306/todo_db'],
          answer: 2,
          explain:
            '<p>同一 compose 网络内，服务名就是各容器的 hostname。localhost/127.0.0.1 指向容器自己；host.docker.internal 指向宿主机，不该用它连同网络的兄弟服务。</p>',
        },
        {
          q: 'MySQL 容器删除后数据丢失，问题出在哪？',
          options: [
            '没有把数据挂载到 volumes（如 -v mysql-data:/var/lib/mysql）',
            'compose 文件里没写 restart 策略',
            '用的镜像版本太老',
            'depends_on 写得不对',
          ],
          answer: 0,
          explain:
            '<p>容器文件系统是临时的，只有挂载到数据卷（具名卷或宿主机目录）的数据才能在容器删除后保留。MySQL 数据目录是 /var/lib/mysql。</p>',
        },
        {
          q: '关于 depends_on 的说法，正确的是？',
          options: [
            '它会等 MySQL 完全初始化完成后才启动 app',
            '它只保证启动顺序，不保证依赖服务已就绪，需要 healthcheck 配合',
            '它可以替代应用侧的数据库连接重试',
            '写上它就不会再出现 Communications link failure',
          ],
          answer: 1,
          explain:
            '<p>depends_on 只保证容器启动顺序。数据库进程起来了不代表能接受连接，要用 healthcheck + condition: service_healthy，或应用侧配置连接重试。</p>',
        },
      ],
    },

    /* ============ 第 4 课 避坑清单 ============ */
    {
      id: 'm10-l04',
      title: '避坑清单：Docker 环境事故 Top 6',
      minutes: 30,
      goal: '收拢 Docker 日常最高频的 6 类故障：镜像拉取失败、容器秒退、日志膨胀、容器时区、内存超限被杀、磁盘被镜像堆满。学完这一课，Docker Desktop 的红色报错不再吓人。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>前面三课讲的是「怎么用」，这一课讲「环境不配合怎么办」。Docker 的事故有个特点：<strong>和你的代码完全无关</strong>——镜像、网络、磁盘、时区，全是基础设施层的坑，但会以「我的接口不通了」的形式呈现在你面前。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 1：docker pull 超时 / TLS handshake timeout。</strong>国内直连 Docker Hub 基本不通，第一修法是配镜像加速器。注意一个反直觉的机制：<strong>registry-mirrors 是「优先尝试」不是强制代理</strong>——加速器上没有的镜像（比如你写错了名字）会自动回退去官方源，然后超时报错，看起来像「配置没生效」。</p>`,
        },
        {
          type: 'code',
          lang: 'json',
          filename: 'daemon.json（Linux 全局；Windows/Mac 在 Docker Desktop 设置 → Docker Engine 里改）',
          code: `{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.net"
  ],
  "log-driver": "json-file",
  "log-opts": { "max-size": "50m", "max-file": "3" }
}

// 改完重启 Docker，验证配置加载：
// docker info | grep -A 5 "Registry Mirrors"
//
// 排查口诀：拉取失败先 docker info 看 mirrors 是否生效 → 再看镜像名/标签拼错没有
// （manifest unknown 404 = 名字错或该镜像真不存在，加速器没问题）`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 2：容器起来几秒就 Exited。</strong>新手第一懵：run 明明成功，docker ps 里却看不到。先 <code>docker ps -a</code> 找到它看状态（Exited (0) 正常退出 / Exited (1) 报错退出），再 <code>docker logs 容器名</code> 看临终日志。最常见的根因：<strong>容器的 1 号进程退出了</strong>——容器和虚拟机不同，主进程停 = 容器停：</p>`,
        },
        {
          type: 'code',
          lang: 'dockerfile',
          filename: '秒退对照',
          code: `# 反面教材：CMD 跑完就退，容器跟着退
FROM ubuntu
CMD echo "hello"                      # 打印完主进程结束 → Exited (0)

# 反面教材 2：脚本里最后启动了后台进程，脚本本身退出
# CMD start.sh && sleep 1             # start.sh 拉起 java 后退出 → 容器跟着退

# 正面写法：主进程必须前台常驻（Spring Boot 的 jar 天然前台，没问题）
FROM eclipse-temurin:17-jre
COPY app.jar /app.jar
CMD ["java", "-jar", "/app.jar"]      # java 进程常驻 → 容器常驻

# 需要跑一次性脚本又想保持容器？不推荐 tail -f /dev/null 占位（假常驻），
# 应该想清楚「这个容器的主进程是什么」`,
        },
        {
          type: 'diagram',
          caption: '容器生命周期 = 1 号进程的生命周期：echo 跑完即退容器即停；java -jar 常驻则容器常驻',
          svg: String.raw`<svg viewBox="0 0 680 320" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m10-life" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#94A3B8"/>
    </marker>
    <marker id="arr-m10-dead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#EF4444"/>
    </marker>
    <marker id="arr-m10-alive" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#10B981"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="320" rx="12" fill="#0F1B2D"/>
  <text x="340" y="32" text-anchor="middle" font-size="16" fill="#E2E8F0">容器 = 一个被隔离的进程：1 号进程死，容器就死</text>

  <text x="170" y="64" text-anchor="middle" font-size="13" fill="#F87171">✗ Exited (0)：主进程跑完了</text>
  <rect x="30" y="76" width="280" height="150" rx="12" fill="#1B2A44" stroke="#EF4444" stroke-width="1.4"/>
  <text x="170" y="100" text-anchor="middle" font-size="11.5" fill="#94A3B8">docker run ubuntu CMD echo hello</text>
  <rect x="50" y="114" width="240" height="26" rx="6" fill="#2A3B5C" stroke="#475569"/>
  <text x="170" y="131" text-anchor="middle" font-size="11" fill="#E2E8F0">PID 1 = echo "hello"</text>
  <line x1="170" y1="140" x2="170" y2="164" stroke="#EF4444" stroke-width="1.8" marker-end="url(#arr-m10-dead)"/>
  <text x="170" y="158" text-anchor="middle" font-size="10" fill="#FCA5A5">打印完 → 进程结束</text>
  <rect x="50" y="168" width="240" height="24" rx="6" fill="#2A1620" stroke="#EF4444"/>
  <text x="170" y="184" text-anchor="middle" font-size="11" fill="#F87171">容器状态：Exited (0)</text>
  <text x="170" y="210" text-anchor="middle" font-size="10.5" fill="#94A3B8">这不是崩溃，是它「工作完成了」</text>

  <text x="510" y="64" text-anchor="middle" font-size="13" fill="#6EE7B7">✓ Up (healthy)：主进程常驻</text>
  <rect x="370" y="76" width="280" height="150" rx="12" fill="#1B2A44" stroke="#10B981" stroke-width="1.4"/>
  <text x="510" y="100" text-anchor="middle" font-size="11.5" fill="#94A3B8">CMD ["java", "-jar", "app.jar"]</text>
  <rect x="390" y="114" width="240" height="26" rx="6" fill="#12261E" stroke="#10B981"/>
  <text x="510" y="131" text-anchor="middle" font-size="11" fill="#6EE7B7">PID 1 = java 进程（前台常驻）</text>
  <line x1="510" y1="140" x2="510" y2="164" stroke="#10B981" stroke-width="1.8" marker-end="url(#arr-m10-alive)"/>
  <text x="510" y="158" text-anchor="middle" font-size="10" fill="#6EE7B7">一直监听 8080 端口</text>
  <rect x="390" y="168" width="240" height="24" rx="6" fill="#12261E" stroke="#10B981"/>
  <text x="510" y="184" text-anchor="middle" font-size="11" fill="#6EE7B7">容器状态：Up / healthy</text>
  <text x="510" y="210" text-anchor="middle" font-size="10.5" fill="#94A3B8">docker logs / exec 随时查看</text>

  <rect x="30" y="244" width="620" height="60" rx="10" fill="#16223A" stroke="#3B82F6" stroke-width="1"/>
  <text x="48" y="266" font-size="12" fill="#93C5FD">排查口诀：docker ps -a 找状态 → Exited (0) 主进程自然结束 / Exited (1) 报错退出 / Exited (137) 被 OOM 杀</text>
  <text x="48" y="284" font-size="11.5" fill="#94A3B8">再 docker logs 容器名 看临终日志。前端对照：node 脚本跑完自动退出 CLI——容器把「进程退出」升级成了生命周期事件</text>
</svg>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 3：日志膨胀，磁盘悄悄被吃光。</strong>容器的 stdout/stderr 默认全部存进 json-file，且<strong>无上限</strong>。Spring Boot 服务跑几个月，一个容器几十 GB 日志直接把服务器磁盘打爆（表现：数据库写不进、系统命令都卡）。修法就是坑 1 配置里的 <code>log-opts</code>：max-size 50m、max-file 3——单容器日志最多 150MB 自动轮转。<strong>注意：log-opts 只对新容器生效</strong>，改完配置要重建容器。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 4：容器时间差 8 小时。</strong>容器内默认 UTC，日志里的时间、MySQL 里的时间戳全部慢 8 小时，和宿主机对不上。修法是给容器声明时区环境变量（compose 统一加）：</p>`,
        },
        {
          type: 'code',
          lang: 'yaml',
          filename: 'docker-compose.yml 时区片段',
          code: `services:
  app:
    environment:
      - TZ=Asia/Shanghai              # 容器内系统时区
      - JAVA_TOOL_OPTIONS=-Duser.timezone=Asia/Shanghai   # JVM 兜底
  mysql:
    image: mysql:8.0
    environment:
      - TZ=Asia/Shanghai
      - MYSQL_ROOT_PASSWORD=root123
    command: --default-time-zone=+08:00    # MySQL 内部时区也要对齐
  redis:
    image: redis:7-alpine
    environment:
      - TZ=Asia/Shanghai`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 5：容器内存超限被杀（exit 137）。</strong>容器被 OOM Kill 的标志是退出码 137。起因：<strong>JVM 默认按宿主机内存估算堆大小</strong>（老版本 Java），宿主机 16G，JVM 默认敢要 4G，你给容器 --memory=512m，内核直接杀。现代 JDK 17 已能感知 cgroup 限制，但<strong>显式声明依然是纪律</strong>：</p>`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '内存限制',
          code: `# 运行时限制 + JVM 参数对齐
docker run -m 512m --memory-swap 512m \\
  -e JAVA_TOOL_OPTIONS="-Xmx384m -Xms384m" \\
  todo-api:1.0.0

# compose 等价写法
# services:
#   app:
#     deploy:
#       resources:
#         limits:
#           memory: 512M

# 排查被杀的容器：docker inspect 容器名 | grep -i oom
# "OOMKilled": true 就是它`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 6：磁盘被镜像和悬空层堆满。</strong>反复构建镜像后，旧镜像、悬空层、停掉的容器、无主的数据卷越积越多。<code>docker system df</code> 看占用，然后定期清理：</p>`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '磁盘清理（先看再删）',
          code: `docker system df            # 镜像 / 容器 / 卷 / 缓存各占多少

# 清理已停止容器 + 悬空镜像 + 无用网络（安全，不动数据卷）
docker system prune

# 连未使用的镜像一起清（注意：会删掉「没有容器在用」的镜像，下次要重新 pull）
docker system prune -a

# 数据卷默认不动（里面是 MySQL 数据！）。确认没用的卷再手动删：
docker volume prune         # 只删「没有容器挂载」的卷——也可能有数据，看清列表再 y`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>volume prune 的高危提醒：</strong>「未被容器挂载」不等于「没数据」——停用状态的 MySQL 卷也在其中。生产机器上执行前先 <code>docker volume ls</code> 看清名单，或者干脆只在开发机上 prune。</p>`,
        },
        {
          type: 'table',
          title: 'Docker 故障速查表',
          head: ['现象 / 报错', '第一嫌疑', '修法'],
          rows: [
            ['pull 超时 / TLS handshake timeout', '没配加速器或镜像名写错', 'docker info 查 mirrors；核对镜像名；加速器是「优先尝试」'],
            ['容器 Exited，ps 里看不到', '主进程退出', 'docker logs 看临终日志；CMD 保持前台常驻'],
            ['磁盘神秘缩水', 'json-file 日志无上限', 'log-opts max-size/max-file（只对新容器生效）'],
            ['日志/数据时间差 8 小时', '容器默认 UTC', 'TZ=Asia/Shanghai + JVM 与 MySQL 时区对齐'],
            ['容器退出码 137', '超内存被 OOM Kill', '-m 限制 + JVM -Xmx 显式对齐'],
            ['docker 命令变慢 / 写入失败', '磁盘被镜像层占满', 'docker system df + prune（卷要慎删）'],
          ],
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>对照前端记忆：</strong>镜像加速 ≈ npm 的 registry 镜像（.npmrc），但 Docker 的 mirrors 是「先试后回退」；容器秒退 ≈ node 脚本执行完 CLI 自动退出，区别是容器把「进程退出」提升为生命周期事件；日志膨胀 ≈ 没做日志切割的 winston/PM2；OOM Kill ≈ Chrome 标签页被内存压力干掉，只是这次没有「恢复标签页」按钮。<strong>Docker 的一切故障都值得先看 docker logs 和 docker inspect，它们是容器的黑匣子。</strong></p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>配好镜像加速并 docker info 验证生效。</li>
<li>自己的 compose 模板带上 TZ、log-opts、memory limits 三件套。</li>
<li>体验一次 docker system prune 前后 docker system df 的对比。</li></ul>
<p>十个模块全部完成——从 IDEA 到 Docker，你已经把一条完整后端交付链路走通了。回头看 m01 的第一课，会有点不可思议。</p>`,
        },
      ],
      quiz: [
        {
          q: 'docker pull 一直超时，docker info 显示 Registry Mirrors 为空。下一步是？',
          options: [
            '重装 Docker',
            '在 daemon.json（或 Docker Desktop 设置）配 registry-mirrors 后重启 Docker 再验证',
            '换 5G 网络重试',
            '把镜像名改成小写',
          ],
          answer: 1,
          explain:
            '国内直连 Docker Hub 基本不通，配国内加速器是标准修法。注意 mirrors 是「优先尝试」不是强制代理——拉取仍失败时要检查镜像名/标签是否真实存在。',
        },
        {
          q: '容器 run 成功但几秒后 Exited (0)，最可能的根因是？',
          options: [
            '镜像太大',
            'CMD 执行的是会结束的命令，容器主进程退出等于容器退出',
            '端口没映射',
            '没有挂载数据卷',
          ],
          answer: 1,
          explain:
            'Docker 容器的生命周期跟随 1 号主进程。echo 打印完就退、脚本把服务放后台后自己退出，都会让容器跟着退。修法是保持主进程前台常驻（java -jar 天然满足）。',
        },
        {
          q: '容器退出码 137，docker inspect 显示 "OOMKilled": true。正确处理是？',
          options: [
            '重启宿主机',
            '给容器 -m 上限，并把 JVM -Xmx 显式设置到限额以内（如 512m 容器配 384m 堆）',
            '把应用代码里的内存泄漏修掉再说',
            '加 swap 到 8G',
          ],
          answer: 1,
          explain:
            '137 = 128+9（SIGKILL），是内核 OOM Killer 干的。JVM 老版本按宿主机内存估堆，容器限额小于默认堆就被杀。显式 -m + -Xmx 对齐是纪律；JDK 17 已能感知 cgroup，但显式声明更稳。',
        },
        {
          q: '关于容器日志管理，说法错误的是？',
          options: [
            'json-file 驱动默认无上限，服务跑久了能把磁盘吃满',
            'log-opts 的 max-size / max-file 可以限制单容器日志总量',
            '改完 daemon.json 的 log-opts 后，正在运行的容器立即生效',
            'docker system df 可以看镜像、容器、卷、缓存的磁盘占用',
          ],
          answer: 2,
          explain:
            'log-opts 只在容器创建时读取——改配置后必须重建容器（compose down && up）才生效。这一条是「改了配置怎么没效果」的经典来源。',
        },
      ],
    },
  ],
};

export default module;