// Catalog produse — sursa unica a preturilor (RON, sumele in bani pentru Stripe).
// Pentru a schimba un pret, editeaza doar valoarea `amount` de mai jos.
const PRODUCTS = {
  embera: { name: 'Embera', amount: 479700, currency: 'ron', colors: ['Negru Intens'] }, // finisaj unic
  aether: { name: 'Aether', amount: 298900, currency: 'ron', colors: ['Gri', 'Negru'] },
  flavo:  { name: 'Flavo',  amount: 299900, currency: 'ron', colors: ['Gri', 'Negru'] },
  fera:   { name: 'Fera',   amount: 429900, currency: 'ron', colors: ['Gri', 'Negru'] },
  ignite: { name: 'Ignite', amount: 309900, currency: 'ron', colors: [] }, // finisaj unic, integral metalic — fara variante de culoare
};

// Accesorii — in cos apar cu id-ul "addon-<cheie>". Preturile sunt in bani si vin
// intotdeauna de aici, niciodata din cos (clientul poate trimite orice valoare).
const ACCESSORIES = {
  pietre:   { name: 'Set pietre vulcanice (rezervă)', amount: 8900, currency: 'ron', colors: [] },
  masca:    { name: 'Mască pentru butelie', amount: 9900, currency: 'ron', colors: ['Gri', 'Negru'] },
  husa:     { name: 'Husă de protecție impermeabilă', amount: 14900, currency: 'ron', colors: [] },
  picioare: { name: 'Set picioare de schimb', amount: 11900, currency: 'ron', colors: [] },
};

function getProduct(id) {
  return Object.hasOwn(PRODUCTS, id) ? PRODUCTS[id] : null;
}

function getAccessory(cartId) {
  if (typeof cartId !== 'string' || !cartId.startsWith('addon-')) return null;
  const key = cartId.slice('addon-'.length);
  return Object.hasOwn(ACCESSORIES, key) ? ACCESSORIES[key] : null;
}

module.exports = { PRODUCTS, ACCESSORIES, getProduct, getAccessory };
