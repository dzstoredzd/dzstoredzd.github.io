import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(path.join(root, relativePath), 'utf8');

test('every valid submission is inserted as a separate lead', async () => {
  const edgeFunction = await read(
    'supabase/functions/submit-store-soft-lead/index.ts',
  );

  assert.match(edgeFunction, /rest\('store_soft_leads',\{method:'POST'/);
  assert.doesNotMatch(edgeFunction, /inserted\.status===409/);
  assert.doesNotMatch(edgeFunction, /email_normalized=eq\./);
  assert.match(edgeFunction, /return json\(\{ok:true,lead_id:lead\.id\},200,origin\)/);
});

test('lead endpoint requires email for the versioned contact form', async () => {
  const edgeFunction = await read(
    'supabase/functions/submit-store-soft-lead/index.ts',
  );

  assert.match(edgeFunction, /clean\(body\.shop_type,100\)/);
  assert.match(edgeFunction, /clean\(body\.phone,24\)/);
  assert.match(edgeFunction, /clean\(body\.requested_platform,20\)/);
  assert.match(edgeFunction, /allowedPlatforms\.has\(requestedPlatform\)/);
  assert.match(edgeFunction, /requested_platform:requestedPlatform\|\|null/);
  assert.match(edgeFunction, /isLegacyEmailLead/);
  assert.match(edgeFunction, /formVersion=clean\(body\.form_version,40\)/);
  assert.match(edgeFunction, /requiresEmail=formVersion==='contact_email_v2'/);
  assert.match(edgeFunction, /requiresEmail&&!email/);
});

test('migration allows repeated normalized emails', async () => {
  const migration = await read(
    'supabase/migrations/20260823170553_allow_duplicate_store_soft_lead_emails.sql',
  );

  assert.match(
    migration,
    /drop constraint if exists store_soft_leads_email_normalized_key/,
  );
  assert.match(migration, /duplicate values are allowed/);
});

test('migration stores free-text activity and requested platform without requiring email', async () => {
  const migration = await read(
    'supabase/migrations/20260829140453_update_store_soft_lead_contact_form.sql',
  );

  assert.match(migration, /alter column email drop not null/);
  assert.match(migration, /char_length\(btrim\(shop_type\)\) between 2 and 100/);
  assert.match(migration, /add column if not exists requested_platform text/);
  assert.match(migration, /requested_platform in \('phone', 'computer', 'both'\)/);
});

test('Google Sheets deduplicates by submission id, not email', async () => {
  const appsScript = await read('google-apps-script/Code.gs');

  assert.match(appsScript, /createTextFinder\(String\(lead\.id\)\)/);
  assert.doesNotMatch(appsScript, /createTextFinder\(String\(lead\.email\)\)/);
  assert.match(appsScript, /'requested_platform'/);
  assert.match(appsScript, /lead\.requested_platform \|\| ''/);
});

test('every stored submission emits its own Meta Lead event', async () => {
  const landingScript = await read('storesoft/download/script.js');

  assert.doesNotMatch(landingScript, /submissionTracked/);
  assert.match(
    landingScript,
    /trackEvent\('Lead', \{ content_name: 'Store Soft download request' \}, true\)/,
  );
});

test('landing form asks for five contact fields with email after phone', async () => {
  const landingPage = await read('storesoft/download/index.html');

  assert.match(landingPage, /id="name" name="name" type="text"/);
  assert.match(landingPage, /id="shopType" name="shop_type" type="text"/);
  assert.match(landingPage, /id="phone" name="phone" type="tel"/);
  assert.match(landingPage, /id="email" name="email" type="email"[^>]*required/);
  assert.match(landingPage, /id="requestedPlatform" name="requested_platform"/);
  assert.match(landingPage, /value="phone"/);
  assert.match(landingPage, /value="computer"/);
  assert.match(landingPage, /value="both"/);
  assert.ok(landingPage.indexOf('id="phone"') < landingPage.indexOf('id="email"'));
  assert.ok(landingPage.indexOf('id="email"') < landingPage.indexOf('id="requestedPlatform"'));
  assert.doesNotMatch(landingPage, /<select id="shopType"/);

  const landingScript = await read('storesoft/download/script.js');
  assert.match(landingScript, /email: String\(data\.get\('email'\)/);
  assert.match(landingScript, /form_version: 'contact_email_v2'/);
  assert.match(landingScript, /isValidEmail\(values\.email\)/);
});

test('successful submissions offer localized WhatsApp contact instead of YouTube', async () => {
  const [landingPage, landingScript, landingStyles] = await Promise.all([
    read('storesoft/download/index.html'),
    read('storesoft/download/script.js'),
    read('storesoft/download/styles.css'),
  ]);

  const successBlock = landingPage.match(/id="successView"[\s\S]*?<\/aside>/)?.[0] || '';

  assert.match(successBlock, /href="https:\/\/wa\.me\/213654338649\?text=I%20want%20to%20know%20more%20about%20storesoft"/);
  assert.match(landingPage, /target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(successBlock, /youtube\.com|YouTube/);
  assert.match(landingScript, /contactWhatsApp: 'تواصل معنا على WhatsApp'/);
  assert.match(landingScript, /contactWhatsApp: 'Nous contacter sur WhatsApp'/);
  assert.match(landingStyles, /\.success__contact a \{[^}]*min-height: 48px/);
});
