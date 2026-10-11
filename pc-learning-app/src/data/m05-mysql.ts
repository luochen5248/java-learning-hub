import type { RawModule } from '../types/course'

/**
 * m05 · MySQL 数据库（5 课）
 *
 * 面向 Vue3 + TS 前端工程师，环境基线：MySQL 8 + Windows 11 + IDEA 2024.2.4
 * 贯穿项目「待办清单 API」：本模块负责建库建表，表名统一 todo_list。
 * 数据格式严格遵循 plan.md §4（section 类型）与 §5（SVG 图解规范）。
 */

export const module: RawModule = {
  id: 'm05',
  order: 5,
  title: 'MySQL 数据库',
  subtitle: '建库建表、SQL 查询与索引入门',
  phase: 'phase2',
  phaseName: '阶段二 · 写出完整后端',
  icon: '🗄',
  cover: 'assets/img/m05-mysql.jpg',
  minutes: 185,
  summary:
    '后端和前端最大的区别之一：数据要落在另一台（或另一个进程里的）存储服务上。本模块从零装好 MySQL 8，建出贯穿全书的 todo_list 表，手写增删改查与 JOIN 查询，最后用 EXPLAIN 看懂「这条 SQL 为什么慢」——这是数据库入门的真正门槛。收尾的避坑清单课讲清隐式转换索引失效、utf8mb4、深分页这些线上高频事故。',

  flashcards: [
    { front: '建库时字符集怎么写才对？', back: '建库用 CHARACTER SET utf8mb4；MySQL 自带的 utf8 存不了 emoji。', tag: '命令' },
    { front: '待办表主键的标准写法？', back: 'id BIGINT PRIMARY KEY AUTO_INCREMENT；分布式再考虑雪花算法。', tag: '语法' },
    { front: '改数据前的安全工作流是什么？', back: '先 SELECT 验证 WHERE 命中行数，确认后再改成 UPDATE / DELETE。', tag: '坑点' },
    { front: 'LIMIT 分页怎么算偏移量？', back: 'LIMIT offset, size；第 2 页每页 10 条 → LIMIT 10, 10。', tag: '语法' },
    { front: 'INNER JOIN 和 LEFT JOIN 的区别？', back: 'INNER 只保留两边都匹配上的行；LEFT 保留左表全部行，右表没匹配上的列补 NULL。', tag: '语法' },
    { front: '怎么判断某个字段是 NULL？', back: '用 IS NULL / IS NOT NULL。NULL 参与任何 = 比较都不成立，写 = NULL 永远查不到。', tag: '坑点' },
    { front: 'COUNT(*) 和 COUNT(列名) 有什么不同？', back: 'COUNT(*) 数行数；COUNT(列) 会跳过该列为 NULL 的行，所以结果可能更小。', tag: '语法' },
    { front: 'WHERE 和 HAVING 的分工？', back: 'WHERE 在分组前过滤行（不能用聚合函数）；HAVING 在分组后过滤分组（可以用 COUNT 等）。', tag: '语法' },
    { front: 'EXPLAIN 里 type 从差到好大致怎么排？', back: 'ALL < index < range < ref < eq_ref < const；ALL 且 rows 大要加索引。', tag: '坑点' },
    { front: '联合索引 (a,b,c) 的最左前缀原则？', back: '查询条件从最左列开始连续匹配才生效：a、a+b、a+b+c 都行；直接查 b 或 c 则索引失效。', tag: '语法' },
    { front: 'phone 是 varchar，WHERE phone = 13800000000 会怎样？', back: '隐式类型转换：把整列转成数字再比，索引直接失效全表扫描。字符串列的值必须加引号。', tag: '坑点' },
    { front: '翻到第 10 万页为什么巨慢？', back: 'LIMIT 1000000,20 要先扫过前 100 万行再丢弃。改用「上一页最大 id」做游标：WHERE id > 上次末尾 LIMIT 20。', tag: '坑点' },
    { front: 'UPDATE 误伤全表怎么防？', back: '开启安全更新模式 SET sql_safe_updates = 1，UPDATE/DELETE 不带 WHERE（或非索引条件）直接报错。', tag: '坑点' },
  ],

  lessons: [
    /* ============================ m05-l01 ============================ */
    {
      id: 'm05-l01',
      title: '安装 MySQL 8 与三种客户端',
      minutes: 30,
      goal: '在 Windows 上装好 MySQL 8，能用命令行登录，并知道有哪些客户端可以用。',
      sections: [
        {
          type: 'fe',
          html: '<p>你在前端存数据用 <code>localStorage</code>、<code>IndexedDB</code>，或者干脆把状态放在 Pinia 里——它们都跑在浏览器进程内。数据库不一样：<strong>它是一个独立的服务进程</strong>，你的后端程序通过网络（默认 3306 端口）把 SQL 语句发过去，它算完再把结果集发回来。</p><p>所以「连数据库」本质是<strong>跨进程通信</strong>：类比你用 axios 调后端接口，后端用 JDBC 调 MySQL。</p>'
        },
        {
          type: 'text',
          html: '<p>MySQL 是当前 Java 后端最主流的关系型数据库（Oracle 旗下，开源社区版免费）。全书统一使用 <strong>MySQL 8.0</strong>，它和老教程里的 MySQL 5.x 有若干默认行为差异（字符集、ONLY_FULL_GROUP_BY 等），遇到报错别照抄 5.x 时代的答案。</p><p>关系型数据库的核心心智：<strong>数据按「表」组织，一张表就是同一结构的行的集合</strong>。你可以把它粗粒度地理解成一个带类型和约束的二维数组，外加一套声明式查询语言 SQL。</p>'
        },
        {
          type: 'steps',
          title: 'Windows 安装 MySQL 8（官方 Installer）',
          items: [
            '去 MySQL 官网下载 <code>mysql-installer-community-8.0.xx.msi</code>（Windows (x86, 64-bit), MSI Installer），文件约 300MB+，下载不需要登录，点「No thanks, just start my download」即可。',
            '双击安装，选择 <strong>Server only</strong>（只装数据库服务，最省事）或 <strong>Developer Default</strong>（会附带 Workbench 等工具，体积大）。',
            '一路 Next 到 <strong>Type and Networking</strong>：保持 Config Type = Development Computer，端口 <strong>3306</strong>，勾选「Open Windows Firewall port for network access」。',
            '到 <strong>Authentication Method</strong>：选择 <strong>Use Strong Password Encryption</strong>（MySQL 8 默认，也是推荐项）。',
            '设置 root 密码并牢记（建议本地用简单的，如 <code>root1234</code>，别用生产密码）。',
            '到 <strong>Windows Service</strong>：勾选「Configure MySQL Server as a Windows Service」，服务名保持 <code>MySQL80</code>，勾选开机自启可按自己习惯。',
            '点 Execute 执行配置，全部打勾后 Finish，安装完成。'
          ]
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'cmd.exe · 验证安装',
          code: `:: 1. 确认服务已启动（MySQL80 是上一步配置的服务名）
sc query MySQL80

:: 若状态不是 RUNNING，手动启动
net start MySQL80

:: 2. 把 MySQL 的 bin 目录加入系统变量 Path，方便直接用 mysql 命令
::    默认路径是：C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin
::    配完后必须【重开一个命令行窗口】才生效（这一条和配 JAVA_HOME 完全一样）

:: 3. 验证命令解析到哪个可执行文件
where mysql

:: 4. 登录（-p 后面不写密码，回车后再输入，避免密码进历史记录）
mysql -u root -p`
        },
        {
          type: 'code',
          lang: 'sql',
          filename: '连上后先跑这三条',
          code: `-- 看版本，8.0.x 说明装对了
SELECT VERSION();

-- 看当前有哪些库（MySQL 自带的系统库不用管）
SHOW DATABASES;

-- 看当前时间，用来排查后面会遇到的"差 8 小时"问题
SELECT NOW();

-- 退出
exit`
        },
        {
          type: 'warn',
          html: '<p><strong>报错：<code>\'mysql\' 不是内部或外部命令</code></strong> —— Path 没配或没生效。重开终端；用 <code>where mysql</code> 看命中路径；临时方案是写全路径 <code>"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql" -u root -p</code>。</p><p><strong>报错：<code>ERROR 2003 (HY000): Can\'t connect to MySQL server on \'localhost\' (10061)</code></strong> —— 服务没启动。执行 <code>net start MySQL80</code>；或在 <code>services.msc</code> 里找到 MySQL80 手动启动。若服务名不确定，用 <code>sc query type= service state= all | findstr MySQL</code> 查。</p><p><strong>报错：<code>Access denied for user \'root\'@\'localhost\'</code></strong> —— 密码记错了。本地学习环境最省事的办法是重跑 MySQL Installer 选 Reconfigure 重置 root 密码。</p>'
        },
        {
          type: 'table',
          title: '三种客户端怎么选',
          head: ['客户端', '适合做什么', '对前端同学的类比'],
          rows: [
            ['命令行 mysql.exe', '服务器上排错、跑脚本、导数据；没有图形界面', '≈ 终端里敲 curl，直给但不够直观'],
            ['IDEA Database 面板', '日常开发首选：写代码和看数据在一个窗口里，无需切换', '≈ Chrome DevTools 里直接看 Vue 组件的 state'],
            ['MySQL Workbench / DBeaver', '做复杂表结构设计、画 ER 图、导数据', '≈ 独立的 API 调试工具（Postman）'],
          ]
        },
        {
          type: 'diagram',
          caption: '客户端与 MySQL 服务进程的关系：都走 TCP 3306',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m05a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>

  <text x="24" y="38" fill="#E2E8F0" font-size="15" font-weight="600">客户端（只负责发 SQL）</text>
  <text x="428" y="38" fill="#E2E8F0" font-size="15" font-weight="600">服务端（mysqld 进程）</text>

  <rect x="30" y="62" width="190" height="48" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="125" y="83" fill="#E2E8F0" font-size="14" text-anchor="middle">命令行 mysql.exe</text>
  <text x="125" y="101" fill="#94A3B8" font-size="11.5" text-anchor="middle">mysql -u root -p</text>

  <rect x="30" y="140" width="190" height="48" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="125" y="161" fill="#E2E8F0" font-size="14" text-anchor="middle">IDEA Database 面板</text>
  <text x="125" y="179" fill="#94A3B8" font-size="11.5" text-anchor="middle">m05-l05 会用上</text>

  <rect x="30" y="218" width="190" height="48" rx="10" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.5"/>
  <text x="125" y="239" fill="#E2E8F0" font-size="14" text-anchor="middle">Java 应用（JDBC）</text>
  <text x="125" y="257" fill="#94A3B8" font-size="11.5" text-anchor="middle">m06 接入后由它来连</text>

  <path d="M226,86 L336,148" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m05a)"/>
  <path d="M226,164 L336,164" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m05a)"/>
  <path d="M226,242 L336,180" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m05a)"/>
  <text x="250" y="126" fill="#94A3B8" font-size="11">SQL 语句</text>
  <text x="248" y="212" fill="#94A3B8" font-size="11">SQL 语句</text>

  <rect x="340" y="140" width="150" height="48" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.8"/>
  <text x="415" y="161" fill="#E2E8F0" font-size="14" text-anchor="middle">MySQL Server</text>
  <text x="415" y="179" fill="#94A3B8" font-size="11.5" text-anchor="middle">监听 127.0.0.1:3306</text>

  <path d="M494,164 L546,164" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m05a)"/>
  <rect x="550" y="140" width="112" height="48" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.5"/>
  <text x="606" y="161" fill="#E2E8F0" font-size="14" text-anchor="middle">数据文件</text>
  <text x="606" y="179" fill="#94A3B8" font-size="11.5" text-anchor="middle">.ibd（磁盘）</text>

  <path d="M546,180 L494,180" stroke="#64B5F6" stroke-width="1.6" fill="none" stroke-dasharray="5 4" marker-end="url(#arr-m05a)"/>
  <text x="498" y="200" fill="#94A3B8" font-size="11">结果集</text>

  <rect x="30" y="288" width="632" height="46" rx="10" fill="#16233C" stroke="rgba(59,130,246,.35)"/>
  <text x="46" y="308" fill="#94A3B8" font-size="12">关键点：数据库是「另一边的服务」，不是你代码里的一个库文件。</text>
  <text x="46" y="326" fill="#94A3B8" font-size="12">连不上时先分清是「服务没起」「端口不通」还是「账号密码错」，三类报错长得完全不一样。</text>
</svg>`
        },
        {
          type: 'tip',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：m04 你已经用 Spring Boot 写出了 <code>/api/todos</code> 接口，但数据是写死在内存 <code>List</code> 里的——重启就丢。从这一课开始，我们把数据搬到真正存得住的地方：先建库建表（m05-l02~l04），再让 Java 连上它（m06）。</p>'
        },
      ],
      quiz: [
        {
          q: 'MySQL 服务进程与客户端的关系，最接近下面哪个描述？',
          options: [
            'MySQL 是一个 Java 类库，被打包进应用 jar 里一起运行',
            'MySQL 是独立的服务进程，客户端通过网络（默认 3306）把 SQL 发过去执行',
            'MySQL 是浏览器提供的本地存储，和 IndexedDB 一样',
            'MySQL 必须和 Java 应用跑在同一台机器上，不能远程连接'
          ],
          answer: 1,
          explain: 'MySQL 是独立进程（Windows 上是 MySQL80 服务），应用通过 TCP 3306 发送 SQL 再接收结果集，这点决定了「连不上」时要像排查接口一样排查网络与服务状态。'
        },
        {
          q: 'Windows 命令行执行 mysql -u root -p 报 "ERROR 2003 ... (10061)"，最常见的原因是什么？',
          options: [
            'root 密码输错了',
            'MySQL 服务没有启动',
            '字符集不是 utf8mb4',
            '没有创建 todo_db 数据库'
          ],
          answer: 1,
          explain: '10061 是「目标机器积极拒绝」，即端口上没有进程在监听 → 服务没起。执行 net start MySQL80 启动；密码错报的是 Access denied（1045），两者要分清。'
        },
        {
          q: '把 MySQL 的 bin 目录加进 Path 后，命令行仍然提示 "mysql 不是内部或外部命令"，下一步最该做什么？',
          options: [
            '重装 MySQL',
            '重开一个命令行窗口，并用 where mysql 确认命中的路径',
            '把 mysql.exe 复制到桌面',
            '改成用管理员身份运行 MySQL Installer'
          ],
          answer: 1,
          explain: '环境变量在新窗口才生效（和配 JAVA_HOME 一样）。用 where mysql 可以确认实际解析到哪个可执行文件，避免机器上有多个 MySQL 时打到旧版本。'
        },
      ],
    },

    /* ============================ m05-l02 ============================ */
    {
      id: 'm05-l02',
      title: '建库建表与 CRUD 四件套',
      minutes: 30,
      goal: '建出贯穿全书的 todo_list 表，并手写 INSERT / SELECT / UPDATE / DELETE 验证数据能存能取。',
      sections: [
        {
          type: 'text',
          html: '<p>SQL 是<strong>声明式</strong>语言：你只描述「要什么」，不描述「怎么遍历」。这跟你在 TS 里写 <code>arr.filter(...)</code> 的心智完全不同——<code>filter</code> 是你自己写的遍历逻辑，而 <code>WHERE</code> 交给数据库去决定怎么找（走索引还是全表扫）。这是前端同学学 SQL 的第一道坎。</p><p>关系层级：<strong>数据库（Database / Schema）→ 表（Table）→ 行（Row）→ 列（Column）</strong>。类比 TS：库 ≈ 一个模块的命名空间，表 ≈ <code>Array&lt;Todo&gt;</code>，行 ≈ 一个 <code>Todo</code> 对象，列 ≈ 对象的字段。</p>'
        },
        {
          type: 'code',
          lang: 'sql',
          filename: 'schema.sql · 贯穿项目的建库建表语句',
          code: `-- 建库：字符集必须是 utf8mb4（MySQL 的 utf8 是 3 字节阉割版，存不了 emoji）
CREATE DATABASE todo_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE todo_db;

-- 待办清单表（全书统一表名：todo_list）
CREATE TABLE todo_list (
  id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
  title       VARCHAR(100) NOT NULL                COMMENT '待办标题',
  completed   TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '0=未完成 1=已完成',
  priority    INT          NOT NULL DEFAULT 2      COMMENT '1高 2中 3低',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '待办清单';

-- 看看建出来的结构对不对
DESC todo_list;`
        },
        {
          type: 'table',
          title: 'MySQL 类型 ↔ TS / Java 对照',
          head: ['MySQL 类型', '用途', 'TS 对照', 'Java 对照（m06 用）'],
          rows: [
            ['BIGINT', '主键、雪花 ID、金额分', 'number', 'Long'],
            ['INT / TINYINT(1)', '数量、状态位、布尔', 'number / boolean', 'Integer'],
            ['VARCHAR(n)', '短文本，必须给长度', 'string', 'String'],
            ['TEXT', '长文本（正文、备注）', 'string', 'String'],
            ['DATETIME', '日期时间，不受时区影响', 'string / Date', 'LocalDateTime'],
            ['DECIMAL(m,n)', '金额等精确小数，别用 float', 'number', 'BigDecimal'],
          ]
        },
        {
          type: 'code',
          lang: 'sql',
          filename: 'crud.sql · 增删改查四件套',
          code: `-- C：新增（一次插多条，比循环 insert 快得多）
INSERT INTO todo_list (title, completed, priority) VALUES
  ('写 m05 的课程数据', 0, 1),
  ('给 todo_list 加索引', 0, 2),
  ('复习 JOIN 的三种写法', 1, 3);

-- R：查询（* 只在手写调试时用，正式代码里请写清列名）
SELECT id, title, completed, priority, created_at FROM todo_list;

-- 条件查询
SELECT id, title FROM todo_list WHERE completed = 0 AND priority = 1;

-- U：更新（WHERE 是命根子）
UPDATE todo_list SET completed = 1 WHERE id = 2;

-- D：删除
DELETE FROM todo_list WHERE id = 3;`
        },
        {
          type: 'warn',
          html: '<p><strong>UPDATE / DELETE 忘写 WHERE = 全表改 / 全表删</strong>，而且 MySQL 默认不拦你。养成固定动作：<strong>先把 WHERE 条件用 SELECT 跑一遍，看命中行数对不对，再把 SELECT 换成 UPDATE / DELETE</strong>。</p><p><strong>字符集用 utf8 会埋雷</strong>：MySQL 的 <code>utf8</code> 最多 3 字节，存 emoji 或某些生僻字会报 <code>Incorrect string value</code>。建库建表一律 <code>utf8mb4</code>，MySQL 8 默认排序规则是 <code>utf8mb4_0900_ai_ci</code>。</p><p><strong>数据库里没有 undefined，只有 NULL</strong>：判断空值必须写 <code>IS NULL</code> / <code>IS NOT NULL</code>，写 <code>deleted_at = NULL</code> 永远返回空结果。</p>'
        },
        {
          type: 'text',
          html: '<p>建表时还有几条实践约定值得现在就养成习惯：</p><ul><li><strong>主键选 BIGINT 自增</strong>。单机小项目自增足够，简单、有序、索引紧凑；只有到了分库分表才需要雪花算法这类分布式 ID。二者不能混用——数据库自增却让应用生成 ID，就会出现「插入的 id 是 19 位」的怪事（m06 会再遇到）。</li><li><strong>能用 NOT NULL 就别留 NULL</strong>，并给默认值。业务上的「没有」用具体值表达（<code>completed = 0</code>），而不是 NULL——因为 NULL 会让判断、索引、聚合全都变复杂。</li><li><strong>VARCHAR 必须给长度</strong>，它既是校验也是存储提示；时间统一用 <code>DATETIME</code>（MySQL 8 里 DATETIME 与 TIMESTAMP 都是 5~8 字节，DATETIME 不受时区影响，语义更直白）。</li><li><strong>金额一律 DECIMAL</strong>，不要用 <code>float</code> / <code>double</code>——二进制浮点表示不了 0.1，累加会出错。</li></ul>'
        },
        {
          type: 'compare',
          title: 'SQL ↔ TS 数组操作对照',
          head: ['TS / JS 写法', 'SQL 写法', '说明'],
          rows: [
            ['arr.filter(t => !t.completed)', 'WHERE completed = 0', 'SQL 是声明式，你不管它怎么找'],
            ['arr.sort((a,b) => b.id - a.id)', 'ORDER BY id DESC', 'ASC 可省略（默认升序）'],
            ['arr.slice((p-1)*s, p*s)', 'LIMIT offset, size', 'offset 从 0 开始'],
            ['arr.find(t => t.id === id)', 'WHERE id = ? LIMIT 1', '主键命中最多一行'],
            ['arr.length', 'SELECT COUNT(*) FROM ...', 'COUNT 在数据库里算，不用拉回内存'],
            ['_.groupBy(arr, "priority")', 'GROUP BY priority', '分组后常配合 COUNT / SUM'],
          ]
        },
        {
          type: 'diagram',
          caption: '库 → 表 → 行 → 列的层级关系',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>

  <rect x="38" y="42" width="604" height="252" rx="14" fill="#132239" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="58" y="70" fill="#3B82F6" font-size="14" font-weight="600">数据库 todo_db</text>
  <text x="200" y="70" fill="#94A3B8" font-size="11.5">（一个库里可以有很多张表）</text>

  <rect x="74" y="86" width="532" height="186" rx="12" fill="#16233C" stroke="#22D3EE" stroke-width="1.6"/>
  <text x="94" y="112" fill="#22D3EE" font-size="14" font-weight="600">表 todo_list</text>
  <text x="210" y="112" fill="#94A3B8" font-size="11.5">≈ Array&lt;Todo&gt;，同一结构的行的集合</text>

  <rect x="100" y="124" width="480" height="24" rx="6" fill="#1B2A44" stroke="rgba(59,130,246,.4)"/>
  <text x="116" y="140" fill="#94A3B8" font-size="11.5">id</text>
  <text x="176" y="140" fill="#94A3B8" font-size="11.5">title</text>
  <text x="330" y="140" fill="#94A3B8" font-size="11.5">completed</text>
  <text x="428" y="140" fill="#94A3B8" font-size="11.5">priority</text>
  <text x="500" y="140" fill="#94A3B8" font-size="11.5">created_at</text>

  <rect x="100" y="153" width="480" height="24" rx="6" fill="#111A2C" stroke="rgba(59,130,246,.25)"/>
  <text x="116" y="169" fill="#E2E8F0" font-size="11.5">1</text>
  <text x="176" y="169" fill="#E2E8F0" font-size="11.5">写 m05 的课程数据</text>
  <text x="356" y="169" fill="#E2E8F0" font-size="11.5">0</text>
  <text x="450" y="169" fill="#E2E8F0" font-size="11.5">1</text>
  <text x="500" y="169" fill="#94A3B8" font-size="11.5">10-09 10:12</text>

  <rect x="100" y="182" width="480" height="24" rx="6" fill="#111A2C" stroke="rgba(59,130,246,.25)"/>
  <text x="116" y="198" fill="#E2E8F0" font-size="11.5">2</text>
  <text x="176" y="198" fill="#E2E8F0" font-size="11.5">给 todo_list 加索引</text>
  <text x="356" y="198" fill="#E2E8F0" font-size="11.5">0</text>
  <text x="450" y="198" fill="#E2E8F0" font-size="11.5">2</text>
  <text x="500" y="198" fill="#94A3B8" font-size="11.5">10-09 10:15</text>

  <rect x="100" y="211" width="480" height="24" rx="6" fill="#111A2C" stroke="rgba(59,130,246,.25)"/>
  <text x="116" y="227" fill="#E2E8F0" font-size="11.5">3</text>
  <text x="176" y="227" fill="#E2E8F0" font-size="11.5">复习 JOIN 的三种写法</text>
  <text x="356" y="227" fill="#E2E8F0" font-size="11.5">1</text>
  <text x="450" y="227" fill="#E2E8F0" font-size="11.5">3</text>
  <text x="500" y="227" fill="#94A3B8" font-size="11.5">10-09 10:31</text>

  <text x="94" y="258" fill="#94A3B8" font-size="11.5">一行 = 一个对象（Todo）　一列 = 一个字段，列有类型与约束</text>

  <rect x="38" y="308" width="604" height="32" rx="10" fill="#16233C" stroke="rgba(59,130,246,.35)"/>
  <text x="56" y="328" fill="#94A3B8" font-size="12">AUTO_INCREMENT 让主键交给数据库生成；DATETIME + DEFAULT CURRENT_TIMESTAMP 让时间也交给数据库。</text>
</svg>`
        },
        {
          type: 'fe',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：<code>todo_list</code> 表已经建好了——它就是贯穿全书的「数据库侧事实源」。你可以先插几条假数据，等 m06 接入 MyBatis-Plus 后，m04 里那个返回内存 List 的接口会直接改成读这张表。此刻先记住这句建表语句里的每个约束，m06 写实体类时会一一对上。</p>'
        },
      ],
      quiz: [
        {
          q: '建库时为什么推荐 CHARACTER SET utf8mb4 而不是 utf8？',
          options: [
            'utf8mb4 查询速度更快',
            'MySQL 的 utf8 最多 3 字节，存不了 emoji 和部分生僻字',
            'utf8 在 MySQL 8 已被移除',
            'utf8mb4 才能建外键'
          ],
          answer: 1,
          explain: 'MySQL 的 utf8 是历史遗留的 3 字节实现，遇到 4 字节字符（emoji、部分生僻字）会报 Incorrect string value。utf8mb4 才是真正的完整 UTF-8，MySQL 8 默认排序规则为 utf8mb4_0900_ai_ci。'
        },
        {
          q: '执行 UPDATE todo_list SET completed = 1 但忘记写 WHERE，会发生什么？',
          options: [
            'MySQL 拒绝执行并报错',
            '只更新第一行',
            '把整张表的 completed 全部改成 1',
            '语句语法错误'
          ],
          answer: 2,
          explain: '没有 WHERE 就是全表更新，MySQL 不会拦你。正确工作流：先用 SELECT 带同样的 WHERE 验证命中行数，确认无误后再把 SELECT 换成 UPDATE / DELETE。'
        },
        {
          q: '下面哪条 SQL 能查出 created_at 为空的行？',
          options: [
            'WHERE created_at = NULL',
            'WHERE created_at IS NULL',
            'WHERE created_at == null',
            'WHERE created_at IS undefined'
          ],
          answer: 1,
          explain: 'NULL 参与任何 = 比较的结果都是「未知」，永远不成立，必须用 IS NULL / IS NOT NULL。数据库里也没有 undefined 这个概念。'
        },
      ],
    },

    /* ============================ m05-l03 ============================ */
    {
      id: 'm05-l03',
      title: '查询进阶：过滤、排序、分页与 JOIN',
      minutes: 30,
      goal: '把一个前端列表接口的查询参数翻译成完整 SQL，并搞清 INNER JOIN 与 LEFT JOIN 的区别。',
      sections: [
        {
          type: 'text',
          html: '<p>前端同学对下面这个请求再熟不过了：</p><p><code>GET /api/todos?page=1&size=10&completed=0&keyword=买&sort=created_at,desc</code></p><p>它对应的 SQL 就是把这些参数逐个翻译成子句：<code>WHERE</code> 过滤、<code>ORDER BY</code> 排序、<code>LIMIT</code> 分页。<strong>分页一定要在数据库里做</strong>，不要「查全表再在 JS 里 slice」——线上表有几十万行时，后者等于每次请求都搬空整个仓库。</p>'
        },
        {
          type: 'code',
          lang: 'sql',
          filename: 'list.sql · 列表接口的完整查询',
          code: `-- 前端参数：page=2, size=10, completed=0, keyword='买'
SELECT id, title, completed, priority, created_at
FROM todo_list
WHERE completed = 0
  AND title LIKE '%买%'
ORDER BY created_at DESC, id DESC
LIMIT 10, 10;   -- offset = (page - 1) * size = 10，取 10 条

-- 同时查总数给前端画分页器（两条语句，不是一条）
SELECT COUNT(*) FROM todo_list WHERE completed = 0 AND title LIKE '%买%';`
        },
        {
          type: 'table',
          title: '常用子句速查（书写顺序固定，不能颠倒）',
          head: ['子句', '作用', '前端参数对照'],
          rows: [
            ['SELECT', '要返回哪些列', '响应体里要哪些字段'],
            ['FROM', '从哪张表', '接口路径 /api/todos'],
            ['WHERE', '分组前过滤行', 'completed=0、keyword=买'],
            ['GROUP BY', '按列分组', 'lodash.groupBy'],
            ['HAVING', '过滤分组后的结果', '分组统计结果再筛选'],
            ['ORDER BY', '排序', 'sort=created_at,desc'],
            ['LIMIT', '分页', 'page、size'],
          ]
        },
        {
          type: 'text',
          html: '<p>接下来讲 JOIN。为了有东西可关联，我们加一张 <code>user</code> 表（真实项目里待办一定属于某个用户），并给 <code>todo_list</code> 加一列 <code>owner_id</code>。这一列在 m07 还会派上用场：那时我们会讲到「为什么不能直接把数据库实体返回给前端」——因为 <code>user</code> 表里有密码字段。</p>'
        },
        {
          type: 'code',
          lang: 'sql',
          filename: 'join.sql · 建关联表并演示三种 JOIN',
          code: `CREATE TABLE user (
  id       BIGINT NOT NULL AUTO_INCREMENT,
  nickname VARCHAR(50) NOT NULL,
  password VARCHAR(100) NOT NULL COMMENT '千万别直接返回给前端',
  PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

ALTER TABLE todo_list ADD COLUMN owner_id BIGINT NULL DEFAULT NULL COMMENT '所属用户' AFTER priority;

INSERT INTO user (nickname, password) VALUES ('小明', 'hash-xxx'), ('小红', 'hash-yyy');
UPDATE todo_list SET owner_id = 1 WHERE id IN (1, 2);

-- INNER JOIN：只保留两边都能匹配上的行（没有归属人的待办会被丢掉）
SELECT t.id, t.title, u.nickname
FROM todo_list t
INNER JOIN user u ON t.owner_id = u.id;

-- LEFT JOIN：保留左表（todo_list）全部行，右表没匹配的列补 NULL
SELECT t.id, t.title, u.nickname
FROM todo_list t
LEFT JOIN user u ON t.owner_id = u.id
WHERE t.completed = 0
ORDER BY t.created_at DESC
LIMIT 0, 10;  -- 等价于 LIMIT 10（offset 从 0 起），只做演示，不代表分页起点要从 1 开始`
        },
        {
          type: 'text',
          html: '<p>最后补一条很实用却常被忽略的知识：<strong>SQL 的书写顺序 ≠ 执行顺序</strong>。你写的是 <code>SELECT ... FROM ... WHERE ... ORDER BY ...</code>，数据库真正跑的顺序是：</p><p><code>FROM</code> → <code>ON</code> → <code>JOIN</code> → <code>WHERE</code> → <code>GROUP BY</code> → <code>HAVING</code> → <code>SELECT</code> → <code>DISTINCT</code> → <code>ORDER BY</code> → <code>LIMIT</code></p><p>理解它能解释两件困惑前端同学的小事：① 为什么 <code>WHERE</code> 里不能用 <code>SELECT</code> 定义的别名（那时别名还没生成），而 <code>ORDER BY</code> 可以；② 为什么 <code>LIMIT</code> 一定最后执行——所以「先排序再取前 10 条」才成立，反过来写是取 10 条再排序，结果完全不对。</p>'
        },
        {
          type: 'diagram',
          caption: '三种 JOIN 的韦恩图：高亮部分是结果集',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>
  <text x="24" y="34" fill="#E2E8F0" font-size="15" font-weight="600">A = todo_list（左表）　B = user（右表）　金色 = 返回的行</text>

  <g transform="translate(10,44)">
    <circle cx="70" cy="110" r="62" fill="#16233C" stroke="#3B82F6" stroke-width="1.6"/>
    <circle cx="130" cy="110" r="62" fill="#16233C" stroke="#22D3EE" stroke-width="1.6"/>
    <path d="M100,55.7 A62,62 0 0 1 100,164.3 A62,62 0 0 1 100,55.7" fill="#F59E0B" fill-opacity=".45"/>
    <text x="70" y="42" fill="#3B82F6" font-size="11.5" text-anchor="middle">todo_list</text>
    <text x="130" y="42" fill="#22D3EE" font-size="11.5" text-anchor="middle">user</text>
    <text x="100" y="212" fill="#E2E8F0" font-size="14" font-weight="600" text-anchor="middle">INNER JOIN</text>
    <text x="100" y="234" fill="#94A3B8" font-size="12" text-anchor="middle">只留交集：两边都能匹配</text>
    <text x="100" y="252" fill="#94A3B8" font-size="11.5" text-anchor="middle">没有 owner_id 的待办会消失</text>
  </g>

  <g transform="translate(238,44)">
    <circle cx="70" cy="110" r="62" fill="#16233C" stroke="#3B82F6" stroke-width="1.6"/>
    <circle cx="130" cy="110" r="62" fill="#16233C" stroke="#22D3EE" stroke-width="1.6"/>
    <path d="M70,48 A62,62 0 1 0 70,172 A62,62 0 1 0 70,48" fill="#F59E0B" fill-opacity=".38"/>
    <path d="M100,55.7 A62,62 0 0 1 100,164.3 A62,62 0 0 1 100,55.7" fill="#F59E0B" fill-opacity=".45"/>
    <text x="70" y="42" fill="#3B82F6" font-size="11.5" text-anchor="middle">todo_list</text>
    <text x="130" y="42" fill="#22D3EE" font-size="11.5" text-anchor="middle">user</text>
    <text x="100" y="212" fill="#E2E8F0" font-size="14" font-weight="600" text-anchor="middle">LEFT JOIN</text>
    <text x="100" y="234" fill="#94A3B8" font-size="12" text-anchor="middle">保留左表全部行</text>
    <text x="100" y="252" fill="#94A3B8" font-size="11.5" text-anchor="middle">右表没匹配 → nickname 为 NULL</text>
  </g>

  <g transform="translate(466,44)">
    <circle cx="70" cy="110" r="62" fill="#16233C" stroke="#3B82F6" stroke-width="1.6"/>
    <circle cx="130" cy="110" r="62" fill="#16233C" stroke="#22D3EE" stroke-width="1.6"/>
    <path d="M130,48 A62,62 0 1 0 130,172 A62,62 0 1 0 130,48" fill="#F59E0B" fill-opacity=".38"/>
    <path d="M100,55.7 A62,62 0 0 1 100,164.3 A62,62 0 0 1 100,55.7" fill="#F59E0B" fill-opacity=".45"/>
    <text x="70" y="42" fill="#3B82F6" font-size="11.5" text-anchor="middle">todo_list</text>
    <text x="130" y="42" fill="#22D3EE" font-size="11.5" text-anchor="middle">user</text>
    <text x="100" y="212" fill="#E2E8F0" font-size="14" font-weight="600" text-anchor="middle">RIGHT JOIN</text>
    <text x="100" y="234" fill="#94A3B8" font-size="12" text-anchor="middle">保留右表全部行</text>
    <text x="100" y="252" fill="#94A3B8" font-size="11.5" text-anchor="middle">实际开发用得少，改成 LEFT 更好读</text>
  </g>

  <rect x="24" y="304" width="632" height="44" rx="10" fill="#16233C" stroke="rgba(59,130,246,.35)"/>
  <text x="42" y="322" fill="#94A3B8" font-size="12">口诀：要「不管有没有关联都要列出来」就用 LEFT JOIN；</text>
  <text x="42" y="339" fill="#94A3B8" font-size="12">一旦写了 LEFT JOIN，右表的条件要放在 ON 里而不是 WHERE 里，否则 LEFT 会退化成 INNER。</text>
</svg>`
        },
        {
          type: 'compare',
          title: 'JOIN 与聚合：用前端熟悉的方式理解',
          head: ['TS / JS 写法', 'SQL 写法', '说明'],
          rows: [
            ['两层 for 循环按 id 关联两个数组', 'JOIN ... ON a.id = b.a_id', 'JOIN 让数据库在磁盘上完成关联'],
            ['arr.map(t => ({ ...t, name: userMap[t.uid] }))', 'SELECT t.*, u.nickname FROM ...', 'JOIN 的结果也是一张「临时表」'],
            ['_.groupBy(arr, "priority")', 'GROUP BY priority', '分组后每组压成一行'],
            ['groups.filter(g => g.length > 3)', 'HAVING COUNT(*) > 3', 'HAVING 才能用聚合函数'],
            ['groups.map(g => ({ k: g[0].priority, n: g.length }))', 'SELECT priority, COUNT(*) FROM ... GROUP BY priority', 'SELECT 里只能出现分组列或聚合结果'],
          ]
        },
        {
          type: 'code',
          lang: 'sql',
          filename: 'group.sql · 分组统计：每个优先级各有多少条',
          code: `-- 按优先级统计未完成数量（给前端画统计卡片）
SELECT priority, COUNT(*) AS total
FROM todo_list
WHERE completed = 0
GROUP BY priority
HAVING COUNT(*) > 0
ORDER BY priority;

-- 顺带看看总量、最早和最晚创建时间
SELECT COUNT(*) AS total,
       MIN(created_at) AS first_created,
       MAX(created_at) AS last_created
FROM todo_list;`
        },
        {
          type: 'warn',
          html: '<p><strong>报错 <code>Expression #1 of SELECT list is not in GROUP BY clause</code></strong>：MySQL 8 默认开启 <code>ONLY_FULL_GROUP_BY</code>，SELECT 里出现既没聚合又不在 GROUP BY 中的列会直接报错。老教程（MySQL 5.7 之前）能跑通，别照抄。</p><p><strong><code>LIMIT 100000, 20</code> 很慢</strong>：数据库要真的扫过前 10 万行再丢弃。入门阶段知道这个事实即可，进阶做法是「游标分页」<code>WHERE id &gt; 上一页最大id LIMIT 20</code>。</p><p><strong>深坑：LEFT JOIN 后把右表条件写在 WHERE 里</strong>，例如 <code>WHERE u.nickname = \'小明\'</code>，会把 nickname 为 NULL 的行全部过滤掉，LEFT JOIN 事实上退化成 INNER JOIN。右表条件要写进 <code>ON</code>。</p>'
        },
        {
          type: 'fe',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：你现在已经能用一条 SQL 拼出「前端列表接口返回的那一页数据」了。m06 会用 MyBatis-Plus 的条件构造器把这些子句用 Java 方法拼出来（<code>.eq()</code>、<code>.like()</code>、<code>.orderByDesc()</code>），m06-l03 的分页插件本质上就是自动帮你执行这里的 <code>COUNT(*)</code> + <code>LIMIT</code> 两条语句。</p>'
        },
      ],
      quiz: [
        {
          q: '前端传 page=3、size=10，对应的 LIMIT 应该怎么写？',
          options: ['LIMIT 3, 10', 'LIMIT 10, 30', 'LIMIT 20, 10', 'LIMIT 30, 10'],
          answer: 2,
          explain: 'LIMIT offset, size，offset = (page - 1) * size = (3 - 1) * 10 = 20，所以是 LIMIT 20, 10。offset 从 0 开始数。'
        },
        {
          q: '用 LEFT JOIN 关联 todo_list 和 user 后，把右表条件写在 WHERE 里会怎样？',
          options: [
            '结果不变',
            'LEFT JOIN 退化成 INNER JOIN，右表为 NULL 的行被过滤掉',
            'MySQL 报语法错误',
            '查询变快'
          ],
          answer: 1,
          explain: 'WHERE 是在 JOIN 之后过滤的，u.nickname = 某值 会把 nickname 为 NULL（即没匹配上）的行全部排除，LEFT JOIN 的「保留左表全部行」就失效了。右表的过滤条件应写进 ON 子句。'
        },
        {
          q: '想统计「每个优先级各有几条待办」，正确的是？',
          options: [
            'SELECT priority, COUNT(*) FROM todo_list WHERE COUNT(*) > 0 GROUP BY priority',
            'SELECT priority, COUNT(*) FROM todo_list GROUP BY priority HAVING COUNT(*) > 0',
            'SELECT priority, COUNT(*) FROM todo_list GROUP BY priority WHERE COUNT(*) > 0',
            'SELECT COUNT(*) FROM todo_list ORDER BY priority'
          ],
          answer: 1,
          explain: 'WHERE 在分组前过滤行且不能用聚合函数；HAVING 在分组后过滤分组，才能写 COUNT(*) > 0。同时 SELECT 里只能出现分组列（priority）或聚合结果，否则触发 ONLY_FULL_GROUP_BY 报错。'
        },
      ],
    },

    /* ============================ m05-l04 ============================ */
    {
      id: 'm05-l04',
      title: '索引与设计初步：这条 SQL 为什么慢',
      minutes: 30,
      goal: '会用 EXPLAIN 判断一条查询走没走索引，并能给 todo_list 选出合理的索引。',
      sections: [
        {
          type: 'text',
          html: '<p>CRUD 语法谁都能背，真正的分水岭在这里：<strong>对着一条慢 SQL，你能解释它为什么慢</strong>。数据库入门的标志，就是会看执行计划。</p><p>先建立直觉：没有索引时，<code>WHERE title LIKE \'%买%\'</code> 这种条件只能<strong>从头到尾把每一行捞出来比对</strong>（全表扫描，EXPLAIN 里显示 <code>type=ALL</code>）。有索引时，数据库像查字典一样按目录直接定位到少数几行。索引的代价是：每次写操作都要同步维护它，还要占磁盘。</p>'
        },
        {
          type: 'code',
          lang: 'sql',
          filename: 'explain.sql · 加索引前后各跑一次',
          code: `-- 先看没索引时的执行计划
EXPLAIN SELECT id, title FROM todo_list WHERE completed = 0 ORDER BY created_at DESC LIMIT 0, 10;
-- type = ALL，rows ≈ 全表行数，Extra = Using where; Using filesort

-- 建一个联合索引：先等值过滤 completed，再按 created_at 排序
CREATE INDEX idx_todo_status_time ON todo_list (completed, created_at);

-- 再看一次
EXPLAIN SELECT id, title FROM todo_list WHERE completed = 0 ORDER BY created_at DESC LIMIT 0, 10;
-- type = range/ref，rows 明显变小，Extra 里的 Using filesort 消失`
        },
        {
          type: 'table',
          title: 'EXPLAIN 关键列怎么读',
          head: ['列', '看什么', '常见取值与含义'],
          rows: [
            ['type', '访问方式（最重要）', 'ALL 全表扫 &lt; index &lt; range &lt; ref &lt; eq_ref &lt; const'],
            ['possible_keys', '候选索引', '为空说明没可用的索引'],
            ['key', '实际用到的索引', '为 NULL 就是没走索引'],
            ['rows', '预估要扫描的行数', '和表总行数接近 = 基本在扫全表'],
            ['Extra', '附加信息', 'Using filesort / Using temporary 通常是要优化的信号'],
          ]
        },
        {
          type: 'diagram',
          caption: 'B+Tree 索引：从根节点到叶子只需 3~4 次 IO',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m05b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>
  <text x="24" y="34" fill="#E2E8F0" font-size="15" font-weight="600">B+Tree：层数极少，所以「走索引」比「扫全表」快几个数量级</text>

  <rect x="270" y="52" width="140" height="44" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.8"/>
  <text x="340" y="72" fill="#E2E8F0" font-size="13" text-anchor="middle">根节点</text>
  <text x="340" y="89" fill="#94A3B8" font-size="11.5" text-anchor="middle">10 | 50</text>

  <path d="M332,98 L122,142" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m05b)"/>
  <path d="M340,98 L340,142" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m05b)"/>
  <path d="M348,98 L558,142" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m05b)"/>

  <rect x="40" y="146" width="152" height="46" rx="10" fill="#16233C" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="116" y="167" fill="#E2E8F0" font-size="13" text-anchor="middle">叶子 1 ~ 9</text>
  <text x="116" y="184" fill="#94A3B8" font-size="11" text-anchor="middle">主键 + 行地址</text>

  <rect x="264" y="146" width="152" height="46" rx="10" fill="#16233C" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="340" y="167" fill="#E2E8F0" font-size="13" text-anchor="middle">叶子 10 ~ 49</text>
  <text x="340" y="184" fill="#94A3B8" font-size="11" text-anchor="middle">主键 + 行地址</text>

  <rect x="488" y="146" width="152" height="46" rx="10" fill="#16233C" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="564" y="167" fill="#E2E8F0" font-size="13" text-anchor="middle">叶子 50 +</text>
  <text x="564" y="184" fill="#94A3B8" font-size="11" text-anchor="middle">主键 + 行地址</text>

  <path d="M196,169 L260,169" stroke="#22D3EE" stroke-width="1.6" fill="none" stroke-dasharray="5 4" marker-end="url(#arr-m05b)"/>
  <path d="M420,169 L484,169" stroke="#22D3EE" stroke-width="1.6" fill="none" stroke-dasharray="5 4" marker-end="url(#arr-m05b)"/>
  <text x="228" y="161" fill="#22D3EE" font-size="10.5" text-anchor="middle">链表</text>
  <text x="452" y="161" fill="#22D3EE" font-size="10.5" text-anchor="middle">链表</text>

  <rect x="40" y="216" width="152" height="30" rx="8" fill="#111A2C" stroke="rgba(16,185,129,.5)"/>
  <text x="116" y="235" fill="#10B981" font-size="12" text-anchor="middle">数据行（id 1~9）</text>
  <rect x="264" y="216" width="152" height="30" rx="8" fill="#111A2C" stroke="rgba(16,185,129,.5)"/>
  <text x="340" y="235" fill="#10B981" font-size="12" text-anchor="middle">数据行（id 10~49）</text>
  <rect x="488" y="216" width="152" height="30" rx="8" fill="#111A2C" stroke="rgba(16,185,129,.5)"/>
  <text x="564" y="235" fill="#10B981" font-size="12" text-anchor="middle">数据行（id 50+）</text>

  <path d="M116,196 L116,212" stroke="#64B5F6" stroke-width="1.4" fill="none" marker-end="url(#arr-m05b)"/>
  <path d="M340,196 L340,212" stroke="#64B5F6" stroke-width="1.4" fill="none" marker-end="url(#arr-m05b)"/>
  <path d="M564,196 L564,212" stroke="#64B5F6" stroke-width="1.4" fill="none" marker-end="url(#arr-m05b)"/>

  <rect x="40" y="270" width="600" height="30" rx="10" fill="#16233C" stroke="rgba(59,130,246,.35)"/>
  <text x="58" y="289" fill="#94A3B8" font-size="12">叶子节点之间用链表串起来 → 范围查询（BETWEEN、ORDER BY + LIMIT）特别快。</text>
  <rect x="40" y="306" width="600" height="30" rx="10" fill="#16233C" stroke="rgba(245,158,11,.4)"/>
  <text x="58" y="325" fill="#F59E0B" font-size="12">代价：每多一个索引，INSERT / UPDATE / DELETE 都要多维护一棵树，所以索引不是越多越好。</text>
</svg>`
        },
        {
          type: 'text',
          html: '<p>那么到底给哪些列建索引？记住这份<strong>候选名单</strong>：① <code>WHERE</code> 里高频出现的过滤列；② <code>JOIN ... ON</code> 的关联列（<code>owner_id</code> 就是）；③ <code>ORDER BY</code> / <code>GROUP BY</code> 的排序列。</p><p>第二个判断维度是<strong>区分度（选择性）</strong>：<code>id</code> 每一行都不同，区分度 100%，做索引极好；<code>completed</code> 只有 0/1 两个值，单独建索引收益很差——但如果它总是和 <code>created_at</code> 一起出现在「未完成的、按时间倒序」这个查询里，把它们合成<strong>联合索引</strong>就非常划算，这正是我们给 <code>todo_list</code> 的选择。</p><p>还有个进阶概念叫<strong>覆盖索引</strong>：如果索引里已经包含查询需要的全部列（例如 <code>(completed, created_at)</code> 能满足 <code>SELECT id, created_at WHERE completed = 0</code>，因为二级索引叶子节点带着主键 id），数据库就不用再回表查整行，EXPLAIN 的 Extra 会出现 <code>Using index</code>。入门阶段知道有这件事即可。</p>'
        },
        {
          type: 'code',
          lang: 'sql',
          filename: 'index.sql · 索引类型与最左前缀',
          code: `-- 主键索引：建表时 PRIMARY KEY 自动创建，一张表只能有一个
-- 唯一索引：保证列值不重复。user 表里现成的列是 nickname，就拿它举例
-- （表结构见 m05-l03 的 join.sql：只有 id / nickname / password 三列）
CREATE UNIQUE INDEX uk_user_nickname ON user (nickname);

-- 普通索引：最常见的加速手段
CREATE INDEX idx_todo_owner ON todo_list (owner_id);

-- 联合索引：注意列的顺序（最左前缀原则）
-- （上一段的 explain.sql 已经建过同名索引，MySQL 不支持 CREATE INDEX IF NOT EXISTS，先删再建）
DROP INDEX idx_todo_status_time ON todo_list;
CREATE INDEX idx_todo_status_time ON todo_list (completed, created_at);
-- ✅ 走索引：WHERE completed = 0
-- ✅ 走索引：WHERE completed = 0 ORDER BY created_at
-- ❌ 不走：WHERE created_at > '2026-01-01'（跳过了最左列 completed）

-- 删索引
DROP INDEX idx_todo_owner ON todo_list;`
        },
        {
          type: 'table',
          title: '索引类型速查',
          head: ['类型', '关键字', '特点'],
          rows: [
            ['主键索引', 'PRIMARY KEY', '唯一且非空，一张表一个，InnoDB 里就是数据本身'],
            ['唯一索引', 'UNIQUE', '值不能重复，可以有多个 NULL'],
            ['普通索引', 'INDEX / KEY', '纯粹为了加速查询'],
            ['联合索引', 'INDEX (a, b)', '遵循最左前缀原则，列顺序决定能否命中'],
          ]
        },
        {
          type: 'warn',
          html: '<p><strong>索引不是越多越好</strong>：每个索引都是一棵要维护的树，写多读少的表加一堆索引会明显变慢，还占磁盘。先按「高频查询字段 / JOIN 字段 / 排序字段」这三类名单来加。</p><p><strong>几个常见的失效写法</strong>：对列做运算或函数（<code>WHERE YEAR(created_at) = 2026</code>）；字符串列类型不匹配；<code>LIKE \'%xx\'</code> 以通配符开头（<code>LIKE \'xx%\'</code> 可以走索引）；联合索引跳过最左列。</p><p><strong>别在生产库上直接跑未经 EXPLAIN 验证的 DDL</strong>：大表加索引可能锁表，入门阶段先在本地练。</p>'
        },
        {
          type: 'fe',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：<code>todo_list</code> 的最终设计定稿——主键 <code>id</code> 自增，业务上按 <code>completed</code> 过滤 + <code>created_at</code> 排序，因此建联合索引 <code>(completed, created_at)</code>；<code>owner_id</code> 作为 JOIN 字段单独建普通索引。m06 之后你在 Java 里写的每一个查询条件，都对应这里的一棵索引树。</p>'
        },
      ],
      quiz: [
        {
          q: 'EXPLAIN 结果里看到 type = ALL、rows 接近表总行数，说明什么？',
          options: [
            '走了主键索引，性能最好',
            '在做全表扫描，通常需要检查 WHERE / ORDER BY 字段是否有索引',
            '说明 SQL 有语法错误',
            '说明用了临时表，一定很慢但无法优化'
          ],
          answer: 1,
          explain: 'type = ALL 表示全表扫描，rows 是预估扫描行数。看到它就要检查过滤/排序字段能否命中索引，或是否存在函数包裹列、LIKE 以 % 开头等失效写法。'
        },
        {
          q: '建有联合索引 (completed, created_at)，下列哪个查询无法命中该索引？',
          options: [
            'WHERE completed = 0',
            'WHERE completed = 0 ORDER BY created_at DESC',
            'WHERE completed = 1 AND created_at > \'2026-01-01\'',
            'WHERE created_at > \'2026-01-01\''
          ],
          answer: 3,
          explain: '最左前缀原则：查询必须从索引最左列 completed 开始连续匹配。直接只查 created_at 跳过了最左列，该索引失效（除非优化器选择全索引扫描，那也不是我们想要的）。'
        },
        {
          q: '关于索引的代价，下面说法正确的是？',
          options: [
            '索引只占一点点空间，可以随便加',
            '索引只会让查询变快，对写入没有影响',
            '每个索引都要在写操作时同步维护，会拖慢 INSERT / UPDATE / DELETE 并占用磁盘',
            '一张表最多只能建 3 个索引'
          ],
          answer: 2,
          explain: '索引是空间换时间：加快读、拖慢写。因此只给高频查询、JOIN、排序字段建索引，写多读少的表要克制。'
        },
      ],
    },

    /* ============================ m05-l05 ============================ */
    {
      id: 'm05-l05',
      title: 'IDEA 数据库面板实战',
      minutes: 30,
      goal: '用 IDEA 内置 Database 面板连上 MySQL，可视化建表、写 SQL、改数据，不再来回切窗口。',
      sections: [
        {
          type: 'text',
          html: '<p>装独立的图形客户端当然可以，但对写 Java 的人来说，<strong>IDEA 自带的 Database 面板是最顺手的</strong>：写代码、看数据、跑 SQL 都在同一个窗口里，而且它能反过来帮你生成实体类。这一课把它用起来，后面 m06 排查「为什么插进去的数据和我预想的不一样」时会天天用到。</p><p><strong>先看这句再往下</strong>：Database 面板只有 <strong>Ultimate 版</strong>才有。如果你是社区版（Community Edition），本节不用跳过——直接走 <strong>DBeaver / MySQL 命令行两条替代路线</strong>，做的事完全等价：连库、看表、跑 SQL、改数据一个不少，只是换了窗口。</p>'
        },
        {
          type: 'steps',
          title: '连接 MySQL 的完整步骤（IDEA 2024.2.4）',
          items: [
            '打开右侧边栏的 <strong>Database</strong> 面板（找不到就 <code>Ctrl+Shift+A</code> 搜 <code>Database</code>）。',
            '点 <code>+</code> → <strong>Data Source</strong> → <strong>MySQL</strong>。',
            '填 Host = <code>localhost</code>、Port = <code>3306</code>、User = <code>root</code>、Password = 安装时设的密码，Database 先留空（连接成功后再选 <code>todo_db</code>）。',
            '第一次连接底部会提示 <strong>Download missing driver files</strong>，点它下载 MySQL 驱动（需要联网，几十秒）。',
            '点 <strong>Test Connection</strong>，出现绿色对勾后点 <strong>Apply / OK</strong>。',
            '在面板里展开 <code>todo_db</code> → <code>tables</code>，双击 <code>todo_list</code> 即可网格化查看与编辑数据。',
            '按 <code>F4</code> 或右键 <strong>Jump to Query Console</strong> 打开 SQL 控制台，<code>Ctrl+Enter</code> 执行光标所在语句。'
          ]
        },
        {
          type: 'code',
          lang: 'sql',
          filename: 'Query Console · 面板里直接跑',
          code: `-- Ctrl+Enter 执行（不是 Ctrl+Shift+Enter，后者是格式化）
SELECT * FROM todo_list ORDER BY id DESC LIMIT 10;

-- 改完数据要不要手动提交，取决于工具栏的事务模式下拉框（不同版本默认值不同）：
--   Auto-commit（自动提交）：改完即时生效，无需操作
--   手动提交：网格里改完点工具栏的 Submit，或执行下面这句 COMMIT
COMMIT;

-- 快速看表结构
DESC todo_list;
SHOW INDEX FROM todo_list;`
        },
        {
          type: 'table',
          title: '面板高频操作速查',
          head: ['想做的事', '怎么做', '备注'],
          rows: [
            ['打开 SQL 控制台', '选中数据源按 F4', 'Ctrl+Enter 执行选中语句'],
            ['看表结构（字段/类型/索引）', '双击表名 → DDL / Columns 页签', '比 DESC 更直观'],
            ['改一条数据', '双击表 → 网格里直接改 → Submit', '看事务下拉框：Auto-commit 无需提交，手动模式才要 Submit'],
            ['导出建表语句', '右键表 → SQL Scripts → Generate DDL', '可导出到文件做版本管理'],
            ['生成实体类', '右键表 → Scripted Extensions → Generate POJOs', 'm06 写实体时可偷懒，但要自己核对'],
            ['格式化 SQL', 'Ctrl+Alt+L', '和格式化 Java 代码同一个键'],
          ]
        },
        {
          type: 'warn',
          html: '<p><strong>Test Connection 报 <code>Server returns invalid timezone</code></strong>：IDEA 连接属性里没设时区。在 Advanced 页签找到 <code>serverTimezone</code> 填 <code>Asia/Shanghai</code>；这条和 m06 里 JDBC URL 必须带 <code>serverTimezone=Asia/Shanghai</code> 是同一个原因——不指定时区，时间字段会差 8 小时。</p><p><strong>改了数据但 Java 程序读不到</strong>：先看 Database 工具窗口工具栏上的<strong>事务模式下拉框</strong>。它有 <strong>Auto-commit（自动提交）</strong> 和<strong>手动提交</strong>两种模式（不同 IDEA 版本默认值不同），如果不小心停在了手动提交，网格里改完就要点 Submit（绿色向上箭头）或执行 <code>COMMIT</code>，否则改动只在本连接的事务里，其他连接根本看不到。</p><p><strong>找不到 Database 面板</strong>：确认用的是 Ultimate 版；社区版没有内置 Database 工具，可改用 DBeaver / Workbench，或者直接用命令行。</p>'
        },
        {
          type: 'text',
          html: '<p>除了看图改数据，面板还有两个在真实项目里高频的用途：</p><ul><li><strong>把表结构导出成 DDL 存进版本库</strong>：右键表 → SQL Scripts → Generate DDL，把建表语句保存为 <code>docs/schema.sql</code>。这样「数据库结构」也进了 Git，团队协作时谁改了表、什么时候改的，一查就知道。</li><li><strong>核对应用写进去的数据</strong>：m06 接入 MyBatis-Plus 后，你会经常怀疑「到底插进去没有 / 时间对不对 / 逻辑删除有没有生效」。这时候别去翻日志猜，直接在面板里 <code>SELECT</code> 一遍，一眼见分晓。</li></ul><p>顺带一提：面板里看到的连接和你的 Java 应用是<strong>两个独立连接</strong>，各自有各自的事务。若面板停在手动提交模式，你改了数据没提交，应用就读不到（上面的 warn 框）——把事务下拉框切到手动模式亲手复现一次，印象最深。</p>'
        },
        {
          type: 'diagram',
          caption: 'IDEA Database 面板的连接与使用流程',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m05c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>

  <rect x="30" y="52" width="180" height="56" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="120" y="76" fill="#E2E8F0" font-size="13.5" text-anchor="middle">① Database 面板</text>
  <text x="120" y="95" fill="#94A3B8" font-size="11.5" text-anchor="middle">+ → Data Source → MySQL</text>

  <rect x="250" y="52" width="180" height="56" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="340" y="76" fill="#E2E8F0" font-size="13.5" text-anchor="middle">② 填连接信息</text>
  <text x="340" y="95" fill="#94A3B8" font-size="11.5" text-anchor="middle">host / port / user / pwd</text>

  <rect x="470" y="52" width="180" height="56" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.8"/>
  <text x="560" y="76" fill="#E2E8F0" font-size="13.5" text-anchor="middle">③ Test Connection</text>
  <text x="560" y="95" fill="#94A3B8" font-size="11.5" text-anchor="middle">顺手设 serverTimezone</text>

  <path d="M214,80 L246,80" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m05c)"/>
  <path d="M434,80 L466,80" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m05c)"/>
  <path d="M560,112 L560,136 L120,136 L120,152" stroke="#64B5F6" stroke-width="1.6" fill="none" stroke-dasharray="5 4" marker-end="url(#arr-m05c)"/>
  <text x="330" y="130" fill="#94A3B8" font-size="11">失败：下载驱动 / 检查服务是否启动</text>

  <rect x="30" y="156" width="180" height="56" rx="10" fill="#16233C" stroke="#10B981" stroke-width="1.6"/>
  <text x="120" y="180" fill="#E2E8F0" font-size="13.5" text-anchor="middle">④ 连上了</text>
  <text x="120" y="199" fill="#94A3B8" font-size="11.5" text-anchor="middle">展开 todo_db → tables</text>

  <rect x="250" y="156" width="180" height="56" rx="10" fill="#16233C" stroke="#22D3EE" stroke-width="1.6"/>
  <text x="340" y="180" fill="#E2E8F0" font-size="13.5" text-anchor="middle">⑤ F4 打开控制台</text>
  <text x="340" y="199" fill="#94A3B8" font-size="11.5" text-anchor="middle">Ctrl+Enter 执行 SQL</text>

  <rect x="470" y="156" width="180" height="56" rx="10" fill="#16233C" stroke="#22D3EE" stroke-width="1.6"/>
  <text x="560" y="180" fill="#E2E8F0" font-size="13.5" text-anchor="middle">⑥ 改数据 → Submit</text>
  <text x="560" y="199" fill="#94A3B8" font-size="11.5" text-anchor="middle">看事务下拉框是否自动提交</text>

  <path d="M214,184 L246,184" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m05c)"/>
  <path d="M434,184 L466,184" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m05c)"/>

  <rect x="30" y="244" width="620" height="42" rx="10" fill="#16233C" stroke="rgba(59,130,246,.35)"/>
  <text x="48" y="263" fill="#94A3B8" font-size="12">日常节奏：写代码 → 右侧面板直接看表里的数据 → 发现不对就在控制台改 SQL 复现，不用来回切软件。</text>
  <text x="48" y="279" fill="#94A3B8" font-size="12">它就像浏览器的 Vue DevTools：不是调试代码，而是直接观察「状态」。</text>

  <rect x="30" y="298" width="620" height="42" rx="10" fill="#16233C" stroke="rgba(245,158,11,.4)"/>
  <text x="48" y="317" fill="#F59E0B" font-size="12">社区版没有 Database 面板，改用 DBeaver / Workbench，或直接用 mysql 命令行，功能完全够用。</text>
  <text x="48" y="333" fill="#F59E0B" font-size="12">连接属性里的 serverTimezone 一定要填 Asia/Shanghai，否则时间字段会差 8 小时。</text>
</svg>`
        },
        {
          type: 'fe',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：数据库侧准备全部完成——<code>todo_db</code> 库、<code>todo_list</code> 表（含 owner_id 与两个索引）、几行测试数据，还有一个随时能看数据的面板。下一模块 m06 开始，我们让 Java 程序接上它，把 m04 里那个内存版接口改造成真正落库的版本。</p>'
        },
      ],
      quiz: [
        {
          q: 'IDEA 首次连接 MySQL 时提示下载驱动，正确的做法是？',
          options: [
            '忽略，驱动 IDEA 已内置',
            '点 Download missing driver files 下载后重试',
            '手动把 mysql-connector-j 的 jar 复制到项目根目录',
            '改用命令行，图形界面连不上'
          ],
          answer: 1,
          explain: 'IDEA 不内置各数据库的 JDBC 驱动，首次连接会提示下载，联网点一下即可。项目里的 mysql-connector-j 是给应用运行时用的，与 IDEA 自身的驱动是两回事。'
        },
        {
          q: '在 IDEA 数据库面板的网格里改了一条数据，但 Java 程序读到的还是旧值，最可能的原因是？',
          options: [
            'Java 程序有缓存',
            '面板所在连接的事务没提交（停留在手动提交模式）',
            'MySQL 不支持可视化编辑',
            '表没有主键'
          ],
          answer: 1,
          explain: '面板与 Java 应用是两个独立连接，各自有各自的事务。IDEA 的事务下拉框有 Auto-commit 和手动提交两种模式（默认值随版本不同），一旦停在手动提交模式，网格里改完就要点 Submit 或执行 COMMIT，否则改动只在当前连接的事务里，其他连接看不到。'
        },
        {
          q: 'IDEA 连接配置里 serverTimezone 该填什么，为什么？',
          options: [
            'UTC，数据库统一用 UTC',
            'Asia/Shanghai，否则时间字段会与本地时间差 8 小时',
            '不需要填，MySQL 会自动识别',
            'GMT+0，最标准'
          ],
          answer: 1,
          explain: 'JDBC 驱动和 IDEA 都需要明确时区，不指定就会用 UTC 解释 DATETIME，导致写入/读出与本地时间差 8 小时。m06 的 JDBC URL 里同样必须带 serverTimezone=Asia/Shanghai。'
        },
      ],
    },

    /* ============================ m05-l06 避坑 ============================ */
    {
      id: 'm05-l06',
      title: '避坑清单：MySQL 线上事故 Top 6',
      minutes: 35,
      goal: '收拢公司项目里最常见的 6 类 MySQL 事故：隐式转换索引失效、utf8mb4 字符集、UPDATE/DELETE 误伤全表、深分页、索引失效场景合集、锁等待。每个坑都有 EXPLAIN 层面的解释，让你不光知道怎么改，还知道为什么。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>前端工程师写 SQL 的第一年，99% 的事故来自「这条查询突然变慢」和「一条 UPDATE 伤了不该伤的数据」。这一课的 6 个坑全部来自真实生产环境，学完后你至少能在事故现场说出一句内行话。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 1：隐式类型转换，索引悄悄失效（新手事故榜第一名）。</strong>phone 是 varchar 并建了索引，你却写成：</p>
<pre>SELECT * FROM users WHERE phone = 13800000000;   -- 没加引号！</pre>
<p>MySQL 不会报错，而是<strong>把 phone 这一列的每个值都转成数字</strong>再比较——相当于对索引列做函数运算，索引直接作废，EXPLAIN 的 type 变成 ALL、rows 等于全表行数。2000 万行的表，一个引号之差，查询从 1 行扫描变成全表扫描。</p>`,
        },
        {
          type: 'code',
          lang: 'sql',
          filename: '对照实验',
          code: `-- 反面教材：全表扫描
EXPLAIN SELECT * FROM todo_list WHERE title = 123;
-- type=ALL, key=NULL, rows=全表行数

-- 正确写法：类型匹配，走索引
EXPLAIN SELECT * FROM todo_list WHERE title = '123';
-- type=ref, key=idx_title

-- 口诀：字符串列的值必须加引号；数字列加了引号通常也能走索引（字符串转数字代价小）
-- 另一个变体：JOIN 两表字段字符集不一致（utf8 与 utf8mb4 混用），同样触发隐式转换索引失效`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 2：utf8 与 utf8mb4。</strong>MySQL 的 <code>utf8</code> 是残缺版（最多 3 字节），存不了 emoji 和部分生僻字——用户昵称里一个 😂 入库变成 <code>?</code>。<code>utf8mb4</code> 才是完整的 UTF-8。更阴险的是<strong>两表字符集不一致时 JOIN 会隐式转换、索引失效</strong>。排查命令与修法：</p>`,
        },
        {
          type: 'code',
          lang: 'sql',
          filename: '字符集排查',
          code: `-- 看表的字符集与排序规则
SHOW CREATE TABLE todo_list;

-- 8.0 建表标准姿势（utf8mb4 + 0900 排序规则）
CREATE TABLE todo_list (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 老 utf8 表迁移：先加索引备份，再 CONVERT（会锁表，生产挑低峰做）
ALTER TABLE todo_list CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 3：UPDATE / DELETE 忘写 WHERE。</strong>前端没有「直接改数据库」的习惯，后端一条手滑 SQL 就是生产事故。三层防护：</p>`,
        },
        {
          type: 'code',
          lang: 'sql',
          filename: '三层防护',
          code: `-- 防护 1：本地开发也开安全更新模式，忘写 WHERE 直接报错
SET sql_safe_updates = 1;

-- 防护 2：改数据前，先用同样的 WHERE 跑一遍 SELECT，肉眼确认命中行数与预期一致
SELECT id, status FROM todo_list WHERE status = 'open';   -- 假设命中 3 行
UPDATE todo_list SET status = 'done' WHERE status = 'open';  -- 再改成 UPDATE
-- 看返回的 affected rows 是否等于刚才 SELECT 的行数

-- 防护 3：事务里改，改完 SELECT 确认再 COMMIT，不对就 ROLLBACK
START TRANSACTION;
UPDATE todo_list SET status = 'done' WHERE status = 'open';
SELECT status, COUNT(*) FROM todo_list GROUP BY status;   -- 确认无误
COMMIT;   -- 有问题就 ROLLBACK;`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 4：深分页越来越慢。</strong>前端滚到第 5000 页时接口超时——<code>LIMIT 100000, 20</code> 的执行方式是<strong>先扫过前 100020 行再丢掉前 10 万行</strong>，页码越深扫的越多：</p>`,
        },
        {
          type: 'code',
          lang: 'sql',
          filename: '游标分页',
          code: `-- 反面教材：LIMIT 深偏移，扫描量 = 偏移量 + 页大小
SELECT * FROM todo_list ORDER BY id LIMIT 100000, 20;

-- 修法 1（推荐）：游标分页。前端传「上一页最后一条的 id」，只按索引定位
SELECT * FROM todo_list WHERE id > 100000 ORDER BY id LIMIT 20;   -- 索引直达，恒定快

-- 修法 2（必须跳页时）：先用覆盖索引拿到 20 个 id，再回表查整行
SELECT * FROM todo_list t
JOIN (SELECT id FROM todo_list ORDER BY id LIMIT 100000, 20) tmp ON t.id = tmp.id;`,
        },
        {
          type: 'diagram',
          caption: '深分页为什么慢：LIMIT 深偏移要扫过并丢弃前 10 万行；游标分页按索引直达目标位置',
          svg: String.raw`<svg viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m05-pg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="300" rx="12" fill="#0F1B2D"/>
  <text x="340" y="32" text-anchor="middle" font-size="16" fill="#E2E8F0">取第 5001 页的 20 行：两条路径的代价</text>

  <text x="340" y="64" text-anchor="middle" font-size="13" fill="#F87171">✗ LIMIT 100000, 20 —— 扫描 100020 行再丢弃前 10 万</text>
  <rect x="24" y="76" width="596" height="26" rx="6" fill="#2A1620" stroke="#EF4444" stroke-width="1"/>
  <rect x="24" y="76" width="560" height="26" rx="6" fill="#EF4444" opacity="0.28"/>
  <text x="304" y="94" text-anchor="middle" font-size="11" fill="#FCA5A5">被扫描然后被丢弃（浪费全部时间）</text>
  <rect x="588" y="76" width="32" height="26" rx="6" fill="#10B981"/>
  <text x="604" y="94" text-anchor="middle" font-size="10" fill="#052E1F">要的</text>
  <text x="340" y="118" text-anchor="middle" font-size="11" fill="#94A3B8">页码越深，红色越长；且行宽 × 10 万次的回表更是雪上加霜</text>

  <text x="340" y="164" text-anchor="middle" font-size="13" fill="#6EE7B7">✓ WHERE id &gt; 100000 LIMIT 20 —— 索引直达，只碰 20 行</text>
  <rect x="24" y="176" width="596" height="26" rx="6" fill="#12261E" stroke="#10B981" stroke-width="1"/>
  <rect x="586" y="176" width="34" height="26" rx="6" fill="#10B981"/>
  <text x="603" y="194" text-anchor="middle" font-size="10" fill="#05271C">要的</text>
  <text x="300" y="194" text-anchor="middle" font-size="11" fill="#6EE7B7">B+ 树二分定位：一步跳到 id=100001</text>

  <line x1="24" y1="216" x2="586" y2="216" stroke="#64B5F6" stroke-width="1.4" stroke-dasharray="5 4" marker-end="url(#arr-m05-pg)"/>
  <text x="300" y="232" text-anchor="middle" font-size="10.5" fill="#94A3B8">索引直接跳到目标位置，时间恒定</text>

  <rect x="24" y="248" width="632" height="36" rx="8" fill="#16223A" stroke="#3B82F6" stroke-width="1"/>
  <text x="40" y="271" font-size="11.5" fill="#93C5FD">接口设计：信息流 / 聊天记录用游标（传上一页末尾 id）；管理后台要跳页才用「先取 id 再回表」修法</text>
</svg>`,
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>对照前端：</strong>游标分页就是 GitHub API 的 <code>since_id</code> 模式，比传统的 <code>page/size</code> 更适合无限滚动列表。给前端同学的接口设计建议：管理后台要跳页用修法 2；信息流、聊天记录这类顺序翻页场景直接游标。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 5：索引失效场景合集。</strong>建了索引不代表用得上。遇到「EXPLAIN type=ALL」按这张表逐条自查：</p>`,
        },
        {
          type: 'table',
          title: '索引失效自查表',
          head: ['写法', '失效原因', '正确写法'],
          rows: [
            ['WHERE DATE(created_at) = 今天', '对索引列套函数', 'WHERE created_at >= 今天0点 AND created_at &lt; 明天0点'],
            ["WHERE phone = 13800000000", '隐式类型转换', "WHERE phone = '13800000000'（加引号）"],
            ["WHERE title LIKE '%待办'", '前导通配符无法定位前缀', "LIKE '待办%'；必须两边模糊时用全文索引或 ES"],
            ['WHERE a = 1 OR c = 2（c 无索引）', 'OR 一边无索引整体放弃', 'UNION 两条各自走索引的查询'],
            ['联合索引 (a,b) 只查 b', '违背最左前缀', '补上 a 条件或调换索引列顺序'],
            ['WHERE created_at + INTERVAL 1 DAY &gt; NOW()', '列参与运算', '把运算移到常量侧：WHERE created_at &gt; NOW() - INTERVAL 1 DAY'],
          ],
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 6：锁等待与「突然卡住」。</strong>现象：一条很简单的 UPDATE 执行几十秒后报 <code>Lock wait timeout exceeded</code>。原因几乎都是<strong>另一个长事务持着这行锁没释放</strong>（常见：一个没提交的事务在 IDEA 里开着、或慢 SQL 拖着大事务）。排查三连：</p>`,
        },
        {
          type: 'code',
          lang: 'sql',
          filename: '锁排查三连',
          code: `-- 1) 看当前运行中的事务（8.0）与等待
SELECT * FROM information_schema.INNODB_TRX;         -- trx_started 早的就是长事务
SELECT * FROM performance_schema.data_lock_waits;    -- 谁在等谁（8.0）

-- 2) 杀掉肇事连接
KILL 线程id;   -- 来自 INNODB_TRX 的 trx_mysql_thread_id

-- 预防：事务里不要夹 HTTP 调用 / 大量计算；平时只在 IDE 提交短事务`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>遇到慢 SQL 第一反应跑 EXPLAIN，先看 type 和 rows。</li>
<li>字符串值加引号、索引列不套函数、LIKE 不以前导 % 开头。</li>
<li>改数据三防护：安全模式、先 SELECT、事务包裹。</li>
<li>列表接口设计时区分游标分页与跳页分页。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: 'varchar 列 phone 建了索引，WHERE phone = 13800000000（无引号）导致全表扫描的原因是？',
          options: [
            '索引损坏需要重建',
            '隐式类型转换：MySQL 把索引列的每个值转成数字再比较，等效于对列套函数，索引失效',
            'phone 列太长不能建索引',
            'MySQL 8.0 的已知 bug',
          ],
          answer: 1,
          explain:
            '字符串与数字比较时，MySQL 把字符串列转成数字，索引有序性被破坏，优化器退回全表扫描。修法是值加引号。EXPLAIN 里表现为 type=ALL、key=NULL。',
        },
        {
          q: '关于 LIMIT 100000, 20 的深分页，说法正确的是？',
          options: [
            'MySQL 会直接跳到第 100001 行，速度与页码无关',
            '它会扫描前 100020 行然后丢弃前 10 万行，页码越深越慢',
            '加索引后深分页就完全没问题了',
            'LIMIT 的偏移量上限是 10 万',
          ],
          answer: 1,
          explain:
            'LIMIT offset,size 的代价是扫描 offset+size 行。顺序翻页用游标（WHERE id > 上一页末尾 LIMIT 20），必须跳页时用覆盖索引先取 id 再回表。',
        },
        {
          q: '下列哪种写法会让 (status, created_at) 上的索引失效？',
          options: [
            "WHERE status = 'open' AND created_at > '2026-01-01'",
            "WHERE DATE(created_at) = '2026-10-09'",
            'ORDER BY created_at LIMIT 10',
            "WHERE status = 'open'",
          ],
          answer: 1,
          explain:
            '对索引列套函数（DATE()）会破坏索引有序性导致失效，应改写成范围条件 created_at >= 当天0点 AND < 明天0点。其余三种都能正常用索引。',
        },
        {
          q: 'UPDATE 执行 30 秒后报 Lock wait timeout exceeded，最可能的原因是？',
          options: [
            '磁盘满了',
            '另一个长事务持有该行锁未提交（比如 IDE 里开着没 commit 的事务）',
            '字段类型不匹配',
            '索引建多了',
          ],
          answer: 1,
          explain:
            'InnoDB 行锁由事务持有到提交/回滚。长事务（未提交的编辑窗口、事务里夹慢操作）会堵住后续改动。查 information_schema.INNODB_TRX 找 trx_started 最早的事务，必要时 KILL。',
        },
      ],
    },
  ],
};
