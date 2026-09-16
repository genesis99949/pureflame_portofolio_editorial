const path=require('node:path'),fs=require('node:fs'),os=require('node:os'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'design-review/product-journey');
const {chromium}=require('C:/Users/ramon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const axe=fs.readFileSync(path.join(root,'design-review/aether-3d/tooling/node_modules/axe-core/axe.min.js'),'utf8');
const before=JSON.parse(fs.readFileSync(path.join(out,'preservation.json'),'utf8'));
process.env.NODE_ENV='test';process.env.DB_PATH=path.join(os.tmpdir(),`pf-journey-${Date.now()}.db`);
const {createApp}=require('../server/index'),{db}=require('../server/db');
(async()=>{
 const app=createApp({stripeSecretKey:'sk_test_FAKE_FOR_JOURNEY_QA',stripeWebhookSecret:'whsec_fake',baseUrl:'http://127.0.0.1'});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const report=[];
 try{
  for(const slug of Object.keys(before)){
   const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
   const errors=[],models=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('.glb'))models.push(r.url());});
   await page.goto(`http://127.0.0.1:${server.address().port}/${slug}.html`,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('[data-viewer-parts] button');
   const result=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);
    return {order:[...document.querySelector('.epp-main').children].map(x=>x.classList[0]),duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i),missing:[...document.querySelectorAll('.epp-main a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash),specs:document.querySelector('#epp-detalii dl').outerHTML,heroAccordions:!!document.querySelector('.epp-buy-panel .epp-accordions'),smooth:!!document.querySelector('#smooth-wrapper')};
   });
   assert.deepEqual(result.order,['epp-hero','epp-path-nav','epp-story-section','product-viewer','epp-measure-section','epp-product-information','epp-review-section','epp-choice-return','ce-accessories','epp-compare-section','epp-collection-nav']);
   assert.deepEqual(result.duplicates,[]);assert.deepEqual(result.missing,[]);assert.equal(result.smooth,false);assert.equal(result.heroAccordions,false);
   const normalize=s=>s.replace(/ hidden=""/g,' hidden').replace(/\s+/g,' ').trim();
   assert.equal(normalize(result.specs),normalize(before[slug].preserved_specs_html));
   await page.locator('.epp-path-nav a[href="#epp-detalii"]').click();
   await page.waitForTimeout(120);
   assert.equal(await page.evaluate(()=>document.activeElement.id),'epp-detalii');
   assert.equal(await page.locator('#epp-detalii details').count(),3);
   await page.locator('#epp-detalii details:nth-child(2) summary').click();
   assert.equal(await page.locator('#epp-detalii details:nth-child(2)').getAttribute('open'),'');
   if(slug==='fera'){
    await page.locator('.epp-product-information').screenshot({path:path.join(out,'fera-information-desktop.png')});
    await page.locator('.epp-path-nav').screenshot({path:path.join(out,'fera-navigation-desktop.png')});
   }
   await page.locator('.epp-choice-return a').click();
   await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>document.activeElement.id),'epp-configurare');
   await page.locator('#qtyPlus').click();assert.equal((await page.locator('#qtyValue').innerText()).trim(),'2');
   const options=page.locator('.epp-buy-panel .color-swatch');if(await options.count()>1)await options.nth(1).click();
   await page.locator('#addToCartBtn').click();
   assert.equal(await page.locator('#addedToCartNote').isVisible(),true);
   await page.evaluate(axe);
   const violations=await page.evaluate(async()=>{const r=await axe.run({include:[['.epp-path-nav'],['.epp-essential-size'],['.epp-product-information'],['.epp-choice-return']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}));});
   assert.deepEqual(violations,[]);
   await page.locator('.lang-btn[data-lang="en"]').first().focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('.epp-path-nav .lang-ro').first().isVisible(),false);
   await page.locator('.lang-btn[data-lang="ro"]').first().focus();await page.keyboard.press('Enter');
   await page.setViewportSize({width:390,height:844});
   await page.locator('.epp-path-nav').scrollIntoViewIfNeeded();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   if(slug==='fera')await page.screenshot({path:path.join(out,'fera-navigation-mobile.png')});
   await page.locator('.epp-path-nav a[href="#epp-dimensiuni"]').click();
   assert.equal(await page.evaluate(()=>document.activeElement.id),'epp-dimensiuni');
   if(slug==='fera')await page.locator('.epp-product-information').screenshot({path:path.join(out,'fera-information-mobile.png')});
   assert.deepEqual(errors,[]);assert.deepEqual(models,[]);
   report.push({slug,order:result.order,anchors:'passed',preservedSpecs:true,cart:'passed',mobileOverflow:false,accessibilityViolations:violations,modelDownloadedBeforeOptIn:false,pageErrors:errors});
   console.log(slug,'passed');await page.close();
  }
  fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify(report,null,2));
 }finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
