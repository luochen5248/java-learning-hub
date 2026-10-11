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
  minutes: 260,
  summary:
    '能跑通和能维护是两回事。本模块给待办清单 API 做一次「成人礼」：把堆在 Controller 里的逻辑拆成 Controller-Service-Mapper 三层，用 DTO/VO/PO 隔开数据库结构与接口契约，用 Result<T> + @RestControllerAdvice 统一返回和错误，再用 @Transactional 保证批量操作的原子性。第五课按公司项目的真实写法把 Service 层写全套：接口+实现类、Bean Validation 参数校验、业务异常与错误码；第六课避坑清单收拢事务自调用失效、事务里发 HTTP、上帝 Controller 这些真实事故；第七课是毕业实战——给项目补上 JWT 登录鉴权、标准分页封装与 Excel 报表导出三件公司项目标配。学完你就拥有了一个结构完整、能过评审、能交付的后端项目。',

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
    { front: 'Service 先写接口再写 Impl 的三个理由？', back: '事务 AOP 基于代理更稳；同一接口可多实现（如不同存储策略）；单元测试可用 Mockito 替身注入。', tag: '规范' },
    { front: '参数校验的分工？', back: 'Bean Validation（@NotBlank/@Size/@Pattern）管格式，标注在 DTO 上由 @Valid 触发；业务规则（重名、超限）在 Service 里用业务异常表达。', tag: '规范' },
    { front: '业务异常怎么抛给前端？', back: 'throw new BizException(ErrorCode.TODO_NOT_FOUND)，@RestControllerAdvice 统一转成 Result{code,msg}。', tag: '规范' },
    { front: '几千条数据批量插入用什么？', back: 'service.saveBatch(list)（MP 封装）或 XML foreach 批量 VALUES；循环单条 insert 是性能事故。', tag: '坑点' },
    { front: 'JWT 由哪三段组成？', back: 'Header.Payload.Signature，前两段 Base64 可解码（别放敏感信息），签名由服务端密钥保证不可篡改。', tag: '实战' },
    { front: '分页参数为什么要限制 pageSize 上限？', back: '不限制时前端传 100000 就是一次全表拖取。@Max(100) 上限 + 默认 10 是标准防御。', tag: '实战' },
    { front: '导出 Excel 为什么不能一次查全量？', back: '几十万行会撑爆堆和连接。分批查（游标/按页循环）+ 流式写出的 EasyExcel 消费，内存占用恒定。', tag: '实战' },
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
          explain: '代理只有在感知到异常抛出时才回滚。把异常 catch 掉就等于告诉 Spring「一切正常」，于是事务提交，前面的写操作全部落库。要么往外抛，要么用 TransactionAspectSupport 手动 setRollbackOnly 标记回滚。'
        },
      ],
    },

    /* ============================ m07-l05 Service 实战模式 ============================ */
    {
      id: 'm07-l05',
      title: 'Service 实战模式：按公司项目的写法把业务层补完整',
      minutes: 40,
      goal: '把「结构对了」推进到「跟公司项目一样」：接口 + 实现类的固定套路、把校验前移到 Bean Validation、用错误码 + 业务异常表达失败、Controller 只做薄薄一层转发。学完这一课，你看任何公司的业务代码都不会陌生。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>l01~l04 解决了「分层是什么」，这一课回答「公司项目里 Service 层到底长什么样」。四个固定套路：<strong>接口 + 实现类、DTO 上做 Bean Validation、业务失败抛业务异常、Controller 只做转发</strong>。套路背后各有一个工程理由，不是仪式感。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>套路 1：先写接口，再写实现类。</strong>公司项目里几乎见不到「直接 @Service 一个类」的写法，标配是 <code>TodoService</code>（接口）+ <code>TodoServiceImpl</code>（实现）。三个理由：</p>
<ul><li><strong>代理更稳</strong>：事务 AOP 给 Bean 生成代理时，JDK 动态代理基于接口（CGLIB 基于子类，Final 类/方法会翻车）；</li>
<li><strong>多实现扩展</strong>：明天要支持「导出到文件存储」，写一个 <code>TodoFileService implements TodoService</code>，Controller 一行不改，用 @Qualifier 切换；</li>
<li><strong>测试友好</strong>：单测 Controller 时用 Mockito mock 接口即可，不用拉起数据库。</li></ul>
<p>命名惯例：<code>xxxService</code> + <code>xxxServiceImpl</code>，前端的类比是「<code>api/todo.ts</code> 里先定 interface 再实现 fetch 函数」——只是 Java 把接口变成了显式语法。</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TodoService.java（接口）',
          code: `public interface TodoService {

    /** 分页查询：按关键字与状态过滤 */
    PageResultVO<TodoVO> page(TodoQueryDTO query);

    /** 创建待办：校验重名，成功返回新 id */
    Long create(TodoCreateDTO dto);

    /** 批量标记完成（事务方法） */
    int completeBatch(List<Long> ids);

    /** 完成率统计：前端首页的进度环用 */
    TodoStatsVO stats();
}`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TodoServiceImpl.java（实现骨架）',
          code: `@Service
@RequiredArgsConstructor          // Lombok 生成构造器注入，替代手写 @Autowired 构造器
public class TodoServiceImpl implements TodoService {

    private final TodoMapper todoMapper;           // 只能依赖 Mapper 或其他 Service，单向

    @Override
    public Long create(TodoCreateDTO dto) {
        // 业务校验：格式校验已由 Bean Validation 前置完成，这里只管业务规则
        Long count = todoMapper.selectCount(
                new LambdaQueryWrapper<Todo>().eq(Todo::getTitle, dto.getTitle()));
        if (count > 0) {
            throw new BizException(ErrorCode.TODO_DUPLICATED);   // 业务失败 → 异常表达
        }
        Todo todo = new Todo();
        BeanUtils.copyProperties(dto, todo);     // DTO → PO（m02 讲过 MapStruct 更佳）
        todoMapper.insert(todo);
        return todo.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)   // 事务边界在 Service，批量操作必须原子
    public int completeBatch(List<Long> ids) {
        if (CollUtil.isEmpty(ids)) {
            throw new BizException(ErrorCode.PARAM_EMPTY);
        }
        return todoMapper.update(null, new LambdaUpdateWrapper<Todo>()
                .in(Todo::getId, ids)
                .set(Todo::getStatus, "done")
                .set(Todo::getDoneTime, LocalDateTime.now()));
    }

    @Override
    public TodoStatsVO stats() {
        long total = todoMapper.selectCount(null);
        long done  = todoMapper.selectCount(new LambdaQueryWrapper<Todo>()
                .eq(Todo::getStatus, "done"));
        return TodoStatsVO.of(total, done);      // 前端进度环要的 percent 在 VO 里算好
    }
}`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>套路 2：格式校验前移到 DTO（Bean Validation）。</strong>「标题不能为空、长度 1~50」这类<strong>格式规则</strong>不该在 Service 里写 if——注解声明在 DTO 字段上，由 <code>@Valid</code> 在进入 Controller 之前统一触发。Service 里只留<strong>业务规则</strong>（重名、库存不足这种要查库才知道的）：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TodoCreateDTO.java + Controller 触发',
          code: `// DTO 上声明格式规则（jakarta.validation.constraints.*）
@Data
public class TodoCreateDTO {
    @NotBlank(message = "标题不能为空")
    @Size(max = 50, message = "标题最多 50 字")
    private String title;

    @Pattern(regexp = "^(high|mid|low)$", message = "优先级取值不合法")
    private String priority;

    @Future(message = "截止时间必须晚于现在")
    private LocalDateTime dueTime;
}

// Controller 上加 @Valid，格式不对的请求根本进不了方法体
@PostMapping
public Result<Long> create(@RequestBody @Valid TodoCreateDTO dto) {
    return Result.ok(todoService.create(dto));
}

// 格式错误抛 MethodArgumentNotValidException，全局处理器兜住取第一条文案
@ExceptionHandler(MethodArgumentNotValidException.class)
public Result<Void> handleValid(MethodArgumentNotValidException e) {
    String msg = e.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .findFirst()
            .orElse("参数不合法");
    return Result.fail(400, msg);
}`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>套路 3：业务失败 = 错误码 + 业务异常。</strong>「重名了」「已经完成了不能重复完成」这类失败，用受控的业务异常表达，别返回 null、别返回布尔值——前端只认 Result{code,msg,data} 一种语言：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'ErrorCode.java + BizException.java',
          code: `// 错误码枚举：码段按模块分段，避免全项目随机撒数字
public enum ErrorCode {
    OK(0, "成功"),
    PARAM_ERROR(40000, "参数错误"),
    TODO_DUPLICATED(40101, "同名待办已存在"),
    TODO_NOT_FOUND(40102, "待办不存在或已删除"),
    SYSTEM_ERROR(50000, "系统繁忙，请稍后再试");

    private final int code;
    private final String msg;
    // 构造器 + getter 省略（Lombok @Getter）
}

// 业务异常：只带错误码，文案从枚举里取，别手拼字符串
@Getter
public class BizException extends RuntimeException {
    private final ErrorCode error;
    public BizException(ErrorCode error) {
        super(error.getMsg());
        this.error = error;
    }
}

// 全局处理器注册业务异常分支（挂在已有 @RestControllerAdvice 里）
@ExceptionHandler(BizException.class)
public Result<Void> handleBiz(BizException e) {
    log.warn("业务异常: {}", e.getError());     // 业务失败打 warn 就够，error 留给系统异常
    return Result.fail(e.getError().getCode(), e.getError().getMsg());
}`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>套路 4：Controller 做薄层。</strong>Controller 的全部职责只有四件事：收参数（含 @Valid）、调 Service、把返回值装进 Result、声明路由。超过 10 行的 Controller 方法基本可以判定分层失败了。对照一下公司项目的调用纪律：</p>`,
        },
        {
          type: 'table',
          title: '分层调用纪律速查',
          head: ['层', '可以调', '禁止事项'],
          rows: [
            ['Controller', 'Service（可以多个）', '直接调 Mapper；写业务逻辑；拼 SQL 条件'],
            ['Service', 'Mapper、其他 Service（单向）', '被循环依赖；在事务里发 HTTP / 做耗时计算'],
            ['Mapper', '只管本表 SQL', '调用 Service / Controller；写业务判断'],
            ['统一规则', 'DTO 进 / VO 出', 'PO 直接跨层暴露给前端（m02 已讲敏感字段泄漏）'],
          ],
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>对照前端记忆：</strong>Service 接口 + Impl ≈ <code>composables</code> 里先定签名再实现的组合函数；Bean Validation ≈ 请求体用 zod / yup 的 schema 校验，只是 Java 用注解声明、框架自动执行；BizException + 全局处理器 ≈ axios 拦截器里统一把错误 toast 出去——后端把「怎么报错」也标准化了，前端只需处理 code !== 0 一种情况。<strong>这一课的四个套路，就是你读公司项目时先找的四样东西：接口、DTO 注解、错误码枚举、Controller 转发。</strong></p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>待办清单项目补齐 TodoService/Impl、ErrorCode、BizException 三件套。</li>
<li>给创建接口加上 @Valid 校验，用 Postman 故意传空标题验证 400 返回。</li>
<li>Controller 逐行自查：有没有超过 10 行、有没有直调 Mapper。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: '公司项目 Service 层先写接口再写实现类，下列哪项不是这么做的原因？',
          options: [
            '事务等 AOP 代理基于接口更稳定',
            '同一个接口可以有多个实现，扩展时不改调用方',
            '单元测试可以 Mockito mock 接口',
            '接口能让代码运行更快，性能更好',
          ],
          answer: 3,
          explain:
            '接口本身不带来运行性能提升（JIT 一视同仁）。它的价值在工程层面：代理稳定、多态扩展、测试替身。选 D 是因为「性能」是这一题里唯一的伪理由。',
        },
        {
          q: '「标题不能为空、最长 50 字」与「同名待办已存在」，这两个校验的正确归宿是？',
          options: [
            '都写在 Controller 里 if 判断',
            '前者用 Bean Validation 注解声明在 DTO，后者在 Service 抛业务异常',
            '都写在前端 Vue 表单里就够了',
            '前者在 Service 抛异常，后者写进数据库唯一索引后就不管了',
          ],
          answer: 1,
          explain:
            '格式校验与业务校验分工：格式规则声明式（@NotBlank/@Size），进入业务前由 @Valid 统一拦截；业务规则依赖数据库状态，只能在 Service 里判断并以 BizException 表达。唯一索引可以兜底并发，但需要专门处理冲突异常，不能「不管了」。',
        },
        {
          q: 'Service 里检测到「待办不存在」，应该怎么把失败传给前端？',
          options: [
            'return null，前端自己判断',
            '返回 Result.ok() 但 data 里放个错误标记',
            'throw new BizException(ErrorCode.TODO_NOT_FOUND)，由全局异常处理器统一转成 Result{code,msg}',
            'System.out.println 后继续执行',
          ],
          answer: 2,
          explain:
            '业务失败用受控异常表达，全局 @RestControllerAdvice 统一转换为 Result 结构——全项目只有一种失败表达方式，前端处理 code !== 0 一条路径即可。null 和布尔值会让失败语义散落各处。',
        },
        {
          q: 'Controller 里出现下面哪种代码，可以判定分层失败？',
          options: [
            '把 @Valid DTO 转交给 Service 后 return Result.ok(...)',
            '调用两个 Service 组合结果并组装 VO',
            '直接注入 TodoMapper 并手写 LambdaQueryWrapper 拼查询条件',
            '方法上声明 @GetMapping("/page")',
          ],
          answer: 2,
          explain:
            'Controller 直调 Mapper = 绕过业务层，事务、缓存、业务校验全部落空。B 选项「组合多个 Service」属于编排，是 Controller 可以接受的职责；A、D 是标准写法。',
        },
      ],
    },

    /* ============================ m07-l06 避坑 ============================ */
    {
      id: 'm07-l06',
      title: '避坑清单：业务层事故 Top 6',
      minutes: 30,
      goal: '收拢业务层（Service）的事故清单：上帝 Controller、事务自调用失效、事务里发 HTTP、批量操作循环插入、吞异常假成功、Service 循环依赖。每一条都能在生产代码里找到原型。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>l05 把 Service 写标准了，这一课把「写歪了会怎样」摆出来。这 6 个坑的共同特点：<strong>编译期全绿、单测能过、上量才炸</strong>——所以值得在写代码时就预防。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 1：上帝 Controller。</strong>接手老项目最常见的景象：Controller 里 300 行，注入 Mapper、拼 Wrapper、算业务、发通知全在一起。后果：没法复用（下个接口要同样逻辑只能复制）、没法测（单测必须起 Web 环境）、事务粒度失控。重构手法就是 m07 全模块讲的事：把逻辑下沉到 Service，Controller 保留参数转换与转发。<strong>自查口诀：Controller 方法超过 10 行，或注入了 Mapper，就该拆了。</strong></p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 2：事务自调用失效（m04 预告过，这里给全解法）。</strong>同一个类里，方法 A（无注解）内部调用方法 B（带 @Transactional）——事务<strong>不会生效</strong>。原理：<code>this.B()</code> 走的是原始对象，不经过带事务的代理对象：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: '三种修法',
          code: `@Service
@RequiredArgsConstructor
public class TodoServiceImpl implements TodoService {

    // 修法 1（推荐）：把 B 挪到另一个 Service，跨 Bean 调用必然走代理
    private final TodoBatchService batchService;   // B 所在的新类
    public void importTodos(List<TodoCreateDTO> list) {
        // 校验、去重等无事务逻辑
        batchService.saveAll(list);                // 跨 Bean → 代理生效
    }

    // 修法 2：自己注入自己，通过代理对象调用（能跑，但读起来怪，少用）
    @Lazy @Autowired private TodoServiceImpl self;
    public void importTodos2(List<TodoCreateDTO> list) {
        self.completeBatch(...);                   // 经代理
    }

    // 修法 3：从上下文拿代理
    // TodoService proxy = (TodoService) AopContext.currentProxy(); 需 exposeProxy=true
}`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 3：事务里发 HTTP / 调外部接口。</strong>@Transactional 方法里调用第三方接口、发消息、传文件——数据库连接被占着干与本库无关的慢活。连接池默认 10 个连接，5 个并发请求各拖 3 秒 HTTP，<strong>整个服务的数据库操作瞬间排队</strong>，雪崩式超时：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: '拆事务',
          code: `// 反面教材：HTTP 调用在事务内，慢接口拖死连接池
@Transactional(rollbackFor = Exception.class)
public void completeAndNotify(Long id) {
    todoMapper.updateStatus(id, "done");
    webhookClient.post("/notify", payload);       // 3 秒！事务与连接全程被占用
    notifyMapper.insert(...);
}

// 正面写法：先短事务改库，事务提交后再做通知（失败也不影响主流程）
@Transactional(rollbackFor = Exception.class)
public void complete(Long id) {
    todoMapper.updateStatus(id, "done");          // 毫秒级
}

public void completeAndNotify(Long id) {
    complete(id);                                 // 事务方法（注意：必须跨 Bean 调用才生效）
    TransactionSynchronizationManager.registerSynchronization(...);  // 或简单点：提交后直接发
    webhookClient.postAsync("/notify", payload);  // 异步、带超时与重试
}`,
        },
        {
          type: 'diagram',
          caption: '事务里发 HTTP：10 个连接被慢调用占满，后面的请求全部排队超时；短事务 + 事后异步通知才是正解',
          svg: String.raw`<svg viewBox="0 0 680 320" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m07-pool" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#F59E0B"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="320" rx="12" fill="#0F1B2D"/>
  <text x="340" y="32" text-anchor="middle" font-size="16" fill="#E2E8F0">连接池只有 10 个：慢 HTTP 把它们全部拖住</text>

  <text x="76" y="66" text-anchor="middle" font-size="12" fill="#E2E8F0">请求进来</text>
  <rect x="24" y="76" width="104" height="44" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.4"/>
  <text x="76" y="96" text-anchor="middle" font-size="11.5" fill="#E2E8F0">@Transactional</text>
  <text x="76" y="112" text-anchor="middle" font-size="10.5" fill="#94A3B8">借一个连接</text>

  <line x1="128" y1="98" x2="176" y2="98" stroke="#F59E0B" stroke-width="1.8" marker-end="url(#arr-m07-pool)"/>

  <text x="290" y="66" text-anchor="middle" font-size="12" fill="#F59E0B">连接池（默认 10 个）</text>
  <g font-size="10" text-anchor="middle">
    <rect x="180" y="76" width="52" height="44" rx="8" fill="#3A2416" stroke="#F59E0B" stroke-width="1.4"/>
    <text x="206" y="95" fill="#FBBF24">conn 1</text><text x="206" y="110" fill="#FCA5A5">HTTP 3s</text>
    <rect x="240" y="76" width="52" height="44" rx="8" fill="#3A2416" stroke="#F59E0B" stroke-width="1.4"/>
    <text x="266" y="95" fill="#FBBF24">conn 2</text><text x="266" y="110" fill="#FCA5A5">HTTP 3s</text>
    <rect x="300" y="76" width="52" height="44" rx="8" fill="#3A2416" stroke="#F59E0B" stroke-width="1.4"/>
    <text x="326" y="95" fill="#FBBF24">conn 3</text><text x="326" y="110" fill="#FCA5A5">HTTP 3s</text>
    <rect x="360" y="76" width="52" height="44" rx="8" fill="#3A2416" stroke="#F59E0B" stroke-width="1.4"/>
    <text x="386" y="95" fill="#FBBF24">conn 4</text><text x="386" y="110" fill="#FCA5A5">HTTP 3s</text>
    <rect x="420" y="76" width="52" height="44" rx="8" fill="#3A2416" stroke="#F59E0B" stroke-width="1.4"/>
    <text x="446" y="95" fill="#FBBF24">conn 5</text><text x="446" y="110" fill="#FCA5A5">HTTP 3s</text>
    <rect x="480" y="76" width="52" height="44" rx="8" fill="#16223A" stroke="#475569" stroke-width="1.2"/>
    <text x="506" y="95" fill="#64748B">conn 6</text><text x="506" y="110" fill="#475569">空闲</text>
    <rect x="540" y="76" width="52" height="44" rx="8" fill="#16223A" stroke="#475569" stroke-width="1.2"/>
    <text x="566" y="95" fill="#64748B">conn 7</text><text x="566" y="110" fill="#475569">空闲</text>
    <rect x="600" y="76" width="52" height="44" rx="8" fill="#16223A" stroke="#475569" stroke-width="1.2"/>
    <text x="626" y="95" fill="#64748B">conn 8</text><text x="626" y="110" fill="#475569">空闲</text>
  </g>
  <text x="340" y="140" text-anchor="middle" font-size="11" fill="#FCA5A5">5 个并发各拖 3 秒 HTTP → 半个池子被无效占用；10 个并发 = 全占满</text>

  <rect x="24" y="156" width="628" height="42" rx="10" fill="#2A1620" stroke="#EF4444" stroke-width="1.4"/>
  <text x="338" y="174" text-anchor="middle" font-size="12" fill="#F87171">新请求拿不到连接 → 全部排队 → connection is not available / 接口雪崩式超时</text>
  <text x="338" y="191" text-anchor="middle" font-size="10.5" fill="#FCA5A5">看起来像「数据库挂了」，其实是事务里夹了慢调用</text>

  <text x="340" y="228" text-anchor="middle" font-size="13" fill="#6EE7B7">✓ 正确姿势：事务只包 DB 写，通知类副作用异步化</text>
  <g font-size="11" text-anchor="middle">
    <rect x="40" y="240" width="180" height="48" rx="10" fill="#12261E" stroke="#10B981" stroke-width="1.4"/>
    <text x="130" y="260" fill="#6EE7B7">@Transactional complete()</text>
    <text x="130" y="277" fill="#34D399">毫秒级落库 → 提交 → 归还连接</text>
    <line x1="220" y1="264" x2="268" y2="264" stroke="#10B981" stroke-width="1.6" marker-end="url(#arr-m07-pool)"/>
    <rect x="272" y="240" width="180" height="48" rx="10" fill="#12261E" stroke="#10B981" stroke-width="1.4"/>
    <text x="362" y="260" fill="#6EE7B7">事务提交后</text>
    <text x="362" y="277" fill="#34D399">postAsync 通知（带超时重试）</text>
    <line x1="452" y1="264" x2="500" y2="264" stroke="#10B981" stroke-width="1.6" marker-end="url(#arr-m07-pool)"/>
    <rect x="504" y="240" width="148" height="48" rx="10" fill="#16223A" stroke="#475569" stroke-width="1.2"/>
    <text x="578" y="260" fill="#94A3B8">通知失败？</text>
    <text x="578" y="277" fill="#64748B">重试 / 告警，不拖累主流程</text>
  </g>
  <text x="340" y="310" text-anchor="middle" font-size="11" fill="#94A3B8">一句话：事务的边界 = 数据库写操作的边界，一行慢调用都别放进来</text>
</svg>`,
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>对照前端记忆：</strong>事务里发 HTTP ≈ React 的 useEffect 里同步 await 一个慢接口再 setState，把整个渲染流水线卡住。正确姿势同样是「先落关键状态，副作用异步化」。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 4：批量操作循环单条 insert。</strong>导入 5000 条待办，写成 for 循环里 <code>todoMapper.insert(t)</code>——5000 次网络往返，本地 3 秒、跨机房 30 秒起步，还占着长事务：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: '批量对照',
          code: `// 反面教材：N 次往返
for (TodoCreateDTO dto : list) {
    todoMapper.insert(convert(dto));
}

// 修法 1（最省事）：MyBatis-Plus 的 saveBatch（内部按 batch_size=1000 分批提交）
todoService.saveBatch(convertList(list));

// 修法 2（最快）：XML foreach 拼多行 VALUES，一条 SQL 插完
// INSERT INTO todo_list (title, priority) VALUES
// <foreach collection="list" item="t" separator=",">
//   (#{t.title}, #{t.priority})
// </foreach>

// 注意上限：单条 SQL 也要有度，1 万条以上建议分片（每批 1000）`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 5：吞异常制造「假成功」。</strong>catch 之后既不抛也不记，返回 true——前端看到成功，数据根本没落库。修法在 m03-l08 讲过（log.error 带异常对象），业务层的加强版口诀：<strong>能处理的处理完往上返回成功；处理不了的原样上抛，让全局处理器说话；绝不 catch 后返回成功</strong>。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 6：Service 循环依赖。</strong>OrderService 注入 TodoService，TodoService 又注入 OrderService——Boot 2.6+ 直接启动失败（m04-l05 讲过报错长相）。业务层的根治思路是<strong>抽「中间层」</strong>：把两个 Service 都要用的能力抽成第三个 Service（如 ShareService / NotifyService），依赖图从环变树。这也回应了你对「业务的中间层」的疑问：<strong>中间层 = 被多个业务复用的能力层（通知、权限、审计、文件），它让依赖保持单向</strong>。</p>`,
        },
        {
          type: 'table',
          title: '业务层事故速查表',
          head: ['事故', '典型症状', '预防 / 修法'],
          rows: [
            ['上帝 Controller', '一个方法 300 行、注入 Mapper', '逻辑下沉 Service；Controller 只转发'],
            ['事务自调用', '方法内调本类事务方法不回滚', '拆到另一个 Service；或 self 注入走代理'],
            ['事务里发 HTTP', '高峰期全服务 DB 超时', '事务只包 DB 操作，副作用异步化'],
            ['循环单条 insert', '导入接口分钟级超时', 'saveBatch 或 foreach VALUES'],
            ['吞异常假成功', '前端显示成功但数据缺失', '异常上抛全局处理器；log.error 带堆栈'],
            ['Service 循环依赖', '启动报 form a cycle', '抽公共中间层，保持依赖单向'],
          ],
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>对待办清单项目跑一遍自查表：Controller 行数、事务边界、批量写法。</li>
<li>能复述「事务里为什么不能发 HTTP」的连接池视角。</li>
<li>理解中间层的价值：抽能力，保单向。</li></ul>
<p>阶段二只剩最后一站：m08 把项目打成 jar 部署出去。</p>`,
        },
      ],
      quiz: [
        {
          q: '同类中方法 A 调用带 @Transactional 的方法 B，事务失效。最推荐的根治修法是？',
          options: [
            '给 A 也加上 @Transactional',
            '把 B 挪到另一个 Service 类，跨 Bean 调用自然经过代理',
            '把 B 改成 static 方法',
            '在 B 里手动 catch 异常防止回滚',
          ],
          answer: 1,
          explain:
            '自调用失效的根因是 this 调用绕过了事务代理。跨 Bean 调用必然走代理，是最干净的修法；self 注入与 exposeProxy 属于应急。给 A 也加注解不解决「A 里 B 之前的 SQL 与 B 不在同一事务」的问题。',
        },
        {
          q: '@Transactional 方法里调用第三方 HTTP 接口（平均 3 秒），最大风险是？',
          options: [
            'HTTP 返回值无法序列化',
            '数据库连接被长期占用，高并发下连接池耗尽、全服务排队超时',
            '事务会自动变只读',
            '没有任何风险，只是代码不好看',
          ],
          answer: 1,
          explain:
            '事务未提交期间连接不归还池。10 个连接的池，5 个并发各拖 3 秒就把池占满，所有 DB 操作排队。修法：事务只包 DB 写，通知类副作用异步化。',
        },
        {
          q: '导入 8000 条数据，下列哪种写法性能最差？',
          options: [
            'service.saveBatch(list, 1000)',
            'XML foreach 拼多行 VALUES 分批插入',
            'for 循环里逐条 todoMapper.insert(dto)',
            '先转换全部 DTO，再一次批量入库',
          ],
          answer: 2,
          explain:
            '逐条 insert = 8000 次网络往返 + 8000 次提交，还可能撑出长事务。saveBatch 与 foreach VALUES 都把往返次数降到个位数。',
        },
        {
          q: '两个 Service 互相注入导致启动报循环依赖，从业务架构上最合适的解法是？',
          options: [
            '配置 allow-circular-references=true',
            '把两者都用到的能力（如通知、审计）抽成第三个 Service，让依赖变成单向树',
            '全部改成字段注入',
            '删掉其中一个 Service',
          ],
          answer: 1,
          explain:
            '循环依赖是职责划分问题的信号。抽公共「能力层/中间层」让 A→C、B→C，环自然解开。放行配置只是延后爆炸，字段注入不改变依赖关系。',
        },
      ],
    },

    /* ============================ m07-l07 毕业实战 ============================ */
    {
      id: 'm07-l07',
      title: '毕业实战：登录鉴权、标准分页与 Excel 导出',
      minutes: 60,
      goal: '把公司项目里出现率最高的三件标配补齐到待办清单项目：JWT 登录 + 拦截器鉴权、PageQuery→PageResultVO 标准分页、EasyExcel 流式导出。做完这课，你的项目骨架可以直接套进真实工作。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>这一课是阶段二的毕业设计。三件标配在几乎所有公司项目里都会出现：<strong>登录鉴权（知道是谁在调接口）、分页（列表接口的标准形态）、报表导出（老板最爱）</strong>。逐件落地。</p>
<p><strong>前置准备（1 分钟）</strong>：登录要用到用户数据。m05 你建过 <code>user</code> 表，m06 课后练习里让它照 Todo 的三步生成了 <code>User</code> 实体 + <code>UserMapper</code>——如果还没做，现在补上，本课所有代码都建立在它之上。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>实战 1：登录鉴权（JWT 方案）。</strong>前后端分离项目里，服务端不再用 Session 记住你，而是发一张「签名过的通行证」——登录成功返回一个 JWT 字符串，之后每次请求放进 <code>Authorization: Bearer xxx</code> 头里带上，服务端验签通过就放行：</p>`,
        },
        {
          type: 'compare',
          title: 'Session vs JWT 怎么选',
          head: ['维度', 'Session + Cookie', 'JWT（前后端分离主流）'],
          rows: [
            ['状态存放', '服务端存会话（占内存/Redis）', '无状态，信息编码在令牌里'],
            ['跨域 / App 支持', 'Cookie 麻烦，App 需额外处理', '放 Header 即可，天然友好'],
            ['注销', '直接删 Session，立即可靠', '签发短的过期时间 + 主动维护黑名单'],
            ['适用', '传统多页应用', 'Vue 单页 + App + 小程序'],
          ],
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'AuthService.java（登录签发）',
          code: `// 依赖：io.jsonwebtoken:jjwt-api 0.12.x（+ jjwt-impl / jjwt-jackson 运行时）
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final SecretKey key;                 // 从配置读取（见下方说明），绝不硬编码

    @Override
    public LoginVO login(LoginDTO dto) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, dto.getUsername()));
        // 密码校验用 BCrypt：数据库只存密文；错误信息统一模糊，不提示「用户不存在还是密码错」
        if (user == null || !BCrypt.checkpw(dto.getPassword(), user.getPassword())) {
            throw new BizException(ErrorCode.LOGIN_FAILED);
        }
        // 签发 JWT：只放 id 和昵称。前两段是 Base64 可解码的，别塞密码/手机号进去
        String token = Jwts.builder()
                .subject(user.getId().toString())
                .claim("nickname", user.getNickname())
                .expiration(Date.from(Instant.now().plus(2, ChronoUnit.HOURS)))   // 2 小时过期
                .signWith(key)
                .compact();
        return new LoginVO(token, user.getNickname());
    }
}

// 密钥配置（application.yml）——生产环境从环境变量注入，见 m08 配置外置
// app.jwt.secret: 一个足够长的随机串，泄露=任何人可伪造登录`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'AuthInterceptor.java（统一验签）',
          code: `public class AuthInterceptor implements HandlerInterceptor {

    private final SecretKey key;

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object handler) {
        String auth = req.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            resp.setStatus(401);
            return false;                         // 没带令牌，直接拦下
        }
        try {
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(auth.substring(7))    // 去掉 "Bearer " 前缀
                    .getPayload();                          // 验签 + 查过期，失败抛 JwtException
            req.setAttribute("userId", Long.valueOf(claims.getSubject()));
            return true;
        } catch (JwtException e) {
            resp.setStatus(401);
            return false;
        }
    }
}

// 注册拦截器：登录接口本身必须放行，否则死循环
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AuthInterceptor(key))
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/login", "/error");
    }
}

// 业务代码里取当前用户：Long userId = (Long) request.getAttribute("userId");`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>三个必守的安全底线：</strong>① 密钥绝不进代码库（环境变量注入）；② payload 里只放非敏感字段（Base64 不是加密，任何人可解）；③ 生产建议把过期时间设短（2h）+ 配合刷新令牌机制，登出要做黑名单。入门阶段做到「验签 + 过期」就够，细节进阶再学。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>实战 2：标准分页封装。</strong>公司项目的列表接口永远是 <code>GET /api/todos/page?pageNum=1&amp;pageSize=10</code>。把分页参数、返回结构做成<strong>通用类</strong>，所有模块复用：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'PageQuery.java + PageResultVO.java（通用件）',
          code: `// 入参：所有列表接口的查询基类，校验防拖库
@Data
public class PageQuery {
    @Min(value = 1, message = "页码从 1 开始")
    private long pageNum = 1;

    @Max(value = 100, message = "每页最多 100 条")     // 没有上限 = 前端传 100000 一次拖全表
    private long pageSize = 10;
}

// 出参：直接对接前端的 rows/total 分页组件结构
public record PageResultVO<T>(long total, long pageNum, long pageSize, List<T> records) {
    public static <T> PageResultVO<T> of(Page<T> page) {
        return new PageResultVO<>(page.getTotal(), page.getCurrent(), page.getSize(), page.getRecords());
    }
}

// Service：MP 的 selectPage 两条 SQL（count + 分页查询），插件已在 m06 配好
@Override
public PageResultVO<TodoVO> page(TodoPageQuery query) {
    LambdaQueryWrapper<Todo> w = new LambdaQueryWrapper<Todo>()
            .like(StrUtil.isNotBlank(query.getTitle()), Todo::getTitle, query.getTitle())   // 非空才拼条件
            .orderByDesc(Todo::getCreatedAt);
    Page<Todo> page = todoMapper.selectPage(new Page<>(query.getPageNum(), query.getPageSize()), w);
    return PageResultVO.of(page.convert(this::toVO));        // PO → VO 转换一气呵成
}

// Controller：薄薄一层
@GetMapping("/page")
public Result<PageResultVO<TodoVO>> page(@Valid TodoPageQuery query) {
    return Result.ok(todoService.page(query));
}`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>实战 3：Excel 报表导出（EasyExcel）。</strong>用阿里 EasyExcel（省内存版 POI）：它流式写、不把整张表装进堆。核心是「拿到 response 输出流 → 指定模板类 → 逐行写出」。前端下载直接 <code>window.open('/api/todos/export')</code> 或 a 标签即可：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TodoExportVO.java + 导出接口',
          code: `// 导出模板类：@ExcelProperty 决定列名与顺序
@Data
public class TodoExportVO {
    @ExcelProperty("编号")     private Long id;
    @ExcelProperty("标题")     private String title;
    @ExcelProperty("状态")     private String status;
    @ExcelProperty("创建时间") private LocalDateTime createdAt;
}

// Controller：文件下载不走 Result<T>，直接写响应流
@GetMapping("/export")
public void export(HttpServletResponse response) throws IOException {
    response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    response.setCharacterEncoding("utf-8");
    String fileName = URLEncoder.encode("待办清单", StandardCharsets.UTF_8).replaceAll("\\\\+", "%20");
    response.setHeader("Content-Disposition", "attachment;filename*=utf-8''" + fileName + ".xlsx");

    // 数据量小：一次查出。数据量大（几十万行）：分批查 + 多次 doWrite，堆内存占用恒定
    List<TodoExportVO> data = todoService.listForExport();

    EasyExcel.write(response.getOutputStream(), TodoExportVO.class)
             .sheet("待办清单")
             .doWrite(data);
}

// 大数据量导出的骨架（记住思路，真遇到再抄）：
// try (ExcelWriter writer = EasyExcel.write(out, TodoExportVO.class).build()) {
//     WriteSheet sheet = EasyExcel.writerSheet("待办清单").build();
//     long lastId = 0;
//     while (true) {
//         List<TodoExportVO> batch = todoService.listBatchAfter(lastId, 1000);   // 游标分批（m05-l06 同款思路）
//         if (batch.isEmpty()) break;
//         writer.write(batch, sheet);
//         lastId = 最后一条的 id;
//     }
// }`,
        },
        {
          type: 'table',
          title: '毕业检查清单：对照公司项目的自我验收',
          head: ['检查项', '达标标准'],
          rows: [
            ['分层', 'Controller 全部 ≤ 10 行，Mapper 不出现在 Controller'],
            ['校验', 'DTO 上有 Bean Validation 注解，Service 里抛 BizException'],
            ['返回', '全站统一 Result{code,msg,data}，错误码集中在 ErrorCode 枚举'],
            ['事务', '批量操作在 Service 且 rollbackFor=Exception.class'],
            ['鉴权', '拦截器统一验 JWT，登录接口在白名单'],
            ['分页', 'PageQuery 上限 100，PageResultVO 全站复用'],
            ['导出', '流式写出，大数据量分批查'],
            ['部署', 'jar 外置配置 + 生产 JVM 参数模板（m08）'],
          ],
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>对照前端收尾：</strong>JWT 登录 ≈ 你写的 token + axios 拦截器那一套，只是后端自己也要拦；PageResultVO ≈ 后端把 <code>{total, records}</code> 对齐 antd Table 的 props；EasyExcel 流式导出 ≈ 前端大文件下载走流而不先攒 blob。<strong>学到这里，你在公司项目里应该能独立完成「一个新模块从建表、Mapper、Service 到接口和导出」的完整交付</strong>——这正是本课程承诺的「能上手基础的 Java 项目」。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>给待办清单项目补上 /api/auth/login、拦截器、/page、/export 四个能力。</li>
<li>用 Postman 验证：无 token 访问列表返回 401，登录后带 Bearer 头返回数据。</li>
<li>导出的 Excel 能正常打开且列名正确。</li></ul>
<p>阶段二到此正式毕业。阶段三（Redis / Docker）给这个项目上缓存、装箱交付。</p>`,
        },
      ],
      quiz: [
        {
          q: 'JWT 的 payload 段可以放哪些内容？',
          options: [
            '用户密码的 MD5，方便后续校验',
            '手机号、身份证等个人信息，方便各接口取用',
            '只放非敏感字段（如 userId、昵称）；Base64 可解码不是加密，敏感信息会直接泄漏',
            '随便放，因为 payload 是加密的',
          ],
          answer: 2,
          explain:
            'JWT 的 Header 和 Payload 是 Base64 编码，任何人可解码查看，只有签名保证不可篡改。放密码或证件号等于明文泄漏。只放 userId 等标识，敏感数据落库查询。',
        },
        {
          q: '分页接口不给 pageSize 设上限，最直接的风险是？',
          options: [
            '前端渲染太慢',
            '一次请求把整张表拖出来：内存、带宽、连接全被打满，等于变相拖库',
            'MySQL 直接报错拒绝查询',
            '分页插件失效',
          ],
          answer: 1,
          explain:
            'pageSize=100000 就是一次全表查询。@Max(100) 这类上限校验是最廉价的防御；配合 @Min(1) 防负数。这也是接口评审必查项。',
        },
        {
          q: '导出 50 万行数据到 Excel，下列哪种做法正确？',
          options: [
            '一条 SQL 查出全部 50 万行，EasyExcel 一次 doWrite',
            '游标/按 id 分批查询（每批 1000），循环多次 write，内存占用恒定',
            '分 50 次请求让前端拼 Excel',
            '先把 50 万行全部转成 JSON 存 Redis 再导出',
          ],
          answer: 1,
          explain:
            '全量加载会把堆内存和连接池同时打爆。分批查询 + 流式写出让内存占用与总数据量无关；EasyExcel 的多次 write 正是为这个场景设计的。',
        },
        {
          q: '拦截器注册后，/api/auth/login 也被拦了导致无法登录。修法是？',
          options: [
            '把登录接口改成 GET 请求',
            '在 excludePathPatterns 里放行登录接口与静态资源，拦截路径收窄到需要鉴权的 /api/**',
            '关闭拦截器，改在每个接口手动判断',
            '把 JWT 过期时间设为 24 小时',
          ],
          answer: 1,
          explain:
            '登录接口本身必须匿名可访问，否则死循环。excludePathPatterns 登录 + /error 等兜底路径，addPathPatterns 收窄到业务前缀，是最小放行面写法。',
        },
      ],
    },
  ],
};
