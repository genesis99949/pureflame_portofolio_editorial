// Teste de securitate/regresie pentru backend. Ruleaza cu: npm test
// Foloseste test runner-ul nativ Node (node:test) — fara dependente noi.
'use strict';

const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

// DB_PATH trebuie setat INAINTE de a incarca server/db.js (indirect, prin server/index.js),
// altfel testele ar scrie in baza de date reala. NODE_ENV=test opreste incarcarea .env-ului
// real, ca testele sa nu depinda de (sau sa poata trimite emailuri prin) secretele reale.
const TEST_DB = path.join(os.tmpdir(), `pf-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
process.env.DB_PATH = TEST_DB;
process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server/index');
const { db } = require('../server/db');

const FAKE_STRIPE_KEY = 'sk_test_51FAKEKEYFORTESTSONLYNEVERREAL0000000000000';
const FAKE_WEBHOOK_SECRET = 'whsec_fake_secret_for_tests_only';

const VALID_ORDER_PAYLOAD = {
  productId: 'aether',
  color: 'Gri',
  quantity: 1,
  firstName: 'Ion',
  lastName: 'Popescu',
  email: 'ion.popescu@example.com',
  phone: '0722123456',
  addressStreet: 'Str. Exemplu 10',
  addressNumber: '10',
  postalCode: '010101',
  consent: true,
};

let app;
let server;
let baseUrl;

test.before(async () => {
  app = createApp({
    stripeSecretKey: FAKE_STRIPE_KEY,
    stripeWebhookSecret: FAKE_WEBHOOK_SECRET,
    baseUrl: 'http://localhost:0',
    // Ridicam limita doar pentru endpointurile pe care testele le apeleaza repetat.
    // 'contact' ramane la valoarea reala de productie, ca testul de rate limiting
    // sa verifice efectiv configuratia livrata.
    rateLimits: { subscribe: 100, reviews: 100, checkout: 100, orderLookup: 100 },
  });
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close(); // pe Windows, fisierul nu poate fi sters cat timp conexiunea SQLite e deschisa
  fs.rmSync(TEST_DB, { force: true });
});

async function postJson(pathname, body) {
  return fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ---- Configurare obligatorie (fail-fast) ----

test('createApp refuza sa porneasca fara STRIPE_SECRET_KEY', () => {
  assert.throws(() => createApp({ stripeWebhookSecret: FAKE_WEBHOOK_SECRET }));
});

test('createApp refuza sa porneasca fara STRIPE_WEBHOOK_SECRET (previne bypass de plata)', () => {
  assert.throws(() => createApp({ stripeSecretKey: FAKE_STRIPE_KEY }));
});

// ---- Expunere fisiere statice (fix critic) ----

test('baza de date NU este accesibila prin HTTP', async () => {
  const res = await fetch(`${baseUrl}/data/orders.db`);
  assert.equal(res.status, 404);
});

test('codul sursa al serverului NU este accesibil prin HTTP', async () => {
  const res = await fetch(`${baseUrl}/server/db.js`);
  assert.equal(res.status, 404);
});

test('package.json NU este accesibil prin HTTP', async () => {
  const res = await fetch(`${baseUrl}/package.json`);
  assert.equal(res.status, 404);
});

test('.env NU este accesibil prin HTTP', async () => {
  const res = await fetch(`${baseUrl}/.env`);
  assert.equal(res.status, 404);
});

test('traversarea de directoare catre fisiere din afara /assets este blocata', async () => {
  const res = await fetch(`${baseUrl}/assets/../server/db.js`);
  assert.notEqual(res.status, 200);
});

test('paginile publice raman accesibile', async () => {
  for (const page of ['/', '/colectie.html', '/confirmare.html', '/privacy.html']) {
    const res = await fetch(`${baseUrl}${page}`);
    assert.equal(res.status, 200, `${page} ar trebui sa fie 200`);
  }
});

test('limitarea globala protejeaza API-ul fara sa blocheze paginile si asseturile', async () => {
  const limitedApp = createApp({
    stripeSecretKey: FAKE_STRIPE_KEY,
    stripeWebhookSecret: FAKE_WEBHOOK_SECRET,
    baseUrl: 'http://localhost:0',
    rateLimits: { global: 1, webhook: 100 },
  });
  const limitedServer = await new Promise((resolve) => {
    const instance = limitedApp.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const limitedBaseUrl = `http://127.0.0.1:${limitedServer.address().port}`;

  try {
    assert.equal((await fetch(`${limitedBaseUrl}/`)).status, 200);
    assert.equal((await fetch(`${limitedBaseUrl}/`)).status, 200);
    assert.equal((await fetch(`${limitedBaseUrl}/assets/css/site.css`)).status, 200);

    assert.equal((await fetch(`${limitedBaseUrl}/api/inexistent`)).status, 404);
    assert.equal((await fetch(`${limitedBaseUrl}/api/inexistent`)).status, 429);
  } finally {
    await new Promise((resolve) => limitedServer.close(resolve));
  }
});

test('assets (css/js) raman accesibile', async () => {
  const res = await fetch(`${baseUrl}/assets/css/site.css`);
  assert.equal(res.status, 200);
});

// ---- Headere de securitate ----

test('raspunsurile includ headere de securitate (helmet)', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.ok(res.headers.get('content-security-policy'), 'CSP lipseste');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(res.headers.get('referrer-policy'), 'Referrer-Policy lipseste');
  assert.equal(res.headers.get('x-powered-by'), null, 'X-Powered-By ar trebui ascuns');
});

// ---- Webhook: fara bypass de semnatura ----

test('webhook respinge un eveniment fara semnatura Stripe valida', async () => {
  const res = await postJson('/api/webhook', {
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_fals_de_atacator', payment_intent: 'pi_fals' } },
  });
  assert.equal(res.status, 400);
});

// ---- Validare /api/checkout-session ----

test('checkout-session respinge body gol', async () => {
  const res = await postJson('/api/checkout-session', {});
  assert.equal(res.status, 400);
});

test('checkout-session respinge un produs necunoscut', async () => {
  const res = await postJson('/api/checkout-session', { ...VALID_ORDER_PAYLOAD, productId: 'produs-inexistent' });
  assert.equal(res.status, 400);
});

test('checkout-session respinge cod postal invalid', async () => {
  const res = await postJson('/api/checkout-session', { ...VALID_ORDER_PAYLOAD, postalCode: '123' });
  assert.equal(res.status, 400);
});

test('checkout-session respinge cantitate peste limita', async () => {
  const res = await postJson('/api/checkout-session', { ...VALID_ORDER_PAYLOAD, quantity: 99 });
  assert.equal(res.status, 400);
});

test('checkout-session limiteaza la 3 totalul meselor, nu fiecare model separat', async () => {
  const res = await postJson('/api/checkout-session', {
    ...VALID_ORDER_PAYLOAD,
    items: [
      { id: 'aether', qty: 2 },
      { id: 'embera', qty: 2 },
      { id: 'addon-husa', qty: 20 },
    ],
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /maximum 3 mese in total/i);
});

test('checkout-session respinge email invalid', async () => {
  const res = await postJson('/api/checkout-session', { ...VALID_ORDER_PAYLOAD, email: 'nu-e-email' });
  assert.equal(res.status, 400);
});

test('checkout-session respinge fara consimtamant GDPR', async () => {
  const res = await postJson('/api/checkout-session', { ...VALID_ORDER_PAYLOAD, consent: false });
  assert.equal(res.status, 400);
});

test('checkout-session respinge campuri text peste lungimea maxima', async () => {
  const res = await postJson('/api/checkout-session', { ...VALID_ORDER_PAYLOAD, firstName: 'a'.repeat(500) });
  assert.equal(res.status, 400);
});

test('checkout-session respinge campuri cu tip gresit (type confusion) fara sa se blocheze', async () => {
  const res = await postJson('/api/checkout-session', {
    ...VALID_ORDER_PAYLOAD,
    firstName: { injected: true },
    lastName: ['array', 'nu', 'string'],
  });
  assert.equal(res.status, 400);
});

// ---- Validare /api/contact ----

test('contact respinge email invalid', async () => {
  const res = await postJson('/api/contact', { fullName: 'Test', email: 'gresit', message: 'salut', consent: true });
  assert.equal(res.status, 400);
});

test('contact respinge mesaj peste lungimea maxima', async () => {
  const res = await postJson('/api/contact', {
    fullName: 'Test',
    email: 'a@b.com',
    message: 'a'.repeat(5000),
    consent: true,
  });
  assert.equal(res.status, 400);
});

test('contact respinge fara consimtamant GDPR', async () => {
  const res = await postJson('/api/contact', { fullName: 'Test', email: 'a@b.com', message: 'salut', consent: false });
  assert.equal(res.status, 400);
});

// ---- Recenzii produse /api/reviews ----

test('reviews respinge produse necunoscute', async () => {
  const res = await postJson('/api/reviews', {
    productId: 'produs-inventat', displayName: 'Ana', email: 'ana@example.com', rating: 5,
    message: 'O recenzie valida ca lungime.', consent: true,
  });
  assert.equal(res.status, 400);
});

test('reviews salveaza recenzia ca pending si nu o publica automat', async () => {
  const payload = {
    productId: 'aether', displayName: 'Ana', email: 'ana@example.com', rating: 5,
    message: 'O recenzie valida ca lungime.', consent: true,
  };
  const postRes = await postJson('/api/reviews', payload);
  assert.equal(postRes.status, 201);

  const { listProductReviews } = require('../server/db');
  const saved = listProductReviews().find((review) => review.email === payload.email);
  assert.ok(saved, 'recenzia trebuie salvata');
  assert.equal(saved.status, 'pending');

  const getRes = await fetch(`${baseUrl}/api/reviews?product=aether`);
  const body = await getRes.json();
  assert.equal(body.reviews.some((review) => review.id === saved.id), false, 'recenzia pending nu trebuie publicata');
});

test('reviews publica doar datele publice dupa aprobare, fara email', async () => {
  const { listProductReviews } = require('../server/db');
  const saved = listProductReviews().find((review) => review.email === 'ana@example.com');
  db.prepare(`UPDATE product_reviews SET status = 'approved', approved_at = ? WHERE id = ?`).run(new Date().toISOString(), saved.id);

  const getRes = await fetch(`${baseUrl}/api/reviews?product=aether`);
  const body = await getRes.json();
  const published = body.reviews.find((review) => review.id === saved.id);
  assert.ok(published, 'recenzia aprobata trebuie publicata');
  assert.equal(Object.hasOwn(published, 'email'), false, 'emailul nu trebuie expus public');
});

// ---- Newsletter /api/subscribe ----

const CONSENT_TEXT = 'Sunt de acord sa primesc emailuri de la PureFlame.';

test('subscribe respinge email invalid', async () => {
  const res = await postJson('/api/subscribe', { email: 'gresit', consent: true, consentText: CONSENT_TEXT });
  assert.equal(res.status, 400);
});

test('subscribe respinge fara consimtamant explicit', async () => {
  const res = await postJson('/api/subscribe', { email: 'a@b.com', consent: false, consentText: CONSENT_TEXT });
  assert.equal(res.status, 400);
});

test('subscribe respinge daca lipseste textul consimtamantului (dovada GDPR)', async () => {
  const res = await postJson('/api/subscribe', { email: 'a@b.com', consent: true });
  assert.equal(res.status, 400);
});

test('subscribe salveaza abonatul ca "pending" cu dovada consimtamantului', async () => {
  const res = await postJson('/api/subscribe', {
    email: 'Abonat.Nou@Example.COM',
    consent: true,
    consentText: CONSENT_TEXT,
    sourcePage: 'index',
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);

  const { getSubscriberByEmail } = require('../server/db');
  const sub = getSubscriberByEmail('abonat.nou@example.com'); // normalizat lowercase
  assert.ok(sub, 'abonatul trebuie salvat in baza de date');
  assert.equal(sub.status, 'pending', 'nu devine confirmat fara double opt-in');
  assert.equal(sub.consent_text, CONSENT_TEXT, 'textul consimtamantului trebuie pastrat ca dovada');
  assert.ok(sub.consent_at, 'momentul consimtamantului trebuie pastrat');
  assert.ok(sub.unsubscribe_token, 'trebuie generat token de dezabonare');
});

test('subscribe nu creeaza duplicat pentru aceeasi adresa', async () => {
  const { listSubscribers } = require('../server/db');
  const email = `dublu${Date.now()}@example.com`;
  await postJson('/api/subscribe', { email, consent: true, consentText: CONSENT_TEXT });
  await postJson('/api/subscribe', { email, consent: true, consentText: CONSENT_TEXT });
  const matches = listSubscribers().filter((s) => s.email === email);
  assert.equal(matches.length, 1);
});

test('confirmarea prin token activeaza abonatul, iar dezabonarea il dezactiveaza', async () => {
  const { getSubscriberByEmail } = require('../server/db');
  const email = `flux${Date.now()}@example.com`;
  await postJson('/api/subscribe', { email, consent: true, consentText: CONSENT_TEXT });

  const pending = getSubscriberByEmail(email);
  assert.equal(pending.status, 'pending');

  const confirmRes = await fetch(`${baseUrl}/api/confirm?token=${pending.confirm_token}`, { redirect: 'manual' });
  assert.ok([301, 302, 303, 307].includes(confirmRes.status), 'confirmarea trebuie sa redirectioneze');
  assert.equal(getSubscriberByEmail(email).status, 'confirmed');

  const unsubToken = getSubscriberByEmail(email).unsubscribe_token;
  await fetch(`${baseUrl}/api/unsubscribe?token=${unsubToken}`, { redirect: 'manual' });
  assert.equal(getSubscriberByEmail(email).status, 'unsubscribed');
});

test('token de confirmare invalid nu confirma pe nimeni', async () => {
  const res = await fetch(`${baseUrl}/api/confirm?token=token_inventat_de_atacator`, { redirect: 'manual' });
  const location = res.headers.get('location') || '';
  assert.ok(location.includes('eroare'), `asteptam redirect catre eroare, am primit: ${location}`);
});

// ---- Lookup comanda ----

test('GET /api/order fara session_id este respins', async () => {
  const res = await fetch(`${baseUrl}/api/order`);
  assert.equal(res.status, 400);
});

test('GET /api/order pentru o comanda inexistenta/neplatita intoarce 404 (nu expune date)', async () => {
  const res = await fetch(`${baseUrl}/api/order?session_id=cs_test_nu_exista`);
  assert.equal(res.status, 404);
});

// ---- Rate limiting ----

test('formularul de contact este limitat dupa cereri repetate', async () => {
  const payload = { fullName: 'Spam', email: 'spam@example.com', message: 'salut', consent: true };
  const statuses = [];
  for (let i = 0; i < 6; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await postJson('/api/contact', payload);
    statuses.push(res.status);
  }
  assert.ok(statuses.includes(429), `asteptam un 429 in ${JSON.stringify(statuses)}`);
});
