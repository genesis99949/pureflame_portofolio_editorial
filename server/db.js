const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

// DB_PATH permite izolarea bazei de date in teste (fisier temporar) fara sa atinga datele reale.
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'orders.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    color TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL,
    customer_first_name TEXT NOT NULL,
    customer_last_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address_street TEXT NOT NULL,
    address_number TEXT NOT NULL,
    address_postal_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    email_sent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    paid_at TEXT
  )
`);

function createOrder(order) {
  const stmt = db.prepare(`
    INSERT INTO orders (product_id, product_name, color, quantity, amount, currency, customer_first_name, customer_last_name, customer_email, customer_phone, address_street, address_number, address_postal_code, status, stripe_session_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `);
  const info = stmt.run(
    order.productId,
    order.productName,
    order.color || null,
    order.quantity,
    order.amount,
    order.currency,
    order.customerFirstName,
    order.customerLastName,
    order.customerEmail,
    order.customerPhone,
    order.addressStreet,
    order.addressNumber,
    order.addressPostalCode,
    order.stripeSessionId,
    new Date().toISOString()
  );
  return Number(info.lastInsertRowid);
}

function markOrderPaid(stripeSessionId, paymentIntentId) {
  const stmt = db.prepare(`
    UPDATE orders SET status = 'paid', stripe_payment_intent = ?, paid_at = ?
    WHERE stripe_session_id = ?
  `);
  stmt.run(paymentIntentId || null, new Date().toISOString(), stripeSessionId);
}

function markEmailSent(stripeSessionId) {
  db.prepare(`UPDATE orders SET email_sent = 1 WHERE stripe_session_id = ?`).run(stripeSessionId);
}

function getOrderBySessionId(stripeSessionId) {
  return db.prepare(`SELECT * FROM orders WHERE stripe_session_id = ?`).get(stripeSessionId) || null;
}

function listOrders() {
  return db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all();
}

db.exec(`
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

function createContactMessage(msg) {
  const stmt = db.prepare(`
    INSERT INTO contact_messages (full_name, phone, email, message, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(msg.fullName, msg.phone || null, msg.email, msg.message, new Date().toISOString());
  return Number(info.lastInsertRowid);
}

function listContactMessages() {
  return db.prepare(`SELECT * FROM contact_messages ORDER BY created_at DESC`).all();
}

db.exec(`
  CREATE TABLE IF NOT EXISTS product_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    approved_at TEXT
  )
`);

function createProductReview(review) {
  const stmt = db.prepare(`
    INSERT INTO product_reviews (product_id, display_name, email, rating, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `);
  const info = stmt.run(
    review.productId,
    review.displayName,
    review.email,
    review.rating,
    review.message,
    new Date().toISOString()
  );
  return Number(info.lastInsertRowid);
}

function listApprovedProductReviews(productId) {
  return db.prepare(`
    SELECT id, product_id, display_name, rating, message, approved_at, created_at
    FROM product_reviews
    WHERE product_id = ? AND status = 'approved'
    ORDER BY COALESCE(approved_at, created_at) DESC
  `).all(productId);
}

function listProductReviews() {
  return db.prepare(`SELECT * FROM product_reviews ORDER BY created_at DESC`).all();
}

// Abonati newsletter. GDPR art. 7(1) cere sa poti DEMONSTRA consimtamantul, de aceea
// pastram textul exact acceptat, momentul si IP-ul — nu doar adresa de email.
// status: 'pending' (nu a confirmat inca) | 'confirmed' (double opt-in complet) | 'unsubscribed'
// Doar abonatii 'confirmed' au voie sa primeasca emailuri de marketing.
db.exec(`
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending',
    consent_text TEXT NOT NULL,
    consent_ip TEXT,
    consent_at TEXT NOT NULL,
    source_page TEXT,
    confirm_token TEXT,
    unsubscribe_token TEXT NOT NULL,
    confirmed_at TEXT,
    unsubscribed_at TEXT,
    welcome_email_sent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )
`);

function getSubscriberByEmail(email) {
  return db.prepare(`SELECT * FROM subscribers WHERE email = ?`).get(email) || null;
}

function createSubscriber(sub) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO subscribers (email, status, consent_text, consent_ip, consent_at, source_page, confirm_token, unsubscribe_token, created_at)
    VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    sub.email,
    sub.consentText,
    sub.consentIp || null,
    now,
    sub.sourcePage || null,
    sub.confirmToken,
    sub.unsubscribeToken,
    now
  );
  return Number(info.lastInsertRowid);
}

// Re-inscriere dupa dezabonare: reactivam randul existent cu o dovada noua de consimtamant.
function resubscribe(email, sub) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE subscribers
    SET status = 'pending', consent_text = ?, consent_ip = ?, consent_at = ?, source_page = ?,
        confirm_token = ?, unsubscribe_token = ?, confirmed_at = NULL, unsubscribed_at = NULL,
        welcome_email_sent = 0
    WHERE email = ?
  `).run(sub.consentText, sub.consentIp || null, now, sub.sourcePage || null, sub.confirmToken, sub.unsubscribeToken, email);
}

function confirmSubscriber(token) {
  const row = db.prepare(`SELECT * FROM subscribers WHERE confirm_token = ?`).get(token);
  if (!row) return null;
  db.prepare(`
    UPDATE subscribers SET status = 'confirmed', confirmed_at = ?, confirm_token = NULL WHERE id = ?
  `).run(new Date().toISOString(), row.id);
  return getSubscriberByEmail(row.email);
}

function unsubscribeByToken(token) {
  const row = db.prepare(`SELECT * FROM subscribers WHERE unsubscribe_token = ?`).get(token);
  if (!row) return null;
  db.prepare(`
    UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = ? WHERE id = ?
  `).run(new Date().toISOString(), row.id);
  return row;
}

function markWelcomeEmailSent(email) {
  db.prepare(`UPDATE subscribers SET welcome_email_sent = 1 WHERE email = ?`).run(email);
}

function listSubscribers() {
  return db.prepare(`SELECT * FROM subscribers ORDER BY created_at DESC`).all();
}

module.exports = {
  db,
  createOrder,
  markOrderPaid,
  markEmailSent,
  getOrderBySessionId,
  listOrders,
  createContactMessage,
  listContactMessages,
  createProductReview,
  listApprovedProductReviews,
  listProductReviews,
  getSubscriberByEmail,
  createSubscriber,
  resubscribe,
  confirmSubscriber,
  unsubscribeByToken,
  markWelcomeEmailSent,
  listSubscribers,
};
