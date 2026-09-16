// Shrink the exported browser models: weld, dedup, quantize, prune.
//   node scripts/product-viewer/optimize.cjs [slug ...]
// With no argument every product model is optimized. Material factors and the
// pf_part extras both survive this pass — the viewer selects on those.
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '../..');
const modules = path.join(root, 'design-review/aether-3d/tooling/node_modules');
const { NodeIO } = require(path.join(modules, '@gltf-transform/core'));
const { weld, quantize, dedup, prune } = require(path.join(modules, '@gltf-transform/functions'));
const { KHRMeshQuantization } = require(path.join(modules, '@gltf-transform/extensions'));

const MODELS = {
  aether: 'assets/products/aether/3d/aether-v2.glb',
  embera: 'assets/products/embera/3d/embera.glb',
  flavo: 'assets/products/flavo/3d/flavo.glb',
  fera: 'assets/products/fera/3d/fera.glb',
  ignite: 'assets/products/ignite/3d/ignite.glb',
};

(async () => {
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(MODELS);
  const io = new NodeIO().registerExtensions([KHRMeshQuantization]);
  for (const slug of slugs) {
    const file = path.join(root, MODELS[slug]);
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
    const document = await io.read(file);
    const before = fs.statSync(file).size;
    await document.transform(weld(), dedup(), quantize({ quantizePosition: 14, quantizeNormal: 10 }), prune());
    await io.write(file, document);
    const parts = document.getRoot().listNodes().map((n) => n.getExtras().pf_part).filter(Boolean);
    console.log(JSON.stringify({ slug, before, after: fs.statSync(file).size, parts: parts.length }));
  }
})();
