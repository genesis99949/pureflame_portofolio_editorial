(function () {
  const mount = document.querySelector('[data-product-reviews]');
  const buyPanel = document.querySelector('.epp-buy-panel');
  if (!mount || !buyPanel) return;

  const productId = buyPanel.dataset.productId;
  const productName = buyPanel.querySelector('.epp-title')?.textContent.trim() || productId;
  // Continut demonstrativ: site-ul este un portofoliu, iar sectiunea trebuie
  // sa se vada populata. Primele trei recenzii apar direct, restul intra sub
  // butonul "Vezi toate recenziile".
  const seedReviews = {
    aether: [
      { display_name: 'Andrei M.', rating: 5, message_ro: 'Eleganta, moderna si creeaza instant o atmosfera premium, relaxanta. Flacara stabila, incalzire potrivita pentru serile racoroase, materiale de calitate cu finisaje impecabile.', message_en: "Elegant, modern, and it instantly creates a premium, relaxing atmosphere. Steady flame, just the right warmth for cool evenings, quality materials with impeccable finishes." },
      { display_name: 'Ioana P.', rating: 5, message_ro: 'Forma rotunda a fost exact ce cautam pentru o terasa mica. Nu are colturi de ocolit si toata lumea sta in jurul ei fara sa se inghesuie.', message_en: "The round shape was exactly what I wanted for a small terrace. There are no corners to walk around and everyone sits about it without crowding." },
      { display_name: 'Radu C.', rating: 5, message_ro: 'Livrata in cinci zile, ambalata foarte bine. Nu necesita montaj, doar am pus pietrele si am racordat butelia. In 20 de minute ardea.', message_en: "Delivered in five days, packed very well. No assembly needed, I just added the stones and connected the cylinder. It was burning within 20 minutes." },
      { display_name: 'Mihaela D.', rating: 4, message_ro: 'Arata superb si paravanul de sticla chiar tine flacara linistita pe vant. Singurul minus e ca la 24 kg nu o muti singur prea usor.', message_en: "It looks superb and the glass guard really does keep the flame calm in wind. The only downside is that at 24 kg you do not move it on your own very easily." },
      { display_name: 'Sorin V.', rating: 5, message_ro: 'Finisajul de beton se simte solid, nu ca o imitatie. Dupa o iarna sub husa arata la fel ca in prima zi.', message_en: "The concrete finish feels solid, not like an imitation. After a winter under the cover it looks the same as on day one." },
      { display_name: 'Cristina B.', rating: 5, message_ro: 'Am luat-o pentru balcon si a devenit locul unde stam in fiecare seara. Reglajul flacarii e fin, se coboara mult fara sa se stinga.', message_en: "I bought it for the balcony and it has become where we sit every evening. The flame control is fine-grained; it goes very low without going out." }
    ],
    embera: [
      { display_name: 'Alexandru T.', rating: 5, message_ro: 'Blatul generos a fost motivul principal. Incape focul, pahare, o tava cu aperitive si tot ramane loc. Exact ce voiam pentru serile cu prieteni.', message_en: "The generous top was the main reason. It fits the fire, glasses, a tray of snacks, and there is still room. Exactly what I wanted for evenings with friends." },
      { display_name: 'Diana R.', rating: 5, message_ro: 'Vatra este pozitionata intr-o parte, asa ca partea cealalta ramane masa adevarata. Detaliul asta face toata diferenta la folosire.', message_en: "The hearth sits to one side, so the other half stays a real table. That detail makes all the difference in use." },
      { display_name: 'George N.', rating: 5, message_ro: 'Finisajul grafit e mat si nu se vede praful pe el. Se sterge cu o laveta umeda si gata.', message_en: "The graphite finish is matte and dust does not show on it. A damp cloth and it is done." },
      { display_name: 'Elena S.', rating: 4, message_ro: 'Foarte frumoasa si stabila, dar 54 kg inseamna ca alegi locul o singura data. Manerele laterale ajuta la doi oameni.', message_en: "Very handsome and stable, but 54 kg means you choose the spot once. The side handles help with two people." },
      { display_name: 'Bogdan I.', rating: 5, message_ro: 'Compartimentul pentru butelie e gandit bine, nu se vede nimic din exterior. Arata ca o masa de lounge obisnuita pana o aprinzi.', message_en: "The cylinder compartment is well thought out, nothing shows from outside. It looks like an ordinary lounge table until you light it." },
      { display_name: 'Andreea L.', rating: 5, message_ro: 'Capacul metalic se aseaza peste sticla si iarna o lasam afara linistiti. Zero probleme dupa doua sezoane.', message_en: "The metal cover sits over the glass and we leave it outside through winter without worrying. No problems after two seasons." }
    ],
    flavo: [
      { display_name: 'Vlad A.', rating: 5, message_ro: 'Forma patrata se aseaza perfect intre doua canapele. Proportia e echilibrata, nu domina spatiul.', message_en: "The square shape sits perfectly between two sofas. The proportion is balanced; it does not dominate the space." },
      { display_name: 'Raluca M.', rating: 5, message_ro: 'Flacara centrala se vede egal din toate partile. Am pus-o pe terasa si e primul lucru pe care il remarca oaspetii.', message_en: "The central flame reads the same from every side. We put it on the terrace and it is the first thing guests notice." },
      { display_name: 'Tudor P.', rating: 4, message_ro: 'Calitate buna si aprindere din prima de fiecare data. As fi vrut ca pietrele incluse sa fie ceva mai multe, dar se completeaza usor.', message_en: "Good quality and it lights first time, every time. I would have liked a few more stones included, but they are easy to top up." },
      { display_name: 'Simona G.', rating: 5, message_ro: 'La 33 kg inca o pot muta cu sotul meu cand rearanjam terasa. E cel mai bun compromis din colectie intre marime si greutate.', message_en: "At 33 kg my husband and I can still move it when we rearrange the terrace. It is the best size-to-weight compromise in the collection." },
      { display_name: 'Marius E.', rating: 5, message_ro: 'Butonul piezo functioneaza impecabil. Nu am folosit niciodata bricheta, nici pe umezeala.', message_en: "The piezo button works flawlessly. I have never needed a lighter, not even in damp weather." },
      { display_name: 'Oana F.', rating: 5, message_ro: 'Am comandat-o in negru si arata mai bine decat in fotografii. Textura se vede de aproape, nu e o suprafata plata.', message_en: "I ordered it in black and it looks better than in the photographs. The texture shows up close; it is not a flat surface." }
    ],
    fera: [
      { display_name: 'Client PureFlame', display_name_en: 'PureFlame customer', rating: 5, message_ro: 'Sunt foarte multumit de calitatea mesei si de atmosfera pe care o creeaza.', message_en: "I am very pleased with the quality of the table and the atmosphere it creates." },
      { display_name: 'Stefan D.', rating: 5, message_ro: 'Arzatorul liniar schimba complet efectul. Flacara se intinde pe toata lungimea, nu e un singur punct de foc.', message_en: "The linear burner changes the effect completely. The flame runs the whole length; it is not a single point of fire." },
      { display_name: 'Laura V.', rating: 5, message_ro: 'Inaltimea de 55 cm e potrivita pentru scaunele noastre de terasa. Nu trebuie sa te apleci ca la o masa joasa.', message_en: "The 55 cm height suits our terrace chairs. You do not have to lean down as with a low table." },
      { display_name: 'Cosmin R.', rating: 4, message_ro: 'Foarte frumoasa, iar finisajul deschis se potriveste cu pardoseala noastra. Pretul e pe masura, dar se vede unde s-au dus banii.', message_en: "Very handsome, and the pale finish matches our paving. The price is up there, but you can see where the money went." },
      { display_name: 'Ana-Maria K.', rating: 5, message_ro: 'Suprafata are un aspect driscuit, cu mici variatii. Arata ca o piesa turnata manual, nu ca un produs de serie.', message_en: "The surface has a troweled look with small variations. It reads as a hand-cast piece, not a mass-produced one." },
      { display_name: 'Paul H.', rating: 5, message_ro: 'Am pus-o intre doua sezlonguri si lungimea de 160 cm acopera exact zona. Comenzile sunt ascunse frumos in spate.', message_en: "We put it between two loungers and the 160 cm length covers exactly that zone. The controls are neatly hidden at the back." }
    ],
    ignite: [
      { display_name: 'Robert C.', rating: 5, message_ro: 'Inaltimea de 66 cm o face utila si in picioare, langa bar. Alta experienta fata de mesele joase.', message_en: "The 66 cm height makes it useful standing up, next to the bar. A different experience from the low tables." },
      { display_name: 'Adriana M.', rating: 5, message_ro: 'Corpul din lamele arata foarte bine si lasa aerul sa circule. Butelia sta inauntru si nu se vede deloc.', message_en: "The slatted body looks great and lets air move through. The cylinder sits inside and is completely out of sight." },
      { display_name: 'Nicolae B.', rating: 5, message_ro: 'Metalul vopsit e rezistent, nu s-a ciobit nicaieri intr-un an. Se sterge usor si dupa ploaie.', message_en: "The powder-coated metal is tough; it has not chipped anywhere in a year. It wipes clean easily after rain too." },
      { display_name: 'Iulia T.', rating: 4, message_ro: 'Imi place mult forma ingusta, incape pe o terasa lunga unde nimic altceva nu intra. As fi vrut roti, dar picioarele de reglaj compenseaza pe pavaj denivelat.', message_en: "I really like the narrow shape; it fits a long terrace where nothing else would. I would have liked castors, though the levelling feet make up for uneven paving." },
      { display_name: 'Dan P.', rating: 5, message_ro: 'Focul liniar pe toata lungimea arata spectaculos seara. Reflexiile in lamele sunt un detaliu la care nu ma asteptam.', message_en: "The linear fire along the whole length looks spectacular in the evening. The reflections in the slats are a detail I did not expect." },
      { display_name: 'Gabriela N.', rating: 5, message_ro: 'Am ales-o pentru un spatiu ingust intre perete si zona de lounge. Cei 36 cm adancime au fost decisivi.', message_en: "I chose it for a narrow space between the wall and the lounge area. The 36 cm depth was the deciding factor." }
    ]
  };

  const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  const bilingual = (ro, en) => `<span class="lang-ro">${ro}</span><span class="lang-en" hidden>${en}</span>`;
  const stars = (rating) => `<span class="epp-review-stars" aria-label="${rating} din 5 stele">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>`;

  mount.innerHTML = `
    <div class="epp-reviews-head">
      <p>${bilingual('Recenzii', 'Reviews')}</p>
      <h2>${bilingual(`Păreri despre ${productName}.`, `Thoughts on ${productName}.`)}</h2>
      <div class="epp-reviews-summary" data-review-summary></div><p class="epp-demo-note">${bilingual("Recenzii ilustrative pentru acest concept de portofoliu.", "Illustrative reviews for this portfolio concept.")}</p>
    </div>
    <div class="epp-reviews-layout">
      <div class="epp-reviews-list-wrap">
        <div class="epp-reviews-list" data-review-list aria-live="polite"></div>
        <button type="button" class="epp-reviews-more" data-review-more hidden>${bilingual('Vezi toate recenziile', 'View all reviews')} <span aria-hidden="true">↓</span></button>
      </div>
      <div class="epp-review-form-card">
        <p class="epp-review-form-eyebrow">${bilingual('Ai acest model?', 'Do you own this model?')}</p>
        <h3>${bilingual('Scrie o recenzie', 'Write a review')}</h3>
        <p class="epp-review-form-intro">${bilingual('Spune ce ți-a plăcut și ce ar trebui să știe următorul cumpărător.', 'Share what you liked and what the next buyer should know.')}</p>
        <form class="epp-review-form" data-review-form novalidate>
          <fieldset class="epp-rating-field">
            <legend>${bilingual('Evaluarea ta', 'Your rating')}</legend>
            <div class="epp-rating-options">
              ${[5,4,3,2,1].map((value) => `<input type="radio" name="rating" id="review-rating-${value}" value="${value}" required><label for="review-rating-${value}" aria-label="${value} stele">★</label>`).join('')}
            </div>
          </fieldset>
          <label>${bilingual('Numele afișat', 'Display name')}<input type="text" name="displayName" maxlength="60" autocomplete="name" required></label>
          <label>${bilingual('Email', 'Email')}<input type="email" name="email" maxlength="254" autocomplete="email" required><small>${bilingual('Nu va fi afișat public.', 'It will not be displayed publicly.')}</small></label>
          <label>${bilingual('Recenzia ta', 'Your review')}<textarea name="message" rows="5" maxlength="1500" required></textarea></label>
          <label class="epp-review-consent"><input type="checkbox" name="consent" required><span>${bilingual('Sunt de acord cu prelucrarea datelor conform ', 'I agree to the processing of my data under the ')}<a href="privacy.html">${bilingual('Politicii de confidențialitate', 'Privacy Policy')}</a>.</span></label>
          <label class="epp-review-honeypot" aria-hidden="true">Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
          <p class="epp-review-form-status" data-review-status role="status" aria-live="polite" hidden></p>
          <button type="submit" class="btn btn-solid">${bilingual('Trimite recenzia', 'Submit review')}</button>
          <p class="epp-review-moderation">${bilingual('Recenzia va apărea după verificare. Publicăm și opiniile critice, dacă respectă regulile de limbaj.', 'Your review will appear after moderation. We also publish critical opinions when they follow our language guidelines.')}</p>
        </form>
      </div>
    </div>`;

  const listEl = mount.querySelector('[data-review-list]');
  const summaryEl = mount.querySelector('[data-review-summary]');
  const moreBtn = mount.querySelector('[data-review-more]');
  const form = mount.querySelector('[data-review-form]');
  const statusEl = mount.querySelector('[data-review-status]');
  const heroRating = buyPanel.querySelector('.epp-rating');
  let reviews = seedReviews[productId] ? [...seedReviews[productId]] : [];

  function reviewCard(review, index) {
    const rating = Math.max(1, Math.min(5, Number(review.rating) || 5));
    const name = escapeHtml(review.display_name);
    const nameEn = escapeHtml(review.display_name_en || review.display_name);
    const messageRo = escapeHtml(review.message_ro || review.message);
    const messageEn = escapeHtml(review.message_en || review.message);
    return `<article class="epp-review-card${index >= 3 ? ' is-extra' : ''}">
      ${stars(rating)}
      <blockquote>${bilingual(`„${messageRo}”`, `“${messageEn}”`)}</blockquote>
      <p>${bilingual(name, nameEn)}</p>
    </article>`;
  }

  function renderReviews() {
    if (!reviews.length) {
      listEl.innerHTML = `<div class="epp-reviews-empty">${bilingual(`Nu există încă recenzii publicate pentru ${productName}. Poți fi primul client care își împărtășește experiența.`, `There are no published reviews for ${productName} yet. You can be the first customer to share an experience.`)}</div>`;
      summaryEl.innerHTML = bilingual('Nicio recenzie publicată încă', 'No published reviews yet');
      moreBtn.hidden = true;
      if (heroRating) {
        const heroStars = heroRating.querySelector('.epp-stars');
        const heroLink = heroRating.querySelector('a');
        if (heroStars) heroStars.textContent = '☆☆☆☆☆';
        if (heroLink) heroLink.innerHTML = bilingual('Fii primul care lasă o recenzie', 'Be the first to leave a review');
      }
      applySavedLanguage();
      return;
    }
    const average = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length;
    summaryEl.innerHTML = `${stars(Math.round(average))}<strong>${average.toFixed(1)}</strong><span>${bilingual(`${reviews.length} ${reviews.length === 1 ? 'recenzie' : 'recenzii'}`, `${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`)}</span>`;
    listEl.innerHTML = reviews.map(reviewCard).join('');
    moreBtn.hidden = reviews.length <= 3;
    if (heroRating) {
      const heroStars = heroRating.querySelector('.epp-stars');
      const heroLink = heroRating.querySelector('a');
      if (heroStars) heroStars.textContent = `${'★'.repeat(Math.round(average))}${'☆'.repeat(5 - Math.round(average))}`;
      if (heroLink) heroLink.innerHTML = `<strong>${average.toFixed(1)}</strong> ${bilingual(`· ${reviews.length} ${reviews.length === 1 ? 'recenzie' : 'recenzii'}`, `· ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}`)}`;
    }
    applySavedLanguage();
  }

  function applySavedLanguage() {
    let lang = 'ro';
    try { lang = localStorage.getItem('pf-lang') || 'ro'; } catch (e) {}
    mount.querySelectorAll('.lang-ro').forEach((el) => { el.hidden = lang === 'en'; });
    mount.querySelectorAll('.lang-en').forEach((el) => { el.hidden = lang !== 'en'; });
  }

  moreBtn.addEventListener('click', () => {
    listEl.classList.toggle('is-expanded');
    const expanded = listEl.classList.contains('is-expanded');
    moreBtn.innerHTML = expanded
      ? `${bilingual('Arată mai puține', 'Show fewer')} <span aria-hidden="true">↑</span>`
      : `${bilingual('Vezi toate recenziile', 'View all reviews')} <span aria-hidden="true">↓</span>`;
    applySavedLanguage();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusEl.hidden = true;
    if (!form.reportValidity()) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalHtml = submitBtn.innerHTML;
    const data = new FormData(form);
    submitBtn.disabled = true;
    submitBtn.textContent = '...';

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          displayName: data.get('displayName')?.trim(),
          email: data.get('email')?.trim(),
          rating: Number(data.get('rating')),
          message: data.get('message')?.trim(),
          consent: data.get('consent') === 'on',
          website: data.get('website')?.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'A apărut o eroare.');
      form.reset();
      statusEl.classList.remove('is-error');
      statusEl.innerHTML = bilingual('Mulțumim! Recenzia a fost trimisă și va apărea după verificare.', 'Thank you! Your review was submitted and will appear after moderation.');
      statusEl.hidden = false;
    } catch (error) {
      statusEl.classList.add('is-error');
      statusEl.textContent = error.message || 'A apărut o eroare. Încearcă din nou.';
      statusEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
      applySavedLanguage();
    }
  });

  renderReviews();
  fetch(`/api/reviews?product=${encodeURIComponent(productId)}`)
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((data) => {
      if (Array.isArray(data.reviews) && data.reviews.length) {
        reviews = reviews.concat(data.reviews);
        renderReviews();
      }
    })
    .catch(() => {});
})();
