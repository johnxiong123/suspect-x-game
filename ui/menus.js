// 菜单与弹层：标题 / 结局 / 章节末 / 存读档 / 设置 / 回想 / 结局画廊
import { el } from './dom.js';
import { asset } from '../engine/assets.js';
import { listSaves, saveGame, loadGame, getProgress } from '../engine/state.js';

export class Menus {
  constructor(root) { this.root = root; }

  closeAll() { this.root.innerHTML = ''; }

  _overlay(cls, children, { dismissable = false } = {}) {
    const card = el('div', { class: 'overlay-card' }, children);
    const ov = el('div', { class: 'overlay ' + cls }, [card]);
    if (dismissable) ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    this.root.appendChild(ov);
    return ov;
  }

  title({ hasSave, onStart, onContinue, onGallery, onSettings }) {
    this.closeAll();
    const kv = asset('title_keyvisual');
    const visual = kv && kv.src
      ? el('img', { class: 'title-visual', src: kv.src })
      : el('div', { class: 'title-visual title-visual-ph' });
    this._overlay('overlay-title', [
      visual,
      el('h1', { class: 'title-name', text: '嫌疑犯X的献身' }),
      el('p', { class: 'title-sub', text: '互动推理 · 你的选择，改变命运' }),
      el('div', { class: 'title-menu' }, [
        el('button', { class: 'menu-btn primary', text: '开始新游戏', onclick: onStart }),
        hasSave ? el('button', { class: 'menu-btn', text: '继续', onclick: onContinue }) : null,
        el('button', { class: 'menu-btn', text: '结局画廊', onclick: onGallery }),
        el('button', { class: 'menu-btn', text: '设置', onclick: onSettings }),
      ]),
    ]);
  }

  ending(ending, { onTitle }) {
    const cg = ending.cg ? asset(ending.cg) : null;
    this._overlay('overlay-ending type-' + (ending.type || 'bad'), [
      cg ? (cg.src ? el('img', { class: 'end-visual', src: cg.src }) : el('div', { class: 'end-visual end-visual-ph', text: cg.label })) : null,
      el('div', { class: 'end-tag', text: ending.type === 'true' ? 'TRUE END' : ending.type === 'good' ? 'GOOD END' : ending.type === 'bad' ? 'BAD END' : 'END' }),
      el('h2', { class: 'end-title', text: ending.title }),
      el('div', { class: 'menu-btn primary', text: '返回标题', onclick: onTitle }),
    ]);
  }

  chapterEnd(chapter, { onTitle }) {
    this._overlay('overlay-chapter', [
      el('div', { class: 'chapter-mark', text: chapter.meta.title }),
      el('h2', { class: 'chapter-end-title', text: '—— 本章完 ——' }),
      el('p', { class: 'chapter-end-sub', text: '待续。后续章节将在 P1/P2 接入。' }),
      el('div', { class: 'menu-btn primary', text: '返回标题', onclick: onTitle }),
    ]);
  }

  backlog(dialogue) {
    const rows = dialogue.backlog.map((l) =>
      el('div', { class: 'backlog-row' }, [
        el('span', { class: 'backlog-name', text: l.speaker || '' }),
        el('span', { class: 'backlog-text', text: l.text || '' }),
      ]));
    this._overlay('overlay-backlog', [
      el('h3', { class: 'overlay-h', text: '回想' }),
      el('div', { class: 'backlog-list' }, rows.length ? rows : [el('div', { class: 'clue-empty', text: '尚无对话' })]),
      el('button', { class: 'menu-btn', text: '关闭', onclick: (e) => e.target.closest('.overlay')?.remove() }),
    ], { dismissable: true });
  }

  settings(dialogue, opts = {}) {
    const speed = el('input', { type: 'range', min: '4', max: '60', value: String(70 - dialogue.speed), step: '2' });
    speed.addEventListener('input', () => dialogue.setSpeed(70 - Number(speed.value)));
    const auto = el('input', { type: 'checkbox' });
    auto.checked = dialogue.auto;
    auto.addEventListener('change', () => dialogue.setAuto(auto.checked));
    const skip = el('input', { type: 'checkbox' });
    skip.checked = dialogue.skip;
    skip.addEventListener('change', () => dialogue.setSkip(skip.checked));

    const actions = [];
    if (opts.onSave) actions.push(el('button', { class: 'menu-btn small', text: '保存', onclick: opts.onSave }));
    if (opts.onLoad) actions.push(el('button', { class: 'menu-btn small', text: '读取', onclick: opts.onLoad }));
    if (opts.onTitle) actions.push(el('button', { class: 'menu-btn small', text: '返回标题', onclick: opts.onTitle }));

    this._overlay('overlay-settings', [
      el('h3', { class: 'overlay-h', text: '设置' }),
      el('label', { class: 'setting-row' }, [el('span', { text: '文字速度' }), speed]),
      el('label', { class: 'setting-row' }, [el('span', { text: '自动播放' }), auto]),
      el('label', { class: 'setting-row' }, [el('span', { text: '快进（仅已读）' }), skip]),
      actions.length ? el('div', { class: 'setting-actions' }, actions) : null,
      el('button', { class: 'menu-btn', text: '关闭', onclick: (e) => e.target.closest('.overlay')?.remove() }),
    ], { dismissable: true });
  }

  saveLoad(mode, { state, onLoaded }) {
    const slots = ['1', '2', '3'];
    const saves = Object.fromEntries(listSaves().map((s) => [s.slot, s]));
    const rows = slots.map((slot) => {
      const info = saves[slot];
      return el('div', { class: 'slot-row' }, [
        el('span', { class: 'slot-name', text: '存档 ' + slot }),
        el('span', { class: 'slot-info', text: info ? `${info.node || ''} · ${(info.at || '').slice(0, 16).replace('T', ' ')}` : '（空）' }),
        el('button', {
          class: 'menu-btn small',
          text: mode === 'save' ? '保存' : '读取',
          onclick: () => {
            if (mode === 'save') { saveGame(slot, state); this.saveLoad('save', { state, onLoaded }); }
            else { const s = loadGame(slot); if (s) { this.closeAll(); onLoaded(s); } }
          },
        }),
      ]);
    });
    this.root.querySelectorAll('.overlay-saveload').forEach((o) => o.remove());
    this._overlay('overlay-saveload', [
      el('h3', { class: 'overlay-h', text: mode === 'save' ? '保存进度' : '读取进度' }),
      el('div', { class: 'slot-list' }, rows),
      el('button', { class: 'menu-btn', text: '关闭', onclick: (e) => e.target.closest('.overlay')?.remove() }),
    ], { dismissable: true });
  }

  gallery(endingsData) {
    const unlocked = new Set(getProgress().endings);
    const cards = endingsData.map((e) => {
      const got = unlocked.has(e.id);
      return el('div', { class: 'gallery-card' + (got ? ' got' : '') }, [
        el('div', { class: 'gallery-tag', text: (e.type || '').toUpperCase() }),
        el('div', { class: 'gallery-title', text: got ? e.title : '？？？' }),
        el('div', { class: 'gallery-sum', text: got ? (e.summary || '') : '尚未解锁' }),
      ]);
    });
    this._overlay('overlay-gallery', [
      el('h3', { class: 'overlay-h', text: `结局画廊（${unlocked.size}/${endingsData.length}）` }),
      el('div', { class: 'gallery-grid' }, cards),
      el('button', { class: 'menu-btn', text: '关闭', onclick: (e) => e.target.closest('.overlay')?.remove() }),
    ], { dismissable: true });
  }
}
