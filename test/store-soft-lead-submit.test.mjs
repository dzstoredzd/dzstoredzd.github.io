import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';

const source = stripTypeScriptTypes(await readFile(new URL('../supabase/functions/submit-store-soft-lead/index.ts', import.meta.url), 'utf8'));
const valid = () => ({ name: 'Test Shop', phone: '+213 550 12 34 56', shop_type: 'grocery', form_version: 'phone_shop_select_v4', form_started_at: Date.now() - 2000, language: 'ar' });

function endpoint({ storageFails = false, pendingSheet = false } = {}) {
  const inserted = [];
  const background = [];
  let handler;
  vm.runInNewContext(source, {
    Request, Response, console: { error() {} },
    Deno: {
      serve(fn) { handler = fn; },
      env: { get(key) { return { SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-secret', GOOGLE_SHEETS_WEBHOOK_URL: 'https://sheet.invalid', GOOGLE_SHEETS_WEBHOOK_SECRET: 'test-sheet' }[key]; } },
    },
    EdgeRuntime: { waitUntil(task) { background.push(task); } },
    async fetch(url, init) {
      if (url === 'https://test.invalid/rest/v1/store_soft_leads') {
        if (storageFails) return new Response('failed', { status: 500 });
        const row = JSON.parse(init.body);
        inserted.push(row);
        return Response.json([{ ...row, id: `lead-${inserted.length}`, tracking_code: 'ABC234', tracking_token: 'private-token' }]);
      }
      if (url === 'https://sheet.invalid') return pendingSheet ? new Promise(() => {}) : Response.json({ ok: true });
      return new Response(null, { status: 204 });
    },
  });
  return {
    inserted, background,
    submit(body, origin = 'https://yousoft.site') {
      return handler(new Request('https://test.invalid/submit', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
    },
  };
}

test('phone-only submission stores attribution and returns only the public referral code', async () => {
  const app = endpoint();
  const attribution = { source: 'facebook', medium: 'paid', campaign: 'launch', content: 'video', term: 'shop', referrer: 'https://facebook.com/', landing_page: 'https://yousoft.site/storesoft/download/?utm_source=facebook' };
  const response = await app.submit({ ...valid(), ...attribution });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, lead_id: 'lead-1', tracking_code: 'ABC234' });
  assert.equal(app.inserted[0].phone, '+213 550 12 34 56');
  assert.equal(app.inserted[0].email, null);
  assert.equal(app.inserted[0].requested_platform, null);
  for (const [key, value] of Object.entries(attribution)) assert.equal(app.inserted[0][key], value);
});

test('phone form rejects missing/invalid contacts and activity before writing', async () => {
  const app = endpoint();
  for (const invalid of [{ phone: '' }, { phone: '123' }, { phone: 'abc0550123456' }, { phone: '1234567890123456' }, { shop_type: '' }, { shop_type: 'unapproved' }, { requested_platform: 'invalid' }, { name: 'A' }]) {
    assert.equal((await app.submit({ ...valid(), ...invalid })).status, 422, JSON.stringify(invalid));
  }
  assert.equal(app.inserted.length, 0);
});

test('cached email and phone/platform forms still work', async () => {
  const app = endpoint();
  for (const legacy of [
    { form_version: 'email_shop_select_v3', email: 'shop@example.com', phone: '' },
    { form_version: 'contact_email_v2', email: 'shop@example.com', phone: '', shop_type: 'Custom activity' },
    { form_version: '', email: 'shop@example.com', phone: '' },
    { form_version: '', phone: '0550123456', requested_platform: 'both', shop_type: 'Custom activity' },
  ]) assert.equal((await app.submit({ ...valid(), ...legacy })).status, 200);
  assert.equal(app.inserted.length, 4);
  assert.equal((await app.submit({ ...valid(), form_version: 'email_shop_select_v3' })).status, 422);
});

test('durable insert responds while Sheet delivery remains pending', async () => {
  const app = endpoint({ pendingSheet: true });
  const response = await app.submit(valid());
  assert.equal(response.status, 200);
  assert.equal(app.inserted.length, 1);
  assert.equal(app.background.length, 1);
});

test('storage failure never returns a successful download response', async () => {
  const app = endpoint({ storageFails: true });
  const response = await app.submit(valid());
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { ok: false, error: 'storage_failed' });
  assert.equal(app.background.length, 0);
});

test('origin, honeypot and timing protections remain in place', async () => {
  const app = endpoint();
  assert.equal((await app.submit(valid(), 'https://untrusted.invalid')).status, 403);
  assert.equal((await app.submit({ ...valid(), form_started_at: Date.now() })).status, 400);
  assert.deepEqual(await (await app.submit({ ...valid(), website: 'spam' })).json(), { ok: true });
  assert.equal(app.inserted.length, 0);
});

test('separate legitimate submissions retain separate leads', async () => {
  const app = endpoint();
  const first = await (await app.submit(valid())).json();
  const second = await (await app.submit(valid())).json();
  assert.notEqual(first.lead_id, second.lead_id);
});
