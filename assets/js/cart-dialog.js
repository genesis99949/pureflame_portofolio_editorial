// Shared native cart dialog: in-page preview before cart or checkout navigation.
(() => {
 function mount(){
  const panel=document.createElement('dialog');panel.id='pf-cart-dialog';panel.setAttribute('aria-label','Coșul tău');document.body.append(panel);
  let trigger=null,overflow='',motion;
  const en=()=>document.documentElement.lang==='en';
  const text=(ro,eng)=>en()?eng:ro;
  const node=(tag,cls,value)=>{const el=document.createElement(tag);el.className=cls;if(value!==undefined)el.textContent=value;return el;};
  function render(){
   const focusIndex=[...panel.querySelectorAll('button')].indexOf(document.activeElement);
   panel.replaceChildren();panel.setAttribute('aria-label',text('Coșul tău','Your bag'));
   const head=node('div','pf-cart-head');head.append(node('h2','',text('Coșul tău','Your bag')));
   const close=node('button','pf-cart-close','×');close.type='button';close.setAttribute('aria-label',text('Închide coșul','Close cart'));close.onclick=()=>hide();head.append(close);panel.append(head);
   const items=PFCart.getItems();const list=node('div','pf-cart-items');
   if(!items.length)list.append(node('p','pf-cart-empty',text('Coșul este gol. Descoperă piesa potrivită pentru terasa ta.','Your bag is empty. Find the right piece for your terrace.')));
   items.forEach(item=>{const row=node('div','pf-cart-row');if(item.image){const img=node('img','');img.src=item.image;img.alt='';row.append(img);}const info=node('div','');info.append(node('strong','',item.name));if(item.color)info.append(node('small','',item.color));info.append(node('small','',text('Cantitate: ','Quantity: ')+item.qty));const remove=node('button','pf-cart-remove',text('Elimină','Remove'));remove.type='button';remove.onclick=()=>PFCart.removeItem(item.key);info.append(remove);row.append(info,node('span','pf-cart-price',PFCart.formatBani(item.unitAmountBani*item.qty)));list.append(row);});panel.append(list);
   if(items.length){const total=node('div','pf-cart-total');total.append(node('span','','Total'),node('strong','',PFCart.formatBani(PFCart.getTotalBani())));panel.append(total);}
   const actions=node('div','pf-cart-actions');const view=node('a','',text('Vezi coșul','View bag'));view.href='cos-cumparaturi.html';actions.append(view);const next=node('a','pf-cart-primary',items.length?text('Mergi la checkout','Go to checkout'):text('Descoperă colecția','Explore collection'));next.href=items.length?'finalizare-comanda.html':'colectie.html';actions.append(next);panel.append(actions);
   if(focusIndex>=0) ([...panel.querySelectorAll('button')][focusIndex]||close).focus({preventScroll:true});
  }
  function finish(){panel.close();document.body.style.overflow=overflow;trigger?.setAttribute('aria-expanded','false');trigger?.focus({preventScroll:true});}
  function hide(immediate=false){motion?.kill();if(!panel.open)return;if(!immediate&&window.gsap&&!matchMedia('(prefers-reduced-motion:reduce)').matches){motion=gsap.to(panel,{y:-40,opacity:0,duration:.25,ease:'power2.in',onComplete:finish});}else finish();}
  document.addEventListener('click',e=>{const link=e.target.closest('.pf-floating-cart,#rail-menu a[href="cos-cumparaturi.html"]');if(!link||e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;e.preventDefault();e.stopImmediatePropagation();
   if(panel.open){hide();return;}
   // Close the navigation first so its scroll lock cannot outlive the cart.
   const rail=document.querySelector('#rail-menu');if(rail?.open){rail.dispatchEvent(new Event('pf-close-now'));}
   const mobile=document.querySelector('#siteNav.nav-open');if(mobile)document.querySelector('#mobileNavClose')?.click();
   trigger=link;overflow=document.body.style.overflow;render();panel.showModal();document.body.style.overflow='hidden';link.setAttribute('aria-expanded','true');panel.querySelector('button').focus();
   if(window.gsap&&!matchMedia('(prefers-reduced-motion:reduce)').matches){motion?.kill();motion=gsap.fromTo(panel,{y:-64,opacity:0},{y:0,opacity:1,duration:.6,ease:'power3.out'});}else{panel.style.transform='none';panel.style.opacity='1';}
  },true);
  panel.addEventListener('cancel',e=>{e.preventDefault();hide();});panel.addEventListener('click',e=>{if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)hide();}});
  window.addEventListener('pf-cart-change',()=>{if(panel.open)render();});window.addEventListener('storage',()=>{if(panel.open)render();});matchMedia('(min-width:1025px)').addEventListener('change',()=>hide(true));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
