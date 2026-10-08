// Shared native cart dialog: in-page preview before cart or checkout navigation.
// Desktop: the panel drops in beside the rail. Mobile: a bottom sheet that can be dragged away.
(() => {
 function mount(){
  const panel=document.createElement('dialog');panel.id='pf-cart-dialog';panel.setAttribute('aria-label','Coșul tău');document.body.append(panel);
  let trigger=null,overflow='',motion,drag=null,closing=false,dragged=false;
  const en=()=>document.documentElement.lang==='en';
  const text=(ro,eng)=>en()?eng:ro;
  const node=(tag,cls,value)=>{const el=document.createElement(tag);el.className=cls;if(value!==undefined)el.textContent=value;return el;};
  const sheet=matchMedia('(max-width:1024px)');
  const calm=matchMedia('(prefers-reduced-motion:reduce)');
  const animated=()=>window.gsap&&!calm.matches;
  // A removed row folds away before the cart re-renders without it.
  function removeRow(row,item){
   if(!animated()){PFCart.removeItem(item.key);return;}
   // A flag rather than disabled: a disabled button would drop focus out of the dialog.
   if(row.dataset.removing)return;row.dataset.removing='true';
   gsap.timeline({onComplete:()=>PFCart.removeItem(item.key)})
    .to(row,{x:48,opacity:0,duration:.28,ease:'power2.in'})
    .to(row,{height:0,paddingTop:0,paddingBottom:0,borderBottomWidth:0,duration:.34,ease:'power3.inOut'},.16);
  }
  function render(){
   const focusIndex=[...panel.querySelectorAll('button')].indexOf(document.activeElement);
   panel.replaceChildren();panel.setAttribute('aria-label',text('Coșul tău','Your bag'));
   const handle=node('span','pf-cart-handle');handle.setAttribute('aria-hidden','true');panel.append(handle);
   const count=PFCart.getCount();
   const head=node('div','pf-cart-head');const title=node('h2','',text('Coșul tău','Your bag'));
   if(count){const chip=node('span','pf-cart-count',String(count));chip.setAttribute('aria-hidden','true');title.append(chip);}
   head.append(title);
   const close=node('button','pf-cart-close','×');close.type='button';close.setAttribute('aria-label',text('Închide coșul','Close cart'));close.onclick=()=>hide();head.append(close);panel.append(head);
   const items=PFCart.getItems();const list=node('div','pf-cart-items');
   if(!items.length){const mark=node('img','pf-cart-empty-mark');mark.src='assets/brand/flame-mark.png';mark.alt='';list.append(mark,node('p','pf-cart-empty',text('Coșul este gol. Descoperă piesa potrivită pentru terasa ta.','Your bag is empty. Find the right piece for your terrace.')));}
   items.forEach(item=>{const row=node('div','pf-cart-row');if(item.image){const img=node('img','');img.src=item.image;img.alt='';row.append(img);}const info=node('div','');info.append(node('strong','',item.name));if(item.color)info.append(node('small','',item.color));info.append(node('small','',text('Cantitate: ','Quantity: ')+item.qty));const remove=node('button','pf-cart-remove',text('Elimină','Remove'));remove.type='button';remove.onclick=()=>removeRow(row,item);info.append(remove);row.append(info,node('span','pf-cart-price',PFCart.formatBani(item.unitAmountBani*item.qty)));list.append(row);});panel.append(list);
   if(items.length){const total=node('div','pf-cart-total');total.append(node('span','','Total'),node('strong','',PFCart.formatBani(PFCart.getTotalBani())));panel.append(total);}
   const actions=node('div','pf-cart-actions');const view=node('a','',text('Vezi coșul','View bag'));view.href='cos-cumparaturi.html';actions.append(view);const next=node('a','pf-cart-primary',items.length?text('Mergi la checkout','Go to checkout'):text('Descoperă colecția','Explore collection'));next.href=items.length?'finalizare-comanda.html':'colectie.html';actions.append(next);panel.append(actions);
   if(focusIndex>=0) ([...panel.querySelectorAll('button')][focusIndex]||close).focus({preventScroll:true});
  }
  function finish(){closing=false;panel.close();panel.removeAttribute('style');document.body.style.overflow=overflow;trigger?.setAttribute('aria-expanded','false');trigger?.focus({preventScroll:true});}
  function hide(immediate=false){
   motion?.kill();drag=null;if(!panel.open)return;
   if(immediate||!animated())return finish();
   closing=true;
   if(sheet.matches){
    // The sheet slides back below the screen from wherever a drag left it.
    motion=gsap.timeline({onComplete:finish})
     .to(panel,{y:panel.offsetHeight+24,duration:.42,ease:'power3.in'},0)
     .to(panel,{'--sheet-backdrop':0,duration:.36,ease:'power1.in'},0);
   }else motion=gsap.to(panel,{y:-40,opacity:0,duration:.25,ease:'power2.in',onComplete:finish});
  }
  function show(link){
   // Close the navigation first so its scroll lock cannot outlive the cart.
   const rail=document.querySelector('#rail-menu');if(rail?.open){rail.dispatchEvent(new Event('pf-close-now'));}
   const mobile=document.querySelector('#siteNav.nav-open');if(mobile)document.querySelector('#mobileNavClose')?.click();
   closing=false;trigger=link;overflow=document.body.style.overflow;render();panel.showModal();document.body.style.overflow='hidden';link.setAttribute('aria-expanded','true');panel.querySelector('button').focus({preventScroll:true});
   if(!animated()){panel.style.transform='none';panel.style.opacity='1';return;}
   motion?.kill();
   if(!sheet.matches){motion=gsap.fromTo(panel,{y:-64,opacity:0},{y:0,opacity:1,duration:.6,ease:'power3.out'});return;}
   // Mobile: the sheet rises with a long, soft settle while its contents follow in sequence.
   motion=gsap.timeline()
    .fromTo(panel,{y:panel.offsetHeight,opacity:1},{y:0,duration:.75,ease:'expo.out'},0)
    .fromTo(panel,{'--sheet-backdrop':0},{'--sheet-backdrop':1,duration:.45,ease:'power2.out'},0)
    .fromTo(panel.querySelector('.pf-cart-handle'),{scaleX:.3,opacity:0},{scaleX:1,opacity:1,duration:.7,ease:'back.out(2.4)'},.2)
    .fromTo(panel.querySelectorAll('.pf-cart-head,.pf-cart-row,.pf-cart-empty-mark,.pf-cart-empty,.pf-cart-total,.pf-cart-actions'),{y:28,opacity:0},{y:0,opacity:1,duration:.65,stagger:.06,ease:'power3.out'},.12);
  }
  document.addEventListener('click',e=>{const link=e.target.closest('.pf-floating-cart,.rail-cart,.site-header .cart-link,#rail-menu a[href="cos-cumparaturi.html"]');if(!link||e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;e.preventDefault();e.stopImmediatePropagation();
   if(panel.open){hide();return;}
   show(link);
  },true);
  // Drag the sheet down by its handle or title to dismiss it; a short pull springs back.
  panel.addEventListener('pointerdown',e=>{
   dragged=false;
   if(!sheet.matches||!panel.open||closing||e.button||!e.target.closest('.pf-cart-handle,.pf-cart-head')||e.target.closest('button'))return;
   // Grabbing mid-entrance settles the sheet first, so no half-faded row stays behind.
   motion?.progress(1);motion?.kill();
   drag={id:e.pointerId,start:e.clientY,last:e.clientY,time:e.timeStamp,y:0,speed:0,height:panel.offsetHeight};
   panel.setPointerCapture(e.pointerId);
  });
  panel.addEventListener('pointermove',e=>{
   if(!drag||e.pointerId!==drag.id)return;
   const dy=e.clientY-drag.start;
   drag.y=dy>0?dy:dy*.18;
   drag.speed=(e.clientY-drag.last)/Math.max(1,e.timeStamp-drag.time);drag.last=e.clientY;drag.time=e.timeStamp;
   if(window.gsap)gsap.set(panel,{y:drag.y,'--sheet-backdrop':1-Math.max(0,drag.y)/drag.height});else panel.style.transform=`translateY(${drag.y}px)`;
  });
  const release=e=>{
   if(!drag||e.pointerId!==drag.id)return;
   const {y,speed,height}=drag;drag=null;
   // The click that ends a drag can land outside the sheet; it must not read as a backdrop tap.
   dragged=Math.abs(y)>4;
   if(y>height*.25||speed>.55){hide();return;}
   if(window.gsap)motion=gsap.to(panel,{y:0,'--sheet-backdrop':1,duration:calm.matches?0:.6,ease:'elastic.out(1,.8)'});else panel.style.transform='';
  };
  panel.addEventListener('pointerup',release);panel.addEventListener('pointercancel',release);
  panel.addEventListener('cancel',e=>{e.preventDefault();hide();});panel.addEventListener('click',e=>{if(dragged){dragged=false;return;}if(e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)hide();}});
  window.addEventListener('pf-cart-change',()=>{if(panel.open)render();});window.addEventListener('storage',()=>{if(panel.open)render();});matchMedia('(min-width:1025px)').addEventListener('change',()=>hide(true));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
