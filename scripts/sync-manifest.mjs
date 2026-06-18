// 扫描 assets/images/（含子文件夹），把对应资产的 src 回填进 assets/manifest.json
// 文件名（去扩展名）= 资产 id。用法：node scripts/sync-manifest.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'assets/manifest.json');
const imagesDir = join(root, 'assets/images');
const EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif']);

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (EXTS.has(extname(name).toLowerCase())) out.push(p);
  }
  return out;
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const files = walk(imagesDir);

// id（文件名去扩展名）→ 相对项目根的路径（统一用 / 分隔）
const byId = new Map();
for (const p of files) {
  byId.set(basename(p, extname(p)), relative(root, p).split(/[\\/]/).join('/'));
}

let updated = 0;
let matched = 0;
const missing = [];
for (const id of Object.keys(manifest.images)) {
  const src = byId.get(id);
  if (src) {
    matched += 1;
    if (manifest.images[id].src !== src) { manifest.images[id].src = src; updated += 1; }
  } else {
    missing.push(id);
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`匹配 ${matched} / ${Object.keys(manifest.images).length} 项，更新 ${updated} 个 src（扫描到 ${files.length} 个图片，含子文件夹）`);
if (missing.length) console.log(`未找到图片的资产（仍用占位）：${missing.join(', ')}`);
