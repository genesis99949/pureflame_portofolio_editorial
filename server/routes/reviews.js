const express = require('express');
const { createProductReview, listApprovedProductReviews } = require('../db');
const { sendReviewNotificationEmail } = require('../email');
const { isString, isValidEmail } = require('../validation');

const PRODUCT_IDS = new Set(['embera', 'aether', 'flavo', 'fera', 'ignite']);

function buildReviewsRouter() {
  const router = express.Router();

  router.get('/reviews', (req, res) => {
    const productId = String(req.query.product || '').toLowerCase();
    if (!PRODUCT_IDS.has(productId)) return res.status(400).json({ error: 'Produs invalid.' });
    res.json({ reviews: listApprovedProductReviews(productId) });
  });

  router.post('/reviews', async (req, res) => {
    try {
      const { productId, displayName, email, rating, message, consent, website } = req.body || {};

      // Honeypot: raspuns neutru pentru boti, fara a le confirma ca au fost detectati.
      if (website) return res.json({ ok: true, pending: true });
      if (!PRODUCT_IDS.has(productId)) return res.status(400).json({ error: 'Produs invalid.' });
      if (!isString(displayName, { max: 60 })) return res.status(400).json({ error: 'Numele afișat este obligatoriu.' });
      if (!isValidEmail(email)) return res.status(400).json({ error: 'Introdu o adresă de email validă.' });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Alege un rating între 1 și 5 stele.' });
      if (!isString(message, { max: 1500 })) return res.status(400).json({ error: 'Recenzia este obligatorie și poate avea maximum 1500 de caractere.' });
      if (consent !== true) return res.status(400).json({ error: 'Este necesar acordul pentru prelucrarea datelor.' });

      const review = {
        productId,
        displayName: displayName.trim(),
        email: email.trim(),
        rating,
        message: message.trim(),
      };
      const id = createProductReview(review);

      try {
        await sendReviewNotificationEmail({ id, ...review });
      } catch (err) {
        console.error('[reviews] eroare la trimiterea notificarii pentru recenzia:', id, err.message);
      }

      res.status(201).json({ ok: true, pending: true });
    } catch (err) {
      console.error('[reviews] eroare:', err.message);
      res.status(500).json({ error: 'A apărut o eroare. Încearcă din nou.' });
    }
  });

  return router;
}

module.exports = { buildReviewsRouter };
