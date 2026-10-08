// ---- Adaptive header: vizibil sus, se ascunde cand cobori, reapare cand
// urci suficient. Pe touch asteapta finalul gestului, ca micile inversari
// produse cat timp degetul este pe ecran sa nu faca headerul sa palpaie. ----
(function(){
  const header = document.getElementById('header');
  if (!header) return;
  const HIDE_AFTER = 80;
  const coarsePointer = window.matchMedia('(any-pointer: coarse)');
  const getScrollY = () => window.PFScroll ? window.PFScroll.get() : window.scrollY;
  const show = () => header.classList.remove('hidden');
  const hide = () => header.classList.add('hidden');
  const distanceToHide = () => coarsePointer.matches ? 56 : 10;
  const distanceToShow = () => coarsePointer.matches ? 84 : 10;

  let anchorY = Math.max(0, getScrollY());
  let touchAnchorY = anchorY;
  let touching = false;
  let ticking = false;

  function applyPosition(y) {
    y = Math.max(0, y);
    if (y <= HIDE_AFTER) {
      show();
      anchorY = y;
      return;
    }

    if (header.classList.contains('hidden')) {
      // Cat timp continuam in jos, varful curent devine reperul de la care
      // trebuie sa urcam intentionat pentru a readuce bara.
      if (y > anchorY) anchorY = y;
      else if (anchorY - y >= distanceToShow()) {
        show();
        anchorY = y;
      }
    } else {
      // Cat timp continuam in sus, minimul curent devine reperul pentru
      // urmatoarea coborare; oscilatiile scurte nu schimba starea.
      if (y < anchorY) anchorY = y;
      else if (y - anchorY >= distanceToHide()) {
        hide();
        anchorY = y;
      }
    }
  }

  // Firul ember de sub bara mobila (mobile-header.css) arata cat din pagina
  // a fost parcurs. Se actualizeaza si in timpul gestului, spre deosebire de
  // ascunderea barei.
  const maxScroll = () => window.ScrollTrigger
    ? ScrollTrigger.maxScroll(window)
    : document.documentElement.scrollHeight - window.innerHeight;
  function paintProgress(y) {
    const max = maxScroll();
    header.style.setProperty('--pf-scroll', max > 0 ? Math.min(1, Math.max(0, y / max)).toFixed(4) : '0');
  }

  function update() {
    const y = getScrollY();
    paintProgress(y);
    if (!touching) applyPosition(y);
    ticking = false;
  }

  function queueUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  if (window.ScrollTrigger) {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: queueUpdate
    });
  } else {
    document.addEventListener('scroll', queueUpdate, { passive: true });
  }

  document.addEventListener('touchstart', (event) => {
    if (!coarsePointer.matches || event.touches.length !== 1) return;
    touching = true;
    touchAnchorY = Math.max(0, getScrollY());
    anchorY = touchAnchorY;
  }, { passive: true });

  const finishTouch = () => {
    if (!touching) return;
    touching = false;
    anchorY = touchAnchorY;
    queueUpdate();
  };
  document.addEventListener('touchend', finishTouch, { passive: true });
  document.addEventListener('touchcancel', finishTouch, { passive: true });

  coarsePointer.addEventListener('change', () => { anchorY = Math.max(0, getScrollY()); });
  show();
  paintProgress(getScrollY());
})();

// ---- Meniu mobil (hamburger) ----
// Folosim o clasa (.nav-open), nu atributul `hidden` — pe desktop, media query-ul
// pentru clasa nici nu exista, deci .nav ramane mereu vizibil ca rand orizontal,
// indiferent de starea clasei. (Varianta cu `hidden` intra in conflict cu stilul
// implicit al browserului si putea ascunde meniul si pe desktop.)
(function(){
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;
  const closeBtn = document.getElementById('mobileNavClose');
  const header = nav.closest('.site-header');

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  let closeTimer = null;

  function isOpen(){ return nav.classList.contains('nav-open') && !nav.classList.contains('is-closing'); }

  // Butonul de meniu ramane deasupra panoului si devine butonul de inchidere,
  // deci si numele lui accesibil trebuie sa spuna ce face acum.
  function label(opened){
    toggle.dataset.ariaRo = opened ? 'Închide meniul' : 'Deschide meniul';
    toggle.dataset.ariaEn = opened ? 'Close menu' : 'Open menu';
    toggle.setAttribute('aria-label', document.documentElement.lang === 'en' ? toggle.dataset.ariaEn : toggle.dataset.ariaRo);
  }

  function open(openedByPointer){
    clearTimeout(closeTimer);
    nav.classList.remove('is-closing');
    document.documentElement.classList.remove('pf-mobile-menu-closing');
    header?.classList.remove('hidden');
    header?.classList.add('menu-open');
    document.documentElement.classList.add('pf-mobile-menu-open');
    nav.classList.add('nav-open');
    nav.classList.toggle('nav-open-pointer', !!openedByPointer);
    toggle.setAttribute('aria-expanded', 'true');
    label(true);
    document.body.style.overflow = 'hidden';
  }
  function finish(){
    nav.classList.remove('is-closing');
    header?.classList.remove('menu-open');
    document.documentElement.classList.remove('pf-mobile-menu-open', 'pf-mobile-menu-closing');
    nav.classList.remove('nav-open');
    nav.classList.remove('nav-open-pointer');
  }
  // immediate: fara animatia de iesire — pentru navigare si pentru cosul care
  // se deschide imediat dupa (cart-dialog.js), ca blocarea scroll-ului sa nu
  // se suprapuna peste a lui.
  function close(immediate){
    if (!isOpen()) return;
    toggle.setAttribute('aria-expanded', 'false');
    label(false);
    document.body.style.overflow = '';
    toggle.focus({ preventScroll: true });
    clearTimeout(closeTimer);
    if (immediate === true || calm.matches) return finish();
    // Continutul se retrage, apoi cortina urca inapoi sub bara
    // (mobile-header.css); durata de aici acopera ambele animatii.
    nav.classList.add('is-closing');
    document.documentElement.classList.add('pf-mobile-menu-closing');
    closeTimer = setTimeout(finish, 500);
  }

  toggle.addEventListener('click', (event) => { isOpen() ? close() : open(event.detail !== 0); });
  closeBtn?.addEventListener('click', () => close(true));
  // Guardat cu isOpen(): pe desktop nav-ul e acelasi element, dar niciodata deschis,
  // deci clicurile pe linkuri nu trebuie sa mute focusul pe hamburger-ul ascuns.
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => close(true)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // daca fereastra trece pe desktop cat timp meniul e deschis, il inchidem
  const mq = window.matchMedia('(min-width: 1025px)');
  mq.addEventListener('change', (e) => { if (e.matches) close(true); });
})();


// ---- CTA buttons: smooth-scroll to contact/collection (homepage only) ----
document.querySelectorAll('.header-cta, .btn-solid[data-scroll]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById('contact');
    if (target) { window.PFScroll ? window.PFScroll.to(target) : target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ---- RO/EN language toggle (site-wide) ----
// Doua instante posibile pe aceeasi pagina: cea din header (desktop) si cea
// din meniul mobil (vizibila doar in burger menu, pe telefon) — trebuie
// sincronizate impreuna, nu doar prima gasita.
(function(){
  const toggles = Array.from(document.querySelectorAll('.header-lang'));
  if (!toggles.length) return;
  const buttons = toggles.flatMap((t) => Array.from(t.querySelectorAll('.lang-btn')));

  function applyLang(lang){
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang-ro').forEach(el => { el.hidden = (lang === 'en'); });
    document.querySelectorAll('.lang-en').forEach(el => { el.hidden = (lang !== 'en'); });
    // Placeholderele nu pot folosi span-uri .lang-*, deci le comutam din data-attributes.
    document.querySelectorAll('[data-placeholder-ro]').forEach(el => {
      el.placeholder = (lang === 'en' ? el.dataset.placeholderEn : el.dataset.placeholderRo) || '';
    });
    document.querySelectorAll('[data-aria-ro]').forEach(el => {
      el.setAttribute('aria-label', (lang === 'en' ? el.dataset.ariaEn : el.dataset.ariaRo) || el.dataset.ariaRo);
    });
    buttons.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    try { localStorage.setItem('pf-lang', lang); } catch (e) {}
  }

  let saved = 'ro';
  try { saved = localStorage.getItem('pf-lang') || 'ro'; } catch (e) {}
  applyLang(saved);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });
})();

// ---- Evidentiaza pagina curenta in nav (desktop + meniul mobil) ----
(function(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a[href]').forEach((a) => {
    const linkPath = a.getAttribute('href').split('#')[0].split('?')[0];
    if (linkPath && linkPath === path) a.classList.add('is-active');
  });
})();

// ---- Meniu "Colectie" la hover si panoul cosului la click ----
// Injectate din JS: markup-ul headerului se repeta pe 17 pagini, iar o
// singura definitie aici tine toate paginile in acelasi pas.
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const PRODUCTS = [
    { name: 'Aether', href: 'aether.html', ro: 'Rotundă, joasă', en: 'Round, low' },
    { name: 'Embera', href: 'embera.html', ro: 'Dreptunghiulară, joasă', en: 'Rectangular, low' },
    { name: 'Flavo', href: 'flavo.html', ro: 'Pătrată, joasă', en: 'Square, low' },
    { name: 'Fera', href: 'fera.html', ro: 'Dreptunghiulară, înaltă', en: 'Rectangular, tall' },
    { name: 'Ignite', href: 'ignite.html', ro: 'Liniară, înaltă', en: 'Linear, tall' }
  ];
  const bi = (ro, en) => `<span class="lang-ro">${ro}</span><span class="lang-en" hidden>${en}</span>`;
  // Panourile sunt injectate dupa ce comutatorul de limba si-a facut treaba,
  // deci isi aplica singure limba salvata — acelasi tipar ca in celelalte module.
  const roots = [];
  function syncLang(root) {
    let lang = 'ro';
    try { lang = localStorage.getItem('pf-lang') || 'ro'; } catch (e) {}
    root.querySelectorAll('.lang-ro').forEach((el) => { el.hidden = lang === 'en'; });
    root.querySelectorAll('.lang-en').forEach((el) => { el.hidden = lang !== 'en'; });
  }
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => roots.forEach(syncLang));
  });

  // Miscarea: panoul se toarna din bara si se aseaza cu o revenire elastica.
  // GSAP lipseste pe doua pagini, asa ca fara el raman tranzitiile din CSS.
  const gsap = window.gsap;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (gsap) document.documentElement.classList.add('has-gsap');

  function animate(panel, open) {
    if (!gsap) return;
    const rows = panel.children;
    gsap.killTweensOf([panel, rows]);
    if (calm.matches) {
      gsap.set(panel, { visibility: open ? 'visible' : 'hidden',
        clipPath: open ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)', scaleY: 1, scaleX: 1 });
      gsap.set(rows, { opacity: 1, y: 0 });
      return;
    }
    if (open) {
      gsap.set(panel, { visibility: 'visible' });
      gsap.timeline()
        .fromTo(panel, { clipPath: 'inset(0 0 100% 0)' },
                       { clipPath: 'inset(0 0 0% 0)', duration: .44, ease: 'power3.out' }, 0)
        // Intinderea pe verticala plus usoara latire fac diferenta dintre un
        // panou care apare si unul care curge.
        .fromTo(panel, { scaleY: .68, scaleX: 1.06 },
                       { scaleY: 1, scaleX: 1, duration: .78, ease: 'elastic.out(1, .62)' }, 0)
        .fromTo(rows, { opacity: 0, y: -8 },
                      { opacity: 1, y: 0, duration: .3, stagger: .04, ease: 'power2.out' }, .08);
    } else {
      gsap.to(panel, { clipPath: 'inset(0 0 100% 0)', scaleY: .84, scaleX: 1.02,
        duration: .22, ease: 'power2.in',
        onComplete() { gsap.set(panel, { visibility: 'hidden' }); } });
    }
  }

  // Un singur panou deschis la un moment dat, oriunde in header.
  const panels = [];
  function closeAll(except) {
    panels.forEach((p) => { if (p.el !== except) p.close(); });
  }

  function register(trigger, panel, opts) {
    let openTimer, closeTimer;
    const wrap = trigger.parentElement;
    const mobileCart = () => opts.click && matchMedia('(max-width:1024px)').matches;
    panel.inert = true;
    const api = {
      el: panel,
      close() {
        clearTimeout(openTimer); clearTimeout(closeTimer);
        if (!panel.classList.contains('is-open')) return;
        panel.classList.remove('is-open');
        panel.inert = true;
        header.classList.remove('mobile-cart-open');
        if (panel.contains(document.activeElement)) trigger.focus();
        trigger.setAttribute('aria-expanded', 'false');
        animate(panel, false);
      },
      open() {
        if (header.classList.contains('lh-enabled')) return;
        clearTimeout(closeTimer);
        // Un hover repetat nu trebuie sa reia turnarea de la zero.
        if (panel.classList.contains('is-open')) return;
        closeAll(panel);
        if (opts.onOpen) opts.onOpen();
        panel.inert = false;
        // Panoul porneste de la marginea barei, nu de la link: wrapper-ul are
        // inaltimea textului si sta centrat in bara, deci "top:100%" ar cadea
        // in interiorul ei.
        panel.style.top = (header.getBoundingClientRect().bottom
                           - wrap.getBoundingClientRect().top) + 'px';
        if (mobileCart()) {
          document.body.appendChild(panel);
          header.classList.remove('hidden');
          header.classList.add('mobile-cart-open');
          const top = Math.max(12, header.getBoundingClientRect().bottom + 8);
          panel.style.top = top + 'px';
          panel.style.setProperty('--cart-top', top + 'px');
        } else if (panel.parentElement !== wrap) wrap.appendChild(panel);
        panel.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        animate(panel, true);
        if (mobileCart()) panel.querySelector('.hdr-cart-close')?.focus({preventScroll:true});
      },
      get isOpen() { return panel.classList.contains('is-open'); }
    };
    panels.push(api);
    panel.addEventListener('click', e => { if (e.target.closest('.hdr-cart-close')) api.close(); });
    window.addEventListener('resize', () => { if (api.isOpen) api.close(); });

    if (opts.hover) {
      // Pornit doar pe dispozitive cu pointer fin: pe touch, atingerea trebuie
      // sa deschida legatura, nu un meniu care apoi ramane agatat.
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
      wrap.addEventListener('pointerenter', () => {
        if (!fine.matches) return;
        clearTimeout(closeTimer);
        openTimer = setTimeout(api.open, 90);
      });
      wrap.addEventListener('pointerleave', () => {
        if (!fine.matches) return;
        clearTimeout(openTimer);
        // Ragaz cat mouse-ul traverseaza spatiul dintre buton si panou.
        closeTimer = setTimeout(api.close, 180);
      });
      wrap.addEventListener('focusin', api.open);
      wrap.addEventListener('focusout', (e) => {
        if (!wrap.contains(e.relatedTarget)) api.close();
      });
    }
    if (opts.click) {
      trigger.addEventListener('click', (e) => {
        // Fara suportul cosului, legatura ramane o legatura obisnuita.
        if (opts.guard && !opts.guard()) return;
        e.preventDefault();
        if (api.isOpen) api.close(); else api.open();
      });
    }
    return api;
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.hdr-menu, .hdr-panel')) closeAll();
  });

  // ---------- Colectie ----------
  header.querySelectorAll('.home-header-nav a[href="colectie.html"]').forEach((link) => {
    const wrap = document.createElement('div');
    wrap.className = 'hdr-menu';
    link.parentNode.insertBefore(wrap, link);
    wrap.appendChild(link);
    link.setAttribute('aria-expanded', 'false');
    link.setAttribute('aria-haspopup', 'true');

    const panel = document.createElement('div');
    panel.className = 'hdr-panel hdr-panel-collection';
    panel.innerHTML = PRODUCTS.map((p) => `
      <a class="hdr-prod" href="${p.href}"><b>${p.name}</b>${bi(p.ro, p.en)}</a>`).join('') +
      `<a class="hdr-panel-all" href="colectie.html">${bi('Vezi toată colecția', 'View the full collection')}</a>`;
    wrap.appendChild(panel);
    roots.push(panel); syncLang(panel);
    register(link, panel, { hover: true });
  });

  // The header cart is a direct link; previews belong to the floating control.
  header.querySelectorAll('.cart-link').forEach(link => {
    link.href = 'cos-cumparaturi.html';
    link.removeAttribute('aria-expanded');
    link.removeAttribute('aria-haspopup');
  });
})();
