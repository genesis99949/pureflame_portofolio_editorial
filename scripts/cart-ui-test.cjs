const {chromium}=require('C:/Users/ramon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const out='design-review/cart';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{const p=await browser.newPage({viewport:{width:1440,height:1000}});
await p.goto('http://127.0.0.1:3188/embera.html');await p.evaluate(()=>PFCart.addItem({id:'embera',name:'Embera',color:'Deep Black',unitAmountBani:479700,unitPrice:'4.797,00 lei',image:'assets/products/embera/gallery/ansamblu.webp'},1));
await p.locator('[aria-controls="lh-cart"]').click();await p.waitForTimeout(1000);await p.screenshot({path:out+'/dropdown.png'});
await p.locator('#lh-cart a[href="cos-cumparaturi.html"]').click({timeout:5000});await p.waitForTimeout(500);console.log('after click',p.url());assert.match(p.url(),/cos-cumparaturi.html/);
await p.evaluate(async()=>{await Promise.all([...document.images].map(img=>{img.loading='eager';return img.decode().catch(()=>{});}));});await p.screenshot({path:out+'/desktop.png',fullPage:true});
await p.locator('.cart-qty-plus').click();assert.equal(await p.evaluate(()=>PFCart.getCount()),2);assert.match(await p.locator('#summaryTotal').innerText(),/9.594/);
await p.locator('.cart-qty-plus').click();assert.equal(await p.locator('.cart-qty-plus').isDisabled(),true);
await p.locator('[data-addon-id="husa"] .addon-add').click();assert.equal(await p.evaluate(()=>PFCart.getCount()),4);
await p.reload();assert.equal(await p.locator('.cart-line').count(),2);
await p.locator('.checkout-summary-cta').click();await p.waitForURL('**/finalizare-comanda.html');assert.equal(await p.evaluate(()=>PFCart.getCount()),4);
await p.goto('http://127.0.0.1:3188/cos-cumparaturi.html');
await p.locator('[data-lang="en"]:visible').click();await p.waitForTimeout(100);assert.match(await p.locator('.cart-line-remove').first().innerText(),/Remove/);
for(const width of [375,768,1024,1440]){await p.setViewportSize({width,height:1000});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
await p.evaluate(()=>PFCart.clear());assert.equal(await p.locator('#checkoutEmpty').isVisible(),true);assert.equal(await p.locator('#checkoutContent').isVisible(),false);await p.screenshot({path:out+'/empty.png',fullPage:true});
await p.setViewportSize({width:390,height:844});await p.goto('http://127.0.0.1:3188/embera.html');await p.evaluate(()=>PFCart.addItem({id:'embera',name:'Embera',color:'Deep Black',unitAmountBani:479700},1));
await p.locator('.header-right .cart-link').click();await p.locator('.hdr-panel-cart.is-open a[href="cos-cumparaturi.html"]').click();await p.waitForURL('**/cos-cumparaturi.html');await p.screenshot({path:out+'/mobile.png',fullPage:true});
// Keyboard activation must also survive the focus move into the desktop panel.
await p.setViewportSize({width:1440,height:1000});await p.goto('http://127.0.0.1:3188/embera.html');await p.locator('[aria-controls="lh-cart"]').focus();await p.keyboard.press('Enter');await p.waitForTimeout(1000);await p.keyboard.press('Tab');await p.keyboard.press('Enter');await p.waitForURL('**/cos-cumparaturi.html');
console.log('PASS: desktop/mobile/keyboard cart links, quantities, limit, accessories, persistence, checkout navigation, language, empty state and four responsive widths');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
