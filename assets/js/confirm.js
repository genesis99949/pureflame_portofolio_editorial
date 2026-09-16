// ---- Pagina de confirmare: verifica plata si afiseaza sumarul comenzii ----
// Nota de securitate: valorile din comanda (nume, adresa) vin din input-ul clientului.
// Le afisam exclusiv prin textContent / createElement, NICIODATA prin innerHTML cu
// date interpolate, ca sa nu fie posibil un XSS stocat daca cineva trimite HTML/script
// ca "adresa" sau "nume" in formular.
(function(){
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');

  const loadingEl = document.getElementById('confirmLoading');
  const successEl = document.getElementById('confirmSuccess');
  const errorEl = document.getElementById('confirmError');
  const summaryEl = document.getElementById('confirmSummary');

  function showError(){
    loadingEl.hidden = true;
    errorEl.hidden = false;
  }

  function formatAmount(amount, currency){
    return `${(amount / 100).toFixed(2).replace('.', ',')} ${currency.toUpperCase()}`;
  }

  function makeRow(leftRo, leftEn, rightText){
    const row = document.createElement('div');
    row.className = 'confirm-row';

    const left = document.createElement('span');
    if (leftEn === null) {
      left.textContent = leftRo;
    } else {
      const ro = document.createElement('span');
      ro.className = 'lang-ro';
      ro.textContent = leftRo;
      const en = document.createElement('span');
      en.className = 'lang-en';
      en.hidden = true;
      en.textContent = leftEn;
      left.append(ro, en);
    }

    const right = document.createElement('span');
    right.textContent = rightText;

    row.append(left, right);
    return row;
  }

  function showSuccess(order){
    loadingEl.hidden = true;
    successEl.hidden = false;
    const label = order.color ? `${order.productName} (${order.color})` : order.productName;
    const total = order.amount * order.quantity;
    const fullAddress = `${order.addressStreet} ${order.addressNumber}, ${order.addressPostalCode}`;

    summaryEl.replaceChildren(
      makeRow(`#${order.id}`, null, `${label} × ${order.quantity}`),
      makeRow('Total', 'Total', formatAmount(total, order.currency)),
      makeRow('Livrare la', 'Shipping to', fullAddress)
    );
  }

  if (!sessionId) {
    showError();
    return;
  }

  // Webhook-ul Stripe poate ajunge cu o mica intarziere fata de redirect —
  // reincercam de cateva ori inainte sa afisam eroare.
  let attempts = 0;
  async function poll(){
    attempts += 1;
    try {
      const res = await fetch(`/api/order?session_id=${encodeURIComponent(sessionId)}`);
      if (res.ok) {
        const order = await res.json();
        showSuccess(order);
        return;
      }
    } catch (e) { /* retry */ }

    if (attempts < 6) {
      setTimeout(poll, 1500);
    } else {
      showError();
    }
  }
  poll();
})();
