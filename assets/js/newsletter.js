// ---- Popup de abonare la newsletter ----
// Reguli de afisare (deliberate, nu accidentale):
//  - desktop: exit-intent (cursorul iese prin partea de sus a ferestrei)
//  - mobil: dupa 30s SAU la 50% scroll (exit-intent nu exista pe touch)
//  - o singura data; respingerea se tine minte 30 de zile, inscrierea pentru totdeauna
//  - niciodata peste alt modal deschis (comanda / contact) — nu intrerupem o cumparare
(function(){
  const overlay = document.getElementById('newsletterOverlay');
  if (!overlay) return;

  const STORAGE_KEY = 'pf-newsletter';
  const DISMISS_DAYS = 30;
  const MOBILE_DELAY_MS = 30000;
  const SCROLL_TRIGGER = 0.5;

  const closeBtn = document.getElementById('newsletterClose');
  const form = document.getElementById('newsletterForm');
  const errorEl = document.getElementById('newsletterError');
  const successEl = document.getElementById('newsletterSuccess');
  const submitBtn = document.getElementById('newsletterSubmitBtn');
  const consentLabel = document.getElementById('newsletterConsentText');

  let shown = false;
  let lastFocused = null;

  function readState(){
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) { return {}; }
  }

  function writeState(state){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function shouldSkip(){
    const state = readState();
    if (state.subscribed) return true;
    if (state.dismissedAt && Date.now() - state.dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return true;
    return false;
  }

  function otherModalOpen(){
    return ['orderModalOverlay', 'contactModalOverlay']
      .map(id => document.getElementById(id))
      .some(el => el && !el.hidden);
  }

  // ---- Accesibilitate: focus trap + Escape + revenirea focusului ----
  function focusables(){
    return Array.from(overlay.querySelectorAll('button, input, a[href]'))
      .filter(el => !el.disabled && el.offsetParent !== null);
  }

  function onKeydown(e){
    if (overlay.hidden) return;
    if (e.key === 'Escape') { dismiss(); return; }
    if (e.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open(){
    if (shown || shouldSkip() || otherModalOpen()) return;
    shown = true;
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => form.querySelector('input[name="email"]').focus(), 50);
  }

  function close(){
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  // Inchidere fara inscriere = respingere; o tinem minte ca sa nu revenim curand.
  function dismiss(){
    const state = readState();
    if (!state.subscribed) writeState({ ...state, dismissedAt: Date.now() });
    close();
  }

  closeBtn.addEventListener('click', dismiss);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); });
  document.addEventListener('keydown', onKeydown);

  // ---- Declansatoare ----
  // Detectam POZITIV prezenta unui mouse. Nu deducem "touch" din latimea ecranului:
  // exit-intent are sens doar acolo unde exista un cursor care poate parasi fereastra.
  const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!hasMouse) {
    setTimeout(open, MOBILE_DELAY_MS);
    const onScroll = () => {
      const progress = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
      if (progress >= SCROLL_TRIGGER) {
        open();
        document.removeEventListener('scroll', onScroll);
      }
    };
    document.addEventListener('scroll', onScroll, { passive: true });
  } else {
    document.addEventListener('mouseout', (e) => {
      // exit-intent: cursorul paraseste fereastra prin partea de sus
      if (!e.relatedTarget && e.clientY <= 0) open();
    });
  }

  // Portfolio interaction: validate locally and never submit or retain personal input.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    errorEl.hidden = true;
    if (!form.reportValidity()) return;
    form.reset();
    writeState({ subscribed: true });
    form.hidden = true;
    successEl.hidden = false;
  });
})();
