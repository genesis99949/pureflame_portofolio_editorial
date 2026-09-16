const { chromium } = require('C:/Users/ramon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(1500);
const a=await page.locator('.rail-track').evaluate(e=>getComputedStyle(e).transform);
await page.waitForTimeout(500);
const b=await page.locator('.rail-track').evaluate(e=>getComputedStyle(e).transform);
if(a===b)throw Error('Rail is not moving');
await page.locator('.rail-toggle').click();await page.waitForTimeout(1600);
await page.screenshot({path:'design-review/rail-menu-premium.png'});
await page.locator('#rail-menu nav a').nth(1).hover();await page.waitForTimeout(1100);
console.log('Scene opacity',await page.locator('.rail-scene').nth(1).evaluate(e=>getComputedStyle(e).opacity));
await page.locator('#rail-menu [data-lang=en]').click();
if(!await page.locator('#rail-menu nav').innerText().then(t=>t.includes('Collection')))throw Error('Language failed');
await page.keyboard.press('Escape');await page.waitForTimeout(600);
if(await page.locator('#rail-menu').evaluate(e=>e.open))throw Error('Escape failed');
await page.locator('.rail-toggle').click();await page.waitForTimeout(1100);
await page.locator('#rail-menu .js-contact-trigger').click();await page.waitForTimeout(200);
console.log('Contact',await page.locator('#contactModalOverlay').isVisible(),'locked',await page.evaluate(()=>document.body.style.overflow));
await page.keyboard.press('Escape');
for(const width of [375,768,1024,1440]){
await page.setViewportSize({width,height:900});await page.waitForTimeout(150);
console.log('Viewport',width,await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,rail:getComputedStyle(document.querySelector('.editorial-rail')).display})));
}
await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.rail-toggle').click();await page.keyboard.press('Escape');
console.log('Errors',errors);
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
