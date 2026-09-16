// Catalog produse — sursa unica a preturilor (RON, sumele in bani pentru Stripe).
// Pentru a schimba un pret, editeaza doar valoarea `amount` de mai jos.
const PRODUCTS = {
  embera: { name: 'Embera', amount: 479700, currency: 'ron', colors: ['Negru Intens'] }, // finisaj unic
  aether: { name: 'Aether', amount: 298900, currency: 'ron', colors: ['Gri', 'Negru'] },
  flavo:  { name: 'Flavo',  amount: 299900, currency: 'ron', colors: ['Gri', 'Negru'] },
  fera:   { name: 'Fera',   amount: 429900, currency: 'ron', colors: ['Gri', 'Negru'] },
  ignite: { name: 'Ignite', amount: 309900, currency: 'ron', colors: [] }, // finisaj unic, integral metalic — fara variante de culoare
};

function getProduct(id) {
  return PRODUCTS[id] || null;
}

module.exports = { PRODUCTS, getProduct };
