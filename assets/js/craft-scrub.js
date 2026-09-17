// Craft: patru clipuri reale care ruleaza automat, fara scroll controlat.
(function () {
  var pin = document.getElementById('craftPin');
  if (!pin) return;

  var video = pin.querySelector('.craft-pin-video');
  var steps = Array.prototype.slice.call(pin.querySelectorAll('.craft-pin-step'));
  var panels = Array.prototype.slice.call(pin.querySelectorAll('.craft-pin-panel'));
  var toggle = pin.querySelector('.craft-autoplay-toggle');
  var sources = (pin.dataset.videoSources || '').split(',').map(function (src) { return src.trim(); }).filter(Boolean);
  var posters = panels.map(function (panel) { return panel.dataset.poster || ''; });
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var currentStep = 0;
  var visible = false;
  var userPaused = reducedMotion;
  var animationId = 0;
  var pendingAutoplay = false;
  var preloadLink = null;
  var transitionTimer = 0;

  if (!video || !steps.length || sources.length !== panels.length) return;

  function isRomanian() {
    var ro = toggle && toggle.querySelector('.lang-ro');
    return !ro || !ro.hidden;
  }

  function updateToggle() {
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
    var ro = toggle.querySelector('.lang-ro');
    var en = toggle.querySelector('.lang-en');
    if (ro) ro.textContent = userPaused ? 'Continuă' : 'Pauză';
    if (en) en.textContent = userPaused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', userPaused ? (isRomanian() ? 'Continuă animația' : 'Play animation') : (isRomanian() ? 'Pune animația pe pauză' : 'Pause animation'));
  }

  function updateProgress() {
    var progress = video.duration ? Math.min(100, (video.currentTime / video.duration) * 100) : 0;
    steps[currentStep].style.setProperty('--craft-progress', progress.toFixed(2) + '%');
  }

  function stopProgress() {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = 0;
  }

  function trackProgress() {
    updateProgress();
    if (!video.paused && !video.ended) animationId = requestAnimationFrame(trackProgress);
    else animationId = 0;
  }

  function playVideo() {
    if (!visible || userPaused || document.hidden) return;
    var result = video.play();
    if (result && typeof result.catch === 'function') result.catch(function () {});
  }

  // Pregateste (prefetch, prioritate joasa) doar clipul urmator — nu toate
  // patru de la inceput. Un singur <link> reutilizat, href-ul se muta odata
  // cu pasul curent.
  function preloadNext() {
    var nextSrc = sources[(currentStep + 1) % sources.length];
    if (!preloadLink) {
      preloadLink = document.createElement('link');
      preloadLink.rel = 'prefetch';
      preloadLink.as = 'video';
      document.head.appendChild(preloadLink);
    }
    if (preloadLink.getAttribute('href') !== nextSrc) preloadLink.href = nextSrc;
  }

  function setStep(nextStep, shouldPlay) {
    currentStep = (nextStep + panels.length) % panels.length;
    steps.forEach(function (step, index) {
      var active = index === currentStep;
      step.classList.toggle('is-active', active);
      step.toggleAttribute('aria-current', active);
      step.style.setProperty('--craft-progress', '0%');
    });
    panels.forEach(function (panel, index) {
      var active = index === currentStep;
      panel.classList.toggle('is-active', active);
      panel.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    stopProgress();
    video.pause();
    // Fade lin catre fundalul deja intunecat cat timp se incarca noul clip —
    // fara flash, fara taietura brusca. Reapare la 'loadeddata'.
    clearTimeout(transitionTimer);
    pin.classList.add('is-changing');
    video.classList.add('is-switching');
    pendingAutoplay = shouldPlay;
    video.poster = posters[currentStep];
    video.src = sources[currentStep];
    video.load();
    preloadNext();
  }

  video.addEventListener('loadeddata', function () {
    var reveal = function () {
      video.classList.remove('is-switching');
      transitionTimer = setTimeout(function () { pin.classList.remove('is-changing'); }, reducedMotion ? 0 : 760);
    };
    if (reducedMotion) reveal();
    else requestAnimationFrame(function () { requestAnimationFrame(reveal); });
    if (pendingAutoplay) { pendingAutoplay = false; playVideo(); }
  });
  video.addEventListener('play', function () {
    stopProgress();
    animationId = requestAnimationFrame(trackProgress);
  });
  video.addEventListener('pause', function () {
    stopProgress();
    updateProgress();
  });
  video.addEventListener('ended', function () {
    stopProgress();
    setStep(currentStep + 1, true);
  });
  video.addEventListener('loadedmetadata', updateProgress);

  steps.forEach(function (step, index) {
    step.addEventListener('click', function () {
      setStep(index, true);
    });
  });

  if (toggle) {
    toggle.addEventListener('click', function () {
      userPaused = !userPaused;
      updateToggle();
      if (userPaused) video.pause(); else playVideo();
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) video.pause(); else playVideo();
  });

  var observer = new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) playVideo(); else video.pause();
  }, { threshold: .25 });

  pin.classList.add('is-auto');
  setStep(0, false);
  updateToggle();
  observer.observe(pin);
})();
