/* The original AE flame plays only while visible; reduced motion keeps the still. */
(() => {
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const mobile = matchMedia('(max-width: 1024px)');
 const marks = [...document.querySelectorAll('[data-flame-motion]')];
 const visible = new WeakSet();
 const load = mark => {
   const video = mark.querySelector('video');
   if (!video.src) { video.muted = true; video.src = video.dataset.flameSrc; video.load(); }
   return video;
 };
 const stop = mark => { mark.querySelector('video').pause(); mark.classList.remove('is-playing'); };
 const play = mark => {
   if (reduced.matches || (mark.hasAttribute('data-flame-hover') && mobile.matches)) return;
   const video = load(mark);
   video.loop = !mark.hasAttribute('data-flame-hover');
   video.play().then(() => mark.classList.add('is-playing')).catch(() => stop(mark));
 };
 marks.forEach(mark => {
   const video = mark.querySelector('video');
   video.addEventListener('error', () => stop(mark));
   if (!mark.hasAttribute('data-flame-hover')) return;
   const trigger = mark.closest('.rail-toggle, .brand-link') || mark;
   const start = () => { if (reduced.matches || mobile.matches) return; load(mark).currentTime = 0; play(mark); };
   trigger.addEventListener('pointerenter', start);
   trigger.addEventListener('pointerleave', () => stop(mark));
   trigger.addEventListener('focus', start);
   trigger.addEventListener('blur', () => stop(mark));
   video.addEventListener('timeupdate', () => { if (video.currentTime >= 2) stop(mark); });
 });
 const observer = new IntersectionObserver(entries => entries.forEach(entry => {
   const mark = entry.target;
   if (entry.isIntersecting) { visible.add(mark); if (!mark.hasAttribute('data-flame-hover')) play(mark); }
   else { visible.delete(mark); stop(mark); }
 }), {threshold: .15});
 marks.forEach(mark => observer.observe(mark));
 const sync = () => marks.forEach(mark => {
   if (reduced.matches || document.hidden || (mobile.matches && mark.hasAttribute('data-flame-hover'))) stop(mark);
   else if (visible.has(mark) && !mark.hasAttribute('data-flame-hover')) play(mark);
 });
 reduced.addEventListener('change', sync);
 mobile.addEventListener('change', sync);
 document.addEventListener('visibilitychange', sync);
})();