// Run with Playwright installed, or PLAYWRIGHT_PATH pointing to its module directory.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (relative.endsWith('/')) relative += 'index.html';
  const target = path.resolve(root, '.' + relative);
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { const body = await readFile(target); res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
try {
  for (const config of [
    { width: 1440, height: 1000, platform: 'windows', lang: 'ar', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36' },
    { width: 320, height: 568, platform: 'android', lang: 'ar', ua: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36' },
    { width: 390, height: 844, platform: 'android', lang: 'fr', ua: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36' },
    { width: 900, height: 1000, platform: 'unknown', lang: 'fr', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36' },
  ]) {
    const context = await browser.newContext({ viewport: { width: config.width, height: config.height }, userAgent: config.ua });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const requests = [];
    const telemetry = [];
    let release, arrived;
    const pending = new Promise(resolve => { release = resolve; });
    const arrival = new Promise(resolve => { arrived = resolve; });
    let fail = config.width === 1440;
    await context.route('**/*', async route => {
      const url = route.request().url();
      if (url.includes('/rpc/record_store_soft_download_event')) {
        telemetry.push(route.request().postDataJSON());
        await route.fulfill({ status: 204, body: '' });
      } else if (url.includes('/functions/v1/submit-store-soft-lead')) {
        requests.push(route.request().postDataJSON());
        if (fail) { await route.fulfill({ status: 500, contentType: 'application/json', body: '{"ok":false}' }); return; }
        arrived();
        await pending;
        await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, lead_id: 'test-lead', tracking_code: 'ABC234' }) });
      } else if (url.startsWith(base)) await route.continue();
      else await route.fulfill({ status: 200, contentType: 'text/plain', body: '' });
    });
    await Promise.all([page.waitForResponse('**/rpc/record_store_soft_download_event'),
      page.goto(base + '/storesoft/download/?utm_source=facebook&utm_campaign=phone-test')]);
    await Promise.all([page.waitForResponse('**/rpc/record_store_soft_download_event'), page.reload()]);
    await page.waitForFunction(() => Boolean(localStorage.getItem('storesoft_download_visitor_v1')));
    // Both initial and repeat page loads use the same persistent ID; PostgreSQL deduplicates it.
    assert.equal(telemetry.filter(event => event.p_event_type === 'DOWNLOAD_PAGE_VISIT').length, 2);
    assert.equal(telemetry[0].p_visitor_id, telemetry[1].p_visitor_id);
    if (config.lang === 'fr') await page.locator('#languageSwitch').click();
    assert.equal(await page.locator('#email').count(), 0);
    await page.locator('#submitButton').click();
    assert.equal(await page.locator('[aria-invalid="true"]').count(), 3);
    assert.equal(requests.length, 0);
    await page.locator('#name').fill('Test Shop');
    await page.locator('#phone').fill('123');
    await page.locator('#shopType').selectOption('grocery');
    await page.locator('#submitButton').click();
    assert.equal(await page.locator('#phone').getAttribute('aria-invalid'), 'true');
    assert.equal(requests.length, 0);
    await page.locator('#phone').fill('+213 550 12 34 56');
    if (fail) {
      await page.locator('#submitButton').click();
      await page.waitForFunction(() => document.getElementById('submitError').textContent.length > 0);
      assert.equal(await page.locator('#successView').isVisible(), false);
      assert.equal(await page.locator('#submitButton').isEnabled(), true);
      fail = false;
    }
    await page.locator('#submitButton').click();
    await arrival;
    assert.equal(await page.locator('#successView').isVisible(), false);
    assert.equal(await page.locator('#submitButton').isDisabled(), true);
    await page.locator('#leadForm').dispatchEvent('submit');
    const expectedRequests = config.width === 1440 ? 2 : 1;
    release();
    await page.locator('#successView').waitFor({ state: 'visible' });
    assert.equal(requests.length, expectedRequests);
    const submitted = requests.at(-1);
    assert.equal(submitted.phone, '+213 550 12 34 56');
    assert.equal(submitted.source, 'facebook');
    assert.equal(submitted.campaign, 'phone-test');
    assert.equal(submitted.form_version, 'phone_shop_select_v4');
    assert.equal(submitted.email, undefined);
    assert.equal(submitted.requested_platform, undefined);
    assert.equal(await page.locator('#downloadAndroid').getAttribute('href'), '/storesoft/try/?t=ABC234');
    assert.match(await page.locator('#downloadWindows').getAttribute('href'), /storesoft_windows_latest\.exe$/);
    for (const platform of ['android', 'windows']) {
      const link = page.locator(`[data-download-platform="${platform}"]`);
      assert.equal(await link.isVisible(), true);
      const box = await link.boundingBox();
      assert.ok(box.height >= 48 && box.width >= 48);
      assert.equal((await link.getAttribute('class')).includes('primary-cta'), config.platform === platform);
      // Prevent navigation only in QA, while still exercising the real click listener.
      await link.evaluate(element => element.addEventListener('click', event => event.preventDefault(), { once: true }));
      await link.click();
    }
    assert.equal(requests.length, expectedRequests);
    const events = await page.evaluate(() => window.dataLayer);
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.deepEqual(telemetry.filter(event => event.p_event_type === 'DOWNLOAD_CLICKED').map(event => event.p_platform), ['android', 'windows']);
    assert.equal(telemetry.filter(event => event.p_event_type === 'LEAD_SUBMITTED').length, 1);
    assert.doesNotMatch(JSON.stringify(telemetry), /Test Shop|550 12 34 56/);
    assert.equal(events.filter(event => event.event === 'Lead').length, 1);
    assert.deepEqual(events.filter(event => event.event === 'DownloadClicked').map(event => event.platform), ['android', 'windows']);
    assert.doesNotMatch(JSON.stringify(events), /Test Shop|550 12 34 56|ABC234/);
    await page.locator('#languageSwitch').click();
    assert.equal(await page.locator('#successView').isVisible(), true);
    assert.equal(await page.locator('#downloadAndroid').getAttribute('href'), '/storesoft/try/?t=ABC234');
    await page.locator('#languageSwitch').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    assert.deepEqual(errors, []);
    if (process.env.QA_OUTPUT_DIR) {
      await mkdir(process.env.QA_OUTPUT_DIR, { recursive: true });
      await page.locator('#successView').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(process.env.QA_OUTPUT_DIR, `${config.platform}-${config.width}-${config.lang}.png`) });
    }
    console.log(`PASS ${config.width}x${config.height} ${config.platform} ${config.lang}: validation, saved lead, downloads, tracking, no overflow`);
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
