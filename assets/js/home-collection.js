(function () {
  'use strict';
  const section = document.querySelector('.home-editorial-collection');
  if (!section) return;
  const buttons = Array.from(section.querySelectorAll('[data-hec-select]'));
  const panels = Array.from(section.querySelectorAll('.hec-feature'));
  const status = section.querySelector('.hec-status');
  if (!buttons.length || panels.length !== buttons.length) return;
  section.querySelector('.hec-switcher').hidden = false;
  function select(button) {
    if (button.getAttribute('aria-pressed') === 'true') return;
    const id = button.getAttribute('aria-controls');
    panels.forEach(panel => { panel.hidden = panel.id !== id; });
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    status.textContent = section.querySelector('#' + id + ' h3').textContent;
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      buttons[next].focus();
      select(buttons[next]);
    });
  });
})();
