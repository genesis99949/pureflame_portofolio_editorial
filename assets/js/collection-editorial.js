// ---- colectie.html: deep-link catre un card din grid (#embera, #aether, ...) ----
// Doar scroll + evidentiere temporara — structura paginii nu se schimba, spre
// deosebire de vechiul explorer care comuta continutul intreg pe baza hash-ului.
(function () {
  const grid = document.querySelector('.ce-grid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.ce-card[id]'));
  if (!cards.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let highlightTimer = null;

  function goToHash(id, { focus, instant } = {}) {
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    card.scrollIntoView({ behavior: instant || reduceMotion ? 'auto' : 'smooth', block: 'center' });

    card.classList.remove('is-hash-target');
    // fortam un reflow ca sa poata rula din nou animatia daca acelasi hash e vizat de doua ori
    void card.offsetWidth;
    card.classList.add('is-hash-target');
    clearTimeout(highlightTimer);
    highlightTimer = setTimeout(() => card.classList.remove('is-hash-target'), 1800);

    if (focus) {
      const link = card.querySelector('.ce-card-link');
      if (link) link.focus({ preventScroll: true });
    }
  }

  const initialId = decodeURIComponent(location.hash.slice(1));
  if (initialId) {
    // La incarcarea paginii, imaginile (multe cu loading="lazy") isi pot rezerva
    // spatiul final abia dupa evenimentul "load" — un scroll declansat mai devreme
    // (ex. pe requestAnimationFrame) tinteste o pozitie care se muta ulterior.
    // Sarim direct (fara animatie) si mai facem o corectie scurta dupa, cand
    // layout-ul s-a asezat sigur.
    const settle = () => {
      goToHash(initialId, { instant: true });
      setTimeout(() => goToHash(initialId, { instant: true }), 350);
    };
    if (document.readyState === 'complete') settle();
    else window.addEventListener('load', settle);
  }

  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) goToHash(id, { focus: true });
  });
})();

// ---- Nota cursiva: se "scrie" o singura data cand intra in viewport ----
(function () {
  const note = document.querySelector('.ce-handwritten');
  if (!note) return;

  const show = () => note.classList.add('is-visible');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    show();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    show();
    observer.disconnect();
  }, { threshold: 0.45 });

  observer.observe(note);
})();

// ---- Accesorii compacte: intregul card adauga produsul direct in cos ----
(function () {
  const shelf = document.querySelector('.ce-accessory-grid');
  const status = document.getElementById('accessoryCartStatus');
  if (!shelf || !window.PFCart) return;

  const resetTimers = new WeakMap();

  shelf.addEventListener('click', (event) => {
    const variant = event.target.closest('.ce-accessory-variant');
    if (variant) {
      const variantCard = variant.closest('.ce-accessory-card');
      variantCard.querySelectorAll('.ce-accessory-variant').forEach((option) => {
        const active = option === variant;
        option.classList.toggle('is-active', active);
        option.setAttribute('aria-pressed', String(active));
      });
      variantCard.dataset.accessoryColor = variant.dataset.color;
      variantCard.dataset.accessoryImage = variant.dataset.image;
      variantCard.querySelector('.ce-accessory-media img').src = variant.dataset.image;
      return;
    }

    const addButton = event.target.closest('.ce-accessory-add, button.ce-accessory-card');
    if (!addButton) return;
    const card = event.target.closest('.ce-accessory-card');
    if (!card) return;

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

    if (status) {
      const english = Boolean(card.querySelector('.lang-en:not([hidden])'));
      const name = card.querySelector(`.ce-accessory-name .lang-${english ? 'en' : 'ro'}`)?.textContent.trim() || card.dataset.accessoryName;
      status.textContent = english ? `${name} added to cart.` : `${name} a fost adăugat în coș.`;
    }
  });
})();
