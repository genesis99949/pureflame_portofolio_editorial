// In teste (NODE_ENV=test) NU incarcam .env-ul real — testele trec explicit configurarea
// prin createApp(), ca sa nu depinda de (si sa nu poata trimite emailuri reale prin) secretele reale.
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const Stripe = require('stripe');

const { buildCheckoutRouter } = require('./routes/checkout');
const { buildWebhookRouter } = require('./routes/webhook');
const { buildContactRouter } = require('./routes/contact');
const { buildReviewsRouter } = require('./routes/reviews');
const { buildSubscribeRouter } = require('./routes/subscribe');
const { buildRateLimiters } = require('./middleware/rateLimit');

const PROJECT_ROOT = path.join(__dirname, '..');

// Lista alba a paginilor publice — NU folosim express.static() pe radacina proiectului,
// altfel s-ar servi si server/, data/ (baza de date cu clienti), package.json etc.
// Toate cele 5 pagini de produs (embera/aether/flavo/fera/ignite) au acum
// propria pagina completa (galerie + configurare + cumparare, integrarea
// editoriala) si au nevoie de ruta directa, nu de redirect. Doar copia de
// concept embera-copy.html ramane retrasa — nu face parte din colectia reala.
const PUBLIC_PAGES = ['index.html', 'colectie.html', 'embera.html', 'aether.html', 'flavo.html', 'fera.html', 'ignite.html', 'confirmare.html', 'privacy.html', 'newsletter.html', 'termeni.html', 'politica-retur.html', 'cos-cumparaturi.html', 'finalizare-comanda.html', 'despre-noi.html'];

// Fisierul ramane in repo, dar fara ruta proprie — vezi redirectul de mai jos.
const RETIRED_PRODUCT_PAGES = {
  'embera-copy.html': 'embera',
};

function createApp({ stripeSecretKey, stripeWebhookSecret, baseUrl, rateLimits } = {}) {
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY este obligatoriu.');
  }
  if (!stripeWebhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET este obligatoriu — fara el, evenimentele de plata nu pot fi verificate in siguranta.');
  }

  const stripe = new Stripe(stripeSecretKey);
  const { checkoutLimiter, contactLimiter, reviewsLimiter, subscribeLimiter, orderLookupLimiter, webhookLimiter, globalLimiter } =
    buildRateLimiters(rateLimits);
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // necesar pentru rate limiting corect in spatele unui reverse proxy (Render/Railway/nginx)

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:'],
          mediaSrc: ["'self'", 'https://d8j0ntlcm91z4.cloudfront.net'],
          connectSrc: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
    })
  );

  // Nicio origine externa nu are nevoie de acces la API — nu adaugam CORS.
  // Fara headere Access-Control-Allow-*, browserele blocheaza implicit cererile cross-site.

  // Limitarea globală protejează doar API-ul. Aplicată pe întregul app, fiecare
  // imagine/CSS/JS consuma din aceeași cotă și putea bloca navigarea legitimă
  // pe paginile editoriale bogate în media.
  app.use('/api', globalLimiter);

  // Webhook-ul Stripe trebuie montat INAINTE de express.json(), cu body brut (necesar pt. verificarea semnaturii).
  app.use('/api', webhookLimiter, buildWebhookRouter(stripe, stripeWebhookSecret));

  app.use(express.json({ limit: '20kb' }));
  app.use('/api/checkout-session', checkoutLimiter);
  app.use('/api/order', orderLookupLimiter);
  app.use('/api/contact', contactLimiter);
  app.use('/api/reviews', reviewsLimiter);
  app.use('/api/subscribe', subscribeLimiter);
  app.use('/api', buildCheckoutRouter(stripe, baseUrl));
  app.use('/api', buildContactRouter());
  app.use('/api', buildReviewsRouter());
  app.use('/api', buildSubscribeRouter(baseUrl));

  app.get('/', (req, res) => res.sendFile(path.join(PROJECT_ROOT, 'index.html')));
  PUBLIC_PAGES.forEach((file) => {
    app.get(`/${file}`, (req, res) => res.sendFile(path.join(PROJECT_ROOT, file)));
  });
  // Vechile adrese de produs nu mai servesc niciun continut, dar nici nu dau 404
  // in fata cuiva care are link salvat: trimit la modelul corespunzator din
  // colectie. 302, nu 301 — 301 se cache-uieste in browser pe termen lung si ar
  // fi greu de intors daca paginile revin vreodata.
  Object.entries(RETIRED_PRODUCT_PAGES).forEach(([file, productId]) => {
    app.get(`/${file}`, (req, res) => res.redirect(302, `/colectie.html#${productId}`));
  });
  // maxAge: 0 + ETag => browserul revalideaza de fiecare data si primeste 304 (raspuns
  // minuscul) daca fisierul nu s-a schimbat. Fara asta, un cache lung ar servi CSS/JS
  // vechi zile intregi dupa un deploy, fara ca noi sa avem cum sa invalidam.
  app.use(
    '/assets',
    express.static(path.join(PROJECT_ROOT, 'assets'), {
      dotfiles: 'deny',
      index: false,
      maxAge: 0,
      etag: true,
      lastModified: true,
    })
  );

  // 404 — API-ul primeste JSON (consecvent cu restul rutelor /api), paginile
  // primesc pagina 404 stilizata. Niciuna nu dezvaluie structura interna de fisiere.
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(404).sendFile(path.join(PROJECT_ROOT, '404.html'));
  });

  // Plasa de siguranta finala: nicio eroare neasteptata nu trebuie sa ajunga la client
  // cu stack trace, query-uri SQL sau cai de fisiere interne. Pastram doar codul HTTP
  // (util pt. cazuri ca "body prea mare") — niciodata err.message sau err.stack.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[unhandled error]', err);
    if (res.headersSent) return next(err);
    const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
    const message = status === 413 ? 'Cererea este prea mare.' : 'A aparut o eroare neasteptata. Incearca din nou.';
    res.status(status).json({ error: message });
  });

  return app;
}

function start() {
  const PORT = process.env.PORT || 3000;
  const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

  let app;
  try {
    app = createApp({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      baseUrl: BASE_URL,
    });
  } catch (err) {
    console.error(`EROARE la pornire: ${err.message}`);
    console.error('Copiaza .env.example in .env si completeaza cheile Stripe (vezi COMENZI-README.md).');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`PureFlame ruleaza pe ${BASE_URL} (port ${PORT})`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { createApp };
