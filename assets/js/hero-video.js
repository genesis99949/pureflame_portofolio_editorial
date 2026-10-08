// Videoul din hero are doua variante: 1080p pentru desktop si 720p pentru ecrane mici.
// Sursa se alege aici (nu in HTML), ca browserul sa descarce o singura varianta.
(() => {
  const video = document.querySelector('.hero-slide-media video[data-src-desktop]');
  if (!video) return;
  const small = matchMedia('(max-width: 768px)').matches;
  video.src = small ? video.dataset.srcMobile : video.dataset.srcDesktop;
})();
