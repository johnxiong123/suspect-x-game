// 状态变量条：怀疑度 / 决意 / 信任 / 愧疚
import { el } from './dom.js';

const METERS = [
  ['suspicion', '怀疑度', '#d98a2b'],
  ['resolve', '决意', '#9a7bd0'],
  ['trust', '信任', '#3f9ae0'],
  ['guilt', '愧疚', '#c0566a'],
];
const MAX = 10;

export class Status {
  constructor(root) {
    this.root = root;
    this.bars = {};
    METERS.forEach(([key, label, color]) => {
      const fill = el('div', { class: 'meter-fill' });
      fill.style.background = color;
      const wrap = el('div', { class: 'meter' }, [
        el('span', { class: 'meter-label', text: label }),
        el('div', { class: 'meter-bar' }, [fill]),
      ]);
      this.root.appendChild(wrap);
      this.bars[key] = fill;
    });
  }

  update(vars) {
    METERS.forEach(([key]) => {
      const v = Math.max(0, Math.min(MAX, vars[key] ?? 0));
      this.bars[key].style.width = `${(v / MAX) * 100}%`;
    });
  }
}
