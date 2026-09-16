// ---- Smooth scroll (GSAP ScrollSmoother) + fade-in la scroll, site-wide ----
// Se degradeaza controlat: daca GSAP/pluginele nu s-au incarcat (CDN blocat)
// sau utilizatorul are prefers-reduced-motion, scroll-ul ramane cel nativ si
// elementele [data-reveal] raman vizibile (vezi regula .js-reveal din site.css).
//
// window.PFScroll e expus pentru alte scripturi (home-header.js, site.js) care
// citesc pozitia de scroll — odata ce ScrollSmoother e activ, transforma
// continutul, deci window.scrollY nu mai e de incredere.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pluginsReady = typeof window.gsap !== 'undefined' &&
    typeof window.ScrollTrigger !== 'undefined' &&
    typeof window.ScrollSmoother !== 'undefined';
  var smoother = null;

  window.PFScroll = {
    get: function () { return smoother ? smoother.scrollTop() : window.scrollY; },
    to: function (target, smooth) {
      if (smoother) { smoother.scrollTo(target, smooth !== false); return; }
      var el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!pluginsReady) return;
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  if (reduceMotion) {
    gsap.set('[data-reveal]', { opacity: 1, y: 0 });
    return;
  }

  function wrapForSmoother() {
    if (document.getElementById('smooth-wrapper')) return true;
    var body = document.body;
    var toMove = [];
    Array.prototype.forEach.call(body.children, function (el) {
      if (el.tagName === 'SCRIPT' || el.tagName === 'HEADER' || el.classList.contains('order-modal-overlay') || el.classList.contains('pf-intro') || el.classList.contains('pf-page-transition')) return;
      toMove.push(el);
    });
    if (!toMove.length) return false;
    var wrapper = document.createElement('div');
    wrapper.id = 'smooth-wrapper';
    var content = document.createElement('div');
    content.id = 'smooth-content';
    wrapper.appendChild(content);
    body.insertBefore(wrapper, toMove[0]);
    toMove.forEach(function (el) { content.appendChild(el); });
    return true;
  }

  // position:sticky se strica in interiorul continutului transformat de GSAP
  // (transform-ul creaza un nou containing block) — sarim peste smooth-scroll
  // pe paginile care depind de un sidebar sticky (coșul / finalizarea comenzii).
  var hasStickyConflict = !!document.querySelector('.checkout-area-summary, .checkout-side, .product-detail-page');

  if (!hasStickyConflict && wrapForSmoother()) {
    smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.2,
      effects: true,
      normalizeScroll: true
    });

    // Modalele/meniul mobil blocheaza scroll-ul cu body.style.overflow =
    // 'hidden' (contact.js, newsletter.js, site.js) — asta singur nu opreste
    // scroll-ul nativ al #smooth-wrapper, asa ca oglindim blocarea pe smoother.
    var locked = false;
    var syncLock = function () {
      var isLocked = document.body.style.overflow === 'hidden';
      if (isLocked !== locked) { locked = isLocked; smoother.paused(locked); }
    };
    new MutationObserver(syncLock).observe(document.body, { attributes: true, attributeFilter: ['style'] });

    // Link-urile de ancora din pagina (ex. navigarea pe capitole de pe
    // despre-noi) fac scroll nativ pe #smooth-wrapper. Smoother-ul nu afla de
    // el: pozitia lui interna ramane la zero, iar transformarea pe care o
    // aplica se aduna peste scroll-ul nativ — pagina ajunge in doua stari
    // diferite in acelasi timp si tot ce depinde de ScrollTrigger se decaleaza.
    // Le preluam si le trimitem prin smoother, singura sursa de adevar.
    document.addEventListener('click', function (e) {
      // `.js-contact-trigger` foloseste tot href="#contact", dar deschide
      // modalul de contact (contact.js) — nu e o ancora de derulat. Ambele
      // handlere stau pe document, iar al nostru e inregistrat primul, deci
      // `defaultPrevented` inca nu e setat cand ajungem aici: verificarea
      // trebuie facuta pe clasa, nu pe eveniment.
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link || link.closest('.js-contact-trigger') || link.classList.contains('js-contact-trigger')) return;

      var hash = link.getAttribute('href');
      if (!hash || hash.length < 2) return;
      var target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();
      smoother.scrollTo(target, true);
      history.replaceState(null, '', hash);
      // Sectiunile tinta care au tabindex sunt facute anume focusabile, ca
      // saltul sa fie util si de la tastatura; pe restul, focus() n-ar face
      // nimic. preventScroll, ca sa nu se bata cu animatia smoother-ului.
      if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
    });
  }

  var revealEls = gsap.utils.toArray('[data-reveal]');
  if (revealEls.length) {
    ScrollTrigger.batch(revealEls, {
      start: 'top 85%',
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', stagger: 0.12, overwrite: true });
      }
    });

    // Plasa de siguranta: un salt de scroll instant (link de ancora, click pe
    // "Contact" din nav) poate trece peste zona de start a unui trigger fara sa
    // declanseze onEnter, lasand elementul invizibil definitiv. La fiecare
    // oprire de scroll, aratam direct orice [data-reveal] ramas la opacity 0
    // dar deja in cadru.
    ScrollTrigger.addEventListener('scrollEnd', function () {
      var vh = window.innerHeight;
      revealEls.forEach(function (el) {
        if (getComputedStyle(el).opacity !== '0') return;
        if (el.getBoundingClientRect().top < vh) {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', overwrite: true });
        }
      });
    });
  }

  if (smoother && location.hash) {
    // Link-uri catre ancore pe alta pagina (ex. footer -> colectie.html#embera)
    // trebuie repozitionate dupa ce ScrollSmoother a preluat layout-ul. Asteptam
    // 'load' (nu doar un rAF) — pozitia tintei se poate schimba pana se
    // incarca toate imaginile, iar un salt prea devreme aterizeaza gresit.
    window.addEventListener('load', function () {
      var target = document.querySelector(location.hash);
      if (target) smoother.scrollTo(target, false);
    });
  }
})();
