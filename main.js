// 启动与装配：把引擎与各 UI 组件接到一起
import { GameState, saveGame, loadGame, listSaves, getProgress } from './engine/state.js?v=2';
import { Director } from './engine/director.js?v=2';
import { loadManifest, prewarmImages } from './engine/assets.js';
import { loadConfig, getConfig, setConfig } from './engine/config.js';
import { Scene } from './ui/scene.js';
import { Dialogue } from './ui/dialogue.js?v=2';
import { Status } from './ui/status.js';
import { Clues } from './ui/clues.js';
import { Flowchart } from './ui/flowchart.js';
import { NavRail } from './ui/navrail.js';
import { Panel } from './ui/panel.js?v=2';
import { QuickBar } from './ui/quickbar.js';
import { Menus } from './ui/menus.js?v=2';
import { loadAudioManifest, playTrack, resume, setVolume, setMuted } from './engine/audio.js?v=2';
import { unlock as unlockSfx, loadType as loadTypeSfx, setEnabled as setSfxEnabled, setTypeVolume } from './engine/sfx.js?v=2';

const START = 'ch01_001';
const AUTO = 'auto';
const CHAPTERS = [
  { id: 'ch01', title: '第一章 · 黄昏的访客' },
  { id: 'ch02', title: '第二章 · 河岸的发现' },
  { id: 'ch03', title: '第三章 · 旧友' },
  { id: 'ch04', title: '第四章 · 情敌' },
  { id: 'ch05', title: '第五章 · 罗网' },
  { id: 'ch06', title: '第六章 · 识破' },
  { id: 'ch07', title: '终章 · 献身' },
];

async function getJSON(path) {
  const r = await fetch(path, { cache: 'no-store' });
  if (!r.ok) throw new Error('加载失败: ' + path);
  return r.json();
}

async function boot() {
  await loadManifest();
  const cfg = loadConfig();
  const audioManifest = await loadAudioManifest();
  loadTypeSfx(audioManifest.sfx?.type);
  const cluesData = await getJSON('data/clues.json');
  const charData = await getJSON('data/characters.json');
  const endingsData = await getJSON('data/endings.json');

  const scene = new Scene(document.getElementById('scene'));
  const dialogue = new Dialogue(document.getElementById('dialogue'), { speed: cfg.textSpeed, autoSpeed: cfg.autoSpeed });
  const status = new Status(document.getElementById('status'));
  const panel = new Panel(document.getElementById('panel'));
  const clues = new Clues(panel.cluesHost, cluesData);
  clues.setDetailHost(panel.detailHost);
  const flowchart = new Flowchart(panel.flowHost);
  panel.setCharacters(charData);
  const menus = new Menus(document.getElementById('overlays'));
  const chapterLabel = document.getElementById('chapter-label');

  // 偏好配置：单一来源，改动即持久化并整体重新应用到各子系统
  const quickbar = new QuickBar(document.getElementById('quickbar'), {
    auto: () => configApi.set({ auto: !getConfig().auto }),
    skip: () => configApi.set({ skip: !getConfig().skip }),
    save: () => menus.saveLoad('save', { state, onLoaded: resumeFrom }),
    load: () => menus.saveLoad('load', { state, onLoaded: resumeFrom }),
  });
  function applyConfig() {
    const c = getConfig();
    dialogue.setSpeed(c.textSpeed); dialogue.setAuto(c.auto);
    dialogue.setAutoSpeed(c.autoSpeed); dialogue.setSkip(c.skip);
    setVolume(c.bgmVol); setMuted(c.muted);
    setTypeVolume(c.sfxVol); setSfxEnabled(c.sfxOn);
    quickbar.setActive('auto', c.auto); quickbar.setActive('skip', c.skip);
  }
  const configApi = { get: getConfig, set: (p) => { setConfig(p); applyConfig(); } };
  applyConfig();

  let state;
  let director;

  function buildDirector() {
    director = new Director({
      state, scene, dialogue, status, clues, flowchart,
      onChapterLoad: (ch) => { chapterLabel.textContent = ch.meta.title; playTrack(ch.meta.bgm || 'main'); },
      onNode: () => { saveGame(AUTO, state); },
      onEnding: (ending) => { saveGame(AUTO, state); menus.ending(ending, { onTitle: showTitle }); },
      onChapterEnd: (ch) => { saveGame(AUTO, state); menus.chapterEnd(ch, { onTitle: showTitle }); },
    });
  }

  function syncHud() { status.update(state.vars); clues.refresh(state); }

  function startNew() {
    state = new GameState();
    buildDirector();
    menus.closeAll();
    quickbar.setVisible(true);
    syncHud();
    director.start(START);
  }
  function resumeFrom(s) {
    state = s;
    buildDirector();
    menus.closeAll();
    quickbar.setVisible(true);
    syncHud();
    director.goto(state.current.node || START);
  }
  function continueAuto() {
    const s = loadGame(AUTO);
    resumeFrom(s || new GameState());
  }
  function startChapter(chId) {
    state = new GameState();
    buildDirector();
    menus.closeAll();
    quickbar.setVisible(true);
    syncHud();
    director.start(chId + '_001');
  }
  const chapterTitleOf = (id) => { const c = CHAPTERS.find((x) => x.id === id); return c ? c.title : ''; };
  function showTitle() {
    quickbar.setVisible(false);
    playTrack('title');
    const autoState = loadGame(AUTO);
    const autoInfo = listSaves().find((s) => s.slot === AUTO);
    const curCh = autoState && autoState.current && autoState.current.chapter;
    const prog = getProgress();
    menus.title({
      hasSave: !!autoState,
      save: autoInfo ? { sub: `${(autoInfo.at || '').slice(0, 16).replace('T', ' ')} · ${chapterTitleOf(curCh) || CHAPTERS[0].title}` } : null,
      progress: { sub: `当前进度 ${chapterTitleOf(curCh) || CHAPTERS[0].title}`, diamonds: { done: Math.max(1, CHAPTERS.findIndex((c) => c.id === curCh) + 1), total: CHAPTERS.length } },
      endings: { sub: `已解锁 ${prog.endings.length} / ${endingsData.length}` },
      slots: true,
      activeSlot: null,
      onStart: startNew,
      onContinue: continueAuto,
      onChapterSelect: () => menus.chapterSelect(CHAPTERS, { onPick: startChapter }),
      onGallery: () => menus.gallery(endingsData),
      onSettings: () => menus.settings(configApi),
      onExit: () => menus.exit(),
      onSlot: (s) => { const st = loadGame(s); if (st) resumeFrom(st); },
    });
  }

  const nav = new NavRail(document.getElementById('navrail'), (key) => {
    if (key === 'settings') {
      menus.settings(configApi, {
        onSave: () => menus.saveLoad('save', { state, onLoaded: resumeFrom }),
        onLoad: () => menus.saveLoad('load', { state, onLoaded: resumeFrom }),
        onTitle: showTitle,
      });
    } else if (key === 'log') {
      menus.backlog(dialogue);
    } else if (key === 'map') {
      if (state) menus.locations(state);
    }
  });

  // 首次用户交互后补放被浏览器拦截的 BGM
  const unlock = () => { resume(); unlockSfx(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  showTitle();
  // 标题渲染后，后台预热场景图片（不阻塞首屏），使进场/切场即时显示
  setTimeout(prewarmImages, 600);
}

boot().catch((e) => {
  document.body.innerHTML = '<pre style="color:#e88;padding:2rem;font:14px monospace">启动失败：' + e.message + '\n\n' + (e.stack || '') + '</pre>';
  console.error(e);
});
