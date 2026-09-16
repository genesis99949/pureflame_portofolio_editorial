const rateLimit = require('express-rate-limit');

// Raspuns uniform, fara sa dezvaluie detalii interne despre limitare.
function tooManyRequests(req, res) {
  res.status(429).json({ error: 'Prea multe cereri. Te rugam sa incerci din nou mai tarziu.' });
}

// Limitele implicite sunt cele de PRODUCTIE. Sunt configurabile doar ca testele
// sa poata exercita repetat un endpoint fara sa slabeasca protectia reala.
const DEFAULT_LIMITS = {
  checkout: 10, // creare sesiune Stripe — operatiune costisitoare, tinta pentru abuz
  contact: 5, // formular de contact — tinta clasica de spam
  reviews: 5, // recenziile sunt moderate, dar limitarea reduce spamul automat
  subscribe: 5, // abonare newsletter — tinta pentru boti si liste furate
  orderLookup: 30, // pagina de confirmare face polling scurt; marja generoasa
  webhook: 60, // Stripe poate retrimite evenimente; doar plasa de siguranta
  global: 300,
};

function make(limit, windowMs = 15 * 60 * 1000) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: tooManyRequests,
  });
}

function buildRateLimiters(overrides = {}) {
  const limits = { ...DEFAULT_LIMITS, ...overrides };
  return {
    checkoutLimiter: make(limits.checkout),
    contactLimiter: make(limits.contact),
    reviewsLimiter: make(limits.reviews),
    subscribeLimiter: make(limits.subscribe),
    orderLookupLimiter: make(limits.orderLookup),
    webhookLimiter: make(limits.webhook, 60 * 1000),
    globalLimiter: make(limits.global),
  };
}

module.exports = { buildRateLimiters, DEFAULT_LIMITS };
