/**
 * data/index.ts —— PC 端课程注册表
 *
 * 与手机版的差异：PC 端打包为离线单包，无需按需切分 chunk，
 * 因此 10 个模块全部静态导入；m11（runoob 实例精练）作为第 11 个模块
 * 追加在阶段一末尾（Java 基础收官实战）。
 */

/** 页面层需要的类型从数据层转出，避免多文件直接依赖 types/course */
export type { CourseModule, ModuleMeta, Phase, PhaseId, RawModule } from '../types/course'
import type { CourseModule, ModuleMeta, Phase, PhaseId, RawModule } from '../types/course'

import { module as m01 } from './m01-idea'
import { module as m02 } from './m02-maven'
import { module as m03 } from './m03-java'
import { module as m04 } from './m04-springboot'
import { module as m05 } from './m05-mysql'
import { module as m06 } from './m06-mybatis'
import { module as m07 } from './m07-layered'
import { module as m08 } from './m08-package'
import { module as m09 } from './m09-redis'
import { module as m10 } from './m10-docker'
import { module as m11 } from './m11-runoob'

/* ---------------- 阶段定义（与手机版一致） ---------------- */

export const PHASES: Phase[] = [
  { id: 'phase1', name: '阶段一 · 快速上手', short: '快速上手', color: '#3B82F6' },
  { id: 'phase2', name: '阶段二 · 写出完整后端', short: '写出后端', color: '#22D3EE' },
  { id: 'phase3', name: '阶段三 · 原理补课与进阶', short: '原理进阶', color: '#F59E0B' },
]

export function phaseOf(id?: string): Phase {
  return PHASES.find((p) => p.id === id) || PHASES[0]
}

/* ---------------- 模块元信息（含封面） ---------------- */

export const MODULE_META: ModuleMeta[] = [
  { id: 'm01', file: 'm01-idea.ts', phase: 'phase1', icon: '🛠', title: 'IntelliJ IDEA 使用', subtitle: '把 VSCode 的手感迁移到 IDEA', cover: 'assets/img/m01-idea.jpg', minutes: 90 },
  { id: 'm02', file: 'm02-maven.ts', phase: 'phase1', icon: '📦', title: 'Maven 依赖管理', subtitle: '后端世界的 npm + vite', cover: 'assets/img/m02-maven.jpg', minutes: 140 },
  { id: 'm03', file: 'm03-java.ts', phase: 'phase1', icon: '☕', title: 'Java 够用语法', subtitle: '对照 TypeScript 学，只学用得上的', cover: 'assets/img/m03-java.jpg', minutes: 215 },
  { id: 'm11', file: 'm11-runoob.ts', phase: 'phase1', icon: '💻', title: 'Java 实例精练（基础篇）', subtitle: 'runoob 实例精选，边学边在练习页跑起来', cover: 'assets/img/hero.jpg', minutes: 160 },
  { id: 'm04', file: 'm04-springboot.ts', phase: 'phase2', icon: '🍃', title: 'Spring Boot 起步', subtitle: 'IoC/DI 与第一个 Web 接口', cover: 'assets/img/m04-springboot.jpg', minutes: 150 },
  { id: 'm05', file: 'm05-mysql.ts', phase: 'phase2', icon: '🗄', title: 'MySQL 数据库', subtitle: '建库建表与 CRUD、JOIN 查询', cover: 'assets/img/m05-mysql.jpg', minutes: 185 },
  { id: 'm06', file: 'm06-mybatis.ts', phase: 'phase2', icon: '🔌', title: '连接数据库 · MyBatis-Plus', subtitle: '连接池原理与条件构造器', cover: 'assets/img/m06-mybatis.jpg', minutes: 150 },
  { id: 'm07', file: 'm07-layered.ts', phase: 'phase2', icon: '🧱', title: '业务分层', subtitle: '三层架构、DTO/VO、事务', cover: 'assets/img/m07-layered.jpg', minutes: 260 },
  { id: 'm08', file: 'm08-package.ts', phase: 'phase2', icon: '🚀', title: '打包与部署', subtitle: '打 jar 包、多环境、Linux 命令', cover: 'assets/img/m08-package.jpg', minutes: 135 },
  { id: 'm09', file: 'm09-redis.ts', phase: 'phase3', icon: '⚡', title: 'Redis 缓存', subtitle: '五大数据类型与缓存三兄弟', cover: 'assets/img/m09-redis.jpg', minutes: 145 },
  { id: 'm10', file: 'm10-docker.ts', phase: 'phase3', icon: '🐳', title: 'Docker 容器化', subtitle: '镜像、Dockerfile、compose 一键部署', cover: 'assets/img/m10-docker.jpg', minutes: 145 },
]

/* ---------------- 静态注册表 ---------------- */

const STATIC_MODULES: Record<string, RawModule> = {
  m01,
  m02,
  m03,
  m04,
  m05,
  m06,
  m07,
  m08,
  m09,
  m10,
  m11,
}

/** 数据合法性最小校验：结构不对就当缺失处理，避免渲染时抛异常 */
function isValid(m: unknown): m is RawModule {
  const mod = m as RawModule | null
  return !!mod && typeof mod === 'object' && typeof mod.id === 'string' && Array.isArray(mod.lessons)
}

/** 兜底占位模块（内容缺失时首页依然完整） */
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

/** 加载全部模块，返回按 MODULE_META 顺序排列的完整目录 */
export function loadModules(): CourseModule[] {
  return MODULE_META.map((meta, i) => {
    const raw = STATIC_MODULES[meta.id]
    if (!isValid(raw)) return placeholder(meta, i + 1)
    const ph = phaseOf(raw.phase || meta.phase)
    return {
      id: raw.id || meta.id,
      order: i + 1,
      title: raw.title || meta.title,
      subtitle: raw.subtitle || meta.subtitle || '',
      phase: (raw.phase || meta.phase) as PhaseId,
      phaseName: raw.phaseName || ph.name,
      icon: raw.icon || meta.icon,
      cover: raw.cover || meta.cover,
      minutes: Number(raw.minutes) || meta.minutes,
      summary: raw.summary || '',
      lessons: (raw.lessons || []).filter((l) => l && typeof l.id === 'string'),
      flashcards: Array.isArray(raw.flashcards) ? raw.flashcards : [],
      missing: false,
    }
  })
}

export function getModule(id: string): CourseModule | null {
  return loadModules().find((m) => m.id === id) || null
}
