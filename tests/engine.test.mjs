// 引擎单测（零依赖，node 直接运行）：条件求值 / 状态增量 / 存读档 round-trip
import assert from 'node:assert';
import { evalCondition } from '../engine/conditions.js';
import { GameState, saveGame, loadGame } from '../engine/state.js';

let pass = 0;
let fail = 0;
function test(name, fn) {
  try { fn(); pass += 1; console.log('  ✓', name); }
  catch (e) { fail += 1; console.error('  ✗', name, '\n      ', e.message); }
}

// ---- 条件求值 ----
test('空条件视为通过', () => {
  assert.equal(evalCondition(null, new GameState()), true);
});
test('flags 需全满足', () => {
  const s = new GameState(); s.setFlag('a');
  assert.equal(evalCondition({ flags: ['a'] }, s), true);
  assert.equal(evalCondition({ flags: ['a', 'b'] }, s), false);
});
test('notFlags 排除', () => {
  const s = new GameState();
  assert.equal(evalCondition({ notFlags: ['x'] }, s), true);
  s.setFlag('x');
  assert.equal(evalCondition({ notFlags: ['x'] }, s), false);
});
test('clues 需持有', () => {
  const s = new GameState(); s.unlockClue('k');
  assert.equal(evalCondition({ clues: ['k'] }, s), true);
  assert.equal(evalCondition({ clues: ['nope'] }, s), false);
});
test('vars 比较运算', () => {
  const s = new GameState(); s.setVar('suspicion', 3);
  assert.equal(evalCondition({ vars: { suspicion: { gte: 3 } } }, s), true);
  assert.equal(evalCondition({ vars: { suspicion: { lt: 3 } } }, s), false);
  assert.equal(evalCondition({ vars: { suspicion: 3 } }, s), true);
});
test('any / all / not 组合', () => {
  const s = new GameState(); s.setFlag('a');
  assert.equal(evalCondition({ any: [{ flags: ['a'] }, { flags: ['z'] }] }, s), true);
  assert.equal(evalCondition({ all: [{ flags: ['a'] }, { flags: ['z'] }] }, s), false);
  assert.equal(evalCondition({ not: { flags: ['z'] } }, s), true);
});

// ---- 效果应用 ----
test('applyEffects：状态增量 + 旗标 + 新线索', () => {
  const s = new GameState();
  const nc = s.applyEffects({ state: { suspicion: 2, guilt: 1 }, flags: ['murder_done'], clues: ['kotatsu_cord'] });
  assert.equal(s.getVar('suspicion'), 2);
  assert.equal(s.getVar('guilt'), 1);
  assert.equal(s.hasFlag('murder_done'), true);
  assert.equal(s.hasClue('kotatsu_cord'), true);
  assert.deepEqual(nc, ['kotatsu_cord']);
});
test('线索去重：已解锁不再计入新线索', () => {
  const s = new GameState();
  s.applyEffects({ clues: ['c1'] });
  const nc = s.applyEffects({ clues: ['c1', 'c2'] });
  assert.deepEqual(nc, ['c2']);
});
test('状态增量可叠加', () => {
  const s = new GameState();
  s.applyEffects({ state: { trust: 1 } });
  s.applyEffects({ state: { trust: 2 } });
  assert.equal(s.getVar('trust'), 3);
});

// ---- 存读档 round-trip ----
test('存读档 round-trip 一致', () => {
  const s = new GameState();
  s.applyEffects({ state: { trust: 2 }, flags: ['ishigami_plan'], clues: ['movie_tickets'] });
  s.markVisited('ch01_001');
  s.markVisited('ch01_021');
  s.current = { chapter: 'ch01', node: 'ch01_030' };
  saveGame('t_unit', s);
  const r = loadGame('t_unit');
  assert.equal(r.getVar('trust'), 2);
  assert.equal(r.hasFlag('ishigami_plan'), true);
  assert.equal(r.hasClue('movie_tickets'), true);
  assert.equal(r.current.node, 'ch01_030');
  assert.equal(r.visited.has('ch01_001'), true);
  assert.equal(r.visited.has('ch01_021'), true);
});
test('读取不存在的存档返回 null', () => {
  assert.equal(loadGame('nonexistent_slot_zzz'), null);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
