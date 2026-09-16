/* Native anchors keep section links, browser history and keyboard focus aligned. */
(() => {
  if (!document.querySelector('.epp-path-nav')) return;
  const focusTarget = hash => {
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    if (target.tagName === 'DETAILS') target.open = true;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({preventScroll:true});
  };
  document.querySelectorAll('.epp-main a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const hash = link.getAttribute('href');
      if (hash.length > 1) focusTarget(hash);
    });
  });
  const chapters = Array.from(document.querySelectorAll('.epp-path-nav a')).map(link => ({
    link, target: document.getElementById(link.hash.slice(1))
  })).filter(chapter => chapter.target);
  let framePending = false;
  const updateChapter = () => {
    framePending = false;
    const readingLine = window.innerHeight * 0.35;
    let active = null;
    chapters.forEach(chapter => {
      const bounds = chapter.target.getBoundingClientRect();
      if (bounds.top <= readingLine && bounds.bottom > readingLine) active = chapter;
    });
    chapters.forEach(chapter => {
      if (chapter === active) chapter.link.setAttribute('aria-current', 'location');
      else chapter.link.removeAttribute('aria-current');
    });
  };
  const scheduleChapter = () => {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(updateChapter);
  };
  window.addEventListener('scroll', scheduleChapter, {passive:true});
  window.addEventListener('resize', scheduleChapter);
  updateChapter();
})();
