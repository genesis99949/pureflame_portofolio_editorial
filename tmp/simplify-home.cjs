const fs=require('fs');
const tr=(ro,en)=>`<span class="lang-ro">${ro}</span><span class="lang-en" hidden>${en}</span>`;
const arrow='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
const models=[['embera','Embera','Proporții care adună.','Proportions that gather.',1448,1086],['aether','Aether','Liniștea unei forme.','The quiet of a curve.',1122,1402],['flavo','Flavo','Geometrie. Fără exces.','Geometry. Without excess.',1448,1086],['fera','Fera','Seri fără grabă.','Evenings, unhurried.',1122,1402],['ignite','Ignite','O linie de lumină.','A line of light.',1448,1086]];
const panels=models.map(([id,name,ro,en,w,h],i)=>`        <article class="hec-feature" id="hec-panel-${id}" aria-labelledby="hec-name-${id}"${i?' hidden':''}>
          <a class="hec-feature-image" href="${id}.html" aria-label="${name}"><img src="assets/collection/editorial-v2/${id}-main.webp" alt="${name} — masă cu foc într-un ambient exterior" width="${w}" height="${h}" loading="lazy" decoding="async"></a>
          <div class="hec-feature-copy"><span class="hec-feature-index">0${i+1} / 05</span><h3 id="hec-name-${id}">${name}</h3><p>${tr(ro,en)}</p><a class="hec-model-link" href="${id}.html">${tr('Descoperă '+name,'Discover '+name)}${arrow}</a></div>
        </article>`).join('\n');
const section=`  <section class="home-editorial-collection" id="collection" aria-labelledby="hec-title">
    <div class="hec-inner">
      <div class="hec-intro"><p class="hec-kicker"><span>01 —</span>${tr('Colecția 2026','The 2026 Collection')}</p><h2 id="hec-title">${tr('Cinci forme. Același foc.','Five forms. One flame.')}</h2></div>
      <div class="hec-showcase">
${panels}
      </div>
      <div class="hec-bottom">
        <div class="hec-switcher" hidden><p>${tr('Explorează modelele','Explore the models')}</p><div class="hec-options" role="group" aria-label="Modelele colecției" data-aria-ro="Modelele colecției" data-aria-en="Collection models">${models.map(([id,name],i)=>`<button type="button" data-hec-select="${id}" aria-controls="hec-panel-${id}" aria-pressed="${i===0}"><span class="hec-option-number" aria-hidden="true">0${i+1}</span>${name}</button>`).join('')}</div></div>
        <a class="hec-collection-link" href="colectie.html">${tr('Vezi colecția completă','View the full collection')}${arrow}</a>
      </div>
      <p class="hec-status" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>
  </section>`;
let html=fs.readFileSync('index.html','utf8').replace(/  <section class="home-editorial-collection"[\s\S]*?<\/section>/,section).replace('home-editorial.css?v=20260925collection-fix','home-editorial.css?v=20260925showcase');
html=html.replace('<script src="assets/js/home-card-stack.js', '<script src="assets/js/home-collection.js?v=20260925showcase"></script>\n<script src="assets/js/home-card-stack.js');
fs.writeFileSync('index.html',html);
const css=fs.readFileSync('assets/css/home-editorial.css','utf8');
const marker='/* Following homepage sections: preserve their independent layout rules. */';
if(!css.includes(marker))throw Error('Missing section boundary');
fs.writeFileSync('tmp/home-following-preserved.css',css.slice(css.indexOf(marker)));
