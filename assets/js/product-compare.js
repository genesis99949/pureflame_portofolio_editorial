(function () {
  const mount = document.querySelector('[data-product-compare]');
  if (!mount) return;

  const currentId = document.querySelector('.epp-buy-panel')?.dataset.productId || '';
  // Datele vin din catalogul randat in pagina de server (content/products/*.json),
  // aceeasi sursa ca preturile din Stripe — nu le mai copiem aici.
  let products = [];
  try { products = JSON.parse(document.getElementById('pf-catalog').textContent).products; } catch (e) { return; }

  // Textele din catalog sunt editabile din CMS, deci le escapam inainte de innerHTML.
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const bilingual = (ro, en) => `<span class="lang-ro">${ro}</span><span class="lang-en" hidden>${en}</span>`;
  const fromCatalog = (value) => bilingual(esc(value.ro), esc(value.en));
  const headers = products.map((product) => {
    const current = product.id === currentId;
    return `<th scope="col" class="${current ? 'is-current' : ''}">
      ${current ? `<span class="epp-compare-current">${bilingual('Model curent', 'Current model')}</span>` : ''}
      ${current ? `<strong>${esc(product.name)}</strong>` : `<a href="${esc(product.href)}">${esc(product.name)}<span aria-hidden="true"> ↗︎</span></a>`}
    </th>`;
  }).join('');

  const row = (labelRo, labelEn, render) => `<tr>
    <th scope="row">${bilingual(labelRo, labelEn)}</th>
    ${products.map((product) => `<td class="${product.id === currentId ? 'is-current' : ''}">${render(product)}</td>`).join('')}
  </tr>`;

  mount.innerHTML = `
    <div class="epp-compare-head">
      <p>${bilingual('Ghid rapid de alegere', 'Quick selection guide')}</p>
      <h2>${bilingual('Compară modelele', 'Compare the models')}</h2>
      <span>${bilingual('Alege după spațiu, proporții și material — diferențele care contează în utilizarea de zi cu zi.', 'Choose by space, proportions and material — the differences that matter in everyday use.')}</span>
    </div>
    <p class="epp-compare-swipe">${bilingual('Glisează pentru a vedea toate modelele →︎', 'Swipe to see all models →︎')}</p>
    <div class="epp-compare-scroll" tabindex="0" role="region" aria-label="Comparație modele PureFlame">
      <table>
        <thead><tr><th scope="col">${bilingual('Criteriu', 'Criterion')}</th>${headers}</tr></thead>
        <tbody>
          ${row('Potrivită pentru', 'Best for', (p) => fromCatalog(p.guide.bestFor))}
          ${row('Formă', 'Shape', (p) => fromCatalog(p.guide.shape))}
          ${row('Dimensiuni', 'Dimensions', (p) => fromCatalog(p.dims))}
          ${row('Greutate netă', 'Net weight', (p) => fromCatalog(p.weightNet))}
          ${row('Material', 'Material', (p) => fromCatalog(p.material))}
          ${row('Preț', 'Price', (p) => `<strong>${esc(p.priceLabel)}</strong>`)}
        </tbody>
      </table>
    </div>`;

  let lang = 'ro';
  try { lang = localStorage.getItem('pf-lang') || 'ro'; } catch (e) {}
  mount.querySelectorAll('.lang-ro').forEach((el) => { el.hidden = lang === 'en'; });
  mount.querySelectorAll('.lang-en').forEach((el) => { el.hidden = lang !== 'en'; });
})();
