// Uses only synthetic responses; never creates CRM leads or records live telemetry.
// PLAYWRIGHT_PATH may point to the bundled Playwright package.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = createServer(async (req, res) => {
  let relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (relative.endsWith('/')) relative += 'index.html';
  const target = path.resolve(root, '.' + relative);
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(target);
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' }[path.extname(target)];
    res.writeHead(200, { 'Content-Type': type || 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
try {
  for (const config of [
    { width: 320, height: 568, lang: 'ar' },
    { width: 390, height: 844, lang: 'fr' },
    { width: 599, height: 900, lang: 'ar' },
    { width: 600, height: 900, lang: 'fr' },
    { width: 844, height: 390, lang: 'ar' },
    { width: 900, height: 1000, lang: 'fr' },
    { width: 1440, height: 1000, lang: 'ar' },
  ]) {
    const context = await browser.newContext({ viewport: config,
      userAgent: config.width < 900 ? 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36' });
    const page = await context.newPage();
    const errors = [], requests = [], telemetry = [], navigations = [];
    page.on('pageerror', error => errors.push(error.message));
    let fail = true, release, arrived;
    const pending = new Promise(resolve => { release = resolve; });
    const arrival = new Promise(resolve => { arrived = resolve; });
    await context.route('**/*', async route => {
      const url = route.request().url();
      if (url.includes('/rpc/record_store_soft_download_event')) {
        telemetry.push(route.request().postDataJSON());
        await route.fulfill({ status: 204, body: '' });
      } else if (url.includes('/functions/v1/submit-store-soft-lead')) {
        requests.push(route.request().postDataJSON());
        if (fail) { await route.fulfill({ status: 500, json: { ok: false } }); return; }
        arrived(); await pending;
        await route.fulfill({ json: { ok: true, lead_id: 'synthetic-lead', tracking_code: 'ABC234' } });
      } else if (url.includes('/functions/v1/store-soft-play-redirect')) {
        navigations.push(url);
        await route.fulfill({ contentType: 'text/html', body: '<script>location.replace("https://play.google.com/store/apps/details?id=com.yousoft.storesoft&referrer=storesoft_code%3DABC234")</script>' });
      } else if (url.startsWith('https://play.google.com/')) {
        navigations.push(url); await route.fulfill({ contentType: 'text/html', body: '<h1>Synthetic Play listing</h1>' });
      } else if (url.startsWith(base)) await route.continue();
      else await route.fulfill({ contentType: 'text/plain', body: '' });
    });
    await page.goto(base + '/storesoft/android/?utm_source=facebook&utm_campaign=android-test');
    if (config.lang === 'fr') await page.locator('#languageSwitch').click();
    assert.equal(await page.locator('html').getAttribute('dir'), config.lang === 'ar' ? 'rtl' : 'ltr');
    assert.equal(await page.locator('#email, #downloadWindows').count(), 0);
    assert.equal(await page.locator('iframe').getAttribute('src'), 'https://www.youtube-nocookie.com/embed/ejsVBn3f6Hw?rel=0');
    const video = await page.locator('.video-frame').boundingBox();
    assert.ok(Math.abs(video.width / video.height - 9 / 16) < 0.01);
    if (config.width < 600) {
      const form = await page.locator('#install').boundingBox();
      assert.ok(form.y > video.y + video.height, 'video comes before the form on phones');
      await page.locator('.install-jump').click();
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    for (const selector of ['#name', '#phone', '#shopType', '#submitButton', '#languageSwitch']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box.width >= 48 && box.height >= 48, selector);
    }
    if (process.env.QA_OUTPUT_DIR) {
      await mkdir(process.env.QA_OUTPUT_DIR, { recursive: true });
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: path.join(process.env.QA_OUTPUT_DIR, `android-${config.width}-${config.lang}.png`), fullPage: true });
    }
    await page.locator('#submitButton').click();
    assert.equal(await page.locator('[aria-invalid=true]').count(), 3);
    assert.equal(requests.length, 0);
    assert.equal(await page.locator('#name').evaluate(el => el === document.activeElement), true);
    await page.locator('#name').fill('Synthetic Shop');
    await page.locator('#phone').fill('123');
    await page.locator('#shopType').selectOption('grocery');
    await page.locator('#submitButton').click();
    assert.equal(requests.length, 0);
    await page.locator('#phone').fill('+213 550 12 34 56');
    await page.locator('#submitButton').click();
    await page.waitForFunction(() => document.getElementById('submitError').textContent.length > 0);
    assert.equal(await page.locator('#phone').inputValue(), '+213 550 12 34 56');
    assert.equal(await page.locator('#submitButton').isEnabled(), true);
    assert.equal(navigations.length, 0);
    fail = false;
    // A broken third-party analytics library must not turn a saved lead into an error.
    await page.evaluate(() => { window.fbq = () => { throw new Error('Synthetic blocked analytics'); }; });
    await page.locator('#submitButton').click(); await arrival;
    assert.equal(await page.locator('#submitButton').isDisabled(), true);
    await page.locator('#leadForm').dispatchEvent('submit');
    const events = await page.evaluate(() => window.dataLayer);
    assert.doesNotMatch(JSON.stringify(events), /Synthetic Shop|550 12 34 56/);
    const listing = page.waitForURL('https://play.google.com/**');
    release(); await listing;
    await page.getByRole('heading', { name: 'Synthetic Play listing' }).waitFor();
    assert.equal(context.pages().length, 1, 'same tab, no popup');
    assert.equal(requests.length, 2, 'one failed save and one successful retry');
    const values = requests.at(-1);
    assert.equal(values.form_version, 'phone_shop_select_v4');
    assert.equal(values.requested_platform, 'phone');
    assert.equal(values.source, 'facebook');
    assert.equal(values.campaign, 'android-test');
    assert.equal(values.language, config.lang);
    assert.match(values.landing_page, /\/storesoft\/android\//);
    assert.match(navigations[0], /\?t=ABC234$/);
    assert.match(navigations[1], /id=com\.yousoft\.storesoft/);
    assert.equal(telemetry.filter(row => row.p_event_type === 'LEAD_SUBMITTED').length, 1);
    assert.equal(telemetry.filter(row => row.p_event_type === 'DOWNLOAD_CLICKED').length, 1);
    assert.doesNotMatch(JSON.stringify(telemetry), /Synthetic Shop|550 12 34 56/);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS ${config.width}x${config.height} ${config.lang}: mobile layout, validation, retry, single saved lead, automatic tracked Play navigation`);
  }
  // Untrusted/missing response codes must never become an open redirect.
  for (const trackingCode of [undefined, 'https://untrusted.invalid/']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await context.route('**/*', route => {
      const url = route.request().url();
      if (url.includes('/functions/v1/submit-store-soft-lead')) return route.fulfill({ json: { ok: true, tracking_code: trackingCode } });
      if (url.startsWith('https://play.google.com/')) return route.fulfill({ contentType: 'text/html', body: '<h1>Synthetic Play</h1>' });
      if (url.startsWith(base)) return route.continue();
      return route.fulfill({ status: 200, body: '' });
    });
    await page.goto(base + '/storesoft/android/');
    await page.locator('#name').fill('Synthetic Shop');
    await page.locator('#phone').fill('0550123456');
    await page.locator('#shopType').selectOption('other');
    const listing = page.waitForURL('https://play.google.com/**');
    await page.locator('#submitButton').click(); await listing;
    assert.equal(page.url(), 'https://play.google.com/store/apps/details?id=com.yousoft.storesoft');
    await context.close();
  }
  console.log('PASS missing/malicious code falls back directly to the fixed Play listing');
} finally {
  await browser.close(); server.close();
}
