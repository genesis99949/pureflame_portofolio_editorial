(() => {
  const toggle = document.querySelector('.rail-toggle');
  const menu = document.querySelector('#rail-menu');
  if (!toggle || !menu) return;
  const gs = window.gsap;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1025px)');
  const track = toggle.querySelector('.rail-track');
  const links = [...menu.querySelectorAll('nav a')];
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  links.forEach(link => { link.removeAttribute('aria-current'); if (link.getAttribute('href') === currentPage) link.setAttribute('aria-current', 'page'); });
  const scenes = [...menu.querySelectorAll('.rail-scene')];
  let flow, opening, closing, currentScene = 0, previousOverflow = '', restored = true;
  const animated = () => gs && !reduce.matches;
  const modalToggle = toggle.cloneNode(true);
  modalToggle.classList.add('rail-modal-toggle');
  modalToggle.setAttribute('aria-label','Închide meniul / Close menu');
  modalToggle.setAttribute('aria-expanded','true');
  menu.prepend(modalToggle);
  modalToggle.addEventListener('click',()=>close());
  function startFlow() {}
  [toggle,modalToggle].forEach(button=>{
    button.addEventListener('pointerenter',()=>{if(animated())gs.to(button.querySelector('.rail-single-label'),{y:-5,duration:.5,ease:'power3.out',overwrite:true});});
    button.addEventListener('pointerleave',()=>{if(gs)gs.to(button.querySelector('.rail-single-label'),{y:0,duration:reduce.matches?0:.6,ease:'power3.out',overwrite:true});});
  });
  const restore = () => {
    if (restored) return;
    restored = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousOverflow;
    flow?.resume();
  };
  function finishClose() {
    menu.close();
    restore();
    if (gs) {
      gs.set(menu, { clearProps: 'transform,opacity' });
      gs.set(menu.querySelectorAll('nav a,.menu-discovery,.rail-footer,.rail-visual-copy,.rail-visual'), { clearProps: 'transform,opacity,clipPath' });
    }
  }
  function close(immediate = false) {
    if (!menu.open) return;
    opening?.kill(); closing?.kill();
    if (immediate || !animated()) return finishClose();
    closing = gs.timeline({ onComplete: finishClose })
      .to(menu, { xPercent: -5, opacity: 0, duration: .38, ease: 'power2.inOut' })
      .to(menu, { '--rail-backdrop': 0, duration: .3 }, 0);
  }
  toggle.addEventListener('click', () => {
    if (menu.open) return;
    previousOverflow = document.body.style.overflow;
    restored = false;
    menu.showModal();
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    flow?.pause();
    if (!animated()) return;
    closing?.kill(); opening?.kill();
    opening = gs.timeline()
      .fromTo(menu, { xPercent: -8, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .75, ease: 'power3.out' })
      .to(menu, { '--rail-backdrop': .5, duration: .5 }, 0)
      .fromTo(menu.querySelector('.rail-visual'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.05, ease: 'power3.inOut' }, .08)
      .fromTo(links, { y: 38, opacity: 0 }, { y: 0, opacity: 1, duration: .75, stagger: .07, ease: 'power3.out' }, .18)
      .fromTo(menu.querySelectorAll('.menu-discovery,.rail-footer,.rail-visual-copy'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .8, stagger: .06, ease: 'power2.out' }, .4);
  });
  function preview(index) {
    if (currentScene === index) return;
    currentScene = index;
    menu.querySelector('.rail-visual').classList.toggle('is-collection', index === 1);
    scenes.forEach((scene, i) => {
      scene.classList.toggle('is-current', i === index);
      if (animated()) gs.to(scene, { opacity: i === index ? 1 : 0, scale: i === 1 || i === index ? 1 : 1.05, duration: 1, ease: 'power2.out', overwrite: true });
      else if (gs) gs.set(scene, { opacity: i === index ? 1 : 0, scale: 1 });
    });
  }
  links.forEach((link, i) => {
    link.addEventListener('pointerenter', () => preview(i));
    link.addEventListener('focus', () => preview(i));
  });
  menu.addEventListener('pf-close-now', () => close(true));
  menu.addEventListener('cancel', event => { event.preventDefault(); close(); });
  menu.addEventListener('close', restore);
  menu.querySelector('.rail-close').addEventListener('click', () => close());
  menu.addEventListener('click', event => {
    // Restore before the delegated contact handler acquires its scroll lock.
    if (event.target.closest('a')) close(true);
    if (event.target === menu) {
      const r = menu.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
    }
  });
  desktop.addEventListener('change', () => { close(true); startFlow(); });
  reduce.addEventListener('change', () => { close(true); startFlow(); });
})();
