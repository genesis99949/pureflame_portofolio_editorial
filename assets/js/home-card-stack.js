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

  var stackTrigger = window.ScrollTrigger.create({
    id: 'home-card-stack',
    trigger: hero,
    start: 'top top',
    end: function () { return '+=' + hero.offsetHeight; },
    pin: hero,
    pinSpacing: false,
    anticipatePin: 1,
    invalidateOnRefresh: true
  });

  window.addEventListener('pageshow', function () {
    stackTrigger.refresh();
  });
})();
