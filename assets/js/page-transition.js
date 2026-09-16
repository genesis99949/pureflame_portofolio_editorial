/* A short curtain bridges ordinary document navigation; history and links stay native. */
(() => {
 const root = document.documentElement;
 const key = 'pf-page-curtain-v1';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const commerce = /\/(cos-cumparaturi|finalizare-comanda|confirmare)\.html$/i;
 let arriving = false, storageAvailable = false;
 try {
   const saved = sessionStorage.getItem(key);
   sessionStorage.removeItem(key);
   storageAvailable = true;
   if (saved) {
     const state = JSON.parse(saved);
     arriving = state.href === location.href && Date.now() - state.time < 15000 && !commerce.test(location.pathname) && !reduced.matches;
   }
 } catch (_) { storageAvailable = false; }
 if (arriving) root.classList.add('pf-page-enter', 'pf-page-boot');
 let layer, animation, pending = false, leaveTimer;
 const reset = () => {
   animation?.cancel();
   root.classList.remove('pf-page-enter', 'pf-page-boot');
   layer?.classList.remove('is-exiting');
   pending = false;
   clearTimeout(leaveTimer);
 };
 const bootDeadline = setTimeout(reset, 2200);
 const init = () => {
   layer = document.querySelector('.pf-page-transition');
   if (!layer) return reset();
   document.body.prepend(layer);
   if (!arriving || !root.classList.contains('pf-page-enter') || reduced.matches) return reset();
   root.classList.remove('pf-page-boot');
   clearTimeout(bootDeadline);
   animation = layer.animate([{transform:'translateY(0)'},{transform:'translateY(-101%)'}], {duration:650,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'});
   animation.finished.then(reset).catch(() => {});
 };
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
 else init();
 document.addEventListener('click', event => {
   if (!layer || reduced.matches || !storageAvailable || commerce.test(location.pathname) || root.classList.contains('pf-intro-active')) return;
   if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
   const link = event.target.closest('a[href]');
   if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self') || link.closest('[data-no-transition]')) return;
   const url = new URL(link.href, location.href);
   const httpPage = /^https?:$/.test(url.protocol) && url.origin === location.origin;
   const siblingFile = location.protocol === 'file:' && url.protocol === 'file:' &&
     url.pathname.slice(0, url.pathname.lastIndexOf('/')) === location.pathname.slice(0, location.pathname.lastIndexOf('/'));
   if ((!httpPage && !siblingFile) || commerce.test(url.pathname)) return;
   if (!/\.html$/i.test(url.pathname) && !url.pathname.endsWith('/')) return;
   if (url.pathname === location.pathname && url.search === location.search) return;
   if (pending) { event.preventDefault(); return; }
   try { sessionStorage.setItem(key, JSON.stringify({href:url.href,time:Date.now()})); }
   catch (_) { return; }
   event.preventDefault();
   animation?.cancel();
   root.classList.remove('pf-page-enter', 'pf-page-boot');
   layer.classList.add('is-exiting');
   pending = true;
   let dispatched = false;
   const navigate = () => {
     if (dispatched) return;
     dispatched = true;
     location.assign(url.href);
     // A stalled request must not leave the current page covered indefinitely.
     leaveTimer = setTimeout(() => { reset(); try { sessionStorage.removeItem(key); } catch (_) {} }, 4000);
   };
   animation = layer.animate([{transform:'translateY(101%)'},{transform:'translateY(0)'}], {duration:400,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'});
   animation.finished.then(navigate).catch(() => {});
   setTimeout(() => { if (pending) navigate(); }, 480);
 });
 window.addEventListener('pagehide', () => { clearTimeout(bootDeadline); reset(); });
 window.addEventListener('pageshow', event => { if (event.persisted) reset(); });
 reduced.addEventListener('change', event => { if (event.matches && !pending) reset(); });
})();