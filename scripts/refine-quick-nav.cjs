const fs=require('fs');
const items=[['embera','Embera'],['aether','Aether'],['flavo','Flavo'],['fera','Fera'],['ignite','Ignite']];
const nav='<nav class="ce-quick-nav" aria-label="Acces rapid la secțiuni / Quick section navigation"><div class="ce-quick-links">'+items.map(([id,name])=>`<a href="#${id}">${name}</a>`).join('')+'<a href="#accesorii"><span class="lang-ro">Accesorii</span><span class="lang-en" hidden>Accessories</span></a></div></nav>';
for(const f of ['colectie.html','colectie-editorial.html']){let s=fs.readFileSync(f,'utf8');s=s.replace(/<nav class="ce-quick-nav"[\s\S]*?<\/nav>/,nav).replace('<section class="ce-accessories"','<section id="accesorii" class="ce-accessories"').replace('collection-experiment.css?v=7','collection-experiment.css?v=8');fs.writeFileSync(f,s);}
const p='assets/css/collection-experiment.css';let css=fs.readFileSync(p,'utf8');css=css.slice(0,css.indexOf('/* Direct access to the five editorial chapters. */'))+`/* Quiet, centered navigation within the collection. */
.ce-quick-nav{margin:0 auto 28px;padding:0 20px;max-width:760px}
.ce-quick-links{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;column-gap:26px;row-gap:0}
.ce-quick-links a{display:inline-flex;align-items:center;min-height:44px;color:rgba(17,15,10,.68);font:400 14px/1.5 var(--utility);text-decoration:none;text-underline-offset:5px;transition:color .2s}
.ce-quick-links a:hover{color:var(--charcoal);text-decoration:underline}
.ce-quick-links a:focus-visible{outline:1px solid var(--ember-deep);outline-offset:4px}
#accesorii{scroll-margin-top:100px}
@media(max-width:600px){.ce-quick-nav{padding-inline:20px;margin-bottom:12px}.ce-quick-links{column-gap:22px}}
@media(prefers-reduced-motion:reduce){.ce-quick-links a{transition:none}}
`;fs.writeFileSync(p,css);
