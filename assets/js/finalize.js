// ---- Pagina finalizare-comanda.html: sumar compact, metoda de plata si formularul de livrare ----
(function(){
  const emptyEl = document.getElementById('checkoutEmpty');
  const successEl = document.getElementById('checkoutSuccess');
  const contentEl = document.getElementById('checkoutContent');
  const itemsEl = document.getElementById('finalizeSummaryItems');
  const totalEl = document.getElementById('summaryTotal');
  if (!contentEl) return;

  // Keep the summary before the form in both visual and reading order on mobile.
  const summarySide = contentEl.querySelector('.checkout-side');
  const checkoutMain = contentEl.querySelector('.checkout-main');
  const summaryHome = document.createComment('summary desktop position');
  if (summarySide && checkoutMain) {
    summarySide.before(summaryHome);
    const narrow = window.matchMedia('(max-width:1024px)');
    const placeSummary = () => narrow.matches ? checkoutMain.before(summarySide) : summaryHome.after(summarySide);
    narrow.addEventListener('change', placeSummary);
    placeSummary();
  }

  function render(){
    const items = window.PFCart.getItems();

    if (items.length === 0){
      emptyEl.hidden = false;
      contentEl.hidden = true;
      successEl.hidden = true;
      return;
    }
    emptyEl.hidden = true;
    contentEl.hidden = false;

    itemsEl.innerHTML = items.map((item) => `
      <div class="finalize-summary-item">
        <img class="finalize-summary-item-thumb" src="${item.image || ''}" alt="" loading="lazy">
        <span class="finalize-summary-item-info">
          <span class="finalize-summary-item-name">${item.name}</span>
          <span class="finalize-summary-item-qty">× ${item.qty}</span>
        </span>
        <span class="finalize-summary-item-price">${window.PFCart.formatBani(item.unitAmountBani * item.qty)}</span>
      </div>
    `).join('');

    totalEl.textContent = window.PFCart.formatBani(window.PFCart.getTotalBani());
  }

  window.addEventListener('pf-cart-change', render);
  render();

  // ---- Formular de comanda ----
  const form = document.getElementById('checkoutForm');
  const errorEl = document.getElementById('checkoutFormError');
  const submitBtn = document.getElementById('checkoutSubmitBtn');
  const submitLabelRo = document.getElementById('submitLabelRo');
  const submitLabelEn = document.getElementById('submitLabelEn');
  const paymentNoteEl = document.getElementById('paymentMethodNote');

  const PAYMENT_NOTES = {
    card: {
      ro: 'Vei fi redirecționat către pagina de plată securizată Stripe.',
      en: 'You\'ll be redirected to the secure Stripe payment page.',
      submitRo: 'Continuă spre plată',
      submitEn: 'Continue to payment',
    },
    applepay: {
      ro: 'Confirmi plata direct din Wallet, prin Apple Pay.',
      en: 'Confirm payment straight from Wallet, via Apple Pay.',
      submitRo: 'Continuă spre plată',
      submitEn: 'Continue to payment',
    },
    googlepay: {
      ro: 'Confirmi plata din contul tău Google, prin Google Pay.',
      en: 'Confirm payment from your Google account, via Google Pay.',
      submitRo: 'Continuă spre plată',
      submitEn: 'Continue to payment',
    },
    ramburs: {
      ro: 'Plata se face către curier, în numerar sau card, la livrare.',
      en: 'Pay the courier by cash or card on delivery.',
      submitRo: 'Trimite comanda',
      submitEn: 'Place order',
    },
  };

  function updatePaymentMethodUI(){
    if (!form) return;
    const method = new FormData(form).get('paymentMethod') || 'card';
    const copy = PAYMENT_NOTES[method];
    if (!copy) return;
    if (paymentNoteEl){
      const lang = document.querySelector('.lang-btn.active')?.dataset.lang || 'ro';
      paymentNoteEl.innerHTML = `<span class="lang-ro"${lang === 'en' ? ' hidden' : ''}>${copy.ro}</span><span class="lang-en"${lang !== 'en' ? ' hidden' : ''}>${copy.en}</span>`;
    }
    if (submitLabelRo) submitLabelRo.textContent = copy.submitRo;
    if (submitLabelEn) submitLabelEn.textContent = copy.submitEn;
  }

  if (form){
    form.addEventListener('change', (e) => {
      if (e.target.name === 'paymentMethod') updatePaymentMethodUI();
    });
    updatePaymentMethodUI();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.hidden = true;

      const data = new FormData(form);
      const paymentMethod = data.get('paymentMethod');
      const payload = {
        items: window.PFCart.getItems(),
        paymentMethod,
        firstName: data.get('firstName')?.trim(),
        lastName: data.get('lastName')?.trim(),
        email: data.get('email')?.trim(),
        phone: data.get('phone')?.trim(),
        addressStreet: data.get('addressStreet')?.trim(),
        addressNumber: data.get('addressNumber')?.trim(),
        postalCode: data.get('postalCode')?.trim(),
        notes: data.get('notes')?.trim(),
        consent: data.get('consent') === 'on',
      };

      submitBtn.disabled = true;
      const originalHtml = submitBtn.innerHTML;
      submitBtn.textContent = '...';

      try {
        // Card/Apple Pay/Google Pay: redirecteaza spre Stripe Checkout, care
        // stie sa afiseze fiecare wallet. Ramburs: comanda se inregistreaza
        // direct, fara pasul de plata online.
        const isInstantPayment = paymentMethod === 'card' || paymentMethod === 'applepay' || paymentMethod === 'googlepay';
        const endpoint = isInstantPayment ? '/api/checkout-session' : '/api/order';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'A apărut o eroare.');

        if (isInstantPayment && result.url){
          window.location.href = result.url;
          return;
        }

        window.PFCart.clear();
        contentEl.hidden = true;
        successEl.hidden = false;
      } catch (err) {
        errorEl.textContent = err.message || 'A apărut o eroare. Încearcă din nou.';
        errorEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    });
  }
})();
