/* One short brand entrance per tab session; commerce pages always open directly. */
(() => {
 const root = document.documentElement;
 const key = 'pf-signature-intro-seen-v5';
 const commerce = /^(cos-cumparaturi|finalizare-comanda|confirmare)\.html$/i;
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const page = location.pathname.split('/').pop();
 if (commerce.test(page) || reduced.matches) return;
 try {
   if (sessionStorage.getItem(key)) return;
 } catch (_) {
   // If storage is blocked, open the site directly instead of repeating an intro.
   return;
 }
 root.classList.add('pf-intro-active');
 const markSeen = () => { try { sessionStorage.setItem(key, '1'); } catch (_) {} };
 let panel, video, finished = false, previousFocus;
 const inertState = new Map();
 let exitTimer;
 const release = () => {
   root.classList.remove('pf-intro-active');
   inertState.forEach((wasInert, element) => { element.inert = wasInert; });
   inertState.clear();
   const restoreFocus = panel?.contains(document.activeElement);
   panel?.remove();
   if (restoreFocus && previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus({preventScroll:true});
   document.dispatchEvent(new Event('pf-intro-complete'));
 };
 const finish = immediate => {
   if (finished) return;
   finished = true;
   clearTimeout(deadline);
   video?.pause();
   if (!panel || immediate || reduced.matches) return release();
   panel.addEventListener('transitionend', event => {
     if (event.target === panel && event.propertyName === 'transform') { clearTimeout(exitTimer); release(); }
   }, {once:true});
   panel.classList.add('is-leaving');
   exitTimer = setTimeout(release, 800);
 };
 // This runs even if the media or other page scripts fail to initialize.
 const deadline = setTimeout(() => finish(true), 4200);
 const init = () => {
   panel = document.querySelector('.pf-intro');
   if (finished) { panel?.remove(); return; }
   if (!panel) return finish(true);
   document.body.prepend(panel);
   video = panel.querySelector('video');
   previousFocus = document.activeElement;
   Array.from(document.body.children).forEach(element => {
     if (element === panel || element.tagName === 'SCRIPT') return;
     inertState.set(element, element.inert);
     element.inert = true;
   });
   panel.addEventListener('keydown', event => {
     if (event.key === 'Escape') { event.preventDefault(); markSeen(); finish(false); }
     if (event.key === 'Tab') { event.preventDefault(); panel.focus({preventScroll:true}); }
   });
   panel.focus({preventScroll:true});
   video.muted = true;
   video.addEventListener('loadeddata', () => {
     // Local file videos taint canvas: pixel readback is forbidden even for valid alpha.
     if (location.protocol === 'file:') return;
     // Some decoders play VP9 but discard alpha; never display an opaque rectangle.
     try {
       const probe = document.createElement('canvas');
       probe.width = probe.height = 1;
       const context = probe.getContext('2d', {willReadFrequently:true});
       context.drawImage(video, 0, 0, 1, 1, 0, 0, 1, 1);
       if (context.getImageData(0, 0, 1, 1).data[3] !== 0) finish(true);
     } catch (_) { finish(true); }
   }, {once:true});
   video.addEventListener('playing', () => { if (!finished) { panel.classList.add('is-playing'); markSeen(); } }, {once:true});
   video.addEventListener('ended', () => finish(false), {once:true});
   video.addEventListener('error', () => finish(true), {once:true});
   video.src = video.dataset.introSrc;
   video.play().catch(() => finish(true));
 };
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
 else init();
 reduced.addEventListener('change', event => { if (event.matches) finish(true); });
 window.addEventListener('pageshow', event => {
   if (event.persisted) { clearTimeout(exitTimer); finish(true); release(); }
 });
})();