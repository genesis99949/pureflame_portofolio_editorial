// Hero + colectie: card-over-card sincronizat cu acelasi ScrollTrigger folosit
// de smooth scroll. Fara pluginuri, efectul revine la sticky nativ.
(function () {
  var hero = document.querySelector('.hero');
  var collection = document.querySelector('.home-editorial-collection');
  if (!hero || !collection) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
    hero.classList.add('is-css-card-stack');
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);

  // Pinul se opreste cel tarziu cand colectia a trecut complet: pe ecranele
  // unde colectia e mai scurta decat hero-ul (tableta, desktop inalt), hero-ul
  // fixat ar iesi altfel sub ea, peste inceputul sectiunii urmatoare.
  var stackTrigger = window.ScrollTrigger.create({
    id: 'home-card-stack',
    trigger: hero,
    start: 'top top',
    end: function () { return '+=' + Math.min(hero.offsetHeight, collection.offsetHeight); },
    pin: hero,
    pinSpacing: false,
    anticipatePin: 1,
    invalidateOnRefresh: true
  });

  window.addEventListener('pageshow', function () {
    stackTrigger.refresh();
  });

  // Schimbarea modelului din colectie ii poate modifica inaltimea.
  if ('ResizeObserver' in window) {
    var collectionHeight = collection.offsetHeight;
    new ResizeObserver(function () {
      if (collection.offsetHeight === collectionHeight) return;
      collectionHeight = collection.offsetHeight;
      stackTrigger.refresh();
    }).observe(collection);
  }
})();
