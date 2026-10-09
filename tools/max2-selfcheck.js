// tools/max2-selfcheck.js —— Max-2 交付自检脚本（一次性校验，不属于 App 运行时）
// 用法：node tools/max2-selfcheck.js
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'java-learning-app', 'js', 'data');
const files = ['m01-idea.js', 'm02-maven.js', 'm03-java.js', 'm04-springboot.js'];

const VALID_SECTION = new Set(['text', 'steps', 'code', 'compare', 'table', 'diagram', 'img', 'tip', 'warn', 'fe']);
const problems = [];
const totals = { lessons: 0, quiz: 0, code: 0, diagram: 0, table: 0, compare: 0, sections: 0, flashcards: 0, words: 0 };
let rawBytes = 0;

// 红线词扫描：这些字符串出现在课程数据里即为版本/合规问题
// 注：正文里会故意提到「旧写法 → 新写法」的迁移说明（如 mysql-connector-java 改成了
// mysql-connector-j），所以对这类词只检查代码块内是否真的用了旧写法。
const FORBIDDEN = [
  { re: /javax\./, why: 'Spring Boot 3 必须用 jakarta.*' },
  { re: /spring\.redis\./, why: 'Boot 3 的 Redis 前缀是 spring.data.redis.*' },
  { re: /试用重置|激活码|破解版|绿色版|永久授权/, why: '版权风险内容' },
];
const FORBIDDEN_IN_CODE = [
  { re: /com\.mysql\.jdbc\.Driver/, why: '驱动类名应为 com.mysql.cj.jdbc.Driver' },
  { re: /<artifactId>mysql-connector-java<\/artifactId>/, why: 'Boot 3 依赖坐标应为 mysql-connector-j' },
  { re: /import javax\./, why: 'Boot 3 应 import jakarta.*' },
];

for (const f of files) {
  const path = join(dataDir, f);
  const src = readFileSync(path, 'utf8');
  rawBytes += Buffer.byteLength(src, 'utf8');

  // 注：测验选项里会故意出现「错误答案」（如 javax.*、spring.redis.*），
// 因此红线扫描只作用于正文 sections 与闪卡，不扫描 quiz。

  const mod = (await import('file:///D:/AI学java的应用/java-learning-app/js/data/' + f)).module;
  const lessons = mod.lessons || [];
  totals.lessons += lessons.length;
  totals.flashcards += (mod.flashcards || []).length;

  if (!mod.id || !mod.order || !mod.title || !mod.subtitle || !mod.phase || !mod.phaseName
      || !mod.icon || !mod.cover || !mod.minutes || !mod.summary) {
    problems.push(`${f}: 模块顶层字段缺失`);
  }
  const sumMinutes = lessons.reduce((s, l) => s + (l.minutes || 0), 0);
  if (sumMinutes !== mod.minutes) problems.push(`${f}: minutes(${mod.minutes}) != 各课之和(${sumMinutes})`);

  (mod.flashcards || []).forEach((c, i) => {
    if (!c.front || !c.back || !c.tag) problems.push(`${f}: flashcard[${i}] 字段缺失`);
    if ([...c.front].length > 30) problems.push(`${f}: flashcard[${i}] front 超 30 字（${[...c.front].length}）`);
    if ([...c.back].length > 60) problems.push(`${f}: flashcard[${i}] back 超 60 字（${[...c.back].length}）`);
    for (const { re, why } of FORBIDDEN) {
      if (re.test(c.back + c.front) && !/不再|旧|改为|改用|Boot 2|Boot 3|迁/.test(c.back + c.front)) {
        problems.push(`${f}: flashcard[${i}] 命中红线 ${re} —— ${why}`);
      }
    }
  });

  const ids = new Set();
  lessons.forEach((l) => {
    if (ids.has(l.id)) problems.push(`${f}: 课程 id 重复 ${l.id}`);
    ids.add(l.id);
    if (!l.id || !l.title || !l.minutes || !l.goal) problems.push(`${f}/${l.id}: 课程字段缺失`);
    const secs = l.sections || [];
    totals.sections += secs.length;
    if (secs.length < 5) problems.push(`${f}/${l.id}: sections 仅 ${secs.length} 个（要求 ≥5）`);
    if (!(l.quiz || []).length || l.quiz.length < 2 || l.quiz.length > 3) {
      problems.push(`${f}/${l.id}: quiz 数量 ${(l.quiz || []).length}，要求 2~3（约定 3）`);
    }
    totals.quiz += (l.quiz || []).length;

    let hasFigure = false;
    for (const s of secs) {
      if (!VALID_SECTION.has(s.type)) problems.push(`${f}/${l.id}: 未知 section type ${s.type}`);
      // 红线扫描：正文里若出现旧写法，必须同时带有「迁移/不再/旧」等提示词
      const body = [s.html, s.title, s.caption, ...(Array.isArray(s.items) ? s.items : [])].filter(Boolean).join(' ');
      for (const { re, why } of FORBIDDEN) {
        if (re.test(body) && !/不再|旧写法|旧的是|改为|改用|Boot 2|Boot 3|迁|错的|不推荐/.test(body)) {
          problems.push(`${f}/${l.id}: section(${s.type}) 命中红线 ${re} —— ${why}`);
        }
      }
      if (s.type === 'code') {
        totals.code++;
        if (!s.code || !s.code.trim()) problems.push(`${f}/${l.id}: code 块内容为空`);
        for (const { re, why } of FORBIDDEN_IN_CODE) {
          if (re.test(s.code)) problems.push(`${f}/${l.id}: 代码块命中红线 ${re} —— ${why}`);
        }
      }
      if (s.type === 'diagram') {
        totals.diagram++;
        hasFigure = true;
        if (!/viewBox="0 0 680 \d+"/.test(s.svg || '')) problems.push(`${f}/${l.id}: SVG viewBox 不合规`);
        if (!/arr-m0\d/.test(s.svg || '')) problems.push(`${f}/${l.id}: SVG marker 缺少模块前缀`);
        if (!/^<svg/.test((s.svg || '').trim())) problems.push(`${f}/${l.id}: svg 字段应以 <svg 开头`);
      }
      if (s.type === 'table') { totals.table++; hasFigure = true; }
      if (s.type === 'compare') { totals.compare++; hasFigure = true; }
      if (s.type === 'text' && s.html) totals.words += (s.html.replace(/<[^>]+>/g, '').match(/[一-龥]/g) || []).length;
    }
    if (!hasFigure) problems.push(`${f}/${l.id}: 缺少图解（diagram/table/compare）`);
    if (f.startsWith('m03') && !secs.some((s) => s.type === 'compare')) {
      problems.push(`${f}/${l.id}: m03 每课必须有 compare 表`);
    }

    (l.quiz || []).forEach((q, i) => {
      if (!q.q || !Array.isArray(q.options) || q.options.length < 2) problems.push(`${f}/${l.id}: quiz[${i}] 结构不完整`);
      if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.options || []).length) {
        problems.push(`${f}/${l.id}: quiz[${i}] answer 越界`);
      }
      if (!q.explain) problems.push(`${f}/${l.id}: quiz[${i}] 缺少解析`);
    });
  });
}

console.log('=== Max-2 交付自检 ===');
console.log('文件数:', files.length, '| 课程数:', totals.lessons, '| 题目数:', totals.quiz,
  '| sections:', totals.sections, '| 代码段:', totals.code, '| 图解:', totals.diagram,
  '(table', totals.table + '/ compare', totals.compare + ')', '| 闪卡:', totals.flashcards,
  '| 正文中文字数(仅 text 段):', totals.words, '| 文件体积:', (rawBytes / 1024).toFixed(1) + 'KB');
if (problems.length) {
  console.log('\n发现 ' + problems.length + ' 个问题:');
  problems.forEach((p) => console.log('  - ' + p));
  process.exit(1);
}
console.log('\n全部通过，无问题。');