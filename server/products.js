// Preturile pentru Stripe (RON, sumele in bani). Nu se mai editeaza aici: vin din
// catalogul din content/ (vezi server/catalog.js), aceeasi sursa din care se
// genereaza si preturile afisate in pagini.
const { loadCatalog } = require('./catalog');

const catalog = loadCatalog();

const PRODUCTS = Object.fromEntries(catalog.productList.map((p) => [
  p.id,
  { name: p.name, amount: p.priceBani, currency: 'ron', colors: p.colors },
]));

// Accesorii — in cos apar cu id-ul "addon-<cheie>". Preturile vin intotdeauna
// de aici, niciodata din cos (clientul poate trimite orice valoare).
const ACCESSORIES = Object.fromEntries(catalog.accessoryList.map((a) => [
  a.id,
  { name: a.name, amount: a.priceBani, currency: 'ron', colors: a.colors },
]));

function getProduct(id) {
  return Object.hasOwn(PRODUCTS, id) ? PRODUCTS[id] : null;
}

function getAccessory(cartId) {
  if (typeof cartId !== 'string' || !cartId.startsWith('addon-')) return null;
  const key = cartId.slice('addon-'.length);
  return Object.hasOwn(ACCESSORIES, key) ? ACCESSORIES[key] : null;
}

module.exports = { PRODUCTS, ACCESSORIES, getProduct, getAccessory };
