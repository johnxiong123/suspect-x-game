// 启动与装配：把引擎与各 UI 组件接到一起
import { GameState, saveGame, loadGame } from './engine/state.js';
import { Director } from './engine/director.js';
import { loadManifest } from './engine/assets.js';
import { Scene } from './ui/scene.js';
import { Dialogue } from './ui/dialogue.js';
import { Status } from './ui/status.js';
import { Clues } from './ui/clues.js';
import { Flowchart } from './ui/flowchart.js';
import { NavRail } from './ui/navrail.js';
import { Panel } from './ui/panel.js';
import { Menus } from './ui/menus.js';

const START = 'ch01_001';
const AUTO = 'auto';

async function getJSON(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error('加载失败: ' + path);
  return r.json();
}

async function boot() {
  await loadManifest();
  const cluesData = await getJSON('data/clues.json');
  const charData = await getJSON('data/characters.json');
  const endingsData = await getJSON('data/endings.json');

  const scene = new Scene(document.getElementById('scene'));
  const dialogue = new Dialogue(document.getElementById('dialogue'));
  const status = new Status(document.getElementById('status'));
  const panel = new Panel(document.getElementById('panel'));
  const clues = new Clues(panel.cluesHost, cluesData);
  clues.setDetailHost(panel.detailHost);
  const flowchart = new Flowchart(panel.flowHost);
  const menus = new Menus(document.getElementById('overlays'));
  const chapterLabel = document.getElementById('chapter-label');

  let state;
  let director;

  function buildDirector() {
    director = new Director({
      state, scene, dialogue, status, clues, flowchart,
      onChapterLoad: (ch) => { chapterLabel.textContent = ch.meta.title; },
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
    syncHud();
    director.start(START);
  }
  function resumeFrom(s) {
    state = s;
    buildDirector();
    menus.closeAll();
    syncHud();
    director.goto(state.current.node || START);
  }
  function continueAuto() {
    const s = loadGame(AUTO);
    resumeFrom(s || new GameState());
  }
  function showTitle() {
    menus.title({
      hasSave: !!loadGame(AUTO),
      onStart: startNew,
      onContinue: continueAuto,
      onGallery: () => menus.gallery(endingsData),
      onSettings: () => menus.settings(dialogue),
    });
  }

  const nav = new NavRail(document.getElementById('navrail'), (key) => {
    if (key === 'settings') {
      menus.settings(dialogue, {
        onSave: () => menus.saveLoad('save', { state, onLoaded: resumeFrom }),
        onLoad: () => menus.saveLoad('load', { state, onLoaded: resumeFrom }),
        onTitle: showTitle,
      });
    } else if (key === 'log') {
      menus.backlog(dialogue);
    } else if (key === 'characters') {
      panel.showCharacters(charData);
    } else if (key === 'flowchart') {
      panel.focusFlow();
    }
    // 'map' 预留给 P2
  });

  showTitle();
}

boot().catch((e) => {
  document.body.innerHTML = '<pre style="color:#e88;padding:2rem;font:14px monospace">启动失败：' + e.message + '\n\n' + (e.stack || '') + '</pre>';
  console.error(e);
});
