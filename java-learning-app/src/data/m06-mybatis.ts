import type { RawModule } from '../types/course'

/**
 * m06 · 连接数据库 · MyBatis-Plus（4 课）
 *
 * 版本基线（全书统一，禁止混用）：
 *   JDK 17 + Spring Boot 3.2.x + MyBatis-Plus 3.5.x（Boot 3 必须用 mybatis-plus-spring-boot3-starter）
 *   + MySQL 8（驱动 com.mysql.cj.jdbc.Driver，依赖 mysql-connector-j，URL 必带 serverTimezone）
 * 贯穿项目「待办清单 API」：本模块把 m04 的内存版接口改成真实读写 todo_list 表。
 */

export const module: RawModule = {
  id: 'm06',
  order: 6,
  title: '连接数据库 · MyBatis-Plus',
  subtitle: '连接池原理、零 SQL CRUD 与条件构造器',
  phase: 'phase2',
  phaseName: '阶段二 · 写出完整后端',
  icon: '🔌',
  cover: 'assets/img/m06-mybatis.jpg',
  minutes: 150,
  summary:
    'Java 不直接「认识」MySQL，中间隔着 JDBC 规范和连接池。本模块先让你看懂连接是怎么建立和复用的，再用 MyBatis-Plus 把待办清单接口改成真实读写数据库：继承一个 BaseMapper 就拥有全套单表 CRUD，用 LambdaQueryWrapper 拼条件，用分页插件对接前端的 pageNum / pageSize。收尾的避坑清单讲 updateById 置空失效、SQL 注入、N+1 查询这些真实项目里的高频问题。',

  flashcards: [
    { front: '裸 JDBC 操作数据库的六步？', back: '注册驱动 → 取连接 → 建语句 → 执行 → 处理结果集 → 关闭资源。', tag: '语法' },
    { front: 'Spring Boot 默认的连接池是什么？', back: 'HikariCP，号称最快的 JDBC 连接池，Spring Boot 2/3 都默认集成，无需额外依赖。', tag: '配置' },
    { front: 'HikariCP 最大连接数怎么配？', back: 'spring.datasource.hikari.maximum-pool-size，默认 10。', tag: '配置' },
    { front: 'Boot 3 该用哪个 MP starter？', back: 'mybatis-plus-spring-boot3-starter；旧 starter 会导致自动配置不生效。', tag: '坑点' },
    { front: 'MySQL 8 的驱动类和依赖坐标？', back: '驱动 com.mysql.cj.jdbc.Driver；依赖坐标 mysql-connector-j。', tag: '配置' },
    { front: 'JDBC URL 里必须带哪个参数？', back: 'serverTimezone=Asia/Shanghai。不指定时区，DATETIME 字段会与本地时间差 8 小时。', tag: '坑点' },
    { front: 'BaseMapper 最常用的方法？', back: 'selectById / selectList / insert / updateById / deleteById。', tag: '语法' },
    { front: '分页插件怎么注册？', back: '注册 MybatisPlusInterceptor 并 addInnerInterceptor 分页插件。', tag: '配置' },
    { front: '为什么推荐 LambdaQueryWrapper？', back: '用 Todo::getTitle 方法引用代替字符串列名，字段改名或写错在编译期就报错，不会拖到运行时。', tag: '注解' },
    { front: '三个映射注解各管什么？', back: '@TableName 表名；@TableId 主键与生成策略；@TableLogic 逻辑删除。', tag: '注解' },
    { front: 'updateById 想把某字段清成 NULL，为什么改不成功？', back: 'updateById 默认跳过 null 字段（NOT_NULL 策略）。置空要用 LambdaUpdateWrapper 的 set 字句。', tag: '坑点' },
    { front: '#{} 与 ${} 的区别？', back: '#{} 预编译占位防 SQL 注入；${} 是字符串拼接，只用于动态表名/列名且必须白名单校验。', tag: '坑点' },
    { front: '什么是 N+1 查询问题？', back: '列表页循环里逐条 selectById：1 次列表查询 + N 次单条查询。修法是先收集 id 再一次 in 批量查询。', tag: '坑点' },
  ],

  lessons: [
    /* ============================ m06-l01 ============================ */
    {
      id: 'm06-l01',
      title: 'JDBC 与连接池原理',
      minutes: 30,
      goal: '搞清 Java 连数据库的最小链路，理解为什么必须有连接池。',
      sections: [
        {
          type: 'text',
          html: '<p><strong>JDBC（Java Database Connectivity）</strong>是 Java 访问数据库的一套标准接口：<code>Connection</code>、<code>PreparedStatement</code>、<code>ResultSet</code> 都只是接口，真正的实现由数据库厂商的<strong>驱动</strong>提供（MySQL 的驱动就是项目里的 <code>mysql-connector-j</code>）。这和你用 axios 不关心底层是 XHR 还是 fetch 是一个道理——换数据库只换驱动和 URL，业务代码不用改。</p><p>先看下裸 JDBC 长什么样。这段代码不用背，<strong>目的是让你感受痛点</strong>，后面 MyBatis-Plus 会把它们全包掉。</p>'
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'RawJdbcDemo.java · 裸 JDBC 查询（只需看痛点）',
          code: `public class RawJdbcDemo {
    public static void main(String[] args) throws Exception {
        Class.forName("com.mysql.cj.jdbc.Driver");   // 1. 注册驱动
        String url = "jdbc:mysql://localhost:3306/todo_db?serverTimezone=Asia/Shanghai&useSSL=false";
        try (Connection conn = DriverManager.getConnection(url, "root", "root1234");  // 2. 取连接
             PreparedStatement ps = conn.prepareStatement(                            // 3. 建语句
                     "SELECT id, title FROM todo_list WHERE completed = ?")) {
            ps.setInt(1, 0);
            try (ResultSet rs = ps.executeQuery()) {   // 4. 执行
                while (rs.next()) {                    // 5. 处理结果集
                    System.out.println(rs.getLong("id") + " - " + rs.getString("title"));
                }
            }
        }                                             // 6. try-with-resources 自动关闭
    }
}`
        },
        {
          type: 'text',
          html: '<p>痛点很明显：<strong>手写 SQL 字符串、逐个 <code>rs.getXxx()</code> 搬字段、到处 try-catch-finally 关资源</strong>。更要命的是第二步——<code>DriverManager.getConnection()</code> 每次都是<strong>真正新建一条 TCP 连接 + 走完 MySQL 的认证握手</strong>，耗时在毫秒级。如果你的接口 QPS 是 100，每次都新建连接，光握手就能把服务拖死。</p><p>解决办法就是<strong>连接池</strong>：启动时先建好 N 条连接放着，请求来了借一条、用完还回去，而不是每次新建。Spring Boot 默认集成的连接池是 <strong>HikariCP</strong>（以快著称），你只要配数据源，它就已经在里面了。</p>'
        },
        {
          type: 'diagram',
          caption: '连接池：借出去、还回来，而不是每次新建',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m06a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>
  <text x="24" y="34" fill="#E2E8F0" font-size="15" font-weight="600">HikariCP：应用启动时建好一批连接，请求用完归还，避免反复握手</text>

  <rect x="26" y="80" width="120" height="42" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="86" y="106" fill="#E2E8F0" font-size="13" text-anchor="middle">请求 A</text>
  <rect x="26" y="146" width="120" height="42" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="86" y="172" fill="#E2E8F0" font-size="13" text-anchor="middle">请求 B</text>
  <rect x="26" y="212" width="120" height="42" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="86" y="238" fill="#E2E8F0" font-size="13" text-anchor="middle">请求 C</text>
  <text x="86" y="274" fill="#94A3B8" font-size="11.5" text-anchor="middle">并发请求</text>

  <path d="M150,101 L226,101" stroke="#64B5F6" stroke-width="1.7" fill="none" marker-end="url(#arr-m06a)"/>
  <path d="M150,167 L226,167" stroke="#64B5F6" stroke-width="1.7" fill="none" marker-end="url(#arr-m06a)"/>
  <path d="M150,233 L226,233" stroke="#64B5F6" stroke-width="1.7" fill="none" marker-end="url(#arr-m06a)"/>
  <text x="160" y="93" fill="#94A3B8" font-size="11">借</text>
  <text x="160" y="159" fill="#94A3B8" font-size="11">借</text>
  <text x="160" y="225" fill="#94A3B8" font-size="11">借</text>
  <path d="M226,120 L150,120" stroke="#22D3EE" stroke-width="1.5" fill="none" stroke-dasharray="5 4" marker-end="url(#arr-m06a)"/>
  <text x="176" y="136" fill="#22D3EE" font-size="11">还</text>

  <rect x="230" y="56" width="200" height="212" rx="12" fill="#16233C" stroke="#F59E0B" stroke-width="1.8"/>
  <text x="330" y="80" fill="#F59E0B" font-size="13.5" font-weight="600" text-anchor="middle">HikariCP 连接池</text>

  <rect x="246" y="92" width="168" height="26" rx="6" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.3"/>
  <text x="330" y="109" fill="#E2E8F0" font-size="11.5" text-anchor="middle">连接 1 · 使用中</text>
  <rect x="246" y="124" width="168" height="26" rx="6" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.3"/>
  <text x="330" y="141" fill="#E2E8F0" font-size="11.5" text-anchor="middle">连接 2 · 使用中</text>
  <rect x="246" y="156" width="168" height="26" rx="6" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.3"/>
  <text x="330" y="173" fill="#E2E8F0" font-size="11.5" text-anchor="middle">连接 3 · 使用中</text>
  <rect x="246" y="188" width="168" height="26" rx="6" fill="#111A2C" stroke="#10B981" stroke-width="1.3"/>
  <text x="330" y="205" fill="#10B981" font-size="11.5" text-anchor="middle">连接 4 · 空闲</text>
  <rect x="246" y="220" width="168" height="26" rx="6" fill="#111A2C" stroke="#10B981" stroke-width="1.3"/>
  <text x="330" y="237" fill="#10B981" font-size="11.5" text-anchor="middle">连接 5 · 空闲</text>

  <path d="M434,150 L476,150" stroke="#64B5F6" stroke-width="1.7" fill="none" marker-end="url(#arr-m06a)"/>
  <rect x="480" y="110" width="150" height="80" rx="12" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.6"/>
  <text x="555" y="145" fill="#E2E8F0" font-size="14" text-anchor="middle">MySQL 8</text>
  <text x="555" y="166" fill="#94A3B8" font-size="11.5" text-anchor="middle">127.0.0.1:3306</text>
  <path d="M476,178 L434,178" stroke="#22D3EE" stroke-width="1.5" fill="none" stroke-dasharray="5 4" marker-end="url(#arr-m06a)"/>

  <rect x="26" y="280" width="628" height="44" rx="10" fill="#16233C" stroke="rgba(59,130,246,.35)"/>
  <text x="44" y="299" fill="#94A3B8" font-size="12">连接数用尽时，新请求会等待 connection-timeout（默认 30 秒），再拿不到就抛异常。</text>
  <text x="44" y="316" fill="#94A3B8" font-size="12">所以「接口突然变慢」时，要盯一下连接池。</text>
  <rect x="26" y="330" width="628" height="26" rx="10" fill="#16233C" stroke="rgba(245,158,11,.4)"/>
  <text x="44" y="347" fill="#F59E0B" font-size="12">前端类比：浏览器对同一域名最多并发 6 个 TCP 连接 + keep-alive 复用，连接池就是服务端的同款机制。</text>
</svg>`
        },
        {
          type: 'fe',
          html: '<p><strong>前端类比</strong>：连接池 ≈ 浏览器的 <strong>keep-alive 连接复用</strong> + 同域并发数限制。你不会为每个 fetch 都新建 TCP 连接（三次握手很贵），HTTP/1.1 默认复用连接；HikariCP 在服务端做了一模一样的事。另外，前端限制并发数、后端限制池大小，本质上都是「用有限的资源扛住无限的请求」。</p>'
        },
        {
          type: 'table',
          title: 'HikariCP 常用配置（spring.datasource.hikari.*）',
          head: ['配置项', '默认值', '说明'],
          rows: [
            ['maximum-pool-size', '10', '池中最大连接数，最常调的一个'],
            ['minimum-idle', '与 maximum 相同', '最小空闲连接，官方建议不要低于 maximum'],
            ['connection-timeout', '30000（ms）', '借连接的最长等待时间，超时报错'],
            ['idle-timeout', '600000（ms）', '空闲连接被回收的时间'],
            ['max-lifetime', '1800000（ms）', '连接的最长寿命，到期强制重建'],
            ['auto-commit', 'true', '是否自动提交（事务由 Spring 接管时不用管）'],
          ]
        },
        {
          type: 'code',
          lang: 'yaml',
          filename: 'application.yml · 数据源与连接池',
          code: `spring:
  datasource:
    # MySQL 8 的驱动类名，写错会报 "Cannot load driver class"
    driver-class-name: com.mysql.cj.jdbc.Driver
    # URL 三要素：协议 jdbc:mysql、地址端口库名、参数（serverTimezone 必带）
    url: jdbc:mysql://localhost:3306/todo_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
    username: root
    password: root1234
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000`
        },
        {
          type: 'warn',
          html: '<p><strong>报错 <code>Communications link failure</code></strong>：连不上数据库，按这个顺序查——① MySQL 服务起了吗（<code>sc query MySQL80</code> / <code>net start MySQL80</code>）；② 端口对不对（默认 3306）；③ 库名 <code>todo_db</code> 建了吗；④ 用户名密码对不对；⑤ 如果是 Linux/云服务器，还要看防火墙与安全组有没有放行。</p><p><strong>报错 <code>Cannot load driver class: com.mysql.jdbc.Driver</code></strong>：用了 MySQL 5 时代的旧类名。MySQL 8 一律写 <code>com.mysql.cj.jdbc.Driver</code>，依赖坐标也从 <code>mysql-connector-java</code> 改成 <code>mysql-connector-j</code>。</p><p><strong>时间差 8 小时</strong>：URL 没写 <code>serverTimezone=Asia/Shanghai</code>。这条在 m05 的 IDEA 连接配置里也遇到过，同一个根因。</p><p><strong>启动报 <code>Port 8080 was already in use</code></strong>：上一个 Spring Boot 进程没退干净。<code>netstat -ano | findstr :8080</code> 找到 PID，再 <code>taskkill /PID &lt;pid&gt; /F</code>；或者临时改端口 <code>server.port: 9090</code>。</p>'
        },
        {
          type: 'tip',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：环境层打通了。下一课开始，我们不用再自己写 <code>DriverManager</code> 这段样板代码——MyBatis-Plus 会接管连接获取、SQL 生成和结果集映射，你只写「查什么」。</p>'
        },
      ],
      quiz: [
        {
          q: '关于 JDBC，下面说法正确的是？',
          options: [
            'JDBC 是 MySQL 独有的 Java 客户端',
            'JDBC 是 Java 访问数据库的标准接口，具体实现由各厂商驱动提供',
            '用了 JDBC 就不需要连接池',
            'JDBC 只能执行查询，不能执行更新'
          ],
          answer: 1,
          explain: 'JDBC 定义的是 Connection / Statement / ResultSet 等接口，MySQL、PostgreSQL 各自提供驱动实现。换数据库只需换驱动 jar、驱动类名和 URL，Java 代码基本不变。'
        },
        {
          q: 'Spring Boot 3 项目中，默认的数据库连接池是？',
          options: ['Druid', 'HikariCP', 'C3P0', 'Tomcat JDBC Pool'],
          answer: 1,
          explain: 'Spring Boot 2.x 起默认使用 HikariCP（以性能著称），引入 spring-boot-starter-jdbc 或 MyBatis-Plus starter 后自动生效，无需额外依赖。Druid 需要手动引入。'
        },
        {
          q: 'JDBC URL 里漏写 serverTimezone=Asia/Shanghai，最可能出现什么现象？',
          options: [
            '连接直接失败，报 Communications link failure',
            '时间字段写入/读出与本地时间相差 8 小时',
            '中文变乱码',
            '索引失效'
          ],
          answer: 1,
          explain: '驱动会按 UTC 解释 DATETIME，导致与东八区差 8 小时。中文乱码是 characterEncoding 的问题，两者不要混。'
        },
      ],
    },

    /* ============================ m06-l02 ============================ */
    {
      id: 'm06-l02',
      title: 'MyBatis-Plus 接入：零 SQL 落库',
      minutes: 30,
      goal: '引入 MyBatis-Plus，把 /api/todos 接口改成真实读写 todo_list 表。',
      sections: [
        {
          type: 'text',
          html: '<p><strong>MyBatis</strong> 是持久层（DAO 层）框架，负责把 Java 对象和 SQL 记录互相映射，免掉手写 JDBC 那套样板代码。<strong>MyBatis-Plus（简称 MP）</strong>是在 MyBatis 之上的增强工具，官方定位是「只做增强不做改变」：你只要让 Mapper 接口继承 <code>BaseMapper&lt;T&gt;</code>，单表的增删改查<strong>一行 SQL 都不用写</strong>。</p>'
        },
        {
          type: 'compare',
          title: '概念对照：后端数据访问层 ↔ 前端 api 层',
          head: ['前端（Vue + TS）', '后端（Spring Boot + MP）', '说明'],
          rows: [
            ['src/api/todo.ts', 'TodoMapper 接口', '都是「数据出入口」的封装位置'],
            ['axios.get/post/put/delete', 'selectById / insert / updateById / deleteById', '一套开箱即用的请求方法'],
            ['手写 URL 与 params', 'LambdaQueryWrapper 拼条件', 'MP 帮你生成 SQL，不用拼字符串'],
            ['响应拦截器统一处理', '@RestControllerAdvice（m07）', '横切关注点统一收口'],
          ]
        },
        {
          type: 'code',
          lang: 'xml',
          filename: 'pom.xml · 两个依赖（Boot 3 专用 starter）',
          code: `<dependencies>
    <!-- Spring Boot 3 必须用这个 starter；写成 mybatis-plus-boot-starter 会导致自动配置不生效 -->
    <dependency>
        <groupId>com.baomidou</groupId>
        <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
        <version>3.5.5</version>
    </dependency>

    <!-- MySQL 8 驱动，运行期用即可 -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>`
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'Todo.java · 实体类（@Data 来自 Lombok，省掉 getter/setter）',
          code: `import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("todo_list")     // 类名 Todo 与表名 todo_list 不一致，必须显式指定
public class Todo {
    @TableId(type = IdType.AUTO)   // 对应数据库 AUTO_INCREMENT，不写会生成 19 位雪花 ID
    private Long id;
    private String title;
    private Integer completed;
    private Integer priority;
    private Long ownerId;          // 自动映射 owner_id（MP 默认开启驼峰转下划线）
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}`
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TodoMapper.java + 启动类',
          code: `// 1. Mapper 接口：继承 BaseMapper<Todo> 就拥有全套单表 CRUD，不用写实现
@Mapper
public interface TodoMapper extends BaseMapper<Todo> {
}

// 2. 启动类：@MapperScan 指定 Mapper 所在的包，漏了会注入失败
@MapperScan("com.example.todo.mapper")
@SpringBootApplication
public class TodoApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(TodoApiApplication.class, args);
    }
}`
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TodoController.java · 临时版本（m07 会重构成三层）',
          code: `@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoMapper todoMapper;

    // 构造器注入：IDEA 会对字段注入 @Autowired 提示 "Field injection is not recommended"
    public TodoController(TodoMapper todoMapper) {
        this.todoMapper = todoMapper;
    }

    @GetMapping
    public List<Todo> list() {
        return todoMapper.selectList(null);   // 条件为 null = 查全表
    }

    @GetMapping("/{id}")
    public Todo detail(@PathVariable Long id) {
        return todoMapper.selectById(id);
    }

    @PostMapping
    public String create(@RequestBody Todo todo) {
        todoMapper.insert(todo);              // 插入后 todo.getId() 会回填自增主键
        return "ok";
    }

    @PutMapping("/{id}")
    public String update(@PathVariable Long id, @RequestBody Todo todo) {
        todo.setId(id);
        todoMapper.updateById(todo);          // 字段为 null 时不更新该列
        return "ok";
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        todoMapper.deleteById(id);
        return "ok";
    }
}`
        },
        {
          type: 'text',
          html: '<p><code>BaseMapper&lt;Todo&gt;</code> 白送给你的方法里，这几个最常用：<code>selectById(id)</code> 按主键查、<code>selectList(wrapper)</code> 按条件查列表、<code>selectCount(wrapper)</code> 数条数、<code>insert(po)</code> 新增、<code>updateById(po)</code> 按主键改、<code>deleteById(id)</code> 删除、<code>selectPage(page, wrapper)</code> 分页。</p><p>有三个<strong>必须知道的行为细节</strong>：</p><ul><li><strong>insert 之后主键会回填到对象</strong>：<code>todoMapper.insert(todo)</code> 执行完，<code>todo.getId()</code> 就有值了（MP 会取回自增 ID 塞回实体）。</li><li><strong>updateById 只更新非 null 字段</strong>：实体里某字段是 null，MP 就当「不改这一列」。想把它清空必须用 UpdateWrapper，别指望传 null 生效。</li><li><strong>selectList(null) 就是不带条件</strong>：参数传 null 等价于查全表，调试时方便，但正式接口一定要带上分页。</li></ul><p>最后提醒：<strong>MP 只能免掉单表 CRUD 的 SQL</strong>。多表 JOIN、复杂统计、批量更新这些该写 SQL 还是得写（用注解 <code>@Select</code> 或 XML）。它替代的是样板代码，不是你对 SQL 的理解——m05 学的那些，一个字都用得上。</p>'
        },
        {
          type: 'diagram',
          caption: '一次查询的完整链路：从 HTTP 请求到 MySQL 再原路返回',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m06b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>
  <text x="24" y="36" fill="#E2E8F0" font-size="15" font-weight="600">请求进来落在数据库，结果原路返回——每一层只做自己那一件事</text>

  <rect x="15" y="90" width="130" height="52" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="80" y="110" fill="#E2E8F0" font-size="13.5" text-anchor="middle">前端 / axios</text>
  <text x="80" y="128" fill="#94A3B8" font-size="11.5" text-anchor="middle">HTTP GET</text>

  <rect x="175" y="90" width="130" height="52" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="240" y="110" fill="#E2E8F0" font-size="13.5" text-anchor="middle">Controller</text>
  <text x="240" y="128" fill="#94A3B8" font-size="11.5" text-anchor="middle">@RestController</text>

  <rect x="335" y="90" width="130" height="52" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="400" y="110" fill="#E2E8F0" font-size="13.5" text-anchor="middle">Service</text>
  <text x="400" y="128" fill="#94A3B8" font-size="11.5" text-anchor="middle">@Service</text>

  <rect x="495" y="90" width="130" height="52" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="560" y="110" fill="#E2E8F0" font-size="13.5" text-anchor="middle">Mapper</text>
  <text x="560" y="128" fill="#94A3B8" font-size="11.5" text-anchor="middle">extends BaseMapper</text>

  <rect x="495" y="228" width="130" height="52" rx="10" fill="#16233C" stroke="#22D3EE" stroke-width="1.6"/>
  <text x="560" y="248" fill="#E2E8F0" font-size="13.5" text-anchor="middle">MyBatis-Plus</text>
  <text x="560" y="266" fill="#94A3B8" font-size="11.5" text-anchor="middle">生成 SQL + 映射</text>

  <rect x="335" y="228" width="130" height="52" rx="10" fill="#16233C" stroke="#22D3EE" stroke-width="1.6"/>
  <text x="400" y="248" fill="#E2E8F0" font-size="13.5" text-anchor="middle">JDBC + HikariCP</text>
  <text x="400" y="266" fill="#94A3B8" font-size="11.5" text-anchor="middle">借连接 / 归还</text>

  <rect x="175" y="228" width="130" height="52" rx="10" fill="#16233C" stroke="#10B981" stroke-width="1.6"/>
  <text x="240" y="248" fill="#E2E8F0" font-size="13.5" text-anchor="middle">MySQL 8</text>
  <text x="240" y="266" fill="#94A3B8" font-size="11.5" text-anchor="middle">todo_list 表</text>

  <rect x="15" y="228" width="130" height="52" rx="10" fill="#16233C" stroke="#F59E0B" stroke-width="1.6"/>
  <text x="80" y="248" fill="#E2E8F0" font-size="13.5" text-anchor="middle">返回 JSON</text>
  <text x="80" y="266" fill="#94A3B8" font-size="11.5" text-anchor="middle">Jackson 序列化</text>

  <path d="M150,116 L172,116" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m06b)"/>
  <path d="M310,116 L332,116" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m06b)"/>
  <path d="M470,116 L492,116" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m06b)"/>
  <path d="M560,146 L560,224" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m06b)"/>
  <path d="M492,254 L468,254" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m06b)"/>
  <path d="M332,254 L308,254" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m06b)"/>
  <path d="M172,254 L148,254" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m06b)"/>
  <path d="M80,226 L80,146" stroke="#22D3EE" stroke-width="1.8" fill="none" stroke-dasharray="5 4" marker-end="url(#arr-m06b)"/>

  <text x="608" y="196" fill="#94A3B8" font-size="11">方法调用</text>
  <text x="418" y="240" fill="#94A3B8" font-size="11">TCP 3306</text>
  <text x="88" y="196" fill="#22D3EE" font-size="11">结果集</text>

  <rect x="15" y="284" width="650" height="62" rx="10" fill="#16233C" stroke="rgba(59,130,246,.35)"/>
  <text x="32" y="304" fill="#94A3B8" font-size="12">记住这条链：Controller 接参数 → Service 写业务 → Mapper 只管数据 →</text>
  <text x="32" y="321" fill="#94A3B8" font-size="12">MP 生成 SQL → JDBC/Hikari 发到 MySQL。</text>
  <text x="32" y="339" fill="#94A3B8" font-size="12">本模块先把 Controller 直连 Mapper 跑通（能落库），m07 再补上 Service 层与统一返回、异常处理。</text>
</svg>`
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '启动并验证（Windows / PowerShell）',
          code: `# 方式一：Maven 插件启动（改代码后重启即可）
mvn spring-boot:run

# 方式二：IDEA 里右键 TodoApiApplication → Run 'TodoApiApplication'

# 验证（PowerShell 里 curl 是 curl.exe 的别名，CMD 里直接用 curl）
curl.exe http://localhost:8080/api/todos

# 新增一条，数据会真的写进 todo_list 表
curl.exe -X POST http://localhost:8080/api/todos ^
  -H "Content-Type: application/json" ^
  -d "{\\"title\\":\\"接入 MyBatis-Plus\\",\\"completed\\":0,\\"priority\\":1}"`
        },
        {
          type: 'warn',
          html: '<p><strong>用错 starter 是 Boot 3 的头号坑</strong>：必须是 <code>mybatis-plus-spring-boot3-starter</code>（3.5.5+）。沿用旧资料里的 <code>mybatis-plus-boot-starter</code> 会出现自动配置不生效、Mapper 注入为 null 等诡异现象。</p><p><strong><code>No qualifying bean of type \'TodoMapper\'</code></strong>：Mapper 没被扫描到。检查① 启动类的 <code>@MapperScan("com.example.todo.mapper")</code> 路径是否与实际包一致；② Mapper 接口上有没有 <code>@Mapper</code>；③ 启动类所在包是否是Mapper 包的父包。</p><p><strong>看不到执行的 SQL</strong>：开发期一定要开日志，否则排错全靠猜。在 <code>application.yml</code> 里加 <code>mybatis-plus.configuration.log-impl: org.apache.ibatis.logging.stdout.StdOutImpl</code>，控制台就会打印完整 SQL 与参数。</p><p><strong>插入后 id 是 19 位长数字</strong>：<code>@TableId</code> 没写 <code>type = IdType.AUTO</code>，MP 默认用雪花算法生成 ID，而数据库设的是自增。</p>'
        },
        {
          type: 'fe',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：贯穿项目完成了一次质变——<code>/api/todos</code> 不再是内存里的假数据，POST 一条数据，重启应用它还在（去 IDEA 面板看 <code>todo_list</code> 表就知道了）。但现在的写法有个明显问题：Controller 直接调 Mapper，业务逻辑一旦复杂就全堆在接口类里。这正是 m07 要解决的事情。</p>'
        },
      ],
      quiz: [
        {
          q: 'Spring Boot 3.2 项目接入 MyBatis-Plus，应该用哪个依赖？',
          options: [
            'mybatis-plus-boot-starter',
            'mybatis-plus-spring-boot3-starter（3.5.5+）',
            'mybatis-spring-boot-starter',
            'spring-boot-starter-data-jpa'
          ],
          answer: 1,
          explain: 'Boot 3 全面迁移到 Jakarta 命名空间，MP 从 3.5.5 起提供 Boot 3 专用 starter。沿用旧的 mybatis-plus-boot-starter 会导致自动配置不生效。'
        },
        {
          q: '启动报 "No qualifying bean of type TodoMapper"，最可能的原因是？',
          options: [
            '没写 application.yml',
            '@MapperScan 路径写错或漏配，Mapper 没被扫描进容器',
            'todo_list 表不存在',
            'MySQL 服务没启动'
          ],
          answer: 1,
          explain: '这是 MP 入门第一坑：Mapper 接口是接口，Spring 需要靠 @MapperScan（或接口上的 @Mapper）生成代理实现并注册为 Bean。路径写错、漏配、包不在扫描范围内都会导致注入失败。'
        },
        {
          q: '实体类上 @TableId 不指定 type，而数据库主键是 AUTO_INCREMENT，会发生什么？',
          options: [
            '插入失败报主键冲突',
            'MP 用雪花算法生成 19 位 ID 再插入，与自增策略不一致',
            '自动识别为自增，没有任何问题',
            '主键为 null'
          ],
          answer: 1,
          explain: 'MP 默认 IdType 是 ASSIGN_ID（雪花）。数据库用自增时必须显式写 @TableId(type = IdType.AUTO)，否则插入的 id 会是 19 位长数字。反之若用 AUTO 但表不是自增，则会主键冲突。'
        },
      ],
    },

    /* ============================ m06-l03 ============================ */
    {
      id: 'm06-l03',
      title: '条件构造器与分页',
      minutes: 30,
      goal: '用 LambdaQueryWrapper 拼动态条件，用分页插件对接前端的 pageNum / pageSize。',
      sections: [
        {
          type: 'text',
          html: '<p>前端的列表接口从来不是「查全表」，而是一堆可选条件：状态、关键字、时间范围。<code>selectList(null)</code> 显然不够用，但又不可能为每个条件组合手写一条 SQL。MP 的答案是<strong>条件构造器 Wrapper</strong>：用链式方法拼条件，由 MP 生成最终 SQL。</p><p>两种写法：<code>QueryWrapper</code> 用字符串列名（<code>"title"</code>，写错了运行时才炸），<code>LambdaQueryWrapper</code> 用方法引用（<code>Todo::getTitle</code>，写错编译期就报错）。<strong>一律用 Lambda 版</strong>——前端同学对 TS 的类型保护最有感情，这就是同一个好处。</p>'
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'MybatisPlusConfig.java · 注册分页插件（少了它分页是坏的）',
          code: `import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MybatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // DbType.MYSQL 决定生成的分页方言（MySQL 用 LIMIT）
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}`
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TodoController.java · 带条件与分页的列表接口',
          code: `@GetMapping
public Map<String, Object> list(
        @RequestParam(required = false) Integer completed,
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "1") long pageNum,
        @RequestParam(defaultValue = "10") long pageSize) {

    // 第一个参数是 boolean，为 false 时该条件不拼进 SQL —— 动态 SQL 的关键写法
    LambdaQueryWrapper<Todo> q = new LambdaQueryWrapper<Todo>()
            .eq(completed != null, Todo::getCompleted, completed)
            .like(keyword != null && !keyword.isBlank(), Todo::getTitle, keyword)
            .orderByDesc(Todo::getCreatedAt)
            .orderByDesc(Todo::getId);

    Page<Todo> page = new Page<>(pageNum, pageSize);   // current 从 1 开始
    Page<Todo> result = todoMapper.selectPage(page, q);

    // 组装成前端熟悉的结构
    return Map.of(
            "list", result.getRecords(),
            "total", result.getTotal(),
            "pageNum", result.getCurrent(),
            "pageSize", result.getSize()
    );
}`
        },
        {
          type: 'warn',
          html: '<p><strong><code>Map.of</code> 不接受 null 值</strong>：上面组装返回体时，如果 <code>result.getTotal()</code> 抛了 NPE，或者任何 value 为 null，<code>Map.of</code> 会直接抛 <code>NullPointerException</code>（它内部用数组存键值对，不允许 null key/value）。这个坑常被误诊成「分页插件没生效」，请务必分清两者：</p><ul><li><strong>分页插件没注册</strong> → <code>total</code> 是 <strong>0</strong>，<code>records</code> 返回<strong>全部数据</strong>，接口正常返回 200，什么都不报错；</li><li><strong><code>Map.of</code> 撞 null</strong> → 直接抛 <code>NullPointerException</code>，接口返回 500，<strong>并且异常发生在 Java 端、SQL 根本没执行完</strong>。</li></ul><p>也就是说：一个「total 是 0」是插件问题，一个「500 + 空指针」才是 <code>Map.of</code> 的问题。生产代码里更稳的做法是用 <code>LinkedHashMap</code> 或 m07 马上要讲的 <code>Result&lt;T&gt;</code> 记录类，它们允许 null value。</p><p><strong>另外注意返回顺序</strong>：这里返回的是裸 <code>Map</code>，字段名靠字符串约定，和 m04 那个直接返回 <code>List</code> 的写法一样属于「临时形态」。m07-l03 会把它改成统一的 <code>Result&lt;T&gt;</code> 信封（带 code / msg / data），接口契约就固定下来了。</p>'
        },
        {
          type: 'table',
          title: 'LambdaQueryWrapper 常用方法 ↔ SQL',
          head: ['方法', '生成的 SQL 片段', '前端参数对照'],
          rows: [
            ['.eq(Todo::getCompleted, 0)', 'completed = 0', 'completed=0'],
            ['.ne(...)', '&lt;&gt;（不等于）', 'status!=1'],
            ['.like(Todo::getTitle, "买")', "title LIKE '%买%'", 'keyword=买'],
            ['.likeRight(Todo::getTitle, "买")', "title LIKE '买%'", '前缀搜索，能走索引'],
            ['.in(Todo::getPriority, List.of(1,2))', 'priority IN (1,2)', 'priority=1,2'],
            ['.between(Todo::getCreatedAt, s, e)', 'created_at BETWEEN s AND e', 'start &amp; end'],
            ['.orderByDesc(Todo::getCreatedAt)', 'ORDER BY created_at DESC', 'sort=created_at,desc'],
            ['.last("LIMIT 10")', 'LIMIT 10', '谨慎使用，绕过分页插件'],
          ]
        },
        {
          type: 'diagram',
          caption: '分页是怎么自动完成的：一条 selectPage 触发两条 SQL',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m06c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>
  <text x="24" y="34" fill="#E2E8F0" font-size="15" font-weight="600">selectPage 背后：先 COUNT 拿总数，再 LIMIT 取当前页</text>

  <rect x="30" y="56" width="184" height="52" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="122" y="78" fill="#E2E8F0" font-size="13" text-anchor="middle">前端请求</text>
  <text x="122" y="97" fill="#94A3B8" font-size="11.5" text-anchor="middle">pageNum=2 &amp; size=10</text>

  <rect x="248" y="56" width="170" height="52" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="333" y="78" fill="#E2E8F0" font-size="13" text-anchor="middle">Controller</text>
  <text x="333" y="97" fill="#94A3B8" font-size="11.5" text-anchor="middle">@RequestParam</text>

  <rect x="452" y="56" width="190" height="52" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.8"/>
  <text x="547" y="78" fill="#E2E8F0" font-size="13" text-anchor="middle">new Page&lt;&gt;(2, 10)</text>
  <text x="547" y="97" fill="#94A3B8" font-size="11.5" text-anchor="middle">current 从 1 开始</text>

  <path d="M218,82 L244,82" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m06c)"/>
  <path d="M422,82 L448,82" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m06c)"/>

  <rect x="452" y="134" width="190" height="46" rx="10" fill="#16233C" stroke="#22D3EE" stroke-width="1.6"/>
  <text x="547" y="154" fill="#E2E8F0" font-size="13" text-anchor="middle">分页插件拦截</text>
  <text x="547" y="172" fill="#94A3B8" font-size="11.5" text-anchor="middle">自动改写 SQL</text>
  <path d="M547,112 L547,130" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m06c)"/>

  <rect x="40" y="204" width="270" height="46" rx="10" fill="#111A2C" stroke="#10B981" stroke-width="1.6"/>
  <text x="175" y="224" fill="#10B981" font-size="12.5" text-anchor="middle">SELECT COUNT(*) FROM todo_list WHERE ...</text>
  <text x="175" y="242" fill="#94A3B8" font-size="11.5" text-anchor="middle">得到 total = 37</text>

  <rect x="350" y="204" width="292" height="46" rx="10" fill="#111A2C" stroke="#10B981" stroke-width="1.6"/>
  <text x="496" y="224" fill="#10B981" font-size="12.5" text-anchor="middle">SELECT ... LIMIT 10, 10</text>
  <text x="496" y="242" fill="#94A3B8" font-size="11.5" text-anchor="middle">offset = (2-1) x 10</text>

  <path d="M520,182 L200,200" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m06c)"/>
  <path d="M570,182 L490,200" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m06c)"/>

  <rect x="120" y="278" width="440" height="52" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.6"/>
  <text x="340" y="298" fill="#E2E8F0" font-size="13" text-anchor="middle">Page&lt;Todo&gt; 结果对象</text>
  <text x="340" y="317" fill="#94A3B8" font-size="11.5" text-anchor="middle">records = 当前页数据 ｜ total = 总数 ｜ pages = 总页数 ｜ current / size</text>

  <path d="M180,254 L280,274" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m06c)"/>
  <path d="M490,254 L400,274" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m06c)"/>
</svg>`
        },
        {
          type: 'text',
          html: '<p>注意上面那段代码里的第一个参数：<code>.eq(completed != null, Todo::getCompleted, completed)</code>。MP 的条件方法几乎都提供<strong>带开关的重载</strong>——第一个 boolean 为 false 时，这个条件根本不会拼进 SQL。这就是 MP 版的「动态 SQL」：前端不传这个参数，SQL 里就没有这个条件，不需要你手写 <code>&lt;if test="..."&gt;</code> 那种 XML 判断。</p><p>另外三个容易踩的点：</p><ul><li><strong>Wrapper 不要复用</strong>：它是有状态的对象，拼过一次条件后再拿去查，条件会叠加。每次查询新建。</li><li><strong>只要数量就别查列表</strong>：<code>selectCount(wrapper)</code> 只执行 <code>COUNT(*)</code>，别用 <code>selectList</code> 拉回整表再 <code>.size()</code>——那等于把整张表搬进内存。</li><li><strong>分页接口记得设上限</strong>：<code>pageSize</code> 要限制最大值（比如 ≤ 100），否则前端传个 <code>size=100000</code> 就能把你的服务打挂。这是很朴素的防御，但真的有人忘了。</li></ul><p>深分页（翻到第几千页）在 MP 里同样是慢的，因为插件生成的还是 <code>LIMIT offset, size</code>。真遇到这个需求，回到 m05-l03 的「游标分页」思路：<code>.gt(Todo::getId, lastId)</code> 配合固定 size。</p>'
        },
        {
          type: 'compare',
          title: '前端分页参数 ↔ MyBatis-Plus 分页对象',
          head: ['前端（Vue + TS）', '后端（MP）', '注意点'],
          rows: [
            ['pageNum / page（从 1 开始）', 'Page 的 current（从 1 开始）', '两者一致，直接传即可'],
            ['pageSize / size', 'Page 的 size', '注意别写成 limit'],
            ['后台返回 list', 'result.getRecords()', '当前页数据列表'],
            ['后台返回 total', 'result.getTotal()', '总条数，给分页器用'],
            ['axios params: {pageNum, pageSize}', '@RequestParam 接收', '默认值用 defaultValue 兜底'],
          ]
        },
        {
          type: 'warn',
          html: '<p><strong>分页插件没注册 = 静默出错</strong>：<code>selectPage</code> 不报错，但 <code>total</code> 恒为 0、<code>records</code> 返回全部数据。这是最难的坑，因为「看起来能跑」。只要用到分页，先确认 <code>MybatisPlusInterceptor</code> 那个 <code>@Bean</code> 存在。</p><p><strong><code>like</code> 传了 null 或空串</strong>：会拼出 <code>LIKE \'%%\'</code> 命中全表。用重载的第一个参数做开关：<code>.like(StringUtils.hasText(keyword), Todo::getTitle, keyword)</code>。</p><p><strong><code>orderBy</code> 与索引没对上</strong>：排序字段不在索引里时，MySQL 要做 filesort（EXPLAIN 的 Extra 会写 <code>Using filesort</code>），数据量大时明显变慢——回到 m05-l04 的联合索引 <code>(completed, created_at)</code> 就是为这个场景准备的。</p>'
        },
        {
          type: 'fe',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：待办清单的列表接口已经具备真实项目该有的样子——支持按状态过滤、按关键字模糊搜索、按创建时间倒序、真分页。m07 会把这一堆拼装逻辑从 Controller 挪进 Service，并给返回值套上统一的信封。</p>'
        },
      ],
      quiz: [
        {
          q: '分页插件没有注册，调用 selectPage 会出现什么现象？',
          options: [
            '启动直接报错',
            '不报错，但 total 为 0 且 records 返回全部数据',
            '返回空列表',
            'LIMIT 语句报错'
          ],
          answer: 1,
          explain: '分页能力由 MybatisPlusInterceptor + PaginationInnerInterceptor 提供。没注册时插件不会改写 SQL，查询退化成全量查询且总数统计不到，却没有任何报错，极难自查。'
        },
        {
          q: '为什么推荐 LambdaQueryWrapper 而不是 QueryWrapper？',
          options: [
            'LambdaQueryWrapper 性能更好',
            '用 Todo::getTitle 方法引用，字段写错或改名在编译期就能发现',
            'QueryWrapper 在 MP 3.5 已被移除',
            '只有 Lambda 版支持分页'
          ],
          answer: 1,
          explain: 'QueryWrapper 用字符串列名（"title"），拼错只能等运行时报 Unknown column；LambdaQueryWrapper 用方法引用，IDE 能补全、改名能重构、写错编译不过。'
        },
        {
          q: '前端传 pageNum=3、pageSize=10，构造 Page 对象正确的是？',
          options: ['new Page<>(2, 10)', 'new Page<>(3, 10)', 'new Page<>(30, 10)', 'new Page<>(3, 30)'],
          answer: 1,
          explain: 'Page 的第一个参数 current 就是页码且从 1 开始，与前端 pageNum 语义一致，直接传即可；offset 由插件自动计算成 (3-1)*10 = 20。'
        },
      ],
    },

    /* ============================ m06-l04 ============================ */
    {
      id: 'm06-l04',
      title: '实体类与表的映射细节',
      minutes: 30,
      goal: '掌握 @TableName / @TableId / @TableField、驼峰映射、逻辑删除与自动填充。',
      sections: [
        {
          type: 'text',
          html: '<p>MP 的核心约定是<strong>约定优于配置</strong>：类名驼峰转下划线当表名（<code>Todo</code> → <code>todo</code>），字段名驼峰转下划线当列名（<code>createdAt</code> → <code>created_at</code>），字段名叫 <code>id</code> 就当主键。只有当现实不服从约定时，才用注解纠正——所以你会看到我们的实体只写了少数几个注解。</p>'
        },
        {
          type: 'code',
          lang: 'sql',
          filename: '先给表加一个逻辑删除字段',
          code: `ALTER TABLE todo_list
  ADD COLUMN deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0=未删除 1=已删除' AFTER owner_id;`
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'Todo.java · 完整映射版',
          code: `import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("todo_list")                 // 类名与表名不一致时必写
public class Todo {

    @TableId(type = IdType.AUTO)        // 数据库自增；ASSIGN_ID 是雪花，ASSIGN_UUID 是 UUID
    private Long id;

    private String title;

    private Integer completed;

    private Integer priority;

    private Long ownerId;               // ownerId <-> owner_id，驼峰映射自动完成

    @TableLogic                         // 逻辑删除：delete 变 update，查询自动追加 deleted = 0
    private Integer deleted;

    @TableField(fill = FieldFill.INSERT)        // 插入时自动填充
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE) // 插入和更新时都填充
    private LocalDateTime updatedAt;

    @TableField(exist = false)          // 表里没有这一列，只是临时计算字段
    private String ownerNickname;
}`
        },
        {
          type: 'table',
          title: '映射注解速查',
          head: ['注解', '作用', '常见取值'],
          rows: [
            ['@TableName', '指定表名（类名与表名不一致时）', '@TableName("todo_list")'],
            ['@TableId', '标记主键 + ID 生成策略', 'IdType.AUTO / ASSIGN_ID / ASSIGN_UUID / INPUT'],
            ['@TableField', '列名不一致、自动填充、非表字段', 'value / fill / exist'],
            ['@TableLogic', '逻辑删除字段', '配合全局配置 deleted / not-deleted 值'],
            ['@Version', '乐观锁版本号', '配合 OptimisticLockerInnerInterceptor'],
          ]
        },
        {
          type: 'code',
          lang: 'yaml',
          filename: 'application.yml · 逻辑删除与 SQL 日志',
          code: `mybatis-plus:
  global-config:
    db-config:
      logic-delete-field: deleted        # 全局逻辑删除字段名（实体上写了 @TableLogic 时可省）
      logic-delete-value: 1              # 删除后写什么
      logic-not-delete-value: 0          # 未删除是什么
  configuration:
    # 开发期强烈建议开：控制台打印完整 SQL 与参数
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
    map-underscore-to-camel-case: true   # 驼峰转下划线，默认就是 true`
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'MyMetaObjectHandler.java · 自动填充时间字段',
          code: `import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class MyMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        // 参数是实体属性名（Java 侧），不是数据库列名
        this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, LocalDateTime.now());
        this.strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
    }
}`
        },
        {
          type: 'text',
          html: '<p>把映射规则按「什么时候需要动手」整理一遍：</p><ul><li><strong>类名 → 表名</strong>：MP 默认把驼峰类名转下划线（<code>TodoItem</code> → <code>todo_item</code>）。我们的类叫 <code>Todo</code> 而表叫 <code>todo_list</code>，不服从约定，所以必须写 <code>@TableName("todo_list")</code>。这也是全书唯一需要显式指定的表名。</li><li><strong>字段名 → 列名</strong>：驼峰转下划线默认开启，<code>ownerId</code> ↔ <code>owner_id</code>、<code>createdAt</code> ↔ <code>created_at</code> 全自动，一个注解都不用写。只有在列名和驼峰规则对不上时（比如历史遗留的 <code>createTime</code> 列）才需要 <code>@TableField("createTime")</code>。</li><li><strong>主键策略</strong>：<code>IdType.AUTO</code> 交给数据库自增；<code>IdType.ASSIGN_ID</code> 由 MP 生成雪花 ID（19 位），适合分库分表、不想依赖数据库自增的场景；<code>IdType.INPUT</code> 表示 id 由你自己填。<strong>选哪个取决于数据库表是怎么建的，二者必须一致。</strong></li><li><strong>非表字段</strong>：像 <code>ownerNickname</code> 这种为了展示临时拼上的字段，一定要 <code>@TableField(exist = false)</code>，否则 MP 会拿它去拼 SQL 然后报 Unknown column。</li></ul>'
        },
        {
          type: 'tip',
          html: '<p><strong><code>updated_at</code> 有两种维护方式，二选一即可。</strong>① 靠 m05 建表时的 <code>ON UPDATE CURRENT_TIMESTAMP</code>（数据库侧自动维护，MP 完全不管）；② 靠这里的 <code>@TableField(fill = INSERT_UPDATE)</code> + <code>MetaObjectHandler.updateFill</code>（应用侧维护，能一并处理没有数据库默认值的字段）。本课选 ②，因为它顺手把 <code>createdAt</code> 这类插入时填充也统一了。注意：<strong>两种都配也不报错，但多此一举</strong>——MP 的 UPDATE 语句会显式带上 <code>updatedAt</code> 的值，数据库的自动更新就被绕过了，结果通常一致，只是白配一套。</p>'
        },
        {
          type: 'diagram',
          caption: '数据库列 ↔ 实体字段的映射关系',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m06d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>
  <text x="60" y="40" fill="#22D3EE" font-size="14" font-weight="600">todo_list（数据库表）</text>
  <text x="430" y="40" fill="#3B82F6" font-size="14" font-weight="600">Todo.java（Java 实体）</text>

  <rect x="40" y="60" width="230" height="30" rx="8" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.4"/>
  <text x="56" y="80" fill="#E2E8F0" font-size="12.5">id　BIGINT AUTO_INCREMENT</text>
  <path d="M274,75 L396,75" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m06d)"/>
  <rect x="400" y="60" width="230" height="30" rx="8" fill="#16233C" stroke="#3B82F6" stroke-width="1.4"/>
  <text x="416" y="80" fill="#E2E8F0" font-size="12.5">Long id　@TableId(AUTO)</text>

  <rect x="40" y="98" width="230" height="30" rx="8" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.4"/>
  <text x="56" y="118" fill="#E2E8F0" font-size="12.5">title　VARCHAR(100)</text>
  <path d="M274,113 L396,113" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m06d)"/>
  <rect x="400" y="98" width="230" height="30" rx="8" fill="#16233C" stroke="#3B82F6" stroke-width="1.4"/>
  <text x="416" y="118" fill="#E2E8F0" font-size="12.5">String title</text>

  <rect x="40" y="136" width="230" height="30" rx="8" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.4"/>
  <text x="56" y="156" fill="#E2E8F0" font-size="12.5">completed　TINYINT</text>
  <path d="M274,151 L396,151" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m06d)"/>
  <rect x="400" y="136" width="230" height="30" rx="8" fill="#16233C" stroke="#3B82F6" stroke-width="1.4"/>
  <text x="416" y="156" fill="#E2E8F0" font-size="12.5">Integer completed</text>

  <rect x="40" y="174" width="230" height="30" rx="8" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.4"/>
  <text x="56" y="194" fill="#E2E8F0" font-size="12.5">owner_id　BIGINT</text>
  <path d="M274,189 L396,189" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m06d)"/>
  <rect x="400" y="174" width="230" height="30" rx="8" fill="#16233C" stroke="#3B82F6" stroke-width="1.4"/>
  <text x="416" y="194" fill="#E2E8F0" font-size="12.5">Long ownerId</text>
  <text x="566" y="194" fill="#94A3B8" font-size="11">驼峰 → 下划线</text>

  <rect x="40" y="212" width="230" height="30" rx="8" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.4"/>
  <text x="56" y="232" fill="#E2E8F0" font-size="12.5">created_at　DATETIME</text>
  <path d="M274,227 L396,227" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m06d)"/>
  <rect x="400" y="212" width="230" height="30" rx="8" fill="#16233C" stroke="#3B82F6" stroke-width="1.4"/>
  <text x="416" y="232" fill="#E2E8F0" font-size="12.5">LocalDateTime createdAt</text>

  <rect x="40" y="250" width="230" height="30" rx="8" fill="#1B2A44" stroke="#10B981" stroke-width="1.6"/>
  <text x="56" y="270" fill="#10B981" font-size="12.5">deleted　TINYINT DEFAULT 0</text>
  <path d="M274,265 L396,265" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m06d)"/>
  <rect x="400" y="250" width="230" height="30" rx="8" fill="#16233C" stroke="#10B981" stroke-width="1.6"/>
  <text x="416" y="270" fill="#10B981" font-size="12.5">Integer deleted　@TableLogic</text>

  <rect x="40" y="282" width="590" height="62" rx="10" fill="#16233C" stroke="rgba(245,158,11,.4)"/>
  <text x="58" y="303" fill="#F59E0B" font-size="12">逻辑删除后：deleteById 实际执行 UPDATE ... SET deleted = 1；</text>
  <text x="58" y="320" fill="#F59E0B" font-size="12">所有 MP 生成的查询自动追加 WHERE deleted = 0。</text>
  <text x="58" y="337" fill="#F59E0B" font-size="12">但你自己手写的 SQL 不会自动加这个条件——这是逻辑删除最容易踩的坑。</text>
</svg>`
        },
        {
          type: 'compare',
          title: 'Java 实体 ↔ TS interface',
          head: ['TS（src/types/todo.ts）', 'Java（Todo.java）', '说明'],
          rows: [
            ['interface Todo { id: number }', 'private Long id;', 'TS 类型编译后消失，Java 类型运行时真实存在'],
            ['ownerId?: number', 'private Long ownerId;', 'Java 没有可选链，null 要自己判'],
            ['createdAt: string', 'private LocalDateTime createdAt;', 'Java 用专门的时间类型，格式化交给 Jackson'],
            ['type TodoVO = Omit<Todo, "deleted">', '新建一个 TodoVO 类', '两边都需要「裁剪字段」的动作，m07 详讲'],
          ]
        },
        {
          type: 'warn',
          html: '<p><strong>逻辑删除只在 MP 生成的 SQL 里生效</strong>：如果你在 Mapper 里手写 <code>@Select</code> 或 XML 里的 <code>WHERE</code>，MP 不会自动追加 <code>deleted = 0</code>，已删除的数据照样查出来。手写 SQL 时必须自己带上条件。</p><p><strong><code>@TableId</code> 策略与数据库不一致</strong>：表是自增却用默认雪花 → 插入 19 位 ID；表没自增却用 <code>AUTO</code> → 主键冲突或为 0。改表结构后记得同步改这里。</p><p><strong><code>updateById</code> 不会把字段更新成 null</strong>：MP 默认忽略 null 字段（<code>NOT_NULL</code> 策略）。真要把某列置空，用 <code>UpdateWrapper</code> 的 <code>set("列名", null)</code>，或字段加 <code>@TableField(strategy = FieldStrategy.IGNORED)</code>。</p><p><strong>自动填充不生效</strong>：检查① <code>MetaObjectHandler</code> 有没有加 <code>@Component</code>；② <code>strictInsertFill</code> 里写的是<strong>实体属性名</strong>（<code>createdAt</code>）不是列名（<code>created_at</code>）；③ 字段上有没有 <code>@TableField(fill = ...)</code>。</p>'
        },
        {
          type: 'fe',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：数据访问层全部完成——实体与表一一对应、CRUD 零 SQL、条件与分页齐全、删除是软删除。到这一步，<strong>待办清单 API 已经能落库了</strong>。接下来 m07 解决「代码组织」：把 Controller 里越堆越多的逻辑拆成三层，给接口套上统一返回与异常处理，并给批量操作加上事务。</p>'
        },
      ],
      quiz: [
        {
          q: '给 deleted 字段加上 @TableLogic 后，调用 deleteById 实际执行的是？',
          options: [
            'DELETE FROM todo_list WHERE id = ?',
            'UPDATE todo_list SET deleted = 1 WHERE id = ? AND deleted = 0',
            '先 DELETE 再 INSERT 一条备份',
            '直接报错，必须先物理删除'
          ],
          answer: 1,
          explain: '逻辑删除把删除变更新：delete 变 UPDATE SET deleted = 1，且所有 MP 生成的查询自动追加 WHERE deleted = 0。手写 SQL 则不会自动追加，要自己加条件。'
        },
        {
          q: '实体字段 ownerId 对应数据库列 owner_id，需要额外配置吗？',
          options: [
            '必须写 @TableField("owner_id")',
            '不需要，MP 默认开启驼峰转下划线（map-underscore-to-camel-case）',
            '必须写 @TableName 才能生效',
            '必须在 yml 里手工声明每个字段'
          ],
          answer: 1,
          explain: 'MP 默认开启驼峰转下划线映射，createdAt ↔ created_at、ownerId ↔ owner_id 都是自动的。只有命名不服从这个约定时才用 @TableField(value = "...") 纠正。'
        },
        {
          q: 'MetaObjectHandler 里的自动填充没生效，最不该忽略的检查项是？',
          options: [
            '数据库列名写成了 created_at',
            '类上有没有加 @Component，以及 fill 方法里用的是不是实体属性名',
            'MySQL 版本太低',
            '没注册分页插件'
          ],
          answer: 1,
          explain: '两个高频原因：处理器没被 Spring 管理（缺 @Component）；strictInsertFill 传的字段名写成了数据库列名 created_at，而它要的是 Java 属性名 createdAt。'
        },
      ],
    },

    /* ============================ m06-l05 避坑 ============================ */
    {
      id: 'm06-l05',
      title: '避坑清单：MyBatis-Plus 高频翻车 Top 6',
      minutes: 30,
      goal: '收拢 MyBatis-Plus 日常使用最高频的 6 个坑：updateById 清空失效、SQL 注入、分页插件忘配、N+1 查询、逻辑删除的副作用、字段映射错位。每个坑都能在真实项目里找到原型。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>MyBatis-Plus 把 CRUD 包得太好，以至于「它默默帮你做了什么」反而成了盲区。这一课的 6 个坑全部源于「框架的默认行为和你以为的不一样」。逐个拆。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 1：updateById 清空字段，静默失败。</strong>需求：把待办的备注 remark 清空。你写了 <code>todo.setRemark(null); mapper.updateById(todo);</code> ——执行成功，数据库里 remark <strong>纹丝不动</strong>。原因：MP 默认的字段策略是 NOT_NULL，<strong>实体里为 null 的字段不会出现在 UPDATE 语句里</strong>（这是保护——防止没赋值的字段把数据冲掉）。想置空必须显式声明：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: '三种置空方式',
          code: `// 修法 1（推荐）：UpdateWrapper 的 set 子句，生成的 SQL 里明确带 remark = NULL
LambdaUpdateWrapper<Todo> uw = new LambdaUpdateWrapper<>();
uw.eq(Todo::getId, id)
  .set(Todo::getRemark, null)
  .set(Todo::getStatus, "done");
todoMapper.update(null, uw);

// 修法 2：全局改字段策略（影响面大，慎用）
// application.yml:
// mybatis-plus:
//   global-config:
//     db-config:
//       update-strategy: IGNORED    # null 也会进 UPDATE，危险：忘赋值的字段全被清空

// 修法 3：单字段上标注解
// @TableField(updateStrategy = FieldStrategy.IGNORED)
// private String remark;`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>为什么默认策略是好事：</strong>如果 <code>findById</code> 拿到实体后只改了 status，其余字段保持 null，全量 update 会把数据库里的 title、remark 全部抹成 NULL——那才是灾难。NOT_NULL 策略让 updateById 天然近似「部分更新」。记住分工：<strong>改部分字段用 updateById，清空字段用 UpdateWrapper.set</strong>。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 2：${'$'}{} 拼接导致 SQL 注入。</strong>MP 的 Wrapper 方法都是预编译的，安全；但手写 SQL 时 <code>${'$'}{ }</code> 是纯字符串拼接：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: '注入对照',
          code: `// 反面教材：前端传 title' OR '1'='1 就能拖走全表
@Select("SELECT * FROM todo_list WHERE title = '\${title}'")
List<Todo> search(String title);

// 正面写法：#{} 预编译占位，参数只能当值，永远变不成 SQL 结构
@Select("SELECT * FROM todo_list WHERE title = #{title}")
List<Todo> search(String title);

// \${} 唯一合法场景：动态表名/列名/排序方向（值不可能加引号）
// 且必须白名单校验，绝不能直接透传用户输入
String column = switch (sortField) {
    case "title" -> "title";
    case "createdAt" -> "created_at";
    default -> "id";                      // 默认值兜底
};`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 3：分页插件没配，selectPage 悄悄返回全表。</strong>MP 的分页不是它自带的，而是靠拦截器插件改写 SQL 追加 LIMIT。<strong>没注册插件时 selectPage 不报错</strong>——返回对象看着正常，但 total 为 0、records 是全表数据。数据量小的开发环境你根本发现不了，上生产才爆：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: '分页插件标配',
          code: `@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}

// 自查方法：日志里看生成的 SQL 有没有 LIMIT，total 是否正确
// mybatis-plus.configuration.log-impl=org.apache.ibatis.logging.stdout.StdOutImpl`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 4：N+1 查询。</strong>列表页 20 条待办，每条还要展示创建人昵称，你写成了循环查库：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'N+1 对照',
          code: `// 反面教材：1 次列表查询 + N 次单条查询 = 21 条 SQL，接口耗时随数据量线性膨胀
List<Todo> todos = todoMapper.selectList(null);
for (Todo t : todos) {
    User u = userMapper.selectById(t.getUserId());     // 循环里查库！
    t.setOwnerName(u.getNickname());
}

// 正面写法：先收集 id，一次 in 批量查，再内存组装（2 条 SQL 搞定）
List<Long> userIds = todos.stream().map(Todo::getUserId).distinct().toList();
Map<Long, User> userMap = userMapper.selectBatchIds(userIds).stream()
        .collect(Collectors.toMap(User::getId, u -> u));
todos.forEach(t -> t.setOwnerName(userMap.get(t.getUserId()).getNickname()));

// 数据量再大就上 JOIN 或看 m09 的 Redis 缓存`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 5：逻辑删除的三个副作用。</strong>实体加了 <code>@TableLogic</code> 后，MP 会把 delete 变成 UPDATE deleted=1，查询自动追加 <code>WHERE deleted=0</code>。三个副作用要心里有数：</p>
<ul><li><strong>数据库里数据还在</strong>——唯一索引会冲突：同一个手机号删了重新注册，若 phone 上有 UNIQUE 索引直接报错（解法：唯一索引改为「phone + deleted」组合，或删号时改写手机号）；</li>
<li><strong>想查已删数据要绕过 MP</strong>：自己写 SQL 或用自定义 mapper；</li>
<li><strong>统计口径变化</strong>：selectCount 自动排除已删数据，别再手动加 deleted=0 条件（会重复）。</li></ul>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 6：字段名对不上，值悄悄是 null。</strong>实体属性 createdAt 查出来一直是 null？排查顺序：</p>
<ul><li>数据库列是 created_at，MP 默认开启<strong>驼峰映射</strong>（camel ↔ snake），一般不用配；如果你在配置里关了 map-underscore-to-camel-case，就全断了；</li>
<li>自定义列名用 <code>@TableField("create_time")</code> 显式声明；</li>
<li>主键必须 <code>@TableId(type = IdType.AUTO)</code> 对上 AUTO_INCREMENT，否则插入后 id 回填是 null。</li></ul>`,
        },
        {
          type: 'table',
          title: 'MP 排查速查表',
          head: ['现象', '第一嫌疑', '修法'],
          rows: [
            ['set null 后 updateById 改不动', 'NOT_NULL 默认策略', 'LambdaUpdateWrapper.set 显式置空'],
            ['Wrapper 拼的条件没生效', '条件写进了错误的分支持路', '链式 .eq(condition, ...) 用布尔首位参数'],
            ['selectPage 的 total 为 0 / 返回全表', '分页插件没注册', 'MybatisPlusInterceptor + PaginationInnerInterceptor'],
            ['接口越来越慢，SQL 数暴涨', 'N+1 查询', '收集 id + selectBatchIds 批量查'],
            ['删除后重新插入报唯一键冲突', '逻辑删除数据仍在', '唯一索引组合 deleted 或改写业务键'],
            ['属性值全是 null', '驼峰映射断开 / 缺 @TableField', '查 map-underscore 配置与注解'],
          ],
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>对照前端记忆：</strong>updateById 的 NOT_NULL 策略 ≈ JS 里 <code>{...old, ...patch}</code> 只覆盖传入的键，undefined 不覆盖（区别是 MP 连显式 null 也拦，所以置空要专门的 set）；N+1 ≈ React 列表里每行单独发请求，经典优化就是批量接口；逻辑删除 ≈ 前端软删除（isDeleted 标记），但数据库层面多出唯一索引冲突这个前端遇不到的坑。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能说出 updateById 与 UpdateWrapper.set 的分工。</li>
<li>手写 SQL 一律 #{}，${'$'}{} 只用于白名单校验过的表名列名。</li>
<li>新工程必配分页插件，接口开发必查 SQL 条数。</li></ul>
<p><strong>课后实战练习（m07 会直接用到，务必做完）</strong>：m05 你建过 <code>user</code> 表——照本课 Todo 的三步（建实体 → 继承 BaseMapper → @MapperScan 扫描）给 user 表生成 <code>User</code> 实体和 <code>UserMapper</code>。下一模块的 Service 实战和登录鉴权都会用到它；N+1 修法示例里的 <code>userMapper.selectBatchIds</code> 也正是这个 Mapper。</p>`,
        },
      ],
      quiz: [
        {
          q: 'todo.setRemark(null) 后调用 updateById，数据库 remark 没变。原因是？',
          options: [
            'MP 的 bug',
            '默认字段策略 NOT_NULL：为 null 的字段不会进入 UPDATE 语句',
            'remark 不是索引列',
            '需要先 delete 再 insert',
          ],
          answer: 1,
          explain:
            'NOT_NULL 策略保护你没赋值的字段不被冲掉，代价是无法用 updateById 置空。用 LambdaUpdateWrapper 的 set 子句显式生成 remark = NULL。',
        },
        {
          q: '关于 #{} 与 ${}，正确的是？',
          options: [
            '${} 更快，业务 SQL 应优先用 ${}',
            '#{} 是预编译占位，参数只能当值用，能防 SQL 注入',
            '#{} 只能用在 INSERT 里',
            '两者完全等价，写法偏好',
          ],
          answer: 1,
          explain:
            '#{} 走 PreparedStatement 参数占位，用户输入永远不会变成 SQL 结构；${} 是字符串拼接，只能用于动态表名/列名且必须白名单校验。',
        },
        {
          q: 'selectPage 返回的 records 是全表数据、total 是 0，最可能的原因是？',
          options: [
            '数据库版本太低',
            '分页拦截器插件没有注册，LIMIT 根本没被加到 SQL 上',
            'Page 对象没传参数',
            '实体类没加 @TableName',
          ],
          answer: 1,
          explain:
            'MP 分页靠 MybatisPlusInterceptor 里的 PaginationInnerInterceptor 改写 SQL。没注册时不报错但分页完全失效——开发环境数据少不易发现，是经典上线事故。',
        },
        {
          q: '列表接口要给 50 条待办补上创建人昵称，正确姿势是？',
          options: [
            '循环里对每条待办 selectById 查用户',
            '先收集去重后的 userId，一次 selectBatchIds 批量查，再内存组装 Map',
            '让前端自己查',
            '把用户表全部查出来遍历匹配',
          ],
          answer: 1,
          explain:
            '循环查库是 N+1 问题：SQL 数 = 列表数 + 1，耗时线性膨胀。批量 in 查询固定 2 条 SQL；量级再大用 JOIN 或缓存（m09）。',
        },
      ],
    },
  ],
};
