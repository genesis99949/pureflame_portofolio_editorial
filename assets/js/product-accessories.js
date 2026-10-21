(function () {
  // Accesoriile vin din catalogul randat in pagina de server (content/accessories/*.json),
  // aceeasi sursa ca preturile din Stripe si din pagina de colectie.
  let accessories = [];
  try { accessories = JSON.parse(document.getElementById('pf-catalog').textContent).accessories; } catch (e) { return; }

  // Textele din catalog sunt editabile din CMS, deci le escapam inainte de innerHTML.
  const esc = (text) => String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const bilingual = (ro, en) => `<span class="lang-ro">${ro}</span><span class="lang-en" hidden>${en}</span>`;
  const action = `<span class="ce-accessory-action"><span class="ce-action-add">${bilingual('Adaugă în coș', 'Add to cart')}</span><span class="ce-action-added" hidden>${bilingual('Adăugat', 'Added')} ✓</span></span>`;

  function cardMarkup(a) {
    const data = `data-accessory-id="${esc(a.id)}" data-accessory-name="${esc(a.name)}" data-accessory-price="${esc(a.priceLabel)}" data-accessory-bani="${esc(a.priceBani)}" data-accessory-image="${esc(a.image)}"`;
    const media = `<span class="ce-accessory-media"><img src="${esc(a.image)}" alt="" loading="lazy" width="1254" height="1254"></span>`;
    const meta = `<span class="ce-accessory-meta"><span class="ce-accessory-name">${bilingual(esc(a.label.ro), esc(a.label.en))}</span><span class="ce-accessory-price">${esc(a.priceLabel)}</span>${action}</span>`;
    if (!a.variants.length) {
      return `<button class="ce-accessory-card" type="button" ${data}>${media}${meta}</button>`;
    }
    const variants = a.variants.map((v, i) => `<button type="button" class="ce-accessory-variant${i === 0 ? ' is-active' : ''}" data-color="${esc(v.color.ro)}" data-image="${esc(v.image)}" aria-pressed="${i === 0}"><span class="ce-swatch ce-swatch-${esc(v.swatch)}" aria-hidden="true"></span>${bilingual(esc(v.color.ro), esc(v.color.en))}</button>`).join('');
    return `<article class="ce-accessory-card ce-accessory-card-mask" ${data} data-accessory-color="${esc(a.variants[0].color.ro)}">
        <button class="ce-accessory-add" type="button">${media}${meta}</button>
        <div class="ce-accessory-variants" role="group" aria-label="Culoarea: ${esc(a.label.ro)}">${variants}</div>
      </article>`;
  }

  const accessoryMarkup = `
    <div class="ce-accessories-head">
      <div>
        <p class="ce-section-kicker">${bilingual('Accesorii', 'Accessories')}</p>
        <h2>${bilingual('Completează-ți masa', 'Complete your table')}</h2>
      </div>
      <p>${bilingual('Disponibile individual.', 'Available individually.')}</p>
    </div>

    <div class="ce-accessory-grid">
      ${accessories.map(cardMarkup).join('')}
    </div>
    <p class="sr-only ce-accessory-status" aria-live="polite"></p>`;

  // Raftul se injecteaza dupa ce comutatorul de limba a rulat, deci isi aplica
  // singur limba salvata — acelasi tipar ca in product-compare.js.
  function syncLang(root) {
    let lang = 'ro';
    try { lang = localStorage.getItem('pf-lang') || 'ro'; } catch (e) {}
    root.querySelectorAll('.lang-ro').forEach((el) => { el.hidden = lang === 'en'; });
    root.querySelectorAll('.lang-en').forEach((el) => { el.hidden = lang !== 'en'; });
  }

  function initializeShelf(section) {
    if (!section.querySelector('.ce-accessory-grid')) {
      section.innerHTML = accessoryMarkup;
      syncLang(section);
    }

    // Product cards keep browsing and colour selection separate from purchase.
    section.querySelectorAll('button.ce-accessory-card').forEach(button => {
      const card = document.createElement('article');
      Array.from(button.attributes).forEach(attribute => {
        if (attribute.name !== 'type') card.setAttribute(attribute.name, attribute.value);
      });
      card.append(...button.childNodes);
      button.replaceWith(card);
    });
    section.querySelectorAll('.ce-accessory-card').forEach(card => {
      const wrapper = card.querySelector('button.ce-accessory-add');
      if (wrapper && wrapper.querySelector('.ce-accessory-media')) wrapper.replaceWith(...wrapper.childNodes);
      const action = card.querySelector('span.ce-accessory-action');
      if (!action) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ce-accessory-add ce-accessory-action';
      button.append(...action.childNodes);
      const name = document.createElement('span');
      name.className = 'sr-only';
      name.append(' — ', card.querySelector('.ce-accessory-name').cloneNode(true));
      button.append(name);
      action.remove();
      card.append(button);
    });
    const heading = section.querySelector('h2');
    const headingId = section.dataset.accessoriesTitle || 'product-accessories-title';
    heading.id = headingId;
    section.setAttribute('aria-labelledby', headingId);

    const shelf = section.querySelector('.ce-accessory-grid');
    shelf.tabIndex = 0;
    shelf.setAttribute('role', 'region');
    shelf.setAttribute('aria-label', 'Accesorii — derulează orizontal / Accessories — scroll horizontally');
    shelf.addEventListener('keydown', (event) => {
      if (event.target !== shelf || !window.matchMedia('(max-width: 1024px)').matches) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const card = shelf.querySelector('.ce-accessory-card');
      const gap = parseFloat(getComputedStyle(shelf).columnGap) || 0;
      shelf.scrollBy({
        left: (card.getBoundingClientRect().width + gap) * (event.key === 'ArrowRight' ? 1 : -1),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    });
    const status = section.querySelector('.ce-accessory-status');
    const resetTimers = new WeakMap();

    shelf.addEventListener('click', (event) => {
      const variant = event.target.closest('.ce-accessory-variant');
      if (variant) {
        const card = variant.closest('.ce-accessory-card');
        card.querySelectorAll('.ce-accessory-variant').forEach((option) => {
          const active = option === variant;
          option.classList.toggle('is-active', active);
          option.setAttribute('aria-pressed', String(active));
        });
        card.dataset.accessoryColor = variant.dataset.color;
        card.dataset.accessoryImage = variant.dataset.image;
        card.querySelector('.ce-accessory-media img').src = variant.dataset.image;
        return;
      }

      const addButton = event.target.closest('.ce-accessory-add, button.ce-accessory-card');
      if (!addButton || !window.PFCart) return;
      const card = addButton.closest('.ce-accessory-card');
      window.PFCart.addItem({
        id: `addon-${card.dataset.accessoryId}`,
        name: card.dataset.accessoryName,
        color: card.dataset.accessoryColor || null,
        mask: null,
        unitAmountBani: Number(card.dataset.accessoryBani),
        unitPrice: card.dataset.accessoryPrice,
        image: card.dataset.accessoryImage,
      }, 1);

      const addLabel = card.querySelector('.ce-action-add');
      const addedLabel = card.querySelector('.ce-action-added');
      addLabel.hidden = true;
      addedLabel.hidden = false;
      card.classList.add('is-added');
      clearTimeout(resetTimers.get(card));
      resetTimers.set(card, setTimeout(() => {
        addLabel.hidden = false;
        addedLabel.hidden = true;
        card.classList.remove('is-added');
      }, 1400));

      const english = Boolean(card.querySelector('.lang-en:not([hidden])'));
      const name = card.querySelector(`.ce-accessory-name .lang-${english ? 'en' : 'ro'}`)?.textContent.trim() || card.dataset.accessoryName;
      status.textContent = english ? `${name} added to cart.` : `${name} a fost adăugat în coș.`;
    });
  }

  document.querySelectorAll('[data-accessories-component]').forEach(initializeShelf);
})();
