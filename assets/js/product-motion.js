// ---- Pagini de produs: intrarea in scena + reveal la scroll (GSAP) ----
// Pe .product-detail-page, scroll-fx.js dezactiveaza intentionat
// ScrollSmoother: galeria e position:sticky, iar continutul transformat de
// smoother ar rupe sticky-ul. Deci aici nu exista `data-speed` — paralaxa se
// face direct cu ScrollTrigger + scrub.
//
// Starile initiale ascunse pentru hero stau in product-detail.css, sub
// `.js-reveal` (clasa vine dintr-un script din <head>), ca sa nu se vada
// niciun flash de continut asezat inainte de a porni animatia. Daca GSAP
// lipseste sau utilizatorul cere motion redus, punem `.pf-motion-off` pe
// <html> si CSS-ul arata totul instant, fara animatie.
(function () {
  var page = document.querySelector('.product-detail-page');
  if (!page) return;

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ready = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  if (!ready || reduce) { root.classList.add('pf-motion-off'); return; }
  gsap.registerPlugin(ScrollTrigger);

  var DUR = 0.9;
  var EASE = 'power2.out';

  function list(target) {
    return gsap.utils.toArray(target).filter(Boolean);
  }

  // Reveal la scroll. Starea ascunsa se pune tot de aici, nu din CSS: cele
  // trei sectiuni randate din JS (recenzii, accesorii, comparatie) nu exista
  // in HTML, deci o regula CSS n-ar avea ce sa prinda.
  function reveal(target, opts) {
    var els = list(target);
    if (!els.length) return;
    opts = opts || {};
    var y = opts.y == null ? 24 : opts.y;
    gsap.set(els, { opacity: 0, y: y });
    ScrollTrigger.batch(els, {
      start: opts.start || 'top 86%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: opts.duration || DUR,
          ease: EASE,
          stagger: opts.stagger == null ? 0.1 : opts.stagger,
          overwrite: true,
          // Fara clearProps, un translate(0px) ramas pe container creaza un
          // containing block si muta copiii pozitionati absolut.
          clearProps: 'transform'
        });
      }
    });
  }

  // Varianta doar-opacitate, pentru containere unde un transform ar schimba
  // pozitionarea din interior: <tr> (are th lipit), scena 3D (canvas montat
  // ulterior), zona de scroll a tabelului.
  function fade(target, opts) {
    var els = list(target);
    if (!els.length) return;
    opts = opts || {};
    gsap.set(els, { opacity: 0 });
    ScrollTrigger.batch(els, {
      start: opts.start || 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          duration: opts.duration || 0.7,
          ease: EASE,
          stagger: opts.stagger == null ? 0.06 : opts.stagger,
          overwrite: true
        });
      }
    });
  }

  // ---- Intrarea in scena, la incarcare ----
  // Galeria si panoul de cumparare sunt deja in cadru cand se deschide
  // pagina: n-au ce sa astepte de la scroll. Ordinea conteaza — intai
  // imaginea, apoi numele si pretul, apoi restul panoului.
  var HERO_SEL = '.epp-gallery-topline, .epp-main-visual, .epp-thumb, .epp-buy-panel > *';

  function heroIntro() {
    var tl = gsap.timeline({
      defaults: { ease: EASE, duration: 0.8 },
      onComplete: function () {
        // Dezactivam mai intai starea initiala din CSS si abia apoi curatam
        // stilurile inline puse de GSAP. In ordinea inversa, `.epp-thumb`
        // revenea pentru o fractiune de cadru la regula CSS cu opacity:0 si
        // ramanea invizibil dupa terminarea intro-ului.
        root.classList.add('pf-product-hero-ready');
        gsap.set(HERO_SEL, { clearProps: 'opacity,transform' });
      }
    });

    tl.to('.epp-gallery-topline', { opacity: 1, y: 0, duration: 0.6 }, 0)
      .to('.epp-main-visual', { opacity: 1, y: 0, duration: 1.05, ease: 'power3.out' }, 0.04)
      // Miniaturile nu se duc toate la 1: in design cele inactive stau la .55,
      // iar doar cea activa e opaca. Animam catre valoarea reala a fiecareia,
      // apoi stergem stilul inline — altfel `opacity` ramasa pe element ar bate
      // regula `.epp-thumb.is-active` la urmatoarea schimbare de slot.
      .to('.epp-thumb', {
        opacity: function (i, el) { return el.classList.contains('is-active') ? 1 : 0.55; },
        x: 0, duration: 0.65, stagger: 0.055
      }, 0.3)
      .to('.epp-buy-panel > *', { opacity: 1, y: 0, stagger: 0.065 }, 0.16);

    // Fotografia principala se aseaza dintr-un cadru putin mai apropiat.
    // Se anima <img>-ul, nu containerul: acesta are overflow:hidden, deci
    // marirea ramane in chenar. Tinta e imaginea existenta acum — galeria
    // inlocuieste elementul la fiecare schimbare de slot, iar o stare
    // initiala din CSS ar face fiecare miniatura sa porneasca ascunsa.
    var heroImg = page.querySelector('.epp-main-visual img');
    if (heroImg) {
      tl.fromTo(heroImg, { scale: 1.07 }, { scale: 1, duration: 1.4, ease: 'power3.out' }, 0.04);
    }
    return tl;
  }

  // Plasa de siguranta pentru hero.
  // Starile initiale ascunse vin din CSS, iar singurul lucru care le aduce
  // inapoi e time-line-ul de mai sus. Daca ticker-ul GSAP nu porneste —
  // requestAnimationFrame poate ramane oprit intr-un tab care nu picteaza —
  // timeline-ul ramane la cadrul zero si hero-ul nu se mai arata niciodata.
  // Dupa doua secunde si jumatate verificam si, daca inca e ascuns, il
  // dezvelim direct din CSS, fara animatie.
  function heroSafetyNet(tl) {
    setTimeout(function () {
      var probe = page.querySelector('.epp-buy-panel > *');
      if (!probe || getComputedStyle(probe).opacity !== '0') return;
      // Nu e destul sa oprim ascunderea din CSS: la primul cadru randat GSAP
      // a scris deja `opacity: 0` inline pe elemente, iar stilul inline bate
      // orice regula din foaia de stil. Oprim timeline-ul si stergem exact
      // proprietatile pe care le-a pus, ca fiecare element sa revina la
      // valoarea lui de repaus din design (miniaturile inactive la .55, nu la 1).
      if (tl) tl.kill();
      root.classList.add('pf-motion-off');
      root.classList.add('pf-product-hero-ready');
      gsap.set(HERO_SEL, { clearProps: 'opacity,transform' });
    }, 2500);
  }

  // ---- Povestea produsului (sectiunea intunecata) ----
  function storySection() {
    var section = page.querySelector('.epp-story-section');
    if (!section) return;

    reveal(section.querySelectorAll('.epp-story-intro > *'), { stagger: 0.12 });
    reveal(section.querySelectorAll('.epp-story-lead'), { y: 20 });
    reveal(section.querySelectorAll('.epp-story-points > li'), { stagger: 0.14, y: 26 });

    var visual = section.querySelector('.epp-story-visual');
    var img = visual && visual.querySelector('img');
    if (!visual || !img) return;

    gsap.set(visual, { opacity: 0 });
    gsap.to(visual, {
      opacity: 1,
      duration: 1.1,
      ease: EASE,
      scrollTrigger: { trigger: visual, start: 'top 88%', once: true }
    });

    // Paralaxa legata de scroll, nu de timp: imaginea urca lent in cadru cat
    // timp sectiunea traverseaza ecranul. Containerul are overflow:hidden.
    gsap.fromTo(img,
      { scale: 1.14, yPercent: -3.5 },
      {
        scale: 1.02, yPercent: 3.5, ease: 'none',
        scrollTrigger: { trigger: visual, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      }
    );
  }

  // ---- Explorare 3D ----
  function viewerSection() {
    var section = page.querySelector('.product-viewer');
    if (!section) return;

    reveal(section.querySelectorAll('.av-kicker, .av-heading'), { stagger: 0.1 });
    reveal(section.querySelectorAll('.av-inspector > *'), { stagger: 0.08, y: 18 });
    // Scena primeste doar opacitate: viewer-ul monteaza un <canvas> in ea, iar
    // un transform ramas pe container i-ar muta suprapunerile absolute.
    fade(section.querySelectorAll('.av-stage'), { duration: 1, start: 'top 88%' });
  }

  // ---- Dimensiuni: schitele se aseaza in cadru ----
  function measureSection() {
    var section = page.querySelector('.epp-measure-section');
    if (!section) return;

    reveal(section.querySelectorAll('.epp-measure-method'), { y: 14, duration: 0.7 });
    reveal(section.querySelectorAll('.epp-measure-copy > *'), { stagger: 0.1 });

    // Se scaleaza panza, nu formele din ea: `.epp-space-elevation` isi tine
    // pozitia printr-un translate propriu (vezi varianta Ignite), pe care un
    // scale scris de GSAP l-ar sterge.
    var canvases = list(section.querySelectorAll('.epp-measure-canvas'));
    var dims = list(section.querySelectorAll('.epp-measure-dimension'));
    var captions = list(section.querySelectorAll('.epp-measure-view figcaption'));
    if (!canvases.length) return;

    gsap.set(canvases, { opacity: 0, scale: 0.94, transformOrigin: '50% 50%' });
    gsap.set(dims.concat(captions), { opacity: 0 });

    ScrollTrigger.create({
      trigger: section,
      start: 'top 76%',
      once: true,
      onEnter: function () {
        gsap.to(canvases, { opacity: 1, scale: 1, duration: 1, ease: 'power3.out', stagger: 0.14 });
        // Cotele apar dupa ce conturul s-a asezat — intai forma, apoi cifrele.
        gsap.to(dims, { opacity: 1, duration: 0.5, ease: EASE, stagger: 0.06, delay: 0.5 });
        gsap.to(captions, { opacity: 1, duration: 0.5, ease: EASE, stagger: 0.1, delay: 0.35 });
      }
    });
  }

  // ---- Sectiuni randate din JS ----
  // Recenziile vin dupa un fetch, accesoriile si comparatia se randeaza la
  // incarcare. Asteptam sa apara continutul, apoi legam reveal-urile si
  // recalculam pozitiile trigger-elor de sub ele.
  function whenFilled(host, cb) {
    if (!host) return;
    if (host.children.length) { cb(); return; }
    var obs = new MutationObserver(function () {
      if (!host.children.length) return;
      obs.disconnect();
      cb();
    });
    obs.observe(host, { childList: true });
  }

  whenFilled(page.querySelector('[data-product-reviews]'), function () {
    reveal('.epp-reviews-head > *', { stagger: 0.1 });
    reveal('.epp-review-form-card', { y: 28 });
    reveal('.epp-review-card', { stagger: 0.09, y: 22 });
    ScrollTrigger.refresh();
  });

  whenFilled(page.querySelector('[data-accessories-component]'), function () {
    reveal('.epp-accessories .ce-accessories-head > *', { stagger: 0.1 });
    reveal('.epp-accessories .ce-accessory-card', { stagger: 0.08, y: 26 });
    ScrollTrigger.refresh();
  });

  whenFilled(page.querySelector('[data-product-compare]'), function () {
    reveal('.epp-compare-head > *', { stagger: 0.1 });
    // Randurile primesc doar opacitate: un transform pe <tr> ar deveni
    // containing block pentru `th:first-child`, care e position:sticky sub
    // 700px, si coloana lipita s-ar rupe la derularea orizontala.
    fade('.epp-compare-section tbody tr', { stagger: 0.05, start: 'top 92%' });
    ScrollTrigger.refresh();
  });

  // ---- Restul paginii ----
  reveal('.epp-path-nav', { y: 12, duration: 0.6 });
  reveal('.epp-choice-return > *', { stagger: 0.1 });
  reveal('.epp-collection-nav-head > *', { stagger: 0.1 });
  reveal('.epp-collection-nav-card', { stagger: 0.08, y: 26 });

  heroSafetyNet(heroIntro());
  storySection();
  viewerSection();
  measureSection();

  // Imaginile care se incarca tarziu muta sectiunile de sub ele; fara un
  // refresh, trigger-ele raman calibrate pe layout-ul de dinainte.
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
