const fs = require('fs');
const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
const tr = (ro,en) => `<span class="lang-ro">${ro}</span><span class="lang-en" hidden>${en}</span>`;
const arrow = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
const items = [
 ['embera','Embera','Proporții care adună.','Proportions that gather.','Metal texturat','Textured metal','169 × 95 × 44 cm','4.797',1448,1086],
 ['aether','Aether','Liniștea unei forme.','The quiet of a curve.','Beton fin texturat','Fine-textured concrete',tr('83,5 × 83,5 × 37 cm','83.5 × 83.5 × 37 cm'),'2.989',1122,1402],
 ['flavo','Flavo','Geometrie. Fără exces.','Geometry. Without excess.','Design geometric','Geometric design','96 × 96 × 38 cm','2.999',1448,1086],
 ['fera','Fera','Seri fără grabă.','Evenings, unhurried.','Finisaj gri sau negru','Grey or black finish','160 × 69 × 55 cm','4.299',1122,1402],
 ['ignite','Ignite','O linie de lumină.','A line of light.','Metal antracit','Anthracite metal','146 × 36 × 66 cm','3.099',1448,1086]
];
const cards = items.map(([id,name,ro,en,mat,matEn,dims,price,w,h],i)=>`      <article class="hec-piece hec-piece-${id}">
        <a class="hec-product" href="${id}.html" aria-labelledby="hec-${id}-name hec-${id}-action">
          <div class="hec-product-heading"><span class="hec-number">0${i+1} / 05</span><h3 id="hec-${id}-name">${name}</h3><span class="hec-product-arrow">${arrow}</span></div>
          <div class="hec-photographs">
            <div class="hec-scene"><img src="assets/collection/editorial-v2/${id}-main.webp" alt="${name} — masă cu foc într-un ambient exterior" width="${w}" height="${h}" loading="lazy" decoding="async"></div>
            ${i<2?`<div class="hec-detail"><img src="assets/collection/editorial-v2/${id}-detail.webp" alt="${name} — detaliul formei văzut de sus" width="1086" height="1448" loading="lazy" decoding="async"><span>${tr('O altă perspectivă','Another perspective')}</span></div>`:''}
          </div>
          <div class="hec-product-info"><p class="hec-product-note">${tr(ro,en)}</p><span class="hec-price">${price} lei</span><p class="hec-specification">${tr(mat,matEn)}<span>${dims}</span></p><span class="hec-discover" id="hec-${id}-action">${tr('Descoperă modelul','Explore the model')}<span aria-hidden="true">↗</span></span></div>
        </a>
      </article>`).join('\n');
const section = `  <section class="home-editorial-collection" id="collection" aria-labelledby="hec-title">
    <div class="hec-inner">
      <div class="hec-intro">
        <p class="hec-kicker"><span>01 —</span> ${tr('Colecția 2026','The 2026 Collection')}</p>
        <h2 class="hec-title" id="hec-title">${tr('Forme create<br>în jurul focului.','Forms shaped<br>around the fire.')}</h2>
        <div class="hec-intro-aside"><p>${tr('Cinci piese sculpturale. Cinci feluri de a aduce serile mai aproape. Descoperă forma care își găsește locul pe terasa ta.','Five sculptural pieces. Five ways to bring evenings closer. Find the form that belongs on your terrace.')}</p><a class="hec-text-link" href="colectie.html">${tr('Explorează colecția','Explore the collection')}${arrow}</a></div>
      </div>
      <div class="hec-gallery">
${cards}
      </div>
      <div class="hec-footer"><p>${tr('Cinci forme. <em>Același foc.</em>','Five forms. <em>One flame.</em>')}</p><a class="hec-collection-link" href="colectie.html">${tr('Descoperă colecția completă','Discover the full collection')}${arrow}</a></div>
    </div>
  </section>`;
html = html.replace(/  <section class="home-editorial-collection"[\s\S]*?<\/section>/,section);
html = html.replace('home-editorial.css?v=20260917icons','home-editorial.css?v=20260925collection');
fs.writeFileSync(file,html);
