// ---- Pagini de produs (embera/aether/flavo/fera/ignite): galerie + panou de cumparare ----
// Un singur script pentru toate cele 5 pagini — layout si comportament identice,
// doar continutul (date, imagini) difera per pagina. Galeria e locala paginii
// (nu are nevoie de collection.js), iar adaugarea in cos foloseste direct
// window.PFCart (cart.js) — nicio stare paralela de cos.
(function () {
  const page = document.querySelector('.product-detail-page');
  if (!page) return;

  // ---- Limba curenta ----
  // site.js comuta .lang-ro/.lang-en prin atributul `hidden` si marcheaza butonul
  // activ; nu emite niciun eveniment. Galeria are insa continut care nu poate trai
  // in span-uri (src, alt, aria-label), asa ca citim limba din butonul activ si ne
  // abonam la aceleasi butoane. site.js e incarcat inaintea noastra, deci
  // handlerul lui ruleaza primul si `.lang-btn.active` e deja actualizat.
  const isEnglish = () => document.querySelector('.lang-btn.active')?.dataset.lang === 'en';
  const langSubscribers = [];
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => langSubscribers.forEach((fn) => fn()));
  });

  // Finisajul devine sufix de data-attribute: "Negru Intens" -> "negru-intens".
  function finishSlug(color) {
    return (color || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().trim().replace(/\s+/g, '-');
  }

  // ---- Galerie: miniaturi + vizual principal ----
  const applyFinishToGallery = (function gallery() {
    const wrap = page.querySelector('.epp-gallery-wrap');
    if (!wrap) return null;

    // Curata sloturile marcate editorial si pastreaza diagrama ultima,
    // inainte ca lista accesibila de taburi si numerotarea sa fie calculate.
    wrap.querySelectorAll('[data-gallery-remove]').forEach((item) => item.remove());
    const thumbList = wrap.querySelector('.epp-thumbs');
    const diagramThumb = thumbList?.querySelector('[data-gallery-diagram]');
    if (diagramThumb) thumbList.append(diagramThumb);

    // Slotul 3D nu este o fotografie: nu intra in rotatia galeriei si nici in
    // numerotare, doar trimite la sectiunea cu modelul. Ramane ultimul.
    const viewerThumb = thumbList?.querySelector('[data-gallery-viewer]');
    if (viewerThumb) {
      thumbList.append(viewerThumb);
      viewerThumb.addEventListener('click', () => {
        const target = document.querySelector(viewerThumb.dataset.galleryViewer);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.focus({ preventScroll: true });
      });
    }

    const thumbs = Array.from(wrap.querySelectorAll('.epp-thumb:not([data-gallery-viewer])'));
    const mainVisual = wrap.querySelector('.epp-main-visual');
    const labelEl = wrap.querySelector('.epp-visual-label');
    const countEl = wrap.querySelector('.epp-visual-count');
    if (!thumbs.length || !mainVisual) return null;

    const total = thumbs.length;
    let index = Math.max(0, thumbs.findIndex((t) => t.classList.contains('is-active')));
    let finish = '';

    // Fiecare slot poate avea variante per finisaj (data-src-gri, data-src-negru)
    // si per limba (data-src-en, pentru schita de dimensiuni). Cand varianta
    // ceruta lipseste, cadem pe valoarea implicita — galeria ramane completa
    // chiar daca un produs nu are fotografii pentru toate finisajele.
    function pick(thumb, base, opts) {
      const d = thumb.dataset;
      const en = opts && opts.en;
      const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const keys = [];
      if (en && finish) keys.push(base + 'En' + camel('-' + finish));
      if (finish) keys.push(base + camel('-' + finish));
      if (en) keys.push(base + 'En');
      keys.push(base);
      for (const k of keys) if (d[k]) return d[k];
      return '';
    }

    function view(thumb) {
      const en = isEnglish();
      return {
        src: pick(thumb, 'src', { en }),
        alt: pick(thumb, 'alt', { en }),
        thumb: pick(thumb, 'thumb', { en }) || thumb.querySelector('img')?.getAttribute('src'),
        label: (en && thumb.dataset.labelEn) || thumb.dataset.label || '',
        width: pick(thumb, 'w', { en }),
        height: pick(thumb, 'h', { en }),
        fit: thumb.dataset.fit || 'cover'
      };
    }

    // Randeaza slotul curent. Media este inlocuita, dar .epp-visual-label si
    // .epp-visual-count raman in DOM (sunt copii ai lui mainVisual, ca si media).
    function render(next, opts) {
      index = ((next % total) + total) % total;
      const thumb = thumbs[index];
      const v = view(thumb);
      const isVideo = thumb.dataset.type === 'video';

      mainVisual.querySelector('img, video')?.remove();
      let media;
      if (isVideo) {
        media = document.createElement('video');
        media.src = v.src;
        media.poster = thumb.dataset.poster || '';
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.autoplay = true;
      } else {
        media = document.createElement('img');
        media.src = v.src;
        media.alt = v.alt;
        media.decoding = 'async';
      }
      // Latimea/inaltimea reala pastreaza raportul rezervat si opreste saltul de
      // layout la fiecare schimbare de imagine.
      if (v.width && v.height) {
        media.width = Number(v.width);
        media.height = Number(v.height);
      }
      mainVisual.prepend(media);
      if (isVideo) { const pr = media.play(); if (pr) pr.catch(() => {}); }

      // Schita de dimensiuni si randarile de studio trebuie vazute intregi;
      // fotografiile de ambient suporta decuparea si umplu cadrul.
      mainVisual.classList.toggle('epp-main-visual--contain', v.fit === 'contain');

      if (labelEl) labelEl.textContent = v.label;
      if (countEl) countEl.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');

      const en = isEnglish();
      thumbs.forEach((t, i) => {
        const active = i === index;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
        // Roving tabindex: tablist-ul are un singur stop de Tab, iar sagetile
        // muta selectia intre miniaturi — asa cum promite role="tab".
        t.tabIndex = active ? 0 : -1;
        const tv = view(t);
        const timg = t.querySelector('img');
        if (timg && tv.thumb && timg.getAttribute('src') !== tv.thumb) timg.src = tv.thumb;
        t.setAttribute('aria-label', (en ? 'Image ' : 'Imaginea ') + (i + 1) + (en ? ' of ' : ' din ') + total + ': ' + tv.label);
      });

      if (opts && opts.focusThumb) thumbs[index].focus();
      // Pe mobil miniaturile sunt un rand derulabil: tine slotul activ in cadru.
      if (opts && opts.scrollIntoView !== false) {
        thumbs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }

    thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => render(i, { scrollIntoView: false }));
    });

    // Sagetile / Home / End navigheaza tablist-ul fara sa deschida lightbox-ul.
    wrap.querySelector('.epp-thumbs')?.addEventListener('keydown', (e) => {
      const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (e.key in map) { e.preventDefault(); render(index + map[e.key], { focusThumb: true }); }
      else if (e.key === 'Home') { e.preventDefault(); render(0, { focusThumb: true }); }
      else if (e.key === 'End') { e.preventDefault(); render(total - 1, { focusThumb: true }); }
    });

    render(index, { scrollIntoView: false });
    langSubscribers.push(() => render(index, { scrollIntoView: false }));

    // ---- Lightbox: imaginea curenta, la marime completa ----
    const lightbox = document.createElement('div');
    lightbox.className = 'epp-lightbox';
    lightbox.hidden = true;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Imagine mărită');
    lightbox.innerHTML =
      '<button type="button" class="epp-lightbox-close" aria-label="Închide imaginea">×</button>' +
      '<button type="button" class="epp-lightbox-nav epp-lightbox-prev" aria-label="Imaginea anterioară">‹</button>' +
      '<img class="epp-lightbox-img" alt="">' +
      '<button type="button" class="epp-lightbox-nav epp-lightbox-next" aria-label="Imaginea următoare">›</button>';
    document.body.appendChild(lightbox);
    const lightboxImg = lightbox.querySelector('.epp-lightbox-img');
    const focusables = () => Array.from(lightbox.querySelectorAll('button'));
    let lastFocused = null;

    function syncLightboxImg() {
      const v = view(thumbs[index]);
      lightboxImg.src = v.src;
      lightboxImg.alt = v.alt;
    }
    function openLightbox() {
      if (thumbs[index]?.dataset.type === 'video') return;
      lastFocused = document.activeElement;
      syncLightboxImg();
      lightbox.hidden = false;
      document.body.classList.add('epp-lightbox-open');
      focusables()[0]?.focus();
    }
    function closeLightbox() {
      lightbox.hidden = true;
      document.body.classList.remove('epp-lightbox-open');
      // Focusul se intoarce de unde a plecat, nu la inceputul paginii.
      (lastFocused instanceof HTMLElement ? lastFocused : mainVisual).focus();
    }
    function stepLightbox(delta) {
      render(index + delta, { scrollIntoView: false });
      syncLightboxImg();
    }

    mainVisual.addEventListener('click', (e) => {
      if (e.target.closest('video')) return;
      openLightbox();
    });
    // mainVisual e acum role="tabpanel" cu tabindex="0": lightbox-ul devine
    // accesibil si de la tastatura, nu doar cu mouse-ul.
    mainVisual.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(); }
    });
    lightbox.querySelector('.epp-lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.epp-lightbox-prev').addEventListener('click', () => stepLightbox(-1));
    lightbox.querySelector('.epp-lightbox-next').addEventListener('click', () => stepLightbox(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') stepLightbox(-1);
      else if (e.key === 'ArrowRight') stepLightbox(1);
      else if (e.key === 'Tab') {
        // Capcana de focus: Tab nu trebuie sa scape sub overlay.
        const items = focusables();
        const i = items.indexOf(document.activeElement);
        const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
        e.preventDefault();
        items[next]?.focus();
      }
    });

    // Schimbarea finisajului repointeaza sloturile care au varianta ceruta si
    // pastreaza slotul curent — cumparatorul nu pierde locul din galerie.
    return function (color) {
      finish = finishSlug(color);
      render(index, { scrollIntoView: false });
    };
  })();

  // ---- Selector finisaj (culoare) ----
  // data-color ramane sursa canonica (RO) trimisa in cos, indiferent de limba
  // afisata — la fel ca in restul site-ului (buybox.js foloseste acelasi tipar).
  const colorGroup = page.querySelector('.buy-colors');
  const colorValueEl = document.getElementById('eppColorValue');
  function selectedColor() {
    return colorGroup?.querySelector('.color-swatch.active')?.dataset.color || null;
  }
  if (colorGroup) {
    colorGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.color-swatch');
      if (!btn || !colorGroup.contains(btn)) return;
      colorGroup.querySelectorAll('.color-swatch').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      applyFinishToGallery?.(btn.dataset.color);
      // Legenda are propriile span-uri lang-ro/lang-en, la fel ca butonul —
      // comutatorul global de limba (site.js) le prinde oricand mai departe.
      if (colorValueEl) {
        const isEn = isEnglish();
        colorValueEl.innerHTML =
          `<span class="lang-ro"${isEn ? ' hidden' : ''}>${btn.dataset.color}</span>` +
          `<span class="lang-en"${isEn ? '' : ' hidden'}>${btn.dataset.colorEn || btn.dataset.color}</span>`;
      }
    });
    // Porneste galeria pe finisajul deja marcat activ in markup.
    applyFinishToGallery?.(selectedColor());
  }

  const buyPanel = page.querySelector('.epp-buy-panel');
  const addBtn = document.getElementById('addToCartBtn');
  const addedNote = document.getElementById('addedToCartNote');
  const originalAddedNoteHtml = addedNote?.innerHTML || '';

  // ---- Cantitate: maximum 3 mese cumulate în întregul coș ----
  const qtyValueEl = document.getElementById('qtyValue');
  const qtyMinusBtn = document.getElementById('qtyMinus');
  const qtyPlusBtn = document.getElementById('qtyPlus');
  let quantity = 1;

  function showLimitFeedback() {
    if (!addedNote) return;
    const english = isEnglish();
    addedNote.dataset.cartLimit = 'true';
    addedNote.innerHTML =
      `<span class="lang-ro"${english ? ' hidden' : ''}>Ai atins limita de 3 mese per comandă. Accesoriile rămân nelimitate.</span>` +
      `<span class="lang-en"${english ? '' : ' hidden'}>You've reached the limit of 3 tables per order. Accessories remain unlimited.</span>`;
    addedNote.hidden = false;
  }

  function restoreAddedNote() {
    if (!addedNote) return;
    delete addedNote.dataset.cartLimit;
    addedNote.innerHTML = originalAddedNoteHtml;
  }

  function renderQty() {
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
  qtyMinusBtn?.addEventListener('click', () => { quantity = Math.max(1, quantity - 1); renderQty(); });
  qtyPlusBtn?.addEventListener('click', () => {
    quantity = Math.min(window.PFCart?.getRemainingTableCapacity?.() ?? 3, quantity + 1);
    renderQty();
  });
  window.addEventListener('pf-cart-change', renderQty);
  renderQty();

  // ---- Adauga in cos (foloseste sursa reala de pret, din data-amount-bani) ----
  let addedNoteTimer = null;
  let addedBtnTimer = null;

  function showAddedFeedback() {
    if (addedNote) {
      restoreAddedNote();
      addedNote.hidden = false;
      clearTimeout(addedNoteTimer);
      addedNoteTimer = setTimeout(() => {
        addedNote.hidden = true;
        renderQty();
      }, 4000);
    }
    if (addBtn) {
      addBtn.classList.add('is-added');
      clearTimeout(addedBtnTimer);
      addedBtnTimer = setTimeout(() => { addBtn.classList.remove('is-added'); }, 1800);
    }
  }

  addBtn?.addEventListener('click', () => {
    if (!buyPanel || !window.PFCart) return;
    const result = window.PFCart.addItem({
      id: buyPanel.dataset.productId,
      name: page.querySelector('.epp-title')?.textContent.trim() || buyPanel.dataset.productId,
      color: selectedColor(),
      unitAmountBani: Number(buyPanel.dataset.amountBani),
      unitPrice: buyPanel.dataset.price || '',
      image: buyPanel.dataset.image || '',
    }, quantity);
    if (result.added > 0) showAddedFeedback();
    else showLimitFeedback();
  });
})();
