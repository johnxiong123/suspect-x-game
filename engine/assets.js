// 资源清单：图片 id → { label, src }。src 为 null 时由 UI 渲染暗调占位。

let manifest = { images: {} };

export async function loadManifest() {
  try {
    const res = await fetch('assets/manifest.json', { cache: 'no-store' });
    if (res.ok) manifest = await res.json();
  } catch {
    manifest = { images: {} };
  }
  if (!manifest.images) manifest.images = {};
  return manifest;
}

export function asset(id) {
  if (!id) return null;
  return manifest.images[id] || { id, label: id, src: null };
}
