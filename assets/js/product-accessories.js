(function () {
  const accessoryMarkup = `
    <div class="ce-accessories-head">
      <div>
        <p class="ce-section-kicker"><span class="lang-ro">Accesorii</span><span class="lang-en" hidden>Accessories</span></p>
        <h2><span class="lang-ro">Completează-ți masa</span><span class="lang-en" hidden>Complete your table</span></h2>
      </div>
      <p><span class="lang-ro">Disponibile individual.</span><span class="lang-en" hidden>Available individually.</span></p>
    </div>

    <div class="ce-accessory-grid">
      <button class="ce-accessory-card" type="button" data-accessory-id="pietre" data-accessory-name="Set pietre vulcanice (rezervă)" data-accessory-price="89,00 lei" data-accessory-bani="8900" data-accessory-image="assets/accessories/lava-stones-bag.webp">
        <span class="ce-accessory-media"><img src="assets/accessories/lava-stones-bag.webp" alt="" loading="lazy" width="1254" height="1254"></span>
        <span class="ce-accessory-meta"><span class="ce-accessory-name"><span class="lang-ro">Pietre vulcanice</span><span class="lang-en" hidden>Volcanic stones</span></span><span class="ce-accessory-price">89,00 lei</span><span class="ce-accessory-action"><span class="ce-action-add"><span class="lang-ro">Adaugă în coș</span><span class="lang-en" hidden>Add to cart</span></span><span class="ce-action-added" hidden><span class="lang-ro">Adăugat</span><span class="lang-en" hidden>Added</span> ✓</span></span></span>
      </button>

      <article class="ce-accessory-card ce-accessory-card-mask" data-accessory-id="masca" data-accessory-name="Mască pătrată pentru butelie" data-accessory-price="99,00 lei" data-accessory-bani="9900" data-accessory-image="assets/accessories/mask-square-grey.webp" data-accessory-color="Gri">
        <button class="ce-accessory-add" type="button">
          <span class="ce-accessory-media"><img src="assets/accessories/mask-square-grey.webp" alt="" loading="lazy" width="1254" height="1254"></span>
          <span class="ce-accessory-meta"><span class="ce-accessory-name"><span class="lang-ro">Mască pătrată</span><span class="lang-en" hidden>Square cylinder cover</span></span><span class="ce-accessory-price">99,00 lei</span><span class="ce-accessory-action"><span class="ce-action-add"><span class="lang-ro">Adaugă în coș</span><span class="lang-en" hidden>Add to cart</span></span><span class="ce-action-added" hidden><span class="lang-ro">Adăugat</span><span class="lang-en" hidden>Added</span> ✓</span></span></span>
        </button>
        <div class="ce-accessory-variants" role="group" aria-label="Culoarea măștii pătrate">
          <button type="button" class="ce-accessory-variant is-active" data-color="Gri" data-image="assets/accessories/mask-square-grey.webp" aria-pressed="true"><span class="ce-swatch ce-swatch-grey" aria-hidden="true"></span><span class="lang-ro">Gri</span><span class="lang-en" hidden>Grey</span></button>
          <button type="button" class="ce-accessory-variant" data-color="Negru" data-image="assets/accessories/mask-square-black.webp" aria-pressed="false"><span class="ce-swatch ce-swatch-black" aria-hidden="true"></span><span class="lang-ro">Negru</span><span class="lang-en" hidden>Black</span></button>
        </div>
      </article>

      <article class="ce-accessory-card ce-accessory-card-mask" data-accessory-id="masca" data-accessory-name="Mască circulară pentru butelie" data-accessory-price="99,00 lei" data-accessory-bani="9900" data-accessory-image="assets/accessories/mask-round-grey.webp" data-accessory-color="Gri">
        <button class="ce-accessory-add" type="button">
          <span class="ce-accessory-media"><img src="assets/accessories/mask-round-grey.webp" alt="" loading="lazy" width="1254" height="1254"></span>
          <span class="ce-accessory-meta"><span class="ce-accessory-name"><span class="lang-ro">Mască circulară</span><span class="lang-en" hidden>Circular cylinder cover</span></span><span class="ce-accessory-price">99,00 lei</span><span class="ce-accessory-action"><span class="ce-action-add"><span class="lang-ro">Adaugă în coș</span><span class="lang-en" hidden>Add to cart</span></span><span class="ce-action-added" hidden><span class="lang-ro">Adăugat</span><span class="lang-en" hidden>Added</span> ✓</span></span></span>
        </button>
        <div class="ce-accessory-variants" role="group" aria-label="Culoarea măștii circulare">
          <button type="button" class="ce-accessory-variant is-active" data-color="Gri" data-image="assets/accessories/mask-round-grey.webp" aria-pressed="true"><span class="ce-swatch ce-swatch-grey" aria-hidden="true"></span><span class="lang-ro">Gri</span><span class="lang-en" hidden>Grey</span></button>
          <button type="button" class="ce-accessory-variant" data-color="Negru" data-image="assets/accessories/mask-round-black.webp" aria-pressed="false"><span class="ce-swatch ce-swatch-black" aria-hidden="true"></span><span class="lang-ro">Negru</span><span class="lang-en" hidden>Black</span></button>
        </div>
      </article>

      <button class="ce-accessory-card" type="button" data-accessory-id="husa" data-accessory-name="Husă de protecție impermeabilă" data-accessory-price="149,00 lei" data-accessory-bani="14900" data-accessory-image="assets/accessories/protective-cover.webp">
        <span class="ce-accessory-media"><img src="assets/accessories/protective-cover.webp" alt="" loading="lazy" width="1254" height="1254"></span>
        <span class="ce-accessory-meta"><span class="ce-accessory-name"><span class="lang-ro">Husă de protecție</span><span class="lang-en" hidden>Protective cover</span></span><span class="ce-accessory-price">149,00 lei</span><span class="ce-accessory-action"><span class="ce-action-add"><span class="lang-ro">Adaugă în coș</span><span class="lang-en" hidden>Add to cart</span></span><span class="ce-action-added" hidden><span class="lang-ro">Adăugat</span><span class="lang-en" hidden>Added</span> ✓</span></span></span>
      </button>

      <button class="ce-accessory-card" type="button" data-accessory-id="picioare" data-accessory-name="Set picioare de schimb" data-accessory-price="119,00 lei" data-accessory-bani="11900" data-accessory-image="assets/accessories/detachable-legs.webp">
        <span class="ce-accessory-media"><img src="assets/accessories/detachable-legs.webp" alt="" loading="lazy" width="1254" height="1254"></span>
        <span class="ce-accessory-meta"><span class="ce-accessory-name"><span class="lang-ro">Picioare detașabile</span><span class="lang-en" hidden>Detachable legs</span></span><span class="ce-accessory-price">119,00 lei</span><span class="ce-accessory-action"><span class="ce-action-add"><span class="lang-ro">Adaugă în coș</span><span class="lang-en" hidden>Add to cart</span></span><span class="ce-action-added" hidden><span class="lang-ro">Adăugat</span><span class="lang-en" hidden>Added</span> ✓</span></span></span>
      </button>
    </div>
    <p class="sr-only ce-accessory-status" aria-live="polite"></p>`;

  function initializeShelf(section) {
    if (!section.querySelector('.ce-accessory-grid')) section.innerHTML = accessoryMarkup;

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
