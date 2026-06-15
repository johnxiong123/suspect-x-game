// 场景渲染：背景层 + CG 层，交叉淡入；无图时渲染暗调占位
import { asset } from '../engine/assets.js';
import { el } from './dom.js';

export class Scene {
  constructor(root) {
    this.root = root;
    this.bgLayer = el('div', { class: 'scene-layer scene-bg' });
    this.cgLayer = el('div', { class: 'scene-layer scene-cg' });
    this.root.append(this.bgLayer, this.cgLayer);
  }

  set(bgId, cgId, pov) {
    this.root.dataset.pov = pov || '';
    this._render(this.bgLayer, bgId, false);
    this._render(this.cgLayer, cgId, true);
  }

  _render(layer, id, isCg) {
    if (isCg && !id) {
      layer.classList.remove('visible');
      layer.innerHTML = '';
      return;
    }
    const a = asset(id);
    const inner = a && a.src
      ? el('img', { class: 'scene-img', src: a.src, alt: a.label || '' })
      : el('div', { class: 'scene-ph' + (isCg ? ' scene-ph-cg' : ''), 'data-id': id || '' }, [
          el('span', { class: 'scene-ph-tag', text: isCg ? 'CG' : 'SCENE' }),
          el('span', { class: 'scene-ph-label', text: a ? a.label : id || '' }),
        ]);
    layer.innerHTML = '';
    layer.appendChild(inner);
    layer.classList.remove('fade');
    void layer.offsetWidth; // 重排以重放动画
    layer.classList.add('fade', 'visible');
  }
}
