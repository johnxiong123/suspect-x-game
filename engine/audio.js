// 背景音乐播放器：按曲目 id 循环播放，音量/静音控制。
// 音频文件缺失时静默（不报错）。曲目清单见 assets/audio.json。

let manifest = { tracks: {} };
let audioEl = null;
let current = null;
let volume = 0.6;
let muted = false;

export async function loadAudioManifest() {
  try {
    const r = await fetch('assets/audio.json', { cache: 'no-store' });
    if (r.ok) manifest = await r.json();
  } catch { /* 无清单则静默 */ }
  if (!manifest.tracks) manifest.tracks = {};
  return manifest;
}

function ensureEl() {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.loop = true;
  }
  audioEl.volume = muted ? 0 : volume;
  return audioEl;
}

// 切换并播放曲目；曲目无 src 时停止（静默）
export function playTrack(id) {
  const track = manifest.tracks[id];
  if (!track || !track.src) { current = id; stop(); return; }
  if (current === id && audioEl && !audioEl.paused) return;
  current = id;
  const a = ensureEl();
  if (a.getAttribute('src') !== track.src) a.src = track.src;
  a.volume = muted ? 0 : volume;
  a.play().catch(() => { /* 自动播放被拦截，待用户手势后 resume() */ });
}

export function stop() { if (audioEl) audioEl.pause(); }

// 用户首次交互后调用，补放被浏览器拦截的自动播放
export function resume() {
  if (audioEl && audioEl.paused && current && manifest.tracks[current]?.src) {
    audioEl.play().catch(() => {});
  }
}

export function setVolume(v) { volume = Math.max(0, Math.min(1, v)); if (audioEl) audioEl.volume = muted ? 0 : volume; }
export function getVolume() { return volume; }
export function setMuted(m) { muted = !!m; if (audioEl) audioEl.volume = muted ? 0 : volume; }
export function isMuted() { return muted; }
