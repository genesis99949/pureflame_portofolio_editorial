// Posters shown before the visitor opts into WebGL. Each source is a Cycles
// render taken from the viewer's own home camera with the web material palette
// applied (design-review/_shared/render_poster.py), so the still and the 3D
// scene read as one object and the swap on click is invisible.
//   node scripts/product-viewer/poster.cjs [slug ...]
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '../..');
const modules = path.join(root, 'design-review/aether-3d/tooling/node_modules');
const sharp = require(path.join(modules, 'sharp'));
const POSTERS = {
  aether: 'aether-3d/Aether_Poster.png',
  embera: 'embera-3d/Embera_Poster.png',
  flavo: 'flavo-3d/Flavo_Poster.png',
  fera: 'fera-3d/Fera_Poster.png',
  ignite: 'ignite-3d/Ignite_Poster.png',
};
// The stage colour behind the transparent render: var(--cream-soft) in site.css.
const STAGE = '#e1e2db';
(async () => {
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(POSTERS);
  for (const slug of slugs) {
    const source = path.join(root, 'design-review', POSTERS[slug]);
    const target = path.join(root, `assets/products/${slug}/3d/${slug}-poster.webp`);
    if (!fs.existsSync(source)) {
      throw new Error(`Missing ${source} — run design-review/_shared/render_poster.py first`);
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const { width, height } = await sharp(source)
      .flatten({ background: STAGE })
      .webp({ quality: 82, effort: 6 })
      .toFile(target);
    console.log(JSON.stringify({ slug, width, height, bytes: fs.statSync(target).size }));
  }
})();
