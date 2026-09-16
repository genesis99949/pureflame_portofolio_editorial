// ---- newsletter.html: afiseaza starea in functie de ?stare= din URL ----
// Valorile permise sunt fixe; nu inseram niciodata in pagina text venit din URL.
(function(){
  const STARI = {
    confirmat: 'stareConfirmat',
    dezabonat: 'stareDezabonat',
    eroare: 'stareEroare',
  };
  const stare = new URLSearchParams(window.location.search).get('stare');
  const id = STARI[stare] || STARI.eroare;
  const el = document.getElementById(id);
  if (el) el.hidden = false;
})();
