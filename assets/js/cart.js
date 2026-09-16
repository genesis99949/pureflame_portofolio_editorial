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
