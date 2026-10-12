// Local-only QA. External requests are blocked; no lead, Pixel or backend call is sent.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  let relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (relative.endsWith('/')) relative += 'index.html';
  const target = path.resolve(root, '.' + relative);
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' }).end(await readFile(target)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
  for (const width of process.env.POLICY_ONLY ? [] : [320, 390, 599, 600, 900, 1200, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', route => route.request().url().startsWith(base)
      ? route.continue() : route.fulfill({ contentType: 'text/plain', body: '' }));
    await page.goto(base + '/');
    for (const lang of ['ar', 'fr']) {
      if (lang === 'fr') await page.locator('#homeLanguage').click();
      assert.equal(await page.locator('html').getAttribute('lang'), lang);
      assert.equal(await page.locator('html').getAttribute('dir'), lang === 'ar' ? 'rtl' : 'ltr');
      assert.match(await page.title(), lang === 'ar' ? /تسيير محلك/ : /Gérez votre magasin/);
      assert.match(await page.locator('meta[name="description"]').getAttribute('content'), lang === 'ar' ? /14 يومًا/ : /14 jours/);
      assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'), await page.title());
      assert.match(await page.locator('[data-home-copy="fullTrial"]').innerText(), lang === 'ar' ? /14 يومًا/ : /14 jours/);
      assert.doesNotMatch(await page.locator('body').innerText(), /7-day|7 days|7 jours|7 أيام|undefined/);
      assert.equal(await page.locator('#homeAndroid').getAttribute('href'), 'storesoft/v1/android/');
      assert.equal(await page.locator('#homeWindows').getAttribute('href'), 'storesoft/download/');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}/${lang} overflow`);
      assert.equal(await page.locator('#homeLanguage').isVisible(), true);
      for (const selector of ['#homeLanguage', '#homeAndroid', '#homeWindows']) {
        const box = await page.locator(selector).boundingBox();
        assert.ok(box.width >= 48 && box.height >= 48, `${width}/${lang} ${selector} touch size`);
      }
      if (width <= 720) {
        await page.locator('#navToggle').click();
        assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'), 'true');
        await page.locator('.nav-links a[href="#pricing"]').click();
        assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'), 'false');
        assert.equal(await page.locator('#nav').evaluate(el => el.classList.contains('open')), false);
      }
      await page.locator('#faq details').nth(1).locator('summary').click();
      assert.equal(await page.locator('#faq details').nth(1).getAttribute('open'), '');
      await page.locator('#faq details').nth(1).locator('summary').click();
      if (process.env.QA_OUTPUT_DIR && [320, 1440].includes(width)) {
        await mkdir(process.env.QA_OUTPUT_DIR, { recursive: true });
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(process.env.QA_OUTPUT_DIR, `home-${width}-${lang}.png`), fullPage: true });
        await page.screenshot({ path: path.join(process.env.QA_OUTPUT_DIR, `home-${width}-${lang}-viewport.png`) });
      }
    }
    // The chosen language survives reload via the URL; unrelated query and anchor survive switching.
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'), 'fr');
    await page.goto(base + '/?utm_campaign=review&lang=fr#pricing');
    await page.locator('#homeLanguage').click();
    assert.equal(new URL(page.url()).searchParams.get('utm_campaign'), 'review');
    assert.equal(new URL(page.url()).hash, '#pricing');
    await page.locator('#homeAndroid').click();
    await page.waitForURL(base + '/storesoft/v1/android/');
    assert.equal(await page.locator('#leadForm').count(), 1);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS homepage AR/FR, navigation, menus and layout at ${width}px`);
  }
  const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await noScript.newPage();
  await page.goto(base + '/');
  assert.equal(await page.locator('html').getAttribute('lang'), 'ar');
  assert.match(await page.locator('h1').innerText(), /سيّر محلك/);
  assert.match(await page.locator('[data-home-copy="trial"]').innerText(), /14 يومًا/);
  assert.equal(await page.locator('#homeAndroid').getAttribute('href'), 'storesoft/v1/android/');
  console.log('PASS Arabic fallback without JavaScript');
  await noScript.close();
  for (const width of [320, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await context.route('**/*', route => route.request().url().startsWith(base)
      ? route.continue() : route.fulfill({ contentType: 'text/plain', body: '' }));
    for (const file of ['privacy.html', 'delete-account.html']) {
      await page.goto(base + '/' + file);
      if (width === 320) {
        const tagline = page.locator('.site-header .brand .name small');
        assert.equal(await tagline.isVisible(), false);
        const menu = page.locator('#navToggle');
        const box = await menu.boundingBox();
        assert.ok(box.width >= 48 && box.height >= 48);
      }
      const overflow = await page.evaluate(() => [...document.querySelectorAll('body *')]
        .filter(el => el.getBoundingClientRect().right > innerWidth + 1)
        .map(el => ({ tag: el.tagName, class: el.className, text: el.textContent.trim().slice(0, 100) })));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${file}/${width} overflow: ${JSON.stringify(overflow)}`);
      for (const fragment of file === 'privacy.html' ? ['analytics', 'retention'] : ['request', 'local', 'backups']) {
        await page.locator('#' + fragment).scrollIntoViewIfNeeded();
        assert.equal(await page.locator('#' + fragment).isVisible(), true);
      }
      if (process.env.QA_OUTPUT_DIR) {
        await page.locator(file === 'privacy.html' ? '#retention' : '#request').scrollIntoViewIfNeeded();
        await page.screenshot({ path: path.join(process.env.QA_OUTPUT_DIR, `${file}-${width}.png`) });
      }
    }
    await context.close();
  }
  console.log('PASS policy/deletion layout and existing anchors at phone and desktop widths');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
