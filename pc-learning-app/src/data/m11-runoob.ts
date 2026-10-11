import type { RawModule, Section } from '../types/course'
import { EXAMPLES } from './examples'

/**
 * m11 · Java 实例精练（基础篇）—— 课程数据
 *
 * 内容改编自菜鸟教程 runoob.com「Java 实例」页的 44 个精选示例，
 * 与 src/data/examples.ts（练习页示例库）共用同一份数据源：
 * 课程里看到代码，点「在练习页打开」即可在内置 JDK 中直接运行。
 * 每课一个主题分类 + 3 道随堂测验，作为 Java 基础（m03）的收官实战。
 */

/** 按 id 取示例并包装成课程代码块（保证课程与练习库永不脱节） */
function codeOf(id: string): Section {
  const e = EXAMPLES.find((x) => x.id === id)
  if (!e) throw new Error(`m11 引用了不存在的示例：${id}`)
  return { type: 'code', lang: 'java', filename: `${e.className}.java`, code: e.code }
}

export const module: RawModule = {
  id: 'm11',
  order: 4, // MODULE_META 中位于 m03 之后、阶段一第 4 位（loadModules 按注册表顺序重算）
  title: 'Java 实例精练（基础篇）',
  subtitle: 'runoob 实例精选 · 每个例子都能在练习页跑起来',
  phase: 'phase1',
  phaseName: '阶段一 · 快速上手',
  icon: '💻',
  cover: 'assets/img/hero.jpg',
  minutes: 160,
  summary:
    'Java 基础的收官实战模块：九大主题（字符串、数组、方法与递归、经典图形、日期时间、异常、数据结构、集合、多线程）精选 44 个来自 runoob 菜鸟教程的实例改编。每个示例都是完整可运行的单文件程序——课程里点「在练习页打开」，左侧编辑器右侧输出，用内置 JDK 立刻跑出结果。学完 m03 的语法后，用这个模块把「看得懂」变成「写得出」。',

  /* ---------------- 闪卡 10 张 ---------------- */
  flashcards: [
    { front: '字符串比较为什么不能用 ==？', back: '== 比引用地址；内容比较用 equals。new String("a") == "a" 为 false', tag: '字符串' },
    { front: 'String.split("\\\\.") 在做什么？', back: 'split 参数是正则，点号要转义才能按字面点分割（如按 IP 地址的 . 切分）', tag: '坑点' },
    { front: '数组排序 + 二分查找的组合？', back: 'Arrays.sort(arr) 先排序，再 Arrays.binarySearch(arr, key)。二分必须有序数组', tag: '数组' },
    { front: '方法重载的条件？', back: '同名不同参（类型或个数）。仅返回值不同不构成重载，编译报错', tag: '方法' },
    { front: '递归必备的两个要素？', back: '终止条件（base case）+ 递推关系。缺终止条件直接 StackOverflowError', tag: '方法' },
    { front: 'finally 块什么时候执行？', back: '无论是否抛异常都会执行（System.exit 除外）。return 之前执行', tag: '异常' },
    { front: 'Stack 和 Queue 对应哪个实现类？', back: 'Stack 继承自 Vector；Queue 推荐用 LinkedList 或 ArrayDeque 实现', tag: '数据结构' },
    { front: 'Arrays.asList 得到的集合能 add 吗？', back: '不能！它是定长视图，add/remove 抛 UnsupportedOperationException', tag: '集合' },
    { front: '遍历集合时如何安全删除？', back: '用 Iterator.remove() 或 list.removeIf(...)；直接 list.remove 会 ConcurrentModificationException', tag: '集合' },
    { front: '让子线程输出先于主线程结束，怎么做？', back: '主线程调用 t.join() 等待 t 执行完毕再继续往下走', tag: '线程' },
  ],

  lessons: [
    /* ============================ L01 字符串 ============================ */
    {
      id: 'm11-l01',
      title: '字符串常用操作',
      minutes: 15,
      goal: '掌握字符串的比较、反转、替换、分割、大小写与格式化六大高频操作，记住 split 的正则坑。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>字符串是日常业务代码里出现频率最高的类型。这一课把 runoob 上最常用的 6 个字符串实例一次练完：每个示例都是完整可运行的程序，点代码块右上角的「在练习页打开」，马上跑给你看。</p>
<p>重点关注两件事：<code>equals</code> 与 <code>==</code> 的区别（m03 讲过的经典坑），以及 <code>split</code> 的参数是<strong>正则表达式</strong>——按点号切分要写 <code>split("\\\\.")</code>。</p>`,
        },
        codeOf('ex-string-01'),
        codeOf('ex-string-02'),
        codeOf('ex-string-03'),
        codeOf('ex-string-04'),
        codeOf('ex-string-05'),
        codeOf('ex-string-06'),
        {
          type: 'tip',
          html: String.raw`<p><strong>练习建议</strong>：把这 6 个示例依次在练习页跑一遍后，试着把「字符串反转」改成自己实现（for 循环倒着拼），再和 <code>StringBuilder.reverse()</code> 对比输出。示例里的 tip 字段标出了每个 API 的易错点。</p>`,
        },
      ],
      quiz: [
        {
          q: 'String s1 = new String("abc"); String s2 = "abc"; s1 == s2 的结果是？',
          options: ['true', 'false', '编译错误', '运行时异常'],
          answer: 1,
          explain: '== 比较的是引用地址，new 出来的对象在堆里，字面量在常量池，地址不同。内容比较要用 s1.equals(s2)。',
        },
        {
          q: '想按小数点分割 "192.168.1.1"，正确的写法是？',
          options: ['s.split(".")', 's.split("\\\\.")', 's.split(".", -1)', 's.split(Point)'],
          answer: 1,
          explain: 'split 的参数是正则表达式，. 在正则里匹配任意字符，必须转义；字符串字面量里反斜杠本身还要再转义一次。',
        },
        {
          q: 'String.format("%.2f", 3.14159) 的输出是？',
          options: ['3.14', '3.14159', '3.1', '3.142'],
          answer: 0,
          explain: '%.2f 表示保留两位小数并四舍五入，输出 3.14。',
        },
      ],
    },

    /* ============================ L02 数组 ============================ */
    {
      id: 'm11-l02',
      title: '数组常用操作',
      minutes: 15,
      goal: '熟练使用 Arrays 工具类：排序、二分查找、填充、输出；掌握手写反转与查找重复元素的思路。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>数组的日常操作 90% 靠 <code>java.util.Arrays</code> 工具类解决。本课 6 个示例覆盖：排序与二分查找、反转、最大最小值、填充、合并、重复元素查找。</p>
<p>一个关键前提要记牢：<strong>binarySearch 必须作用在有序数组上</strong>，否则结果不可预期。</p>`,
        },
        codeOf('ex-array-01'),
        codeOf('ex-array-02'),
        codeOf('ex-array-03'),
        codeOf('ex-array-04'),
        codeOf('ex-array-05'),
        codeOf('ex-array-06'),
        {
          type: 'tip',
          html: String.raw`<p><strong>练习建议</strong>：「查找重复元素」示例用了 HashSet 计数法，试试改成先 <code>Arrays.sort()</code> 再比较相邻元素的做法，对比两种思路。</p>`,
        },
      ],
      quiz: [
        {
          q: '使用 Arrays.binarySearch(arr, key) 前必须做什么？',
          options: ['把数组转成 List', '先 Arrays.sort(arr) 排序', '数组必须是二维的', '什么都不用做'],
          answer: 1,
          explain: '二分查找的前提是有序数组。对无序数组二分的结果不可预期（不会报错，但可能找不到）。',
        },
        {
          q: '直接打印 int[] arr，System.out.println(arr) 输出的是？',
          options: ['数组元素列表', '[1, 2, 3] 这样的格式', '类似 [I@1b6d3586 的地址表示', '编译错误'],
          answer: 2,
          explain: '数组没有重写 toString，直接打印得到类型@哈希。要输出内容用 Arrays.toString(arr)。',
        },
        {
          q: 'Arrays.fill(arr, 0) 的作用是？',
          options: ['把数组第一个元素设为 0', '把数组全部元素设为 0', '把数组长度清零', '删除值为 0 的元素'],
          answer: 1,
          explain: 'fill 是「填充」：把整个数组（或指定区间）的每个元素都设为给定值。',
        },
      ],
    },

    /* ============================ L03 方法与递归 ============================ */
    {
      id: 'm11-l03',
      title: '方法、重载与递归',
      minutes: 18,
      goal: '理解方法重载与可变参数；会用递归写阶乘与斐波那契；掌握 for/foreach 与 enum+switch 的组合用法。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>方法是把逻辑拆小的基本单元。本课 6 个示例：方法重载、可变参数（varargs）、递归阶乘、递归斐波那契、enum + switch、for/foreach 遍历。</p>
<p>递归的两要素：终止条件 + 递推关系。斐波那契的朴素递归有大量重复计算，示例里同时给了对照说明——这是后面学「动态规划」的引子。</p>`,
        },
        codeOf('ex-method-01'),
        codeOf('ex-method-02'),
        codeOf('ex-method-03'),
        codeOf('ex-method-04'),
        codeOf('ex-method-05'),
        codeOf('ex-method-06'),
        {
          type: 'tip',
          html: String.raw`<p><strong>练习建议</strong>：把阶乘改成循环写法，再想想「仅返回值不同、参数相同」能不能构成重载——答案是不能，编译器会直接报错。</p>`,
        },
      ],
      quiz: [
        {
          q: '下面哪种情况能构成方法重载（overloading）？',
          options: [
            '仅返回值类型不同，参数完全相同',
            '仅参数名不同，参数类型与个数相同',
            '方法名相同，参数类型或个数不同',
            '仅访问修饰符不同，参数完全相同',
          ],
          answer: 2,
          explain: '重载要求「方法名相同、参数列表不同（类型或个数）」。其余三种都只是签名里非决定性的部分不同，编译器会报重复定义。',
        },
        {
          q: '递归方法缺少终止条件会发生什么？',
          options: ['返回 null', '编译不过', 'StackOverflowError', '自动变成循环'],
          answer: 2,
          explain: '每层递归压一层栈帧，没有终止条件会一直压栈直到栈溢出：java.lang.StackOverflowError。',
        },
        {
          q: '可变参数 String... args 的本质是？',
          options: ['一个 String 对象', '一个 String[] 数组参数的语法糖', '一个 List', '一个 Map'],
          answer: 1,
          explain: 'varargs 编译后就是数组参数，调用方可以传任意个数的字符串，方法体里按数组处理。',
        },
      ],
    },

    /* ============================ L04 打印图形 ============================ */
    {
      id: 'm11-l04',
      title: '经典打印图形',
      minutes: 12,
      goal: '用双层循环打印菱形、九九乘法表与三角形，训练「行-列」二维结构的循环建模能力。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>打印图形是最经典的循环入门练习：把图形拆成「每一行打印几个空格、几个星号」的规律，用双层 for 循环表达。本课 4 个示例：菱形、九九乘法表、直角三角形、倒三角。</p>
<p>重点不在背代码，而在<strong>找规律</strong>：第 i 行空格数 = 总行数 - i，星号数 = 2*i - 1，这类关系式才是通用解法。</p>`,
        },
        codeOf('ex-shape-01'),
        codeOf('ex-shape-02'),
        codeOf('ex-shape-03'),
        codeOf('ex-shape-04'),
        {
          type: 'tip',
          html: String.raw`<p><strong>练习建议</strong>：自己动手把菱形改成「空心菱形」——只在首尾和边缘打印 *，其余位置打空格。改完在练习页直接看输出验证。</p>`,
        },
      ],
      quiz: [
        {
          q: '打印 5 行的实心菱形，第 3 行（中间行）需要打印几个星号？',
          options: ['3 个', '4 个', '5 个', '6 个'],
          answer: 2,
          explain: '第 i 行星号数 = 2*i - 1，第 3 行 = 2*3-1 = 5 个。中间行是菱形最宽处，等于总行数。',
        },
        {
          q: '九九乘法表的内层循环条件 for (int j = 1; j <= i; j++) 的含义是？',
          options: [
            '每行固定打印 9 列',
            '第 i 行只打印 i 列（利用对称性去掉重复）',
            '内层循环从 i 开始',
            '为了编译通过',
          ],
          answer: 1,
          explain: '乘法表沿对角线对称，1*9 与 9*1 重复；内层上限取 i 可以只输出一半，第 i 行恰好 i 列。',
        },
        {
          q: '想在输出里打印一个反斜杠 \\，System.out.println 的参数应写成？',
          options: ['"\\"', '"\\\\"', "'\\\\'", "//"],
          answer: 1,
          explain: '反斜杠在 Java 字符串里是转义字符，要表示字面量 \\ 需要写成 \\\\（两个反斜杠）。',
        },
      ],
    },

    /* ============================ L05 日期时间 ============================ */
    {
      id: 'm11-l05',
      title: '日期与时间处理',
      minutes: 10,
      goal: '会用 SimpleDateFormat 格式化与解析时间、用 Calendar 取年月日字段、完成时间戳与 Date 的互转。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>本课 3 个示例来自 runoob 的时间处理实例：<code>SimpleDateFormat</code> 格式化、<code>Calendar</code> 取字段、时间戳互转。</p>
<p>说明：业务项目里更推荐 JDK 8+ 的 <code>java.time</code>（LocalDateTime / DateTimeFormatter，m03 深挖课有讲）；但大量老代码和面试题仍在用这两个经典 API，必须看得懂。为让输出可复现，示例统一用<strong>固定毫秒值</strong>而不是当前时间。</p>`,
        },
        codeOf('ex-date-01'),
        codeOf('ex-date-02'),
        codeOf('ex-date-03'),
        {
          type: 'warn',
          html: String.raw`<p><strong>注意时区</strong>：SimpleDateFormat 与 Calendar 都带时区概念。跨时区部署时同一时间戳会格式化出不同文本；示例中显式指定了 GMT+8 保证结果稳定。</p>`,
        },
      ],
      quiz: [
        {
          q: 'yyyy-MM-dd HH:mm:ss 中 HH 与 hh 的区别是？',
          options: ['没有区别', 'HH 是 24 小时制，hh 是 12 小时制', 'HH 是 12 小时制，hh 是 24 小时制', 'HH 表示毫秒'],
          answer: 1,
          explain: '大写 HH 走 0~23 的 24 小时制；小写 hh 走 1~12 的 12 小时制（通常配合上午/下午标记）。',
        },
        {
          q: 'new Date(1700000000000L) 中的 1700000000000L 表示？',
          options: ['从 1970-01-01 起的毫秒数', '从 1900 年起的秒数', '当前年份编码', '随机种子'],
          answer: 0,
          explain: 'Java 的时间戳基准是 Unix 纪元 1970-01-01 00:00:00 UTC，Date 内部保存的就是距基准点的毫秒数，L 表示 long 字面量。',
        },
        {
          q: 'Calendar.getInstance().get(Calendar.MONTH) 一月返回的是？',
          options: ['1', '0', '12', '-1'],
          answer: 1,
          explain: 'Calendar 的月份字段从 0 开始计数（0 = 一月），这是著名的反直觉设计。java.time 的月份则从 1 开始。',
        },
      ],
    },

    /* ============================ L06 异常处理 ============================ */
    {
      id: 'm11-l06',
      title: '异常处理实战',
      minutes: 14,
      goal: '掌握 try-catch-finally 执行顺序、多个 catch 的匹配规则、自定义异常定义与堆栈信息的阅读方法。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>异常是 Java 强制你面对的错误处理机制（受检异常不处理就编译不过）。本课 4 个示例：finally 执行顺序、多个 catch 的分支、自定义异常、打印堆栈信息。</p>
<p>读堆栈是后端排查问题的第一技能：从上往下第一行是异常类型与消息，第一个「你自己的类」的帧通常就是问题源头。</p>`,
        },
        codeOf('ex-exception-01'),
        codeOf('ex-exception-02'),
        codeOf('ex-exception-03'),
        codeOf('ex-exception-04'),
        {
          type: 'tip',
          html: String.raw`<p><strong>记忆口诀</strong>：try 包住可能出事的代码，catch 从具体到宽泛排列（子类异常在前），finally 收尾必执行。把「多个 catch」示例里的 catch 顺序调换一下，编译器会告诉你什么叫「不可达的 catch 块」。</p>`,
        },
      ],
      quiz: [
        {
          q: 'try 块中 return 5，finally 块中 System.out.println("finally")，输出顺序是？',
          options: ['finally 先打印，再返回 5', '先返回 5，finally 不执行', '编译错误', 'finally 先打印并覆盖返回值为 6'],
          answer: 0,
          explain: 'finally 在方法真正返回前执行：return 的值已确定，但 finally 的代码会先跑完。（除非 finally 里也写 return，会覆盖返回值——这是反模式）',
        },
        {
          q: '多个 catch 块同时存在（Exception 与 ArithmeticException），排列原则是？',
          options: ['随意排列', '父类异常放前面', '子类异常放前面，父类放后面', '只能有一个 catch'],
          answer: 2,
          explain: 'catch 自上而下匹配，父类 Exception 放前面会把子类异常全部吃掉，后面的 catch 变成不可达代码，编译直接报错。',
        },
        {
          q: '自定义异常通常继承哪个类（非受检场景）？',
          options: ['Throwable', 'Error', 'RuntimeException', 'String'],
          answer: 2,
          explain: '业务异常一般继承 RuntimeException（非受检），调用方不必强制 try-catch；需要强制调用方处理时才继承 Exception。',
        },
      ],
    },

    /* ============================ L07 数据结构 ============================ */
    {
      id: 'm11-l07',
      title: '常用数据结构：栈、队列与链表',
      minutes: 16,
      goal: '会用 Stack/Queue/LinkedList/ArrayDeque 四个实现类，理解「先进后出 / 先进先出」的差异与典型用途。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>数据结构课听起来吓人，但入门只需要记住两个词：<strong>栈 = 先进后出</strong>（像叠盘子），<strong>队列 = 先进先出</strong>（像排队）。本课 5 个示例：数字求和的三种写法、Stack、Queue、LinkedList、ArrayDeque。</p>
<p>实践建议：<code>ArrayDeque</code> 性能优于老的 <code>Stack</code> 类（Stack 继承自同步的 Vector，带锁开销），新代码推荐 ArrayDeque——示例里两种都演示了。</p>`,
        },
        codeOf('ex-ds-01'),
        codeOf('ex-ds-02'),
        codeOf('ex-ds-03'),
        codeOf('ex-ds-04'),
        codeOf('ex-ds-05'),
        {
          type: 'tip',
          html: String.raw`<p><strong>场景对号</strong>：函数调用、括号匹配、撤销操作 → 栈；任务排队、消息缓冲 → 队列；需要两头增删 → ArrayDeque。跑一遍「栈的实现」示例，体会 push/pop 的顺序。</p>`,
        },
      ],
      quiz: [
        {
          q: '栈（Stack）的出入顺序是？',
          options: ['先进先出', '先进后出', '随机出入', '按元素大小排序'],
          answer: 1,
          explain: '栈是 LIFO（Last In First Out）：最后 push 的元素最先 pop，如同叠盘子。',
        },
        {
          q: '新代码里推荐用哪个类当栈使用？',
          options: ['Vector', 'Stack', 'ArrayDeque', 'Hashtable'],
          answer: 2,
          explain: 'ArrayDeque 更快（无锁开销）且接口更现代；Stack 继承 Vector，每个方法都带 synchronized，官方文档也推荐 ArrayDeque 替代。',
        },
        {
          q: 'Queue 接口的实现类LinkedList，add() 和 remove() 分别从哪端操作？',
          options: ['都从队头', '都从队尾', 'add 加到队尾，remove 从队头取', 'add 加到队头，remove 从队尾取'],
          answer: 2,
          explain: 'Queue 遵循 FIFO：offer/add 在队尾入列，poll/remove 从队头出列，正好模拟现实排队。',
        },
      ],
    },

    /* ============================ L08 集合框架 ============================ */
    {
      id: 'm11-l08',
      title: '集合框架实战',
      minutes: 18,
      goal: '掌握 HashMap 遍历、迭代器安全删除、Comparator 排序、HashSet 去重与 List 截取替换，避开 Arrays.asList 的定长坑。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>集合是业务代码的粮食。本课 6 个示例全部来自 runoob 集合实例：数组转集合、HashMap 遍历、迭代器安全删除、Comparator 排序、HashSet 去重、subList 截取与 set 替换。</p>
<p>两个高频坑提前划重点：<code>Arrays.asList</code> 返回的是<strong>定长视图</strong>不能 add/remove；<strong>遍历时删除元素</strong>必须走 <code>Iterator.remove()</code> 或 <code>removeIf</code>。</p>`,
        },
        codeOf('ex-collection-01'),
        codeOf('ex-collection-02'),
        codeOf('ex-collection-03'),
        codeOf('ex-collection-04'),
        codeOf('ex-collection-05'),
        codeOf('ex-collection-06'),
        {
          type: 'warn',
          html: String.raw`<p><strong>HashMap 遍历顺序</strong>：HashMap 不保证顺序！示例输出基于固定的 key 集合实测得出，但换一组 key 顺序就可能不同。需要有序请用 <code>TreeMap</code>（按 key 排序）或 <code>LinkedHashMap</code>（按插入顺序）。</p>`,
        },
      ],
      quiz: [
        {
          q: 'List<Integer> list = Arrays.asList(1, 2, 3); list.add(4); 会怎样？',
          options: ['正常添加', '抛 UnsupportedOperationException', '抛 ClassCastException', '静默失败'],
          answer: 1,
          explain: 'Arrays.asList 返回的是基于原数组的定长视图，不支持结构性修改（add/remove），只支持 set 替换。',
        },
        {
          q: 'for 循环遍历 ArrayList 时直接 list.remove(x)，最常见的后果是？',
          options: ['删除成功无异常', 'ConcurrentModificationException', 'IndexOutOfBoundsException', '删除的元素复活'],
          answer: 1,
          explain: 'ArrayList 的迭代器有 modCount 校验，遍历中结构性修改会触发快速失败。正确姿势：iterator.remove() 或 list.removeIf(...)。',
        },
        {
          q: '想按学生分数从高到低排序 List<Student>，最合适的写法是？',
          options: [
            'Collections.sort(list)（Student 需实现 Comparable）',
            'list.sort(Comparator.comparingInt(Student::getScore).reversed())',
            'HashSet 自动排序',
            '用 HashMap 的 key 排序',
          ],
          answer: 1,
          explain: 'Comparator 表达「临时排序规则」，comparingInt 提取分数后 reversed() 反转成降序；A 也对但要求实体类实现 Comparable（侵入性强），本课示例用的是 Comparator 方式。',
        },
      ],
    },

    /* ============================ L09 多线程 ============================ */
    {
      id: 'm11-l09',
      title: '多线程入门',
      minutes: 16,
      goal: '掌握创建线程的两种方式、sleep 与 join 的配合、interrupt 中断的正确姿势，理解线程输出为何不确定。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>多线程让程序「同时做多件事」。本课 4 个示例：继承 Thread、实现 Runnable（推荐）、sleep+join 控制执行顺序、interrupt 优雅中断。</p>
<p>先建立一个正确预期：<strong>线程的交错输出天然不确定</strong>。示例统一用 <code>join()</code> 等子线程结束后再由主线程汇总打印，保证你看到的结果每次一致——这是把并发示例写「可测」的关键手法。</p>`,
        },
        codeOf('ex-thread-01'),
        codeOf('ex-thread-02'),
        codeOf('ex-thread-03'),
        codeOf('ex-thread-04'),
        {
          type: 'tip',
          html: String.raw`<p><strong>练习建议</strong>：把「sleep 与 join」示例里的 <code>t.join()</code> 注释掉再跑几次，观察输出顺序开始抖动——这就是并发的本质。实际项目里用线程池（ExecutorService）而不是手动 new Thread，m09 之后会接触。</p>`,
        },
      ],
      quiz: [
        {
          q: '实现 Runnable 相比继承 Thread 的最大优势是？',
          options: ['运行更快', '不占用继承位，还能 implements 多个接口', '不需要重写任何方法', '自动线程安全'],
          answer: 1,
          explain: 'Java 单继承：继承了 Thread 就不能继承别的类。实现 Runnable 把「任务」与「线程」解耦，是推荐做法（lambda 时代写法也更简洁）。',
        },
        {
          q: '主线程想等子线程 t 执行完再继续，应调用？',
          options: ['t.sleep()', 't.yield()', 't.join()', 't.wait()'],
          answer: 2,
          explain: 'join() 让当前线程（主线程）阻塞等待 t 终止。sleep 是睡自己，yield 是让出 CPU，wait 是对象锁层面的等待机制。',
        },
        {
          q: '线程正在 sleep 时被 interrupt()，会发生什么？',
          options: ['线程立即终止', 'sleep 抛 InterruptedException 并清除中断标记', '什么都不发生', 'JVM 退出'],
          answer: 1,
          explain: '阻塞中的线程收到中断会抛 InterruptedException，需要代码自己捕获并决定退出策略——「中断是协作式的，不是强杀」。',
        },
      ],
    },
  ],
}
