/* One continuous, deforming surface. Desktop only; mobile keeps its original DOM. */
(() => {
 const header=document.querySelector('.site-header--home');if(!header)return;
 const mq=matchMedia('(min-width:1025px)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
 let teardown=()=>{};
 function setup(){
  teardown();teardown=()=>{};if(!mq.matches)return;
  const collectionLink=header.querySelector('.home-header-nav a[href="colectie.html"]');
  const cartLink=header.querySelector('.home-header-cart');if(!collectionLink||!cartLink)return;
  const controller=new AbortController(),signal=controller.signal;
  const listen=(target,event,fn)=>target.addEventListener(event,fn,{signal});
  const lang=()=>document.querySelector('.lang-btn.active')?.dataset.lang==='en'?'en':'ro';
  const text=(ro,en)=>lang()==='en'?en:ro;
  function trigger(link,id){const b=document.createElement('button');b.type='button';b.className=link.className+' lh-trigger';b.innerHTML=link.innerHTML;b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls',id);link.replaceWith(b);return b;}
  const collection=collectionLink.cloneNode(true),cart=cartLink;
  cart.href='cos-cumparaturi.html';
  collection.classList.add('lh-trigger');collection.removeAttribute('aria-haspopup');collection.setAttribute('aria-controls','lh-collection');collection.setAttribute('aria-expanded','false');collectionLink.replaceWith(collection);
  collection.insertAdjacentHTML('beforeend','<span class="lh-chevron" aria-hidden="true">⌄</span>');
  const surface=document.createElement('div');surface.className='lh-surface';surface.setAttribute('aria-hidden','true');
  surface.innerHTML='<div class="lh-skin"></div><svg xmlns="http://www.w3.org/2000/svg"><path/></svg>';header.prepend(surface);
  const skin=surface.firstElementChild,path=surface.querySelector('path');
  function panel(id){const p=document.createElement('section');p.id=id;p.className='lh-panel';p.inert=true;p.setAttribute('aria-labelledby',id+'-title');header.append(p);return p;}
  const panels={collection:panel('lh-collection'),cart:panel('lh-cart')};
  const triggers={collection,cart};
  let active=null,timeline=null,leaveTimer,hoverTimer,width=0,base=0,removedFocusIndex=null;
  const shape={left:0,right:0,depth:0,shoulder:0};
  function draw(){
   const w=width,h=base,d=Math.max(0,shape.depth),l=shape.left,r=shape.right;
   const c=Math.min(shape.shoulder,d*.48),corner=Math.min(22,d*.35),bottom=h+d;
   const p=`M 15 0 H ${w-15} Q ${w} 0 ${w} 15 V ${h-15} Q ${w} ${h} ${w-15} ${h} H ${r+c} C ${r+c*.35} ${h} ${r} ${h+c*.35} ${r} ${h+c} V ${bottom-corner} Q ${r} ${bottom} ${r-corner} ${bottom} H ${l+corner} Q ${l} ${bottom} ${l} ${bottom-corner} V ${h+c} C ${l} ${h+c*.35} ${l-c*.35} ${h} ${l-c} ${h} H 15 Q 0 ${h} 0 ${h-15} V 15 Q 0 0 15 0 Z`;
   surface.style.width=w+'px';surface.style.height=(bottom+1)+'px';skin.style.clipPath=`path("${p}")`;path.setAttribute('d',p);
  }
  function measure(){width=header.clientWidth;base=header.clientHeight;
   const cb=collection.getBoundingClientRect(),hb=header.getBoundingClientRect();
   panels.collection.style.width='220px';panels.collection.style.left=Math.max(40,Math.min(width-260,cb.left-hb.left-24))+'px';
   const navStyle=getComputedStyle(collection);
   for(const prop of ['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform'])panels.collection.style[prop]=navStyle[prop];
   panels.cart.style.width='360px';panels.cart.style.left=(width-388)+'px';
  }
  function target(mode){const p=panels[mode];const left=parseFloat(p.style.left);return {left,right:left+p.offsetWidth,depth:p.offsetHeight+8,shoulder:Math.min(36,left-14,width-left-p.offsetWidth-14)};}
  function render(){
   const data=['Aether','Embera','Flavo','Fera','Ignite'];
   panels.collection.removeAttribute('aria-labelledby');panels.collection.setAttribute('aria-label',text('Colecție','Collection'));
   panels.collection.innerHTML=`<ul class="lh-collection-list">${data.map(name=>`<li><a href="${name.toLowerCase()}.html">${name}</a></li>`).join('')}</ul><a class="lh-collection-all" href="colectie.html">${text('Toată colecția','Full collection')} ↗</a>`;
   renderCart();cart.setAttribute('aria-label',text('Deschide coșul','Open cart'));
  }
  function renderCart(){
   const p=panels.cart;const items=window.PFCart?.getItems()||[];
   for(const root of [cart,cartLink]){const badge=root.querySelector('.cart-badge');if(badge){const count=window.PFCart?.getCount()||0;badge.textContent=String(count);badge.hidden=count===0;}}
   p.replaceChildren();const head=document.createElement('div');head.className='lh-panel-head';
   const title=document.createElement('h2');title.id='lh-cart-title';title.textContent=text('Coșul tău','Your cart');head.append(title);
   const close=document.createElement('button');close.type='button';close.className='lh-close';close.textContent='×';close.setAttribute('aria-label',text('Închide coșul','Close cart'));head.append(close);p.append(head);
   const money=value=>window.PFCart?.formatBani(value)||'0,00 lei';
   if(items.length){const ul=document.createElement('ul');ul.className='lh-cart-list';
    for(const item of items){const li=document.createElement('li'),name=document.createElement('div'),variant=document.createElement('small'),price=document.createElement('span');
     name.textContent=String(item.name||item.id);variant.textContent=[item.color,item.mask,`${text('Cantitate','Quantity')}: ${item.qty}`].filter(Boolean).join(' · ');name.append(variant);price.textContent=money(item.qty*item.unitAmountBani);li.append(name,price);
     // Liniile vechi din localStorage pot veni fara `key`; fara ea removeItem ar goli tot cosul.
     if(item.key){const remove=document.createElement('button');remove.type='button';remove.className='lh-cart-remove';remove.dataset.key=item.key;remove.textContent='×';
      const label=text(`Șterge ${item.name||item.id} din coș`,`Remove ${item.name||item.id} from cart`);remove.setAttribute('aria-label',label);remove.title=label;li.append(remove);}
     ul.append(li);}p.append(ul);
   }else{const empty=document.createElement('p');empty.className='lh-cart-empty';empty.textContent=text('Coșul este gol.','Your cart is empty.');p.append(empty);}
   const foot=document.createElement('div');foot.className='lh-footer lh-cart-footer';
   if(items.length){const row=document.createElement('div');row.className='lh-cart-total';const label=document.createElement('span'),value=document.createElement('strong');label.textContent='Subtotal';value.textContent=money(window.PFCart.getTotalBani());row.append(label,value);foot.append(row);}
   const link=document.createElement('a');link.href=items.length?'cos-cumparaturi.html':'colectie.html';link.textContent=items.length?text('Vezi coșul →','View cart →'):text('Descoperă colecția →','Explore the collection →');foot.append(link);p.append(foot);
  }
  function open(mode,keyboard=false){
   clearTimeout(leaveTimer);clearTimeout(hoverTimer);if(active===mode)return;
   const was=active;active=mode;timeline?.kill();header.classList.add('lh-open');header.classList.remove('hidden');
   for(const [id,p]of Object.entries(panels)){p.inert=id!==mode;p.classList.toggle('is-active',id===mode);p.style.visibility=id===mode?'visible':'hidden';p.style.opacity='0';triggers[id].setAttribute('aria-expanded',String(id===mode));}
   measure();const goal=target(mode),p=panels[mode];
   if(reduce.matches||!window.gsap){Object.assign(shape,goal);draw();p.style.opacity='1';if(keyboard)p.querySelector('a,button')?.focus();return;}
   timeline=gsap.timeline({onComplete:()=>{if(keyboard&&active===mode)p.querySelector('a,button')?.focus();}});
   if(!was){const box=triggers[mode].getBoundingClientRect(),hb=header.getBoundingClientRect(),center=Math.max(100,Math.min(width-100,box.left-hb.left+box.width/2));
    Object.assign(shape,{left:mode==='collection'?goal.left:center-52,right:mode==='collection'?goal.right:center+52,depth:0,shoulder:0});
    timeline.to(shape,{left:mode==='collection'?goal.left:center-75,right:mode==='collection'?goal.right:center+75,depth:34,shoulder:22,duration:.18,ease:'power2.out',onUpdate:draw});}
   timeline.to(shape,{...goal,depth:goal.depth+8,duration:was?.48:.5,ease:'power3.inOut',onUpdate:draw})
    .to(shape,{depth:goal.depth,duration:.19,ease:'power2.out',onUpdate:draw});
   timeline.fromTo(p,{opacity:0,y:-9},{opacity:1,y:0,duration:.24,ease:'power2.out'},was?.28:.48);
  }
  function close(focus=false){
   clearTimeout(hoverTimer);clearTimeout(leaveTimer);const previous=active;if(!previous)return;active=null;timeline?.kill();
   for(const p of Object.values(panels)){p.inert=true;p.classList.remove('is-active');p.style.visibility='hidden';p.style.opacity='0';}
   collection.setAttribute('aria-expanded','false');cart.setAttribute('aria-expanded','false');
   const done=()=>header.classList.remove('lh-open');
   if(reduce.matches||!window.gsap){shape.depth=0;shape.shoulder=0;draw();done();}
   else timeline=gsap.timeline({onComplete:done}).to(shape,{depth:0,shoulder:0,duration:.43,ease:'power3.inOut',onUpdate:draw});
   if(focus)triggers[previous].focus();
  }
  render();measure();shape.left=width*.4;shape.right=width*.6;header.classList.add('lh-enabled');draw();
  listen(collection,'pointerenter',event=>{if(event.pointerType==='mouse'){clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>open('collection'),110);}});
  listen(collection,'pointerleave',()=>clearTimeout(hoverTimer));
  listen(collection,'keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();if(active==='collection')panels.collection.querySelector('a')?.focus();else open('collection',true);}});
  listen(header,'pointerenter',()=>clearTimeout(leaveTimer));
  listen(header,'pointerleave',()=>{clearTimeout(hoverTimer);if(active==='collection'&&!panels.collection.contains(document.activeElement))leaveTimer=setTimeout(()=>close(),260);});
  listen(header,'click',event=>{
   if(event.target.closest('.lh-close')){close(true);return;}
   const remove=event.target.closest('.lh-cart-remove');if(!remove?.dataset.key)return;
   // Butonul dispare la re-randare; retinem pozitia ca sa ducem focusul pe randul urmator.
   removedFocusIndex=[...panels.cart.querySelectorAll('.lh-cart-remove')].indexOf(remove);
   window.PFCart?.removeItem(remove.dataset.key);
  });
  listen(document,'pointerdown',event=>{if(active&&!header.contains(event.target))close();});
  listen(document,'keydown',event=>{if(active&&event.key==='Escape'){event.preventDefault();close(true);}});
  // Focus moves through <body> between blur and focus. A microtask here
  // made the panel inert before a pointer click could activate its link.
  listen(header,'focusout',event=>{
   if(event.relatedTarget){if(active&&!header.contains(event.relatedTarget))close();return;}
   setTimeout(()=>{if(active&&!header.contains(document.activeElement))close();},0);
  });
  listen(window,'pf-cart-change',()=>{
   renderCart();
   if(active!=='cart'){removedFocusIndex=null;return;}
   // Panoul ramane deschis: se reaseaza doar suprafata, pe noua inaltime a listei.
   measure();const goal=target('cart');
   if(reduce.matches||!window.gsap){Object.assign(shape,goal);draw();}
   else{timeline?.kill();timeline=gsap.to(shape,{...goal,duration:.34,ease:'power3.inOut',onUpdate:draw});}
   if(removedFocusIndex!==null){const buttons=panels.cart.querySelectorAll('.lh-cart-remove');
    (buttons[Math.min(removedFocusIndex,buttons.length-1)]||panels.cart.querySelector('.lh-close'))?.focus({preventScroll:true});removedFocusIndex=null;}
  });
  listen(window,'storage',event=>{if(event.key==='pf_cart_v1'){renderCart();if(active==='cart'){Object.assign(shape,target('cart'));draw();}}});
  for(const b of document.querySelectorAll('.lang-btn'))listen(b,'click',()=>{render();if(active){Object.assign(shape,target(active));panels[active].style.opacity='1';draw();}});
  listen(window,'resize',()=>{measure();if(active)Object.assign(shape,target(active));draw();});
  teardown=()=>{controller.abort();timeline?.kill();clearTimeout(hoverTimer);clearTimeout(leaveTimer);surface.remove();Object.values(panels).forEach(p=>p.remove());collection.replaceWith(collectionLink);header.classList.remove('lh-enabled','lh-open');};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
 mq.addEventListener('change',setup);
})();
