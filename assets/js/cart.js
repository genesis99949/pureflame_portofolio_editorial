// ---- Cos de cumparaturi, partajat intre colectie.html, cos-cumparaturi.html si finalizare-comanda.html ----
// Stocare in localStorage, ca sa supravietuiasca navigarii intre pagini.
// O linie de cos e unica per produs+culoare+masca — acelasi produs cu alta
// culoare devine o linie noua, nu creste cantitatea celei existente.
window.PFCart = (function () {
  const KEY = 'pf_cart_v1';
  const MAX_TABLE_QUANTITY = 3;

  function isAccessory(item) {
    return String(item?.id || '').startsWith('addon-');
  }

  function normalize(items) {
    let remainingTables = MAX_TABLE_QUANTITY;
    return items.reduce((normalized, rawItem) => {
      if (!rawItem || typeof rawItem !== 'object') return normalized;
      const qty = Math.max(1, Number.parseInt(rawItem.qty, 10) || 1);
      const item = rawItem.id === 'embera'
        ? { ...rawItem, image: 'assets/products/embera/gallery/ansamblu.webp', qty }
        : { ...rawItem, qty };

      if (isAccessory(item)) {
        normalized.push(item);
        return normalized;
      }
      if (remainingTables <= 0) return normalized;

      item.qty = Math.min(item.qty, remainingTables);
      remainingTables -= item.qty;
      normalized.push(item);
      return normalized;
    }, []);
  }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      const items = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items)) return [];
      return normalize(items);
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    window.dispatchEvent(new CustomEvent('pf-cart-change', { detail: { items } }));
  }

  function lineKey(id, color, mask) {
    return [id, color || '', mask || ''].join('::');
  }

  function getItems() {
    return read();
  }

  function getTableCount(items = read()) {
    return items.reduce((sum, item) => sum + (isAccessory(item) ? 0 : item.qty), 0);
  }

  function getRemainingTableCapacity() {
    return Math.max(0, MAX_TABLE_QUANTITY - getTableCount());
  }

  // item: {id, name, color, mask, unitAmountBani, unitPrice, image}
  function addItem(item, qty) {
    qty = Math.max(1, Number.parseInt(qty, 10) || 1);
    const items = read();
    const requestedQty = qty;
    if (!isAccessory(item)) {
      qty = Math.min(qty, Math.max(0, MAX_TABLE_QUANTITY - getTableCount(items)));
      if (qty === 0) return { added: 0, limitReached: true };
    }
    const key = lineKey(item.id, item.color, item.mask);
    const existing = items.find((i) => lineKey(i.id, i.color, i.mask) === key);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({ ...item, qty, key });
    }
    write(items);
    return { added: qty, limitReached: qty < requestedQty };
  }

  function setQty(key, qty) {
    let items = read();
    if (qty <= 0) {
      items = items.filter((i) => i.key !== key);
    } else {
      const current = items.find((item) => item.key === key);
      if (!current) return;
      const nextQty = isAccessory(current)
        ? qty
        : Math.min(qty, MAX_TABLE_QUANTITY - getTableCount(items.filter((item) => item.key !== key)));
      items = items.map((i) => (i.key === key ? { ...i, qty: nextQty } : i));
    }
    write(items);
  }

  function removeItem(key) {
    setQty(key, 0);
  }

  function clear() {
    write([]);
  }

  function getCount() {
    return read().reduce((sum, i) => sum + i.qty, 0);
  }

  function getTotalBani() {
    return read().reduce((sum, i) => sum + i.qty * i.unitAmountBani, 0);
  }

  function formatBani(bani) {
    return (bani / 100).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' lei';
  }

  return {
    MAX_TABLE_QUANTITY,
    getItems,
    addItem,
    setQty,
    removeItem,
    clear,
    getCount,
    getTableCount,
    getRemainingTableCapacity,
    getTotalBani,
    formatBani,
    isAccessory,
  };
})();

// ---- Iconita de cos din header: bulina cu numarul de produse, pe orice pagina care o are ----
(function () {
  function paint() {
    document.querySelectorAll('.cart-badge').forEach((el) => {
      const count = window.PFCart.getCount();
      el.textContent = String(count);
      el.hidden = count === 0;
    });
  }
  window.addEventListener('pf-cart-change', paint);
  document.addEventListener('DOMContentLoaded', paint);
  if (document.readyState !== 'loading') paint();
})();

// Persistent cart access is mounted after ScrollSmoother wraps page content.
(function () {
  function mount() {
    if (document.querySelector('.pf-floating-cart')) return;
    const link = document.createElement('a');
    link.className = 'pf-floating-cart';
    link.href = 'cos-cumparaturi.html';
    link.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg><span class="pf-floating-cart-label"></span><span class="pf-floating-cart-count" aria-hidden="true">0</span>';
    document.body.append(link);
    let lastCount = null;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    function paint() {
      const count = window.PFCart.getCount();
      const en = document.documentElement.lang === 'en';
      link.querySelector('.pf-floating-cart-label').textContent = en ? 'Your bag' : 'Coșul tău';
      link.querySelector('.pf-floating-cart-count').textContent = String(count);
      link.setAttribute('aria-label', en ? `Your bag, ${count} items` : `Coșul tău, ${count} produse`);
      link.dataset.filled = String(count > 0);
      if (lastCount !== null && count > lastCount && window.gsap && !reduced.matches) {
        gsap.fromTo(link.querySelector('.pf-floating-cart-count'), { scale: .7 }, { scale: 1, duration: .6, ease: 'back.out(2)', overwrite: true });
      }
      lastCount = count;
    }
    paint();
    window.addEventListener('pf-cart-change', paint);
    window.addEventListener('storage', paint);
    new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    if (window.gsap && !reduced.matches) gsap.fromTo(link, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .8, delay: .25, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();

// ---- Semnal vizual la adaugare: o eticheta scurta iese langa iconita cosului ----
// Feedbackul de pana acum statea langa buton (eticheta "Adaugat", nota de sub el),
// deci nu arata unde este cosul. Eticheta apare fix langa iconita vizibila:
// railul pe desktop, header-ul pe mobil.
(function () {
  // Pe pagina cosului lista se actualizeaza sub ochii utilizatorului — ar fi zgomot.
  if (document.querySelector('.cart-editorial')) return;

  const key = (item) => [item.id, item.color || '', item.mask || ''].join('::');
  const snapshotOf = (items) => new Map(items.map((item) => [key(item), item.qty]));

  let snapshot = snapshotOf(window.PFCart.getItems());
  let flag = null;
  let anchored = null;
  let hideTimer = null;

  function grownItem(items) {
    return items.find((item) => item.qty > (snapshot.get(key(item)) || 0)) || null;
  }

  // Iconita vizibila la latimea curenta: railul (desktop) sau header-ul (mobil).
  function visibleCart() {
    return [document.querySelector('.rail-cart'), document.querySelector('.cart-link')]
      .find((el) => el && el.getClientRects().length) || null;
  }

  function hide() {
    if (flag) flag.classList.remove('is-visible');
    if (anchored) anchored.classList.remove('is-cart-added');
    anchored = null;
  }

  // Header-ul mobil se retrage la scroll. Ancorata de el asa, eticheta ar aparea
  // in afara ecranului — exact cand utilizatorul are mai multa nevoie de ea.
  // Il readucem instant, la fel ca deschiderea meniului mobil (site.js).
  function revealHeader(target) {
    const header = target.closest(".site-header");
    if (!header || !header.classList.contains("hidden")) return;
    const previous = header.style.transition;
    header.style.transition = "none";
    header.classList.remove("hidden");
    void header.offsetWidth;
    header.style.transition = previous;
  }

  function show(item) {
    const target = visibleCart();
    if (!target) return;
    revealHeader(target);
    const rect = target.getBoundingClientRect();
    if (!rect.width) return;
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    if (!flag) {
      flag = document.createElement('div');
      flag.className = 'pf-cart-flag';
      // Vizual; confirmarea pentru cititoarele de ecran o dau butoanele de adaugare.
      flag.setAttribute('aria-hidden', 'true');
      document.body.appendChild(flag);
    }

    const en = document.documentElement.lang === 'en';
    const name = document.createElement('b');
    name.textContent = item.name || (en ? 'Product' : 'Produs');
    const note = document.createElement('span');
    note.textContent = en ? 'added to bag' : 'adăugat în coș';
    flag.replaceChildren(name, note);

    // Railul sta pe marginea stanga, header-ul pe dreapta: eticheta iese in afara.
    const toRight = rect.left < window.innerWidth / 2;
    flag.dataset.side = toRight ? 'right' : 'left';
    flag.style.top = Math.round(rect.top + rect.height / 2) + 'px';
    flag.style.left = toRight ? Math.round(rect.right + 12) + 'px' : 'auto';
    flag.style.right = toRight ? 'auto' : Math.round(window.innerWidth - rect.left + 12) + 'px';

    if (anchored && anchored !== target) anchored.classList.remove('is-cart-added');
    anchored = target;
    // Reluam animatia bulinei chiar daca se adauga de doua ori la rand.
    target.classList.remove('is-cart-added');
    void target.offsetWidth;
    target.classList.add('is-cart-added');

    requestAnimationFrame(() => flag.classList.add('is-visible'));
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 2400);
  }

  window.addEventListener('pf-cart-change', (event) => {
    const items = (event.detail && event.detail.items) || window.PFCart.getItems();
    const item = grownItem(items);
    snapshot = snapshotOf(items);
    if (item) show(item);
  });

  // Pozitia e calculata o singura data, deci o redimensionare ar lasa-o pe langa.
  window.addEventListener('resize', () => { if (flag && flag.classList.contains('is-visible')) { clearTimeout(hideTimer); hide(); } });
})();
