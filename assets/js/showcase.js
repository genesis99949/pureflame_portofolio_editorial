// ---- Sectiunea de colectie de pe prima pagina: panouri in acordeon ----
(function () {
  const showcase = document.querySelector('.showcase');
  if (!showcase) return;

  const panels = Array.from(showcase.querySelectorAll('.showcase-panel'));
  if (!panels.length) return;

  // Unul ramane mereu deschis: apasarea pe panoul activ nu il inchide, ca sa nu
  // ajunga sectiunea in starea in care toate cinci sunt sterse si inguste.
  function open(panel) {
    panels.forEach((p) => {
      const on = p === panel;
      p.classList.toggle('is-active', on);
      p.querySelector('.showcase-toggle').setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  }

  panels.forEach((panel) => {
    panel.querySelector('.showcase-toggle').addEventListener('click', () => open(panel));
  });

  open(panels.find((p) => p.classList.contains('is-active')) || panels[0]);
})();
