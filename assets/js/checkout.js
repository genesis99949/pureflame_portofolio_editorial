// ---- Pagina cos-cumparaturi.html: randeaza cosul, cantitati, eliminare, accesorii si sumar ----
(function(){
  const emptyEl = document.getElementById('checkoutEmpty');
  const contentEl = document.getElementById('checkoutContent');
  const linesEl = document.getElementById('cartLines');
  const policyNoteEl = document.getElementById('checkoutPolicyNote');
  const subtotalEl = document.getElementById('summarySubtotal');
  const totalEl = document.getElementById('summaryTotal');
  const itemCountEl = document.getElementById('checkoutItemCount');
  if (!contentEl) return;

  function lineMeta(item){
    return [item.color, item.mask ? `${document.documentElement.lang === 'en' ? 'Cover' : 'Mască'} ${item.mask}` : null].filter(Boolean).join(' · ');
  }

  function isAccessory(item){
    return window.PFCart.isAccessory(item);
  }

  function render(){
    const items = window.PFCart.getItems();

    if (items.length === 0){
      emptyEl.hidden = false;
      contentEl.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    contentEl.hidden = false;

    const totalQuantity = items.reduce((sum, item) => sum + item.qty, 0);
    const tableQuantity = window.PFCart.getTableCount(items);
    const english = document.documentElement.lang === 'en';
    if (itemCountEl) itemCountEl.textContent = english
      ? `${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}`
      : `${totalQuantity} ${totalQuantity === 1 ? 'produs' : 'produse'}`;

    linesEl.innerHTML = items.map((item) => `
      <div class="cart-line" data-key="${item.key}">
        <img class="cart-line-thumb" src="${item.image || ''}" alt="${item.name}" loading="lazy" decoding="async">
        <div class="cart-line-info">
          <p class="cart-line-name">${isAccessory(item) ? item.name : `<a class="cart-line-product-link" href="${item.id}.html">${item.name}</a>`}</p>
          ${lineMeta(item) ? `<p class="cart-line-meta">${lineMeta(item)}</p>` : ''}
          <p class="cart-line-price">${window.PFCart.formatBani(item.unitAmountBani)} / ${english ? 'item' : 'buc.'}</p>
        </div>
        <div class="cart-line-actions">
          <span class="cart-line-total">${window.PFCart.formatBani(item.unitAmountBani * item.qty)}</span>
          <div class="cart-line-qty">
            <button type="button" class="cart-qty-minus" aria-label="${english ? 'Decrease quantity' : 'Scade cantitatea'}" ${item.qty <= 1 ? 'disabled' : ''}>−</button>
            <span>${item.qty}</span>
            <button type="button" class="cart-qty-plus" aria-label="${english ? 'Increase quantity' : 'Crește cantitatea'}" ${!isAccessory(item) && tableQuantity >= window.PFCart.MAX_TABLE_QUANTITY ? 'disabled' : ''}>+</button>
          </div>
          <button type="button" class="cart-line-remove">${english ? 'Remove' : 'Elimină'}</button>
        </div>
      </div>
    `).join('');

    // Limita este pe totalul meselor din coș, indiferent de model sau finisaj.
    // Accesoriile (id-uri "addon-*") nu intră în acest calcul.
    policyNoteEl.hidden = tableQuantity < window.PFCart.MAX_TABLE_QUANTITY;

    subtotalEl.textContent = window.PFCart.formatBani(window.PFCart.getTotalBani());
    totalEl.textContent = window.PFCart.formatBani(window.PFCart.getTotalBani());
  }

  linesEl.addEventListener('click', (e) => {
    const line = e.target.closest('.cart-line');
    if (!line) return;
    const key = line.dataset.key;
    const item = window.PFCart.getItems().find((i) => i.key === key);
    if (!item) return;

    if (e.target.closest('.cart-qty-minus')) window.PFCart.setQty(key, item.qty - 1);
    else if (e.target.closest('.cart-qty-plus')) window.PFCart.setQty(key, item.qty + 1);
    else if (e.target.closest('.cart-line-remove')) window.PFCart.removeItem(key);
  });

  window.addEventListener('pf-cart-change', render);
  render();

  // ---- Accesorii recomandate: adaugate in cos ca produse separate ----
  const addonRow = document.getElementById('addonRow');
  if (addonRow){
    addonRow.addEventListener('click', (e) => {
      const variant = e.target.closest('.addon-variant');
      if (variant) {
        const card = variant.closest('.addon-card');
        card.querySelectorAll('.addon-variant').forEach((option) => {
          const active = option === variant;
          option.classList.toggle('is-active', active);
          option.setAttribute('aria-pressed', String(active));
        });
        card.dataset.addonColor = variant.dataset.color;
        card.dataset.addonImage = variant.dataset.image;
        card.querySelector('.addon-image img').src = variant.dataset.image;
        return;
      }

      const btn = e.target.closest('.addon-add');
      if (!btn) return;
      const card = btn.closest('.addon-card');
      window.PFCart.addItem({
        id: 'addon-' + card.dataset.addonId,
        name: card.dataset.addonName,
        mask: null,
        unitAmountBani: Number(card.dataset.addonBani),
        unitPrice: card.dataset.addonPrice,
        color: card.dataset.addonColor || null,
        image: card.dataset.addonImage || card.querySelector('.addon-image img')?.getAttribute('src') || '',
      }, 1);

      btn.classList.add('is-added');
      const original = btn.innerHTML;
      btn.innerHTML = '<span class="lang-ro">Adăugat ✓</span><span class="lang-en" hidden>Added ✓</span>';
      setTimeout(() => {
        btn.classList.remove('is-added');
        btn.innerHTML = original;
      }, 1600);
    });
  }

  document.addEventListener('click', (event) => {
    if (event.target.closest('.lang-btn')) setTimeout(render, 0);
  });
})();

// Accessory shelf controls complement native swipe and keyboard scrolling.
(() => {
 const shelf=document.getElementById('addonRow');
 const previous=document.querySelector('[data-accessory-prev]');
 const next=document.querySelector('[data-accessory-next]');
 if(!shelf||!previous||!next)return;
 function sync(){previous.disabled=shelf.scrollLeft<=2;next.disabled=shelf.scrollLeft+shelf.clientWidth>=shelf.scrollWidth-2;}
 function move(direction){const card=shelf.querySelector('.addon-card:not([hidden])');const gap=parseFloat(getComputedStyle(shelf).gap)||0;shelf.scrollBy({left:direction*((card?.getBoundingClientRect().width||240)+gap),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}
 previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
 shelf.addEventListener('scroll',sync,{passive:true});new ResizeObserver(sync).observe(shelf);window.addEventListener('pf-cart-change',()=>requestAnimationFrame(sync));sync();
})();
