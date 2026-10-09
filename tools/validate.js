#!/usr/bin/env node
/**
 * tools/validate.js —— Java 后端学习 App 静态校验脚本
 *
 * 零依赖（仅 Node 标准库），Windows 路径兼容。用法：
 *   node tools/validate.js                # 校验整个 App
 *   node tools/validate.js --root <dir>   # 指定 App 根目录（自测用）
 *   node tools/validate.js --quiet        # 只输出 FAIL/WARN 与汇总
 *
 * 七类检查：
 *   1. JS 语法      —— 对全部 js 逐个 node --check
 *   2. Schema 契约  —— 动态 import ES Module 数据文件，按 plan.md §4 强契约校验
 *   3. 资源引用     —— assets/... 引用是否存在 + assets/img 反向核对
 *   4. 跨引用一致   —— index.js 模块顺序 vs 各文件 order、模块/课程 id 唯一性
 *   5. SVG 安全     —— 禁 <script>、on* 事件属性、必须有 viewBox
 *   6. 版本红线     —— javax.servlet / javax.validation / spring.redis.* /
 *                      mybatis-plus-boot-starter / com.mysql.jdbc.Driver
 *   7. SVG marker   —— 同一 SVG 内 url(#id) 悬空引用检出（箭头不渲染的元凶）
 *
 * 设计约定：
 *   - 内容文件缺失 / 尚未落盘 → WARN 并继续，绝不 FAIL，便于并行编写时反复增量跑。
 *   - 一切结论尽量带行号，便于内容负责人直接定位修改。
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');

/* ============================ 参数与配置 ============================ */

const argv = process.argv.slice(2);
const argValue = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
};
const QUIET = argv.includes('--quiet');
const ROOT = path.resolve(argValue('--root') || path.join(__dirname, '..', 'java-learning-app'));
const DATA_DIR = path.join(ROOT, 'js', 'data');
const IMG_DIR = path.join(ROOT, 'assets', 'img');
const INDEX_HTML = path.join(ROOT, 'index.html');
/** 安卓壳工程根目录：android-icon-foreground.png 这类素材由壳工程引用 */
const SHELL_DIR = path.join(path.dirname(ROOT), 'android-shell');

/** plan.md §3 定义的 10 个模块（id → 文件名），用于缺失检测与顺序核对 */
const EXPECTED_MODULES = [
  { id: 'm01', file: 'm01-idea.js' },
  { id: 'm02', file: 'm02-maven.js' },
  { id: 'm03', file: 'm03-java.js' },
  { id: 'm04', file: 'm04-springboot.js' },
  { id: 'm05', file: 'm05-mysql.js' },
  { id: 'm06', file: 'm06-mybatis.js' },
  { id: 'm07', file: 'm07-layered.js' },
  { id: 'm08', file: 'm08-package.js' },
  { id: 'm09', file: 'm09-redis.js' },
  { id: 'm10', file: 'm10-docker.js' },
];

const PHASES = ['phase1', 'phase2', 'phase3'];
/** plan.md §4 section 类型枚举 */
const SECTION_TYPES = ['text', 'steps', 'code', 'compare', 'table', 'diagram', 'img', 'tip', 'warn', 'fe'];
const CODE_LANGS = ['java', 'sql', 'yaml', 'xml', 'bash', 'properties', 'dockerfile', 'js', 'ts', 'text'];
const EXPECTED_IMG_COUNT = 13;
/** 反向核对豁免文件（logo 为应用图标，不要求正文引用） */
const IMG_EXEMPT = new Set(['logo.png']);

/* ============================ 报告器 ============================ */

const stats = { pass: 0, fail: 0, warn: 0 };
const failures = [];
const warnings = [];

function rel(p) {
  const r = path.relative(ROOT, p);
  if (!r) return path.basename(ROOT) || ROOT;
  return r.startsWith('..') ? path.basename(p) : r.split(path.sep).join('/');
}

function emit(level, loc, msg) {
  const tag = level === 'pass' ? 'PASS' : level === 'fail' ? 'FAIL' : 'WARN';
  if (level === 'pass') {
    stats.pass++;
    if (!QUIET) console.log(`  [${tag}] ${loc} ${msg}`);
    return;
  }
  const line = `[${tag}] ${loc} ${msg}`;
  if (level === 'fail') {
    stats.fail++;
    failures.push(line);
  } else {
    stats.warn++;
    warnings.push(line);
  }
  console.log(`  ${line}`);
}

const pass = (loc, msg) => emit('pass', loc, msg);
const fail = (loc, msg) => emit('fail', loc, msg);
const warn = (loc, msg) => emit('warn', loc, msg);

const loc = (file, line) => (line ? `${rel(file)}:${line}` : rel(file));
const at = (file, line, msg) => fail(loc(file, line), msg);
const warnAt = (file, line, msg) => warn(loc(file, line), msg);
const section = (title) => console.log(`\n=== ${title} ===`);

/* ============================ 通用工具 ============================ */

function walk(dir, filter, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, filter, out);
    else if (filter(full)) out.push(full);
  }
  return out;
}

const readText = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

function readLines(p) {
  try {
    return readText(p).split(/\r?\n/);
  } catch {
    return [];
  }
}

function lineOf(lines, needle, fromLine = 1) {
  for (let i = fromLine - 1; i < lines.length; i++) {
    if (lines[i].includes(needle)) return i + 1;
  }
  return 0;
}

const isNonEmptyStr = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * 行号定位器：先按课程 id 锁定该课在源码中的行区间，再在区间内找字段，
 * 避免多课文件里"永远只匹配第一个 options:"的行号错位。
 */
function makeLocator(lines) {
  const bounds = [];
  lines.forEach((l, i) => {
    const m = l.match(/id:\s*['"](m\d{2}-l\d{2})['"]/);
    if (m) bounds.push({ id: m[1], line: i + 1 });
  });
  return {
    /** 在 lessonId 课程范围内定位 needle 的行号；找不到则全局找 */
    inLesson(lessonId, needle) {
      let start = 1;
      let end = lines.length;
      const k = bounds.findIndex((b) => b.id === lessonId);
      if (k >= 0) {
        start = bounds[k].line;
        end = k + 1 < bounds.length ? bounds[k + 1].line - 1 : lines.length;
      }
      for (let i = start - 1; i < end; i++) {
        if (lines[i].includes(needle)) return i + 1;
      }
      return lineOf(lines, needle);
    },
    /** 在指定行之后定位 */
    after(fromLine, needle, span = 80) {
      for (let i = fromLine; i < Math.min(lines.length, fromLine + span); i++) {
        if (lines[i].includes(needle)) return i + 1;
      }
      return 0;
    },
  };
}

/* ============================ 检查 1：JS 语法 ============================ */

function checkSyntax() {
  section('检查 1 / JS 语法（node --check）');
  if (!exists(ROOT)) {
    fail(rel(ROOT), 'App 根目录不存在，无法校验');
    return;
  }
  const files = walk(ROOT, (f) => f.endsWith('.js'));
  if (!files.length) {
    warn(rel(ROOT), '未找到任何 .js 文件');
    return;
  }
  let bad = 0;
  for (const f of files) {
    const src = readText(f);
    // .js 默认按 CJS 解析；含 import/export 的走 module 模式（stdin 传入）
    const isModule = /^\s*(import|export)\s/m.test(src);
    const r = isModule
      ? spawnSync(process.execPath, ['--input-type=module', '--check', '-'], { input: src, encoding: 'utf8' })
      : spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status === 0) pass(rel(f), isModule ? '语法正确（ES Module）' : '语法正确');
    else {
      bad++;
      const msg = String(r.stderr || '')
        .split(/\r?\n/)
        .filter((l) => /SyntaxError|Error:/.test(l))[0] || '语法错误';
      at(f, 0, msg.trim());
    }
  }
  if (!bad) console.log(`  —— 共 ${files.length} 个 js 文件，语法全部通过`);
}

/* ============================ 检查 2：Schema 契约 ============================ */

async function importModule(file) {
  try {
    const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
    const m = mod && (mod.module || mod.default);
    if (!m) return { mod: null, error: '未导出 module（需要 export const module = {...}）' };
    return { mod: m, error: null };
  } catch (e) {
    return { mod: null, error: String((e && e.message) || e).split(/\r?\n/)[0] };
  }
}

/** 导入任意 ES Module（用于 index.js 等不导出 module 的文件） */
async function importAny(file) {
  try {
    return { mod: await import(pathToFileURL(file).href + `?t=${Date.now()}`), error: null };
  } catch (e) {
    return { mod: null, error: String((e && e.message) || e).split(/\r?\n/)[0] };
  }
}

function checkSection(file, L, lessonId, secIndex, sec) {
  const where = `${lessonId}.sections[${secIndex}]`;
  if (!sec || typeof sec !== 'object' || Array.isArray(sec)) {
    at(file, 0, `${where} 不是对象`);
    return;
  }
  if (!SECTION_TYPES.includes(sec.type)) {
    at(file, L.inLesson(lessonId, `type: '${sec.type}'`), `${where} type 非法：${JSON.stringify(sec.type)}，应为 ${SECTION_TYPES.join('/')}`);
    return;
  }
  const need = (cond, msg, needle) => {
    if (!cond) at(file, needle ? L.inLesson(lessonId, needle) : 0, `${where} (type=${sec.type}) ${msg}`);
  };

  switch (sec.type) {
    case 'text':
    case 'tip':
    case 'warn':
    case 'fe':
      need(isNonEmptyStr(sec.html), '缺少 html 文本', 'html:');
      break;
    case 'steps':
      if (!Array.isArray(sec.items) || sec.items.length < 1) {
        need(false, '缺少 steps items 或为空', 'items:');
      } else {
        sec.items.forEach((it, i) => {
          if (!isNonEmptyStr(it)) at(file, L.inLesson(lessonId, 'items:'), `${where}.items[${i}] 不是非空字符串`);
        });
      }
      break;
    case 'code':
      need(isNonEmptyStr(sec.lang), '缺少 lang（代码块必须声明语言）', 'lang:');
      need(isNonEmptyStr(sec.code), '缺少 code 内容', 'code:');
      if (isNonEmptyStr(sec.lang) && !CODE_LANGS.includes(sec.lang)) {
        warnAt(file, L.inLesson(lessonId, `lang: '${sec.lang}'`), `${where} lang=${sec.lang} 不在约定清单（${CODE_LANGS.join('/')}）`);
      }
      break;
    case 'compare':
    case 'table':
      need(Array.isArray(sec.head) && sec.head.length >= 1, '缺少 head 表头', 'head:');
      need(Array.isArray(sec.rows) && sec.rows.length >= 1, '缺少 rows 或为空', 'rows:');
      if (Array.isArray(sec.rows)) {
        sec.rows.forEach((r, i) => {
          if (!Array.isArray(r)) {
            at(file, L.inLesson(lessonId, 'rows:'), `${where}.rows[${i}] 不是数组`);
          } else if (r.length < 1) {
            at(file, L.inLesson(lessonId, 'rows:'), `${where}.rows[${i}] 长度为 0`);
          } else if (Array.isArray(sec.head) && sec.head.length && r.length !== sec.head.length) {
            warnAt(file, L.inLesson(lessonId, 'rows:'), `${where}.rows[${i}] 列数 ${r.length} 与 head 列数 ${sec.head.length} 不一致`);
          }
        });
      }
      break;
    case 'diagram': {
      const svg = sec.svg;
      if (!isNonEmptyStr(svg)) {
        need(false, '缺少 svg', 'svg:');
        break;
      }
      if (!/<svg[\s>]/i.test(svg.trim())) at(file, L.inLesson(lessonId, 'svg:'), `${where} svg 未以 <svg 开头`);
      if (!/viewBox\s*=/i.test(svg)) at(file, L.inLesson(lessonId, 'svg:'), `${where} svg 缺少 viewBox（会导致缩放与坐标全错）`);
      break;
    }
    case 'img':
      need(isNonEmptyStr(sec.src), '缺少 src', 'src:');
      break;
    default:
      break;
  }
}

function checkQuiz(file, L, lessonId, quiz, qi) {
  const where = `${lessonId}.quiz[${qi}]`;
  const optLine = L.inLesson(lessonId, 'options:');
  if (!quiz || typeof quiz !== 'object') {
    at(file, 0, `${where} 不是对象`);
    return;
  }
  if (!isNonEmptyStr(quiz.q)) at(file, L.inLesson(lessonId, 'q:'), `${where} 缺少题干 q`);
  if (!Array.isArray(quiz.options) || quiz.options.length < 2) {
    at(file, optLine, `${where} options 必须为数组且至少 2 个选项`);
    return;
  }
  const ans = quiz.answer;
  if (!Number.isInteger(ans)) {
    at(file, L.inLesson(lessonId, 'answer:'), `${where} answer 必须是整数，实际 ${JSON.stringify(ans)}`);
  } else if (ans < 0 || ans >= quiz.options.length) {
    at(file, L.inLesson(lessonId, 'answer:'), `${where} answer=${ans} 越界（合法范围 0~${quiz.options.length - 1}）`);
  }
  if (!isNonEmptyStr(quiz.explain)) at(file, L.inLesson(lessonId, 'explain:'), `${where} 缺少 explain 解析`);
  quiz.options.forEach((o, i) => {
    if (!isNonEmptyStr(o)) at(file, optLine, `${where}.options[${i}] 不是非空字符串`);
  });
}

function checkModuleSchema(file, m, lines) {
  const L = makeLocator(lines);
  const required = ['id', 'order', 'title', 'subtitle', 'phase', 'phaseName', 'icon', 'cover', 'minutes', 'summary'];
  for (const k of required) {
    const v = m[k];
    const ok = k === 'order' || k === 'minutes' ? Number.isFinite(v) && v > 0 : isNonEmptyStr(v);
    if (!ok) at(file, lineOf(lines, `${k}:`), `module.${k} 缺失或类型不对（实际 ${JSON.stringify(v)}）`);
  }
  if (isNonEmptyStr(m.id) && !/^m\d{2}$/.test(m.id)) {
    at(file, lineOf(lines, 'id:'), `module.id 格式应为 mXX，实际 ${JSON.stringify(m.id)}`);
  }
  if (isNonEmptyStr(m.phase) && !PHASES.includes(m.phase)) {
    at(file, lineOf(lines, 'phase:'), `module.phase=${JSON.stringify(m.phase)} 不在 ${PHASES.join('/')} 内`);
  }
  if (!Number.isInteger(m.order)) {
    at(file, lineOf(lines, 'order:'), `module.order 必须是整数，实际 ${JSON.stringify(m.order)}`);
  }

  // flashcards：plan.md §4 目标 10 张，底线 8 张
  if (!Array.isArray(m.flashcards)) {
    at(file, lineOf(lines, 'flashcards:'), 'module.flashcards 必须是数组');
  } else if (m.flashcards.length < 8) {
    at(file, lineOf(lines, 'flashcards:'), `flashcards 仅 ${m.flashcards.length} 张，低于底线 8 张`);
  } else if (m.flashcards.length < 10) {
    warnAt(file, lineOf(lines, 'flashcards:'), `flashcards ${m.flashcards.length} 张，未达 plan.md §4 目标 10 张`);
  } else {
    pass(rel(file), `flashcards ${m.flashcards.length} 张`);
  }
  if (Array.isArray(m.flashcards)) {
    m.flashcards.forEach((c, i) => {
      const w = `${m.id}.flashcards[${i}]`;
      if (!c || typeof c !== 'object') {
        at(file, lineOf(lines, 'flashcards:'), `${w} 不是对象`);
        return;
      }
      for (const k of ['front', 'back', 'tag']) {
        if (!isNonEmptyStr(c[k])) at(file, lineOf(lines, `${k}:`), `${w} 缺少 ${k}`);
      }
    });
  }

  if (!Array.isArray(m.lessons) || m.lessons.length === 0) {
    at(file, lineOf(lines, 'lessons:'), 'module.lessons 必须是非空数组');
    return;
  }
  const seen = new Set();
  let sum = 0;
  m.lessons.forEach((l, i) => {
    const w = `${m.id}.lessons[${i}]`;
    if (!l || typeof l !== 'object') {
      at(file, 0, `${w} 不是对象`);
      return;
    }
    const lid = l.id;
    if (!isNonEmptyStr(lid)) {
      at(file, 0, `${w} 缺少 id`);
    } else {
      if (seen.has(lid)) at(file, L.inLesson(lid, `'${lid}'`), `${w} 课程 id 重复：${lid}`);
      seen.add(lid);
      if (!/^m\d{2}-l\d{2}$/.test(lid)) {
        at(file, lineOf(lines, `'${lid}'`), `${w} id 格式应为 mXX-lNN，实际 ${lid}`);
      } else if (isNonEmptyStr(m.id) && !lid.startsWith(m.id + '-')) {
        at(file, lineOf(lines, `'${lid}'`), `${w} id 前缀与模块不匹配：模块 ${m.id} 的课程用了 ${lid}`);
      }
    }
    if (!isNonEmptyStr(l.title)) at(file, lid ? L.inLesson(lid, 'title:') : 0, `${w} 缺少 title`);
    if (!Number.isFinite(l.minutes) || l.minutes <= 0) {
      at(file, lid ? L.inLesson(lid, 'minutes:') : 0, `${w} minutes 必须为正数，实际 ${JSON.stringify(l.minutes)}`);
    } else sum += l.minutes;
    if (!isNonEmptyStr(l.goal)) at(file, lid ? L.inLesson(lid, 'goal:') : 0, `${w} 缺少 goal 学习目标`);

    if (!Array.isArray(l.sections) || l.sections.length === 0) {
      at(file, lid ? L.inLesson(lid, 'sections:') : 0, `${w} sections 必须是非空数组`);
    } else {
      l.sections.forEach((s, si) => checkSection(file, L, lid || w, si, s));
    }
    if (!Array.isArray(l.quiz)) {
      warnAt(file, lid ? L.inLesson(lid, 'quiz:') : 0, `${w} 缺少 quiz 数组`);
    } else if (l.quiz.length < 3) {
      warnAt(file, lid ? L.inLesson(lid, 'quiz:') : 0, `${w} quiz 仅 ${l.quiz.length} 题，少于 3 题（brief 允许 warn）`);
    } else {
      l.quiz.forEach((q, qi) => checkQuiz(file, L, lid || w, q, qi));
    }
  });
  console.log(
    `  —— ${rel(file)}：${m.id} / ${m.lessons.length} 课 / ` +
      `${m.lessons.reduce((n, l) => n + (l?.sections?.length || 0), 0)} sections / ` +
      `${m.lessons.reduce((n, l) => n + (l?.quiz?.length || 0), 0)} 题 / 计划 ${sum} 分钟`
  );
}

async function checkSchema() {
  section('检查 2 / 数据 Schema 契约（plan.md §4）');
  const loaded = [];
  for (const { id, file } of EXPECTED_MODULES) {
    const full = path.join(DATA_DIR, file);
    if (!exists(full)) {
      warn(rel(full), `数据文件尚未落盘（${id}），跳过其 Schema 与 SVG 检查`);
      continue;
    }
    const lines = readLines(full);
    const { mod, error } = await importModule(full);
    if (error) {
      at(full, 0, `动态 import 失败：${error}`);
      continue;
    }
    loaded.push({ id, file: full, mod, lines });
    const before = stats.fail;
    checkModuleSchema(full, mod, lines);
    if (stats.fail === before) pass(rel(full), `Schema 契约通过（${mod.id}）`);
  }
  return loaded;
}

/* ============================ 检查 3：资源引用完整性 ============================ */

const ASSET_RE = /['"`(](\/?assets\/[A-Za-z0-9_\-./]+\.(?:png|jpg|jpeg|gif|svg|webp|css|js|json|woff2?|ico))\b/g;

function checkAssets() {
  section('检查 3 / 资源引用完整性');
  const scanFiles = [
    ...walk(path.join(ROOT, 'js'), (f) => f.endsWith('.js')),
    ...walk(path.join(ROOT, 'css'), (f) => f.endsWith('.css')),
    ...(exists(INDEX_HTML) ? [INDEX_HTML] : []),
  ];
  if (!scanFiles.length) warn(rel(ROOT), '未找到可扫描的源文件');
  const referenced = new Set();
  let broken = 0;
  for (const f of scanFiles) {
    readLines(f).forEach((line, i) => {
      ASSET_RE.lastIndex = 0;
      let m;
      while ((m = ASSET_RE.exec(line))) {
        const raw = m[1];
        referenced.add(raw.replace(/^\//, '').split('/').pop());
        if (!exists(path.join(ROOT, raw.replace(/^\//, '')))) {
          broken++;
          at(f, i + 1, `引用的资源不存在：${raw}`);
        }
      }
    });
  }
  if (!broken) pass('assets', `${scanFiles.length} 个源文件中的 assets 引用全部存在`);

  if (!exists(IMG_DIR)) {
    warn(rel(IMG_DIR), '图片目录不存在，跳过反向核对');
    return;
  }
  // 安卓壳工程（xml/kt 等）也会引用同一批素材，一并纳入反向核对
  const shellRefs = new Set();
  if (exists(SHELL_DIR)) {
    for (const f of walk(SHELL_DIR, (p) => /\.(xml|kt|java|gradle|kts|md|json)$/i.test(p))) {
      for (const m of readText(f).matchAll(/android-icon-foreground|assets\/img\/[A-Za-z0-9_.-]+/g)) {
        shellRefs.add(m[0].split('/').pop());
      }
    }
  }
  const imgs = fs.readdirSync(IMG_DIR).filter((n) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(n)).sort();
  const orphans = [];
  for (const n of imgs) {
    if (IMG_EXEMPT.has(n)) {
      pass(rel(path.join(IMG_DIR, n)), '豁免文件，不要求正文引用');
      continue;
    }
    if (!referenced.has(n)) orphans.push(n);
  }
  for (const n of orphans) {
    const p = path.join(IMG_DIR, n);
    if (shellRefs.has(n)) warnAt(p, 0, `仅被安卓壳工程引用，H5 应用 ${rel(ROOT)} 内无引用（若非刻意为之请确认是否漏引）`);
    else at(p, 0, '图片存在但未被任何源文件引用（反向核对未通过，会造成"素材白生成"）');
  }
  if (imgs.length !== EXPECTED_IMG_COUNT) {
    warnAt(IMG_DIR, 0, `图片 ${imgs.length} 张，plan.md §1 约定 ${EXPECTED_IMG_COUNT} 张`);
  } else if (!orphans.length) {
    pass(rel(IMG_DIR), `图片 ${imgs.length} 张全部被引用`);
  }
}

/* ============================ 检查 4：跨引用一致性 ============================ */

async function checkCrossRef() {
  section('检查 4 / 跨引用一致性（index.js ↔ 数据文件）');
  const indexFile = path.join(DATA_DIR, 'index.js');
  if (!exists(indexFile)) {
    at(indexFile, 0, '模块注册表 index.js 缺失');
    return [];
  }
  const { mod: reg, error } = await importAny(indexFile);
  if (error) {
    at(indexFile, 0, `index.js 导入失败：${error}`);
    return [];
  }
  const meta = reg.MODULE_META;
  if (!Array.isArray(meta) || !meta.length) {
    at(indexFile, 0, 'index.js 未导出非空 MODULE_META 数组');
    return [];
  }
  const idxLines = readLines(indexFile);

  const regIds = new Set();
  meta.forEach((m, i) => {
    if (!isNonEmptyStr(m.id)) at(indexFile, lineOf(idxLines, 'MODULE_META'), `MODULE_META[${i}] 缺少 id`);
    if (regIds.has(m.id)) at(indexFile, lineOf(idxLines, `id: '${m.id}'`), `MODULE_META 中模块 id 重复：${m.id}`);
    regIds.add(m.id);
    if (!isNonEmptyStr(m.file)) {
      at(indexFile, lineOf(idxLines, 'file:'), `MODULE_META[${i}]（${m.id}）缺少 file 字段`);
    } else if (!exists(path.join(DATA_DIR, m.file))) {
      warnAt(indexFile, lineOf(idxLines, `file: '${m.file}'`), `MODULE_META 引用的数据文件不存在：${m.file}`);
    }
  });
  const regOrder = meta.map((m) => m.id);

  const loaded = [];
  for (let i = 0; i < EXPECTED_MODULES.length; i++) {
    const exp = EXPECTED_MODULES[i];
    const full = path.join(DATA_DIR, exp.file);
    if (!exists(full)) {
      warn(rel(full), `数据文件尚未落盘（${exp.id}），跳过 order 核对`);
      continue;
    }
    const lines = readLines(full);
    const { mod, error } = await importModule(full);
    if (error) {
      at(full, 0, `动态 import 失败：${error}`);
      continue;
    }
    loaded.push({ id: exp.id, file: full, mod, lines });
    if (mod.id !== exp.id) {
      at(full, lineOf(lines, 'id:'), `文件 ${exp.file} 的 module.id=${JSON.stringify(mod.id)}，与文件名约定的 ${exp.id} 不符`);
    }
    if (mod.order !== i + 1) {
      at(full, lineOf(lines, 'order:'), `module.order=${mod.order}，注册表第 ${i + 1} 位期望 ${i + 1}（不一致会导致首页排序错乱）`);
    }
    const pos = regOrder.indexOf(mod.id);
    if (pos < 0) at(full, 0, `模块 ${mod.id} 未在 index.js MODULE_META 中注册`);
    else if (pos !== i) at(full, lineOf(lines, 'order:'), `模块 ${mod.id} 在注册表中位于第 ${pos + 1} 位，与其 order=${mod.order} 不一致`);
  }

  // 全部课程 id 全局唯一
  const allLessons = new Map();
  for (const l of loaded) {
    for (const les of l.mod.lessons || []) {
      if (!isNonEmptyStr(les.id)) continue;
      if (allLessons.has(les.id)) {
        at(l.file, lineOf(l.lines, `'${les.id}'`), `课程 id 全局重复：${les.id}（已出现于 ${rel(allLessons.get(les.id))}）`);
      } else allLessons.set(les.id, l.file);
    }
  }
  // 题池规模统计：刷题 Tab 的题池直接依赖这个数字，逐模块列出便于人工核对
  const quizParts = loaded.map((l) => `${path.basename(l.file, '.js').slice(0, 3)}=${(l.mod.lessons || []).reduce((n, x) => n + (Array.isArray(x?.quiz) ? x.quiz.length : 0), 0)}`);
  const totalQuiz = loaded.reduce((n, l) => n + (l.mod.lessons || []).reduce((m, x) => m + (Array.isArray(x?.quiz) ? x.quiz.length : 0), 0), 0);
  const offSpec = loaded.flatMap((l) =>
    (l.mod.lessons || []).filter((x) => !Array.isArray(x?.quiz) || x.quiz.length !== 3).map((x) => ({ file: l.file, mod: l.id, id: (x && x.id) || '?', n: Array.isArray(x?.quiz) ? x.quiz.length : 0 }))
  );
  console.log(`  —— 注册 ${regOrder.length} 个模块，已落盘 ${loaded.length} 个数据文件，课程 id 共 ${allLessons.size} 个`);
  console.log(`  —— 题池：${quizParts.join(' ')} | 合计 ${totalQuiz} 题（plan.md §4 要求每课 3 题）`);
  for (const s of offSpec) at(s.file, 0, `课程 ${s.id} quiz 只有 ${s.n} 题（应为 3 题），刷题 Tab 题池规模与验收标准将不符`);
  if (!allLessons.size) warn('data', '未能读到任何课程 id（数据文件可能都还没落盘）');
  return loaded;
}

/* ============================ 检查 5 & 7：SVG ============================ */

const SVG_EVENT_RE = /\son[a-z]+\s*=\s*["']/i;

function checkSvg(loaded) {
  section('检查 5 / SVG 安全抽查（<script> / on* 事件属性 / viewBox）');
  section('检查 7 / SVG marker 引用完整性（悬空 url(#id) → 箭头不渲染）');
  let svgs = 0;
  let unsafe = 0;
  let dangling = 0;

  for (const { file, mod } of loaded) {
    const lines = readLines(file);
    for (const les of mod.lessons || []) {
      (les.sections || []).forEach((sec, si) => {
        if (!sec || sec.type !== 'diagram' || !isNonEmptyStr(sec.svg)) return;
        svgs++;
        const svg = sec.svg;
        const where = `${les.id}.sections[${si}]`;
        const ln = makeLocator(lines).inLesson(les.id, 'svg:');

        if (/<script[\s>]/i.test(svg)) {
          unsafe++;
          at(file, ln, `${where} svg 含 <script> 标签（禁止，存在 XSS 风险）`);
        }
        const ev = svg.match(SVG_EVENT_RE);
        if (ev) {
          unsafe++;
          at(file, ln, `${where} svg 含事件属性 ${ev[0].trim()}（禁止，innerHTML 插入时仍会被激活）`);
        }
        if (/javascript\s*:/i.test(svg)) {
          unsafe++;
          at(file, ln, `${where} svg 含 javascript: 协议`);
        }
        if (!/viewBox\s*=/i.test(svg)) {
          unsafe++;
          at(file, ln, `${where} svg 缺少 viewBox`);
        }

        // 检查 7：收集同图内已定义 id 与 url(#id) 引用，检出悬空
        const defined = new Set();
        for (const m of svg.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)) defined.add(m[1]);
        const refs = new Map();
        for (const m of svg.matchAll(/url\(\s*#([^)\s]+)\s*\)/g)) refs.set(m[1], (refs.get(m[1]) || 0) + 1);
        for (const [id, count] of refs) {
          if (!defined.has(id)) {
            dangling++;
            at(file, ln, `${where} svg 引用了未定义的 url(#${id})（悬空 marker/渐变，箭头不渲染，共 ${count} 处）`);
          }
        }
        for (const id of defined) {
          if (/^(marker|arr)/i.test(id) && !refs.has(id)) {
            warnAt(file, ln, `${where} svg 定义了箭头 marker #${id} 却无任何 url(#${id}) 引用（疑似复制残留）`);
          }
        }
      });
    }
  }
  if (!unsafe) pass('svg', `diagram svg 共 ${svgs} 个：无 <script> / 事件属性 / 全部含 viewBox`);
  if (!dangling) pass('svg', `diagram svg 共 ${svgs} 个：url(#id) 引用全部有对应定义`);
  if (!svgs) warn('svg', '未发现 diagram svg（plan.md §5 要求每模块至少 1 个图解）');
}

/* ============================ 检查 6：版本红线 ============================ */

/**
 * 版本红线（本项目最关键的内容正确性检查）。
 *
 * 难点：这些旧写法在教学材料里会**合法**出现两种形态——
 *   a) quiz 的错误选项（干扰项）：'javax.validation.*' 摆在 options 里，answer 指向 jakarta 那个；
 *   b) 纠错讲解："Boot 2 的写法是 xxx，Boot 3 会报错" / "沿用旧写法会不生效"。
 * 裸 grep 会产生十几条误报，反而淹没真问题。
 *
 * 因此本检查**基于已解析的数据对象**（而非源码行）判定，语义更准：
 *   1. 命中位置是 quiz.options[k]：
 *        - k === answer  → 说明"把旧写法标成了正确答案"，教错了 → FAIL
 *        - 否则           → 合法干扰项，放行
 *   2. 命中位置是 code 块的**注释行**（//、#、&lt;!-- --&gt;）→ 在讲坑，放行
 *   3. 命中位置所在字符串（整段 html / code / explain / flashcard 背面）含
 *      否定语境词（"旧"、"报错"、"不生效"、"Boot 2"、"别用"…）或同时出现
 *      正确 modern 写法 → 在讲坑，放行
 *   4. 其余（代码块里正面推荐旧写法、正文断言旧写法）→ FAIL 并给出行号
 *
 * 行号回溯：数据对象没有行号，用「所属课程 id / 所属 section 类型 / 选项序号」
 * 在源码里反查，得到可点击的行号定位。
 */
const RED_LINES = [
  { id: 'RL1', re: /javax\.servlet/gi, label: 'javax.servlet.*', right: 'jakarta.servlet.*（Boot 3 已迁移到 Jakarta 命名空间）' },
  { id: 'RL2', re: /javax\.validation/gi, label: 'javax.validation.*', right: 'jakarta.validation.constraints.*' },
  {
    id: 'RL3',
    // 同时覆盖三种形态：spring.redis.host（点号，properties/正文）、
    // 以及 YAML 嵌套的 spring: → redis:（中间没有 data: 层）
    re: /spring\s*:\s*\n\s*redis\s*:|spring\.redis\./gi,
    label: 'spring.redis.*',
    right: 'spring.data.redis.*',
  },
  { id: 'RL4', re: /mybatis-plus-boot-starter/gi, label: 'mybatis-plus-boot-starter', right: 'mybatis-plus-spring-boot3-starter（Boot 3 专用）' },
  { id: 'RL5', re: /com\.mysql\.jdbc\.Driver/gi, label: 'com.mysql.jdbc.Driver', right: 'com.mysql.cj.jdbc.Driver' },
];

/** 否定/纠错语境词：所在字符串含其一即视为"在讲这个坑"，不判 FAIL */
const NEGATION_HINTS = [
  '旧', '老教程', '老资料', 'Boot 2', 'boot 2', '2.x', '报错', '不生效', '编译不过', '会失败',
  '已改', '改成', '不是', '别用', '不要用', '不能用', '千万别', '会导致', '坑', '反例', '过时',
  '迁移', 'jakarta', '找不到', '废弃', 'deprecated', '写错', '抄旧', '失效', '已全面迁移',
];
/** 所在字符串同时出现正确 modern 写法 → 对比讲解，放行 */
const MODERN_HINTS = [
  'jakarta.servlet', 'jakarta.validation', 'spring.data.redis', 'mybatis-plus-spring-boot3-starter',
  'com.mysql.cj.jdbc.Driver', 'mysql-connector-j', 'spring:\n  data:',
];

/** 命中规则：返回第一条命中的规则，无命中返回 null */
function matchRedLine(text) {
  for (const rule of RED_LINES) {
    rule.re.lastIndex = 0;
    if (rule.re.test(text)) return rule;
  }
  return null;
}

/** 整段字符串是否处于"否定/纠错语境" */
function isNegated(text) {
  return NEGATION_HINTS.some((h) => text.includes(h)) || MODERN_HINTS.some((h) => text.includes(h));
}

/**
 * 判断 code 块里某个命中位置是否落在注释上（在讲坑）。
 * 支持 // 行注释、# 行注释(yaml/properties/shell)、&lt;!-- --&gt; 块注释。
 */
function isCommentAt(code, idx) {
  const lineStart = code.lastIndexOf('\n', idx) + 1;
  const line = code.slice(lineStart, idx);
  return /(^|\s)(\/\/|#)\s/.test(line) || /<!--/.test(code.slice(Math.max(0, idx - 200), idx));
}

/** 在源码中为红线命中反查行号 */
function locateRedLine(lines, lessonId, where) {
  const L = makeLocator(lines);
  if (!lessonId) return lineOf(lines, 'phase:');
  let ln = 0;
  if (where && where.sectionType) ln = L.inLesson(lessonId, `type: '${where.sectionType}'`);
  if (!ln && where && where.sectionIndex != null) ln = L.inLesson(lessonId, 'sections:');
  if (!ln) ln = L.inLesson(lessonId, 'code:') || L.inLesson(lessonId, 'html:');
  if (!ln) ln = lineOf(lines, `'${lessonId}'`);
  return ln;
}

function checkRedLines(loaded) {
  section('检查 6 / 版本红线（Boot 3 / MySQL 8 正确写法）');
  if (!loaded.length) {
    warn(rel(DATA_DIR), '无可用的数据文件，跳过版本红线检查');
    return;
  }
  let hits = 0;
  let realFail = 0;

  for (const { file, mod } of loaded) {
    const lines = readLines(file);
    const report = (rule, msg, lessonId, where) => {
      realFail++;
      at(file, locateRedLine(lines, lessonId, where), `[${rule.id}] ${msg}（正确应为 ${rule.right}）`);
    };

    // 6.1 flashcards：正面/back 直接断言旧写法 → FAIL
    (mod.flashcards || []).forEach((c) => {
      if (!c || typeof c !== 'object') return;
      for (const k of ['front', 'back']) {
        if (!isNonEmptyStr(c[k])) continue;
        const rule = matchRedLine(c[k]);
        if (!rule) continue;
        hits++;
        if (!isNegated(c[k])) report(rule, `flashcard.${k} 把旧写法 ${rule.label} 当作正确内容`, null, null);
      }
    });

    for (const les of mod.lessons || []) {
      if (!les || typeof les !== 'object') continue;
      const lid = isNonEmptyStr(les.id) ? les.id : null;

      // 6.2 sections
      (les.sections || []).forEach((sec, si) => {
        if (!sec || typeof sec !== 'object') return;
        const where = { sectionType: sec.type, sectionIndex: si };
        const texts = [];
        if (isNonEmptyStr(sec.code)) texts.push(['code', sec.code]);
        if (isNonEmptyStr(sec.html)) texts.push(['html', sec.html]);
        if (isNonEmptyStr(sec.caption)) texts.push(['caption', sec.caption]);
        if (Array.isArray(sec.items)) texts.push(['items', sec.items.join('\n')]);
        for (const [field, text] of texts) {
          const rule = matchRedLine(text);
          if (!rule) continue;
          hits++;
          rule.re.lastIndex = 0;
          let m;
          while ((m = rule.re.exec(text))) {
            if (sec.type === 'code' && isCommentAt(text, m.index)) continue; // 注释里在讲坑
            if (isNegated(text)) continue; // 整段在讲坑 / 对比
            report(rule, `${lid || '?'}.sections[${si}] (type=${sec.type}) 的 ${field} 出现旧写法 ${rule.label}`, lid, where);
            break; // 同一字段同类问题只报一次，避免刷屏
          }
        }
      });

      // 6.3 quiz：只有"正确答案就是旧写法"才是错；干扰项合法
      (les.quiz || []).forEach((q, qi) => {
        if (!q || !Array.isArray(q.options)) return;
        q.options.forEach((opt, oi) => {
          if (!isNonEmptyStr(opt)) return;
          const rule = matchRedLine(opt);
          if (!rule) return;
          if (q.answer === oi) {
            hits++;
            report(rule, `${lid || '?'}.quiz[${qi}] 的**正确答案**（answer=${oi}）就是旧写法 ${rule.label}，等于教错了`, lid, { sectionType: 'quiz' });
          }
          // 其余为干扰项，合法，不计数
        });
        // explain 属于解析，若无否定语境却在正面推荐旧写法 → FAIL
        if (isNonEmptyStr(q.explain)) {
          const rule = matchRedLine(q.explain);
          if (rule) {
            if (!isNegated(q.explain)) report(rule, `${lid || '?'}.quiz[${qi}].explain 正面推荐了旧写法 ${rule.label}`, lid, { sectionType: 'quiz' });
          }
        }
      });

      // 6.4 lesson 级字段
      if (isNonEmptyStr(les.goal)) {
        const rule = matchRedLine(les.goal);
        if (rule && !isNegated(les.goal)) report(rule, `${lid || '?'}.goal 出现旧写法 ${rule.label}`, lid, null);
      }
    }
  }

  if (!realFail) {
    pass('redline', `扫描 ${loaded.length} 个数据文件：${hits} 处旧写法关键词命中，均为合法干扰项或纠错讲解，无红线问题`);
  } else {
    console.log(`  —— 关键词命中 ${hits} 处，其中 ${realFail} 处为真实红线问题（详见失败清单）`);
  }
}

/* ============================ 主流程 ============================ */

async function main() {
  console.log('Java 后端学习 App · 静态校验');
  console.log(`根目录：${ROOT}`);
  console.log(`Node  ：${process.version}`);

  checkSyntax();
  const schemaLoaded = await checkSchema();
  checkAssets();
  const crossLoaded = await checkCrossRef();
  const all = crossLoaded.length ? crossLoaded : schemaLoaded;
  checkSvg(all);
  checkRedLines(all);

  console.log('\n================ 汇总 ================');
  if (failures.length) {
    console.log(`失败清单（${failures.length} 项）：`);
    failures.forEach((l) => console.log(`  ${l}`));
  }
  if (warnings.length) {
    console.log(`警告清单（${warnings.length} 项）：`);
    warnings.forEach((l) => console.log(`  ${l}`));
  }
  console.log(`TOTAL: ${stats.pass} pass, ${stats.fail} fail, ${stats.warn} warn`);
  process.exit(stats.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[FAIL] validate.js 自身异常：', e);
  process.exit(2);
});
