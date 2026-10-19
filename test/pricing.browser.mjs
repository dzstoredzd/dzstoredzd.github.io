// Browser QA uses local pages and a synthetic API. No customer/Admin writes.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  let relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (relative === '/pricing') { res.writeHead(301, { Location: '/pricing/' }).end(); return; }
  if (relative.endsWith('/')) relative += 'index.html';
  const target = path.resolve(root, '.' + relative);
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' }).end(await readFile(target)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const translations = text => ({ ar: 'عربي ' + text, fr: 'Français ' + text, en: 'English ' + text });
let browser;
try {
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  for (const width of [320, 390, 599, 600, 900, 1200, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    let amount = 700001, failure = false, hidden = false, malformed = false, empty = false, calls = 0;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const url = route.request().url();
      if (url.startsWith(base)) return route.continue();
      if (!url.endsWith('/rest/v1/rpc/storesoft_get_public_pricing')) return route.abort();
      calls++;
      if (failure) return route.abort();
      assert.equal(route.request().headers().authorization, undefined);
      const devices = route.request().postDataJSON().p_devices;
      const offer = code => ({ code, title: translations(code), description: translations('description'),
        billing_note: translations('billing note'), features: { ar: ['ميزة'], fr: ['Fonction'], en: ['Feature'] },
        billing: code === 'solo' ? 'once' : 'activation_and_yearly',
        initial_centimes: malformed ? 0 : code === 'solo' ? amount : amount + (devices - 1) * 320002,
        activation_centimes: amount, additional_device_year_centimes: 320002, renewal_centimes: (devices - 1) * 320002 });
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ devices, revision: 1, updated_at: '2026-10-19T00:00:00Z',
        offers: empty ? [] : hidden ? [offer('solo')] : [offer('solo'), offer('sync')] }) });
    });
    for (const language of ['ar', 'fr', 'en']) {
      await page.goto(base + '/pricing/?lang=' + language);
      await page.locator('.offer').first().waitFor();
      assert.equal(await page.locator('html').getAttribute('dir'), language === 'ar' ? 'rtl' : 'ltr');
      assert.equal(await page.locator('html').getAttribute('lang'), language);
      assert.equal(await page.locator('.offer').count(), 2);
      assert.equal(await page.locator('[data-code="solo"] .amount').innerText(), '7 000.01 DA');
      assert.match(await page.locator('[data-code="sync"] .amount').innerText(), /10 200.03 DA/);
      await page.locator('#devices').selectOption('3');
      await page.waitForFunction(() => document.querySelector('[data-code="sync"] .amount')?.textContent === '13 400.05 DA');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}/${language} overflow`);
      for (const selector of ['#refresh', '#devices', '#support', '[data-lang="ar"]']) {
        const box = await page.locator(selector).boundingBox();
        assert.ok(box.height >= 48 && box.width >= 48, `${selector} touch target`);
      }
      assert.match(await page.locator('#support').getAttribute('href'), /^https:\/\/wa.me\/213654338649/);
      assert.doesNotMatch(await page.locator('body').innerText(), /undefined|NaN/);
      if (process.env.QA_OUTPUT_DIR && [390, 1440].includes(width)) {
        await mkdir(process.env.QA_OUTPUT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.QA_OUTPUT_DIR, `pricing-${width}-${language}.png`), fullPage: true });
      }
    }
    amount = 810003;
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.waitForFunction(() => document.querySelector('[data-code="solo"] .amount')?.textContent === '8 100.03 DA');
    hidden = true; await page.locator('#refresh').click();
    await page.waitForFunction(() => document.querySelectorAll('.offer').length === 1);
    failure = true; await page.locator('#refresh').click();
    await page.locator('#status.error').waitFor(); assert.equal(await page.locator('.offer').count(), 0);
    assert.equal(await page.locator('#support').isVisible(), true);
    failure = false; malformed = true; await page.locator('#refresh').click();
    await page.locator('#status.error').waitFor(); assert.equal(await page.locator('.offer').count(), 0);
    malformed = false; empty = true; await page.locator('#refresh').click();
    await page.waitForFunction(() => document.getElementById('status').textContent.includes('No published'));
    assert.equal(await page.locator('.offer').count(), 0);
    empty = false; hidden = false; await page.locator('#refresh').click(); await page.locator('.offer').first().waitFor();
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    assert.equal(await page.locator('.offer').count(), 0);
    await page.evaluate(() => window.dispatchEvent(new Event('online'))); await page.locator('.offer').first().waitFor();
    assert.ok(calls >= 10); assert.deepEqual(errors, []);
    await context.close(); console.log(`PASS pricing AR/FR/EN, server updates, totals, visibility, errors, retry and layout ${width}px`);
  }
} finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
