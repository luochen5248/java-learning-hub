import type { RawModule } from '../types/course'

/**
 * m04 · Spring Boot 起步 —— 课程数据
 *
 * 基线：JDK 17 + Spring Boot 3.2.x（Maven 构建），Windows 视角。
 * 版本红线：Boot 3 全面使用 jakarta.*（禁止 javax.*），配置前缀以 spring.data.* 等新写法为准。
 * 从本模块起，每课都为贯穿项目「待办清单 API」添砖加瓦。
 */

// YAML 的 ${...} 占位符写在 JS 模板字符串里会被当成插值，用这个常量拼接输出
const DOLLAR = '$';

export const module: RawModule = {
  id: 'm04',
  order: 4,
  title: 'Spring Boot 起步',
  subtitle: 'IoC/DI 与第一个 Web 接口',
  phase: 'phase2',
  phaseName: '阶段二 · 写出后端',
  icon: '🍃',
  cover: 'assets/img/m04-springboot.jpg',
  minutes: 120,
  summary:
    'Spring Boot 不是新框架，而是「帮你把 Spring 该怎么配置都配好了」的工具集——正如 Vite 之于 webpack。先用一课把 IoC/DI 的直觉打通，再用两课写出可 curl 通的待办清单接口，最后一课把配置从代码里搬到 application.yml。做完本模块，你手上就有一个能跑起来的后端服务。',

  /* ---------------- 闪卡 10 张 ---------------- */
  flashcards: [
    { front: '把类交给 Spring 容器管理用什么注解？', back: '@Component；@Service / @Repository / @Controller 都是它的特化', tag: '注解' },
    { front: '启动类上的核心注解是哪个？', back: '@SpringBootApplication = 配置类 + 自动装配 + 组件扫描', tag: '注解' },
    { front: '两个 Controller 注解的区别？', back: '@RestController 返回 JSON；@Controller 返回视图名，用错会 404', tag: '注解' },
    { front: '@Autowired 推荐哪种注入方式？', back: '构造器注入。字段注入不推荐，IDEA 会黄条提示', tag: '注解' },
    { front: '路径参数与查询参数的注解区别？', back: '@PathVariable 取路径段 /todos/1，@RequestParam 取 ?completed=0', tag: '路由' },
    { front: '不加 @RequestBody 会怎样？', back: '拿不到请求体里的 JSON，接口报 415 Unsupported Media Type', tag: '坑点' },
    { front: 'Spring Boot 默认端口是多少？', back: '8080，在 application.yml 里用 server.port 修改', tag: '配置' },
    { front: '端口被占用的 Windows 排查命令？', back: 'netstat -ano | findstr :8080 拿 PID，再 taskkill /PID 进程号 /F', tag: '坑点' },
    { front: 'Boot 3 的包名与 Boot 2 有何不同？', back: '全面迁到 jakarta.*，不再是 javax.*；Redis 前缀改为 spring.data.redis.*', tag: '配置' },
    { front: '激活多环境配置的两种方式？', back: '配置里写 spring.profiles.active，或启动加同名参数', tag: '配置' },
  ],

  lessons: [
    /* ============================ L01 ============================ */
    {
      id: 'm04-l01',
      title: 'IoC / DI 直觉理解',
      minutes: 30,
      goal: '用前端视角理解「对象由容器创建并注入」这件事，能说出 @Autowired 到底替你做了什么，并知道控制器必须放在哪个包里才会被扫到。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>现在这一刻，是贯穿项目「待办清单 API」的<strong>第 0 步</strong>：先把 Spring Boot 项目建起来，让它能启动、能响应 HTTP 请求。数据先用内存 List 顶着，数据库在 m05、m06 再接。</p>
<p>这一课要理解的概念只有一个：<strong>IoC（控制反转）与 DI（依赖注入）</strong>。它是 Spring 的一切的地基，也是「照着教程跑通却不知道发生了什么」的根源。</p>`,
        },
        {
          type: 'tip',
          html: String.raw`<p><strong>为什么本课程直接上 Spring Boot，而不是先学 Servlet / SpringMVC？</strong></p>
<p>常见的 Java 学习路线是「先 Servlet → 再 SpringMVC → 再 Spring → 最后 Spring Boot」，理由是先打基础。这条路线对<strong>零基础</strong>的人是对的；但你已经有多年 Web 开发经验，HTTP、REST、分层、请求响应这些心智全都有了，缺的只是「Java 这一侧怎么落地」。</p>
<p>所以本课程取<strong>项目驱动</strong>路线：先跑通一条完整链路（建项目 → 出接口 → curl 通），再回头补原理。Servlet、Tomcat、AOP 这些我们会在需要时用一节说明，<strong>但不作为学习前置</strong>。这不是偷懒，是把时间花在刀刃上。</p>`,
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>用你熟悉的东西类比：</strong></p>
<ul><li><strong>手动 new 一个 Service</strong> ≈ 在组件里 <code>import</code> 一个工具模块并自己初始化——依赖关系写死在代码里。</li>
<li><strong>@Autowired 让容器注入</strong> ≈ Vue 的 <code>provide / inject</code>、或 Pinia 的自动注入：<strong>你只声明「我要什么」，框架负责给你</strong>。</li>
<li><strong>IoC（控制反转）</strong>：反转的是<strong>创建对象的控制权</strong>。传统写法里控制权在业务代码手上（我 new 我自己管），IoC 之后控制权交给了 Spring 容器。</li>
<li><strong>DI（依赖注入）</strong>：IoC 的具体实现手段——容器「注入」依赖给你。</li></ul>
<p>再补一个更贴的类比：<code>@Autowired</code> 像 <strong>Vite 的自动导入 + 依赖预构建</strong>——你写 <code>import</code> 就行，不用自己管它从哪来、版本对不对；Spring 容器就是那个「什么都能给你准备好」的角色。</p>`,
        },
        {
          type: 'compare',
          title: '手动依赖 ↔ 容器注入（前后端对照）',
          head: ['前端 / 传统 Java', 'Spring 写法', '差异'],
          rows: [
            ['import { api } from "./api"', 'import com.example.demo.TodoApiApplication;', '包名全写全，不靠目录自动解析'],
            ['const svc = new TodoService(api)', '@Autowired TodoService todoService;（字段注入）', '不用自己 new'],
            ['组件里写死具体实现', '@Autowired TodoService（面向接口注入）', '依赖的是抽象，换实现不改调用方'],
            ['main() 里手动 new 一切', 'Spring 容器扫描 + 实例化 + 注入', '反转了控制权'],
            ['Vite 依赖预构建', 'spring-boot-starter 自动装配', '都不是替代品，而是帮你把准备步骤做完'],
          ],
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TodoService.java（业务类，加 @Service 交给容器）',
          code: String.raw`package com.example.demo.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

// @Service：把类交给 Spring 容器管理（本质是 @Component 的语义化特化）
@Service
public class TodoService {

    // 暂时用内存 List 顶着，后面 m06 会换成真实数据库
    private final List<String> store = new ArrayList<>();

    public List<String> findAll() {
        return store;
    }

    public String create(String title) {
        store.add(title);
        return title;
    }
}`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'TodoController.java（两种注入写法对比）',
          code: String.raw`package com.example.demo.controller;

import com.example.demo.service.TodoService;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TodoController {

    // 写法一（字段注入）：能跑，但不推荐
    // @Autowired
    // private TodoService todoService;

    // 写法二（构造器注入）：官方推荐，字段可声明为 final
    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    public List<String> list() {
        return todoService.findAll();
    }
}`,
        },
        {
          type: 'diagram',
          caption: 'IoC 容器：对象不是你 new 的，是容器创建并塞给你的',
          svg: String.raw`<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m04-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="12" fill="#0F1B2D"/>
  <text x="340" y="38" text-anchor="middle" font-size="17" fill="#E2E8F0">Spring IoC 容器做了什么</text>

  <g>
    <rect x="24" y="66" width="146" height="84" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
    <text x="97" y="96" text-anchor="middle" font-size="13" fill="#E2E8F0">启动类运行</text>
    <text x="97" y="118" text-anchor="middle" font-size="12" fill="#94A3B8">@SpringBootApplication</text>
    <text x="97" y="138" text-anchor="middle" font-size="11" fill="#22D3EE">触发组件扫描</text>
  </g>
  <line x1="172" y1="108" x2="186" y2="108" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m04-a)"/>

  <g>
    <rect x="190" y="66" width="146" height="84" rx="10" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.6"/>
    <text x="263" y="96" text-anchor="middle" font-size="13" fill="#E2E8F0">扫描包路径</text>
    <text x="263" y="118" text-anchor="middle" font-size="12" fill="#94A3B8">找 @Component 等注解</text>
    <text x="263" y="138" text-anchor="middle" font-size="11" fill="#22D3EE">登记成 Bean 定义</text>
  </g>
  <line x1="338" y1="108" x2="352" y2="108" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m04-a)"/>

  <g>
    <rect x="356" y="66" width="146" height="84" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.6"/>
    <text x="429" y="96" text-anchor="middle" font-size="13" fill="#E2E8F0">实例化对象</text>
    <text x="429" y="118" text-anchor="middle" font-size="12" fill="#94A3B8">new TodoService()</text>
    <text x="429" y="138" text-anchor="middle" font-size="11" fill="#F59E0B">这一步以前是你写的</text>
  </g>
  <line x1="504" y1="108" x2="518" y2="108" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m04-a)"/>

  <g>
    <rect x="522" y="66" width="134" height="84" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.6"/>
    <text x="589" y="96" text-anchor="middle" font-size="13" fill="#E2E8F0">注入到字段</text>
    <text x="589" y="118" text-anchor="middle" font-size="12" fill="#94A3B8">构造器传入</text>
    <text x="589" y="138" text-anchor="middle" font-size="11" fill="#10B981">你只声明「我要什么」</text>
  </g>

  <path d="M589 152 L589 178 L340 178 L340 200" stroke="#64B5F6" stroke-width="1.6" fill="none" marker-end="url(#arr-m04-a)"/>

  <g>
    <rect x="120" y="206" width="440" height="88" rx="10" fill="#16233A" stroke="#3B82F6" stroke-width="1.4"/>
    <text x="340" y="232" text-anchor="middle" font-size="13" fill="#22D3EE">容器的 Bean 登记表（相当于一张「谁需要什么」的名册）</text>
    <text x="340" y="258" text-anchor="middle" font-size="12" fill="#94A3B8">todoService  ← 被 todoController 需要</text>
    <text x="340" y="280" text-anchor="middle" font-size="12" fill="#94A3B8">todoController  ← 被 Tomcat 调用</text>
  </g>

  <rect x="80" y="308" width="520" height="42" rx="8" fill="#16233A" stroke="#22D3EE" stroke-width="1.2"/>
  <text x="340" y="334" text-anchor="middle" font-size="12" fill="#E2E8F0">反转的是控制权：new 的权力从业务代码转移给了容器</text>
</svg>`,
        },
        {
          type: 'table',
          title: '四个「交给容器管理」的注解',
          head: ['注解', '语义', '通常加在哪'],
          rows: [
            ['@Component', '通用：把类注册成 Bean', '工具类、通用组件'],
            ['@Service', '业务层', 'TodoService、UserService'],
            ['@Repository', '数据访问层', 'Mapper / DAO 类（Boot 会做异常转换）'],
            ['@Controller', 'Web 层（返回视图）', '返回页面 HTML 的控制器'],
            ['@RestController', 'Web 层（返回 JSON）', '接口控制器，本课程主力'],
          ],
        },
        {
          type: 'steps',
          title: '用 Spring Initializr 建项目（最快路径）',
          items: [
            String.raw`浏览器打开 <code>https://start.spring.io</code>（Spring 官方项目生成器）。`,
            String.raw`Project 选 <strong>Maven</strong>，Language 选 <strong>Java</strong>。`,
            String.raw`Spring Boot 版本选 <strong>3.2.x</strong>（如 3.2.5）；JDK 选 <strong>17</strong>。注意：Boot 3.x 要求 JDK 17+，Boot 2.x 才支持 JDK 8/11，两者不能混。`,
            String.raw`Group 填 <code>com.example</code>，Artifact 填 <code>todo-api</code>。`,
            String.raw`Dependencies 搜并勾选 <strong>Spring Web</strong>（生成 <code>spring-boot-starter-web</code> 依赖），需要数据库时再加 Spring Data JPA 等。`,
            String.raw`点 Generate → 下载 <code>todo-api.zip</code>，解压后用 IDEA 的「Open」打开（有 pom.xml 的那一层）。`,
            String.raw`IDEA 右下角会提示 Trust Project 与导入依赖，点同意，等 Maven 面板刷新完再运行。`,
          ],
        },
        {
          type: 'code',
          lang: 'java',
          filename: '启动类（自动生成，别删 main 方法）',
          code: String.raw`package com.example.todoapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// @SpringBootApplication = @SpringBootConfiguration
//                        + @EnableAutoConfiguration（自动装配，内嵌 Tomcat 等）
//                        + @ComponentScan（扫描本包及子包里的 Bean）
@SpringBootApplication
public class TodoApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(TodoApiApplication.class, args);
    }
}`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑 1（Spring Boot 3 头号坑）：包扫描。</strong><code>@ComponentScan</code> 只扫描<strong>启动类所在的包及其所有子包</strong>。如果启动类在 <code>com.example.todoapi</code>，而你的 Controller 写成了 <code>com.example.controller</code>（不在其子包下），那么<strong>接口会 404，而且日志里一条报错都没有</strong>。解决办法：把包名改成 <code>com.example.todoapi.controller</code>，或者在启动类上写 <code>@SpringBootApplication(scanBasePackages = "com.example")</code>。</p>
<p><strong>坑 2：不要用字段注入 <code>@Autowired</code>。</strong>字段为 null 时报错发生在方法调用那一刻，排查困难；而且单元测试没法直接 new 出对象。IDEA 会在字段上标黄提示「Field injection is not recommended」，请改用 <strong>构造器注入 + final 字段</strong>。</p>
<p><strong>坑 3：@Autowired 报 NoSuchBeanDefinitionException。</strong>说明容器压根没扫到这个类。先检查包路径（坑 1），再检查类上是否漏了 <code>@Service</code> / <code>@Component</code>。</p>
<p><strong>坑 4：接口有多个实现时注入报错。</strong>有两个实现类时按类型注入会歧义，需要 <code>@Primary</code> 指定默认，或用 <code>@Qualifier("beanName")</code> 指定。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>用 Spring Initializr 建出 <code>todo-api</code> 项目（Maven + Java 17 + Boot 3.2.x + Spring Web）。</li>
<li>能用自己的话说出：@Autowired 替你做了「new 对象 + 塞进字段」两件事。</li>
<li>知道 Controller 必须放在启动类所在包的子包下，否则 404 且无日志。</li>
<li>能列出 @Service / @Repository / @Component / @RestController 各自的语义位置。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: '@Autowired 注入时，Spring 容器实际替你做了哪两件事？',
          options: [
            '只做类型检查，不创建对象',
            '创建（或从容器取出）对象实例，并把它赋给你的字段',
            '把你的类编译成字节码',
            '自动生成数据库表',
          ],
          answer: 1,
          explain:
            '@Autowired 的本质是：容器从 Bean 登记表里按类型找到（或创建）实例，再通过反射把它注入到你的字段上。传统写法里这两件事都是你自己 new 出来的。',
        },
        {
          q: '启动类在 com.example.todoapi，Controller 写成了 com.example.controller，接口请求返回 404 且日志无异常，最可能的原因是？',
          options: [
            '缺少 @RequestMapping 注解',
            'Controller 不在启动类所在包及其子包下，未被组件扫描到',
            '端口被占用',
            'JDK 版本不对',
          ],
          answer: 1,
          explain:
            '@ComponentScan 默认只扫描启动类所在包及子包。类没被扫到就不会注册成 Bean，控制器不存在，自然 404，而且不会有任何错误日志。',
        },
        {
          q: '把一个业务类交给 Spring 容器管理，最语义化的注解是？',
          options: ['@Component', '@Service', '@Repository', '@RestController'],
          answer: 1,
          explain:
            '@Service 是专门给业务层的语义化注解，功能上等价于 @Component。同理 @Repository 标数据访问层、@Controller / @RestController 标 Web 层。',
        },
      ],
    },

    /* ============================ L02 ============================ */
    {
      id: 'm04-l02',
      title: '第一个 Web 接口',
      minutes: 30,
      goal: '写出第一个可 curl 通的 JSON 接口，理解 HTTP 请求从 Tomcat 到 Controller 再回到 JSON 的完整链路。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p><strong>待办清单 API 的第 1 步：让服务跑起来，并且能被 curl 请求到。</strong></p>
<p>需要三个角色各司其职：<strong>内嵌 Tomcat</strong> 负责监听 8080 端口收请求，<strong>DispatcherServlet</strong> 负责找到对应的方法，<strong>你写的 Controller</strong> 负责返回数据。三者都是 Spring Boot 自动装配好的，你只写最后那个。</p>`,
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'controller/TodoController.java',
          code: String.raw`package com.example.todoapi.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/todos")     // 类级别：所有方法的公共前缀
public class TodoController {

    @GetMapping                          // 类前缀 + 空路径 = GET /api/todos
    public List<String> list() {
        return List.of("写接口", "连数据库", "加缓存");
        // 返回对象会被 Jackson 自动序列化成 JSON 数组，不需要手写拼字符串
    }

    @GetMapping("/{id}")                 // 类前缀 + /{id} = GET /api/todos/1
    public String get(Long id) {
        return "todo-" + id;
        // 返回 String 时，Spring 直接把文本原样输出，不会加引号
    }
}`,
        },
        {
          type: 'diagram',
          caption: '一次 HTTP 请求在 Spring Boot 里的完整旅程',
          svg: String.raw`<svg viewBox="0 0 680 360" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif">
  <defs>
    <marker id="arr-m04-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#64B5F6"/>
    </marker>
  </defs>
  <rect x="8" y="8" width="664" height="344" rx="12" fill="#0F1B2D"/>
  <text x="340" y="38" text-anchor="middle" font-size="17" fill="#E2E8F0">GET /api/todos → JSON 响应</text>

  <g>
    <rect x="24" y="76" width="186" height="82" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
    <text x="117" y="106" text-anchor="middle" font-size="13" fill="#E2E8F0">客户端发起请求</text>
    <text x="117" y="128" text-anchor="middle" font-size="12" fill="#94A3B8">浏览器 / Postman</text>
    <text x="117" y="148" text-anchor="middle" font-size="12" fill="#22D3EE">或 curl 命令行</text>
  </g>
  <line x1="212" y1="117" x2="238" y2="117" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m04-b)"/>

  <g>
    <rect x="242" y="76" width="186" height="82" rx="10" fill="#1B2A44" stroke="#F59E0B" stroke-width="1.6"/>
    <text x="335" y="106" text-anchor="middle" font-size="13" fill="#E2E8F0">内嵌 Tomcat</text>
    <text x="335" y="128" text-anchor="middle" font-size="12" fill="#94A3B8">监听 8080 端口</text>
    <text x="335" y="148" text-anchor="middle" font-size="12" fill="#F59E0B">Boot 3 内嵌的是 10.1</text>
  </g>
  <line x1="430" y1="117" x2="456" y2="117" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m04-b)"/>

  <g>
    <rect x="460" y="76" width="196" height="82" rx="10" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.6"/>
    <text x="558" y="106" text-anchor="middle" font-size="13" fill="#E2E8F0">DispatcherServlet</text>
    <text x="558" y="128" text-anchor="middle" font-size="12" fill="#94A3B8">按 URL + HTTP 方法</text>
    <text x="558" y="148" text-anchor="middle" font-size="12" fill="#22D3EE">找到对应处理方法</text>
  </g>

  <path d="M558 160 L558 194 L588 194 L588 214" stroke="#64B5F6" stroke-width="1.8" fill="none" marker-end="url(#arr-m04-b)"/>

  <g>
    <rect x="460" y="218" width="196" height="82" rx="10" fill="#1B2A44" stroke="#10B981" stroke-width="1.6"/>
    <text x="558" y="248" text-anchor="middle" font-size="13" fill="#E2E8F0">TodoController</text>
    <text x="558" y="270" text-anchor="middle" font-size="12" fill="#94A3B8">执行 list() 方法</text>
    <text x="558" y="290" text-anchor="middle" font-size="12" fill="#10B981">业务代码只写这一层</text>
  </g>
  <line x1="458" y1="259" x2="432" y2="259" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m04-b)"/>

  <g>
    <rect x="242" y="218" width="186" height="82" rx="10" fill="#1B2A44" stroke="#22D3EE" stroke-width="1.6"/>
    <text x="335" y="248" text-anchor="middle" font-size="13" fill="#E2E8F0">Jackson 序列化</text>
    <text x="335" y="270" text-anchor="middle" font-size="12" fill="#94A3B8">List 转 JSON 字符串</text>
    <text x="335" y="290" text-anchor="middle" font-size="12" fill="#22D3EE">自动，不用手写</text>
  </g>
  <line x1="240" y1="259" x2="214" y2="259" stroke="#64B5F6" stroke-width="1.8" marker-end="url(#arr-m04-b)"/>

  <g>
    <rect x="24" y="218" width="186" height="82" rx="10" fill="#1B2A44" stroke="#3B82F6" stroke-width="1.6"/>
    <text x="117" y="248" text-anchor="middle" font-size="13" fill="#E2E8F0">HTTP 200 响应</text>
    <text x="117" y="270" text-anchor="middle" font-size="12" fill="#94A3B8">Content-Type: json</text>
    <text x="117" y="290" text-anchor="middle" font-size="12" fill="#3B82F6">前端拿到数组对象</text>
  </g>

  <rect x="80" y="316" width="520" height="34" rx="8" fill="#16233A" stroke="#22D3EE" stroke-width="1.2"/>
  <text x="340" y="338" text-anchor="middle" font-size="12" fill="#E2E8F0">前面四个环节全是自动装配：你只写了 @RestController 和 @GetMapping</text>
</svg>`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'Windows 终端验证（不用装 Postman）',
          code: String.raw`# 1. 启动项目：在 IDEA 里点绿色三角，或命令行执行
mvn spring-boot:run

# 2. 另开一个终端，用 curl 验证（Windows 10/11 自带 curl）
curl http://localhost:8080/api/todos

# 3. 验证带路径参数的接口
curl http://localhost:8080/api/todos/1

# 4. 看详细信息（响应头、状态码）
curl -i http://localhost:8080/api/todos`,
        },
        {
          type: 'table',
          title: 'HTTP 方法 ↔ Spring 注解 ↔ axios',
          head: ['HTTP 方法', 'Spring 注解', 'axios 写法', '语义'],
          rows: [
            ['GET', '@GetMapping', "axios.get('/api/todos')", '查询，不改数据'],
            ['POST', '@PostMapping', "axios.post('/api/todos', data)", '新增'],
            ['PUT', '@PutMapping', "axios.put('/api/todos/1', data)", '整体修改'],
            ['DELETE', '@DeleteMapping', "axios.delete('/api/todos/1')", '删除'],
            ['PATCH', '@PatchMapping', "axios.patch(...)", '局部修改（用得少）'],
          ],
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>返回值就是你的 res.data。</strong>方法返回一个 Java 对象，Jackson 负责序列化成 JSON 发出去——相当于前端 <code>axios.get()</code> 拿到的 <code>response.data</code>。你不需要手写 JSON 字符串，也不用 <code>JSON.stringify</code>。</p>
<p><strong>注意区别：</strong>返回 <code>String</code> 时 Spring 会当作纯文本原样输出（<code>"todo-1"</code> 里的引号<strong>不会</strong>被加上）；要返回带引号的 JSON 字符串，得自己写成 <code>return "\"{}\"";</code>。所以接口里优先返回对象或集合。</p>`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑 1：端口被占用。</strong>启动报 <code>Web server failed to start. Port 8080 was already in use</code>，说明上一次的进程还没退出（你可能点了运行但没停，或者 IDEA 崩过一次）。Windows 排查三连：</p>
<p><code>netstat -ano | findstr :8080</code> 拿到最右边的 PID → <code>taskkill /PID 进程号 /F</code> 结束它。或者直接在 <code>application.yml</code> 里换端口。</p>
<p><strong>坑 2：把 @RestController 写成 @Controller。</strong>后者默认认为你返回的是<strong>视图名</strong>，会去找模板文件，结果是 404 或「视图解析器」报错。返回 JSON 一律用 @RestController。</p>
<p><strong>坑 3：中文乱码。</strong>响应里的中文变成问号或乱码，在 <code>application.yml</code> 里设置 <code>server.servlet.encoding.charset: UTF-8</code> 与 <code>force: true</code>。</p>
<p><strong>坑 4：把 Controller 写在启动类包的外面。</strong>见上一课的坑 1，404 且无日志。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>项目能启动，控制台出现「Started TodoApiApplication in x seconds」。</li>
<li><code>curl http://localhost:8080/api/todos</code> 返回 JSON 数组。</li>
<li><code>curl http://localhost:8080/api/todos/1</code> 返回 <code>todo-1</code>。</li>
<li>能画出「Tomcat → DispatcherServlet → Controller → Jackson → JSON」这条链路。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: 'Controller 方法返回一个 List 对象，响应体是什么形式？',
          options: [
            'Java 对象的对象标识符字符串',
            '由 Jackson 自动序列化成的 JSON 数组',
            '空响应体，必须手动拼接 JSON',
            '纯文本 "List.of(...)"',
          ],
          answer: 1,
          explain:
            '@RestController 默认把返回值用 Jackson 序列化成 JSON。对应前端 axios 拿到的 response.data 就是这个数组，不需要手写 JSON。',
        },
        {
          q: '启动报错 Port 8080 was already in use，正确的排查步骤是？',
          options: [
            '重启电脑',
            'netstat -ano | findstr :8080 找 PID，再 taskkill /PID 进程号 /F',
            '删除 pom.xml 重新导入',
            '把 @RestController 改成 @Controller',
          ],
          answer: 1,
          explain:
            '这是上一个进程没释放端口。先用 netstat 找到占用 8080 的 PID，再结束该进程；也可以在 application.yml 里改 server.port 换端口。',
        },
        {
          q: '需要写返回 JSON 的接口，应该用哪个注解？',
          options: ['@Controller', '@RestController', '@Service', '@Component'],
          answer: 1,
          explain:
            '@RestController 默认把返回值序列化为 JSON。@Controller 默认返回视图名，会去找 HTML 模板，用在纯接口上会 404 或报视图解析错误。',
        },
      ],
    },

    /* ============================ L03 ============================ */
    {
      id: 'm04-l03',
      title: '路由与参数：把 axios 那套搬过来',
      minutes: 30,
      goal: '掌握 @RequestParam / @PathVariable / @RequestBody 三种参数绑定方式，能设计出符合 RESTful 的待办清单接口。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p><strong>待办清单 API 的第 2 步：把接口补齐。</strong>有了列表还不够，我们需要能查单个、能新增、能改状态、能删除。这一课就是把前端发请求的三种姿势对应到 Spring 的三种参数注解上。</p>`,
        },
        {
          type: 'compare',
          title: 'axios 传参方式 ↔ Spring 参数绑定',
          head: ['axios 写法', 'Spring 注解', '数据来源'],
          rows: [
            ["axios.get('/api/todos', { params: { completed: 0 } })", '@RequestParam("completed")', '查询串 ?completed=0'],
            ["axios.get('/api/todos/12')", '@PathVariable("id")', '路径段 /todos/12'],
            ["axios.post('/api/todos', { title: 'x' })", '@RequestBody', '请求体 JSON'],
            ['axios 请求头 Authorization', '@RequestHeader("Authorization")', '请求头'],
            ['路由 /todos/:id', '@GetMapping("/todos/{id}")', 'URL 模板'],
            ['axios 拦截器统一处理错误', '@RestControllerAdvice（m07）', '全局兜底'],
          ],
        },
        {
          type: 'code',
          lang: 'java',
          filename: 'controller/TodoController.java（完整 CRUD）',
          code: String.raw`package com.example.todoapi.controller;

import org.springframework.web.bind.annotation.*;

import java.util.List;

// 请求体：JDK 17 的 record，一行定义一个不可变 DTO
public record TodoCreateDTO(String title) {}

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    // GET /api/todos?keyword=写        ← 查询参数用 @RequestParam
    @GetMapping
    public List<String> list(@RequestParam(required = false) String keyword) {
        List<String> all = List.of("写接口", "连数据库", "加缓存");
        if (keyword == null || keyword.isBlank()) {
            return all;
        }
        return all.stream().filter(t -> t.contains(keyword)).toList();
    }

    // GET /api/todos/1                ← 路径参数用 @PathVariable
    @GetMapping("/{id}")
    public String get(@PathVariable Long id) {
        return "todo-" + id;
    }

    // POST /api/todos  + JSON body    ← 请求体用 @RequestBody
    @PostMapping
    public String create(@RequestBody TodoCreateDTO dto) {
        return "已创建：" + dto.title();
    }

    // PUT /api/todos/1                ← 路径参数 + 请求体可以同时用
    @PutMapping("/{id}")
    public String update(@PathVariable Long id, @RequestBody TodoCreateDTO dto) {
        return "已更新 " + id + "：" + dto.title();
    }

    // DELETE /api/todos/1
    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        return "已删除 " + id;
    }
}`,
        },
        {
          type: 'code',
          lang: 'ts',
          filename: '前端调用（对照看）',
          code: String.raw`// 与上面 5 个接口一一对应
import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080/api/todos' })

// GET ?keyword=写   ← 对应 @RequestParam
export const list = (keyword?: string) =>
  api.get('/', { params: { keyword } })

// GET /1            ← 对应 @PathVariable
export const get = (id: number) => api.get('/' + id)

// POST + JSON body  ← 对应 @RequestBody
export const create = (title: string) =>
  api.post('/', { title })

// PUT /1
export const update = (id: number, title: string) =>
  api.put('/' + id, { title })

// DELETE /1
export const remove = (id: number) => api.delete('/' + id)`,
        },
        {
          type: 'code',
          lang: 'bash',
          filename: 'Windows 终端验证全部接口',
          code: String.raw`# 查询全部
curl http://localhost:8080/api/todos

# 查询单个（路径参数）
curl http://localhost:8080/api/todos/1

# 带查询参数：GET 带参数必须用引号包住 URL
curl "http://localhost:8080/api/todos?keyword=写"

# 新增：-H 指定 JSON，-d 是请求体
curl -X POST http://localhost:8080/api/todos ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"写第一个接口\"}"

# 更新
curl -X PUT http://localhost:8080/api/todos/1 ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"改个名字\"}"

# 删除
curl -X DELETE http://localhost:8080/api/todos/1

# 注意：CMD 下多行续行符是 ^，PowerShell 下是反引号（键盘左上角那个键），
# 嫌麻烦就在一条命令里写完，或者直接用 Postman / VS Code 的 REST Client`,
        },
        {
          type: 'table',
          title: '三种参数注解速查',
          head: ['注解', '取值来源', '示例 URL', '前端对应'],
          rows: [
            ['@RequestParam', '查询串 ?key=value', '/todos?keyword=写', 'axios 的 params'],
            ['@PathVariable', '路径中的 {占位符}', '/todos/{id} → /todos/1', 'Vue Router 的 /todos/:id'],
            ['@RequestBody', '请求体（JSON）', 'POST + {"title":"x"}', 'axios 的 data'],
            ['@RequestHeader', '请求头', '请求头 Authorization: Bearer xxx', 'axios 的 headers'],
            ['@RequestPart', 'multipart 文件', '表单上传文件', 'FormData'],
          ],
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>心智映射：</strong></p>
<ul><li><code>@GetMapping("/todos/{id}")</code> ≈ Vue Router 里的 <code>/todos/:id</code>。</li>
<li><code>@RequestParam</code> ≈ axios 的 <code>{ params: {...} }</code>。</li>
<li><code>@RequestBody</code> ≈ axios 的第二个参数 <code>data</code>，Jackson 会自动把 JSON 反序列化成你的 Java 对象。</li>
<li><code>@RequestBody TodoCreateDTO dto</code> 这个接收对象，在前端项目里就是那个 <code>interface TodoCreateReq</code>——本课程的 DTO 就是后端的请求体类型。</li></ul>`,
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑 1：漏写 @RequestBody。</strong>如果前端 POST 了 JSON，而参数上没写 <code>@RequestBody</code>，Spring 会认为你没有请求体，接口直接报 <code>415 Unsupported Media Type</code>。或者更糟：方法参数里 <code>TodoCreateDTO</code> 全是 null，你在代码里 <code>dto.title()</code> 拿到 null 却不知道为什么。</p>
<p><strong>坑 2：GET 请求不要带 body。</strong>浏览器与很多客户端会忽略 GET 的 body。用 @RequestParam 才是正解。</p>
<p><strong>坑 3：@PathVariable 的名字必须对得上。</strong>路径里写 <code>{id}</code> 时，<code>@PathVariable("id") Long id</code> 要么显式写名字，要么确保开启参数名保留（IDEA 默认开启；<code>-parameters</code> 编译参数被去掉时会报「Name for argument type not available」）。<strong>建议一律显式写名字。</strong></p>
<p><strong>坑 4：路径变量类型转换失败。</strong><code>/api/todos/abc</code> 会得到 400 Bad Request，因为 Long 转不动。可以把参数写成 String 再自己判断。</p>`,
        },
        {
          type: 'tip',
          html: String.raw`<p><strong>RESTful 动词表（背下来就够）：</strong></p>
<ul><li>查询用 GET，路径是资源名词（复数）：<code>/api/todos</code>、<code>/api/todos/{id}</code></li>
<li>新增用 POST，参数放 body</li>
<li>整体修改用 PUT，路径带 id</li>
<li>删除用 DELETE，路径带 id</li>
<li>动作型操作（改状态、标记完成）建议设计成 <code>PATCH /api/todos/{id}/completed</code> 或 <code>PUT /api/todos/{id}/completed</code>。注意这里用<code>completed</code> 而不是 <code>done</code>：它表达的是「状态」而不是「动作」，和数据库字段名保持一致（详见 m05 的 <code>todo_list.completed</code>）。</li></ul>
<p>这一套和前端 RESTful 的设计习惯完全一致，你不需要重新学。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>5 个接口（列表 / 详情 / 新增 / 修改 / 删除）都能用 curl 调通。</li>
<li>能用 <code>@RequestParam</code> 接收查询串、<code>@PathVariable</code> 接收路径、<code>@RequestBody</code> 接收 JSON。</li>
<li>能用 <code>record</code> 定义请求体类型，知道它就是前端的请求体 interface。</li>
<li>能说出漏写 @RequestBody 的后果（415）。</li></ul>`,
        },
      ],
      quiz: [
        {
          q: 'GET /api/todos?keyword=写 中，keyword 这个值应该用哪个注解接收？',
          options: ['@PathVariable("keyword")', '@RequestParam("keyword")', '@RequestBody', '@RequestHeader'],
          answer: 1,
          explain:
            '查询串 ?key=value 用 @RequestParam；路径段 /todos/{id} 用 @PathVariable；JSON 请求体用 @RequestBody；请求头用 @RequestHeader。',
        },
        {
          q: '前端用 axios.post 提交了 JSON，但接口返回 415 Unsupported Media Type，最可能的原因是？',
          options: [
            'Controller 没有加 @RestController',
            '方法参数上漏写了 @RequestBody',
            '端口号写错了',
            '请求路径多了斜杠',
          ],
          answer: 1,
          explain:
            '@RequestBody 的作用是让 Spring 用 Jackson 把请求体 JSON 反序列化成你的对象。漏写它，Spring 认为请求体不存在，报 415。',
        },
        {
          q: '关于 @PathVariable，正确的是？',
          options: [
            '它取的是查询串里的参数',
            '它取的是路径模板中的占位符变量',
            '它必须配合 @RequestBody 一起用',
            '路径里写 {userId} 时参数名可以随便取',
          ],
          answer: 1,
          explain:
            '@PathVariable 取路径模板变量，如 @GetMapping("/{id}") 配 @PathVariable("id")。名字最好显式写：Java 默认不保留方法参数名，不写名字时 Spring 拿不到 "id" 这个字符串，编译或启动阶段就会报错（报 Name for argument type not available）。加上 "id" 就没这个问题了。',
        },
      ],
    },

    /* ============================ L04 ============================ */
    {
      id: 'm04-l04',
      title: 'application.yml：把配置从代码里搬出去',
      minutes: 30,
      goal: '掌握端口、日志级别、多环境 profile 的配置写法，知道配置从哪里来、谁会覆盖谁。',
      sections: [
        {
          type: 'text',
          html: String.raw`<p>硬编码的坏处你很清楚：换环境要改代码、重新打包。Spring Boot 的配置全部外置到 <code>application.yml</code>，规则和前端的 <code>.env</code> + Vite 的 <code>mode</code> 几乎一样。</p>`,
        },
        {
          type: 'fe',
          html: String.raw`<p><strong>直接对照：</strong></p>
<ul><li><code>.env</code> / <code>.env.development</code> ≈ <code>application.yml</code> / <code>application-dev.yml</code></li>
<li><code>process.env.NODE_ENV</code> ≈ <code>spring.profiles.active</code></li>
<li><code>vite build --mode production</code> ≈ <code>java -jar app.jar --spring.profiles.active=prod</code></li>
<li><code>server.port</code> ≈ <code>VITE_PORT</code></li></ul>
<p>唯一的新东西是 <strong>profile</strong> 这个词——它把「当前处于哪个环境」这件事显式化了，比 Vite 靠 mode 自动约定更明确。</p>`,
        },
        {
          type: 'code',
          lang: 'yaml',
          filename: 'src/main/resources/application.yml',
          code: String.raw`# 主配置：所有环境共用的默认值
server:
  port: 8080
  servlet:
    encoding:
      charset: UTF-8
      enabled: true
      force: true          # 强制请求/响应都用 UTF-8，避免中文乱码

spring:
  application:
    name: todo-api
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai

logging:
  level:
    root: INFO
    com.example.todoapi: DEBUG     # 自己的包打 DEBUG，排错时很关键
  pattern:
    console: "%d{HH:mm:ss.SSS} %-5level [%thread] %logger{36} - %msg%n"`,
        },
        {
          type: 'code',
          lang: 'yaml',
          filename: 'application-dev.yml（开发环境）',
          code: String.raw`spring:
  # 开发期打开 SQL 日志、允许更宽松的校验
  devtools:
    restart:
      enabled: true

logging:
  level:
    com.example.todoapi: DEBUG
    # 接数据库后把 Mapper 包也打开，直接在控制台看到 SQL
    com.example.todoapi.mapper: DEBUG`,
        },
        {
          type: 'code',
          lang: 'yaml',
          filename: 'application-prod.yml（生产环境）',
          code: String.raw`server:
  port: 9090            # 生产换个端口，避免和本机服务冲突

spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/todo_db?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf8  # 库名 todo_db 在 m05 统一创建，这里先对齐写法
    username: ${DOLLAR}{DB_USER:todo}
    password: ${DOLLAR}{DB_PASSWORD:todo123}
    driver-class-name: com.mysql.cj.jdbc.Driver

logging:
  level:
    root: WARN           # 生产环境别打 INFO，日志量太大
    com.example.todoapi: INFO`,
        },
        {
          type: 'text',
          html: String.raw`<p>上面 prod 配置里有两处需要说明：</p>
<ul><li><code>${DOLLAR}{DB_USER:todo}</code> 是 Spring 的占位符语法：优先读环境变量 <code>DB_USER</code>，读不到就用冒号后的默认值 <code>todo</code>。这是 Spring Boot 3 推荐的写法，比把密码明文写在配置文件里安全。</li>
<li><code>com.mysql.cj.jdbc.Driver</code> 与 <code>mysql-connector-j</code> 是 Spring Boot 3 时代的新写法：依赖坐标由旧的 <code>mysql-connector-java</code> 改成了 <code>mysql-connector-j</code>，驱动类名也必须是 <code>com.mysql.cj.jdbc.Driver</code>。URL 里的 <code>serverTimezone=Asia/Shanghai</code> 一定要加，否则中文时间会差 8 小时。</li></ul>`,
        },
        {
          type: 'steps',
          title: '如何切换环境（两种方式）',
          items: [
            String.raw`<strong>方式一：改配置文件。</strong>在 <code>application.yml</code> 里加三行：<code>spring:</code> / 两空格 <code>profiles:</code> / 四空格 <code>active: dev</code>，这是默认激活的开发环境。`,
            String.raw`<strong>方式二：启动命令行动态指定（推荐用于部署）。</strong><code>java -jar todo-api.jar --spring.profiles.active=prod</code>，无需改代码或配置。`,
            String.raw`IDEA 里也可以：在 Run/Debug Configurations 的 <strong>Program arguments</strong> 填 <code>--spring.profiles.active=dev</code>，或 VM options 填 <code>-Dspring.profiles.active=dev</code>。`,
            String.raw`临时改单个配置：<code>java -jar todo-api.jar --server.port=9090</code>，不用改任何文件。`,
          ],
        },
        {
          type: 'code',
          lang: 'bash',
          filename: '不同启动方式（Windows）',
          code: String.raw`# 开发期：IDEA 里直接运行，或者
mvn spring-boot:run

# 指定环境启动
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 打包后运行（m08 会完整讲打包）
java -jar target\todo-api-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod

# 临时换端口，不动配置文件
java -jar target\todo-api-0.0.1-SNAPSHOT.jar --server.port=9090`,
        },
        {
          type: 'table',
          title: '配置优先级：从高到低',
          head: ['优先级', '来源', '前端类比'],
          rows: [
            ['最高', '命令行参数 --server.port=9090', '命令行里直接传 env'],
            ['高', '环境变量 SERVER_PORT', '系统环境变量'],
            ['中', 'jar 外部的 application.yml', '额外加载的 .env.local'],
            ['中低', 'jar 内的 profile 配置文件', '.env.production'],
            ['低', 'jar 内的 application.yml', '.env'],
            ['最低', '框架默认值（8080）', '写死在代码里的默认值'],
          ],
        },
        {
          type: 'warn',
          html: String.raw`<p><strong>坑 1：YAML 只能用空格缩进，绝对不能用 Tab。</strong>复制粘贴或从网上拷配置时最容易踩，会直接抛 <code>ScannerException: while scanning a simple key</code>。另外<strong>冒号后必须有空格</strong>，<code>port:8080</code> 会被当成字符串而非数字。</p>
<p><strong>坑 2：改了 yml 不生效。</strong>① 检查是否在正确的 resources 目录下；② 确认当前激活的 profile 覆盖了它（<code>application-dev.yml</code> 会覆盖 <code>application.yml</code> 的同名字段）；③ 改完重启应用；④ IDEA 可能仍在用旧产物，用 <code>mvn clean package</code> 或 Rebuild Project。</p>
<p><strong>坑 3：端口改了但前端还连 8080。</strong>如果后端换到 9090，前端 axios 的 baseURL 要同步改；开发时更常见的做法是前端配代理，保持对外仍是 8080。</p>
<p><strong>坑 4：日志刷屏。</strong>开发期把 <code>com.example</code> 打到 DEBUG 能看到 SQL 和缓存命中；生产必须调回 INFO/WARN，否则磁盘和 IO 都被日志吃掉。</p>`,
        },
        {
          type: 'tip',
          html: String.raw`<p><strong>排查配置问题的固定动作：</strong>启动日志里 Spring Boot 会打印<strong>激活的 profile 列表</strong>和<strong>哪些配置来自 jar 内部</strong>。看到 <code>The following 1 profile is active: "dev"</code> 就知道环境对不对了。这行日志能解决 80% 的「配置为什么不生效」。</p>`,
        },
        {
          type: 'text',
          html: String.raw`<p><strong>本课产出物检查清单：</strong></p>
<ul><li>能在 application.yml 里改端口、编码、日志级别并生效。</li>
<li>能用 --spring.profiles.active 切换 dev / prod，且知道命令行优先级最高。</li>
<li>知道 Spring Boot 3 的 MySQL 驱动写法与 serverTimezone 的必要性（m06 会真正接上）。</li>
<li>会用 ${DOLLAR}{环境变量:默认值} 占位符，而不是把密码硬编码。</li></ul>
<p>下一模块 <strong>MySQL</strong>：把现在内存里的 List 换成真实的表。</p>`,
        },
      ],
      quiz: [
        {
          q: '要把服务端口临时改成 9090，不修改任何文件，正确命令是？',
          options: [
            'java -jar app.jar --server.port=9090',
            'java -jar app.jar --port=9090',
            'java -jar app.jar -Dserver.port=9090',
            '需要修改 pom.xml 里的 server.port',
          ],
          answer: 0,
          explain:
            '命令行参数格式是 --配置项=值，且命令行优先级高于配置文件。-D 是 JVM 系统属性，不等于 Spring Boot 的配置项写法。',
        },
        {
          q: '关于 application.yml，下列说法正确的是？',
          options: [
            '可以用 Tab 缩进',
            '冒号后可以不加空格',
            '只能写在项目根目录，必须放到 src/main/resources 下',
            '只能有一份配置文件',
          ],
          answer: 2,
          explain:
            'YAML 只能用空格缩进，冒号后必须有空格，否则会抛 ScannerException 或类型推断错误。多环境靠 application-{profile}.yml 拆分，默认主配置必须在 resources 目录。',
        },
        {
          q: 'Spring Boot 3 接 MySQL 时，正确的驱动类名与配置前缀是？',
          options: [
            'com.mysql.jdbc.Driver，spring.redis.*',
            'com.mysql.cj.jdbc.Driver，spring.datasource.*',
            'com.mysql.cj.jdbc.Driver，javax.servlet.*',
            'com.mysql.jdbc.Driver，spring.data.datasource.*',
          ],
          answer: 1,
          explain:
            'Boot 3 时代驱动类名为 com.mysql.cj.jdbc.Driver（依赖坐标 mysql-connector-j），数据源配置在 spring.datasource 下。javax.* 已全面迁移到 jakarta.*。',
        },
      ],
    },
  ],
};