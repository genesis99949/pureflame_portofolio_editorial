'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const cartSource = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'cart.js'), 'utf8');

function createCart(seed = []) {
  const storage = new Map([['pf_cart_v1', JSON.stringify(seed)]]);
  const localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
  };
  const window = {
    localStorage,
    addEventListener() {},
    dispatchEvent() {},
  };
  const document = {
    readyState: 'loading',
    addEventListener() {},
    querySelectorAll: () => [],
  };
  class CustomEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options?.detail;
    }
  }

  vm.runInNewContext(cartSource, { window, document, localStorage, CustomEvent });
  return window.PFCart;
}

function table(id, color = 'Gri') {
  return { id, name: id, color, unitAmountBani: 100, unitPrice: '1,00 lei', image: '' };
}

test('cosul permite maximum 3 mese cumulate intre modele', () => {
  const cart = createCart();

  assert.deepEqual({ ...cart.addItem(table('aether'), 2) }, { added: 2, limitReached: false });
  assert.deepEqual({ ...cart.addItem(table('embera'), 2) }, { added: 1, limitReached: true });
  assert.equal(cart.getTableCount(), 3);
  assert.equal(cart.getRemainingTableCapacity(), 0);
  assert.deepEqual(Array.from(cart.getItems(), (item) => item.qty), [2, 1]);
});

test('accesoriile nu intra in limita totala de 3 mese', () => {
  const cart = createCart();
  cart.addItem(table('aether'), 3);

  const result = cart.addItem({
    id: 'addon-husa',
    name: 'Husă',
    unitAmountBani: 14900,
    unitPrice: '149,00 lei',
    image: '',
  }, 25);

  assert.deepEqual({ ...result }, { added: 25, limitReached: false });
  assert.equal(cart.getTableCount(), 3);
  assert.equal(cart.getItems().find((item) => item.id === 'addon-husa').qty, 25);
});

test('modificarea unei linii nu poate depasi limita cumulata', () => {
  const cart = createCart();
  cart.addItem(table('aether'), 2);
  cart.addItem(table('embera'), 1);
  const embera = cart.getItems().find((item) => item.id === 'embera');

  cart.setQty(embera.key, 3);

  assert.equal(cart.getTableCount(), 3);
  assert.equal(cart.getItems().find((item) => item.id === 'embera').qty, 1);
});
