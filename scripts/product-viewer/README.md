# Product 3D viewer

Product pages opt in with `data-product-viewer="aether"` (or another slug in `assets/js/product-viewer.js`). The markup contains a poster/load button, a canvas host, camera tools, a component list, a live description and cover/assembly toggles. Product descriptions support RO/EN.

The lightweight page script loads the bundled Three.js scene and GLB only after activation. A failed load keeps the poster and component descriptions available and exposes retry. The renderer pauses when hidden or outside the viewport and renders on demand during interaction. It uses local assets; no CDN or new CSP exception is required.

## Model contract

Each selectable mesh or ancestor carries the glTF extra `pf_part`. IDs match the product's description list. Export only the product, excluding the Blender studio. Coordinates are meters, Y-up in glTF. Curved glass is intentionally translucent in the browser to make internal components visible.

`mount(host, hooks)` receives `model`, `parts`, `home`, `helpId`, `onSelect(id)`, `onCover(visible)` and `onError(error)`. Its returned API provides `select(id, focus)`, `cover(visible)`, `explode(enabled)`, `reset()`, `zoom(factor)`, `pause()`, `resume()` and `dispose()`.

Avoid changing component IDs without changing the product descriptions and exporter together. Keep source `.blend` materials independent from export simplifications. Do not put a live gas simulation or operational instructions into the model's presentation controls.

## Build and assets

Development dependencies are isolated in `design-review/aether-3d/tooling/package-lock.json`.

```text
npm ci --prefix design-review/aether-3d/tooling
node scripts/product-viewer/build.cjs
blender --background --python design-review/_shared/export_web.py -- embera
node scripts/product-viewer/optimize.cjs embera
blender --background --python design-review/_shared/render_poster.py -- embera
node scripts/product-viewer/poster.cjs embera
```

The exporter does not save its simplified geometry back to the Blender source. Serve the project over HTTP; module imports and model fetches do not work from a `file://` page.

## Accessibility and checks

The same component list works before WebGL loads and provides keyboard access to small or occluded parts. The canvas supports arrow keys, +/− and Home. Descriptions announce selection, and toggles expose `aria-pressed`. Reduced-motion preferences remove camera interpolation. Drag movement is distinguished from a click.

`node scripts/product-viewer/test.cjs` runs against the real local Express app with fake test credentials and an isolated temporary database. It checks deferred loading, all 12 Aether categories, cover/assembly toggles, keyboard rotation and zoom, pointer drag, RO/EN, a narrow viewport, failure/retry and axe WCAG A/AA rules scoped to the viewer. The Playwright package path can be supplied with `CODEX_NODE_MODULES`.

Latest report: `design-review/aether-3d/website-qa.json`. Desktop and narrow viewport screenshots are saved beside it. These are browser tests, not physical mobile-device certification. The full page has a pre-existing inline-style CSP warning outside the viewer.

Underlying APIs: [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html), [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [Raycaster](https://threejs.org/docs/pages/Raycaster.html). The local Three.js MIT license is in `assets/js/vendor/THREE-LICENSE.txt`.
