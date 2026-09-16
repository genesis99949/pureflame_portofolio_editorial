(function () {
  const mount = document.querySelector('[data-product-compare]');
  if (!mount) return;

  const currentId = document.querySelector('.epp-buy-panel')?.dataset.productId || '';
  const products = [
    { id: 'embera', name: 'Embera', href: 'embera.html', fitRo: 'Servire și grupuri mai mari', fitEn: 'Serving and larger groups', shapeRo: 'Dreptunghiulară, joasă', shapeEn: 'Rectangular, low', size: '169 × 95 × 44 cm', weight: '54 kg', materialRo: 'Metal texturat', materialEn: 'Textured metal', price: '4.797 lei' },
    { id: 'aether', name: 'Aether', href: 'aether.html', fitRo: 'Terase compacte și zone lounge', fitEn: 'Compact terraces and lounge areas', shapeRo: 'Rotundă, joasă', shapeEn: 'Round, low', size: '83.5 × 83.5 × 37 cm', weight: '24 kg', materialRo: 'Beton fin texturat', materialEn: 'Fine-textured concrete', price: '2.989 lei' },
    { id: 'flavo', name: 'Flavo', href: 'flavo.html', fitRo: 'Amenajări geometrice', fitEn: 'Geometric arrangements', shapeRo: 'Pătrată, joasă', shapeEn: 'Square, low', size: '96 × 96 × 38 cm', weight: '33 kg', materialRo: 'Metal', materialEn: 'Metal', price: '2.999 lei' },
    { id: 'fera', name: 'Fera', href: 'fera.html', fitRo: 'Terase ample și zone liniare', fitEn: 'Spacious terraces and linear areas', shapeRo: 'Dreptunghiulară, înaltă', shapeEn: 'Rectangular, tall', size: '160 × 69 × 55 cm', weight: '53.5 kg', materialRo: 'Metal', materialEn: 'Metal', price: '4.299 lei' },
    { id: 'ignite', name: 'Ignite', href: 'ignite.html', fitRo: 'Zone lounge și terase medii', fitEn: 'Lounge areas and medium terraces', shapeRo: 'Liniară, înaltă', shapeEn: 'Linear, tall', size: '146 × 36 × 66 cm', weight: '33.5 kg', materialRo: 'Metal antracit', materialEn: 'Anthracite metal', price: '3.099 lei' }
  ];

  const bilingual = (ro, en) => `<span class="lang-ro">${ro}</span><span class="lang-en" hidden>${en}</span>`;
  const headers = products.map((product) => {
    const current = product.id === currentId;
    return `<th scope="col" class="${current ? 'is-current' : ''}">
      ${current ? `<span class="epp-compare-current">${bilingual('Model curent', 'Current model')}</span>` : ''}
      ${current ? `<strong>${product.name}</strong>` : `<a href="${product.href}">${product.name}<span aria-hidden="true"> ↗</span></a>`}
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
    <p class="epp-compare-swipe">${bilingual('Glisează pentru a vedea toate modelele →', 'Swipe to see all models →')}</p>
    <div class="epp-compare-scroll" tabindex="0" role="region" aria-label="Comparație modele PureFlame">
      <table>
        <thead><tr><th scope="col">${bilingual('Criteriu', 'Criterion')}</th>${headers}</tr></thead>
        <tbody>
          ${row('Potrivită pentru', 'Best for', (p) => bilingual(p.fitRo, p.fitEn))}
          ${row('Formă', 'Shape', (p) => bilingual(p.shapeRo, p.shapeEn))}
          ${row('Dimensiuni', 'Dimensions', (p) => bilingual(p.size.replace(/(\d)\.(\d)/g, '$1,$2'), p.size))}
          ${row('Greutate netă', 'Net weight', (p) => bilingual(p.weight.replace(/(\d)\.(\d)/g, '$1,$2'), p.weight))}
          ${row('Material', 'Material', (p) => bilingual(p.materialRo, p.materialEn))}
          ${row('Preț', 'Price', (p) => `<strong>${p.price}</strong>`)}
        </tbody>
      </table>
    </div>`;

  let lang = 'ro';
  try { lang = localStorage.getItem('pf-lang') || 'ro'; } catch (e) {}
  mount.querySelectorAll('.lang-ro').forEach((el) => { el.hidden = lang === 'en'; });
  mount.querySelectorAll('.lang-en').forEach((el) => { el.hidden = lang !== 'en'; });
})();
