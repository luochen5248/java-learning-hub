/**
 * data/index.ts —— 模块注册表（框架与内容之间的唯一接缝）
 *
 * 约定：
 *  1. 内容文件命名固定为 m01-idea.ts ~ m10-docker.ts。
 *  2. 每个内容文件用 `export const module: RawModule = {...}` 导出。
 *  3. 加载用「显式 loader 映射 + try/catch 降级」：
 *     - 任何一个模块加载失败（语法错误 / 运行环境受限）都只把这一个模块降级为
 *       「建设中」占位，绝不白屏、绝不连累其它模块。
 *     - 这里刻意不用 `import('./' + file)` 变量拼接：Vite 对变量拼接的动态导入
 *       只能做通配打包，产物里会出现不可控的 chunk；显式映射才能精确切分并离线可用。
 *  4. 缺失模块仍然有标题/封面/阶段等元信息（下面的 MODULE_META），
 *     所以首页路线图、三阶段列表在数据未就绪时也能完整显示。
 */

import type { CourseModule, ModuleMeta, Phase, PhaseId, RawModule } from '../types/course'

/* ---------------- 阶段定义（与首页地铁线路图配色一致） ---------------- */

export const PHASES: Phase[] = [
  { id: 'phase1', name: '阶段一 · 快速上手', short: '快速上手', color: '#3B82F6' },      // 科技蓝
  { id: 'phase2', name: '阶段二 · 写出完整后端', short: '写出后端', color: '#22D3EE' },  // 青
  { id: 'phase3', name: '阶段三 · 原理补课与进阶', short: '原理进阶', color: '#F59E0B' }, // 金
]

export function phaseOf(id?: string): Phase {
  return PHASES.find((p) => p.id === id) || PHASES[0]
}

/* ---------------- 10 个模块的兜底元信息 ---------------- */

export const MODULE_META: ModuleMeta[] = [
  { id: 'm01', file: 'm01-idea.ts', phase: 'phase1', icon: '🛠', title: 'IntelliJ IDEA 使用', subtitle: '把 VSCode 的手感迁移到 IDEA', cover: 'assets/img/m01-idea.jpg', minutes: 90 },
  { id: 'm02', file: 'm02-maven.ts', phase: 'phase1', icon: '📦', title: 'Maven 依赖管理', subtitle: '后端世界的 npm + vite', cover: 'assets/img/m02-maven.jpg', minutes: 110 },
  { id: 'm03', file: 'm03-java.ts', phase: 'phase1', icon: '☕', title: 'Java 够用语法', subtitle: '对照 TypeScript 学，只学用得上的', cover: 'assets/img/m03-java.jpg', minutes: 160 },
  { id: 'm04', file: 'm04-springboot.ts', phase: 'phase2', icon: '🍃', title: 'Spring Boot 起步', subtitle: 'IoC/DI 与第一个 Web 接口', cover: 'assets/img/m04-springboot.jpg', minutes: 120 },
  { id: 'm05', file: 'm05-mysql.ts', phase: 'phase2', icon: '🗄', title: 'MySQL 数据库', subtitle: '建库建表与 CRUD、JOIN 查询', cover: 'assets/img/m05-mysql.jpg', minutes: 150 },
  { id: 'm06', file: 'm06-mybatis.ts', phase: 'phase2', icon: '🔌', title: '连接数据库 · MyBatis-Plus', subtitle: '连接池原理与条件构造器', cover: 'assets/img/m06-mybatis.jpg', minutes: 120 },
  { id: 'm07', file: 'm07-layered.ts', phase: 'phase2', icon: '🧱', title: '业务分层', subtitle: '三层架构、DTO/VO、事务', cover: 'assets/img/m07-layered.jpg', minutes: 130 },
  { id: 'm08', file: 'm08-package.ts', phase: 'phase2', icon: '🚀', title: '打包与部署', subtitle: '打 jar 包、多环境、Linux 命令', cover: 'assets/img/m08-package.jpg', minutes: 100 },
  { id: 'm09', file: 'm09-redis.ts', phase: 'phase3', icon: '⚡', title: 'Redis 缓存', subtitle: '五大数据类型与缓存三兄弟', cover: 'assets/img/m09-redis.jpg', minutes: 100 },
  { id: 'm10', file: 'm10-docker.ts', phase: 'phase3', icon: '🐳', title: 'Docker 容器化', subtitle: '镜像、Dockerfile、compose 一键部署', cover: 'assets/img/m10-docker.jpg', minutes: 100 },
]

/* ---------------- 加载 ---------------- */

/**
 * 显式 loader 映射（而不是变量拼接的动态 import）。
 * 新增课程：写好 mXX-*.ts 后，在这里补一行 + 在 MODULE_META 补一条即可。
 */
const LOADERS: Record<string, () => Promise<unknown>> = {
  m01: () => import('./m01-idea'),
  m02: () => import('./m02-maven'),
  m03: () => import('./m03-java'),
  m04: () => import('./m04-springboot'),
  m05: () => import('./m05-mysql'),
  m06: () => import('./m06-mybatis'),
  m07: () => import('./m07-layered'),
  m08: () => import('./m08-package'),
  m09: () => import('./m09-redis'),
  m10: () => import('./m10-docker'),
}

/** 兜底模块对象（内容文件缺失时使用，标记 missing=true） */
function placeholder(meta: ModuleMeta, order: number): CourseModule {
  const ph = phaseOf(meta.phase)
  return {
    id: meta.id,
    order,
    title: meta.title,
    subtitle: meta.subtitle,
    phase: meta.phase,
    phaseName: ph.name,
    icon: meta.icon,
    cover: meta.cover,
    minutes: meta.minutes,
    summary: '本模块内容正在建设中，先学前面的模块吧。',
    lessons: [],
    flashcards: [],
    missing: true,
  }
}

/** 数据合法性最小校验：结构不对就当缺失处理，避免渲染时抛异常 */
function isValid(m: unknown): m is RawModule {
  const mod = m as RawModule | null
  return !!mod && typeof mod === 'object' && typeof mod.id === 'string' && Array.isArray(mod.lessons)
}

/** 加载单个模块；失败（未就绪 / 语法错误 / 环境受限）返回 null */
export async function loadModule(meta: ModuleMeta, order: number): Promise<CourseModule | null> {
  try {
    const loader = LOADERS[meta.id]
    if (!loader) return null
    const mod = (await loader()) as { module?: RawModule; default?: RawModule }
    const m = mod && (mod.module || mod.default)
    if (!isValid(m)) return null
    const ph = phaseOf(m.phase || meta.phase)
    return {
      id: m.id || meta.id,
      order,
      title: m.title || meta.title,
      subtitle: m.subtitle || meta.subtitle || '',
      phase: (m.phase || meta.phase) as PhaseId,
      phaseName: m.phaseName || ph.name,
      icon: m.icon || meta.icon,
      cover: m.cover || meta.cover,
      minutes: Number(m.minutes) || meta.minutes,
      summary: m.summary || '',
      lessons: (m.lessons || []).filter((l) => l && typeof l.id === 'string'),
      // 闪卡：内容可选提供，缺失时空数组，聚合层会自然跳过
      flashcards: Array.isArray(m.flashcards) ? m.flashcards : [],
      missing: false,
    }
  } catch (e) {
    // 静默降级：单个模块出问题不应连累整个应用启动
    return null
  }
}

/** 加载全部模块，返回按 order 排序的完整目录；缺失模块以占位对象补齐 */
export async function loadModules(): Promise<CourseModule[]> {
  const results = await Promise.all(MODULE_META.map((meta, i) => loadModule(meta, i + 1)))
  return MODULE_META.map((meta, i) => results[i] || placeholder(meta, i + 1))
}
