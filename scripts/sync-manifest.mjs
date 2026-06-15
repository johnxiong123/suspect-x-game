// 扫描 assets/images/ 下的图片，把对应资产的 src 回填进 assets/manifest.json
// 用法：node scripts/sync-manifest.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'assets/manifest.json');
const imagesDir = join(root, 'assets/images');
const EXTS = ['png', 'jpg', 'jpeg', 'webp', 'avif'];

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const files = existsSync(imagesDir) ? readdirSync(imagesDir) : [];
const fileSet = new Set(files);

let updated = 0;
let matched = 0;
const missing = [];
for (const id of Object.keys(manifest.images)) {
  const hit = EXTS.map((e) => `${id}.${e}`).find((f) => fileSet.has(f));
  if (hit) {
    matched += 1;
    const src = `assets/images/${hit}`;
    if (manifest.images[id].src !== src) { manifest.images[id].src = src; updated += 1; }
  } else {
    missing.push(id);
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`匹配 ${matched} / ${Object.keys(manifest.images).length} 项，更新 ${updated} 个 src（images/ 下 ${files.length} 个文件）`);
if (missing.length) console.log(`未找到图片的资产（仍用占位）：${missing.join(', ')}`);
