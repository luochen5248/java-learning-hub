import type { RawModule } from '../types/course'

/**
 * m07 · 业务分层（4 课）
 *
 * 版本基线：JDK 17 + Spring Boot 3.2.x + MyBatis-Plus 3.5.x
 *   —— 注意 Boot 3 的校验注解包名是 jakarta.validation.*（不是 javax.validation.*）
 * 贯穿项目「待办清单 API」：本模块把 m06 的 Controller 直连 Mapper 重构成三层架构，
 * 补齐 DTO/VO/PO 对象分层、统一返回、全局异常与事务。
 */

export const module: RawModule = {
  id: 'm07',
  order: 7,
  title: '业务分层',
  subtitle: '三层架构、DTO/VO、统一返回与事务',
  phase: 'phase2',
  phaseName: '阶段二 · 写出完整后端',
  icon: '🧱',
  cover: 'assets/img/m07-layered.jpg',
  minutes: 130,
  summary:
    '能跑通和能维护是两回事。本模块给待办清单 API 做一次「成人礼」：把堆在 Controller 里的逻辑拆成 Controller-Service-Mapper 三层，用 DTO/VO/PO 隔开数据库结构与接口契约，用 Result<T> + @RestControllerAdvice 统一返回和错误，最后用 @Transactional 保证批量操作的原子性。学完你就拥有了一个结构完整的后端项目。',

  flashcards: [
    { front: '三层架构各自负责什么？', back: 'Controller 接参数返结果；Service 管业务与事务；Mapper 只管 SQL。单向依赖。', tag: '注解' },
    { front: '事务注解应该加在哪一层？', back: '加在 Service 方法上，不是 Controller 也不是 Mapper。', tag: '坑点' },
    { front: '@Transactional 失效的三大场景？', back: '非 public 方法、同类自调用、异常被吞或受检异常没写 rollbackFor。', tag: '坑点' },
    { front: 'PO / DTO / VO 分别是什么？', back: 'PO 与表一一对应的实体；DTO 是入参（请求体）；VO 是出参（响应体）。', tag: '概念' },
    { front: '为什么不能直接把实体类返回给前端？', back: '会把密码、盐值、内部状态等敏感字段一起序列化出去，还会把表结构永久绑死在接口契约上。', tag: '坑点' },
    { front: '统一返回结构通常有哪些字段？', back: 'Result<T>：code（0 表示成功）、msg（提示文案）、data（业务数据）。', tag: '概念' },
    { front: '全局异常处理用哪两个注解？', back: '类上 @RestControllerAdvice，方法上 @ExceptionHandler(X.class)。', tag: '注解' },
    { front: 'Boot 3 的校验注解在哪个包？', back: 'jakarta.validation.constraints.*，Boot 3 已从 javax 迁到 jakarta。', tag: '坑点' },
    { front: '为什么推荐构造器注入？', back: '依赖不可变、能提前暴露循环依赖、便于单测；字段注入会被 IDEA 警告。', tag: '注解' },
    { front: '@Transactional 默认对什么异常回滚？', back: '默认只回滚 RuntimeException 与 Error；受检异常需写 rollbackFor。', tag: '坑点' },
  ],

  lessons: [
    /* ============================ m07-l01 ============================ */
    {
      id: 'm07-l01',
      title: '三层架构：Controller / Service / Mapper',
      minutes: 35,
      goal: '把 Controller 里越堆越多的逻辑拆成三层，理解每层的职责边界。',
      sections: [
        {
          type: 'text',
          html: '<p>m06 为了让接口尽快跑通，我们让 Controller 直接调用 Mapper。数据量小、逻辑简单时没问题，但只要需求稍微复杂一点——比如「创建待办时要校验标题、填默认值、记录操作日志、还要在一个事务里完成」——Controller 就会迅速膨胀成一坨谁都不敢改的代码。</p><p>业界通行的解法是<strong>三层架构</strong>，而且<strong>依赖必须单向</strong>：Controller → Service → Mapper。反向调用（Mapper 调 Service）是绝对禁止的；跨层调用（Controller 直接调 Mapper）是最常见的坏味道。</p>'
        },
        {
          type: 'table',
          title: '三层职责与注解',
          head: ['层', '注解', '该做什么', '不该做什么'],
          rows: [
            ['Controller', '@RestController', '接收并校验参数、调用 Service、返回结果', '写业务规则、直接调 Mapper、拼 SQL'],
            ['Service', '@Service', '业务逻辑、事务边界、编排多个 Mapper', '处理 HTTP 细节、感知 JSON'],
            ['Mapper', '@Mapper（或 @MapperScan）', '只负责数据的存取（SQL）', '写 if-else 业务判断'],
          ]
        },
        {
          type: 'code',
          lang: 'java',
          filename: '重构前：Controller 直接调 Mapper（m06 的写法）',
          code: `@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoMapper todoMapper;

    public TodoController(TodoMapper todoMapper) {
        this.todoMapper = todoMapper;
    }

    @PostMapping
    public String create(@RequestBody Todo todo) {
        // 校验、默认值、业务规则……全堆在接口类里
        if (todo.getTitle() == null || todo.getTitle().isBlank()) {
            throw new RuntimeException("标题不能为空");
        }
        todo.setCompleted(0);
        if (todo.getPriority() == null) {
            todo.setPriority(2);
        }
        todoMapper.insert(todo);
        return "ok";
    }
}`
        },
        {
          type: 'code',
          lang: 'java',
          filename: '重构后：Controller 只做三件事',
          code: `@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    // 构造器注入：依赖不可变，且启动期就能发现循环依赖
    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @PostMapping
    public String create(@RequestBody TodoCreateDTO dto) {
        todoService.create(dto);      // 业务逻辑一律下沉
        return "ok";
    }

    @GetMapping
    public List<TodoVO> list() {
        return todoService.list();
    }
}`
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'Service 接口与实现（业务与事务的归属地）',
          code: `public interface TodoService {
    void create(TodoCreateDTO dto);
    List<TodoVO> list();
}

@Service
public class TodoServiceImpl implements TodoService {

    private final TodoMapper todoMapper;

    public TodoServiceImpl(TodoMapper todoMapper) {
        this.todoMapper = todoMapper;
    }

    @Override
    public void create(TodoCreateDTO dto) {
        Todo todo = new Todo();
        todo.setTitle(dto.title());
        todo.setCompleted(0);
        todo.setPriority(dto.priority() == null ? 2 : dto.priority());
        todoMapper.insert(todo);
    }

    @Override
    public List<TodoVO> list() {
        LambdaQueryWrapper<Todo> q = new LambdaQueryWrapper<Todo>()
                .orderByDesc(Todo::getCreatedAt);
        return todoMapper.selectList(q).stream()
                .map(TodoConverter::toVO)
                .toList();   // JDK 16+ 的 Stream.toList()
    }
}`
        },
        {
          type: 'diagram',
          caption: '三层架构与请求流转：只能单向调用',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m07a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
    <marker id="arr-m07a-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#EF4444"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>

  <path d="M330,30 L330,44" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07a)"/>
  <text x="340" y="38" fill="#94A3B8" font-size="12">HTTP 请求</text>

  <rect x="150" y="48" width="360" height="58" rx="12" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.8"/>
  <text x="330" y="72" fill="#E2E8F0" font-size="14" font-weight="600" text-anchor="middle">Controller（@RestController）</text>
  <text x="330" y="92" fill="#94A3B8" font-size="12" text-anchor="middle">接参数 → 调 Service → 返回 JSON，不写业务规则</text>

  <path d="M330,108 L330,142" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07a)"/>
  <path d="M352,142 L352,110" stroke="#22D3EE" stroke-width="1.5" fill="none" stroke-dasharray="5 4" marker-end="url(#arr-m07a)"/>

  <rect x="150" y="146" width="360" height="58" rx="12" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.8"/>
  <text x="330" y="170" fill="#E2E8F0" font-size="14" font-weight="600" text-anchor="middle">Service（@Service）</text>
  <text x="330" y="190" fill="#94A3B8" font-size="12" text-anchor="middle">业务逻辑 + 事务边界，可以编排多个 Mapper</text>

  <path d="M330,206 L330,240" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07a)"/>
  <path d="M352,240 L352,208" stroke="#22D3EE" stroke-width="1.5" fill="none" stroke-dasharray="5 4" marker-end="url(#arr-m07a)"/>

  <rect x="150" y="244" width="360" height="58" rx="12" fill="#1B2A44" stroke="#10B981" stroke-width="1.8"/>
  <text x="330" y="268" fill="#E2E8F0" font-size="14" font-weight="600" text-anchor="middle">Mapper（extends BaseMapper）</text>
  <text x="330" y="288" fill="#94A3B8" font-size="12" text-anchor="middle">只管数据存取，一行业务判断都不写</text>

  <path d="M510,273 L527,273" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07a)"/>
  <rect x="530" y="244" width="120" height="58" rx="12" fill="#16233C" stroke="#F59E0B" stroke-width="1.6"/>
  <text x="590" y="268" fill="#E2E8F0" font-size="13.5" text-anchor="middle">MySQL 8</text>
  <text x="590" y="287" fill="#94A3B8" font-size="11.5" text-anchor="middle">todo_list</text>

  <path d="M145,80 C 45,140 45,215 145,270" stroke="#EF4444" stroke-width="1.8" fill="none" stroke-dasharray="6 5" marker-end="url(#arr-m07a-red)"/>
  <text x="14" y="212" fill="#EF4444" font-size="11">❌ 禁止跨层</text>

  <rect x="150" y="316" width="500" height="30" rx="10" fill="#16233C" stroke="rgba(59,130,246,.35)"/>
  <text x="166" y="335" fill="#94A3B8" font-size="12">调用链永远单向：Controller → Service → Mapper，反方向会让代码再也拆不开。</text>
</svg>`
        },
        {
          type: 'text',
          html: '<p>把项目按层放进不同的包，是这个模块最直接的产出。推荐结构：</p><p><code>com.example.todo</code><br>├── <code>controller</code>　TodoController<br>├── <code>service</code>　　　TodoService、TodoServiceImpl<br>├── <code>mapper</code>　　　TodoMapper<br>├── <code>entity</code>　　　Todo（PO）<br>├── <code>dto</code>　　　　　TodoCreateDTO<br>├── <code>vo</code>　　　　　　TodoVO<br>├── <code>converter</code>　　TodoConverter<br>└── <code>config</code>　　　MybatisPlusConfig</p><p>这么分的好处和前端把 <code>components / composables / api / types</code> 分开是一模一样的：<strong>找东西靠位置而不是靠记忆</strong>。新人接手项目，看到 <code>service</code> 就知道业务在哪，看到 <code>vo</code> 就知道接口会返回什么。</p><p>还有个现实收益：<strong>Service 层天然是事务边界</strong>。事务要加在「一个业务动作」上，而一个业务动作在代码里的落点就是 Service 的方法（m07-l04 详讲）。写在 Controller 里，一个 HTTP 请求可能被拆成好几个事务；写在 Mapper 里，粒度又太细。</p>'
        },
        {
          type: 'compare',
          title: '后端三层 ↔ 前端分层',
          head: ['后端', '前端（Vue3 项目）', '共同点'],
          rows: [
            ['Controller', '组件里的事件处理 / 路由页面', '最靠近「用户」的一层，负责接与回'],
            ['Service', 'composable / Pinia store（业务逻辑）', '可复用、可单测，不关心是谁在调'],
            ['Mapper', 'src/api/todo.ts（请求封装）', '只负责数据出入口，不含判断'],
            ['单向依赖', '组件 → store → api，api 不反向 import 组件', '反向依赖是架构腐化的开始'],
          ]
        },
        {
          type: 'warn',
          html: '<p><strong>「我就图省事，Controller 直接调 Mapper 怎么了？」</strong>——三个后果：① 业务逻辑跟着接口走，换个入口（定时任务、消息队列）就得复制一份；② 事务没法正确加（见 m07-l04）；③ 单测要启动整个 Web 容器。小项目也建议至少保留 Service 层。</p><p><strong>Service 到底要不要写接口？</strong>现代 Spring Boot 小项目经常只写 <code>TodoServiceImpl</code> 一个类（少一层样板）。取舍是：需要多实现（如不同策略）或要做 AOP 代理增强时保留接口；纯业务单实现可以直接写类。本书示例保留接口，方便你看清边界。</p><p><strong>循环依赖导致启动失败 <code>BeanCurrentlyInCreationException</code></strong>：A Service 注入 B，B 又注入 A。正解是<strong>重构</strong>（抽出第三个 Service 承载共用逻辑），<code>@Lazy</code> 只是把问题推迟。</p>'
        },
        {
          type: 'fe',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：待办清单 API 完成第一次结构升级——Controller 只剩「接参数、调 Service、返结果」三行，所有规则都进了 Service。下一步（m07-l02）处理一个更隐蔽的问题：现在接口直接把数据库实体 <code>Todo</code> 当成请求体和响应体，这在生产上是会出事的。</p>'
        },
      ],
      quiz: [
        {
          q: '下面哪一项不属于 Controller 的职责？',
          options: [
            '接收并校验请求参数',
            '调用 Service 并返回结果',
            '直接写业务规则并调用 Mapper 拼 SQL',
            '决定返回的 HTTP 结构'
          ],
          answer: 2,
          explain: 'Controller 只做接参与返结果。业务逻辑放 Service，数据存取放 Mapper。Controller 直接调 Mapper 是典型坏味道，会导致逻辑无法复用、事务加错位置、单测困难。'
        },
        {
          q: '三层架构的依赖方向正确的是？',
          options: [
            'Controller → Mapper → Service',
            'Controller → Service → Mapper，单向依赖',
            'Service → Controller → Mapper',
            '三层之间可以互相调用'
          ],
          answer: 1,
          explain: '只允许 Controller 调 Service、Service 调 Mapper。反向调用或跨层调用会让依赖关系变成网状，代码再也拆不开，还可能触发循环依赖导致启动失败。'
        },
        {
          q: '关于 Service 是否要写接口，比较务实的看法是？',
          options: [
            '必须写接口，否则 Spring 无法管理',
            '永远不要写接口',
            '需要多实现或代理增强时写接口，纯单实现的小项目可以只写实现类',
            '写了接口事务才生效'
          ],
          answer: 2,
          explain: 'Spring 管理 Bean 与有没有接口无关。接口的价值在于多实现与面向抽象，单实现的小项目直接写类可减少样板代码；但事务靠的是 AOP 代理，与是否写接口没有必然关系。'
        },
      ],
    },

    /* ============================ m07-l02 ============================ */
    {
      id: 'm07-l02',
      title: 'DTO / VO / PO 与对象转换',
      minutes: 35,
      goal: '区分三种对象的职责，学会不把数据库实体直接暴露给前端。',
      sections: [
        {
          type: 'text',
          html: '<p>现在有个隐性问题：接口用同一个 <code>Todo</code> 类既当请求体又当响应体。它直接对应数据库表，表上加一列，接口就多返回一个字段；表里有密码、内部状态这类字段，也会跟着 JSON 一起出去。<strong>接口契约和数据库结构必须解耦</strong>，这就是 DTO / VO / PO 存在的理由。</p>'
        },
        {
          type: 'table',
          title: '三种对象各司其职',
          head: ['缩写', '全称', '方向', '例子'],
          rows: [
            ['PO', 'Persistent Object', '与数据库表一一对应', 'Todo（带 deleted、ownerId 等全部列）'],
            ['DTO', 'Data Transfer Object', '入参：前端 → 后端', 'TodoCreateDTO（只有前端能传的字段）'],
            ['VO', 'View Object', '出参：后端 → 前端', 'TodoVO（裁剪掉敏感/内部字段）'],
          ]
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'record 定义 DTO 与 VO（JDK 17 可用，自带构造器和 getter）',
          code: `import jakarta.validation.constraints.NotBlank;   // 注意：Boot 3 是 jakarta，不是 javax
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

// 入参：只有前端允许提交的字段
public record TodoCreateDTO(
        @NotBlank(message = "标题不能为空")
        @Size(max = 100, message = "标题最多 100 个字")
        String title,
        Integer priority
) {}

// 出参：只有前端需要看到的字段，敏感列一律不带
public record TodoVO(
        Long id,
        String title,
        Integer completed,
        Integer priority,
        LocalDateTime createdAt
) {}`
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TodoConverter.java · 手写转换（最可控）',
          code: `public final class TodoConverter {

    private TodoConverter() {}   // 工具类，禁止实例化

    public static Todo toPO(TodoCreateDTO dto) {
        Todo po = new Todo();
        po.setTitle(dto.title());
        po.setCompleted(0);
        po.setPriority(dto.priority() == null ? 2 : dto.priority());
        return po;
    }

    public static TodoVO toVO(Todo po) {
        // 字段一一挑出来，deleted / ownerId 不会出现在响应里
        return new TodoVO(
                po.getId(),
                po.getTitle(),
                po.getCompleted(),
                po.getPriority(),
                po.getCreatedAt()
        );
    }
}`
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'Controller 里用 @Valid 触发校验',
          code: `@PostMapping
public Result<Long> create(@Valid @RequestBody TodoCreateDTO dto) {
    Long id = todoService.create(dto);
    return Result.ok(id);
}

@GetMapping("/{id}")
public Result<TodoVO> detail(@PathVariable Long id) {
    return Result.ok(todoService.detail(id));
}`
        },
        {
          type: 'text',
          html: '<p>这里用 <code>record</code> 定义 DTO 和 VO 是 JDK 17 的红利：一行声明就自带构造器、getter、<code>equals</code>、<code>hashCode</code>、<code>toString</code>，而且<strong>字段天然 final（不可变）</strong>。对前端同学来说它最接近 TS 的 <code>interface</code> + 只读对象——你拿到一个 record，就知道没人会在半路悄悄改它。</p><p>转换代码放在哪？两种流派：<strong>写在 Converter 工具类里</strong>（本书示例，显式、好调试、零依赖），或者<strong>用 MapStruct</strong>（加个注解处理器，编译期生成实现，字段多时省事）。不建议的是把转换逻辑散落在 Service 各个方法里——改一个字段要翻十个地方。</p><p>命名上也统一一下：<code>xxxDTO</code> 表示入参、<code>xxxVO</code> 表示出参、不带后缀的就是 PO（放 <code>entity</code> 包）。团队里约定一次，看类名就知道它是往哪个方向走的。</p>'
        },
        {
          type: 'diagram',
          caption: '一次请求里对象的流转：DTO 进，PO 落库，VO 出',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m07b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>
  <text x="24" y="32" fill="#E2E8F0" font-size="14" font-weight="600">DTO 进站 → PO 落库 → VO 出站：数据库结构永远不被直接暴露</text>

  <rect x="20" y="54" width="110" height="52" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="75" y="76" fill="#E2E8F0" font-size="13" text-anchor="middle">前端 axios</text>
  <text x="75" y="93" fill="#94A3B8" font-size="11" text-anchor="middle">POST JSON</text>

  <rect x="165" y="54" width="110" height="52" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.8"/>
  <text x="220" y="76" fill="#E2E8F0" font-size="13" text-anchor="middle">DTO 入参</text>
  <text x="220" y="93" fill="#94A3B8" font-size="11" text-anchor="middle">TodoCreateDTO</text>

  <rect x="310" y="54" width="110" height="52" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="365" y="76" fill="#E2E8F0" font-size="13" text-anchor="middle">Controller</text>
  <text x="365" y="93" fill="#94A3B8" font-size="11" text-anchor="middle">+ Service</text>

  <rect x="455" y="54" width="110" height="52" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.8"/>
  <text x="510" y="76" fill="#E2E8F0" font-size="13" text-anchor="middle">PO 实体</text>
  <text x="510" y="93" fill="#94A3B8" font-size="11" text-anchor="middle">Todo</text>

  <path d="M130,80 L162,80" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07b)"/>
  <path d="M275,80 L307,80" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07b)"/>
  <path d="M420,80 L452,80" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07b)"/>
  <text x="132" y="72" fill="#94A3B8" font-size="10">校验</text>
  <text x="424" y="72" fill="#94A3B8" font-size="10">转换</text>

  <rect x="455" y="140" width="110" height="52" rx="10" fill="#16233C" stroke="#22D3EE" stroke-width="1.6"/>
  <text x="510" y="162" fill="#E2E8F0" font-size="13" text-anchor="middle">Mapper</text>
  <text x="510" y="179" fill="#94A3B8" font-size="11" text-anchor="middle">insert / select</text>

  <rect x="310" y="140" width="110" height="52" rx="10" fill="#16233C" stroke="#F59E0B" stroke-width="1.8"/>
  <text x="365" y="162" fill="#E2E8F0" font-size="13" text-anchor="middle">MySQL 8</text>
  <text x="365" y="179" fill="#94A3B8" font-size="11" text-anchor="middle">todo_list</text>

  <rect x="165" y="140" width="110" height="52" rx="10" fill="#16233C" stroke="#10B981" stroke-width="1.6"/>
  <text x="220" y="162" fill="#E2E8F0" font-size="13" text-anchor="middle">PO 结果</text>
  <text x="220" y="179" fill="#94A3B8" font-size="11" text-anchor="middle">查出来的行</text>

  <path d="M510,106 L510,137" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07b)"/>
  <path d="M453,166 L420,166" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07b)"/>
  <path d="M308,166 L275,166" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07b)"/>
  <text x="396" y="158" fill="#94A3B8" font-size="10">SQL</text>
  <text x="272" y="158" fill="#94A3B8" font-size="10">结果集</text>

  <rect x="165" y="224" width="110" height="52" rx="10" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.8"/>
  <text x="220" y="246" fill="#E2E8F0" font-size="13" text-anchor="middle">VO 出参</text>
  <text x="220" y="263" fill="#94A3B8" font-size="11" text-anchor="middle">TodoVO（裁剪过）</text>

  <rect x="310" y="224" width="110" height="52" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="365" y="246" fill="#E2E8F0" font-size="13" text-anchor="middle">JSON 响应</text>
  <text x="365" y="263" fill="#94A3B8" font-size="11" text-anchor="middle">Result&lt;T&gt; 信封</text>

  <path d="M220,192 L220,221" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07b)"/>
  <path d="M275,250 L307,250" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07b)"/>
  <text x="228" y="208" fill="#94A3B8" font-size="10">转换</text>
  <text x="278" y="242" fill="#94A3B8" font-size="10">序列化</text>

  <path d="M365,276 L365,308 L10,308 L10,80 L18,80" stroke="#22D3EE" stroke-width="1.7" fill="none" stroke-dasharray="6 5" marker-end="url(#arr-m07b)"/>
  <text x="120" y="300" fill="#22D3EE" font-size="11">响应回到前端（axios 拦截器统一拆信封）</text>

  <rect x="150" y="318" width="520" height="28" rx="10" fill="#16233C" stroke="rgba(239,68,68,.4)"/>
  <text x="166" y="336" fill="#EF4444" font-size="12">若直接返回 PO：deleted、ownerId 甚至用户表的密码都会一起序列化出去。</text>
</svg>`
        },
        {
          type: 'compare',
          title: '后端对象分层 ↔ 前端 TS 类型分层',
          head: ['后端（Java）', '前端（TS）', '说明'],
          rows: [
            ['PO（Todo）', 'type TodoRow = 数据库行类型', '与表一一对应，两边都不该直接对外暴露'],
            ['DTO（TodoCreateDTO）', 'interface TodoCreateReq', '请求体类型，只含允许提交的字段'],
            ['VO（TodoVO）', 'interface TodoResp', '响应体类型，只含允许展示的字段'],
            ['手写 Converter / MapStruct', '手写映射函数 / zod 校验', '转换逻辑显式可见，比隐式拷贝可靠'],
          ]
        },
        {
          type: 'warn',
          html: '<p><strong>把实体直接当响应体 = 字段泄露</strong>：用户表里的 <code>password</code>、<code>salt</code> 会原样出现在 JSON 里（只要实体有这个字段，Jackson 就会序列化）。这不是理论风险，是真实事故高发区。转成 VO 是唯一稳妥做法。</p><p><strong><code>BeanUtils.copyProperties</code> 很方便但有坑</strong>：它是<strong>浅拷贝</strong>，且属性名或类型不匹配时<strong>静默跳过</strong>（不报错，值为 null），排查起来很痛苦。小对象手写转换；字段多且稳定时上 <strong>MapStruct</strong>（编译期生成映射代码，零反射、类型安全）。</p><p><strong>校验注解别引错包</strong>：Boot 3 是 <code>jakarta.validation.constraints.NotBlank</code>。从老教程复制来的 <code>javax.validation.*</code> 会编译不过（或注解压根不生效）。另外 <code>@Valid</code> 要写在参数上才会触发，只写 <code>@NotBlank</code> 不生效。</p>'
        },
        {
          type: 'fe',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：接口契约理顺了——前端提交什么（DTO）、拿到什么（VO）都白纸黑字写死在代码里，数据库怎么改都不会波及接口。还剩两件工程化的事：所有接口返回同一个信封、所有异常有一个统一的兜底（m07-l03），以及多步操作要么全成要么全败（m07-l04）。</p>'
        },
      ],
      quiz: [
        {
          q: '为什么不建议把数据库实体（PO）直接作为接口返回值？',
          options: [
            'Jackson 不支持序列化实体类',
            '会把密码等敏感字段一并暴露，且把表结构绑死在接口契约上',
            '实体类不能被 Controller 引用',
            '会导致 SQL 注入'
          ],
          answer: 1,
          explain: 'PO 与表一一对应，直接返回等于把内部存储结构公开：敏感字段泄露只是其中之一，更长期的问题是表结构一改接口就变，前后端都无法独立演进。'
        },
        {
          q: 'Spring Boot 3 里参数校验注解 @NotBlank 的包名是？',
          options: [
            'javax.validation.constraints.NotBlank',
            'jakarta.validation.constraints.NotBlank',
            'org.hibernate.validator.constraints.NotBlank',
            'com.baomidou.mybatisplus.validation.NotBlank'
          ],
          answer: 1,
          explain: 'Boot 3 已全面迁移到 Jakarta EE 命名空间，校验、Servlet、JPA 的包名都从 javax.* 变成 jakarta.*。照抄 Boot 2 时代的 javax 写法会编译失败或注解不生效。'
        },
        {
          q: '关于 BeanUtils.copyProperties，正确的提醒是？',
          options: [
            '它是最推荐的转换方式，没有任何缺点',
            '它是浅拷贝，且字段名或类型不匹配时会静默跳过，不报错',
            '它编译期生成代码，性能最好',
            '它能自动完成驼峰与下划线的转换'
          ],
          answer: 1,
          explain: 'copyProperties 基于反射，字段名/类型对不上就悄悄跳过，留下 null，排查成本高。字段不多时手写转换最可控；字段多且稳定可用 MapStruct（编译期生成、类型安全）。'
        },
      ],
    },

    /* ============================ m07-l03 ============================ */
    {
      id: 'm07-l03',
      title: '统一返回与全局异常处理',
      minutes: 30,
      goal: '用 Result<T> 统一所有接口的返回结构，并用 @RestControllerAdvice 兜住所有异常。',
      sections: [
        {
          type: 'text',
          html: '<p>前端对接后端时最怕什么？——<strong>每个接口返回的形状都不一样</strong>：有的返回数组，有的返回对象，出错时有的返回 500 页面、有的返回 <code>{message: "xxx"}</code>、有的什么都不返回。所以业界约定一个「信封」：<code>{ code, msg, data }</code>。<strong>约定一次，全局生效</strong>，前端在拦截器里统一拆即可。</p>'
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'Result.java · 统一返回信封',
          code: `public record Result<T>(int code, String msg, T data) {

    public static <T> Result<T> ok(T data) {
        return new Result<>(0, "ok", data);
    }

    public static <T> Result<T> fail(String msg) {
        return new Result<>(500, msg, null);
    }

    public static <T> Result<T> fail(int code, String msg) {
        return new Result<>(code, msg, null);
    }
}

// 所有 Controller 方法都返回 Result<T>：
// @GetMapping  -> Result<List<TodoVO>>
// @PostMapping -> Result<Long>`
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'BizException.java + GlobalExceptionHandler.java',
          code: `// 1. 业务异常：可预见的错误（参数不对、数据不存在、状态不允许）
public class BizException extends RuntimeException {
    private final int code;

    public BizException(String msg) {
        super(msg);
        this.code = 400;
    }

    public BizException(int code, String msg) {
        super(msg);
        this.code = code;
    }

    public int getCode() { return code; }
}

// 2. 全局兜底：异常一律转成 Result，前端永远拿得到结构化的错误信息
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BizException.class)
    public Result<Void> handleBiz(BizException e) {
        return Result.fail(e.getCode(), e.getMessage());
    }

    // 参数校验失败（@Valid 触发）
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<Void> handleValid(MethodArgumentNotValidException e) {
        FieldError fe = e.getBindingResult().getFieldError();
        return Result.fail(400, fe == null ? "参数错误" : fe.getDefaultMessage());
    }

    // 兜底：未知异常不要把堆栈信息直接吐给前端
    @ExceptionHandler(Exception.class)
    public Result<Void> handleOther(Exception e) {
        // 真实项目这里要打日志：log.error("unknown error", e);
        return Result.fail("服务开小差了，请稍后重试");
    }
}`
        },
        {
          type: 'code',
          lang: 'ts',
          filename: 'src/api/request.ts · 前端拦截器统一拆信封',
          code: `import axios from 'axios';

const request = axios.create({ baseURL: '/api' });

request.interceptors.response.use(
  (res) => {
    const body = res.data as { code: number; msg: string; data: unknown };
    if (body.code === 0) {
      return body.data as never;   // 业务侧直接拿到 data，不用层层 .data.data
    }
    ElMessage.error(body.msg);     // 一处弹提示，业务代码不用 try/catch
    return Promise.reject(new Error(body.msg));
  },
  (err) => {
    ElMessage.error('网络异常，请检查网络');
    return Promise.reject(err);
  }
);

export default request;`
        },
        {
          type: 'diagram',
          caption: '异常从抛出到前端提示：一条完整的兜底链路',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m07c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>
  <text x="150" y="40" fill="#94A3B8" font-size="12.5" text-anchor="middle">后端（Java）</text>
  <text x="596" y="40" fill="#94A3B8" font-size="12.5" text-anchor="middle">前端（TS）</text>

  <rect x="15" y="130" width="145" height="62" rx="12" fill="#1B2A44" stroke="#EF4444" stroke-width="1.8"/>
  <text x="87" y="156" fill="#E2E8F0" font-size="13" text-anchor="middle">Service 抛异常</text>
  <text x="87" y="176" fill="#94A3B8" font-size="10.5" text-anchor="middle">throw new BizException</text>

  <rect x="180" y="130" width="145" height="62" rx="12" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.8"/>
  <text x="252" y="156" fill="#E2E8F0" font-size="13" text-anchor="middle">@RestControllerAdvice</text>
  <text x="252" y="176" fill="#94A3B8" font-size="11" text-anchor="middle">捕获并按类型处理</text>

  <rect x="345" y="130" width="145" height="62" rx="12" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.8"/>
  <text x="417" y="156" fill="#E2E8F0" font-size="13" text-anchor="middle">转成 Result</text>
  <text x="417" y="176" fill="#94A3B8" font-size="10.5" text-anchor="middle">{code, msg, data}</text>

  <rect x="520" y="130" width="145" height="62" rx="12" fill="#16233C" stroke="#3B82F6" stroke-width="1.8"/>
  <text x="592" y="156" fill="#E2E8F0" font-size="13" text-anchor="middle">axios 拦截器</text>
  <text x="592" y="176" fill="#94A3B8" font-size="10.5" text-anchor="middle">code != 0 → 弹提示</text>

  <path d="M165,161 L177,161" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07c)"/>
  <path d="M330,161 L342,161" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07c)"/>
  <path d="M495,161 L517,161" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07c)"/>

  <path d="M505,120 L505,60 L672,60" stroke="rgba(148,163,184,.5)" stroke-width="1.4" fill="none" stroke-dasharray="6 5"/>
  <path d="M505,120 L505,340" stroke="rgba(148,163,184,.5)" stroke-width="1.4" fill="none" stroke-dasharray="6 5"/>

  <rect x="15" y="216" width="475" height="48" rx="10" fill="#16233C" stroke="rgba(59,130,246,.35)"/>
  <text x="32" y="236" fill="#94A3B8" font-size="12">业务代码里只管 throw，不用每个方法都 try/catch，也不用自己拼错误响应。</text>
  <text x="32" y="254" fill="#94A3B8" font-size="12">HTTP 状态码可以用 @ResponseStatus 或 ResponseEntity 单独控制（RESTful 之争，入门阶段先统一 200）。</text>

  <rect x="15" y="276" width="475" height="62" rx="10" fill="#16233C" stroke="rgba(245,158,11,.4)"/>
  <text x="32" y="296" fill="#F59E0B" font-size="12">异常处理器匹配顺序：Spring 会选「最具体」的那个 @ExceptionHandler。</text>
  <text x="32" y="313" fill="#F59E0B" font-size="12">所以 BizException 要写在 Exception 之前，且 Exception 的兜底必须留一个，</text>
  <text x="32" y="330" fill="#F59E0B" font-size="12">否则未捕获异常会返回 Spring 默认的错误页，前端拦截器解析不了。</text>
</svg>`
        },
        {
          type: 'text',
          html: '<p>你可能会问：<strong>HTTP 已经有 404、500 这些状态码了，为什么还要自己造一个 code？</strong></p><p>因为两者表达的不是一件事。<strong>HTTP 状态码描述的是「这次请求在协议层的结局」</strong>（200 成功、401 未登录、404 资源不存在、500 服务器炸了），它面向的是网关、浏览器、CDN 这些基础设施；<strong>业务 code 描述的是「业务上的成败」</strong>（标题为空、余额不足、该记录已存在），它面向的是前端业务代码和最终用户。</p><p>业务错误往往有很多种，但 HTTP 状态码里没有「标题不能为空」这一项——硬塞进 400 会让前端无法区分「参数错」和「业务不允许」。所以常见做法是：<strong>HTTP 一律 200，成败写在 body 的 code 里</strong>（本书采用，对前端最友好，一个拦截器全搞定）；讲究 RESTful 的团队会两者都用（HTTP 404 + body 里带业务 code）。入门阶段不必纠结，<strong>前后端约定一致最重要</strong>。</p>'
        },
        {
          type: 'table',
          title: '常见异常 → 建议返回',
          head: ['异常', '来源', '建议 code / msg'],
          rows: [
            ['BizException', '业务主动抛出', '400 + 业务文案（可直接展示给用户）'],
            ['MethodArgumentNotValidException', '@Valid 校验失败', '400 + 第一个字段的错误文案'],
            ['DuplicateKeyException', '唯一索引冲突', '400 + 「该记录已存在」'],
            ['Exception（兜底）', '未知错误', '500 + 通用文案，详细堆栈写日志不回前端'],
          ]
        },
        {
          type: 'warn',
          html: '<p><strong><code>@RestControllerAdvice</code> 不生效</strong>：最常见原因是<strong>包扫描</strong>——这个类必须位于启动类所在包（或其子包）下。其次确认返回的是对象（会被 Jackson 序列化成 JSON），而不是视图名或 String 拼接。</p><p><strong>兜底处理器千万别把 <code>e.getMessage()</code> 直接返回给前端</strong>：内部异常信息可能包含 SQL、路径、账号等。生产上统一返回笼统文案，详细信息只进日志。</p><p><strong>别在每个 Controller 方法里 try/catch</strong>：那是把全局异常处理又拆散了一遍。业务代码只管抛 <code>BizException</code>，交给 Advice 统一翻译——和前端「axios 全局拦截器」是同一个思路。</p>'
        },
        {
          type: 'fe',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：接口对外形态完全统一了——成功是 <code>{code:0, data:...}</code>，失败是 <code>{code:400, msg:"标题不能为空"}</code>。前端一个响应拦截器就能搞定全部提示。这个约定一旦定下，后面 m08 部署、m09 加缓存都不用再动接口形状。</p>'
        },
      ],
      quiz: [
        {
          q: '统一返回结构 Result<T> 通常包含哪些字段？',
          options: [
            'status、body、headers',
            'code、msg、data',
            'errno、errmsg、result',
            'success、payload'
          ],
          answer: 1,
          explain: '业界最常见的是 code（0 表示成功）+ msg（提示文案）+ data（业务数据）。前端在响应拦截器里按 code 判断，成功则直接返回 data，失败统一弹提示。'
        },
        {
          q: '@RestControllerAdvice 里的兜底 @ExceptionHandler(Exception.class) 应该怎么处理异常信息？',
          options: [
            '把 e.getMessage() 原样返回给前端，方便排查',
            '返回笼统文案，详细堆栈只写进日志',
            '直接吞掉异常返回成功',
            '重新抛出，让 Spring 返回默认错误页'
          ],
          answer: 1,
          explain: '内部异常信息可能包含 SQL、文件路径、账号等敏感内容，不能回给前端。正确做法是打日志 + 返回「服务开小差了」这类通用文案；只有可预见的 BizException 才把文案直接展示给用户。'
        },
        {
          q: '@RestControllerAdvice 完全不生效，首先应该检查什么？',
          options: [
            'MySQL 是否启动',
            '该类是否在启动类所在包（或子包）下，被 Spring 扫描到',
            '有没有注册分页插件',
            '是否使用了 Lombok'
          ],
          answer: 1,
          explain: '和所有 Spring Bean 一样，包扫描是第一排查项：Advice 类必须在启动类的扫描范围内。其次确认处理器方法返回的是会被序列化成 JSON 的对象。'
        },
      ],
    },

    /* ============================ m07-l04 ============================ */
    {
      id: 'm07-l04',
      title: '事务 @Transactional',
      minutes: 30,
      goal: '会用 @Transactional 保证批量操作的原子性，并记住三个经典失效场景。',
      sections: [
        {
          type: 'text',
          html: '<p>事务就是<strong>「要么全成功，要么全回滚」</strong>。典型场景：批量完成 10 条待办并写一条操作日志——第 7 条失败了，前 6 条必须一起撤销，否则数据就自相矛盾。</p><p>在 Spring 里你只需要在方法上加一个 <code>@Transactional</code>。它的底层是 <strong>AOP 动态代理</strong>（回看 m04）：调用方拿到的是代理对象，代理在方法执行前开启事务、执行后提交、抛异常时回滚。<strong>记住这一点，后面三个失效场景全都由此而来。</strong></p>'
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TodoServiceImpl.java · 批量完成，一个事务里更新多条并写日志',
          code: `@Override
@Transactional(rollbackFor = Exception.class)   // 显式声明：受检异常也回滚
public void completeBatch(List<Long> ids) {
    for (Long id : ids) {
        Todo todo = todoMapper.selectById(id);
        if (todo == null) {
            // 抛出去才能让整个批次回滚；return 或 catch 掉都会照常提交
            throw new BizException("待办不存在：" + id);
        }
        todo.setCompleted(1);
        todoMapper.updateById(todo);
        todoLogMapper.insert(new TodoLog(id, "批量完成"));
    }
}`
        },
        {
          type: 'table',
          title: '传播行为与隔离级别（先记默认，其余按需）',
          head: ['配置', '常用取值', '含义'],
          rows: [
            ['propagation', 'REQUIRED（默认）', '有事务就加入，没有就新建一个'],
            ['propagation', 'REQUIRES_NEW', '挂起当前事务，另起一个独立事务（日志常用）'],
            ['propagation', 'SUPPORTS / NOT_SUPPORTED', '随调用方有 / 有也先挂起（如跑批）'],
            ['isolation', 'DEFAULT（默认，用数据库自己的）', 'MySQL InnoDB 默认是 REPEATABLE_READ'],
            ['isolation', 'READ_COMMITTED', '读已提交，多数互联网场景的选择'],
          ]
        },
        {
          type: 'code',
          lang: 'java',
          filename: '三个经典失效场景（都摆在眼前对照）',
          code: `@Service
public class TodoServiceImpl implements TodoService {

    // ❌ 失效 1：方法不是 public
    //    Spring AOP（CGLIB）无法代理非 public 方法，注解直接被忽略
    @Transactional
    void hiddenMethod() { /* ... */ }

    // ❌ 失效 2：同类内部自调用
    //    this 指向的是原始对象，不是代理对象，事务根本没开启
    public void createWithLog(TodoCreateDTO dto) {
        this.doCreate(dto);          // doCreate 上的 @Transactional 不生效
    }

    @Transactional
    public void doCreate(TodoCreateDTO dto) { /* ... */ }

    // ❌ 失效 3：异常被吞掉
    @Transactional
    public void wrongCatch(TodoCreateDTO dto) {
        try {
            todoMapper.insert(new Todo());
            int i = 1 / 0;
        } catch (Exception e) {
            log.error("出错了", e);   // 没往外抛 → 事务照常提交
        }
    }
}`
        },
        {
          type: 'diagram',
          caption: '事务靠代理生效：一旦绕过代理，注解就成了摆设',
          svg: `<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m07d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
    <marker id="arr-m07d-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#EF4444"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="14" fill="#0F1B2D"/>

  <text x="172" y="36" fill="#10B981" font-size="14" font-weight="600" text-anchor="middle">✅ 外部调用：经过代理</text>
  <text x="508" y="36" fill="#EF4444" font-size="14" font-weight="600" text-anchor="middle">❌ 同类自调用：绕过代理</text>

  <rect x="60" y="56" width="220" height="46" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="170" y="84" fill="#E2E8F0" font-size="13" text-anchor="middle">Controller 调用</text>

  <rect x="60" y="126" width="220" height="46" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.8"/>
  <text x="170" y="154" fill="#10B981" font-size="13" text-anchor="middle">代理对象（$Proxy）</text>

  <rect x="60" y="196" width="220" height="46" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="170" y="224" fill="#E2E8F0" font-size="13" text-anchor="middle">真实方法执行 SQL</text>

  <path d="M170,104 L170,122" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07d)"/>
  <path d="M170,174 L170,192" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m07d)"/>
  <path d="M230,192 L230,174" stroke="#22D3EE" stroke-width="1.5" fill="none" stroke-dasharray="5 4" marker-end="url(#arr-m07d)"/>
  <text x="238" y="188" fill="#22D3EE" font-size="10.5">提交 / 回滚</text>
  <text x="182" y="118" fill="#94A3B8" font-size="10.5">开启事务</text>

  <rect x="60" y="262" width="220" height="62" rx="10" fill="#16233C" stroke="rgba(16,185,129,.45)"/>
  <text x="78" y="282" fill="#94A3B8" font-size="11.5">调用方拿到的是代理对象，</text>
  <text x="78" y="299" fill="#94A3B8" font-size="11.5">所以事务能正常开启与提交。</text>
  <text x="78" y="316" fill="#94A3B8" font-size="11.5">注解要加在 public 方法上。</text>

  <path d="M345,44 L345,336" stroke="rgba(148,163,184,.35)" stroke-width="1.4" fill="none" stroke-dasharray="6 5"/>

  <rect x="400" y="56" width="220" height="46" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
  <text x="510" y="84" fill="#E2E8F0" font-size="13" text-anchor="middle">m1()（外部调用进来）</text>

  <rect x="400" y="126" width="220" height="46" rx="10" fill="#111A2C" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="6 5"/>
  <text x="510" y="154" fill="#94A3B8" font-size="13" text-anchor="middle">代理对象（被跳过）</text>

  <rect x="400" y="196" width="220" height="46" rx="10" fill="#1B2A44" stroke="#EF4444" stroke-width="1.8"/>
  <text x="510" y="224" fill="#E2E8F0" font-size="13" text-anchor="middle">m2()　@Transactional 无效</text>

  <path d="M465,104 L465,122" stroke="#94A3B8" stroke-width="1.5" fill="none" stroke-dasharray="5 4" marker-end="url(#arr-m07d)"/>
  <text x="472" y="116" fill="#EF4444" font-size="12">✗</text>
  <path d="M630,84 C 668,120 668,180 630,200" stroke="#EF4444" stroke-width="1.9" fill="none" stroke-dasharray="6 5" marker-end="url(#arr-m07d-red)"/>
  <text x="560" y="150" fill="#EF4444" font-size="11">this.m2()</text>

  <rect x="400" y="262" width="220" height="62" rx="10" fill="#16233C" stroke="rgba(239,68,68,.45)"/>
  <text x="418" y="282" fill="#94A3B8" font-size="11.5">this 指向原始对象而非代理，</text>
  <text x="418" y="299" fill="#94A3B8" font-size="11.5">AOP 无从插手，注解形同虚设。</text>
  <text x="418" y="316" fill="#94A3B8" font-size="11.5">解法：拆到另一个 Service。</text>
</svg>`
        },
        {
          type: 'warn',
          html: '<p><strong>三大失效场景，背下来</strong>：</p><ul><li><strong>方法不是 public</strong>：AOP 代理不了，注解被忽略；</li><li><strong>同类内部自调用</strong>：<code>this.xxx()</code> 绕过代理（见上图右半）。解法是把方法拆到另一个 Service，或注入自己（<code>@Lazy</code>），不推荐用 <code>AopContext</code>；</li><li><strong>异常被吞掉或类型不对</strong>：try/catch 后不往外抛，或抛的是受检异常而没写 <code>rollbackFor</code>——默认只对 <code>RuntimeException</code> 和 <code>Error</code> 回滚。</li></ul><p><strong>自测办法</strong>：在批量方法中间手动 <code>throw new RuntimeException()</code>，看数据库里前面的更新有没有被撤销。没有回滚 = 事务没生效，立刻回头查上面三条。</p><p><strong>事务方法要「短」</strong>：不要在事务里做远程调用、发短信、读大文件——事务持有数据库连接，长事务会把连接池拖垮（回看 m06-l01 的池子）。</p>'
        },
        {
          type: 'text',
          html: '<p>事务的四个特性简写为 <strong>ACID</strong>：原子性（Atomicity，全成或全败）、一致性（Consistency，数据始终满足约束）、隔离性（Isolation，并发事务互不干扰）、持久性（Durability，提交后落盘不丢）。日常开发你真正要操心的是<strong>原子性和隔离性</strong>——前者靠 <code>@Transactional</code>，后者靠隔离级别，而入门阶段用数据库默认的就够了。</p><p>什么时候<strong>不需要</strong>加事务？单条 <code>INSERT</code> / <code>UPDATE</code> 本身就是一个原子操作，数据库保证它不可分割。只有「<strong>多条写操作要当成一个整体</strong>」时才需要事务——比如批量完成、下单扣库存加订单、转账。给只读方法加事务只会白白占用连接，反而拖慢接口。</p>'
        },
        {
          type: 'compare',
          title: '事务 ↔ 前端能理解的对照',
          head: ['场景', '前端经验', '后端事务'],
          rows: [
            ['多步操作要原子', '多步表单提交，中途失败要整体撤销', '@Transactional 保证一批 SQL 同生共死'],
            ['失败信号', 'throw / reject 让调用方感知', '抛异常才会触发回滚，catch 掉等于没事发生'],
            ['统一处理', 'axios 拦截器统一报错', '@RestControllerAdvice 统一转成 Result'],
            ['代价', 'loading 期间锁定交互', '事务期间占用数据库连接，长事务伤连接池'],
          ]
        },
        {
          type: 'tip',
          html: '<p><strong>此刻我们在项目的哪一步</strong>：贯穿项目「待办清单 API」在阶段二收官了——m04 起项目 → m05 建表 → m06 落库 → m07 分层重构。你现在手上是一个结构完整、有统一契约、有兜底、有事务的后端工程。接下来 m08 会把它打成可执行 jar 并部署，m09 加 Redis 缓存，m10 用 Docker 一键起全家桶。</p><p><strong>本课产出物自检</strong>：①能说出三层各自的职责；②能写出 <code>TodoVO</code> 并解释为什么不能返回实体；③能让批量操作在抛异常时整体回滚。</p>'
        },
      ],
      quiz: [
        {
          q: '下面哪种情况会导致 @Transactional 失效？',
          options: [
            '方法被声明为 public',
            '在同一个 Service 里用 this.xxx() 调用另一个加了 @Transactional 的方法',
            '方法里执行了多条 update',
            '方法上还加了 @Service'
          ],
          answer: 1,
          explain: '事务靠 AOP 代理实现，this 指向的是原始对象不是代理对象，自调用会完全绕过代理，注解不生效。解法是拆到另一个 Service 或注入自身代理。'
        },
        {
          q: '@Transactional 默认会对哪种异常回滚？',
          options: [
            '所有异常',
            '只有 RuntimeException 和 Error；受检异常需写 rollbackFor = Exception.class',
            '只有受检异常',
            '只有 Error'
          ],
          answer: 1,
          explain: 'Spring 默认只对未检查异常（RuntimeException / Error）回滚。业务代码里抛受检异常又不声明 rollbackFor 时，事务会照常提交——这是最容易忽略的一条。'
        },
        {
          q: '在 @Transactional 方法里用 try/catch 捕获了异常并只打了日志，会发生什么？',
          options: [
            '事务回滚',
            '异常没传播到代理，事务正常提交，前面的修改被保留',
            'Spring 强制回滚',
            '抛二次异常'
          ],
          answer: 1,
          explain: '代理只有在感知到异常抛出时才回滚。把异常 catch 掉就等于告诉 Spring「一切正常」，于是事务提交，前面的写操作全部落库。要么往外抛，要么用 TransactionAspectSupport 手动标记回滚。'
        },
      ],
    },
  ],
};
