// Helperi de validare server-side. Nimic din ce vine din req.body/req.query nu este de incredere:
// verificam explicit tipul (protectie impotriva type-confusion / mass assignment cu array-uri sau obiecte)
// si lungimea (protectie impotriva payload-urilor abuzive), nu doar prezenta valorii.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\s()-]{6,20}$/;
const POSTAL_CODE_RE = /^\d{6}$/;

function isString(value, { min = 1, max = Infinity } = {}) {
  if (typeof value !== 'string') return false;
  const len = value.trim().length;
  return len >= min && len <= max;
}

function isValidEmail(value) {
  return isString(value, { min: 3, max: 254 }) && EMAIL_RE.test(value.trim());
}

function isValidPhone(value) {
  return isString(value, { min: 6, max: 20 }) && PHONE_RE.test(value.trim());
}

function isValidPostalCode(value) {
  return isString(value, { min: 6, max: 6 }) && POSTAL_CODE_RE.test(value.trim());
}

module.exports = { isString, isValidEmail, isValidPhone, isValidPostalCode };
