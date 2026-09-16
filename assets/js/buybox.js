// ---- Buy-box: culori, masca, cantitate si adaugarea in cos (colectie.html) ----
(function(){
  const buyBox = document.querySelector('.buy-box');
  if (!buyBox) return;

  // Citite la fiecare folosire, nu o singura data la incarcare: pe pagina de
  // colectie produsul se schimba din butoanele de sub imagine, iar valorile
  // retinute la start ar trimite alt produs si alt pret catre cos.
  const productId = () => buyBox.dataset.productId;
  const unitAmountBani = () => Number(buyBox.dataset.amountBani);
  const addBtn = document.getElementById('addToCartBtn');
  const addedNote = document.getElementById('addedToCartNote');
  const originalAddedNoteHtml = addedNote?.innerHTML || '';

  const qtyValueEl = document.getElementById('qtyValue');
  const qtyMinusBtn = document.getElementById('qtyMinus');
  const qtyPlusBtn = document.getElementById('qtyPlus');
  let quantity = 1;

  function showLimitFeedback(){
    if (!addedNote) return;
    const english = document.documentElement.lang === 'en';
    addedNote.dataset.cartLimit = 'true';
    addedNote.innerHTML =
      `<span class="lang-ro"${english ? ' hidden' : ''}>Ai atins limita de 3 mese per comandă. Accesoriile rămân nelimitate.</span>` +
      `<span class="lang-en"${english ? '' : ' hidden'}>You've reached the limit of 3 tables per order. Accessories remain unlimited.</span>`;
    addedNote.hidden = false;
  }

  function restoreAddedNote(){
    if (!addedNote) return;
    delete addedNote.dataset.cartLimit;
    addedNote.innerHTML = originalAddedNoteHtml;
  }

  function renderQty(){
    const remaining = window.PFCart?.getRemainingTableCapacity?.() ?? 3;
    quantity = Math.min(quantity, Math.max(1, remaining));
    if (qtyValueEl) qtyValueEl.textContent = String(quantity);
    if (qtyMinusBtn) qtyMinusBtn.disabled = remaining === 0 || quantity <= 1;
    if (qtyPlusBtn) qtyPlusBtn.disabled = remaining === 0 || quantity >= remaining;
    if (addBtn) addBtn.disabled = remaining === 0;
    if (remaining === 0) showLimitFeedback();
    else if (addedNote?.dataset.cartLimit === 'true') {
      restoreAddedNote();
      addedNote.hidden = true;
    }
  }
  if (qtyMinusBtn) qtyMinusBtn.addEventListener('click', () => { quantity = Math.max(1, quantity - 1); renderQty(); });
  if (qtyPlusBtn) qtyPlusBtn.addEventListener('click', () => {
    quantity = Math.min(window.PFCart?.getRemainingTableCapacity?.() ?? 3, quantity + 1);
    renderQty();
  });
  window.addEventListener('pf-cart-change', renderQty);
  renderQty();

  // Culoarea/masca se citesc din elementul activ in momentul apasarii, nu
  // memorate la incarcare — utilizatorul le poate schimba inainte de a adauga
  // in cos. Scopate la .pd2-info vizibil: fiecare produs are propriul set de
  // buline de culoare in DOM (restul, ascunse), si o cautare globala ar
  // intoarce mereu prima bulina activa din primul produs listat.
  const selectedColorName = () => {
    const info = buyBox.querySelector('.pd2-info:not([hidden])');
    return info?.querySelector('.color-swatch.active')?.dataset.name || null;
  };
  const selectedMaskName = () => {
    const info = buyBox.querySelector('.pd2-info:not([hidden])');
    const nameEl = info?.querySelector('.mask-swatch.is-active .pd2-mask-name');
    const visibleSpan = nameEl?.querySelector('span:not([hidden])');
    return (visibleSpan || nameEl)?.textContent.trim() || null;
  };

  buyBox.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-swatch');
    if (!btn || !buyBox.contains(btn)) return;
    btn.closest('.pd2-title-swatches').querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });

  // Masca de butelie e o alegere de finisaj, nu un produs separat: apasarea
  // schimba doar miniatura activa. Grupul se ia din .pd2-masks al butonului,
  // nu din tot buy-box-ul: pe pagina de colectie sunt cinci grupuri in acelasi
  // buy-box (patru ascunse) si o cautare globala le-ar stinge pe toate.
  buyBox.addEventListener('click', (e) => {
    const btn = e.target.closest('.mask-swatch');
    if (!btn || !buyBox.contains(btn)) return;
    btn.closest('.pd2-masks').querySelectorAll('.mask-swatch').forEach(b => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  });

  function productTitle(){
    const visibleTitle = Array.from(document.querySelectorAll('.pd2-title'))
      .find(el => el.offsetParent !== null);
    return visibleTitle?.textContent.trim() || productId();
  }

  function productImage(){
    const media = document.querySelector(`.pd2-media-item[data-product="${productId()}"]`);
    return media?.querySelector('img')?.getAttribute('src') || '';
  }

  let addedNoteTimer = null;
  let addedBtnTimer = null;
  function showAddedFeedback(){
    if (addedNote){
      restoreAddedNote();
      addedNote.hidden = false;
      clearTimeout(addedNoteTimer);
      addedNoteTimer = setTimeout(() => {
        addedNote.hidden = true;
        renderQty();
      }, 4000);
    }
    if (addBtn){
      addBtn.classList.add('is-added');
      clearTimeout(addedBtnTimer);
      addedBtnTimer = setTimeout(() => { addBtn.classList.remove('is-added'); }, 1800);
    }
  }

  if (addBtn){
    addBtn.addEventListener('click', () => {
      const info = buyBox.querySelector('.pd2-info:not([hidden])');
      const result = window.PFCart.addItem({
        id: productId(),
        name: productTitle(),
        color: selectedColorName(),
        mask: selectedMaskName(),
        unitAmountBani: unitAmountBani(),
        unitPrice: info?.dataset.price || '',
        image: productImage(),
      }, quantity);
      if (result.added > 0) showAddedFeedback();
      else showLimitFeedback();
    });
  }
})();
