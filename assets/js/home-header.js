// ---- Header desktop premium — 2 stari (top / scrolled) ----
// Doar pentru #header cu clasa .site-header--home (toate paginile,
// >=1025px). Nu atinge headerul de mobil/tableta.
//
// Ruleaza pe orice pagina, dar face ceva doar daca gaseste .hero (doar
// index.html o are) — pe celelalte pagini iese imediat, iar
// data-header-mode="scrolled" scris static in HTML ramane neatins (ele
// nu au un hero de urmarit, deci sunt mereu in starea mai opaca).
//
// Detectarea "header peste hero" vs "header dupa hero" foloseste
// IntersectionObserver pe sectiunea .hero, cu rootMargin egal cu
// inaltimea header-ului — robust indiferent de inaltimea reala a
// hero-ului/viewport-ului (nu un scrollY hardcodat). Un listener de
// scroll separat, foarte ieftin (o comparatie + un rAF), face doar
// diferenta intre "varf" si "a inceput sa deruleze" cat timp e peste hero.
(function () {
  const header = document.getElementById('header');
  if (!header || !header.classList.contains('site-header--home')) return;
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const SCROLLED_AFTER = 48;
  const mq = window.matchMedia('(min-width: 1025px)');

  let observer = null;
  let overHero = true;
  let scrollBound = false;
  let ticking = false;

  function getScrollY() { return window.PFScroll ? window.PFScroll.get() : window.scrollY; }

  function applyMode() {
    const isTop = overHero && getScrollY() <= SCROLLED_AFTER;
    if (isTop) delete header.dataset.headerMode; // stare implicita = "top"
    else header.dataset.headerMode = 'scrolled';
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { applyMode(); ticking = false; });
  }

  function setupObserver() {
    if (observer) observer.disconnect();
    // + o marja mica, ca tranzitia sa se intample chiar cand hero-ul
    // dispare complet sub header, nu cu un cadru intarziat.
    const headerZone = header.offsetHeight + 40;
    observer = new IntersectionObserver(
      (entries) => {
        overHero = entries[0].isIntersecting;
        applyMode();
      },
      { rootMargin: `-${headerZone}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(hero);
  }

  function enable() {
    setupObserver();
    if (!scrollBound) {
      document.addEventListener('scroll', onScroll, { passive: true });
      scrollBound = true;
    }
    applyMode();
  }

  function disable() {
    if (observer) { observer.disconnect(); observer = null; }
    delete header.dataset.headerMode;
  }

  function handleBreakpoint() {
    if (mq.matches) enable(); else disable();
  }

  handleBreakpoint();
  mq.addEventListener('change', handleBreakpoint);

  // Recalculeaza zona observata daca fereastra se redimensioneaza pe
  // desktop (inaltimea header-ului ramane practic constanta, dar
  // pastram asta pentru robustete la orice ajustare vizuala viitoare).
  let resizeTimer;
  window.addEventListener('resize', () => {
    if (!mq.matches) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setupObserver, 150);
  });
})();
