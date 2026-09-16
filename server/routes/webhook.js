const express = require('express');
const { markOrderPaid, markEmailSent, getOrderBySessionId } = require('../db');
const { sendOrderConfirmationEmail } = require('../email');

function buildWebhookRouter(stripe, webhookSecret) {
  if (!webhookSecret) {
    // createApp() deja garanteaza asta, dar verificam explicit ca sa nu existe niciun
    // mod (actual sau viitor) de a porni acest router fara verificare de semnatura —
    // fara ea, oricine poate trimite un fals "checkout.session.completed" si obtine
    // o comanda marcata drept platita fara sa plateasca.
    throw new Error('buildWebhookRouter necesita un webhookSecret valid.');
  }

  const router = express.Router();

  // Nota: aceasta ruta trebuie montata cu express.raw() (body brut),
  // Stripe verifica semnatura pe bytes, nu pe JSON parsat.
  router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    let event;
    try {
      const sig = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      // Nu trimitem err.message catre apelant — poate contine detalii interne.
      console.error('[webhook] semnatura invalida:', err.message);
      return res.status(400).json({ error: 'Semnatura webhook invalida.' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      markOrderPaid(session.id, session.payment_intent);
      const order = getOrderBySessionId(session.id);
      if (order && !order.email_sent) {
        try {
          await sendOrderConfirmationEmail(order);
          markEmailSent(session.id);
        } catch (err) {
          console.error('[webhook] eroare la trimiterea emailului pentru comanda:', order.id, err.message);
        }
      }
    }

    res.json({ received: true });
  });

  return router;
}

module.exports = { buildWebhookRouter };
