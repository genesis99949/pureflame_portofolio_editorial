// Sabloanele paginilor (src/pages/*.html) contin marcaje care se inlocuiesc cu
// date din catalog:
//   {{products.embera.priceLabel}}  -> text, escapat pentru HTML
//   {{{catalogJson}}}               -> inserat ca atare (doar pentru JSON-ul deja securizat)
// Un marcaj care nu exista in date opreste randarea: mai bine o eroare la pornire
// decat o pagina publicata cu "{{...}}" sau cu un pret gol.
const fs = require('node:fs');
const path = require('node:path');

const PAGES_DIR = path.join(__dirname, '..', 'src', 'pages');
const MARKER = /\{\{\{\s*([\w.-]+)\s*\}\}\}|\{\{\s*([\w.-]+)\s*\}\}/g;

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (text) => text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);

function lookup(data, keyPath) {
  return keyPath.split('.').reduce((value, key) => (value != null && Object.hasOwn(Object(value), key) ? value[key] : undefined), data);
}

function renderTemplate(source, data, file = 'sablon') {
  return source.replace(MARKER, (marker, rawPath, escapedPath) => {
    const value = lookup(data, rawPath || escapedPath);
    if (typeof value !== 'string' && typeof value !== 'number') {
      throw new Error(`${file}: marcajul ${marker} nu corespunde niciunei valori din catalog.`);
    }
    return rawPath ? String(value) : escapeHtml(String(value));
  });
}

function renderPage(file, data, pagesDir = PAGES_DIR) {
  const source = fs.readFileSync(path.join(pagesDir, file), 'utf8');
  return renderTemplate(source, data, `src/pages/${file}`);
}

module.exports = { PAGES_DIR, renderTemplate, renderPage, escapeHtml };
