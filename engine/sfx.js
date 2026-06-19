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

// 播放一声打字 blip（自带节流，避免过密）
export function blip() {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  const now = c.currentTime;
  if (now - lastT < 0.045) return; // 节流：最快约每 45ms 一声
  lastT = now;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(800 + Math.random() * 140, now);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.05, now + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  o.connect(g);
  g.connect(c.destination);
  o.start(now);
  o.stop(now + 0.06);
}
