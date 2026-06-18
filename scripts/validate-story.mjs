// 校验剧情数据：节点跳转、bg/cg 资源、线索 id 引用是否都有效。
// 用法：node scripts/validate-story.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const errors = [];
const warns = [];

const manifest = read('assets/manifest.json');
const assetIds = new Set(Object.keys(manifest.images));
const clueIds = new Set(read('data/clues.json').map((c) => c.id));
const endingIds = new Set(read('data/endings.json').map((e) => e.id));

const chaptersDir = join(root, 'data/chapters');
const files = readdirSync(chaptersDir).filter((f) => f.endsWith('.json')).sort();

const chapters = {};
for (const f of files) {
  try { chapters[f.replace('.json', '')] = read(`data/chapters/${f}`); }
  catch (e) { errors.push(`${f}: JSON 解析失败 - ${e.message}`); }
}

// 全局节点 id 集合（跨章节跳转用）
const allNodes = new Set();
for (const ch of Object.values(chapters)) for (const id of Object.keys(ch.nodes || {})) allNodes.add(id);

for (const [chId, ch] of Object.entries(chapters)) {
  if (ch.meta?.id !== chId) warns.push(`${chId}: meta.id="${ch.meta?.id}" 与文件名不一致`);
  if (!ch.nodes?.[ch.start]) errors.push(`${chId}: start 节点 "${ch.start}" 不存在`);

  for (const [nid, node] of Object.entries(ch.nodes || {})) {
    const where = `${chId}/${nid}`;
    if (node.bg && !assetIds.has(node.bg)) errors.push(`${where}: bg "${node.bg}" 不在 manifest`);
    if (node.cg && !assetIds.has(node.cg)) errors.push(`${where}: cg "${node.cg}" 不在 manifest`);

    const cluesOf = (eff) => eff?.clues || [];
    for (const c of cluesOf(node.onEnter)) if (!clueIds.has(c)) errors.push(`${where}: onEnter 线索 "${c}" 未定义`);

    const targets = [];
    if (node.next) targets.push(node.next);
    for (const ch2 of node.choices || []) {
      if (ch2.goto) targets.push(ch2.goto);
      for (const c of cluesOf(ch2.effects)) if (!clueIds.has(c)) errors.push(`${where}: choice 线索 "${c}" 未定义`);
    }
    for (const br of node.branches || []) if (br.goto) targets.push(br.goto);
    for (const t of targets) if (!allNodes.has(t)) errors.push(`${where}: 跳转目标 "${t}" 不存在`);

    if (node.ending && !endingIds.has(node.ending.id)) warns.push(`${where}: ending "${node.ending.id}" 不在 endings.json`);

    const exits = (node.next ? 1 : 0) + ((node.choices || []).length ? 1 : 0)
      + ((node.branches || []).length ? 1 : 0) + (node.ending ? 1 : 0) + (node.chapterEnd ? 1 : 0);
    if (exits === 0) errors.push(`${where}: 节点没有任何出口（next/choices/branches/ending/chapterEnd）`);
  }
}

console.log(`章节: ${files.join(', ')}`);
console.log(`节点总数: ${allNodes.size} | 资源: ${assetIds.size} | 线索: ${clueIds.size} | 结局: ${endingIds.size}`);
if (warns.length) console.log('\n⚠ 警告:\n  ' + warns.join('\n  '));
if (errors.length) { console.log('\n✗ 错误:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('\n✓ 全部引用有效');
