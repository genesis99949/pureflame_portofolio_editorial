// Catalogul magazinului — sursa unica pentru preturi, specificatii si accesorii.
// Datele stau in content/ (cate un fisier JSON per produs/accesoriu, editabile din CMS).
// Aici le citim, le validam si calculam o singura data toate formatele de afisare
// ("4.797 lei", "169 × 95 cm" etc.), ca paginile, JS-ul din browser si Stripe
// sa foloseasca exact aceleasi valori.
const fs = require('node:fs');
const path = require('node:path');

const CONTENT_DIR = path.join(__dirname, '..', 'content');
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_PRICE_BANI = 10_000_000; // 100.000 lei — orice peste e aproape sigur o greseala de tastare

function fail(file, message) {
  throw new Error(`Catalog invalid (${file}): ${message}`);
}

function requireText(file, value, field, max = 120) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    fail(file, `"${field}" trebuie sa fie un text nevid de maximum ${max} caractere.`);
  }
}

function requireBilingual(file, value, field) {
  if (!value || typeof value !== 'object') fail(file, `"${field}" lipseste.`);
  requireText(file, value.ro, `${field}.ro`);
  requireText(file, value.en, `${field}.en`);
}

function requirePositiveNumber(file, value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    fail(file, `"${field}" trebuie sa fie un numar pozitiv.`);
  }
}

function requirePrice(file, value) {
  if (!Number.isInteger(value) || value <= 0 || value > MAX_PRICE_BANI) {
    fail(file, '"priceBani" trebuie sa fie un numar intreg de bani (ex. 479700 pentru 4.797 lei).');
  }
}

function requireBase(file, entry, expectedId) {
  if (!entry || typeof entry !== 'object') fail(file, 'continutul nu este un obiect JSON.');
  if (entry.id !== expectedId || !ID_PATTERN.test(entry.id)) {
    fail(file, `"id" trebuie sa fie "${expectedId}", la fel ca numele fisierului.`);
  }
  if (!Number.isInteger(entry.order)) fail(file, '"order" trebuie sa fie un numar intreg.');
  requireText(file, entry.name, 'name', 60);
  requirePrice(file, entry.priceBani);
}

function validateProduct(file, entry, expectedId) {
  requireBase(file, entry, expectedId);
  if (!Array.isArray(entry.colors)) fail(file, '"colors" trebuie sa fie o lista (poate fi goala).');
  entry.colors.forEach((color, i) => requireText(file, color, `colors[${i}]`, 30));
  requireText(file, entry.code, 'code', 30);
  ['length', 'width', 'height'].forEach((key) => requirePositiveNumber(file, entry.dimensionsCm?.[key], `dimensionsCm.${key}`));
  ['net', 'gross'].forEach((key) => requirePositiveNumber(file, entry.weightKg?.[key], `weightKg.${key}`));
  requireBilingual(file, entry.material, 'material');
  ['label', 'shape', 'bestFor'].forEach((key) => requireBilingual(file, entry.collection?.[key], `collection.${key}`));
  ['shape', 'bestFor'].forEach((key) => requireBilingual(file, entry.guide?.[key], `guide.${key}`));
}

function validateAccessory(file, entry, expectedId) {
  requireBase(file, entry, expectedId);
  requireBilingual(file, entry.label, 'label');
  requireText(file, entry.image, 'image', 200);
  if (!Array.isArray(entry.variants)) fail(file, '"variants" trebuie sa fie o lista (poate fi goala).');
  entry.variants.forEach((variant, i) => {
    requireBilingual(file, variant?.color, `variants[${i}].color`);
    requireText(file, variant.swatch, `variants[${i}].swatch`, 30);
    requireText(file, variant.image, `variants[${i}].image`, 200);
  });
}

function readFolder(contentDir, folder, validate) {
  const dir = path.join(contentDir, folder);
  const entries = fs.readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const file = `content/${folder}/${name}`;
      let entry;
      try {
        entry = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
      } catch (err) {
        fail(file, `JSON invalid — ${err.message}`);
      }
      validate(file, entry, path.basename(name, '.json'));
      return entry;
    });
  if (!entries.length) fail(`content/${folder}`, 'folderul nu contine niciun fisier .json.');
  return entries.sort((a, b) => a.order - b.order);
}

// ---- Formate de afisare ----
// RO foloseste virgula zecimala (83,5), EN punctul (83.5).
const number = (value, lang) => value.toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-GB', { maximumFractionDigits: 2 });
const bilingual = (format) => ({ ro: format('ro'), en: format('en') });

function priceLabel(bani) {
  const lei = bani / 100;
  const decimals = Number.isInteger(lei) ? 0 : 2;
  return `${lei.toLocaleString('ro-RO', { minimumFractionDigits: decimals, maximumFractionDigits: 2 })} lei`;
}

function priceLabelFull(bani) {
  return `${(bani / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei`;
}

const lowerFirst = (text) => text.charAt(0).toLocaleLowerCase('ro-RO') + text.slice(1);

function decorateProduct(product) {
  const { length, width, height } = product.dimensionsCm;
  const dims = bilingual((lang) => `${number(length, lang)} × ${number(width, lang)} × ${number(height, lang)} cm`);
  const dimsCompact = `${number(length, 'en')}×${number(width, 'en')}×${number(height, 'en')}cm`;
  const price = priceLabel(product.priceBani);
  return {
    ...product,
    href: `${product.id}.html`,
    priceLabel: price,
    priceLabelFull: priceLabelFull(product.priceBani),
    dims,
    dimsCompact,
    footprint: bilingual((lang) => `${number(length, lang)} × ${number(width, lang)} cm`),
    height: bilingual((lang) => `${number(height, lang)} cm`),
    weightNet: bilingual((lang) => `${number(product.weightKg.net, lang)} kg`),
    weightGross: bilingual((lang) => `${number(product.weightKg.gross, lang)} kg`),
    cardAriaLabel: `Descoperă ${product.name} — ${lowerFirst(product.collection.label.ro)}, ${dimsCompact}, ${price}`,
  };
}

function decorateAccessory(accessory) {
  return {
    ...accessory,
    colors: accessory.variants.map((variant) => variant.color.ro),
    defaultColor: accessory.variants[0]?.color.ro || '',
    priceLabel: priceLabelFull(accessory.priceBani),
  };
}

function uniqueIds(entries, folder) {
  const ids = new Set();
  entries.forEach((entry) => {
    if (ids.has(entry.id)) fail(`content/${folder}`, `id duplicat "${entry.id}".`);
    ids.add(entry.id);
  });
}

// Doar ce are nevoie JS-ul din browser (comparatie, accesorii, meniul din header) —
// fara coduri interne sau alte campuri pe care pagina nu le foloseste.
function toPublicCatalog({ productList, accessoryList }) {
  return {
    products: productList.map((p) => ({
      id: p.id,
      name: p.name,
      href: p.href,
      priceLabel: p.priceLabel,
      dims: p.dims,
      weightNet: p.weightNet,
      material: p.material,
      guide: p.guide,
    })),
    accessories: accessoryList.map((a) => ({
      id: a.id,
      name: a.name,
      label: a.label,
      priceBani: a.priceBani,
      priceLabel: a.priceLabel,
      image: a.image,
      variants: a.variants,
    })),
  };
}

// JSON-ul ajunge intr-un <script type="application/json"> din pagina. Escapam "<"
// ca un text din CMS de forma "</script>" sa nu poata inchide eticheta mai devreme.
function toInlineJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

// contentDir e configurabil doar pentru teste (catalog invalid intr-un folder temporar).
function loadCatalog(contentDir = CONTENT_DIR) {
  const productList = readFolder(contentDir, 'products', validateProduct).map(decorateProduct);
  const accessoryList = readFolder(contentDir, 'accessories', validateAccessory).map(decorateAccessory);
  uniqueIds(productList, 'products');
  uniqueIds(accessoryList, 'accessories');

  const catalog = {
    productList,
    accessoryList,
    products: Object.fromEntries(productList.map((p) => [p.id, p])),
    accessories: Object.fromEntries(accessoryList.map((a) => [a.id, a])),
    minPriceLabel: priceLabel(Math.min(...productList.map((p) => p.priceBani))),
  };
  catalog.publicJson = toInlineJson(toPublicCatalog(catalog));
  return catalog;
}

module.exports = { loadCatalog, priceLabel, priceLabelFull };
