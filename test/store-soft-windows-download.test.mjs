import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../storesoft/download/windows-download.js', import.meta.url), 'utf8');
const fallback = 'https://github.com/dzstoredzd/dz-store-releases/releases/latest';
const installer = 'https://github.com/dzstoredzd/dz-store-releases/releases/download/build-999/StoreSoft-9.0.0-999.exe';
const valid = { channel: 'stable', environment: 'production', productionEligible: true, downloadUrl: installer };

function setup(fetch) {
  const window = {};
  vm.runInNewContext(source, { window, fetch, AbortController, setTimeout, clearTimeout });
  return window.StoreSoftWindowsDownload;
}

test('future stable release filenames are used without a website edit', async () => {
  const link = {};
  const app = setup(async (url, options) => {
    assert.equal(url, 'https://raw.githubusercontent.com/dzstoredzd/dz-store-releases/main/storesoft/stable/latest.json');
    assert.equal(options.cache, 'no-store');
    return Response.json(valid);
  });
  await app.update(link);
  assert.equal(link.href, installer);
});

test('pending feed immediately provides a usable fallback', async () => {
  let resolve;
  const app = setup(() => new Promise(done => { resolve = done; }));
  const link = {};
  const pending = app.update(link);
  assert.equal(link.href, fallback);
  resolve(Response.json(valid));
  await pending;
  assert.equal(link.href, installer);
});

test('network, HTTP and JSON failures retain the latest release page', async () => {
  for (const fetch of [async () => { throw new Error('offline'); }, async () => new Response('', { status: 404 }), async () => new Response('invalid')]) {
    const link = {};
    await setup(fetch).update(link);
    assert.equal(link.href, fallback);
  }
});

test('Beta, ineligible and unexpected installer URLs are rejected', async () => {
  for (const changes of [
    { channel: 'beta' }, { environment: 'staging' }, { productionEligible: false },
    { downloadUrl: 'https://evil.invalid/app.exe' },
    { downloadUrl: installer + '?redirect=evil' },
    { downloadUrl: installer.replace('https:', 'http:') },
    { downloadUrl: installer.replace('.exe', '.zip') }, { downloadUrl: null }
  ]) {
    const link = {};
    await setup(async () => Response.json({ ...valid, ...changes })).update(link);
    assert.equal(link.href, fallback);
  }
});
