const express = require('express');
const { createContactMessage } = require('../db');
const { sendContactNotificationEmail } = require('../email');
const { isString, isValidEmail, isValidPhone } = require('../validation');

function buildContactRouter() {
  const router = express.Router();

  router.post('/contact', async (req, res) => {
    try {
      const { fullName, phone, email, message, consent } = req.body || {};

      if (!isString(fullName, { max: 100 })) return res.status(400).json({ error: 'Numele este obligatoriu.' });
      if (!isValidEmail(email)) return res.status(400).json({ error: 'Email invalid.' });
      if (phone !== undefined && phone !== null && phone !== '' && !isValidPhone(phone)) {
        return res.status(400).json({ error: 'Telefon invalid.' });
      }
      if (!isString(message, { max: 3000 })) return res.status(400).json({ error: 'Mesajul este obligatoriu (maximum 3000 caractere).' });
      if (consent !== true) return res.status(400).json({ error: 'Este necesar sa fii de acord cu prelucrarea datelor personale.' });

      const id = createContactMessage({
        fullName: fullName.trim(),
        phone: phone && phone.trim() ? phone.trim() : null,
        email: email.trim(),
        message: message.trim(),
      });

      try {
        await sendContactNotificationEmail({
          id,
          fullName: fullName.trim(),
          phone: phone ? phone.trim() : null,
          email: email.trim(),
          message: message.trim(),
        });
      } catch (err) {
        console.error('[contact] eroare la trimiterea emailului pentru mesajul:', id, err.message);
      }

      res.json({ ok: true });
    } catch (err) {
      console.error('[contact] eroare:', err.message);
      res.status(500).json({ error: 'A aparut o eroare. Incearca din nou.' });
    }
  });

  return router;
}

module.exports = { buildContactRouter };
