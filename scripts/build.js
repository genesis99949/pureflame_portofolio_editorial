// Build-ul pentru hosting static (Vercel): randeaza sabloanele din src/pages/ cu
// datele din content/ si scrie site-ul final in dist/, impreuna cu assets/.
// Vercel publica doar dist/ — codul serverului, content/ si restul proiectului
// nu mai ajung publice. Local nu e nevoie de build: Express randeaza aceleasi
// sabloane la pornire (vezi server/index.js).
const fs = require('node:fs');
const path = require('node:path');

const { loadCatalog } = require('../server/catalog');
const { renderPage, PAGES_DIR } = require('../server/render');

const PROJECT_ROOT = path.join(__dirname, '..');

function build({ outDir = path.join(PROJECT_ROOT, 'dist'), copyAssets = true } = {}) {
  const catalog = loadCatalog();
  const pages = fs.readdirSync(PAGES_DIR).filter((file) => file.endsWith('.html'));

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  pages.forEach((file) => fs.writeFileSync(path.join(outDir, file), renderPage(file, catalog)));
  // Panoul CMS (src/admin) ajunge la /admin/ — fisiere statice, fara randare.
  fs.cpSync(path.join(PROJECT_ROOT, 'src', 'admin'), path.join(outDir, 'admin'), { recursive: true });

  if (copyAssets) {
    fs.cpSync(path.join(PROJECT_ROOT, 'assets'), path.join(outDir, 'assets'), { recursive: true });
  }
  return pages;
}

if (require.main === module) {
  const started = Date.now();
  try {
    const pages = build();
    console.log(`Build gata: ${pages.length} pagini + assets in dist/ (${Date.now() - started} ms).`);
  } catch (err) {
    console.error(`Build esuat: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { build };
