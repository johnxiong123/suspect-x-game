// 文字音效：用 Web Audio 合成短促"嘀"声（打字机 blip），无需音频文件。
let ctx = null;
let enabled = true;
let lastT = 0;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
}

// 首次用户手势后解锁（浏览器要求）
export function unlock() {
  const c = ac();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function setEnabled(v) { enabled = !!v; }
export function isEnabled() { return enabled; }

// 播放一声打字"嗒"声：短促的带通滤波白噪声（非音调，像打字机/文字音），自带节流
export function blip() {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  const now = c.currentTime;
  if (now - lastT < 0.05) return; // 节流
  lastT = now;

  const dur = 0.022;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let k = 0; k < data.length; k++) data[k] = Math.random() * 2 - 1; // 白噪声

  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1400 + Math.random() * 300; // 轻微音色变化，避免机械重复
  bp.Q.value = 0.7;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.055, now + 0.002); // 极快起音
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);  // 快速衰减 → 干脆的"嗒"

  src.connect(bp);
  bp.connect(g);
  g.connect(c.destination);
  src.start(now);
  src.stop(now + dur + 0.01);
}
