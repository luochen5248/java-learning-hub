/**
 * Java 示例库 · 数据文件
 *
 * 数据来源改编自 runoob.com「Java 实例」页，面向前端转 Java 的初学者。
 * 构建时会用内置 JDK 逐个实测校验：每个示例的 expect 必须与真实运行输出完全一致。
 * 所有示例均兼容 JDK 17+ 单文件源码运行（java Xxx.java），无交互输入、无文件/网络 IO。
 */

export type CatId =
  | 'string'
  | 'array'
  | 'method'
  | 'shape'
  | 'date'
  | 'exception'
  | 'ds'
  | 'collection'
  | 'thread'

export interface Cat {
  id: CatId
  name: string
  icon: string
}

export interface Example {
  id: string // 如 'ex-string-01'
  cat: CatId
  title: string // 如 '字符串比较'
  desc: string // 一句话说明这个示例教什么
  className: string // 与代码中 public class 同名，PascalCase
  code: string // 完整可运行 Java 源码（String.raw 包裹）
  expect: string // 预测的完整控制台输出（构建时实测比对，多行用 \n）
  tip?: string // 可选：易错点或要点
}

export const CATS: Cat[] = [
  { id: 'string', name: '字符串', icon: '🅰' },
  { id: 'array', name: '数组', icon: '🔢' },
  { id: 'method', name: '方法', icon: '🧩' },
  { id: 'shape', name: '打印图形', icon: '📐' },
  { id: 'date', name: '时间', icon: '⏰' },
  { id: 'exception', name: '异常', icon: '🛡' },
  { id: 'ds', name: '数据结构', icon: '🧱' },
  { id: 'collection', name: '集合', icon: '📦' },
  { id: 'thread', name: '多线程', icon: '🧵' },
]

export const EXAMPLES: Example[] = [
  /* ============================ string 字符串 × 6 ============================ */
  {
    id: 'ex-string-01',
    cat: 'string',
    title: '字符串比较',
    desc: 'equals 与 == 的区别，前端转 Java 的第一道坎',
    className: 'StringCompare',
    code: String.raw`public class StringCompare {
    public static void main(String[] args) {
        String s1 = "hello";
        String s2 = "hello";
        String s3 = new String("hello");
        // == 比较地址: 字面量在常量池里是同一个对象, new 出来是新对象
        System.out.println(s1 == s2);
        System.out.println(s1 == s3);
        // equals 比较内容
        System.out.println(s1.equals(s3));
        String s4 = "Hello";
        System.out.println(s1.equals(s4));
        // 忽略大小写比较
        System.out.println(s1.equalsIgnoreCase(s4));
    }
}`,
    expect: 'true\nfalse\ntrue\nfalse\ntrue',
    tip: 'Java 里比较字符串内容必须用 equals，== 只在两个字面量恰好共享常量池对象时碰巧为 true',
  },
  {
    id: 'ex-string-02',
    cat: 'string',
    title: '字符串反转',
    desc: 'StringBuilder.reverse 与倒序循环两种写法，顺带回文判断',
    className: 'StringReverse',
    code: String.raw`public class StringReverse {
    public static void main(String[] args) {
        String str = "runoob";
        // 方法一: StringBuilder 的 reverse()
        String r1 = new StringBuilder(str).reverse().toString();
        System.out.println(r1);
        // 方法二: 倒序循环逐字符拼接
        String r2 = "";
        for (int i = str.length() - 1; i >= 0; i--) {
            r2 += str.charAt(i);
        }
        System.out.println(r2);
        // 回文判断: 反转后与原串相同
        String check = "level";
        System.out.println(check.equals(new StringBuilder(check).reverse().toString()));
    }
}`,
    expect: 'boonur\nboonur\ntrue',
    tip: '循环里大量拼接字符串应该用 StringBuilder，直接 + 会产生很多临时对象',
  },
  {
    id: 'ex-string-03',
    cat: 'string',
    title: '字符串替换',
    desc: 'replace、replaceFirst、replaceAll 正则替换与 trim 去空格',
    className: 'StringReplace',
    code: String.raw`public class StringReplace {
    public static void main(String[] args) {
        String str = "hello world, hello java";
        // replace 是字面替换, 全部替换
        System.out.println(str.replace("hello", "hi"));
        // replaceFirst 只替换第一处
        System.out.println(str.replaceFirst("hello", "hi"));
        // replaceAll 支持正则: 把所有数字换成 *
        String num = "abc123def456";
        System.out.println(num.replaceAll("\\d", "*"));
        // trim 去除首尾空格
        String space = "  java  ";
        System.out.println("[" + space.trim() + "]");
    }
}`,
    expect: 'hi world, hi java\nhi world, hello java\nabc***def***\n[java]',
    tip: 'replace 与 replaceAll 都替换全部，区别只在 replaceAll/replaceFirst 把参数当正则解析',
  },
  {
    id: 'ex-string-04',
    cat: 'string',
    title: '字符串分割(split)',
    desc: 'split 拆分数组、limit 限制次数、正则元字符转义',
    className: 'StringSplit',
    code: String.raw`public class StringSplit {
    public static void main(String[] args) {
        String str = "apple,banana,orange";
        // split 按分隔符拆成数组
        String[] fruits = str.split(",");
        for (String f : fruits) {
            System.out.println(f);
        }
        System.out.println("---");
        // 第二个参数限制分割次数
        String[] part = str.split(",", 2);
        System.out.println(part[0]);
        System.out.println(part[1]);
        System.out.println("---");
        // 按 . 分割需要转义, 因为 . 是正则元字符
        String ver = "jdk.17.0.1";
        for (String s : ver.split("\\.")) {
            System.out.println(s);
        }
    }
}`,
    expect: 'apple\nbanana\norange\n---\napple\nbanana,orange\n---\njdk\n17\n0\n1',
    tip: 'split 的参数是正则！按 . 或 | 分割必须写成 split("\\\\.") 否则返回空数组',
  },
  {
    id: 'ex-string-05',
    cat: 'string',
    title: '大小写转换',
    desc: 'toUpperCase/toLowerCase 与 Character 单字符转换、首字母大写',
    className: 'StringCase',
    code: String.raw`public class StringCase {
    public static void main(String[] args) {
        String str = "Hello Java";
        System.out.println(str.toUpperCase());
        System.out.println(str.toLowerCase());
        // 单个字符用 Character 工具类转换
        System.out.println(Character.toUpperCase('a'));
        System.out.println(Character.toLowerCase('A'));
        // 首字母大写技巧: 截下首字符转大写再拼回去
        String name = "java";
        String cap = name.substring(0, 1).toUpperCase() + name.substring(1);
        System.out.println(cap);
    }
}`,
    expect: 'HELLO JAVA\nhello java\nA\na\nJava',
  },
  {
    id: 'ex-string-06',
    cat: 'string',
    title: '字符串格式化(format)',
    desc: 'String.format 占位符：%d %s %.2f 宽度与对齐',
    className: 'StringFormat',
    code: String.raw`public class StringFormat {
    public static void main(String[] args) {
        // %d 整数 %s 字符串
        String s1 = String.format("姓名:%s, 年龄:%d", "小明", 18);
        System.out.println(s1);
        // %.2f 保留两位小数
        String s2 = String.format("圆周率约等于 %.2f", 3.14159);
        System.out.println(s2);
        // %5d 宽度 5 右对齐, %-5d 左对齐
        System.out.println(String.format("[%5d]", 42));
        System.out.println(String.format("[%-5d]", 42));
        // %x 十六进制
        System.out.println(String.format("255的十六进制: %x", 255));
    }
}`,
    expect: '姓名:小明, 年龄:18\n圆周率约等于 3.14\n[   42]\n[42   ]\n255的十六进制: ff',
    tip: '%.2f 会四舍五入；宽度前加 - 表示左对齐，前端可类比 padStart/padEnd',
  },

  /* ============================ array 数组 × 6 ============================ */
  {
    id: 'ex-array-01',
    cat: 'array',
    title: '排序及二分查找',
    desc: 'Arrays.sort 排序 + binarySearch 二分查找的标准用法',
    className: 'ArraysSortSearch',
    code: String.raw`import java.util.Arrays;

public class ArraysSortSearch {
    public static void main(String[] args) {
        int[] arr = {5, 2, 8, 1, 9};
        // sort 原地排序
        Arrays.sort(arr);
        System.out.println(Arrays.toString(arr));
        // 二分查找: 必须先排序才能用
        int index = Arrays.binarySearch(arr, 8);
        System.out.println("8的下标: " + index);
        // 找不到时返回负数
        int miss = Arrays.binarySearch(arr, 6);
        System.out.println(miss < 0 ? "6不存在" : "6的下标: " + miss);
    }
}`,
    expect: '[1, 2, 5, 8, 9]\n8的下标: 3\n6不存在',
    tip: 'binarySearch 找不到时返回 -(插入点)-1，本例 6 的插入点是 3 所以返回 -4',
  },
  {
    id: 'ex-array-02',
    cat: 'array',
    title: '数组反转',
    desc: '双指针原地交换反转数组',
    className: 'ArrayReverse',
    code: String.raw`import java.util.Arrays;

public class ArrayReverse {
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        // 双指针: 头尾互换后向中间收拢
        for (int i = 0, j = arr.length - 1; i < j; i++, j--) {
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        // Arrays.toString 打印数组内容
        System.out.println(Arrays.toString(arr));
    }
}`,
    expect: '[5, 4, 3, 2, 1]',
    tip: '直接打印数组得到的是 [I@xxxx 这样的地址，必须用 Arrays.toString',
  },
  {
    id: 'ex-array-03',
    cat: 'array',
    title: '最大最小值',
    desc: '循环打擂台与 Stream 两种求最值方式',
    className: 'ArrayMaxMin',
    code: String.raw`import java.util.Arrays;

public class ArrayMaxMin {
    public static void main(String[] args) {
        int[] arr = {12, 3, 45, 7, 29, 1};
        // 方法一: 打擂台, 假设第一个就是最大/最小
        int max = arr[0];
        int min = arr[0];
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] > max) max = arr[i];
            if (arr[i] < min) min = arr[i];
        }
        System.out.println("最大值: " + max);
        System.out.println("最小值: " + min);
        // 方法二: Stream 一行搞定
        int max2 = Arrays.stream(arr).max().getAsInt();
        int min2 = Arrays.stream(arr).min().getAsInt();
        System.out.println("Stream 最大值: " + max2);
        System.out.println("Stream 最小值: " + min2);
    }
}`,
    expect: '最大值: 45\n最小值: 1\nStream 最大值: 45\nStream 最小值: 1',
  },
  {
    id: 'ex-array-04',
    cat: 'array',
    title: '数组填充(fill)',
    desc: 'Arrays.fill 全量填充与指定区间填充',
    className: 'ArraysFill',
    code: String.raw`import java.util.Arrays;

public class ArraysFill {
    public static void main(String[] args) {
        int[] arr = new int[5];
        // 全部填充为 8
        Arrays.fill(arr, 8);
        System.out.println(Arrays.toString(arr));
        // 区间填充: [下标1, 下标3) 含头不含尾, 即下标 1、2
        Arrays.fill(arr, 1, 3, 0);
        System.out.println(Arrays.toString(arr));
        // fill 也能覆盖已有值
        int[] scores = {60, 70, 80, 90};
        Arrays.fill(scores, 2, 4, 100);
        System.out.println(Arrays.toString(scores));
    }
}`,
    expect: '[8, 8, 8, 8, 8]\n[8, 0, 0, 8, 8]\n[60, 70, 100, 100]',
  },
  {
    id: 'ex-array-05',
    cat: 'array',
    title: '数组合并',
    desc: 'System.arraycopy 高效复制合并两个数组',
    className: 'ArrayMerge',
    code: String.raw`import java.util.Arrays;

public class ArrayMerge {
    public static void main(String[] args) {
        int[] a = {1, 2, 3};
        int[] b = {4, 5, 6};
        // 新数组长度 = 两数组之和
        int[] c = new int[a.length + b.length];
        // arraycopy(源, 源起点, 目标, 目标起点, 长度)
        System.arraycopy(a, 0, c, 0, a.length);
        System.arraycopy(b, 0, c, a.length, b.length);
        System.out.println(Arrays.toString(c));
    }
}`,
    expect: '[1, 2, 3, 4, 5, 6]',
    tip: 'arraycopy 是 JVM 原生实现的深拷贝基本类型，比手写 for 循环快',
  },
  {
    id: 'ex-array-06',
    cat: 'array',
    title: '查找重复元素',
    desc: '利用 HashSet.add 的返回值找出数组中重复的元素',
    className: 'FindDuplicates',
    code: String.raw`import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

public class FindDuplicates {
    public static void main(String[] args) {
        String[] arr = {"java", "python", "java", "go", "python"};
        // seen 记录出现过的元素, dup 收集重复的
        Set<String> seen = new HashSet<>();
        Set<String> dup = new LinkedHashSet<>();
        for (String s : arr) {
            // add 返回 false 说明已存在, 即重复
            if (!seen.add(s)) {
                dup.add(s);
            }
        }
        System.out.println("重复元素: " + dup);
        System.out.println("重复个数: " + dup.size());
    }
}`,
    expect: '重复元素: [java, python]\n重复个数: 2',
    tip: 'Set.add 返回 boolean：元素不存在返回 true，已存在返回 false，常用来去重或找重复',
  },

  /* ============================ method 方法 × 6 ============================ */
  {
    id: 'ex-method-01',
    cat: 'method',
    title: '方法重载',
    desc: '同名不同参的方法重载与匹配规则',
    className: 'MethodOverload',
    code: String.raw`public class MethodOverload {
    // 同名方法, 参数列表不同即为重载, 与返回值无关
    static int add(int a, int b) {
        System.out.println("调用 add(int, int)");
        return a + b;
    }
    static double add(double a, double b) {
        System.out.println("调用 add(double, double)");
        return a + b;
    }
    static int add(int a, int b, int c) {
        System.out.println("调用 add(int, int, int)");
        return a + b + c;
    }
    public static void main(String[] args) {
        System.out.println(add(1, 2));
        System.out.println(add(1.5, 2.5));
        System.out.println(add(1, 2, 3));
    }
}`,
    expect: '调用 add(int, int)\n3\n调用 add(double, double)\n4.0\n调用 add(int, int, int)\n6',
    tip: '编译器按实参类型精确匹配，与 TS 的函数重载（只是类型声明）不同，Java 是真的生成多个方法',
  },
  {
    id: 'ex-method-02',
    cat: 'method',
    title: '可变参数(varargs)',
    desc: 'int... 可变参数本质是数组，可直接传数组',
    className: 'VarargsDemo',
    code: String.raw`public class VarargsDemo {
    // int... 表示可变参数, 方法内当作数组用
    static int sum(int... nums) {
        int total = 0;
        for (int n : nums) {
            total += n;
        }
        return total;
    }
    public static void main(String[] args) {
        System.out.println(sum());
        System.out.println(sum(1, 2));
        System.out.println(sum(1, 2, 3, 4, 5));
        // 可变参数也可以直接传一个数组
        int[] arr = {10, 20, 30};
        System.out.println(sum(arr));
    }
}`,
    expect: '0\n3\n15\n60',
    tip: '类似 TS 的 rest 参数 (...nums: number[])，但 Java 里它就是真的数组',
  },
  {
    id: 'ex-method-03',
    cat: 'method',
    title: '递归阶乘',
    desc: '递归三要素：终止条件、递归调用、返回值',
    className: 'Factorial',
    code: String.raw`public class Factorial {
    // 递归: 方法自己调用自己, 必须有终止条件否则栈溢出
    static long factorial(int n) {
        if (n <= 1) {
            return 1;
        }
        return n * factorial(n - 1);
    }
    public static void main(String[] args) {
        for (int i = 1; i <= 10; i++) {
            System.out.println(i + "! = " + factorial(i));
        }
    }
}`,
    expect: '1! = 1\n2! = 2\n3! = 6\n4! = 24\n5! = 120\n6! = 720\n7! = 5040\n8! = 40320\n9! = 362880\n10! = 3628800',
    tip: '用 long 而不是 int，因为 13! 就已经超出 int 范围（21 亿）',
  },
  {
    id: 'ex-method-04',
    cat: 'method',
    title: '递归斐波那契',
    desc: '经典递归斐波那契数列及其指数级耗时问题',
    className: 'Fibonacci',
    code: String.raw`public class Fibonacci {
    // 斐波那契: 第 n 项 = 前两项之和
    static int fib(int n) {
        if (n <= 2) {
            return 1;
        }
        return fib(n - 1) + fib(n - 2);
    }
    public static void main(String[] args) {
        // 输出前 10 项
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 10; i++) {
            if (i > 1) sb.append(" ");
            sb.append(fib(i));
        }
        System.out.println(sb);
        // 第 20 项
        System.out.println("第20项: " + fib(20));
    }
}`,
    expect: '1 1 2 3 5 8 13 21 34 55\n第20项: 6765',
    tip: '朴素递归会重复计算大量子问题（指数级），生产环境应加缓存或改循环',
  },
  {
    id: 'ex-method-05',
    cat: 'method',
    title: '枚举(enum)与switch',
    desc: '定义枚举、switch 分支处理与 values 遍历',
    className: 'EnumSwitch',
    code: String.raw`public class EnumSwitch {
    // 枚举: 一组固定的常量, 类型安全
    enum Level {
        LOW, MEDIUM, HIGH
    }
    // 枚举配合 switch 处理不同等级
    static String action(Level level) {
        switch (level) {
            case LOW:
                return "低负载: 全速运行";
            case MEDIUM:
                return "中负载: 正常运行";
            case HIGH:
                return "高负载: 降频保护";
            default:
                return "未知";
        }
    }
    public static void main(String[] args) {
        System.out.println(action(Level.LOW));
        System.out.println(action(Level.HIGH));
        // values() 遍历所有枚举值, ordinal() 是声明序号
        for (Level l : Level.values()) {
            System.out.println(l + " 序号:" + l.ordinal());
        }
    }
}`,
    expect: '低负载: 全速运行\n高负载: 降频保护\nLOW 序号:0\nMEDIUM 序号:1\nHIGH 序号:2',
  },
  {
    id: 'ex-method-06',
    cat: 'method',
    title: 'for/foreach 遍历',
    desc: '普通 for 拿下标、增强 for 拿元素、break 与 continue',
    className: 'LoopDemo',
    code: String.raw`public class LoopDemo {
    public static void main(String[] args) {
        int[] arr = {10, 20, 30, 40, 50};
        // 普通 for: 可以拿到下标
        for (int i = 0; i < arr.length; i++) {
            System.out.println("arr[" + i + "] = " + arr[i]);
        }
        System.out.println("---");
        // 增强 for(foreach): 只拿元素, 写法更简洁
        int sum = 0;
        for (int n : arr) {
            sum += n;
        }
        System.out.println("总和: " + sum);
        System.out.println("---");
        // continue 跳过本次, break 跳出整个循环
        for (int n : arr) {
            if (n == 20) continue;
            if (n == 40) break;
            System.out.println(n);
        }
    }
}`,
    expect: 'arr[0] = 10\narr[1] = 20\narr[2] = 30\narr[3] = 40\narr[4] = 50\n---\n总和: 150\n---\n10\n30',
  },

  /* ============================ shape 打印图形 × 4 ============================ */
  {
    id: 'ex-shape-01',
    cat: 'shape',
    title: '打印菱形',
    desc: '空格与星号的双重循环控制，上下对称输出',
    className: 'PrintDiamond',
    code: String.raw`public class PrintDiamond {
    public static void main(String[] args) {
        int n = 4; // 菱形的"半径"(上半个三角的行数)
        // 上半部分(含中间行): 空格递减, 星号 1,3,5,7
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n - i; j++) System.out.print(" ");
            for (int k = 1; k <= 2 * i - 1; k++) System.out.print("*");
            System.out.println();
        }
        // 下半部分: 与上半对称, 星号 5,3,1
        for (int i = n - 1; i >= 1; i--) {
            for (int j = 1; j <= n - i; j++) System.out.print(" ");
            for (int k = 1; k <= 2 * i - 1; k++) System.out.print("*");
            System.out.println();
        }
    }
}`,
    expect: '   *\n  ***\n *****\n*******\n *****\n  ***\n   *',
    tip: '关键公式：第 i 行星号数 = 2i-1，左侧空格数 = n-i',
  },
  {
    id: 'ex-shape-02',
    cat: 'shape',
    title: '九九乘法表',
    desc: '双层循环 + printf 格式化对齐输出乘法表',
    className: 'MultiplicationTable',
    code: String.raw`public class MultiplicationTable {
    public static void main(String[] args) {
        // 外层控制行, 内层控制列(列数不超过行数)
        for (int i = 1; i <= 9; i++) {
            for (int j = 1; j <= i; j++) {
                // %-3d 左对齐占 3 位, 保证等式对齐
                System.out.printf("%d*%d=%-3d", j, i, i * j);
            }
            System.out.println();
        }
    }
}`,
    expect: '1*1=1  \n1*2=2  2*2=4  \n1*3=3  2*3=6  3*3=9  \n1*4=4  2*4=8  3*4=12 4*4=16 \n1*5=5  2*5=10 3*5=15 4*5=20 5*5=25 \n1*6=6  2*6=12 3*6=18 4*6=24 5*6=30 6*6=36 \n1*7=7  2*7=14 3*7=21 4*7=28 5*7=35 6*7=42 7*7=49 \n1*8=8  2*8=16 3*8=24 4*8=32 5*8=40 6*8=48 7*8=56 8*8=64 \n1*9=9  2*9=18 3*9=27 4*9=36 5*9=45 6*9=54 7*9=63 8*9=72 9*9=81 ',
    tip: 'printf 不会自动换行，记得循环结束后补 println；%-3d 相当于 CSS 里的固定宽度',
  },
  {
    id: 'ex-shape-03',
    cat: 'shape',
    title: '打印三角形',
    desc: '直角三角形：星号递增与行号数字三角',
    className: 'PrintTriangle',
    code: String.raw`public class PrintTriangle {
    public static void main(String[] args) {
        int rows = 5;
        // 直角三角形: 每行星号数递增
        for (int i = 1; i <= rows; i++) {
            for (int j = 1; j <= i; j++) {
                System.out.print("*");
            }
            System.out.println();
        }
        System.out.println("---");
        // 数字三角: 每行重复打印行号
        for (int i = 1; i <= rows; i++) {
            for (int j = 1; j <= i; j++) {
                System.out.print(i);
            }
            System.out.println();
        }
    }
}`,
    expect: '*\n**\n***\n****\n*****\n---\n1\n22\n333\n4444\n55555',
  },
  {
    id: 'ex-shape-04',
    cat: 'shape',
    title: '打印倒三角',
    desc: '倒直角与倒等腰三角形：控制递减与空格前缀',
    className: 'PrintInverted',
    code: String.raw`public class PrintInverted {
    public static void main(String[] args) {
        int rows = 5;
        // 倒直角三角形: 星号递减
        for (int i = rows; i >= 1; i--) {
            for (int j = 1; j <= i; j++) {
                System.out.print("*");
            }
            System.out.println();
        }
        System.out.println("---");
        // 倒等腰三角形: 空格递增, 星号递减
        for (int i = rows; i >= 1; i--) {
            for (int j = 1; j <= rows - i; j++) System.out.print(" ");
            for (int k = 1; k <= 2 * i - 1; k++) System.out.print("*");
            System.out.println();
        }
    }
}`,
    expect: '*****\n****\n***\n**\n*\n---\n*********\n *******\n  *****\n   ***\n    *',
  },

  /* ============================ date 时间 × 3 ============================ */
  {
    id: 'ex-date-01',
    cat: 'date',
    title: '时间格式化(SimpleDateFormat)',
    desc: '用模式字符串把 Date 格式化成各种文本形式',
    className: 'DateFormat',
    code: String.raw`import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

public class DateFormat {
    public static void main(String[] args) {
        // 固定毫秒值保证输出可复现: 对应 2023-11-15 06:13:20 东八区
        Date date = new Date(1700000000000L);
        SimpleDateFormat f1 = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        // 显式指定东八区, 避免不同机器时区不同导致结果不一致
        f1.setTimeZone(TimeZone.getTimeZone("GMT+8"));
        System.out.println(f1.format(date));
        // y年 M月 d日 H时(24小时制) m分 s秒
        SimpleDateFormat f2 = new SimpleDateFormat("yyyy年MM月dd日 HH时mm分ss秒");
        f2.setTimeZone(TimeZone.getTimeZone("GMT+8"));
        System.out.println(f2.format(date));
        SimpleDateFormat f3 = new SimpleDateFormat("yyyy/MM/dd");
        f3.setTimeZone(TimeZone.getTimeZone("GMT+8"));
        System.out.println(f3.format(date));
    }
}`,
    expect: '2023-11-15 06:13:20\n2023年11月15日 06时13分20秒\n2023/11/15',
    tip: 'HH 是 24 小时制，hh 是 12 小时制；MM 月 mm 分，大小写千万别混',
  },
  {
    id: 'ex-date-02',
    cat: 'date',
    title: '获取年月日时分秒(Calendar)',
    desc: 'Calendar 逐字段取值，注意月份从 0 开始的坑',
    className: 'CalendarDemo',
    code: String.raw`import java.util.Calendar;

public class CalendarDemo {
    public static void main(String[] args) {
        // Calendar 是抽象类, 用 getInstance 获取实例
        Calendar cal = Calendar.getInstance();
        // 设置为固定时间保证输出可复现(月份从 0 开始, 9 表示 10 月)
        cal.set(2026, Calendar.OCTOBER, 1, 8, 30, 0);
        // get(字段) 逐个取出年月日时分秒
        System.out.println("年: " + cal.get(Calendar.YEAR));
        System.out.println("月: " + (cal.get(Calendar.MONTH) + 1)); // 月份从0开始要+1
        System.out.println("日: " + cal.get(Calendar.DAY_OF_MONTH));
        System.out.println("时: " + cal.get(Calendar.HOUR_OF_DAY));
        System.out.println("分: " + cal.get(Calendar.MINUTE));
        System.out.println("秒: " + cal.get(Calendar.SECOND));
        // 星期: 1=周日, 2=周一 ... 7=周六
        System.out.println("星期(数字): " + cal.get(Calendar.DAY_OF_WEEK));
    }
}`,
    expect: '年: 2026\n月: 10\n日: 1\n时: 8\n分: 30\n秒: 0\n星期(数字): 5',
    tip: 'Calendar.MONTH 从 0 开始是 Java 著名的坑；新代码建议用 java.time 包',
  },
  {
    id: 'ex-date-03',
    cat: 'date',
    title: '时间戳转日期',
    desc: '毫秒时间戳与 Date 对象互相转换',
    className: 'TimestampDemo',
    code: String.raw`import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

public class TimestampDemo {
    public static void main(String[] args) {
        // 毫秒时间戳(固定值, 保证输出可复现)
        long ts = 1700000000000L;
        // new Date(毫秒) 把时间戳转为日期对象
        Date date = new Date(ts);
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        sdf.setTimeZone(TimeZone.getTimeZone("GMT+8"));
        System.out.println(sdf.format(date));
        // getTime() 把日期转回毫秒时间戳
        System.out.println("转回时间戳: " + date.getTime());
        // 秒级时间戳 = 毫秒 / 1000
        System.out.println("秒级时间戳: " + ts / 1000);
    }
}`,
    expect: '2023-11-15 06:13:20\n转回时间戳: 1700000000000\n秒级时间戳: 1700000000',
    tip: 'Java 时间戳是毫秒（13 位），JS 的 Date.now() 也是毫秒，后端传秒级（10 位）时要换算',
  },

  /* ============================ exception 异常 × 4 ============================ */
  {
    id: 'ex-exception-01',
    cat: 'exception',
    title: 'try-catch-finally 执行顺序',
    desc: 'finally 总会执行，且在 return 之前',
    className: 'TryCatchFinally',
    code: String.raw`public class TryCatchFinally {
    // finally 在 return 之前执行
    static String test() {
        try {
            return "try返回";
        } finally {
            System.out.println("finally在return前执行");
        }
    }
    public static void main(String[] args) {
        System.out.println(test());
        System.out.println("---");
        try {
            int r = 10 / 0; // 抛出 ArithmeticException
            System.out.println("这行不会执行");
        } catch (ArithmeticException e) {
            System.out.println("捕获到异常");
        } finally {
            // finally 无论是否异常都会执行, 常用于释放资源
            System.out.println("finally 执行");
        }
        System.out.println("程序继续运行");
    }
}`,
    expect: 'finally在return前执行\ntry返回\n---\n捕获到异常\nfinally 执行\n程序继续运行',
    tip: 'finally 在 try/catch 的 return 之后、真正返回之前执行，比 TS 的 finally 语义相同',
  },
  {
    id: 'ex-exception-02',
    cat: 'exception',
    title: '多个 catch 捕获异常',
    desc: '多个 catch 按顺序匹配，命中一个就不再往下',
    className: 'MultiCatch',
    code: String.raw`public class MultiCatch {
    public static void main(String[] args) {
        // 多个 catch 从上到下匹配, 只执行第一个命中的
        try {
            int[] arr = new int[3];
            arr[5] = 1; // 数组越界
        } catch (ArithmeticException e) {
            System.out.println("算术异常: " + e.getMessage());
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("数组越界: " + e.getMessage());
        } catch (Exception e) {
            // 父类异常必须放最后, 否则编译报错
            System.out.println("其他异常");
        }
        System.out.println("---");
        try {
            String s = "abc";
            Integer.parseInt(s); // 数字格式化异常
        } catch (NumberFormatException e) {
            System.out.println("数字格式化: " + e.getMessage());
        }
    }
}`,
    expect: '数组越界: Index 5 out of bounds for length 3\n---\n数字格式化: For input string: "abc"',
    tip: 'catch 顺序必须从子类到父类，把 Exception 放最前面会编译失败',
  },
  {
    id: 'ex-exception-03',
    cat: 'exception',
    title: '自定义异常',
    desc: '继承 RuntimeException 定义业务异常并手动 throw',
    className: 'CustomException',
    code: String.raw`public class CustomException {
    static void checkAge(int age) {
        if (age < 0 || age > 150) {
            // 手动抛出自定义异常
            throw new AgeException("年龄不合法: " + age);
        }
        System.out.println("年龄合法: " + age);
    }
    public static void main(String[] args) {
        checkAge(20);
        try {
            checkAge(-5);
        } catch (AgeException e) {
            System.out.println("捕获异常: " + e.getMessage());
        }
    }
}

// 自定义异常: 继承 RuntimeException 成为运行时异常(非受检)
class AgeException extends RuntimeException {
    public AgeException(String message) {
        super(message);
    }
}`,
    expect: '年龄合法: 20\n捕获异常: 年龄不合法: -5',
    tip: '继承 Exception 是受检异常（调用方必须处理），继承 RuntimeException 则不强制',
  },
  {
    id: 'ex-exception-04',
    cat: 'exception',
    title: '打印堆栈信息',
    desc: 'getMessage、toString 与 getStackTrace 栈帧，三种排查手段',
    className: 'StackTraceDemo',
    code: String.raw`public class StackTraceDemo {
    public static void main(String[] args) {
        try {
            int r = 10 / 0;
        } catch (ArithmeticException e) {
            // getMessage 只拿异常信息
            System.out.println("getMessage: " + e.getMessage());
            // toString 拿 异常类名: 信息
            System.out.println("toString: " + e.toString());
            // getStackTrace 返回栈帧数组, 第 0 帧就是异常发生的那一行
            System.out.println("异常发生处: " + e.getStackTrace()[0]);
        }
        System.out.println("程序没有崩溃, 继续执行");
    }
}`,
    expect: 'getMessage: / by zero\ntoString: java.lang.ArithmeticException: / by zero\n异常发生处: StackTraceDemo.main(StackTraceDemo.java:4)\n程序没有崩溃, 继续执行',
    tip: 'printStackTrace() 会把完整堆栈打到错误流(stderr)，排查问题时最常用；本例用 getStackTrace 拿到可精确输出的栈帧',
  },

  /* ============================ ds 数据结构 × 5 ============================ */
  {
    id: 'ex-ds-01',
    cat: 'ds',
    title: '数字求和',
    desc: 'for 循环、Stream.sum、reduce 三种求和姿势',
    className: 'ArraySum',
    code: String.raw`import java.util.Arrays;

public class ArraySum {
    public static void main(String[] args) {
        int[] nums = {1, 2, 3, 4, 5};
        // 方法一: for 循环累加
        int sum1 = 0;
        for (int n : nums) {
            sum1 += n;
        }
        System.out.println("for 循环求和: " + sum1);
        // 方法二: Stream 流式求和
        int sum2 = Arrays.stream(nums).sum();
        System.out.println("Stream 求和: " + sum2);
        // 方法三: reduce 归约
        int sum3 = Arrays.stream(nums).reduce(0, Integer::sum);
        System.out.println("reduce 求和: " + sum3);
    }
}`,
    expect: 'for 循环求和: 15\nStream 求和: 15\nreduce 求和: 15',
    tip: 'reduce(0, Integer::sum) 类似 JS 的 reduce((a, b) => a + b, 0)',
  },
  {
    id: 'ex-ds-02',
    cat: 'ds',
    title: '栈(Stack)的实现',
    desc: 'push/peek/pop/empty 体会后进先出 LIFO',
    className: 'StackDemo',
    code: String.raw`import java.util.Stack;

public class StackDemo {
    public static void main(String[] args) {
        // 栈: 后进先出 LIFO
        Stack<String> stack = new Stack<>();
        // push 入栈
        stack.push("第1个");
        stack.push("第2个");
        stack.push("第3个");
        System.out.println("栈内容: " + stack);
        // peek 查看栈顶但不移除
        System.out.println("栈顶元素: " + stack.peek());
        // pop 出栈(后进先出)
        System.out.println("出栈: " + stack.pop());
        System.out.println("出栈: " + stack.pop());
        System.out.println("栈剩余: " + stack);
        // empty 判断是否为空
        System.out.println("是否为空: " + stack.empty());
        stack.pop();
        System.out.println("再出栈后是否为空: " + stack.empty());
    }
}`,
    expect: '栈内容: [第1个, 第2个, 第3个]\n栈顶元素: 第3个\n出栈: 第3个\n出栈: 第2个\n栈剩余: [第1个]\n是否为空: false\n再出栈后是否为空: true',
    tip: 'Stack 继承自古老的 Vector 类，新代码推荐用 ArrayDeque 当栈用（见双端队列示例）',
  },
  {
    id: 'ex-ds-03',
    cat: 'ds',
    title: '队列(Queue)的使用',
    desc: 'offer/poll/peek 体会先进先出 FIFO',
    className: 'QueueDemo',
    code: String.raw`import java.util.LinkedList;
import java.util.Queue;

public class QueueDemo {
    public static void main(String[] args) {
        // Queue 是接口, 常用 LinkedList 实现
        Queue<String> queue = new LinkedList<>();
        // offer 入队
        queue.offer("任务1");
        queue.offer("任务2");
        queue.offer("任务3");
        System.out.println("队列: " + queue);
        // peek 查看队头不移除
        System.out.println("队头: " + queue.peek());
        // poll 出队(先进先出)
        System.out.println("出队: " + queue.poll());
        System.out.println("出队: " + queue.poll());
        System.out.println("剩余: " + queue);
        System.out.println("大小: " + queue.size());
    }
}`,
    expect: '队列: [任务1, 任务2, 任务3]\n队头: 任务1\n出队: 任务1\n出队: 任务2\n剩余: [任务3]\n大小: 1',
    tip: 'offer/poll 失败返回 false/null，add/remove 失败直接抛异常，业务代码建议用前者',
  },
  {
    id: 'ex-ds-04',
    cat: 'ds',
    title: '链表(LinkedList)增删查',
    desc: '头尾高效插入删除、按内容查找与删除',
    className: 'LinkedListDemo',
    code: String.raw`import java.util.LinkedList;

public class LinkedListDemo {
    public static void main(String[] args) {
        // LinkedList 既是 List 也是双端队列, 头尾操作高效
        LinkedList<String> list = new LinkedList<>();
        // 尾部添加
        list.add("B");
        list.add("C");
        // 头部添加
        list.addFirst("A");
        list.addLast("D");
        System.out.println("链表: " + list);
        // 查找
        System.out.println("C的下标: " + list.indexOf("C"));
        System.out.println("是否包含D: " + list.contains("D"));
        // 删除
        list.removeFirst();
        list.remove("C");
        System.out.println("删除后: " + list);
        System.out.println("首个元素: " + list.getFirst());
    }
}`,
    expect: '链表: [A, B, C, D]\nC的下标: 2\n是否包含D: true\n删除后: [B, D]\n首个元素: B',
  },
  {
    id: 'ex-ds-05',
    cat: 'ds',
    title: '双端队列(ArrayDeque)',
    desc: 'ArrayDeque 一举三用：双端队列、栈、队列',
    className: 'ArrayDequeDemo',
    code: String.raw`import java.util.ArrayDeque;
import java.util.Deque;

public class ArrayDequeDemo {
    public static void main(String[] args) {
        // Deque 双端队列: 两头都能进出
        Deque<String> deque = new ArrayDeque<>();
        deque.addLast("B");
        deque.addFirst("A");
        deque.addLast("C");
        System.out.println("双端队列: " + deque);
        System.out.println("从头部取: " + deque.removeFirst());
        System.out.println("从尾部取: " + deque.removeLast());
        System.out.println("---");
        // ArrayDeque 当栈用(官方推荐, 比 Stack 类更快)
        Deque<String> stack = new ArrayDeque<>();
        stack.push("x");
        stack.push("y");
        stack.push("z");
        System.out.println("栈顶: " + stack.peek());
        System.out.println("出栈: " + stack.pop());
        System.out.println("出栈: " + stack.pop());
        System.out.println("---");
        // ArrayDeque 当队列用
        Deque<String> queue = new ArrayDeque<>();
        queue.offer("m1");
        queue.offer("m2");
        System.out.println("出队: " + queue.poll());
        System.out.println("出队: " + queue.poll());
    }
}`,
    expect: '双端队列: [A, B, C]\n从头部取: A\n从尾部取: C\n---\n栈顶: z\n出栈: z\n出栈: y\n---\n出队: m1\n出队: m2',
    tip: '算法题里手写栈/队列，直接 new ArrayDeque<>() 一_classes搞定，性能也好',
  },

  /* ============================ collection 集合 × 6 ============================ */
  {
    id: 'ex-collection-01',
    cat: 'collection',
    title: '数组转集合(asList)',
    desc: 'Arrays.asList 是定长视图，增删会抛异常',
    className: 'ArraysAsList',
    code: String.raw`import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ArraysAsList {
    public static void main(String[] args) {
        String[] arr = {"a", "b", "c"};
        // asList 返回定长视图: 不能增删, 但可以修改元素(会写回原数组)
        List<String> list = Arrays.asList(arr);
        list.set(0, "x");
        System.out.println(list);
        // 增删操作会抛 UnsupportedOperationException
        try {
            list.add("d");
        } catch (UnsupportedOperationException e) {
            System.out.println("add 不被支持");
        }
        // 想要可增删的集合, 用 new ArrayList 包一层
        List<String> mutable = new ArrayList<>(Arrays.asList(arr));
        mutable.add("d");
        System.out.println(mutable);
    }
}`,
    expect: '[x, b, c]\nadd 不被支持\n[x, b, c, d]',
    tip: 'asList 的坑：它是原数组的视图，set 改的是原数组；add/remove 直接抛异常',
  },
  {
    id: 'ex-collection-02',
    cat: 'collection',
    title: 'HashMap 遍历',
    desc: 'entrySet 与 forEach 两种遍历，getOrDefault 兜底',
    className: 'HashMapIterate',
    code: String.raw`import java.util.HashMap;
import java.util.Map;

public class HashMapIterate {
    public static void main(String[] args) {
        Map<String, Integer> map = new HashMap<>();
        map.put("苹果", 3);
        map.put("香蕉", 5);
        map.put("橘子", 2);
        // 方式一: entrySet 同时拿键和值(推荐)
        for (Map.Entry<String, Integer> entry : map.entrySet()) {
            System.out.println(entry.getKey() + " 有 " + entry.getValue() + " 个");
        }
        System.out.println("---");
        // 方式二: forEach + Lambda(JDK8+)
        map.forEach((k, v) -> System.out.println(k + "=" + v));
        // get 不存在返回 null, getOrDefault 可给默认值
        System.out.println("苹果: " + map.get("苹果"));
        System.out.println("葡萄: " + map.getOrDefault("葡萄", 0));
    }
}`,
    expect: '苹果 有 3 个\n香蕉 有 5 个\n橘子 有 2 个\n---\n苹果=3\n香蕉=5\n橘子=2\n苹果: 3\n葡萄: 0',
    tip: 'HashMap 不保证遍历顺序与插入顺序一致；需要保序用 LinkedHashMap，需要排序用 TreeMap',
  },
  {
    id: 'ex-collection-03',
    cat: 'collection',
    title: '迭代器遍历与安全删除',
    desc: '遍历中删元素必须 it.remove 或 removeIf',
    className: 'IteratorRemove',
    code: String.raw`import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class IteratorRemove {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("a");
        list.add("b");
        list.add("b");
        list.add("c");
        System.out.println("原列表: " + list);
        // 迭代器遍历中删除元素必须用 it.remove()
        // 直接 list.remove 会抛 ConcurrentModificationException
        Iterator<String> it = list.iterator();
        while (it.hasNext()) {
            if (it.next().equals("b")) {
                it.remove(); // 安全删除
            }
        }
        System.out.println("删除b后: " + list);
        // removeIf 是更简洁的安全删除方式(JDK8+)
        List<Integer> nums = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
        nums.removeIf(n -> n % 2 == 0);
        System.out.println("删除偶数后: " + nums);
    }
}`,
    expect: '原列表: [a, b, b, c]\n删除b后: [a, c]\n删除偶数后: [1, 3, 5]',
    tip: '增强 for 里直接调 list.remove 会抛 ConcurrentModificationException，这是高频面试题',
  },
  {
    id: 'ex-collection-04',
    cat: 'collection',
    title: '集合排序(Comparator)',
    desc: '自然排序、reverseOrder 降序与组合比较器',
    className: 'ListSort',
    code: String.raw`import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class ListSort {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<>(List.of(5, 1, 4, 2, 3));
        // 自然排序(升序)
        nums.sort(Comparator.naturalOrder());
        System.out.println("升序: " + nums);
        // reverseOrder 降序
        nums.sort(Comparator.reverseOrder());
        System.out.println("降序: " + nums);
        // 组合比较器: 先按长度, 长度相同再按字典序
        List<String> names = new ArrayList<>(List.of("Spike", "Tom", "Jerry"));
        names.sort(Comparator.comparing(String::length).thenComparing(String::compareTo));
        System.out.println("按长度排序: " + names);
    }
}`,
    expect: '升序: [1, 2, 3, 4, 5]\n降序: [5, 4, 3, 2, 1]\n按长度排序: [Tom, Jerry, Spike]',
    tip: 'Comparator.comparing(...).thenComparing(...) 相当于 lodash 的 sortBy 多级排序',
  },
  {
    id: 'ex-collection-05',
    cat: 'collection',
    title: 'HashSet 去重',
    desc: 'Set 天然去重 + LinkedHashSet 保持顺序',
    className: 'HashSetDemo',
    code: String.raw`import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class HashSetDemo {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(List.of("java", "go", "java", "rust", "go"));
        System.out.println("原列表: " + list);
        // HashSet 自动去重, 但不保证顺序
        Set<String> set = new HashSet<>(list);
        System.out.println("去重后个数: " + set.size());
        // add 返回 false 表示元素已存在
        System.out.println("添加重复元素: " + set.add("java"));
        System.out.println("添加新元素: " + set.add("kotlin"));
        // 要保持插入顺序的去重, 用 LinkedHashSet
        Set<String> linked = new LinkedHashSet<>(list);
        System.out.println("保序去重: " + linked);
    }
}`,
    expect: '原列表: [java, go, java, rust, go]\n去重后个数: 3\n添加重复元素: false\n添加新元素: true\n保序去重: [java, go, rust]',
  },
  {
    id: 'ex-collection-06',
    cat: 'collection',
    title: 'List 截取与替换(subList/set)',
    desc: 'subList 含头不含尾且是视图，set 返回旧值',
    className: 'SubListDemo',
    code: String.raw`import java.util.ArrayList;
import java.util.List;

public class SubListDemo {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(List.of("a", "b", "c", "d", "e"));
        // subList(起始下标, 结束下标): 含头不含尾, 类似数组切片
        List<String> sub = list.subList(1, 4);
        System.out.println("截取1~3: " + sub);
        // set(下标, 新值) 替换元素, 返回旧值
        String old = list.set(0, "z");
        System.out.println("旧值: " + old);
        System.out.println("替换后: " + list);
        // subList 是视图: 修改视图会同步影响原列表
        sub.set(0, "B");
        System.out.println("通过子视图修改后原列表: " + list);
    }
}`,
    expect: '截取1~3: [b, c, d]\n旧值: a\n替换后: [z, b, c, d, e]\n通过子视图修改后原列表: [z, B, c, d, e]',
    tip: 'subList 返回的是原列表的视图而非拷贝，改子列表原列表也变，这和 JS 的 slice 完全不同',
  },

  /* ============================ thread 多线程 × 4 ============================ */
  {
    id: 'ex-thread-01',
    cat: 'thread',
    title: '继承 Thread 创建线程',
    desc: '继承 Thread 重写 run，start 开线程，join 等结束',
    className: 'ThreadExtends',
    code: String.raw`public class ThreadExtends {
    // 继承 Thread 并重写 run 方法
    static class MyThread extends Thread {
        private final String name;
        MyThread(String name) {
            this.name = name;
        }
        @Override
        public void run() {
            for (int i = 1; i <= 3; i++) {
                System.out.println(name + " 执行第 " + i + " 次");
            }
        }
    }
    public static void main(String[] args) throws InterruptedException {
        // start 才会开新线程, 直接调 run 只是普通方法调用
        MyThread t = new MyThread("线程A");
        t.start();
        t.join(); // 等线程 A 结束, 保证输出顺序可预测
        MyThread t2 = new MyThread("线程B");
        t2.start();
        t2.join();
        System.out.println("两个线程都执行完毕");
    }
}`,
    expect: '线程A 执行第 1 次\n线程A 执行第 2 次\n线程A 执行第 3 次\n线程B 执行第 1 次\n线程B 执行第 2 次\n线程B 执行第 3 次\n两个线程都执行完毕',
    tip: 'start() 与 run() 的区别是经典面试题：start 开新线程，直接调 run 是当前线程里的普通方法',
  },
  {
    id: 'ex-thread-02',
    cat: 'thread',
    title: '实现 Runnable 创建线程',
    desc: 'Runnable 只描述任务，交给 Thread 执行，可用 Lambda',
    className: 'RunnableImpl',
    code: String.raw`public class RunnableImpl {
    // 实现 Runnable 接口, 避免单继承限制(推荐方式)
    static class Task implements Runnable {
        private final String name;
        Task(String name) {
            this.name = name;
        }
        @Override
        public void run() {
            for (int i = 1; i <= 2; i++) {
                System.out.println(name + " 运行 " + i);
            }
        }
    }
    public static void main(String[] args) throws InterruptedException {
        // Runnable 只是任务, 还需要交给 Thread 执行
        Thread t1 = new Thread(new Task("任务1"));
        // JDK8 后可用 Lambda 简化(函数式接口)
        Thread t2 = new Thread(() -> System.out.println("Lambda 任务执行"));
        t1.start();
        t1.join();
        t2.start();
        t2.join();
        System.out.println("全部完成");
    }
}`,
    expect: '任务1 运行 1\n任务1 运行 2\nLambda 任务执行\n全部完成',
    tip: '实现 Runnable 比继承 Thread 更灵活：任务与执行解耦，还能交给线程池',
  },
  {
    id: 'ex-thread-03',
    cat: 'thread',
    title: 'sleep 与 join 控制顺序',
    desc: 'sleep 让线程暂停，join 让主线程等待子线程',
    className: 'SleepJoin',
    code: String.raw`public class SleepJoin {
    public static void main(String[] args) throws InterruptedException {
        Thread worker = new Thread(() -> {
            try {
                // sleep 让当前线程暂停指定毫秒
                Thread.sleep(100);
                System.out.println("工作线程睡醒了");
            } catch (InterruptedException e) {
                System.out.println("被中断");
            }
        });
        worker.start();
        // 主线程不等待, 继续干自己的活
        System.out.println("主线程不等待, 继续干活");
        // join 阻塞等待 worker 执行完才继续
        worker.join();
        System.out.println("主线程等待到工作线程结束后继续");
    }
}`,
    expect: '主线程不等待, 继续干活\n工作线程睡醒了\n主线程等待到工作线程结束后继续',
    tip: 'sleep 是 Thread 的静态方法，让「当前线程」暂停；join 则是等「目标线程」结束',
  },
  {
    id: 'ex-thread-04',
    cat: 'thread',
    title: 'interrupt 中断线程',
    desc: 'interrupt 设标志位，isInterrupted 轮询优雅退出',
    className: 'InterruptDemo',
    code: String.raw`public class InterruptDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread worker = new Thread(() -> {
            // isInterrupted 检查中断标志位, 收到信号就优雅退出
            while (!Thread.currentThread().isInterrupted()) {
                // 忙循环模拟工作
            }
            System.out.println("工作线程检测到中断信号");
        });
        worker.start();
        Thread.sleep(50); // 让 worker 先运行一会儿
        worker.interrupt(); // 发出中断信号, 只是设置标志位并不强制杀线程
        worker.join();
        System.out.println("主线程结束");
    }
}`,
    expect: '工作线程检测到中断信号\n主线程结束',
    tip: 'Java 的 interrupt 不是强杀，只是打个标志；线程自己决定何时以及如何响应中断',
  },
]
