// ---- Video ambiental "despre noi" ----
// Respecta preferinta de miscare redusa: posterul WebP ramane vizibil,
// dar bucla nu porneste. In rest, reluam discret video-ul daca preferinta
// se schimba in timp ce pagina este deschisa.
(function () {
  const video = document.getElementById('desprePartyVideo');
  if (!video) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function syncMotionPreference() {
    if (motion.matches) {
      video.pause();
      return;
    }
    const play = video.play();
    if (play) play.catch(() => {});
  }

  syncMotionPreference();
  motion.addEventListener?.('change', syncMotionPreference);
})();
