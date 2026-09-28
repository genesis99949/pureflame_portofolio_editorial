const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/ramon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const baseUrl = 'http://127.0.0.1:3000';
const outputDir = path.resolve('output/site-tour-videos/raw-v2');
fs.mkdirSync(outputDir, { recursive: true });

const tours = [
  {
    name: 'homepage',
    url: '/index.html',
    stops: ['.home-lifestyle', '.home-space-guide', '#craft'],
  },
  {
    name: 'colectie',
    url: '/colectie.html',
    stops: ['.cx-chapter-0', '.cx-chapter-1', '.cx-interlude'],
  },
  {
    name: 'produs-embera',
    url: '/embera.html',
    stops: ['.product-viewer', '.epp-measure-section', '.epp-story-section'],
  },
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function preparePage(page) {
  await page.evaluate(async () => {
    document.querySelector('.pf-intro')?.remove();
    document.documentElement.classList.remove('pf-intro-active');
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.overflow = 'auto';
    window.scrollTo(0, 0);

    for (const image of document.images) {
      image.loading = 'eager';
      try { await image.decode(); } catch {}
    }
    window.ScrollTrigger?.refresh();
  });
  await sleep(900);
}

async function smoothScrollTo(page, selector, duration = 1050) {
  const exists = await page.locator(selector).count();
  if (!exists) {
    await page.evaluate(async ({ duration }) => {
      const start = window.scrollY;
      const end = Math.min(document.documentElement.scrollHeight - innerHeight, start + innerHeight * 1.1);
      const started = performance.now();
      await new Promise(resolve => {
        const frame = now => {
          const t = Math.min(1, (now - started) / duration);
          const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          window.scrollTo(0, start + (end - start) * eased);
          t < 1 ? requestAnimationFrame(frame) : resolve();
        };
        requestAnimationFrame(frame);
      });
    }, { duration });
    return;
  }

  await page.evaluate(async ({ selector, duration }) => {
    const target = document.querySelector(selector);
    const start = window.scrollY;
    const end = Math.max(0, Math.min(
      document.documentElement.scrollHeight - innerHeight,
      target.getBoundingClientRect().top + window.scrollY - innerHeight * .08
    ));
    const started = performance.now();
    await new Promise(resolve => {
      const frame = now => {
        const t = Math.min(1, (now - started) / duration);
        const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        window.scrollTo(0, start + (end - start) * eased);
        t < 1 ? requestAnimationFrame(frame) : resolve();
      };
      requestAnimationFrame(frame);
    });
  }, { selector, duration });
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const tour of tours) {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        recordVideo: { dir: outputDir, size: { width: 1920, height: 1080 } },
      });
      const page = await context.newPage();
      const video = page.video();

      await page.goto(baseUrl + tour.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await preparePage(page);

      await sleep(700);
      for (const selector of tour.stops) {
        await smoothScrollTo(page, selector, 1050);
        await sleep(1550);
      }
      await sleep(900);

      await page.close();
      const rawPath = await video.path();
      await context.close();
      const namedPath = path.join(outputDir, `${tour.name}.webm`);
      fs.renameSync(rawPath, namedPath);
      console.log(`${tour.name}: ${namedPath}`);
    }
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
