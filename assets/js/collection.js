// ---- Pagina de colectie: comuta intre cele 5 produse fara sa paraseasca pagina ----
(function () {
  const explorer = document.querySelector('.pd2-explorer[data-collection]');
  if (!explorer) return;

  const buyBox = explorer.querySelector('.buy-box');
  const priceEl = explorer.querySelector('.buy-price-value');
  const picks = Array.from(explorer.querySelectorAll('.pd2-pick'));
  const ids = picks.map((b) => b.dataset.product);

  function toggle(nodes, id) {
    let active = null;
    nodes.forEach((el) => {
      const on = el.dataset.product === id;
      el.hidden = !on;
      if (on) active = el;
    });
    return active;
  }

  function show(id) {
    const media = toggle(Array.from(explorer.querySelectorAll('.pd2-media-item')), id);
    const info = toggle(Array.from(explorer.querySelectorAll('.pd2-info')), id);
    toggle(Array.from(explorer.querySelectorAll('.pd2-specs')), id);
    toggle(Array.from(explorer.querySelectorAll('.pd2-features')), id);
    // .story-standard nu se comuta — continutul e identic pe toate produsele,
    // stă o singura data langa descrierea care se schimba.
    toggle(Array.from(document.querySelectorAll('.story-desc[data-product]')), id);
    toggle(Array.from(document.querySelectorAll('.story-review[data-product]')), id);

    // Videoul ascuns ramane altfel in redare: consuma banda si baterie degeaba.
    explorer.querySelectorAll('.pd2-media-item video').forEach((v) => {
      if (media && media.contains(v)) {
        const p = v.play();
        if (p) p.catch(() => {});
      } else {
        v.pause();
      }
    });

    picks.forEach((b) => {
      const on = b.dataset.product === id;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    // Sursa de adevar pentru order.js: de aici isi ia produsul si suma la plata.
    if (info) {
      buyBox.dataset.productId = id;
      buyBox.dataset.amountBani = info.dataset.amountBani;
      if (priceEl) priceEl.textContent = info.dataset.price;
    }

    // Hash-ul face modelul partajabil prin link (colectie.html#aether), fara
    // sa adauge intrari in istoric la fiecare apasare.
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  }

  picks.forEach((b) => b.addEventListener('click', () => show(b.dataset.product)));

  // Hash-ul se poate schimba si fara reincarcare: linkurile din footer duc acum
  // la colectie.html#model, iar de pe chiar aceasta pagina navigarea nu ar face
  // decat sa schimbe fragmentul, lasand afisat modelul precedent.
  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (ids.includes(id)) show(id);
  });

  const fromHash = decodeURIComponent(location.hash.slice(1));
  show(ids.includes(fromHash) ? fromHash : ids[0]);
})();
