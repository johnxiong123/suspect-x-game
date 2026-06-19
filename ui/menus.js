// 菜单与弹层：标题 / 结局 / 章节末 / 存读档 / 设置 / 回想 / 结局画廊
import { el } from './dom.js';
import { asset } from '../engine/assets.js';
import { listSaves, saveGame, loadGame, getProgress } from '../engine/state.js';
import { getVolume, setVolume, isMuted, setMuted } from '../engine/audio.js';
import { setEnabled as setSfxEnabled, isEnabled as isSfxEnabled } from '../engine/sfx.js';

const I = {
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 5l11 7-11 7z"/></svg>',
  cont: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12a8 8 0 1 1 2.4 5.6"/><path d="M4 19v-5h5"/></svg>',
  chapters: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></svg>',
  gallery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 15l5-4 4 3 3-2 6 4"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.2 5.2l1.8 1.8M17 17l1.8 1.8M18.8 5.2L17 7M7 17l-1.8 1.8"/></svg>',
  power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v9"/><path d="M6.5 7a8 8 0 1 0 11 0"/></svg>',
};

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

  title({ hasSave, onStart, onContinue, onChapterSelect, onGallery, onSettings, onExit }) {
    this.closeAll();
    const kv = asset('title_keyvisual');
    const ov = el('div', { class: 'overlay overlay-title' });
    if (kv && kv.src) ov.style.backgroundImage = `url("${kv.src}")`;
    else ov.classList.add('overlay-title-ph');

    const item = (label, icon, handler, cls = '') => el('button', {
      class: 'title-item' + (cls ? ' ' + cls : ''), onclick: handler,
    }, [el('span', { class: 'title-item-ic', html: icon }), el('span', { text: label })]);

    const menu = el('div', { class: 'title-menu-right' }, [
      item('开始游戏', I.play, onStart, 'primary'),
      hasSave ? item('继续游戏', I.cont, onContinue) : null,
      item('章节选择', I.chapters, onChapterSelect),
      onGallery ? item('结局画廊', I.gallery, onGallery) : null,
      item('设定', I.gear, onSettings),
      item('结束游戏', I.power, onExit),
    ]);
    ov.append(el('div', { class: 'title-brand', text: '嫌疑犯X的献身' }), menu);
    this.root.appendChild(ov);
  }

  chapterSelect(chapters, { onPick }) {
    const rows = chapters.map((c) => el('button', {
      class: 'chapter-row', onclick: () => { this.closeAll(); onPick(c.id); },
    }, [el('span', { class: 'chapter-row-title', text: c.title })]));
    this._overlay('overlay-chapters', [
      el('h3', { class: 'overlay-h', text: '章节选择' }),
      el('div', { class: 'chapter-list' }, rows),
      el('button', { class: 'menu-btn', text: '关闭', onclick: (e) => e.target.closest('.overlay')?.remove() }),
    ], { dismissable: true });
  }

  locations(state) {
    const names = [...(state.locations || [])].map((id) => asset(id)?.label || id);
    this._overlay('overlay-locations', [
      el('h3', { class: 'overlay-h', text: '已到访地点' }),
      el('div', { class: 'loc-list' }, names.length
        ? names.map((n) => el('div', { class: 'loc-row', text: n }))
        : [el('div', { class: 'clue-empty', text: '暂无' })]),
      el('button', { class: 'menu-btn', text: '关闭', onclick: (e) => e.target.closest('.overlay')?.remove() }),
    ], { dismissable: true });
  }

  exit() {
    this._overlay('overlay-exit', [
      el('h2', { class: 'end-title', text: '感谢游玩' }),
      el('p', { class: 'title-sub', text: '可以直接关闭此页面。' }),
      el('button', { class: 'menu-btn', text: '返回', onclick: (e) => e.target.closest('.overlay')?.remove() }),
    ], { dismissable: true });
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

    const vol = el('input', { type: 'range', min: '0', max: '100', value: String(Math.round(getVolume() * 100)), step: '5' });
    vol.addEventListener('input', () => setVolume(Number(vol.value) / 100));
    const mute = el('input', { type: 'checkbox' });
    mute.checked = isMuted();
    mute.addEventListener('change', () => setMuted(mute.checked));
    const sfx = el('input', { type: 'checkbox' });
    sfx.checked = isSfxEnabled();
    sfx.addEventListener('change', () => setSfxEnabled(sfx.checked));

    const actions = [];
    if (opts.onSave) actions.push(el('button', { class: 'menu-btn small', text: '保存', onclick: opts.onSave }));
    if (opts.onLoad) actions.push(el('button', { class: 'menu-btn small', text: '读取', onclick: opts.onLoad }));
    if (opts.onTitle) actions.push(el('button', { class: 'menu-btn small', text: '返回标题', onclick: opts.onTitle }));

    this._overlay('overlay-settings', [
      el('h3', { class: 'overlay-h', text: '设置' }),
      el('label', { class: 'setting-row' }, [el('span', { text: '文字速度' }), speed]),
      el('label', { class: 'setting-row' }, [el('span', { text: '自动播放' }), auto]),
      el('label', { class: 'setting-row' }, [el('span', { text: '快进（仅已读）' }), skip]),
      el('label', { class: 'setting-row' }, [el('span', { text: '音乐音量' }), vol]),
      el('label', { class: 'setting-row' }, [el('span', { text: '静音' }), mute]),
      el('label', { class: 'setting-row' }, [el('span', { text: '文字音效' }), sfx]),
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
