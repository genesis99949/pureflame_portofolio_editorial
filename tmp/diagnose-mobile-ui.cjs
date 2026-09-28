const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    sessionStorage.setItem('pf-signature-intro-seen-v5', '1');
    localStorage.setItem('pf-newsletter', JSON.stringify({ dismissedAt: Date.now() }));
  });
  await page.goto('http://127.0.0.1:3000/colectie.html', { waitUntil: 'networkidle' });
  await page.locator('#accesorii').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const grid = page.locator('.ce-accessory-grid');
  const before = await grid.evaluate(element => {
    const css = getComputedStyle(element);
    return {
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      scrollLeft: element.scrollLeft,
      display: css.display,
      columns: css.gridTemplateColumns,
      autoColumns: css.gridAutoColumns,
      autoFlow: css.gridAutoFlow,
      overflowX: css.overflowX,
      touchAction: css.touchAction,
      cardWidths: [...element.children].map(card => card.getBoundingClientRect().width)
    };
  });

  await grid.evaluate(element => { element.scrollLeft = 0; });
  const box = await grid.boundingBox();
  const cdp = await context.newCDPSession(page);
  const y = Math.min(700, Math.max(180, box.y + 180));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 330, y }] });
  for (const x of [285, 240, 195, 150, 105, 70]) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    await page.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
  const afterTouchScroll = await grid.evaluate(element => element.scrollLeft);

  await page.locator('.ce-accessory-variant[data-color="Negru"]').first().tap();
  const variantWorks = await page.locator('.ce-accessory-card-mask').first().evaluate(card => ({
    color: card.dataset.accessoryColor,
    image: card.querySelector('img').getAttribute('src')
  }));

  await page.locator('.ce-accessory-card').first().tap();
  const cartCount = await page.evaluate(() => window.PFCart?.getItems?.().reduce((sum, item) => sum + item.quantity, 0));

  await page.screenshot({ path: 'tmp/diagnose-collection-mobile.png', fullPage: true });
  console.log(JSON.stringify({ before, box, afterTouchScroll, variantWorks, cartCount, errors }, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
