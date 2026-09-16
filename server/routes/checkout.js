const express = require('express');
const { getProduct } = require('../products');
const { createOrder, getOrderBySessionId } = require('../db');
const { isString, isValidEmail, isValidPhone, isValidPostalCode } = require('../validation');

const MAX_QUANTITY = 3;

function buildCheckoutRouter(stripe, baseUrl) {
  const router = express.Router();

  router.post('/checkout-session', async (req, res) => {
    try {
      const body = req.body || {};
      // Coșul nou trimite toate liniile. Regula comercială privește suma
      // meselor, nu fiecare model separat; accesoriile "addon-*" sunt excluse.
      if (Array.isArray(body.items)) {
        let tableQuantity = 0;
        for (const item of body.items) {
          const itemQuantity = Number(item?.qty);
          if (!Number.isInteger(itemQuantity) || itemQuantity < 1) {
            return res.status(400).json({ error: 'Cantitate invalida in cos.' });
          }
          if (!String(item?.id || '').startsWith('addon-')) tableQuantity += itemQuantity;
        }
        if (tableQuantity > MAX_QUANTITY) {
          return res.status(400).json({ error: `O comanda poate include maximum ${MAX_QUANTITY} mese in total. Accesoriile nu intra in aceasta limita.` });
        }
      }
      const { productId, color, firstName, lastName, email, phone, addressStreet, addressNumber, postalCode, consent } = body;
      const quantity = Number.parseInt(body.quantity, 10);

      if (!isString(productId, { max: 40 })) {
        return res.status(400).json({ error: 'Produs necunoscut.' });
      }
      const product = getProduct(productId);
      if (!product) {
        return res.status(400).json({ error: 'Produs necunoscut.' });
      }
      if (color !== undefined && color !== null && (!isString(color, { max: 30 }) || (product.colors.length && !product.colors.includes(color)))) {
        return res.status(400).json({ error: 'Culoare invalida.' });
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
        return res.status(400).json({ error: `Cantitatea trebuie sa fie intre 1 si ${MAX_QUANTITY}. Pentru cantitati mai mari, te rugam sa ne contactezi.` });
      }
      if (!isString(firstName, { max: 80 })) return res.status(400).json({ error: 'Prenumele este obligatoriu.' });
      if (!isString(lastName, { max: 80 })) return res.status(400).json({ error: 'Numele este obligatoriu.' });
      if (!isValidEmail(email)) return res.status(400).json({ error: 'Email invalid.' });
      if (!isValidPhone(phone)) return res.status(400).json({ error: 'Telefon invalid.' });
      if (!isString(addressStreet, { max: 200 })) return res.status(400).json({ error: 'Adresa este obligatorie.' });
      if (!isString(addressNumber, { max: 20 })) return res.status(400).json({ error: 'Numarul este obligatoriu.' });
      if (!isValidPostalCode(postalCode)) return res.status(400).json({ error: 'Codul postal trebuie sa aiba 6 cifre.' });
      if (consent !== true) return res.status(400).json({ error: 'Este necesar sa fii de acord cu prelucrarea datelor personale.' });

      const productLabel = color ? `${product.name} (${color})` : product.name;

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: product.currency,
              unit_amount: product.amount,
              product_data: { name: `PureFlame — ${productLabel}` },
            },
            quantity,
          },
        ],
        customer_email: email.trim(),
        success_url: `${baseUrl}/confirmare.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/${productId}.html?comanda=anulata`,
        metadata: { productId, color: color || '' },
      });

      createOrder({
        productId,
        productName: product.name,
        color: color || null,
        quantity,
        amount: product.amount,
        currency: product.currency,
        customerFirstName: firstName.trim(),
        customerLastName: lastName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        addressStreet: addressStreet.trim(),
        addressNumber: addressNumber.trim(),
        addressPostalCode: postalCode.trim(),
        stripeSessionId: session.id,
      });

      res.json({ url: session.url });
    } catch (err) {
      console.error('[checkout-session] eroare:', err.message);
      res.status(500).json({ error: 'A aparut o eroare la initierea platii. Incearca din nou.' });
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
    });
  });

  return router;
}

module.exports = { buildCheckoutRouter };
