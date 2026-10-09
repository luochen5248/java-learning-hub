import type { RawModule } from '../types/course'

/**
 * m03 · Java 够用语法（对照 TypeScript 学）—— 课程数据
 *
 * 只讲「写后端够用」的语法：能做 Web CRUD、能看懂框架源码即可，不做语言律师。
 * 基线 JDK 17（可直接用 var / record / 文本块 / Stream.toList()）。
 * 每课至少一张 TS ↔ Java 对照表（compare）。
 */

export const module: RawModule = {
  id: 'm03',
  order: 3,
  title: 'Java 够用语法',
  subtitle: '对照 TypeScript 学，只学用得上的',
  phase: 'phase1',
  phaseName: '阶段一 · 快速上手',
  icon: '☕',
  cover: 'assets/img/m03-java.jpg',
  minutes: 215,
  summary:
    '不打算把你培养成 Java 语言专家，只到「能写业务、能读懂框架源码」为止。八课覆盖变量与类型、字符串、集合与 Stream、类与接口、异常与泛型、Lambda 与 Optional，最后两课做类型系统深挖（整型溢出、拆箱 NPE、BigDecimal 金额、日期时间 API）与新手避坑清单。每一课都用你熟悉的 TypeScript 写法对照，把认知差集中在真正不同的地方：强类型的代价、包装类陷阱、TS 接口与 Java 接口的本质差异、受检异常。',

  /* ---------------- 闪卡 14 张 ---------------- */
  flashcards: [
    { front: '引用类型怎么比较内容？', back: '用 equals 比内容，== 比的是引用地址。基本类型才用 ==', tag: '易错' },
    { front: 'Integer 用 == 比较何时「意外正确」？', back: '值在 -128~127 之间命中常量池缓存；超出范围则为 false，千万别依赖它', tag: '坑点' },
    { front: '数组、字符串、集合的长度怎么取？', back: '数组 arr.length；字符串 str.length()；集合 list.size()。三个都不一样', tag: '易错' },
    { front: '循环里大量拼接字符串用什么？', back: 'StringBuilder（单线程）；StringBuffer 是加了锁的线程安全版本，更慢', tag: 'API' },
    { front: 'String.split 的参数是什么类型？', back: '是正则表达式，点号与竖线都要转义：写 split("\\\\.")；字面量建议用 Pattern.quote()', tag: '坑点' },
    { front: 'List 接口的两种实现怎么选？', back: 'ArrayList 数组实现按下标查快；LinkedList 链表实现中间增删快。实际九成场景用 ArrayList', tag: '集合' },
    { front: 'Map 最常用的遍历写法？', back: 'map.forEach((k, v) -> ...)；需要 key 和 value 成对时用 entrySet() 遍历', tag: '集合' },
    { front: '一条 Stream 能否消费两次？', back: '不能。第二次终止操作会抛 IllegalStateException，需重新从集合取 stream()', tag: '坑点' },
    { front: '受检异常（checked）必须怎么处理？', back: '必须 try/catch 或在方法签名上 throws 声明，否则编译不过；RuntimeException 不需要', tag: '异常' },
    { front: 'Optional 取值的安全写法？', back: 'orElse / orElseGet / orElseThrow / ifPresent；直接 get() 无值会抛异常', tag: 'Exception' },
    { front: '金额计算为什么禁止 double？', back: '浮点是二进制小数，0.1 都存不准。金额一律 BigDecimal，且用 String 构造器创建', tag: '坑点' },
    { front: 'BigDecimal 怎么比较大小？', back: '用 compareTo。equals 会把精度（scale）也算进去：2.0 与 2.00 equals 为 false', tag: 'API' },
    { front: 'Integer 拆箱 NPE 何时发生？', back: '包装类变量为 null 时赋给基本类型（如 Integer amount = null; int x = amount;）立即 NPE。数据库可空字段必须用包装类型', tag: '坑点' },
    { front: '遍历集合时想边删边遍，怎么办？', back: 'iterator.remove() 或 list.removeIf(条件)；直接 list.remove 会抛 ConcurrentModificationException', tag: '坑点' },
  ],

  lessons: [
    /* ============================ L01 ============================ */
    {
      id: 'm03-l01',
      title: '变量与类型：强类型的代价',
      minutes: 25,
      goal: '掌握 8 种基本类型与包装类、自动装箱机制，理解 var 与 TS 类型推断的差别，避开 == 的经典陷阱。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>先说一个会改变你写代码姿势的事实：<strong>TypeScript 的类型是可擦除的注解</strong>，编译成 JS 后就消失了，运行时可以随便骗过去；<strong>Java 的类型是运行期的真实约束</strong>，一个变量声明成 int，它这辈子都只能装 int。</p>
<p>这意味着 Java 里几乎不存在「类型不对但能跑」的情况——错误都在编译期被 IDE 拦下了。这是好事，代价是声明更啰嗦一点。</p>`,
        },
        {
          type: 'compare',
          title: 'TS ↔ Java 类型声明对照',
          head: ['TypeScript', 'Java', '说明'],
          rows: [
            ['let count: number = 10;', 'int count = 10;', 'Java 把类型写在变量名前面'],
            ['const name = "Tom";', 'String name = "Tom";', 'Java 的 String 首字母大写'],
            ['const arr: string[] = [];', 'List&lt;String&gt; list = new ArrayList&lt;&gt;();', '泛型写在后面，且必须 new 出具体实现'],
            ['let x: number | string;', '无直接对应', 'Java 没有联合类型，靠重载或接口近似'],
            ['let y: any;', 'Object y;', '都能装一切，但都失去类型保护，不推荐'],
            ['const n = 1;（自动推导）', 'var n = 1;', 'JDK 10+ 的 var，只能用于局部变量'],
            ['type Box = { id: number };', 'record Box(long id) {}', 'JDK 17 的 record 最接近不可变 DTO'],
            ['let a: number | undefined;', 'Optional&lt;Long&gt; a;', 'Java 没有可选链，用 Optional 容器表达'],
          ],
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TypeDemo.java',
          code: String.raw`public class TypeDemo {
    public static void main(String[] args) {
        // 1. 基本类型：变量里直接存值，不是对象，没有方法可调
        int count = 10;
        long id = 1_000_000_000L;   // long 需要后缀 L；下划线只是数字分隔符
        double rate = 0.15;         // 小数默认 double，写 float 要加后缀 F
        boolean done = false;
        char flag = 'A';            // 单引号是 char，双引号是 String，写反编译报错

        // 2. var：JDK 10+ 的局部变量类型推断
        var name = "待办清单";       // 推断为 String
        // var x;                   // 编译错误：没有初值就推不出来

        // 3. 包装类：每种基本类型都有对应的对象形态
        Integer boxed = count;      // 自动装箱 int -> Integer
        int unboxed = boxed;        // 自动拆箱 Integer -> int

        System.out.println(name + " 共 " + count + " 条，完成率 " + rate);
        System.out.println(flag + " / " + done + " / " + id);
    }
}`,
        },
        {
          type: 'table',
          title: '8 种基本类型与包装类',
          head: ['基本类型', '包装类', '占用', '什么时候用'],
          rows: [
            ['byte', 'Byte', '1 字节', '很少用，处理二进制流时'],
            ['short', 'Short', '2 字节', '很少用'],
            ['int', 'Integer', '4 字节', '整数默认值，绝大多数场景'],
            ['long', 'Long', '8 字节', '主键 id、时间戳毫秒、金额（单位分）'],
            ['float', 'Float', '4 字节', '很少用，精度不如 double'],
            ['double', 'Double', '8 字节', '小数的默认选择'],
            ['char', 'Character', '2 字节', '单个字符，业务里基本不用'],
            ['boolean', 'Boolean', '1 位', '布尔开关'],
          ],
        },
        {
          type: 'text',
          html: String.raw`<p>为什么要有两套？因为<strong>集合只能装对象</strong>——<code>List&lt;int&gt;</code> 是非法的，必须写 <code>List&lt;Integer&gt;</code>。装箱拆箱由编译器自动完成，平时感知不到，但它是下面这个陷阱的根源。</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'CacheTrap.java',
          code: String.raw`public class CacheTrap {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        System.out.println(a == b);        // true：命中 -128~127 缓存，指向同一个对象
        System.out.println(a.equals(b));   // true：equals 永远比的是内容

        Integer c = 128, d = 128;
        System.out.println(c == d);        // false：超出缓存范围，是两个不同对象
        System.out.println(c.equals(d));   // true

        String s1 = new String("todo");
        String s2 = new String("todo");
        System.out.println(s1 == s2);      // false：两个不同的对象地址
        System.out.println(s1.equals(s2)); // true：内容相同
    }
}`,
        },
        {
          type: 'diagram',
          caption: 'Integer 缓存池：为什么 127 相等、128 不相等',
          svg: String.raw`<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m03-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="12" fill="#0F1B2D"/>
  <text x="340" y="38" text-anchor="middle" font-size="17" fill="#E2E8F0">Integer 缓存池：-128 ~ 127 复用同一个对象</text>

  <g>
    <rect x="24" y="60" width="300" height="104" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.6"/>
    <text x="174" y="84" text-anchor="middle" font-size="13" fill="#E2E8F0">Integer a = 127; Integer b = 127;</text>
    <text x="174" y="108" text-anchor="middle" font-size="13" fill="#F59E0B">a == b  →  true</text>
    <text x="174" y="132" text-anchor="middle" font-size="12" fill="#94A3B8">值在缓存范围内：a 和 b 指向同一格</text>
    <text x="174" y="152" text-anchor="middle" font-size="12" fill="#94A3B8">a.equals(b)  →  true（比内容，永远正确）</text>
  </g>

  <g>
    <rect x="356" y="60" width="300" height="104" rx="10" fill="#1B2A44" stroke="#EF4444" stroke-width="1.6"/>
    <text x="506" y="84" text-anchor="middle" font-size="13" fill="#E2E8F0">Integer c = 128; Integer d = 128;</text>
    <text x="506" y="108" text-anchor="middle" font-size="13" fill="#F59E0B">c == d  →  false</text>
    <text x="506" y="132" text-anchor="middle" font-size="12" fill="#94A3B8">超出缓存范围：各自 new 出新对象</text>
    <text x="506" y="152" text-anchor="middle" font-size="12" fill="#94A3B8">c.equals(d)  →  true（内容依然相同）</text>
  </g>

  <path d="M174 168 L174 196 L120 196" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m03-a)"/>
  <path d="M506 168 L506 196 L560 196" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m03-a)"/>

  <g>
    <rect x="30" y="216" width="290" height="118" rx="10" fill="#16233A" stroke="#10B981" stroke-width="1.4"/>
    <text x="175" y="244" text-anchor="middle" font-size="13" fill="#22D3EE">IntegerCache 常量池（-128 ~ 127）</text>
    <rect x="52" y="258" width="60" height="34" rx="6" fill="#1B2A44" stroke="#3B82F6"/>
    <text x="82" y="280" text-anchor="middle" font-size="13" fill="#E2E8F0">126</text>
    <rect x="124" y="258" width="60" height="34" rx="6" fill="#0F3B2A" stroke="#10B981" stroke-width="1.8"/>
    <text x="154" y="280" text-anchor="middle" font-size="13" fill="#E2E8F0">127</text>
    <rect x="196" y="258" width="102" height="34" rx="6" fill="#1B2A44" stroke="#3B82F6"/>
    <text x="247" y="280" text-anchor="middle" font-size="12" fill="#94A3B8">共 256 个格子</text>
    <text x="175" y="320" text-anchor="middle" font-size="12" fill="#94A3B8">装箱时先查这里，命中就直接复用对象</text>
  </g>

  <g>
    <rect x="360" y="216" width="296" height="118" rx="10" fill="#16233A" stroke="#EF4444" stroke-width="1.4"/>
    <text x="508" y="244" text-anchor="middle" font-size="13" fill="#22D3EE">堆内存：128 没有被缓存</text>
    <rect x="384" y="258" width="110" height="34" rx="6" fill="#1B2A44" stroke="#EF4444"/>
    <text x="439" y="280" text-anchor="middle" font-size="13" fill="#E2E8F0">Integer(128) c</text>
    <rect x="522" y="258" width="110" height="34" rx="6" fill="#1B2A44" stroke="#EF4444"/>
    <text x="577" y="280" text-anchor="middle" font-size="13" fill="#E2E8F0">Integer(128) d</text>
    <text x="508" y="320" text-anchor="middle" font-size="12" fill="#94A3B8">两块不同内存，== 比较地址自然为 false</text>
  </g>
</svg>`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>经典陷阱：字符串与包装类的比较必须写 equals。</strong>前端 <code>===</code> 一把梭的习惯到这里必须改：Java 的 <code>==</code> 只比较引用地址。</p>
<p>写判断时还有个小技巧——<strong>把常量写在前面</strong>：<code>"todo".equals(status)</code>。这样即使 status 是 null 也只会返回 false，而 <code>status.equals("todo")</code> 会直接抛空指针。</p>`,
        },
        {
          type: 'tip',
          html: String.raw`<p><strong>三个「长度」，一天记不住就打三次：</strong></p>
<ul><li>数组：<code>arr.length</code>（属性，无括号）</li>
<li>字符串：<code>str.length()</code>（方法）</li>
<li>集合：<code>list.size()</code>（方法）</li></ul>
<p>Java 里没有 JavaScript 那种「万物皆对象」的统一接口，所以这类差异只能靠肌肉记忆。IDE 不给补全时换个拼写试试即可。</p>`,
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>强类型带来的另一个显著差异：</strong>Java 的方法签名必须写返回类型和参数类型，没有 TS 那种「不写就是 any」的逃生门。</p>
<p>好处是 IDEA 的推断能力很强：写完 <code>=</code>，光标放到声明行按 <code>Alt + Enter</code> 选「引入变量」能自动补出类型；<code>var</code> 则让你兼顾简洁。实际开发里的手感接近「写 TS，但类型必须落到实处」。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能说出 8 种基本类型里真正会用到的 4 个：<code>int</code>、<code>long</code>、<code>double</code>、<code>boolean</code>。</li>
<li>能解释为什么 <code>Integer c = 128, d = 128; c == d</code> 是 false。</li>
<li>所有引用类型的内容比较都用 equals，且常量写前面。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: '关于 Java 中 == 与 equals 的区别，正确的是？',
          options: [
            '两者完全等价，只是写法不同',
            '== 比较引用地址，equals 比较内容',
            'equals 比较地址，== 比较内容',
            '基本类型必须用 equals 比较',
          ],
          answer: 1,
          explain:
            '== 比较的是引用是否指向同一个对象（基本类型才比数值），equals 才是内容比较。基本类型用 ==，引用类型一律用 equals。',
        },
        {
          q: '执行 Integer c = 128, d = 128; 再打印 c == d，结果是？',
          options: ['true', 'false', '编译错误', '运行时异常'],
          answer: 1,
          explain:
            'Integer 只缓存 -128~127 的值，128 超出范围会各自创建新对象，== 比较地址结果为 false。若换成 127 则会因缓存复用得到 true，这正是该陷阱危险的地方。',
        },
        {
          q: '下列说法错误的是？',
          options: [
            '数组取长度是 arr.length',
            '字符串取长度是 str.length()',
            '集合取长度是 list.size()',
            '集合取长度是 list.length',
          ],
          answer: 3,
          explain: '集合统一用 size() 方法。length 只用于数组，字符串用的是 length() 方法，三者写法各不相同。',
        },
      ],
    },

    /* ============================ L02 ============================ */
    {
      id: 'm03-l02',
      title: '字符串与常用 API',
      minutes: 25,
      goal: '理解 String 不可变带来的影响，掌握 StringBuilder、格式化与文本块，避开 split 的正则陷阱。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>Java 的 <code>String</code> 是<strong>不可变对象</strong>：一旦创建，内容不能改。你以为的「修改」，实际是<strong>创建了一个新字符串</strong>。</p>
<p>这点和 JS 字符串行为一致，区别在于 Java 的字符串字面量会在<strong>常量池里缓存</strong>，而且用 <code>+</code> 在循环里拼接会把性能拖垮。</p>`,
        },
        {
          type: 'compare',
          title: 'TS / JS ↔ Java 字符串对照',
          head: ['JS / TS', 'Java', '说明'],
          rows: [
            ['const s = "abc"', 'String s = "abc";', '基础写法一致，注意首字母大写'],
            ['s.length', 's.length()', 'Java 是方法，必须带括号'],
            ['s.split("-")', 's.split("-")', '都有，但 Java 的参数是正则表达式'],
            ['s.trim()', 's.strip()（JDK 11+）', 'trim 只去 ASCII 空白，strip 支持全角空格'],
            ['&#96;共 ${n} 条&#96;', 'String.format("共 %d 条", n)', 'Java 没有模板字符串'],
            ['&#96;a ${b}&#96;', '"%s".formatted(b) 或 + 拼接', 'JDK 15+ 还有三重引号文本块'],
            ['s.includes("x")', 's.contains("x")', '方法名不同'],
            ['arr.join(",")', 'String.join(",", list)', 'Java 是静态方法，参数顺序相反'],
            ['循环里 s += x', 'new StringBuilder().append(x)', 'Java 循环拼接必须用 StringBuilder'],
          ],
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'StringDemo.java',
          code: String.raw`public class StringDemo {
    public static void main(String[] args) {
        String title = "  Hello Java  ";

        System.out.println(title.strip());              // 去首尾空白（JDK 11+）
        System.out.println(title.length());             // 注意是方法 length()
        System.out.println(title.toUpperCase());
        System.out.println(title.contains("Java"));
        System.out.println(title.equals("Hello Java"));       // false：两端有空格
        System.out.println(title.strip().equals("Hello Java")); // true

        // split 的参数是正则表达式，点号必须转义，否则得到空数组
        String[] wrong = "192.168.1.1".split(".");     // 错误写法，结果是长度 0 的数组
        String[] right = "192.168.1.1".split("\\.");   // 正确写法
        System.out.println(wrong.length + " / " + String.join("-", right));

        // 循环拼接必须用 StringBuilder（单线程）；StringBuffer 线程安全但更慢
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 5; i++) {
            sb.append("todo-").append(i).append(" ");
        }
        System.out.println(sb.toString().strip());

        // 格式化：%d 整数、%s 字符串、%f 浮点、%n 跨平台换行
        int total = 10, done = 3;
        System.out.printf("共 %d 条，已完成 %d 条%n", total, done);
        System.out.println("完成率 %.0f%%".formatted(100.0 * done / total));

        // JDK 15+ 文本块：写多行 JSON / SQL 不用再拼加号
        String json = """
                {
                  "id": 1,
                  "title": "写第一个接口"
                }
                """;
        System.out.println(json);
    }
}`,
        },
        {
          type: 'table',
          title: 'String 常用 API 速查',
          head: ['方法', '作用', '返回'],
          rows: [
            ['equals / equalsIgnoreCase', '比较内容（后者忽略大小写）', 'boolean'],
            ['length', '字符串长度，注意是方法', 'int'],
            ['isEmpty / isBlank', '是否为空串 / 是否全为空白', 'boolean'],
            ['strip / trim', '去除首尾空白，返回新对象', 'String'],
            ['substring(a, b)', '截取 [a, b) 区间的子串', 'String'],
            ['contains / startsWith / endsWith', '包含 / 前缀 / 后缀判断', 'boolean'],
            ['indexOf / lastIndexOf', '查找位置，找不到返回 -1', 'int'],
            ['replace / replaceAll', '替换字面量 / 按正则替换', 'String'],
            ['split', '按正则切分，返回数组', 'String[]'],
            ['toUpperCase / toLowerCase', '大小写转换', 'String'],
            ['String.join', '静态方法，用分隔符连接集合', 'String'],
            ['formatted / String.format', '格式化占位符', 'String'],
          ],
        },
        {
          type: 'fe',
          html: String.raw`<p>把 <strong>StringBuilder</strong> 想成一个可变的字符缓冲区——和 LeetCode 里用数组 <code>push</code> 再 <code>join('')</code> 是同一个思路，Java 直接把这个容器给了你。</p>
<p><strong>文本块（JDK 15+）</strong>则是模板字符串的加强版：写 SQL、写 JSON 片段时不用再到处加 <code>\n</code> 和加号，所见即所得。后面的数据库模块会大量用到。</p>`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑 1：<code>split</code> 的参数是正则表达式。</strong>这是从 JS 转过来最容易踩的坑：JS 里 <code>split(".")</code> 按字面点号切；Java 里点号代表「任意字符」，结果得到<strong>空数组</strong>。需要写成 <code>split("\\.")</code>，竖线同理写成 <code>split("\\|")</code>。如果只是按字面量切，用 <code>Pattern.quote(".")</code> 最省心。</p>
<p><strong>坑 2：字符串判空。</strong><code>null</code> 调用任何方法都会抛 <code>NullPointerException</code>。安全写法是 <code>str != null &amp;&amp; !str.isBlank()</code>，或者用 Spring 提供的 <code>StringUtils.hasText(str)</code>。</p>`,
        },
        {
          type: 'tip',
          html: String.raw`<p><strong>判断「内容等于某个固定值」时，把常量写前面。</strong><code>"admin".equals(role)</code> 而不是 <code>role.equals("admin")</code>。前者在 role 为 null 时安静返回 false，后者直接抛异常。这是 Java 面试高频题，也是实际项目里减少空指针最实用的一个习惯。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能说出 String 不可变意味着什么，以及循环拼接为什么必须用 StringBuilder。</li>
<li>能正确按点号切分 IP 字符串。</li>
<li>会用 <code>String.format</code> 拼带变量的句子，会用文本块写多行 JSON。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: '想把 "192.168.1.1" 按字面点号切成四段，正确的 split 参数是？',
          options: ['"."', '"\\."', '"\\\\."', '"\\\\d"'],
          answer: 2,
          explain:
            'split 接收的是正则表达式，点号在正则里代表「任意字符」。Java 字符串字面量里要用两个反斜杠才能表示正则中的一个反斜杠，所以正确写法是源码里写 split("\\\\.")。只有一个反斜杠的 split("\\.") 是非法转义、编译不过；"\\\\d" 虽能编译但匹配的是数字，切不出点号。若想完全避免转义，可用 Pattern.quote(".")。',
        },
        {
          q: '在循环里拼接一万次字符串，推荐做法是？',
          options: [
            '直接用 += 拼接，编译器会自动优化',
            '使用 StringBuilder 的 append 方法',
            '使用 String.concat 方法',
            '先放进数组最后再 join',
          ],
          answer: 1,
          explain:
            'String 不可变，每次拼接都产生新对象。StringBuilder 内部是可扩容的字符数组，append 不反复创建对象，大量拼接时差距非常明显。',
        },
        {
          q: '下列写法能够避免 NullPointerException 的是？',
          options: ['role.equals("admin")', '"admin".equals(role)', 'role == "admin"', 'role.equalsIgnoreCase("admin")'],
          answer: 1,
          explain:
            '常量在前调用 equals，即使变量为 null 也只返回 false；而由可能为 null 的变量发起方法调用都会空指针；== 则是比较地址，不是内容。',
        },
      ],
    },

    /* ============================ L03 ============================ */
    {
      id: 'm03-l03',
      title: '集合框架与 Stream',
      minutes: 30,
      goal: '掌握 List / Map / Set 的选型与 Stream 管道写法，把 JS 数组方法链迁移到 Java。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p><strong>集合是 Java 日常开发里用得最多的一组 API</strong>。好消息是：如果你熟悉 JS 的数组方法链（<code>filter</code> / <code>map</code> / <code>reduce</code>），Stream 几乎是同一套心智。</p>
<p>需要适应的两点：一是接口和实现分开（<code>List</code> 是接口，<code>ArrayList</code> 才是实现，必须 new 出来）；二是泛型写在类型后面。</p>`,
        },
        {
          type: 'compare',
          title: 'TS / JS ↔ Java 集合对照',
          head: ['TS / JS', 'Java', '说明'],
          rows: [
            ['const arr = []', 'List&lt;String&gt; list = new ArrayList&lt;&gt;();', '必须指定具体实现'],
            ['const set = new Set()', 'Set&lt;String&gt; set = new HashSet&lt;&gt;();', '去重集合'],
            ['const m = new Map()', 'Map&lt;String, Object&gt; m = new HashMap&lt;&gt;();', '键值对'],
            ['arr.push(x)', 'list.add(x)', '添加元素'],
            ['arr.find(x =&gt; x.id === 1)', 'list.stream().filter(x -&gt; x.id() == 1L).findFirst()', 'Java 返回 Optional'],
            ['arr.map(fn)', 'list.stream().map(fn).toList()', 'JDK 16+ 可直接 toList()'],
            ['arr.filter(fn)', 'list.stream().filter(fn).toList()', '中间操作，惰性执行'],
            ['arr.reduce(fn)', 'list.stream().reduce(a, b)', '写法不同但思路一致'],
            ['lodash.groupBy(arr, k)', 'list.stream().collect(Collectors.groupingBy(k))', '需要 Collectors'],
            ['arr.length', 'list.size()', '属性 → 方法'],
            ['[...new Set(arr)]', 'new ArrayList&lt;&gt;(new HashSet&lt;&gt;(list))', '去重套路'],
            ['for (const x of arr)', 'for (String x : list)', '增强 for 循环'],
          ],
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'CollectionDemo.java',
          code: String.raw`import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CollectionDemo {
    public static void main(String[] args) {
        // List：有序、可重复，最常用
        List<String> todos = new ArrayList<>();
        todos.add("写接口");
        todos.add("连数据库");
        todos.add("写接口");              // List 允许重复
        System.out.println(todos.size()); // 3
        System.out.println(todos.get(0)); // 按下标取：写接口

        // Map：键值对，等价于前端的 Record / Map
        Map<String, Integer> counter = new HashMap<>();
        counter.put("total", 10);
        counter.put("done", 3);
        counter.forEach((k, v) -> System.out.println(k + " = " + v));

        // 增强 for：等价于 for...of
        for (String title : todos) {
            System.out.println("待办：" + title);
        }

        // 不可变集合：JDK 9+ 的 List.of 之后不能 add/remove
        List<String> fixed = List.of("A", "B");
        // fixed.add("C");  // 运行时抛 UnsupportedOperationException
    }
}`,
        },
        {
          type: 'table',
          title: '三大集合族怎么选',
          head: ['接口', '常用实现', '特点', '什么时候用'],
          rows: [
            ['List', 'ArrayList', '数组实现，按下标查快，中间增删慢', '默认选择，九成场景'],
            ['List', 'LinkedList', '链表实现，中间增删快，按下标查慢', '极少用（做队列时另说）'],
            ['Set', 'HashSet', '无序去重，判断是否存在极快', '去重、黑名单、判重'],
            ['Set', 'LinkedHashSet', '去重且保留插入顺序', '去重后还要按原顺序展示'],
            ['Map', 'HashMap', '键的无序映射，查询接近 O(1)', '默认选择'],
            ['Map', 'LinkedHashMap', '保留插入顺序的 Map', '需要有序遍历时'],
          ],
        },
        {
          type: 'diagram',
          caption: 'Stream 管道：中间操作惰性执行，终止操作才触发计算',
          svg: String.raw`<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m03-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="12" fill="#0F1B2D"/>
  <text x="340" y="38" text-anchor="middle" font-size="17" fill="#E2E8F0">Stream 管道：数据像水一样流过一串操作</text>

  <g>
    <rect x="20" y="96" width="108" height="110" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
    <text x="74" y="132" text-anchor="middle" font-size="13" fill="#E2E8F0">数据源</text>
    <text x="74" y="156" text-anchor="middle" font-size="12" fill="#94A3B8">List / Set</text>
    <text x="74" y="180" text-anchor="middle" font-size="12" fill="#94A3B8">.stream()</text>
  </g>
  <line x1="130" y1="151" x2="156" y2="151" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m03-b)"/>

  <g>
    <rect x="160" y="96" width="108" height="110" rx="10" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.6"/>
    <text x="214" y="132" text-anchor="middle" font-size="13" fill="#E2E8F0">filter</text>
    <text x="214" y="156" text-anchor="middle" font-size="12" fill="#94A3B8">保留满足条件的</text>
    <text x="214" y="180" text-anchor="middle" font-size="12" fill="#94A3B8">≈ JS filter</text>
  </g>
  <line x1="270" y1="151" x2="296" y2="151" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m03-b)"/>

  <g>
    <rect x="300" y="96" width="108" height="110" rx="10" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.6"/>
    <text x="354" y="132" text-anchor="middle" font-size="13" fill="#E2E8F0">map</text>
    <text x="354" y="156" text-anchor="middle" font-size="12" fill="#94A3B8">转换成另一种形态</text>
    <text x="354" y="180" text-anchor="middle" font-size="12" fill="#94A3B8">≈ JS map</text>
  </g>
  <line x1="410" y1="151" x2="436" y2="151" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m03-b)"/>

  <g>
    <rect x="440" y="96" width="108" height="110" rx="10" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.6"/>
    <text x="494" y="132" text-anchor="middle" font-size="13" fill="#E2E8F0">sorted</text>
    <text x="494" y="156" text-anchor="middle" font-size="12" fill="#94A3B8">排序</text>
    <text x="494" y="180" text-anchor="middle" font-size="12" fill="#94A3B8">≈ JS sort</text>
  </g>
  <line x1="550" y1="151" x2="586" y2="151" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m03-b)"/>

  <g>
    <rect x="590" y="96" width="70" height="110" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.8"/>
    <text x="625" y="132" text-anchor="middle" font-size="13" fill="#E2E8F0">toList</text>
    <text x="625" y="156" text-anchor="middle" font-size="12" fill="#94A3B8">收集结果</text>
    <text x="625" y="180" text-anchor="middle" font-size="12" fill="#94A3B8">终止操作</text>
  </g>

  <rect x="160" y="222" width="388" height="34" rx="8" fill="#16233A" stroke="#22D3EE" stroke-width="1.2"/>
  <text x="354" y="244" text-anchor="middle" font-size="12" fill="#E2E8F0">中间操作：返回 Stream 本身，惰性执行，不会立刻算</text>

  <rect x="20" y="278" width="640" height="60" rx="10" fill="#16233A" stroke="#EF4444" stroke-width="1.4"/>
  <text x="340" y="304" text-anchor="middle" font-size="13" fill="#E2E8F0">一条流只能消费一次：终止操作之后再写一次终止操作</text>
  <text x="340" y="326" text-anchor="middle" font-size="12" fill="#94A3B8">会抛 IllegalStateException，需要重新从集合取 stream()</text>
</svg>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'StreamDemo.java',
          code: String.raw`import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class StreamDemo {
    public static void main(String[] args) {
        List<String> todos = List.of("写接口", "连数据库", "加缓存", "写接口");

        // 去重 → 去掉某项 → 转大写 → 排序 → 收集
        List<String> result = todos.stream()
                .distinct()
                .filter(t -> !t.equals("连数据库"))
                .map(String::toUpperCase)
                .sorted()
                .toList();                 // JDK 16+，返回不可变 List
        System.out.println(result);

        // 分组：等价于前端的 groupBy，参数是「按什么分组」
        Map<Integer, List<String>> byLength = todos.stream()
                .collect(Collectors.groupingBy(String::length));
        System.out.println(byLength);

        // 聚合：计数、求和
        long count = todos.stream().count();
        int totalLength = todos.stream().mapToInt(String::length).sum();
        System.out.println(count + " 条，总字数 " + totalLength);

        // 兼容写法：JDK 16 之前用 collect(Collectors.toList())
        List<String> legacy = todos.stream()
                .filter(t -> t.startsWith("写"))
                .collect(Collectors.toList());
        System.out.println(legacy);
    }
}`,
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>Stream 就是 Java 版的数组方法链。</strong><code>todos.stream().filter(...).map(...).toList()</code> 与 <code>todos.filter(...).map(...)</code> 几乎逐字对应，只是命名更长、类型更多。</p>
<p>真正的差异只有两处：<strong>①</strong> 中间操作返回的是新的 Stream（惰性、不执行），所以最后必须跟一个终止操作（<code>toList</code>、<code>count</code>、<code>forEach</code>）才会真正跑；<strong>②</strong> 查找类操作返回 <code>Optional</code> 而不是 <code>undefined</code>，下一课会专门讲。</p>`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑 1：Stream 只能消费一次。</strong>把 <code>todos.stream()</code> 的结果存成变量，连着调两次 <code>toList()</code> 会抛 <code>IllegalStateException: stream has already been operated upon or closed</code>。每次重算就重新 <code>.stream()</code>。</p>
<p><strong>坑 2：遍历中不要直接删元素。</strong><code>for (String t : list) { list.remove(t); }</code> 会抛 <code>ConcurrentModificationException</code>。正确写法是 <code>list.removeIf(t -&gt; 条件)</code>，或用 <code>iterator.remove()</code>。</p>
<p><strong>坑 3：<code>List.of()</code> 与 <code>Arrays.asList()</code> 得到的集合不可增删。</strong>想拿到可变的 List，包一层：<code>new ArrayList&lt;&gt;(List.of(...))</code>。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能默写 <code>new ArrayList&lt;&gt;()</code>、<code>new HashMap&lt;&gt;()</code>、<code>new HashSet&lt;&gt;()</code> 三种写法并说清各自场景。</li>
<li>能把一条 JS 的 <code>filter().map()</code> 链原样翻译成 Stream。</li>
<li>知道 Stream 只能消费一次、遍历中不能直接 remove。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: '下列哪种写法可以正确地把 List 声明为「有序、可重复、按下标快速访问」的集合？',
          options: [
            'List&lt;String&gt; list = new List&lt;&gt;();',
            'ArrayList&lt;String&gt; list = new ArrayList();',
            'List&lt;String&gt; list = new ArrayList&lt;&gt;();',
            'String[] list = new ArrayList&lt;&gt;();',
          ],
          answer: 2,
          explain:
            'List 是接口不能直接 new，正确写法是「接口类型 + 具体实现」。这是 Java 集合最基础也最常考的写法。',
        },
        {
          q: '执行 List&lt;String&gt; l = List.of("a","b"); l.add("c"); 的结果是？',
          options: [
            '列表变成 a, b, c',
            '抛出 UnsupportedOperationException',
            '抛出 NullPointerException',
            '编译错误',
          ],
          answer: 1,
          explain:
            'List.of() 返回不可变集合，运行时 add 会抛 UnsupportedOperationException。需要可变集合时用 new ArrayList&lt;&gt;(List.of(...)) 包一层。',
        },
        {
          q: '把 todos.stream() 的结果存进变量后，连续调用两次 toList() 会怎样？',
          options: [
            '正常返回两个相同结果',
            '抛出 IllegalStateException：流已被使用或关闭',
            '第二个返回 null',
            '编译错误',
          ],
          answer: 1,
          explain: 'Stream 只能被消费一次。终止操作之后流就关闭了，再次操作会抛 IllegalStateException，需要重新从集合获取流。',
        },
      ],
    },

    /* ============================ L04 ============================ */
    {
      id: 'm03-l04',
      title: '类、接口、继承与多态',
      minutes: 30,
      goal: '理解 TS 接口与 Java 接口的本质差异、访问修饰符规则、单继承多实现的约束，并能读懂 m07 的三层架构代码。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>这一课有一个前端同学极易误解的点，值得单独强调：<strong>TS 的 interface 和 Java 的 interface 不是同一个东西</strong>，尽管名字一样、写法也像。</p>
<p>TS 的 interface 是<strong>纯类型层面的结构描述</strong>，编译后完全消失，运行时不存在任何东西，也不要求任何类去「实现」它。</p>
<p>Java 的 interface 是<strong>运行期真实存在的类型</strong>：类写 <code>implements</code> 之后，<strong>每一个没有 default 实现的方法都必须真的实现</strong>，少一个就编译不过。这正是 Java 所谓「面向接口编程」的底气：接口是能被实例化方赋值、可以被多态持有的真实契约。</p>`,
        },
        {
          type: 'compare',
          title: 'TS class/interface ↔ Java 类与接口（关键差异）',
          head: ['TS / JS', 'Java', '关键差异'],
          rows: [
            ['interface User { id: number } 只是类型注解', 'interface User { Long getId(); } 是运行期真实类型', 'TS 接口编译后消失；Java 接口是真实契约'],
            ['类不写 implements 也能当该类型用', '类不 implements 就不算该接口类型', 'Java 必须显式 implements 才能被当作接口使用'],
            ['可选成员 id?: number', '没有可选方法，要么实现要么 default', 'Java 方法签名是强约束'],
            ['interface A { m(): void } 无人实现也不报错', 'implements A 后漏实现 m() 直接编译错误', '这是 Java 契约强度的来源'],
            ['构造函数写法 constructor(...)', '构造器与类同名，没有 return', 'Java 没有构造器函数这个概念'],
            ['成员默认 public', '类成员不写修饰符是「包级私有」', 'Java 字段默认不是 public，必须显式写'],
            ['单继承 + 多实现（extends 多接口）', '类只能 extends 一个，可 implements 多个接口', 'Java 单继承类、多实现接口'],
            ['abstract class A { }', 'abstract class A { }', '基本一致：不能实例化，可含实现与字段'],
            ['type A = { x: 1 }', 'record A(long x) {}', 'JDK 17 的 record 最适合不可变 DTO'],
            ['private 才是私有', 'private / protected / public / 不写(包级)', 'Java 有 4 档可见性，TS 只有结构约束'],
          ],
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'Notifier.java（接口 + 实现）',
          code: String.raw`// 接口：只描述「能做什么」，不关心怎么实现。
// 字段默认 public static final，方法默认 public abstract。
interface Notifier {
    void send(String message);

    // JDK 8 起接口可以有 default 方法（有实现体），实现类可以不重写
    default void sendBatch(String a, String b) {
        send(a);
        send(b);
    }
}

// 实现类：implements 之后，抽象方法必须全部实现，否则编译失败
class EmailNotifier implements Notifier {
    private final String to;         // 字段建议显式写修饰符，不要依赖默认值

    public EmailNotifier(String to) { // 构造器：与类同名，不写返回类型
        this.to = to;
    }

    @Override                      // 注解：告诉编译器这是重写，写错方法名会报错
    public void send(String message) {
        System.out.println("邮件发给 " + to + "：" + message);
    }
}`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: '多态：一个接口类型承载不同实现',
          code: String.raw`import java.util.List;

// 注意：本段用到的 Notifier / EmailNotifier 来自上一个代码块（Notifier.java），
// SmsNotifier 就定义在本段末尾。实际项目请拆成同包下的独立文件，并给每个 public 类单独建文件。
public class PolyDemo {
    // 方法参数声明为接口类型，调用方传入任意实现 —— 这就是多态
    static void notifyAll(Notifier notifier, String message) {
        notifier.send(message);
    }

    public static void main(String[] args) {
        Notifier email = new EmailNotifier("tom@example.com");
        email.send("你的待办要过期了");   // 调用的其实是 EmailNotifier.send

        // 多态数组/集合：元素可以是同一个接口的不同实现
        List<Notifier> all = List.of(email, new SmsNotifier("13800000000"));
        for (Notifier n : all) {
            n.send("批量提醒");
        }

        // 想知道运行时到底是哪个实现，用 instanceof（对应 TS 的 typeof）
        for (Notifier n : all) {
            if (n instanceof EmailNotifier e) {   // JDK 16+ 的模式匹配，不用强转
                System.out.println("这是邮件：" + e.to);
            }
        }
    }
}

class SmsNotifier implements Notifier {
    final String mobile;

    SmsNotifier(String mobile) {
        this.mobile = mobile;
    }

    @Override
    public void send(String message) {
        System.out.println("短信发给 " + mobile + "：" + message);
    }
}`,
        },
        {
          type: 'table',
          title: 'Java 访问修饰符：4 档可见性',
          head: ['修饰符', '同类', '同包', '子类(其他包)', '其他包', '建议'],
          rows: [
            ['private', '✅', '❌', '❌', '❌', '字段首选'],
            ['不写（包级私有）', '✅', '✅', '❌', '❌', '只给同包用；类字段别靠它'],
            ['protected', '✅', '✅', '✅', '❌', '给子类留扩展点'],
            ['public', '✅', '✅', '✅', '✅', '接口与对外方法'],
          ],
        },
        {
          type: 'compare',
          title: 'class / abstract class / interface / record 怎么选',
          head: ['写法', '定位', '什么时候用'],
          rows: [
            ['class X { }', '完整实现，可以 new', '普通业务对象'],
            ['abstract class X { }', '半成品，含共用实现与字段', '多个子类要共享代码时'],
            ['interface X { }', '纯契约，字段只能是常量', '需要被多实现替换的策略（如 Notifier）'],
            ['record X(...) { }', 'JDK 16+，自动生成构造/getter/equals', '不可变 DTO，如请求体与返回体'],
            ['enum X { A, B }', '固定取值集合', '状态、类型这类有限枚举'],
          ],
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'Todo.java（用 record 定义不可变对象）',
          code: String.raw`// record 是 JDK 16+ 的语法糖：自动生成 private final 字段、
// 全参构造、getter（同名方法如 id()）、equals、hashCode、toString。
public record Todo(long id, String title, boolean done) {
    // 可以有方法，但不能改字段（不可变）
    public String display() {
        return (done ? "[x] " : "[ ] ") + id + " " + title;
    }
}`,
        },
        {
          type: 'tip',
          html: String.raw`<p><strong>命名预告：这里的 <code>done</code> 到落库时会变成 <code>completed</code>。</strong></p>
<p>上面这个 <code>Todo</code> 是<strong>纯内存版</strong>的语法教学示例，所以用 <code>done</code> 简写。但从 m05 建表开始，字段定名会是 <code>completed</code>（<code>todo_list</code> 表的 <code>completed TINYINT(1)</code>，0 未完成 / 1 已完成）。</p>
<p>为什么是 <code>completed</code> 而不是 <code>done</code>？因为它表达的是<strong>状态</strong>而不是<strong>动作</strong>。字段名一旦定下就会跟着接口、DTO、SQL 一路走，命名从一开始就选对，能省掉后期大规模改名的麻烦——这是后端命名最值得花心思的地方之一。</p>`,
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>多态 ≈ 依赖注入的前提。</strong>前端你写 <code>props.onSave</code> 传一个函数进来，本质就是多态：调用方只关心「有一个能保存东西的东西」，不关心它是 <code>api.save</code> 还是 mock。</p>
<p>Java 里这种「传策略进去」的能力要靠接口实现，而不是靠传函数。理解了这点，m04 的 <code>@Autowired</code> 和 m07 的「面向接口分层」就顺理成章。</p>`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑 1：以为 TS 的可选成员写法能搬过来。</strong>Java 接口没有 <code>id?: number</code> 这种「可以不实现」的方法。要么给 <code>default</code> 实现，要么实现类必须写。</p>
<p><strong>坑 2：类字段不写修饰符。</strong>很多人从 TS 转过来以为「不写就是 public」，但 Java 的<strong>字段默认是包级私有</strong>，同包能用，跨包就报编译错误。<strong>请永远显式写 private / public</strong>。</p>
<p><strong>坑 3：多继承。</strong>Java 类只能 <code>extends</code> 一个类，但可以 <code>implements</code> 多个接口；接口之间也能互相 <code>extends</code>（多个）。需要「多继承」效果时，改用接口或组合。</p>
<p><strong>坑 4：@Override 别漏写。</strong>重写方法时加上它，方法名拼错会立刻报错而不是静默变成重载。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能说清 TS interface（类型注解、编译后消失）与 Java interface（运行期契约、必须实现）的本质差异。</li>
<li>能背出 4 档访问修饰符的可见范围，并记住字段要显式写修饰符。</li>
<li>能用一个接口类型承载多个实现写出多态代码，并用 <code>instanceof</code> 判断实际类型。</li>
<li>会用 <code>record</code> 定义不可变 DTO。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: '关于 TS 的 interface 与 Java 的 interface，下列说法正确的是？',
          options: [
            '两者完全等价，都只是类型注解',
            'TS 接口编译后消失且不要求实现；Java 接口是运行期真实类型，实现类必须实现抽象方法',
            'Java 接口可以被实例化',
            'TS 接口必须有类 implements 才能使用',
          ],
          answer: 1,
          explain:
            '这是本课最重要的一条。TS 接口是编译期的结构约束，任何形状匹配的类型都能赋值，不需要类实现它；Java 接口是运行期真实契约，implements 之后漏实现方法会直接编译失败。',
        },
        {
          q: 'Java 类的一个字段没有写访问修饰符，它的可见范围是？',
          options: ['public', 'protected', 'private', '包级私有（同包可见）'],
          answer: 3,
          explain:
            'Java 类的成员默认是「包级私有」，只对同一个包内的类可见，跨包访问会编译报错。建议始终显式写 private 或 public。',
        },
        {
          q: '下列关于 Java 继承的描述，错误的是？',
          options: [
            '一个类只能 extends 一个父类',
            '一个类可以实现多个接口',
            '接口之间可以 extends 多个接口',
            '抽象类不能包含已经实现的具体方法',
          ],
          answer: 3,
          explain:
            '抽象类的意义就在于「既有抽象方法又有共用实现」，完全允许有具体方法。Java 是单继承类、多实现接口，要复用代码优先用继承或组合。',
        },
      ],
    },

    /* ============================ L05 ============================ */
    {
      id: 'm03-l05',
      title: '异常与泛型',
      minutes: 25,
      goal: '分清受检异常与运行时异常，掌握 try-with-resources 与自定义业务异常的写法，知道泛型只用到什么程度就够。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p><strong>受检异常是 Java 独有的概念，也是前端同学最大的认知冲击。</strong></p>
<p>在 TS 里，抛错只是 <code>throw new Error()</code>，编译器不管你捕不捕获。受检异常不一样：<strong>凡是「可能发生的、由外部输入或 IO 引起的」异常，编译器强制你必须处理</strong>——要么 <code>try/catch</code>，要么在方法签名上写 <code>throws</code> 声明。少一个，编译不过。</p>
<p>这其实是好事：它把「忘记处理错误」从运行期事故提前到了编译期。</p>`,
        },
        {
          type: 'compare',
          title: 'TS / JS ↔ Java 异常处理对照',
          head: ['TS / JS', 'Java', '说明'],
          rows: [
            ['try { } catch (e) { }', '同写法，但受检异常不 catch 会编译失败', 'Java 有编译期强制'],
            ['throw new Error("x")', 'throw new RuntimeException("x")', '只能抛对象，不能抛字符串'],
            ['catch (e: any)', 'catch (IOException e)', 'Java 按类型捕获，可写多 catch'],
            ['无对应概念', 'throws IOException 声明', '把异常责任交给调用方'],
            ['无对应概念', 'try (var r = ...) { } 自动关闭', '对标 finally 里手动 cleanup'],
            ['err 无类型', 'catch (Exception e) 最通用', '子类异常必须写在父类前面'],
            ['Promise reject', '受检异常不会导致函数无法编译', '异常是同步的，控制流要显式处理'],
          ],
        },
        {
          type: 'table',
          title: '异常分类：受检 vs 非受检',
          head: ['类别', '父类', '编译器是否强制', '常见例子', '该怎么处理'],
          rows: [
            ['非受检（unchecked）', 'RuntimeException 及其子类', '不强制', 'NullPointerException、ArithmeticException、IllegalArgumentException', '修 bug：补判空、补校验'],
            ['受检（checked）', 'Exception 的其他子类', '必须 catch 或 throws', 'IOException、SQLException、ClassNotFoundException', '优雅降级：提示、重试、兜底返回'],
            ['业务异常', '自定义 extends RuntimeException', '不强制', 'BizException("待办不存在")', '统一转成友好提示返回给前端'],
            ['错误', 'Error 及其子类', '一般不处理', 'OutOfMemoryError、StackOverflowError', '程序层面无法恢复'],
          ],
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'ExceptionDemo.java',
          code: String.raw`import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

public class ExceptionDemo {
    // 受检异常必须在签名上声明：调用方才知道要处理
    static String readFirstLine(String path) throws IOException {
        // try-with-resources（JDK 7+）：不用写 finally 关流，退出时自动关闭
        try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
            return reader.readLine();
        }
    }

    public static void main(String[] args) {
        try {
            String line = readFirstLine("todo.txt");
            System.out.println(line);
        } catch (IOException e) {
            // 多个 catch 时，子类异常必须写在父类前面，否则编译报错
            System.out.println("文件读取失败：" + e.getMessage());
        } finally {
            System.out.println("无论成败都会执行这里");
        }

        try {
            int n = Integer.parseInt("abc");   // 运行时异常，不需要声明
            System.out.println(n);
        } catch (NumberFormatException e) {
            System.out.println("不是合法数字");
        }
    }
}`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'BizException.java（自定义业务异常）',
          code: String.raw`// 继承 RuntimeException：调用方不必强制 catch，
// 这是「业务上可预期」的异常，m07 会用它配合全局异常处理器返回友好提示。
public class BizException extends RuntimeException {

    private final int code;   // 业务错误码，例如 40001 表示「待办不存在」

    public BizException(int code, String message) {
        super(message);       // 调用父类构造，父类的 message 才能被正确打印
        this.code = code;
    }

    public int getCode() {
        return code;
    }
}`,
        },
        {
          type: 'text',
          html: String.raw`<h5>泛型：会用就够，不用深入</h5>
<p>泛型就是 Java 版本的「类型占位符」。你只需要认准三种用法，看到能读懂就行：</p>
<ul><li>集合：<code>List&lt;Todo&gt;</code>、<code>Map&lt;String, Object&gt;</code>（字符串键 → 任意值的字典）</li>
<li>返回类型：<code>Result&lt;Todo&gt;</code>（统一响应结构里带一个 data 字段）</li>
<li>方法参数：<code>void save(T item)</code>（写成 Object 也能跑，但类型约束没了）</li></ul>
<p>泛型在 TS 里的对应物是 <code>List&lt;Todo&gt;</code> 这种写法，但 TS 的泛型常带默认约束（<code>T extends X</code>），Java 没有默认上限，必须用 <code>&lt;T extends X&gt;</code> 显式约束。</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'GenericDemo.java',
          code: String.raw`import java.util.ArrayList;
import java.util.List;

public class GenericDemo {
    // 泛型方法：<T> 是类型参数，可以理解成 TS 的泛型函数
    static <T> List<T> listOf(T... items) {
        List<T> list = new ArrayList<>();
        for (T item : items) {
            list.add(item);
        }
        return list;
    }

    public static void main(String[] args) {
        // 泛型让取出元素时无需强转，编译器已经知道类型
        List<String> names = listOf("tom", "jerry");
        List<Integer> ids = listOf(1, 2, 3);
        System.out.println(names.get(0).toUpperCase());  // 直接调用 String 方法
        System.out.println(ids.get(0) + 1);             // 直接参与算术
    }
}`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑 1：多个 catch 的顺序写反。</strong><code>catch (IOException e) { } catch (Exception e) { }</code> 是对的；反过来写会导致「子类异常已被捕获，后面的父类异常不可达」编译错误。</p>
<p><strong>坑 2：catch 之后不处理。</strong><code>catch (Exception e) { }</code> 空吞异常等于把问题埋进地里。至少要打印堆栈或返回明确提示。</p>
<p><strong>坑 3：抛 null 或字符串。</strong>Java 只能抛 Throwable 对象，<code>throw "error"</code> 编译不过。<code>throw new RuntimeException("原因为空")</code> 时务必把 cause 传进去：<code>new RuntimeException("查询待办失败", e)</code>，否则丢栈信息。</p>
<p><strong>坑 4：finally 里 return。</strong>finally 块里的 <code>return</code> 会覆盖 try 块的返回值与异常，是公认的反模式，不要写。</p>`,
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>try-with-resources ≈ 前端的 <code>finally { cleanup() }</code></strong>，但更省事：你声明资源时直接写在 <code>try (...)</code> 括号里，离开代码块时自动调用 <code>close()</code>。这解决了 Java 里手写 <code>finally</code> 关流最常见的漏写问题。</p>
<p><strong>关于「为什么 Java 强制检查异常，而 JS 没有」：</strong>Java 的 IO、数据库操作确实很容易失败，强制声明能让调用者在写代码时就意识到「这里可能失败」。代价是代码里 <code>throws</code> 会层层往上传染——所以实际项目通常只在最外层统一处理（m07 的全局异常处理器），不会一层层抛到底。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能说出受检异常与非受检异常的父类分别是什么，以及编译器是否强制。</li>
<li>会用 try-with-resources 读取文件，理解它替代的是手写 finally。</li>
<li>能定义一个 extends RuntimeException 的业务异常，并传给父类 message。</li>
<li>看懂 <code>List&lt;Todo&gt;</code> 与泛型方法的写法。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: '下列哪种异常需要程序员必须 try/catch 或在方法签名上 throws 声明？',
          options: [
            'NullPointerException',
            'IllegalArgumentException',
            'IOException',
            'RuntimeException',
          ],
          answer: 2,
          explain:
            'IOException 是受检异常，编译器强制处理。NullPointerException、IllegalArgumentException、RuntimeException 都是运行时异常，不需要显式声明。',
        },
        {
          q: '关于 try-with-resources，正确的是？',
          options: [
            'JDK 5 才支持',
            '必须配合 finally 使用',
            '资源对象写在 try(...) 里，离开代码块时自动关闭，等价于手动写 finally 关流',
            '只能用于文件流，不能用于数据库连接',
          ],
          answer: 2,
          explain:
            'try-with-resources 是 JDK 7+ 的语法，对象需实现 AutoCloseable（文件流、连接、Reader 都满足），退出代码块自动调用 close()，避免手写 finally 漏关流。',
        },
        {
          q: '自定义业务异常 BizException 通常应该继承哪个类？',
          options: ['Exception', 'Throwable', 'RuntimeException', 'Error'],
          answer: 2,
          explain:
            '继承 RuntimeException（unchecked）最省事，调用方不必强制 catch，异常可以一路抛到全局异常处理器统一转成友好提示。继承 Exception 则强制每个调用方处理，通常没必要。',
        },
      ],
    },

    /* ============================ L06 ============================ */
    {
      id: 'm03-l06',
      title: 'Lambda 与 Optional',
      minutes: 25,
      goal: '掌握 Java Lambda 的落点「函数式接口」与常用方法引用，理解 Optional 不是 T | undefined，并能写出安全的取值链。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>Java 的 Lambda 语法你一定见过：<code>list.forEach(s -&gt; System.out.println(s))</code>。它和 TS 的箭头函数几乎一样，但有个关键差异：<strong>TS 的函数是一等公民，可以随便传给任何函数；Java 的 Lambda 只能传给「恰好有一个抽象方法」的接口</strong>——这种接口叫<strong>函数式接口</strong>。</p>
<p>所以 Java 里「函数」必须先被包装成对象（一个实现了某接口的实例），才能传。这是从 TS 过来最容易卡住的地方。</p>`,
        },
        {
          type: 'compare',
          title: 'TS ↔ Java 函数式对照',
          head: ['TS / JS', 'Java', '说明'],
          rows: [
            ['(a: number) =&gt; a + 1', '(a) -&gt; a + 1', '语法几乎一致'],
            ['arr.map(fn)', 'list.stream().map(fn)', '方法名一致'],
            ['(a, b) =&gt; a &lt; b', 'Comparator.comparing(a::b)', '类型靠签名推断'],
            ['arr.forEach(fn)', 'list.forEach(item -&gt; {...})', '一致'],
            ['回调类型 (x: string) =&gt; void', 'Consumer&lt;String&gt;', 'Java 需用函数式接口类型承载'],
            ['返回值的回调', 'Function&lt;T, R&gt;', 'T 是入参，R 是返回值'],
            ['返回 true/false 的回调', 'Predicate&lt;T&gt;', '用于 filter'],
            ['无参返回值的回调', 'Supplier&lt;T&gt;', '用于 orElseGet'],
            ['Math.max 的引用', 'Math::max', '方法引用 ≈ 传函数引用'],
            ['obj?.a?.b（可选链）', 'Optional 链 + ifPresent', 'Java 没有 ?.，这是最大的体感差异'],
          ],
        },
        {
          type: 'table',
          title: '四个核心函数式接口',
          head: ['接口', '方法签名', '对应 TS', '常见用途'],
          rows: [
            ['Function&lt;T, R&gt;', 'R apply(T t)', '(t: T) =&gt; R', 'stream().map()'],
            ['Predicate&lt;T&gt;', 'boolean test(T t)', '(t: T) =&gt; boolean', 'stream().filter()、removeIf()'],
            ['Consumer&lt;T&gt;', 'void accept(T t)', '(t: T) =&gt; void', 'forEach()'],
            ['Supplier&lt;T&gt;', 'T get()', '() =&gt; T', 'orElseGet()、创建对象'],
          ],
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'LambdaDemo.java',
          code: String.raw`import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.function.Supplier;

public class LambdaDemo {
    public static void main(String[] args) {
        List<String> titles = new ArrayList<>(List.of("写接口", "加缓存", "连数据库"));

        // 1. 普通 Lambda：把行为作为参数传进去
        titles.sort(Comparator.comparing(String::length).reversed());   // 按长度倒序
        titles.forEach(s -> System.out.println(s));

        // 2. 方法引用：等价于 (s) -&gt; s.length()，可读性更好
        titles.sort(Comparator.comparing(String::length));              // 长度升序

        // 3. 把 Lambda 赋值给函数式接口类型的变量
        Predicate&lt;String&gt; notBlank = s -> !s.isBlank();
        Supplier&lt;List&lt;String&gt;&gt; emptyFactory = ArrayList::new;
        List&lt;String&gt; filtered = titles.stream().filter(notBlank).toList();

        System.out.println(filtered);
        System.out.println(emptyFactory.get().isEmpty());

        // 4. Optional：find / max 这类操作返回容器，而不是 null
        Optional&lt;String&gt; first = titles.stream().filter(notBlank).findFirst();

        // 安全取值四式
        String a = first.orElse("（空）");                                  // 无值就用默认值
        String b = first.orElseGet(() -> "默认值 Supplier");                // 无值才计算默认值
        first.ifPresent(v -> System.out.println("有值：" + v));              // 有值才回调
        String c = first.orElseThrow(() -> new IllegalStateException("没有待办"));
        System.out.println(a + " / " + b + " / " + c);
    }
}`,
        },
        {
          type: 'diagram',
          caption: 'Optional 与「可能没有值」的表达方式对比',
          svg: String.raw`<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m03-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="12" fill="#0F1B2D"/>
  <text x="340" y="38" text-anchor="middle" font-size="17" fill="#E2E8F0">Optional：把「可能没有值」显式装进容器</text>

  <g>
    <rect x="24" y="70" width="288" height="250" rx="10" fill="#16233A" stroke="#EF4444" stroke-width="1.6"/>
    <text x="168" y="98" text-anchor="middle" font-size="14" fill="#EF4444">前端写法（隐式）</text>
    <text x="168" y="132" text-anchor="middle" font-size="13" fill="#E2E8F0">todo?: Todo</text>
    <text x="168" y="164" text-anchor="middle" font-size="13" fill="#E2E8F0">todo?.title</text>
    <text x="168" y="196" text-anchor="middle" font-size="13" fill="#E2E8F0">todo?.title ?? "无标题"</text>
    <rect x="48" y="222" width="240" height="76" rx="8" fill="#1B2A44" stroke="#3B82F6"/>
    <text x="168" y="248" text-anchor="middle" font-size="12" fill="#94A3B8">可能得到 undefined，</text>
    <text x="168" y="270" text-anchor="middle" font-size="12" fill="#94A3B8">编译期不会提醒你处理</text>
    <text x="168" y="292" text-anchor="middle" font-size="12" fill="#F59E0B">真正的坑：忘了问就崩</text>
  </g>

  <line x1="320" y1="195" x2="356" y2="195" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m03-c)"/>

  <g>
    <rect x="364" y="70" width="292" height="250" rx="10" fill="#16233A" stroke="#10B981" stroke-width="1.6"/>
    <text x="510" y="98" text-anchor="middle" font-size="14" fill="#10B981">Java 写法（显式）</text>
    <text x="510" y="132" text-anchor="middle" font-size="13" fill="#E2E8F0">Optional&lt;Todo&gt; todo</text>
    <text x="510" y="164" text-anchor="middle" font-size="13" fill="#E2E8F0">todo.map(Todo::title)</text>
    <text x="510" y="196" text-anchor="middle" font-size="13" fill="#E2E8F0">todo.map(Todo::title)</text>
    <text x="510" y="216" text-anchor="middle" font-size="12" fill="#94A3B8">      .orElse("无标题")</text>
    <rect x="388" y="240" width="244" height="58" rx="8" fill="#1B2A44" stroke="#10B981"/>
    <text x="510" y="264" text-anchor="middle" font-size="12" fill="#94A3B8">类型强制你面对「无值」，</text>
    <text x="510" y="286" text-anchor="middle" font-size="12" fill="#94A3B8">忘处理就编译不过</text>
  </g>

  <text x="340" y="338" text-anchor="middle" font-size="12" fill="#94A3B8">别直接调 get()：无值时会抛 NoSuchElementException</text>
</svg>`,
        },
        {
          type: 'table',
          title: 'Optional 常用方法与前端对应',
          head: ['Optional 方法', '作用', '前端等价'],
          rows: [
            ['orElse(v)', '无值返回 v（无论有无值都会先算好 v）', '?? 默认值'],
            ['orElseGet(fn)', '无值才调用 fn 计算默认值', '?? 惰性默认值'],
            ['orElseThrow(fn)', '无值抛异常', '手动 throw'],
            ['ifPresent(fn)', '有值才执行', 'if (x) { ... }'],
            ['map(fn)', '有值时转换值', 'x =&gt; x?.field'],
            ['filter(pred)', '按条件保留，否则变空', '可选 + 判断'],
            ['isPresent()', '是否有值（建议别用）', 'x !== undefined'],
            ['get()', '有值取值，无值抛异常', '不安全的 x.a'],
          ],
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑 1：直接 <code>optional.get()</code>。</strong>这是 Java 新手翻车第一名。<code>get()</code> 在无值时抛 <code>NoSuchElementException</code>，等价于前端的「不看有没有直接取属性」。请一律改用 <code>orElse</code> / <code>orElseGet</code> / <code>orElseThrow</code> / <code>ifPresent</code>。</p>
<p><strong>坑 2：<code>orElse</code> 与 <code>orElseGet</code> 混用。</strong><code>orElse(new ArrayList&lt;&gt;())</code> 里的默认值<strong>无论有没有值都会被创建一遍</strong>，在参数是昂贵对象（查询数据库、new 大集合）时应用 <code>orElseGet</code>。</p>
<p><strong>坑 3：给字段也用 Optional。</strong>实践中<strong>不要给实体类的每个字段都包 Optional</strong>，那是过度设计；Optional 只用于返回值和方法参数。</p>
<p><strong>坑 4：以为 Optional 能解决所有空指针。</strong>JDK 17 <strong>没有</strong> TS 那种 <code>?.</code> 可选链，深层嵌套取值仍要显式判空（<code>Objects.requireNonNull</code> 或先 map 成 Optional 链）。</p>`,
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>为什么 Java 17 还没有 ?.？</strong>可选链要支持「链式短路」，本质是编译器要帮你做 null 检查与类型收窄。JVM 字节码层面没有这个概念，JDK 至今没有落地。这个差异会长期存在，所以<strong>判空是 Java 日常开发里最高频的动作</strong>，务必形成习惯。</p>
<p>另外，Java 17 的 <code>record</code> 让「不可变数据类」变得极其廉价，前端对应的是 <code>type Todo = { id: number }</code> 这种纯类型——写请求体和返回体时优先考虑 record。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能说出 Function / Predicate / Consumer / Supplier 四种函数式接口各自对应哪类 Lambda。</li>
<li>能用方法引用 <code>Todo::getTitle</code> 完成映射与排序。</li>
<li>知道 Optional 四个安全取值方法，以及为什么不直接 get()。</li>
<li>理解 Java 没有可选链这件事对日常写法的影响。</li></ul>
<p>下一模块进入 <strong>Spring Boot</strong>，你会发现整个待办清单 API 就是把本模块这些语法拼起来：<code>record</code> 做 DTO、<code>List</code> 装数据、Lambda 做过滤、Stream 做查询。</p>`,
        },
      ],
      quiz: [
        {
          q: 'Java 的 Lambda 表达式可以作为参数传给下列哪种类型？',
          options: [
            '任意类，只要参数名对得上',
            '有且仅有一个抽象方法的函数式接口',
            '必须是抽象类',
            '必须是 Map',
          ],
          answer: 1,
          explain:
            '函数式接口（可用 @FunctionalInterface 标注）有且仅有一个抽象方法，所以它恰好能用一个 Lambda 实现。这是 Java 没有一等公民函数的根本原因。',
        },
        {
          q: '关于 Optional，下列说法错误的是？',
          options: [
            'orElse 的默认值无论有无值都会被创建',
            'orElseGet 的默认值只在使用时才计算',
            '直接调用 get() 在无值时会抛 NoSuchElementException',
            'Optional 应该包装实体类的每一个字段',
          ],
          answer: 3,
          explain:
            '给字段包 Optional 是过度设计，实践中只用于返回值和方法参数。另外三条都是正确的，orElseGet 适合默认值创建代价较高的情况。',
        },
        {
          q: '下面哪个写法是「把待办标题按长度倒序排序」的正确方法引用？',
          options: ['Comparator.comparing(Todo::getTitle)', 'Comparator.comparing(Todo::getTitle).reversed()', 'Todo::getTitle.reversed()', '(a, b) -> b'],
          answer: 1,
          explain:
            'Comparator.comparing 返回一个比较器，再链式调用 reversed() 得到倒序。这是 JDK 8 起最常用的排序写法，务必掌握。',
        },
      ],
    },

    /* ============================ L07 ============================ */
    {
      id: 'm03-l07',
      title: '类型系统深挖：溢出、拆箱 NPE、BigDecimal 与日期',
      minutes: 30,
      goal: '把前端 number 一把梭的习惯拆掉：搞清整型溢出、包装类拆箱 NPE、金额用 BigDecimal、日期时间 API，这四类问题覆盖了公司项目里最常见的一批线上事故。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>前端只有一个 <code>number</code>（IEEE 754 双精度浮点），整数浮点全靠它。Java 把「整数」和「小数」拆成了两套家族，而且<strong>每种类型都有固定的大小上限</strong>——这不是面试考点，是公司项目里真实会炸的地方：</p>
<ul><li>订单数量用 <code>int</code> 存，某天促销冲到 21 亿 → <strong>溢出成负数</strong>；</li>
<li>金额用 <code>double</code> 存，对账时差一分钱 → <strong>浮点精度丢失</strong>；</li>
<li>数据库字段是 NULL，Java 侧用基本类型接 → <strong>拆箱 NPE</strong>。</li></ul>
<p>这一课把四个坑逐个讲透，并给你日期时间 API 的正确姿势。</p>`,
        },
        {
          type: 'compare',
          title: 'TS number ↔ Java 数字家族',
          head: ['场景', 'TypeScript', 'Java', '说明'],
          rows: [
            ['普通计数', 'number', 'int', '4 字节，约 ±21 亿，够用'],
            ['自增主键 / 时间戳', 'number', 'long', '8 字节，字面量要加 L：10000000000L'],
            ['金额', 'number', 'BigDecimal', '精确十进制，构造时用字符串'],
            ['前端 JSON 数字', '任意', '统一按语义选型', '后端字段类型决定数据库类型，选错要改表'],
            ['溢出行为', '静默变 Infinity / 精度丢失', 'int 静默绕回，long 同理', 'Java 整型溢出不报错，靠自觉 + 规范'],
          ],
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 1：整型溢出。</strong><code>int</code> 的上限是 2147483647（约 21 亿）。溢出<strong>不会报错</strong>，而是像里程表一样绕回负数：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'OverflowDemo.java',
          code: `int max = Integer.MAX_VALUE;      // 2147483647
System.out.println(max + 1);      // -2147483648  ← 静默溢出！

// 库存累加、订单量统计这类可能超 21 亿的数，用 long
long total = 10_000_000_000L;     // 字面量必须加 L，否则编译报错（整数字面量默认 int）

// 算术太长时，先提升再运算：int * int 还是 int，哪怕接给 long
int a = 100_000_000;
int b = 300;
long wrong = a * b;               // 已经溢出后才赋给 long，结果仍是错的
long right = (long) a * b;        // 先把一个操作数提升为 long 再乘`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>为什么 <code>long wrong = a * b</code> 也错？</strong>Java 的运算在<strong>赋值之前</strong>就确定了类型：<code>int * int</code> 的结果类型就是 <code>int</code>，乘法溢出发生在这一步，赋给 long 只是给一个已经错的值腾了更大的空间。要点：<strong>先提升，再运算</strong>。如果希望溢出直接报错而不是静默绕回，用 <code>Math.addExact(a, b)</code> / <code>Math.multiplyExact(a, b)</code>，溢出会抛 ArithmeticException。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 2：拆箱 NPE（NullPointerException）。</strong>前端的世界里 <code>undefined</code>、<code>null</code>、<code>0</code> 三态共存；Java 用「包装类型可以为 null」来表达「没有值」。但一旦把包装类型<strong>赋值给基本类型</strong>（或参与算术运算），编译器会自动拆箱——值为 null 就当场爆炸：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'UnboxNpeDemo.java',
          code: `// 数据库 todo 表的 done 字段允许 NULL，实体类用包装类型接
Todo t = todoMapper.selectById(1L);   // t.done 其实是 null（数据库 NULL）

Boolean done = t.getDone();           // null，此时还没炸
if (done) {                           // ← 炸！if 条件要求 boolean，自动拆箱 → NPE
  System.out.println("已完成");
}

// 正确姿势 1：用包装类型判断
if (Boolean.TRUE.equals(done)) { ... }        // null 安全，语义是「明确为 true 才算完成」

// 正确姿势 2：给默认值
boolean d = done != null && done;             // null 视为 false
int pages = pageSize != null ? pageSize : 10; // 可空参数给默认值`,
        },
        {
          type: 'diagram',
          caption: '拆箱 NPE 全链路：数据库 NULL 一路传到 if 就地爆炸，修法是在边界判空或用 Boolean.TRUE.equals',
          svg: String.raw`<svg viewBox="0 0 680 320" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m03-npe" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
    <marker id="arr-m03-bad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#EF4444"/>
    </marker>
    <marker id="arr-m03-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#10B981"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="680" height="320" rx="12" fill="#0F1B2D"/>
  <text x="340" y="34" text-anchor="middle" font-size="16" fill="#E2E8F0">拆箱 NPE：NULL 的死亡传递链</text>

  <rect x="20" y="66" width="140" height="58" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="90" y="90" text-anchor="middle" font-size="13" fill="#E2E8F0">数据库</text>
  <text x="90" y="110" text-anchor="middle" font-size="12" fill="#F59E0B">done = NULL</text>

  <line x1="160" y1="95" x2="216" y2="95" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m03-npe)"/>
  <text x="188" y="84" text-anchor="middle" font-size="10.5" fill="#94A3B8">查询映射</text>

  <rect x="220" y="66" width="170" height="58" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="305" y="90" text-anchor="middle" font-size="13" fill="#E2E8F0">实体类</text>
  <text x="305" y="110" text-anchor="middle" font-size="12" fill="#F59E0B">Integer done = null</text>

  <line x1="390" y1="95" x2="446" y2="95" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m03-npe)"/>
  <text x="418" y="84" text-anchor="middle" font-size="10.5" fill="#94A3B8">赋值给 Boolean</text>

  <rect x="450" y="66" width="150" height="58" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.5"/>
  <text x="525" y="90" text-anchor="middle" font-size="13" fill="#E2E8F0">if (done)</text>
  <text x="525" y="110" text-anchor="middle" font-size="12" fill="#94A3B8">需要 boolean → 拆箱</text>

  <line x1="525" y1="124" x2="525" y2="158" stroke="#EF4444" stroke-width="2" marker-end="url(#arr-m03-bad)"/>
  <rect x="440" y="162" width="170" height="46" rx="10" fill="#2A1620" stroke="#EF4444" stroke-width="1.6"/>
  <text x="525" y="183" text-anchor="middle" font-size="13" fill="#F87171">💥 NullPointerException</text>
  <text x="525" y="200" text-anchor="middle" font-size="11" fill="#FCA5A5">null.intValue() 当场爆炸</text>

  <text x="118" y="252" text-anchor="middle" font-size="13" fill="#10B981">修法 1：边界判空给默认值</text>
  <rect x="20" y="262" width="196" height="42" rx="10" fill="#12261E" stroke="#10B981" stroke-width="1.4"/>
  <text x="118" y="288" text-anchor="middle" font-size="12" fill="#6EE7B7">done != null &amp;&amp; done</text>

  <text x="340" y="252" text-anchor="middle" font-size="13" fill="#10B981">修法 2：语义化等值判断</text>
  <rect x="242" y="262" width="196" height="42" rx="10" fill="#12261E" stroke="#10B981" stroke-width="1.4"/>
  <text x="340" y="288" text-anchor="middle" font-size="12" fill="#6EE7B7">Boolean.TRUE.equals(done)</text>

  <line x1="340" y1="258" x2="340" y2="258" stroke="none"/>
  <text x="562" y="252" text-anchor="middle" font-size="13" fill="#10B981">修法 3：可空参数兜底</text>
  <rect x="452" y="262" width="216" height="42" rx="10" fill="#12261E" stroke="#10B981" stroke-width="1.4"/>
  <text x="560" y="288" text-anchor="middle" font-size="12" fill="#6EE7B7">pageSize != null ? p : 10</text>

  <line x1="525" y1="208" x2="470" y2="258" stroke="#10B981" stroke-width="1.4" stroke-dasharray="4 3" marker-end="url(#arr-m03-ok)"/>
</svg>`,
        },
        {
          type: 'table',
          title: '包装类型使用守则（公司项目口径）',
          head: ['规则', '原因'],
          rows: [
            ['实体类（数据库映射）字段一律用包装类型', '基本类型有默认值 0，会跟数据库 NULL 混淆，导致「没赋值却更新成了 0」'],
            ['局部变量、方法内计算用基本类型', '避免无意义的装箱开销，也不存在 null 问题'],
            ['比较包装类只用 equals', '== 比地址：-128~127 内命中缓存侥幸为 true，超出即 false'],
            ['可空参数在方法入口先判空或给默认值', '让 null 在边界被处理掉，业务代码内部保持非空'],
            ['三目运算符混合基本/包装类型会自动拆箱', 'condition ? intValue : integerValue 两侧类型不一时可能触发 NPE'],
          ],
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 3：金额用 double。</strong>二进制浮点存不出 0.1 这种十进制小数，误差会在累加、对账中被放大。前端同学应该见过 <code>0.1 + 0.2 === 0.30000000000000004</code>，Java 的 double 一模一样。正确工具是 <code>BigDecimal</code>：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'BigDecimalDemo.java',
          code: `// 反面教材：金额用 double
System.out.println(1.03 - 0.42);        // 0.6100000000000001，对账直接出错

// 正确姿势：BigDecimal + String 构造器
BigDecimal price = new BigDecimal("19.99");       // 必须用字符串构造！
BigDecimal qty   = BigDecimal.valueOf(3);         // 整数可用 valueOf
BigDecimal total = price.multiply(qty);           // 59.97

// 四则运算方法名与数学符号不同
// add 加 / subtract 减 / multiply 乘 / divide 除
BigDecimal avg = total.divide(qty, 2, RoundingMode.HALF_UP);  // 除法必须指定精度与舍入

// 比较用 compareTo，不要用 equals
new BigDecimal("2.0").equals(new BigDecimal("2.00"));      // false！equals 连小数位数一起比
new BigDecimal("2.0").compareTo(new BigDecimal("2.00"));   // 0，数值相等`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>两个必记的 BigDecimal 坑：</strong>① <code>new BigDecimal(0.1)</code>（double 构造器）会得到 0.1000000000000000055511151231257827——<strong>永远用 String 构造器或 <code>BigDecimal.valueOf()</code></strong>；② <code>divide</code> 除不尽（如 1/3）且不指定精度会直接抛 <code>ArithmeticException</code>，必须写 <code>divide(b, 2, RoundingMode.HALF_UP)</code>。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 4：日期时间。</strong>老教程里的 <code>Date</code>、<code>SimpleDateFormat</code> 是历史包袱（可变、线程不安全、月份从 0 开始）。JDK 8 起用 <strong>java.time</strong> 包，设计上就对标前端 dayjs，不可变且线程安全：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'DateTimeDemo.java',
          code: `// 三个核心类：LocalDate 日期 / LocalTime 时间 / LocalDateTime 日期时间
LocalDate today = LocalDate.of(2026, 10, 9);        // 月份直接写 10，不用减 1（对比老 Date）
LocalDateTime now = LocalDateTime.now();

// 格式化与解析：DateTimeFormatter（线程安全，可全局复用）
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
String text = now.format(fmt);                       // 2026-10-09 15:30:00
LocalDateTime parsed = LocalDateTime.parse("2026-10-09 15:30:00", fmt);

// 加减与比较：方法返回新对象（不可变），必须接住返回值
LocalDate deadline = today.plusDays(7).minusMonths(1);
boolean overdue = deadline.isBefore(today);

// 时间间隔
Duration d = Duration.between(now, LocalDateTime.now().plusHours(2));
System.out.println(d.toMinutes());                   // 120`,
        },
        {
          type: 'table',
          title: 'java.time 速查与高频坑',
          head: ['类 / 方法', '用途', '坑点'],
          rows: [
            ['LocalDate / LocalTime / LocalDateTime', '日期、时间、日期时间', '都不含时区；跨时区业务用 ZonedDateTime'],
            ['DateTimeFormatter', '格式化与解析', '线程安全可复用；SimpleDateFormat 线程不安全禁止共享'],
            ['yyyy（小写）', '年', '大写 YYYY 是「周年」，跨年那一周会把 2026-12-28 格式化成 2027！'],
            ['MM / mm', '月 / 分', '大小写含义完全不同，写错不会报错只会给离谱的值'],
            ['plusDays / minusHours 等返回新对象', '加减时间', '不可变设计，忘了接返回值等于什么都没做'],
            ['Instant', '时间戳（对标 Date）', '数据库映射常用；与 LocalDateTime 用 atZone / toLocalDateTime 转换'],
          ],
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>对照前端记忆：</strong><code>LocalDate</code> 像 dayjs 的 <code>dayjs().format('YYYY-MM-DD')</code> 那个日期对象；<code>DateTimeFormatter.ofPattern</code> 对应 format 模板串，区别是 Java 里大小写字母含义严格（yyyy 年 MM 月 dd 日 HH 时 mm 分 ss 秒），而 dayjs 里 YYYY 与 yyyy 都能年。另外 java.time 的对象<strong>全部不可变</strong>——这点和前端 <code>const s = str.toUpperCase()</code> 的直觉一致：方法不改变原值，返回新值。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能说出 int 溢出不报错、long 字面量加 L、先提升再运算三条铁律。</li>
<li>实体类字段一律包装类型，比较一律 equals，判空在边界处理。</li>
<li>金额一律 BigDecimal + String 构造器 + compareTo 比较 + divide 指定精度。</li>
<li>日期时间用 java.time，DateTimeFormatter 全局复用，yy/MM/dd 大小写含义记牢。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: 'int a = 100_000_000; int b = 300; long r = a * b; 关于 r 的值，说法正确的是？',
          options: [
            'r 正确，因为 long 足够大',
            'r 是错的，因为 int * int 先在 int 范围内溢出，赋值救不回来',
            '编译报错，int 乘 int 不能赋给 long',
            'r 会自动溢出保护，返回 -1',
          ],
          answer: 1,
          explain:
            'Java 运算类型在赋值前确定：int * int 的结果类型就是 int，溢出发生在乘法这一步。正确写法是先提升：long r = (long) a * b;。需要溢出报警时用 Math.multiplyExact。',
        },
        {
          q: '数据库字段 amount 可为 NULL，实体类用 Integer 接。下列哪种写法会抛 NullPointerException？',
          options: [
            'if (amount == null) { ... }',
            'int value = amount;',
            'BigDecimal x = amount == null ? BigDecimal.ZERO : BigDecimal.valueOf(amount);',
            'String s = String.valueOf(amount);',
          ],
          answer: 1,
          explain:
            '把包装类型赋给基本类型会触发自动拆箱，null 拆箱即 NPE。其余三种都是 null 安全的写法。实体类可空字段永远用包装类型，并只在边界做一次判空。',
        },
        {
          q: '关于 BigDecimal，下列说法错误的是？',
          options: [
            'new BigDecimal(0.1) 与 new BigDecimal("0.1") 结果一样精确',
            '比较数值大小应该用 compareTo 而不是 equals',
            'divide 除不尽时不指定精度会抛 ArithmeticException',
            '金额计算应该用 BigDecimal 而不是 double',
          ],
          answer: 0,
          explain:
            'double 构造器会继承浮点误差，得到 0.1000000000000000055511151231257827。必须用 String 构造器或 BigDecimal.valueOf()。其余三条都是正确用法。',
        },
        {
          q: '用 DateTimeFormatter 把 2026-12-28 格式化成 "2026-12-28"，但 pattern 写成了 YYYY-MM-dd，输出 2027-12-28。原因是？',
          options: [
            'DateTimeFormatter 的线程安全问题',
            '大写 YYYY 是「所在周年份」，跨年那一周属于下一年',
            'LocalDate 的默认时区是 UTC，差了一天',
            '这是 JDK 17 的已知 bug',
          ],
          answer: 1,
          explain:
            'YYYY 是 week-based year（周年），yyyy 才是日历年。每年最后几天周年会跳到下一年，这是真实发生过的线上事故。月份 MM 与分钟 mm 同理不能写混。',
        },
      ],
    },

    /* ============================ L08 ============================ */
    {
      id: 'm03-l08',
      title: '避坑清单：新手翻车 Top 7',
      minutes: 25,
      goal: '用一张清单收拢 Java 新手最常踩的 7 个坑。每个坑按「现象 → 原因 → 修法」三段式讲透，学完这一课，同事代码评审时最常拦你的那批问题你已经提前避开了。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>前面的课已经零散提过一些坑（== 比较、Stream 消费两次、Optional.get）。这一课把<strong>还没讲过、但公司项目里最常翻车</strong>的 7 个坑集中过一遍。每个坑都给「反面教材 → 正面写法」，建议收藏这一课当 checklist 用。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 1：循环里用 += 拼字符串，接口慢得离谱。</strong>String 不可变，每次 <code>+=</code> 都复制整个新串，1 万次拼接约是 O(n²) 的复杂度。前端字符串是不可变的所以你知道 <code>str += x</code> 的代价，Java 里同样成立，只是后端循环量通常更大：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'StringConcatDemo.java',
          code: `// 反面教材：O(n²)，1 万条数据能感受到明显卡顿
String result = "";
for (String title : titles) {
    result += title + ",";
}

// 正面写法：StringBuilder（单线程场景标配）
StringBuilder sb = new StringBuilder();
for (String title : titles) {
    if (sb.length() > 0) sb.append(",");
    sb.append(title);
}
String result2 = sb.toString();

// 其实这个场景一行 Stream 更好：
String result3 = String.join(",", titles);`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 2：遍历集合时增删元素，抛 ConcurrentModificationException。</strong>增强 for 底层用迭代器，迭代器发现「结构被别人改了」立刻翻脸：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'RemoveWhileIterating.java',
          code: `List<String> list = new ArrayList<>(List.of("a", "b", "c"));

// 反面教材：遍历中直接 remove → ConcurrentModificationException
for (String s : list) {
    if (s.equals("b")) {
        list.remove(s);            // 运行时才炸，编译不报错，很隐蔽
    }
}

// 正面写法 1：removeIf（JDK 8+，首选）
list.removeIf(s -> s.equals("b"));

// 正面写法 2：迭代器自己的 remove
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("b")) {
        it.remove();               // 用迭代器的 remove，不炸
    }
}

// 正面写法 3：要删的不多时，收集后 removeAll（逻辑最直白）`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 3：Arrays.asList 的三个暗门。</strong>这个方法名字像「把数组转成列表」，实际行为和直觉差得很远：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'ArraysAsListTrap.java',
          code: `// 暗门 1：传基本类型数组，整个数组被当成一个元素
int[] arr = {1, 2, 3};
List<int[]> wrong = Arrays.asList(arr);        // size == 1！泛型不支持 int
List<Integer> right = Arrays.asList(1, 2, 3);  // 想要元素就得传包装类型或可变参数

// 暗门 2：返回的列表不支持 add / remove
List<String> fixed = Arrays.asList("a", "b");
fixed.set(0, "x");      // 可以：set 是替换
fixed.add("c");         // UnsupportedOperationException！
fixed.remove(0);        // 同样炸

// 暗门 3：它是原数组的视图——改列表会联动改原数组
String[] src = {"a", "b"};
List<String> view = Arrays.asList(src);
view.set(0, "z");
System.out.println(src[0]);    // z，原数组被改了

// 推荐写法：JDK 9+ 用 List.of 创建不可变列表（语义清晰），或 new ArrayList<>(...) 创建可变副本`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 4：空 catch 块把异常吞了。</strong>线上排障最恨这个：日志里一片干净，系统却行为诡异。异常被捕获后什么都不做，等于把案发现场清理掉了：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'SwallowException.java',
          code: `// 反面教材：吞异常，出了问题无从查起
try {
    orderService.pay(orderId);
} catch (Exception e) {
    // 先这样，回头再处理     ← 「回头」永远不会来
}

// 正面写法 1：记日志，异常对象必须作为最后一个参数传进去（打印堆栈）
try {
    orderService.pay(orderId);
} catch (BizException e) {
    log.error("支付失败, orderId={}", orderId, e);
    throw e;                    // 或转成统一返回，但绝不能静默
}

// 正面写法 2：能处理的处理，处理不了的往外抛，交给全局异常处理器（m07 会讲）`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 5：switch 漏 break，逻辑穿透。</strong>老式 switch 语句一旦漏写 <code>break</code>，会「穿透」执行下一个 case 的代码——编译器只给警告。JDK 14 起的箭头语法从根上解决了这个问题：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'SwitchDemo.java',
          code: `// 反面教材：漏了 break，type=VIP 时会依次执行三段
switch (type) {
    case "VIP":
        discount = 0.8;
        // 忘写 break！穿透到下一行
    case "NEW":
        discount = 0.9;     // VIP 用户被改成 0.9
        break;
    default:
        discount = 1.0;
}

// 正面写法：箭头语法（JDK 14+），没有穿透，还支持返回值
double discount = switch (type) {
    case "VIP" -> 0.8;
    case "NEW" -> 0.9;
    default -> 1.0;
};`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 6：流、连接用完不关，资源泄漏。</strong>前端世界里没有「文件句柄」概念，Java 里每个打开的输入流、数据库连接都是系统资源，不还回去迟早耗尽。try-with-resources 语法保证资源用完自动关闭：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TryWithResources.java',
          code: `// 反面教材：忘了 close，文件句柄越占越多
InputStream in = Files.newInputStream(path);
// ... 用 in 读数据
in.close();      // 中途抛异常就永远执行不到

// 正面写法：try-with-resources，圆括号里声明的资源会在 try 结束时自动关闭（即使抛异常）
try (InputStream in = Files.newInputStream(path)) {
    in.readAllBytes();
} catch (IOException e) {
    log.error("读取文件失败, path={}", path, e);
}

// 凡是实现了 AutoCloseable 的对象都能放进去：输入输出流、Connection、Socket……`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>坑 7：用 == 比较字符串内容。</strong>这一条 l01 提过，但因为它翻车率太高，放进行动清单压轴。<code>==</code> 比的是引用地址；字面量恰好共享常量池所以「看起来对」，一旦字符串来自请求参数、数据库，就必炸：</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'EqualsDemo.java',
          code: `String input = request.getHeader("X-Role");   // 来自请求，不在常量池

// 反面教材：input == "admin" 几乎必然 false（地址不同）
// 正面写法：常量放前面调 equals，顺便防 input 为 null 的 NPE
if ("admin".equals(input)) {
    grantRoot();
}

// 多值判断用 switch（内部就是 equals 语义）或 Set.of("admin", "root").contains(input)`,
        },
        {
          type: 'table',
          title: '避坑速查表（建议截图保存）',
          head: ['坑', '典型现象', '一句话修法'],
          rows: [
            ['循环 += 拼串', '接口越跑越慢', 'StringBuilder 或 String.join'],
            ['遍历时增删', 'ConcurrentModificationException', 'removeIf 或 iterator.remove'],
            ['Arrays.asList', 'add 就炸 / size 不对 / 改了原数组', 'List.of 不可变；new ArrayList&lt;&gt;() 做可变副本'],
            ['空 catch', '线上无日志但行为诡异', 'log.error("xx, id={}", id, e) 后再处理或上抛'],
            ['switch 漏 break', '逻辑穿透，分支结果离谱', '用 JDK 14+ 箭头语法'],
            ['资源不关', '文件句柄 / 连接耗尽', 'try-with-resources'],
            ['== 比内容', '条件永远 false', '"常量".equals(变量)'],
          ],
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>前端侧对照：</strong>坑 1、2、7 在 JS 里同样存在（<code>for...of</code> 中 splice 数组行为不同但同样是坑，<code>==</code> 在 JS 里因类型转换更隐蔽），只是 JS 容错高、报错晚；Java 把这些问题大多提前到「立刻抛异常」，反而是好事——<strong>炸在开发期好过炸在线上</strong>。把这一课的 7 条变成肌肉记忆，你的 Java 代码评审通过率会高一个档次。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能对着速查表复述 7 个坑的现象与修法。</li>
<li>写过一次 removeIf 与 try-with-resources。</li>
<li>养成「常量在前调 equals」「log.error 带异常对象」两个习惯。</li></ul>
<p>阶段一（IDEA / Maven / Java 语法）到此收官，下一模块进入 <strong>Spring Boot</strong>，开始写真正的后端。</p>`,
        },
      ],
      quiz: [
        {
          q: '遍历 List 时想删除满足条件的元素，以下哪种写法不会抛 ConcurrentModificationException？',
          options: [
            '增强 for 循环里调用 list.remove(元素)',
            'list.removeIf(条件)',
            'foreach 中先 remove 再 continue',
            '增强 for 循环里调用 list.clear()',
          ],
          answer: 1,
          explain:
            'removeIf 是集合自身提供的结构安全删除方式；iterator.remove() 同样安全。其余写法都会让迭代器的结构计数对不上而抛 ConcurrentModificationException。',
        },
        {
          q: '关于 Arrays.asList(1, 2, 3) 返回的列表，下列说法正确的是？',
          options: [
            '可以正常 add、remove，和 ArrayList 一样',
            '它的大小固定，add / remove 会抛 UnsupportedOperationException',
            '它是原数组的深拷贝，修改互不影响',
            '传入 int[] 数组时它会正确拆成 3 个元素',
          ],
          answer: 1,
          explain:
            'Arrays.asList 返回固定大小的视图列表：set 可以，add/remove 抛异常，且改动会联动原数组。需要可变列表用 new ArrayList<>(Arrays.asList(...))，需要不可变列表用 List.of。',
        },
        {
          q: '捕获异常后想「记日志再上抛」，下列哪种写法能把堆栈打进日志？',
          options: [
            'log.error("支付失败: " + e.getMessage());',
            'log.error("支付失败, orderId={}", orderId, e);',
            'printStackTrace 写在 catch 外面',
            'log.info("支付失败", e.getMessage());',
          ],
          answer: 1,
          explain:
            '把异常对象作为最后一个参数传给 log.error，日志框架才会打印完整堆栈。只拼 getMessage 会丢掉发生位置；占位符 + 上下文变量 + 异常对象是标准姿势。',
        },
        {
          q: '老式 switch 语句漏写 break 会发生什么？',
          options: [
            '编译报错，无法运行',
            '运行时抛 IllegalStateException',
            '继续执行下一个 case 的代码（逻辑穿透），编译只给警告',
            '自动跳出整个 switch，无事发生',
          ],
          answer: 2,
          explain:
            'switch 穿透是设计如此：匹配到 case 后一路执行到 break 或末尾。JDK 14+ 的箭头语法（case X -> ...）没有穿透问题，是现在的推荐写法。',
        },
      ],
    },
  ],
};