// 左侧竖排导航栏
import { el } from './dom.js';

const ICONS = {
  log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h6"/></svg>',
  characters: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/></svg>',
  flowchart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6" cy="6" r="2.3"/><circle cx="18" cy="6" r="2.3"/><circle cx="12" cy="18" r="2.3"/><path d="M6 8.3v2.2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8.3M12 12.5v3.2"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s6.5-6 6.5-11.5A6.5 6.5 0 0 0 5.5 9.5C5.5 15 12 21 12 21z"/><circle cx="12" cy="9.3" r="2.2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.2 5.2l1.8 1.8M17 17l1.8 1.8M18.8 5.2L17 7M7 17l-1.8 1.8"/></svg>',
};
const ITEMS = [['log', '记录'], ['characters', '人物'], ['flowchart', '流程图'], ['map', '地图'], ['settings', '设置']];

export class NavRail {
  constructor(root, onSelect) {
    this.root = root;
    this.onSelect = onSelect;
    this.buttons = {};
    ITEMS.forEach(([key, label]) => {
      const b = el('button', {
        class: 'nav-btn', title: label, 'data-key': key,
        html: ICONS[key] || '', onclick: () => this.onSelect(key),
      });
      this.buttons[key] = b;
      this.root.appendChild(b);
    });
  }
  setBadge(key, on) { this.buttons[key]?.classList.toggle('badge', !!on); }
  setActive(key) { Object.entries(this.buttons).forEach(([k, b]) => b.classList.toggle('active', k === key)); }
}
