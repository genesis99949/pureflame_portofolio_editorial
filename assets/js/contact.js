// ---- Modal de contact: deschis de linkul "Contact" din header si de butoanele "Vorbeste cu echipa de design" ----
(function(){
  const overlay = document.getElementById('contactModalOverlay');
  if (!overlay) return;

  const closeBtn = document.getElementById('contactModalClose');
  const form = document.getElementById('contactForm');
  const errorEl = document.getElementById('contactFormError');
  const successEl = document.getElementById('contactFormSuccess');
  const submitBtn = document.getElementById('contactSubmitBtn');
  let lastTrigger = null;

  function openModal(){
    errorEl.hidden = true;
    successEl.hidden = true;
    form.hidden = false;
    form.reset();
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => form.querySelector('input[name="fullName"]').focus(), 50);
  }

  function closeModal(){
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.js-contact-trigger');
    if (!trigger) return;
    e.preventDefault();
    lastTrigger = trigger;
    openModal();
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  if (form){
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.hidden = true;

      const data = new FormData(form);
      const payload = {
        fullName: data.get('fullName')?.trim(),
        phone: data.get('phone')?.trim(),
        email: data.get('email')?.trim(),
        message: data.get('message')?.trim(),
        consent: data.get('consent') === 'on',
      };

      submitBtn.disabled = true;
      const originalHtml = submitBtn.innerHTML;
      submitBtn.textContent = '...';

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'A aparut o eroare.');
        form.hidden = true;
        successEl.hidden = false;
      } catch (err) {
        errorEl.textContent = err.message || 'A aparut o eroare. Incearca din nou.';
        errorEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
    });
  }
})();
