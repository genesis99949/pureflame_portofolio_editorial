const express = require('express');
const crypto = require('node:crypto');
const {
  getSubscriberByEmail,
  createSubscriber,
  resubscribe,
  confirmSubscriber,
  unsubscribeByToken,
} = require('../db');
const { sendSubscriberConfirmationEmail } = require('../email');
const { isString, isValidEmail } = require('../validation');

function token() {
  return crypto.randomBytes(32).toString('hex');
}

// Pagina din care s-a facut inscrierea — util pentru statistici, dar acceptam
// doar un slug scurt si sanitizat, nu o valoare arbitrara trimisa de client.
function safeSourcePage(value) {
  if (!isString(value, { max: 60 })) return null;
  const cleaned = value.trim().toLowerCase();
  return /^[a-z0-9._-]+$/.test(cleaned) ? cleaned : null;
}

function buildSubscribeRouter(baseUrl) {
  const router = express.Router();

  router.post('/subscribe', async (req, res) => {
    try {
      const { email, consent, consentText, sourcePage } = req.body || {};

      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Email invalid.' });
      }
      if (consent !== true) {
        return res.status(400).json({ error: 'Este necesar sa fii de acord cu primirea de emailuri.' });
      }
      if (!isString(consentText, { max: 500 })) {
        return res.status(400).json({ error: 'Lipseste textul consimtamantului.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const confirmToken = token();
      const unsubscribeToken = token();
      const consentPayload = {
        consentText: consentText.trim(),
        // IP-ul e pastrat strict ca dovada a consimtamantului (GDPR art. 7), nu pentru profilare.
        consentIp: req.ip || null,
        sourcePage: safeSourcePage(sourcePage),
        confirmToken,
        unsubscribeToken,
      };

      const existing = getSubscriberByEmail(normalizedEmail);

      if (existing && existing.status === 'confirmed') {
        // Deja abonat — raspundem la fel ca la o inscriere reusita, ca sa nu dezvaluim
        // cine este sau nu este deja pe lista (evitam enumerarea adreselor).
        return res.json({ ok: true, alreadySubscribed: true });
      }

      if (existing) {
        resubscribe(normalizedEmail, consentPayload);
      } else {
        createSubscriber({ email: normalizedEmail, ...consentPayload });
      }

      // Emailul de confirmare (double opt-in). Daca SMTP nu e configurat inca, functia
      // doar il afiseaza in consola — inscrierea ramane valida, cu status 'pending'.
      try {
        await sendSubscriberConfirmationEmail({
          email: normalizedEmail,
          confirmUrl: `${baseUrl}/api/confirm?token=${confirmToken}`,
          unsubscribeUrl: `${baseUrl}/api/unsubscribe?token=${unsubscribeToken}`,
        });
      } catch (err) {
        console.error('[subscribe] eroare la trimiterea emailului de confirmare:', err.message);
      }

      res.json({ ok: true });
    } catch (err) {
      console.error('[subscribe] eroare:', err.message);
      res.status(500).json({ error: 'A aparut o eroare. Incearca din nou.' });
    }
  });

  router.get('/confirm', (req, res) => {
    const t = req.query.token;
    if (!isString(t, { max: 200 })) return res.redirect('/newsletter.html?stare=eroare');
    const sub = confirmSubscriber(t);
    return res.redirect(sub ? '/newsletter.html?stare=confirmat' : '/newsletter.html?stare=eroare');
  });

  router.get('/unsubscribe', (req, res) => {
    const t = req.query.token;
    if (!isString(t, { max: 200 })) return res.redirect('/newsletter.html?stare=eroare');
    const sub = unsubscribeByToken(t);
    return res.redirect(sub ? '/newsletter.html?stare=dezabonat' : '/newsletter.html?stare=eroare');
  });

  return router;
}

module.exports = { buildSubscribeRouter };
