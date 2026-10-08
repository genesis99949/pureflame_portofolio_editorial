const express = require('express');
const { getProduct, getAccessory } = require('../products');
const { createOrder, getOrderById, getOrderBySessionId, markEmailSentById } = require('../db');
const { sendOrderConfirmationEmail } = require('../email');
const { isString, isValidEmail, isValidPhone, isValidPostalCode } = require('../validation');

const MAX_QUANTITY = 3; // mese per comanda
const MAX_ACCESSORY_QUANTITY = 20;
const MAX_CART_LINES = 20;

// Transforma cosul trimis de browser in linii de comanda de incredere.
// Din cos luam DOAR id, culoare si cantitate; numele si pretul vin din catalogul
// serverului (products.js), altfel oricine ar putea plati 1 leu pentru o masa.
function resolveCart(body) {
  const rawItems = Array.isArray(body.items)
    ? body.items
    : [{ id: body.productId, color: body.color, qty: body.quantity }]; // format vechi: un singur produs

  if (rawItems.length < 1 || rawItems.length > MAX_CART_LINES) return { error: 'Cosul este gol sau prea mare.' };

  const lines = [];
  let tableQuantity = 0;
  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object') return { error: 'Produs necunoscut.' };
    const qty = Number(raw.qty);
    if (!Number.isInteger(qty) || qty < 1) return { error: 'Cantitate invalida in cos.' };
    if (!isString(raw.id, { max: 40 })) return { error: 'Produs necunoscut.' };

    const accessory = getAccessory(raw.id);
    const product = accessory || getProduct(raw.id);
    if (!product) return { error: 'Produs necunoscut.' };

    const color = raw.color === undefined || raw.color === null || raw.color === '' ? null : raw.color;
    if (color !== null && (!isString(color, { max: 30 }) || (product.colors.length && !product.colors.includes(color)))) {
      return { error: 'Culoare invalida.' };
    }

    if (accessory) {
      if (qty > MAX_ACCESSORY_QUANTITY) return { error: 'Cantitate prea mare pentru un accesoriu.' };
    } else {
      tableQuantity += qty;
    }
    lines.push({ id: raw.id, name: product.name, color, qty, unitAmount: product.amount, currency: product.currency });
  }

  if (tableQuantity > MAX_QUANTITY) {
    return { error: `O comanda poate include maximum ${MAX_QUANTITY} mese in total. Accesoriile nu intra in aceasta limita.` };
  }
  return { lines };
}

function validateCustomer(body) {
  const { firstName, lastName, email, phone, addressStreet, addressNumber, postalCode, consent } = body;
  if (!isString(firstName, { max: 80 })) return 'Prenumele este obligatoriu.';
  if (!isString(lastName, { max: 80 })) return 'Numele este obligatoriu.';
  if (!isValidEmail(email)) return 'Email invalid.';
  if (!isValidPhone(phone)) return 'Telefon invalid.';
  if (!isString(addressStreet, { max: 200 })) return 'Adresa este obligatorie.';
  if (!isString(addressNumber, { max: 20 })) return 'Numarul este obligatoriu.';
  if (!isValidPostalCode(postalCode)) return 'Codul postal trebuie sa aiba 6 cifre.';
  if (consent !== true) return 'Este necesar sa fii de acord cu prelucrarea datelor personale.';
  return null;
}

const lineLabel = (line) => (line.color ? `${line.name} (${line.color})` : line.name);

// O singura linie pastreaza forma veche (amount = pret unitar, total = amount × quantity).
// Pentru mai multe linii, amount = totalul comenzii si quantity = 1.
function orderSummary(lines) {
  if (lines.length === 1) {
    const [line] = lines;
    return { productId: line.id, productName: line.name, color: line.color, quantity: line.qty, amount: line.unitAmount, currency: line.currency };
  }
  const total = lines.reduce((sum, line) => sum + line.unitAmount * line.qty, 0);
  return {
    productId: 'cart',
    productName: lines.map((line) => `${lineLabel(line)} × ${line.qty}`).join(', '),
    color: null,
    quantity: 1,
    amount: total,
    currency: lines[0].currency,
  };
}

function buildOrderRecord(body, lines, extra) {
  return {
    ...orderSummary(lines),
    customerFirstName: body.firstName.trim(),
    customerLastName: body.lastName.trim(),
    customerEmail: body.email.trim(),
    customerPhone: body.phone.trim(),
    addressStreet: body.addressStreet.trim(),
    addressNumber: body.addressNumber.trim(),
    addressPostalCode: body.postalCode.trim(),
    items: lines.map(({ id, name, color, qty, unitAmount }) => ({ id, name, color, qty, unitAmount })),
    ...extra,
  };
}

function buildCheckoutRouter(stripe, baseUrl) {
  const router = express.Router();

  // Card / Apple Pay / Google Pay: Stripe Checkout (wallet-urile apar automat in pagina Stripe).
  router.post('/checkout-session', async (req, res) => {
    try {
      const body = req.body || {};
      const cart = resolveCart(body);
      if (cart.error) return res.status(400).json({ error: cart.error });
      const customerError = validateCustomer(body);
      if (customerError) return res.status(400).json({ error: customerError });

      const { lines } = cart;
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lines.map((line) => ({
          price_data: {
            currency: line.currency,
            unit_amount: line.unitAmount,
            product_data: { name: `PureFlame — ${lineLabel(line)}` },
          },
          quantity: line.qty,
        })),
        customer_email: body.email.trim(),
        success_url: `${baseUrl}/confirmare.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cos-cumparaturi.html?comanda=anulata`,
        metadata: { cart: lines.map((l) => `${l.id}:${l.qty}`).join(',').slice(0, 500) },
      });

      createOrder(buildOrderRecord(body, lines, { stripeSessionId: session.id, paymentMethod: 'card' }));
      res.json({ url: session.url });
    } catch (err) {
      console.error('[checkout-session] eroare:', err.message);
      res.status(500).json({ error: 'A aparut o eroare la initierea platii. Incearca din nou.' });
    }
  });

  // Ramburs: fara plata online; comanda se inregistreaza direct si clientul plateste la livrare.
  router.post('/order', async (req, res) => {
    try {
      const body = req.body || {};
      if (body.paymentMethod !== 'ramburs') {
        return res.status(400).json({ error: 'Metoda de plata invalida.' });
      }
      const cart = resolveCart(body);
      if (cart.error) return res.status(400).json({ error: cart.error });
      const customerError = validateCustomer(body);
      if (customerError) return res.status(400).json({ error: customerError });

      const id = createOrder(buildOrderRecord(body, cart.lines, { status: 'cod', paymentMethod: 'ramburs' }));
      try {
        await sendOrderConfirmationEmail(getOrderById(id));
        markEmailSentById(id);
      } catch (err) {
        console.error('[order] eroare la trimiterea emailului pentru comanda:', id, err.message);
      }
      res.status(201).json({ ok: true, orderId: id });
    } catch (err) {
      console.error('[order] eroare:', err.message);
      res.status(500).json({ error: 'A aparut o eroare la inregistrarea comenzii. Incearca din nou.' });
    }
  });

  router.get('/order', (req, res) => {
    const sessionId = req.query.session_id;
    if (!isString(sessionId, { max: 200 })) {
      return res.status(400).json({ error: 'session_id lipsa sau invalid.' });
    }
    const order = getOrderBySessionId(sessionId);
    // Nu confirmam si nu expunem datele comenzii (nume, adresa, email) decat dupa ce
    // plata a fost efectiv confirmata prin webhook — o comanda "pending" ramane invizibila
    // chiar daca cineva obtine/ghiceste session_id-ul.
    if (!order || order.status !== 'paid') return res.status(404).json({ error: 'Comanda nu a fost gasita.' });
    res.json({
      id: order.id,
      productName: order.product_name,
      color: order.color,
      quantity: order.quantity,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      customerFirstName: order.customer_first_name,
      customerLastName: order.customer_last_name,
      customerEmail: order.customer_email,
      addressStreet: order.address_street,
      addressNumber: order.address_number,
      addressPostalCode: order.address_postal_code,
      items: order.items_json ? JSON.parse(order.items_json) : null,
    });
  });

  return router;
}

module.exports = { buildCheckoutRouter };
