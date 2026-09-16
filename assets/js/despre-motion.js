// ---- Despre noi: intrarea in scena + paralaxa pe hero (GSAP) ----
// Reveal-urile [data-reveal] din pagina sunt tratate de scroll-fx.js, exact ca
// pe prima pagina. Aici raman doar lucrurile pe care batch-ul acela nu le
// poate acoperi: hero-ul (e deja in cadru la incarcare, deci n-are ce astepta
// de la scroll), navigarea pe capitole si banda de final.
//
// Nu atingem <img>-urile din .despre-material-image si .despre-team-portrait:
// acolo exista deja un `transform: scale()` la :hover, iar un transform inline
// scris de GSAP ar castiga in fata regulii CSS si ar anula efectul definitiv.
(function () {
  var page = document.querySelector('.despre-page');
  if (!page) return;

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ready = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  if (!ready || reduce) { root.classList.add('pf-motion-off'); return; }
  gsap.registerPlugin(ScrollTrigger);

  var EASE = 'power2.out';

  // ---- Hero ----
  var heroImg = page.querySelector('.despre-hero-image');
  var hero = page.querySelector('.despre-hero');

  var tl = gsap.timeline({ defaults: { ease: EASE } });

  if (heroImg) {
    // Fotografia se aseaza dintr-un cadru mai apropiat, lent. `.despre-hero`
    // are overflow:hidden, deci marirea nu iese din sectiune.
    tl.fromTo(heroImg, { scale: 1.09 }, { scale: 1, duration: 2.2, ease: 'power2.out' }, 0);
  }

  tl.to('.despre-hero-copy > *', { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, 0.25)
    .to('.despre-chapters > a', { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, 0.75);

  // Paralaxa legata de scroll: imaginea ramane putin in urma textului cat timp
  // hero-ul iese din cadru. Tween separat de cel de mai sus — GSAP compune
  // scale-ul si translatia pe acelasi element fara sa se calce.
  if (heroImg && hero) {
    gsap.to(heroImg, {
      yPercent: 9,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 }
    });
  }

  // Aceeasi plasa de siguranta ca pe paginile de produs: daca ticker-ul GSAP
  // nu porneste, hero-ul ar ramane ascuns definitiv, pentru ca starea lui
  // initiala vine din CSS si doar timeline-ul o anuleaza.
  setTimeout(function () {
    var probe = page.querySelector('.despre-hero-copy > *');
    if (!probe || getComputedStyle(probe).opacity !== '0') return;
    // Si aici GSAP a apucat sa scrie opacitatea inline, care bate CSS-ul.
    tl.kill();
    gsap.set('.despre-hero-copy > *, .despre-chapters > a', { clearProps: 'opacity,transform' });
    root.classList.add('pf-motion-off');
  }, 2500);

  // ---- Banda de final ----
  // E in afara lui <main>, deci nu are [data-reveal] ca restul sectiunilor.
  var cta = document.querySelector('.despre-cta');
  if (cta) {
    var ctaKids = gsap.utils.toArray(cta.children);
    if (ctaKids.length) {
      gsap.set(ctaKids, { opacity: 0, y: 24 });
      ScrollTrigger.batch(ctaKids, {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, {
            opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.12,
            overwrite: true, clearProps: 'transform'
          });
        }
      });
    }
  }

  // Imaginile lazy de mai jos schimba inaltimea paginii dupa ce se incarca;
  // fara refresh, trigger-ele raman calibrate pe layout-ul de dinainte.
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
