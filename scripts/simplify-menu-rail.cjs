const fs=require('fs');
const content='<span class="rail-single-flame" aria-hidden="true"><img src="assets/brand/flame-mark.png" alt="" width="213" height="328"></span><span class="rail-single-label" aria-hidden="true"><span class="rail-label-rest"><span class="lang-ro">MENIU</span><span class="lang-en" hidden>MENU</span></span><span class="rail-label-open"><span class="lang-ro">ÎNCHIDE</span><span class="lang-en" hidden>CLOSE</span></span></span><span class="rail-single-icon" aria-hidden="true"><i></i><i></i></span>';
let total=0;for(const f of fs.readdirSync('.').filter(f=>f.endsWith('.html'))){let s=fs.readFileSync(f,'utf8');if(!s.includes('class="rail-toggle"'))continue;s=s.replace(/(<button[^>]*class="rail-toggle"[^>]*>)[\s\S]*?<\/button>/,'$1'+content+'</button>').replace(/home-rail\.css\?v=[^" ]+/g,'home-rail.css?v=20260915minimal').replace(/home-rail\.js\?v=[^" ]+/g,'home-rail.js?v=20260915minimal');fs.writeFileSync(f,s);total++;}
let js=fs.readFileSync('assets/js/home-rail.js','utf8');const start=js.indexOf('  function startFlow()');const end=js.indexOf('  const restore =',start);js=js.slice(0,start)+`  const modalToggle = toggle.cloneNode(true);
  modalToggle.classList.add('rail-modal-toggle');
  modalToggle.setAttribute('aria-label','Închide meniul / Close menu');
  modalToggle.setAttribute('aria-expanded','true');
  menu.prepend(modalToggle);
  modalToggle.addEventListener('click',()=>close());
  function startFlow() {}
  [toggle,modalToggle].forEach(button=>{
    button.addEventListener('pointerenter',()=>{if(animated())gs.to(button.querySelector('.rail-single-label'),{y:-5,duration:.5,ease:'power3.out',overwrite:true});});
    button.addEventListener('pointerleave',()=>{if(gs)gs.to(button.querySelector('.rail-single-label'),{y:0,duration:reduce.matches?0:.6,ease:'power3.out',overwrite:true});});
  });
`+js.slice(end);fs.writeFileSync('assets/js/home-rail.js',js);console.log('Updated pages:',total);
