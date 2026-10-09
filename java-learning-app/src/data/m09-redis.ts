import type { RawModule } from '../types/course'

/**
 * m09 Redis 缓存（3 课）
 *
 * 贯穿项目位置：m08 已经把「待办清单 API」部署上线，但每个请求都打到 MySQL。
 * 这一模块给它加一层 Redis 缓存：先装起来、认识五种数据类型，
 * 再接入 Spring Boot 3.2（注意配置前缀是 spring.data.redis.*），
 * 最后处理缓存穿透 / 击穿 / 雪崩三个经典问题。
 *
 * 环境基线：Redis 7 + Spring Boot 3.2.x + JDK 17，命令视角以 Windows 为主。
 */

/* ---------------- 图解 1：五种数据类型 ---------------- */

const SVG_REDIS_TYPES = `<svg viewBox="0 0 680 340" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m09a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="340" rx="12" fill="#0F1B2D"/>
  <text x="340" y="28" text-anchor="middle" font-size="16" fill="#E2E8F0">同一个 key，五种装法：Redis 的五大数据类型</text>

  <text x="67" y="56" text-anchor="middle" font-size="14" fill="#22D3EE">String</text>
  <text x="204" y="56" text-anchor="middle" font-size="14" fill="#22D3EE">Hash</text>
  <text x="341" y="56" text-anchor="middle" font-size="14" fill="#22D3EE">List</text>
  <text x="478" y="56" text-anchor="middle" font-size="14" fill="#22D3EE">Set</text>
  <text x="615" y="56" text-anchor="middle" font-size="14" fill="#22D3EE">ZSet</text>

  <text x="67" y="74" text-anchor="middle" font-size="10.5" fill="#94A3B8">key</text>
  <text x="204" y="74" text-anchor="middle" font-size="10.5" fill="#94A3B8">key</text>
  <text x="341" y="74" text-anchor="middle" font-size="10.5" fill="#94A3B8">key</text>
  <text x="478" y="74" text-anchor="middle" font-size="10.5" fill="#94A3B8">key</text>
  <text x="615" y="74" text-anchor="middle" font-size="10.5" fill="#94A3B8">key</text>

  <line x1="67" y1="78" x2="67" y2="92" stroke="#64B5F6" stroke-width="1.4" marker-end="url(#arr-m09a)"/>
  <line x1="204" y1="78" x2="204" y2="92" stroke="#64B5F6" stroke-width="1.4" marker-end="url(#arr-m09a)"/>
  <line x1="341" y1="78" x2="341" y2="92" stroke="#64B5F6" stroke-width="1.4" marker-end="url(#arr-m09a)"/>
  <line x1="478" y1="78" x2="478" y2="92" stroke="#64B5F6" stroke-width="1.4" marker-end="url(#arr-m09a)"/>
  <line x1="615" y1="78" x2="615" y2="92" stroke="#64B5F6" stroke-width="1.4" marker-end="url(#arr-m09a)"/>

  <rect x="12" y="96" width="110" height="44" rx="8" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="67" y="115" text-anchor="middle" font-size="10.5" fill="#E2E8F0">JSON 字符串</text>
  <text x="67" y="131" text-anchor="middle" font-size="10.5" fill="#94A3B8">或计数器数字</text>

  <rect x="149" y="96" width="110" height="64" rx="8" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="204" y="115" text-anchor="middle" font-size="10.5" fill="#E2E8F0">title → 买菜</text>
  <text x="204" y="132" text-anchor="middle" font-size="10.5" fill="#E2E8F0">done → 0</text>
  <text x="204" y="149" text-anchor="middle" font-size="10.5" fill="#94A3B8">ctime → ...</text>

  <rect x="286" y="96" width="110" height="18" rx="5" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="341" y="109" text-anchor="middle" font-size="10.5" fill="#E2E8F0">0 → A</text>
  <rect x="286" y="118" width="110" height="18" rx="5" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="341" y="131" text-anchor="middle" font-size="10.5" fill="#E2E8F0">1 → B</text>
  <rect x="286" y="140" width="110" height="18" rx="5" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="341" y="153" text-anchor="middle" font-size="10.5" fill="#E2E8F0">2 → C</text>

  <rect x="423" y="96" width="110" height="58" rx="8" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="478" y="116" text-anchor="middle" font-size="11" fill="#E2E8F0">A　B　C</text>
  <text x="478" y="136" text-anchor="middle" font-size="10.5" fill="#94A3B8">无序 · 自动去重</text>

  <rect x="560" y="96" width="110" height="64" rx="8" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="615" y="115" text-anchor="middle" font-size="10.5" fill="#E2E8F0">A　score 100</text>
  <text x="615" y="132" text-anchor="middle" font-size="10.5" fill="#E2E8F0">B　score 80</text>
  <text x="615" y="149" text-anchor="middle" font-size="10.5" fill="#F59E0B">C　score 60</text>

  <text x="67" y="182" text-anchor="middle" font-size="10.5" fill="#22D3EE">SET / GET</text>
  <text x="204" y="182" text-anchor="middle" font-size="10.5" fill="#22D3EE">HSET / HGET</text>
  <text x="341" y="182" text-anchor="middle" font-size="10.5" fill="#22D3EE">LPUSH / LRANGE</text>
  <text x="478" y="182" text-anchor="middle" font-size="10.5" fill="#22D3EE">SADD / SMEMBERS</text>
  <text x="615" y="182" text-anchor="middle" font-size="10.5" fill="#22D3EE">ZADD / ZRANGE</text>

  <text x="67" y="204" text-anchor="middle" font-size="11.5" fill="#E2E8F0">缓存对象 / 计数</text>
  <text x="204" y="204" text-anchor="middle" font-size="11.5" fill="#E2E8F0">购物车 / 资料</text>
  <text x="341" y="204" text-anchor="middle" font-size="11.5" fill="#E2E8F0">队列 / 最新列表</text>
  <text x="478" y="204" text-anchor="middle" font-size="11.5" fill="#E2E8F0">点赞 / 去重</text>
  <text x="615" y="204" text-anchor="middle" font-size="11.5" fill="#E2E8F0">排行榜</text>

  <rect x="16" y="222" width="648" height="64" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="340" y="246" text-anchor="middle" font-size="12" fill="#E2E8F0">前端对照：String ≈ localStorage 的 k-v；Hash ≈ 对象；List ≈ 数组；Set ≈ JS 的 Set；ZSet ≈ 带 score 的数组</text>
  <text x="340" y="270" text-anchor="middle" font-size="12" fill="#94A3B8">怎么选：整体读写 → String；改单个字段 → Hash；要顺序 → List；要去重 → Set；要排名 → ZSet</text>
</svg>`;

/* ---------------- 图解 2：@Cacheable 的 AOP 代理流程 ---------------- */

const SVG_CACHE_AOP = `<svg viewBox="0 0 680 380" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m09b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="380" rx="12" fill="#0F1B2D"/>
  <text x="340" y="28" text-anchor="middle" font-size="16" fill="#E2E8F0">@Cacheable 背后：AOP 代理是怎么拦下这次调用的</text>

  <rect x="30" y="46" width="180" height="56" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-size="13" fill="#E2E8F0">① 调用</text>
  <text x="120" y="90" text-anchor="middle" font-size="12" fill="#94A3B8">todoService.getById(1)</text>

  <rect x="250" y="46" width="180" height="56" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="340" y="70" text-anchor="middle" font-size="13" fill="#E2E8F0">② 缓存切面拦截</text>
  <text x="340" y="90" text-anchor="middle" font-size="12" fill="#94A3B8">（AOP 代理对象）</text>

  <rect x="470" y="46" width="180" height="56" rx="10" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.5"/>
  <text x="560" y="70" text-anchor="middle" font-size="13" fill="#E2E8F0">③ 查 Redis</text>
  <text x="560" y="90" text-anchor="middle" font-size="12" fill="#94A3B8">key = todo::1</text>

  <rect x="470" y="166" width="180" height="56" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.5"/>
  <text x="560" y="190" text-anchor="middle" font-size="13" fill="#E2E8F0">命中：直接返回</text>
  <text x="560" y="210" text-anchor="middle" font-size="12" fill="#94A3B8">方法体根本不执行</text>

  <rect x="250" y="166" width="180" height="56" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="340" y="190" text-anchor="middle" font-size="13" fill="#E2E8F0">未命中：执行方法</text>
  <text x="340" y="210" text-anchor="middle" font-size="12" fill="#94A3B8">真的去查数据库</text>

  <rect x="30" y="166" width="180" height="56" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="120" y="190" text-anchor="middle" font-size="13" fill="#E2E8F0">结果写入 Redis</text>
  <text x="120" y="210" text-anchor="middle" font-size="12" fill="#94A3B8">并设过期时间 TTL</text>

  <rect x="250" y="286" width="200" height="50" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="350" y="316" text-anchor="middle" font-size="13" fill="#E2E8F0">⑤ 返回给 Controller</text>

  <line x1="210" y1="74" x2="248" y2="74" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m09b)"/>
  <line x1="430" y1="74" x2="468" y2="74" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m09b)"/>
  <line x1="560" y1="102" x2="560" y2="164" stroke="#10B981" stroke-width="1.8" marker-end="url(#arr-m09b)"/>
  <text x="580" y="136" font-size="12" fill="#10B981">命中</text>
  <path d="M500,102 L500,132 L340,132 L340,164" fill="none" stroke="#F59E0B" stroke-width="1.8" marker-end="url(#arr-m09b)"/>
  <text x="512" y="126" font-size="12" fill="#F59E0B">未命中</text>
  <line x1="250" y1="194" x2="212" y2="194" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m09b)"/>
  <path d="M120,222 L120,258 L330,258 L330,284" fill="none" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m09b)"/>
  <path d="M560,222 L560,238 L370,238 L370,284" fill="none" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m09b)"/>

  <rect x="16" y="346" width="648" height="26" rx="6" fill="#1B2A44" stroke="#EF4444" stroke-width="1.2"/>
  <text x="340" y="363" text-anchor="middle" font-size="11.5" fill="#E2E8F0">@Cacheable 由 AOP 代理实现：同类内部 this.xxx() 自调用不经过代理，缓存不会生效</text>
</svg>`;

/* ---------------- 图解 3：缓存读写完整流程 ---------------- */

const SVG_CACHE_FLOW = `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m09c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="360" rx="12" fill="#0F1B2D"/>
  <text x="340" y="26" text-anchor="middle" font-size="16" fill="#E2E8F0">读流程：先查缓存 → 未命中才查库 → 回填 → 返回</text>

  <rect x="24" y="44" width="150" height="54" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="99" y="68" text-anchor="middle" font-size="12.5" fill="#E2E8F0">① 请求进来</text>
  <text x="99" y="88" text-anchor="middle" font-size="11.5" fill="#94A3B8">GET /api/todos/1</text>

  <rect x="214" y="44" width="150" height="54" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="289" y="68" text-anchor="middle" font-size="12.5" fill="#E2E8F0">② 先查 Redis</text>
  <text x="289" y="88" text-anchor="middle" font-size="11.5" fill="#94A3B8">todo:detail:1</text>

  <rect x="404" y="44" width="160" height="54" rx="10" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.5"/>
  <text x="484" y="68" text-anchor="middle" font-size="12.5" fill="#E2E8F0">③ 缓存里有吗？</text>
  <text x="484" y="88" text-anchor="middle" font-size="11.5" fill="#94A3B8">有值？是空值？</text>

  <rect x="404" y="148" width="160" height="54" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.5"/>
  <text x="484" y="172" text-anchor="middle" font-size="12.5" fill="#E2E8F0">有：直接返回</text>
  <text x="484" y="192" text-anchor="middle" font-size="11.5" fill="#94A3B8">一次数据库都不碰</text>

  <rect x="214" y="148" width="150" height="54" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="289" y="172" text-anchor="middle" font-size="12.5" fill="#E2E8F0">没有：查 MySQL</text>
  <text x="289" y="192" text-anchor="middle" font-size="11.5" fill="#94A3B8">todoMapper.select</text>

  <rect x="24" y="148" width="150" height="54" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.5"/>
  <text x="99" y="172" text-anchor="middle" font-size="12.5" fill="#E2E8F0">回填 Redis</text>
  <text x="99" y="192" text-anchor="middle" font-size="11.5" fill="#94A3B8">并设 TTL（防雪崩抖动）</text>

  <rect x="180" y="258" width="320" height="50" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="340" y="288" text-anchor="middle" font-size="13" fill="#E2E8F0">返回结果给前端（JSON）</text>

  <line x1="174" y1="71" x2="212" y2="71" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m09c)"/>
  <line x1="364" y1="71" x2="402" y2="71" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m09c)"/>
  <line x1="484" y1="98" x2="484" y2="146" stroke="#10B981" stroke-width="1.8" marker-end="url(#arr-m09c)"/>
  <text x="494" y="128" font-size="12" fill="#10B981">命中</text>
  <path d="M430,98 L430,122 L289,122 L289,146" fill="none" stroke="#F59E0B" stroke-width="1.8" marker-end="url(#arr-m09c)"/>
  <text x="352" y="116" font-size="12" fill="#F59E0B">未命中</text>
  <line x1="214" y1="175" x2="176" y2="175" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m09c)"/>
  <path d="M99,202 L99,228 L320,228 L320,256" fill="none" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m09c)"/>
  <path d="M484,202 L484,214 L370,214 L370,256" fill="none" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m09c)"/>

  <rect x="16" y="318" width="648" height="30" rx="6" fill="#1B2A44" stroke="#EF4444" stroke-width="1.2"/>
  <text x="340" y="338" text-anchor="middle" font-size="11.5" fill="#E2E8F0">写流程反过来：先更新数据库，再删除缓存（Cache Aside），不要先删缓存再改库</text>
</svg>`;

/* ---------------- 模块数据 ---------------- */

export const module: RawModule = {
  id: 'm09',
  order: 9,
  title: 'Redis 缓存',
  subtitle: '五大数据类型、Spring Boot 集成与缓存三兄弟',
  phase: 'phase3',
  phaseName: '阶段三 · 原理补课与进阶',
  icon: '⚡',
  cover: 'assets/img/m09-redis.jpg',
  minutes: 100,
  summary:
    '接口一旦上线，数据库就是最贵的那一环。这一模块给「待办清单 API」加一层 Redis 7 缓存：先在 Windows 上用 Docker 把它跑起来，用 redis-cli 认识 String/Hash/List/Set/ZSet 五种数据类型和 TTL；再用 spring-boot-starter-data-redis 接入 Spring Boot 3.2（注意配置前缀是 spring.data.redis），把待办列表和详情放进缓存；最后正面解决缓存穿透、击穿、雪崩三个经典问题，并守住「缓存与数据库一致」这条底线。',

  flashcards: [
    { front: 'Redis 的五大数据类型是哪五个？', back: 'String（字符串）、Hash（哈希）、List（列表）、Set（集合）、ZSet（有序集合）', tag: '概念' },
    { front: 'String 类型最典型的三个用途？', back: '缓存对象 JSON、计数器（INCR/DECR）、分布式锁占位（SET NX EX）', tag: '场景' },
    { front: 'Hash 适合什么场景？为什么不全用 String？', back: '对象需要按字段单独读写时用 Hash（购物车、用户资料），省去反序列化整个 JSON 再改一个字段的开销', tag: '场景' },
    { front: 'ZSet 和其他类型最大的区别是什么？', back: '每个成员带一个 score 并按 score 排序，适合排行榜、延迟队列；命令 ZADD / ZRANGE WITHSCORES', tag: '概念' },
    { front: '给一个 key 设置 60 秒过期，命令怎么写？', back: 'SET key value EX 60；已存在的 key 用 EXPIRE key 60；TTL key 查剩余秒数（-1 永不过期，-2 已不存在）', tag: '命令' },
    { front: 'Spring Boot 3 里 Redis 的配置前缀是什么？', back: 'spring.data.redis.host / port / password。Boot 2 的 spring.redis.* 在 Boot 3 已改前缀', tag: '配置' },
    { front: 'RedisTemplate 存进去的 key 变成乱码怎么办？', back: '默认用 JDK 序列化。改用 StringRedisTemplate，或显式配置 StringRedisSerializer + GenericJackson2JsonRedisSerializer', tag: '坑点' },
    { front: '缓存更新时，先改库还是先删缓存？', back: '先更新数据库，再删除缓存（Cache Aside）。先删缓存再改库，并发下旧数据可能被回写进去', tag: '坑点' },
    { front: '缓存穿透、击穿、雪崩怎么一句话区分？', back: '穿透=查根本不存在的 key；击穿=一个热点 key 恰好过期；雪崩=大批 key 在同一时刻集体过期', tag: '概念' },
    { front: '@Cacheable 写了却不生效，常见原因？', back: '同类内部 this.xxx() 自调用绕过 AOP 代理；方法不是 public；启动类忘了加 @EnableCaching', tag: '坑点' },
  ],

  lessons: [
    /* ============ 第 1 课 ============ */
    {
      id: 'm09-l01',
      title: '装起来：Redis 与五大数据类型',
      minutes: 30,
      goal: '在 Windows 上用 Docker 跑起 Redis 7，用 redis-cli 玩转五种数据类型并设置过期时间。',
      sections: [
        {
          type: 'text',
          html:
            '<p><strong>此刻你在项目的哪一步：</strong>待办清单 API 已经打包上线了，但每个请求都要走一次 MySQL：建连接、解析 SQL、扫索引、返回。对「待办列表」这种<strong>读多写少</strong>的数据，这是纯粹的浪费。</p>' +
            '<p>Redis 是一个把数据放在<strong>内存</strong>里的 key-value 存储，读写都是微秒级，比走磁盘的 MySQL 快一到两个数量级。把它放在 MySQL 前面当「挡箭牌」：能答的请求它先答了，答不上来再去麻烦数据库。</p>' +
            '<p>这一课不碰 Java，先用命令行把它玩明白——<strong>知道一个东西长什么样，再去集成它</strong>。</p>',
        },
        {
          type: 'fe',
          html:
            '<p><strong>前端视角：</strong>Redis 对你来说不陌生，它就是<strong>后端版的 localStorage</strong>——都是 key-value、都在内存里、都快。</p>' +
            '<ul><li><code>localStorage.setItem(k, v)</code> ≈ <code>SET k v</code></li>' +
            '<li><code>localStorage.getItem(k)</code> ≈ <code>GET k</code></li>' +
            '<li><code>localStorage.removeItem(k)</code> ≈ <code>DEL k</code></li></ul>' +
            '<p>两点关键差异要记住：① localStorage 只能存<strong>字符串</strong>，Redis 的值有<strong>五种结构</strong>；② localStorage 不会过期，Redis 的 key 可以设 <strong>TTL</strong>，到期自动消失——这正是缓存的灵魂。</p>',
        },
        {
          type: 'steps',
          title: 'Windows 上把 Redis 7 跑起来（推荐 Docker 方式）',
          items: [
            '确认 Docker Desktop 已启动（m10 会讲怎么装，这里先用起来）',
            '拉镜像并启动容器：<code>docker run -d --name redis7 -p 6379:6379 redis:7</code>',
            '确认容器活着：<code>docker ps</code>（STATUS 显示 Up 即可）',
            '进入命令行：<code>docker exec -it redis7 redis-cli</code>',
            '敲 <code>ping</code>，看到 <code>PONG</code> 就是通了',
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'Windows · PowerShell / CMD',
          code: `REM 最简启动：无需密码，本地开发够用
docker run -d --name redis7 -p 6379:6379 redis:7

REM 需要密码的写法（把密码作为参数传给 redis-server）
docker run -d --name redis7 -p 6379:6379 redis:7 redis-server --requirepass 123456

REM 看容器状态 / 停 / 启 / 删
docker ps
docker stop redis7
docker start redis7
docker rm -f redis7

REM 进入 redis-cli（-a 后面跟密码，没设密码就不用加）
docker exec -it redis7 redis-cli
docker exec -it redis7 redis-cli -a 123456`,
        },
        {
          type: 'tip',
          html:
            '<p><strong>不想装 Docker 的两个替代方案（Windows）：</strong></p>' +
            '<ul><li><strong>WSL2 + apt</strong>：在 Windows 的 Linux 子系统里 <code>sudo apt install redis-server</code>，然后 <code>redis-server --daemonize yes</code>，用起来最接近生产环境。</li>' +
            '<li><strong>Memurai</strong>：Redis 的 Windows 原生移植，装完就是一个 Windows 服务，适合完全不想碰 Linux/Docker 的情况；命令与 Redis 兼容。</li></ul>' +
            '<p>课程统一按 Docker 方式讲解，因为它与 m10 是同一套工具链，学会了后面直接复用。</p>',
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'redis-cli · 五种类型各来一组',
          code: `# 通用：确认活着
PING                       # → PONG

# ---- String：整体存一个值 ----
SET todo:1 "买菜"
GET todo:1                 # → "买菜"
INCR pv:home               # 计数器，自增 1
GET pv:home

# ---- Hash：对象的字段级存取 ----
HSET cart:1 title "买菜" done 0
HGET cart:1 title          # → "买菜"
HGETALL cart:1             # → 全部字段与值
HINCRBY cart:1 num 2       # 某个字段做数值自增

# ---- List：有序、可重复，像数组 ----
LPUSH queue:todo "A" "B"   # 从左边压入
RPUSH queue:todo "C"       # 从右边压入
LRANGE queue:todo 0 -1     # → 全部元素
LPOP queue:todo            # 弹出一个（可做队列）

# ---- Set：无序、自动去重 ----
SADD like:todo:1 u100 u200 u100
SMEMBERS like:todo:1       # → u100 u200（u100 只算一次）
SISMEMBER like:todo:1 u100 # → 1 表示存在
SCARD like:todo:1          # → 元素个数

# ---- ZSet：带 score 的有序集合 ----
ZADD rank:todo 100 "A" 80 "B" 60 "C"
ZRANGE rank:todo 0 -1 WITHSCORES     # 按 score 升序
ZREVRANGE rank:todo 0 9 WITHSCORES   # 降序取前 10（排行榜）`,
        },
        {
          type: 'diagram',
          caption: '五种数据类型：同一个 key，五种装法',
          svg: SVG_REDIS_TYPES,
        },
        {
          type: 'table',
          title: '五大数据类型速查',
          head: ['类型', '结构', '典型场景', '前端类比'],
          rows: [
            ['String', 'key → 字符串/数字/JSON', '缓存对象、计数器、分布式锁', 'localStorage 的 k-v'],
            ['Hash', 'key → {field: value}', '购物车、用户资料（改单个字段）', '普通对象 / Map'],
            ['List', 'key → 有序可重复序列', '队列、最新动态列表', '数组'],
            ['Set', 'key → 无序去重集合', '点赞、标签、共同好友（SINTER）', 'JS 的 Set'],
            ['ZSet', 'key → 带 score 的有序集合', '排行榜、延迟队列', '按 score 排序的数组'],
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'redis-cli · TTL 与过期（缓存的灵魂）',
          code: `# 写入的同时就设 60 秒过期（最常用）
SET todo:list "..." EX 60

# 老写法（等价，先写秒数再写值，老教程里常见）
SETEX todo:list 60 "..."

# 对已存在的 key 追加过期时间
EXPIRE todo:list 300

# 查看剩余秒数
TTL todo:list      # → 正数=剩余秒；-1=永不过期；-2=key 已不存在

# 取消过期，变成永久
PERSIST todo:list

# 其它高频命令
EXISTS todo:list   # → 1 存在 / 0 不存在
TYPE todo:list     # → 看这个 key 是什么类型
DEL todo:list      # 删除
KEYS todo:*        # 按模式找 key（生产环境请用 SCAN，KEYS 会阻塞）
FLUSHDB            # 清空当前库（仅本地玩，生产禁用）`,
        },
        {
          type: 'warn',
          html:
            '<p><strong>坑 1：连不上 Redis。</strong><code>redis-cli ping</code> 不返回 PONG 时，按顺序排查：</p>' +
            '<ul><li>容器真的在跑吗？<code>docker ps</code> 看 STATUS，没有就 <code>docker start redis7</code></li>' +
            '<li>端口映射写了吗？<code>docker run</code> 少了 <code>-p 6379:6379</code>，宿主机根本连不到容器里的端口</li>' +
            '<li>密码对不对？设了 requirepass 就要 <code>redis-cli -a 密码</code></li>' +
            '<li>服务器场景还要看 <code>bind</code> 与 <code>protected-mode</code>，以及防火墙是否放行 6379</li></ul>' +
            '<p><strong>坑 2：把 Redis 当数据库用。</strong>Redis 的数据默认在内存里，也没事务回滚能力。它应该<strong>随时可丢</strong>——丢了只是慢一点，不会丢数据。真正的账本还在 MySQL。</p>' +
            '<p><strong>坑 3：线上用 KEYS *</strong>。这个命令会遍历全部 key 并阻塞单线程的 Redis，几百万 key 时能卡死几秒。用 <code>SCAN 0 MATCH todo:* COUNT 100</code> 游标式扫描。</p>',
        },
        {
          type: 'tip',
          html:
            '<p><strong>本课产出物检查清单：</strong>① <code>docker ps</code> 能看到 redis7 在跑；② <code>redis-cli ping</code> 返回 PONG；③ 五种类型各写出并读回一条（<code>SET/HSET/LPUSH/SADD/ZADD</code>）；④ 能设过期并用 <code>TTL</code> 看到倒计时。</p>' +
            '<p>下一课：把 Redis 接进 Spring Boot，给待办列表真正加上缓存。</p>',
        },
      ],
      quiz: [
        {
          q: '要给一个好友排行榜功能选 Redis 类型，最合适的是？',
          options: ['String', 'Hash', 'List', 'ZSet'],
          answer: 3,
          explain:
            '<p>ZSet（有序集合）的每个成员都带一个 score 并按 score 排序，天然适合排行榜与延迟队列。用 ZADD 写入、ZREVRANGE ... WITHSCORES 取前 N 名。</p>',
        },
        {
          q: '执行 TTL mykey 返回 -2，表示什么？',
          options: ['还剩 2 秒过期', '永不过期', '这个 key 不存在', 'TTL 设置失败'],
          answer: 2,
          explain:
            '<p>TTL 返回值含义：正数 = 剩余秒数；-1 = 存在但没有设置过期时间（永久）；-2 = key 不存在。</p>',
        },
        {
          q: '关于 Redis 的定位，下面说法正确的是？',
          options: [
            'Redis 可以完全替代 MySQL 作为持久化数据库',
            'Redis 是缓存/中间件，数据应视为可丢失，真正的账本仍在 MySQL',
            'Redis 支持复杂 JOIN 查询，适合做报表',
            'Redis 只能存字符串',
          ],
          answer: 1,
          explain:
            '<p>Redis 的价值是快和丰富的数据结构，用于缓存、计数、排行榜、队列等。它不承担事务性账本角色，数据应视为可重建、可丢失。</p>',
        },
      ],
    },

    /* ============ 第 2 课 ============ */
    {
      id: 'm09-l02',
      title: 'Spring Boot 集成 Redis',
      minutes: 35,
      goal: '用 spring-boot-starter-data-redis 把 Redis 接进待办清单 API，给列表接口加上缓存并正确处理写操作。',
      sections: [
        {
          type: 'text',
          html:
            '<p>接入只需要三件事：<strong>加依赖、配地址、写代码</strong>。Spring Boot 的自动配置会帮你把连接池、序列化器、模板类都准备好，你直接注入就能用。</p>' +
            '<p>要认识两个模板类：</p>' +
            '<ul><li><strong>StringRedisTemplate</strong>：key 和 value 都是字符串，<strong>没有序列化坑</strong>，入门首选</li>' +
            '<li><strong>RedisTemplate&lt;String, Object&gt;</strong>：value 可以直接存对象，但<strong>必须自己配 JSON 序列化器</strong>，否则存进去是 JDK 二进制</li></ul>' +
            '<p>另外还有一套<strong>注解式缓存</strong>（<code>@Cacheable</code>），写起来最省事，但它是 AOP 实现，有几个必须知道的约束。</p>',
        },
        {
          type: 'code',
          lang: 'xml',
          filename: 'pom.xml · 加一个依赖',
          code: `<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>`,
        },
        {
          type: 'code',
          lang: 'yaml',
          filename: 'application.yml · 注意 Boot 3 的前缀',
          code: `spring:
  data:
    redis:
      host: localhost      # 容器部署时写服务名 redis
      port: 6379
      password:            # 没设密码就留空或删掉这一行
      database: 0
  cache:
    type: redis            # 用 Redis 作为 @Cacheable 的后端
    redis:
      time-to-live: 600s   # 注解式缓存的默认 TTL

# Spring Boot 2 的写法是 spring.redis.host，
# Spring Boot 3 已改为 spring.data.redis.host，抄旧教程会连不上。`,
        },
        {
          type: 'warn',
          html:
            '<p><strong>版本坑：配置前缀变了。</strong>很多老教程（Spring Boot 2.x）写的是 <code>spring.redis.host</code>，在 Boot 3.2 里<strong>完全不生效</strong>，应用会安安静静地连 localhost:6379，然后报连接失败。本项目统一用 <code>spring.data.redis.*</code>。</p>',
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'RedisConfig.java · 把 RedisTemplate 的序列化改成 JSON',
          code: `@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        // key 一律用字符串序列化，否则 redis-cli 里看到的是 \\xAC\\xED\\x00\\x05 这种二进制
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();

        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        return template;
    }
}`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TodoService.java · 手写缓存：待办列表',
          code: `@Service
public class TodoService {

    private static final String KEY_LIST = "todo:list";

    private final TodoMapper todoMapper;
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 构造器注入（IDEA 推荐写法，也方便单元测试）
    public TodoService(TodoMapper todoMapper, StringRedisTemplate redis) {
        this.todoMapper = todoMapper;
        this.redis = redis;
    }

    /** 读：先查缓存，未命中再查库并回填 */
    public List<TodoVO> list() {
        String cached = redis.opsForValue().get(KEY_LIST);
        if (cached != null) {
            try {
                return objectMapper.readValue(cached, new TypeReference<List<TodoVO>>() {});
            } catch (Exception e) {
                redis.delete(KEY_LIST);   // 缓存脏了就丢掉，走数据库
            }
        }
        List<TodoVO> list = todoMapper.selectList(null).stream()
                .map(TodoConverter::toVO)
                .toList();
        try {
            redis.opsForValue().set(KEY_LIST,
                    objectMapper.writeValueAsString(list),
                    Duration.ofMinutes(5));          // 一定要设 TTL
        } catch (Exception e) {
            // 缓存失败不能影响主流程
        }
        return list;
    }

    /** 写：先更新数据库，再删除缓存 */
    @Transactional
    public void create(TodoCreateDTO dto) {
        Todo todo = new Todo();
        todo.setTitle(dto.title());
        todoMapper.insert(todo);
        redis.delete(KEY_LIST);       // 不是更新缓存，而是删除它
    }
}`,
        },
        {
          type: 'text',
          html:
            '<p>注意 <code>create</code> 里那一行是 <code>redis.delete(KEY_LIST)</code> 而不是 <code>set</code>。这叫 <strong>Cache Aside</strong> 模式：写操作只删缓存，让下一次读自己重新回填。为什么要删而不是改？因为「改」要重新组装一份完整列表、还要处理并发下谁先谁后，而「删」永远是幂等且安全的。</p>' +
            '<p>顺序也必须是<strong>先改库、再删缓存</strong>。如果反过来（先删缓存、再改库），可能出现：缓存刚被删 → 另一个请求读进来发现没缓存 → 去数据库读到<strong>旧值</strong> → 把旧值写回缓存。于是数据库是新的、缓存是旧的，不一致会一直持续到下次过期。</p>',
        },
        {
          type: 'code',
          lang: 'java',
          filename: '注解式缓存：三行搞定待办详情',
          code: `@SpringBootApplication
@EnableCaching          // 1) 启动类上打开缓存开关
public class TodoApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(TodoApiApplication.class, args);
    }
}

@Service
public class TodoDetailService {

    // 2) 读方法：先查缓存，key = todo:detail:{id}
    @Cacheable(cacheNames = "todo", key = "'detail:' + #id")
    public TodoVO detail(Long id) {
        return todoMapper.selectById(id);   // 未命中才真的执行这里
    }

    // 3) 改完数据后踢掉这条缓存
    @CacheEvict(cacheNames = "todo", key = "'detail:' + #id")
    public void update(Long id, TodoUpdateDTO dto) { ... }

    // 4) 不知道会影响哪些 key 时，整组清掉
    @CacheEvict(cacheNames = "todo", allEntries = true)
    public void refreshAll() { ... }
}`,
        },
        {
          type: 'diagram',
          caption: '@Cacheable 背后的 AOP 代理流程',
          svg: SVG_CACHE_AOP,
        },
        {
          type: 'table',
          title: '三个缓存注解',
          head: ['注解', '作用', '执行时机'],
          rows: [
            ['@Cacheable', '先查缓存，命中直接返回（方法体不执行），未命中执行方法并把结果写入缓存', '方法调用前判断'],
            ['@CachePut', '每次都执行方法，并把结果写回缓存（用于强制刷新）', '方法执行后写入'],
            ['@CacheEvict', '删除缓存（可指定 key，或 allEntries=true 清空整组）', '方法执行后删除'],
          ],
        },
        {
          type: 'warn',
          html:
            '<p><strong>坑 1：存进去的 key 是乱码。</strong><code>redis-cli</code> 里 <code>KEYS *</code> 看到 <code>\\xAC\\xED\\x00\\x05t\\x00\\x03...</code>，说明用了 <code>RedisTemplate</code> 的默认 JDK 序列化。解法：要么改用 <code>StringRedisTemplate</code>，要么像上面 <code>RedisConfig</code> 那样显式配 <code>StringRedisSerializer</code> + <code>GenericJackson2JsonRedisSerializer</code>。</p>' +
            '<p><strong>坑 2：<code>@Cacheable</code> 写了却没生效。</strong>三个高频原因：① 启动类没加 <code>@EnableCaching</code>；② 方法不是 <code>public</code>；③ <strong>在同一个类里用 <code>this.xxx()</code> 自调用</strong>——这绕过了 AOP 代理，和 <code>@Transactional</code> 失效是同一个机理。解法是把被调用的方法拆到另一个 Service 里。</p>' +
            '<p><strong>坑 3：忘了设 TTL。</strong>没有过期时间的缓存就是「永久脏数据」。要么 <code>set(..., Duration)</code>，要么在 yml 里配 <code>spring.cache.redis.time-to-live</code>。</p>' +
            '<p><strong>坑 4：缓存异常把接口拖垮。</strong>Redis 挂了不应该导致整个接口 500。手写缓存时用 try-catch 包住 Redis 操作，保证「缓存失败降级为直接查库」。</p>',
        },
        {
          type: 'fe',
          html:
            '<p><strong>前端视角：</strong>这套东西你在前端写过无数遍——「请求前先看 Pinia 里有没有，有就直接用，没有就发请求再存进去」，这就是 <code>@Cacheable</code> 的手写版。</p>' +
            '<p>而 <code>@Cacheable</code> 本身 ≈ <strong>axios 拦截器 + 缓存装饰器</strong>：框架在方法外面套了一层代理，拦住调用，先问缓存。它之所以对自调用失效，是因为代理只作用于<strong>从外部进来的调用</strong>——你在类内部直接 <code>this.xxx()</code>，压根没经过那层代理。</p>',
        },
        {
          type: 'tip',
          html:
            '<p><strong>本课产出物检查清单：</strong>① 应用启动日志里没有 Redis 连接报错；② 第一次访问 <code>/api/todos</code> 慢，第二次明显变快（IDEA 里看 SQL 日志：第二次不再打印 SELECT）；③ <code>redis-cli</code> 里 <code>GET todo:list</code> 能看到人类可读的 JSON；④ 新增一条待办后，缓存被清掉，接口返回的是最新数据。</p>',
        },
      ],
      quiz: [
        {
          q: 'Spring Boot 3.2 里配置 Redis 地址，正确的 yml 写法是？',
          options: [
            'spring.redis.host: localhost',
            'spring.data.redis.host: localhost',
            'redis.host: localhost',
            'spring.datasource.redis.host: localhost',
          ],
          answer: 1,
          explain:
            '<p>Spring Boot 3 起 Redis 的配置前缀从 spring.redis.* 迁移到了 spring.data.redis.*，沿用 Boot 2 的旧写法不会报错但也不会生效。</p>',
        },
        {
          q: '更新数据时，推荐的缓存处理顺序是？',
          options: [
            '先删除缓存，再更新数据库',
            '先更新数据库，再删除缓存',
            '先更新缓存，再更新数据库',
            '同时更新，谁先谁后无所谓',
          ],
          answer: 1,
          explain:
            '<p>先删缓存再改库，并发下会有请求读到旧值并写回缓存，导致长期不一致。先改库再删缓存（Cache Aside）能把不一致窗口压到最小。</p>',
        },
        {
          q: '同一个 Service 里 methodA() 用 this.methodB() 调用带 @Cacheable 的 methodB，缓存会生效吗？',
          options: [
            '会，注解在方法上就一定生效',
            '不会，自调用绕过了 AOP 代理对象',
            '取决于是否加了 @EnableCaching',
            '只有方法声明为 public 时才生效',
          ],
          answer: 1,
          explain:
            '<p>@Cacheable 由 AOP 动态代理实现，只有通过代理对象的外部调用才会被拦截。类内部 this 调用直接走原对象，切面不会执行。解决方式是把 methodB 拆到另一个 Bean。</p>',
        },
      ],
    },

    /* ============ 第 3 课 ============ */
    {
      id: 'm09-l03',
      title: '缓存实战：穿透、击穿、雪崩',
      minutes: 35,
      goal: '区分缓存穿透/击穿/雪崩三个问题，并能给出对应解法，同时守住缓存与数据库一致性。',
      sections: [
        {
          type: 'text',
          html:
            '<p>加缓存不是终点，而是新问题的起点。三个经典故障总是被放在一起讲，因为它们的现象很像（数据库压力暴涨），但成因完全不同，解法也不同。<strong>先分清是哪一个，再谈怎么治。</strong></p>',
        },
        {
          type: 'diagram',
          caption: '带缓存的读流程与写流程（Cache Aside）',
          svg: SVG_CACHE_FLOW,
        },
        {
          type: 'table',
          title: '缓存三兄弟：一句话区分',
          head: ['问题', '一句话定义', '典型解法'],
          rows: [
            [
              '缓存穿透',
              '查询一个<strong>根本不存在</strong>的 key（比如 id=-1 或恶意刷不存在的 id），缓存永远不命中，请求全部打到数据库',
              '① 把空结果也缓存起来，并设<strong>较短</strong> TTL（如 60 秒）；② 布隆过滤器在缓存前先拦掉一定不存在的 key；③ 接口层做参数校验',
            ],
            [
              '缓存击穿',
              '一个<strong>热点 key 恰好过期</strong>的瞬间，成千上万的请求同时发现没缓存，一起涌向数据库',
              '① 互斥锁/分布式锁：只让一个线程去重建缓存，其余等待；② 逻辑过期：不设 TTL，把过期时间写在 value 里，由业务判断后异步刷新；③ 热点数据永不过期',
            ],
            [
              '缓存雪崩',
              '<strong>大批 key 在同一时刻集体过期</strong>（或 Redis 实例整体宕机），数据库瞬间承受全部流量',
              '① TTL 加随机抖动，如 基础TTL + random(0,300)s；② 多级缓存（本地 + Redis）；③ Redis 高可用（哨兵/集群）；④ 熔断限流兜底',
            ],
          ],
        },
        {
          type: 'text',
          html:
            '<p>记忆口诀：<strong>穿透 = 查了个不存在的；击穿 = 一个热点刚好过期；雪崩 = 一批同时过期。</strong></p>' +
            '<p>三者的共同点是「缓存没挡住，请求落到数据库」。区别在于<strong>没挡住的原因</strong>：压根没这条数据 / 这条数据的缓存刚失效 / 一大批缓存一起失效。</p>',
        },
        {
          type: 'code',
          lang: 'java',
          filename: '防穿透：把空值也缓存起来（短 TTL）',
          code: `public TodoVO detail(Long id) {
    String key = "todo:detail:" + id;
    String cached = redis.opsForValue().get(key);

    if (cached != null) {
        // 约定：空字符串代表"数据库里确实没有"，直接返回 null，不再查库
        return cached.isEmpty() ? null : objectMapper.readValue(cached, TodoVO.class);
    }

    TodoVO vo = todoMapper.selectById(id);

    if (vo == null) {
        // 关键：查不到也写缓存，但只存 60 秒
        // 这样恶意刷同一个不存在的 id 时，60 秒内只会打到数据库一次
        redis.opsForValue().set(key, "", Duration.ofSeconds(60));
        return null;
    }

    redis.opsForValue().set(key, objectMapper.writeValueAsString(vo), Duration.ofMinutes(10));
    return vo;
}`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: '防雪崩：TTL 加随机抖动',
          code: `// 反例：所有 key 都写死 300 秒 → 某次批量预热后，它们会在同一秒集体失效
redis.opsForValue().set(key, json, Duration.ofSeconds(300));

// 正例：基础 TTL + 随机抖动，过期时间自然打散
long ttl = 300 + ThreadLocalRandom.current().nextLong(0, 300);  // 300~600 秒
redis.opsForValue().set(key, json, Duration.ofSeconds(ttl));`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: '防击穿：分布式锁只让一个线程重建缓存',
          code: `public TodoVO detailWithLock(Long id) {
    String key = "todo:detail:" + id;
    String cached = redis.opsForValue().get(key);
    if (cached != null) return parse(cached);

    String lockKey = "lock:todo:detail:" + id;
    // SET key value NX EX 10：只有不存在时才设置成功，并自动 10 秒过期防死锁
    Boolean locked = redis.opsForValue()
            .setIfAbsent(lockKey, "1", Duration.ofSeconds(10));

    if (Boolean.TRUE.equals(locked)) {
        try {
            // 拿到锁的线程负责查库并回填，其余线程稍后直接读缓存
            TodoVO vo = todoMapper.selectById(id);
            redis.opsForValue().set(key, toJson(vo), Duration.ofMinutes(10));
            return vo;
        } finally {
            redis.delete(lockKey);
        }
    }

    // 没拿到锁：短暂等待后重试读缓存（生产上建议限制重试次数）
    Thread.sleep(50);
    return parse(redis.opsForValue().get(key));
}`,
        },
        {
          type: 'warn',
          html:
            '<p><strong>一致性红线：缓存和数据库不可能强一致，只能追求最终一致。</strong>接受这个前提，然后用纪律把不一致窗口压到最小：</p>' +
            '<ul><li><strong>顺序固定</strong>：先更新数据库，再删除缓存。</li>' +
            '<li><strong>一定要设 TTL</strong>：即使某次删除缓存失败，TTL 也是最后一道保险，脏数据最多活到过期。</li>' +
            '<li><strong>别缓存强一致数据</strong>：余额、库存这类要求精确的数据，要么不缓存，要么用数据库的原子操作（<code>UPDATE stock SET num = num - 1 WHERE num &gt; 0</code>）。</li>' +
            '<li><strong>删除失败要能感知</strong>：生产上会给删缓存加重试或消息队列兜底，入门阶段至少加日志。</li></ul>' +
            '<p><strong>另一个高频坑：空值缓存的 TTL 设太长。</strong>空值缓存是为了挡住穿透，但如果设成 10 分钟，那 10 分钟内用户真创建了这条数据也读不到。空值 TTL 一般 30~120 秒。</p>',
        },
        {
          type: 'compare',
          title: '三种缓存写入策略',
          head: ['策略', '做法', '评价'],
          rows: [
            ['Cache Aside（推荐）', '读：命中返回，未命中查库回填；写：改库后<strong>删除</strong>缓存', '最常用，实现简单，不一致窗口小'],
            ['Write Through', '写：先写缓存，缓存层负责同步写数据库', '一致性强，但要缓存层支持，实现复杂'],
            ['Write Behind', '写：只写缓存，异步批量落库', '性能最好，但可能丢数据，入门不用'],
          ],
        },
        {
          type: 'tip',
          html:
            '<p><strong>本课产出物检查清单：</strong>① 能不看资料说出穿透/击穿/雪崩的区别；② 待办详情接口对不存在的 id 只打一次数据库（观察 SQL 日志）；③ 所有写入缓存的地方都带了 TTL；④ 写操作是「改库 + 删缓存」这个顺序。</p>' +
            '<p><strong>贯穿项目收官预告：</strong>接口有缓存了，但部署还得手工装 JDK、装 Redis、传 jar。m10 用 Docker 把这一整套压成一条 <code>docker compose up -d</code>。</p>',
        },
      ],
      quiz: [
        {
          q: '恶意请求不断查询一个数据库中根本不存在的 id，导致请求全部落到数据库，这是？',
          options: ['缓存穿透', '缓存击穿', '缓存雪崩', '缓存预热'],
          answer: 0,
          explain:
            '<p>穿透的特点是"查的数据本身不存在"，所以缓存永远无法命中。常见解法是缓存空值（短 TTL）或在缓存前加布隆过滤。</p>',
        },
        {
          q: '某热点商品缓存过期的瞬间，上万请求同时打到数据库，这是？',
          options: ['缓存穿透', '缓存击穿', '缓存雪崩', '缓存污染'],
          answer: 1,
          explain:
            '<p>击穿是"单个热点 key 恰好失效"引发的瞬时并发回源。解法是互斥锁重建缓存、逻辑过期或热点数据不设过期。</p>',
        },
        {
          q: '防止缓存雪崩最直接有效的做法是？',
          options: [
            '把所有 key 的 TTL 都设成一样，方便管理',
            '给 TTL 加随机抖动，让过期时间打散',
            '把所有缓存都设为永不过期',
            '增加数据库的最大连接数',
          ],
          answer: 1,
          explain:
            '<p>雪崩的成因是"大批 key 同一时刻过期"。给 TTL 加上随机值（如 基础TTL + random(0,300)s）可以让过期时间自然分散，从根上避免集中失效。</p>',
        },
      ],
    },
  ],
};

export default module;
