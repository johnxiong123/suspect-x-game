// 把一段音乐裁成可无缝循环的 BGM（取一段 + 尾->头交叉淡化，回到开头不"咯噔"）。
// 依赖 ffmpeg。
// 用法：node scripts/make-loop.mjs <输入文件> <输出名(不含扩展)> [循环秒数=45] [起始秒=2] [交叉淡化秒=3]
//   例：node scripts/make-loop.mjs "assets/audio/My Track.mp3" main 45
// 产出：assets/audio/<输出名>.mp3
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [input, outName, lenArg, startArg, xfArg] = process.argv.slice(2);
if (!input || !outName) {
  console.error('用法: node scripts/make-loop.mjs <输入> <输出名> [秒=45] [起始=2] [交叉淡化=3]');
  process.exit(1);
}
const len = Number(lenArg) || 45;
const start = Number(startArg) || 2;
const xf = Number(xfArg) || 3;
const out = join(root, 'assets/audio', `${outName}.mp3`);

const fc = [
  `[0]atrim=${start}:${start + len},asetpts=N/SR/TB[seg]`,
  `[seg]asplit=2[a][b]`,
  `[b]atrim=0:${xf},asetpts=N/SR/TB[head]`,
  `[a][head]acrossfade=d=${xf}:c1=tri:c2=tri[out]`,
].join(';');

try {
  execFileSync('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error', '-i', input,
    '-filter_complex', fc, '-map', '[out]', '-c:a', 'libmp3lame', '-q:a', '4', out,
  ], { stdio: 'inherit' });
  console.log(`✓ ${out}  (${len}s 循环, 交叉淡化 ${xf}s)`);
  console.log(`记得在 assets/audio.json 把对应曲目的 src 设为 "assets/audio/${outName}.mp3"`);
} catch (e) {
  console.error('ffmpeg 处理失败：', e.message);
  process.exit(1);
}
