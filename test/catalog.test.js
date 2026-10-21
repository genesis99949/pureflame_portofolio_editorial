'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { loadCatalog } = require('../server/catalog');
const { renderTemplate, renderPage, PAGES_DIR } = require('../server/render');
const { PRODUCTS, ACCESSORIES } = require('../server/products');

const catalog = loadCatalog();
const pages = Object.fromEntries(
  fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.html')).map((f) => [f, renderPage(f, catalog)])
);

// Copiaza content/ intr-un folder temporar si aplica o modificare, ca sa testam validarea.
function catalogWith(folder, file, change) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-catalog-'));
  fs.cpSync(path.join(__dirname, '..', 'content'), dir, { recursive: true });
  const target = path.join(dir, folder, file);
  const entry = JSON.parse(fs.readFileSync(target, 'utf8'));
  change(entry);
  fs.writeFileSync(target, JSON.stringify(entry));
  return dir;
}

test('catalog: preturile din Stripe vin din aceeasi sursa ca paginile', () => {
  for (const p of catalog.productList) {
    assert.equal(PRODUCTS[p.id].amount, p.priceBani);
    assert.deepEqual(PRODUCTS[p.id].colors, p.colors);
  }
  for (const a of catalog.accessoryList) {
    assert.equal(ACCESSORIES[a.id].amount, a.priceBani);
  }
});

test('catalog: formatele de afisare', () => {
  const aether = catalog.products.aether;
  assert.equal(aether.priceLabel, '2.989 lei');
  assert.equal(aether.priceLabelFull, '2.989,00 lei');
  assert.deepEqual(aether.dims, { ro: '83,5 × 83,5 × 37 cm', en: '83.5 × 83.5 × 37 cm' });
  assert.equal(aether.dimsCompact, '83.5×83.5×37cm');
  assert.equal(catalog.accessories.pietre.priceLabel, '89,00 lei');
});

test('catalog: un pret introdus gresit opreste incarcarea', () => {
  const dir = catalogWith('products', 'embera.json', (e) => { e.priceBani = '4797'; });
  assert.throws(() => loadCatalog(dir), /embera\.json.*priceBani/);
});

test('catalog: id-ul trebuie sa corespunda numelui fisierului', () => {
  const dir = catalogWith('accessories', 'husa.json', (e) => { e.id = 'husa-noua'; });
  assert.throws(() => loadCatalog(dir), /husa\.json.*"id"/);
});

test('catalog: un text bilingv incomplet este respins', () => {
  const dir = catalogWith('products', 'fera.json', (e) => { e.material.en = ''; });
  assert.throws(() => loadCatalog(dir), /fera\.json.*material\.en/);
});

test('catalog: JSON-ul din pagina nu poate inchide eticheta <script>', () => {
  const dir = catalogWith('products', 'flavo.json', (e) => { e.material.ro = '</script><img src=x>'; });
  const unsafe = loadCatalog(dir);
  assert.ok(!unsafe.publicJson.includes('</script>'));
  assert.equal(JSON.parse(unsafe.publicJson).products.find((p) => p.id === 'flavo').material.ro, '</script><img src=x>');
});

test('render: escapeaza HTML si refuza marcajele necunoscute', () => {
  assert.equal(renderTemplate('<b>{{a}}</b>', { a: '<i>"x"</i>' }), '<b>&lt;i&gt;&quot;x&quot;&lt;/i&gt;</b>');
  assert.equal(renderTemplate('{{{a}}}', { a: '{"b":1}' }), '{"b":1}');
  assert.throws(() => renderTemplate('{{products.inexistent.price}}', catalog, 'test.html'), /test\.html.*inexistent/);
  assert.throws(() => renderTemplate('{{products.embera}}', catalog), /nu corespunde/, 'un obiect nu e o valoare afisabila');
});

test('pagini: niciun marcaj nerandat', () => {
  for (const [file, html] of Object.entries(pages)) {
    // Doar "{{": JSON-ul catalogului din pagina contine legitim "}}" (obiecte imbricate).
    assert.ok(!html.includes('{{'), `${file} contine un marcaj nerandat`);
  }
});

test('pagini de produs: pretul afisat este pretul incasat', () => {
  for (const p of catalog.productList) {
    const html = pages[`${p.id}.html`];
    assert.ok(html.includes(`data-product-id="${p.id}" data-amount-bani="${p.priceBani}"`), `${p.id}: data-amount-bani`);
    assert.ok(html.includes(`<strong class="epp-price">${p.priceLabel}</strong>`), `${p.id}: pretul afisat`);
  }
});

test('pagini de produs: culorile din configurator exista in catalog', () => {
  for (const p of catalog.productList) {
    const swatches = [...pages[`${p.id}.html`].matchAll(/class="color-swatch[^"]*" data-color="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(swatches, p.colors, `${p.id}: culorile din pagina difera de catalog`);
  }
});

test('build: dist/ contine toate paginile randate si nimic din server', () => {
  const { build } = require('../scripts/build');
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-dist-'));
  build({ outDir, copyAssets: false });
  assert.deepEqual(fs.readdirSync(outDir).sort(), Object.keys(pages).sort());
  assert.equal(fs.readFileSync(path.join(outDir, 'embera.html'), 'utf8'), pages['embera.html']);
});

test('pagini: fiecare accesoriu din pagini exista in catalog, cu acelasi pret', () => {
  for (const [file, html] of Object.entries(pages)) {
    for (const m of html.matchAll(/data-(?:accessory|addon)-id="([^"]+)"[^>]*?data-(?:accessory|addon)-bani="(\d+)"/g)) {
      const accessory = catalog.accessories[m[1]];
      assert.ok(accessory, `${file}: accesoriul "${m[1]}" nu exista in catalog (checkout-ul l-ar respinge)`);
      assert.equal(Number(m[2]), accessory.priceBani, `${file}: pret diferit pentru "${m[1]}"`);
    }
  }
});
