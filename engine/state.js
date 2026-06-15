// 全局游戏状态 + 存读档 + 跨周目进度（流程图/结局画廊用）

const SAVE_PREFIX = 'sx_save_';
const PROGRESS_KEY = 'sx_progress';
const DEFAULT_VARS = { suspicion: 0, resolve: 0, trust: 0, guilt: 0 };

// 非浏览器环境（node 测试）下的内存兜底
function memoryStore() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}
// 优先用真实 localStorage（带写入探针；node 下 localStorage 可能存在但调用会抛错）
function resolveStore() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) {
      localStorage.setItem('__sx_probe__', '1');
      localStorage.removeItem('__sx_probe__');
      return localStorage;
    }
  } catch { /* 落到内存兜底 */ }
  return memoryStore();
}
const store = resolveStore();
const nowIso = () => (typeof Date !== 'undefined' ? new Date().toISOString() : '');

export class GameState {
  constructor() { this.reset(); }

  reset() {
    this.vars = { ...DEFAULT_VARS };
    this.flags = new Set();
    this.clues = new Set();
    this.povUnlocked = new Set(['ishigami']);
    this.visited = new Set();
    this.endings = new Set();
    this.current = { chapter: null, node: null };
  }

  // 变量
  getVar(n) { return this.vars[n] ?? 0; }
  addVar(n, d) { this.vars[n] = (this.vars[n] ?? 0) + d; }
  setVar(n, v) { this.vars[n] = v; }

  // 旗标 / 线索 / 视角
  hasFlag(f) { return this.flags.has(f); }
  setFlag(f) { this.flags.add(f); }
  hasClue(c) { return this.clues.has(c); }
  unlockClue(c) { const isNew = !this.clues.has(c); this.clues.add(c); return isNew; }
  unlockPov(p) { this.povUnlocked.add(p); }
  markVisited(id) { this.visited.add(id); }
  recordEnding(id) { this.endings.add(id); mergeProgress(this); }

  // 应用效果，返回本次「新解锁」的线索 id 列表（用于未读红点）
  applyEffects(e) {
    if (!e) return [];
    if (e.state) for (const [k, v] of Object.entries(e.state)) this.addVar(k, v);
    if (e.flags) e.flags.forEach((f) => this.setFlag(f));
    if (e.povUnlock) [].concat(e.povUnlock).forEach((p) => this.unlockPov(p));
    const newClues = [];
    if (e.clues) e.clues.forEach((c) => { if (this.unlockClue(c)) newClues.push(c); });
    return newClues;
  }

  toJSON() {
    return {
      vars: { ...this.vars },
      flags: [...this.flags],
      clues: [...this.clues],
      povUnlocked: [...this.povUnlocked],
      visited: [...this.visited],
      endings: [...this.endings],
      current: { ...this.current },
    };
  }

  static fromJSON(o = {}) {
    const s = new GameState();
    s.vars = { ...DEFAULT_VARS, ...(o.vars || {}) };
    s.flags = new Set(o.flags || []);
    s.clues = new Set(o.clues || []);
    s.povUnlocked = new Set(o.povUnlocked || ['ishigami']);
    s.visited = new Set(o.visited || []);
    s.endings = new Set(o.endings || []);
    s.current = o.current || { chapter: null, node: null };
    return s;
  }
}

// ---- 存读档 ----
export function saveGame(slot, state) {
  store.setItem(SAVE_PREFIX + slot, JSON.stringify({ at: nowIso(), state: state.toJSON() }));
  mergeProgress(state);
}
export function loadGame(slot) {
  const raw = store.getItem(SAVE_PREFIX + slot);
  if (!raw) return null;
  return GameState.fromJSON(JSON.parse(raw).state);
}
export function deleteSave(slot) { store.removeItem(SAVE_PREFIX + slot); }
export function listSaves() {
  const out = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k && k.startsWith(SAVE_PREFIX)) {
      const o = JSON.parse(store.getItem(k));
      out.push({ slot: k.slice(SAVE_PREFIX.length), at: o.at, node: o.state?.current?.node });
    }
  }
  return out.sort((a, b) => (a.slot > b.slot ? 1 : -1));
}

// ---- 跨周目进度（流程图已访问 + 已解锁结局，持久化） ----
export function getProgress() {
  try { return JSON.parse(store.getItem(PROGRESS_KEY)) || { visited: [], endings: [] }; }
  catch { return { visited: [], endings: [] }; }
}
export function mergeProgress(state) {
  const p = getProgress();
  const visited = new Set([...p.visited, ...state.visited]);
  const endings = new Set([...p.endings, ...state.endings]);
  store.setItem(PROGRESS_KEY, JSON.stringify({ visited: [...visited], endings: [...endings] }));
}
