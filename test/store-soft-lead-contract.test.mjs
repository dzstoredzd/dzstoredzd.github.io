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

test('Google Sheets deduplicates by submission id, not email', async () => {
  const appsScript = await read('google-apps-script/Code.gs');

  assert.match(appsScript, /createTextFinder\(String\(lead\.id\)\)/);
  assert.doesNotMatch(appsScript, /createTextFinder\(String\(lead\.email\)\)/);
});

test('every stored submission emits its own Meta Lead event', async () => {
  const landingScript = await read('storesoft/download/script.js');

  assert.doesNotMatch(landingScript, /submissionTracked/);
  assert.match(
    landingScript,
    /trackEvent\('Lead', \{ content_name: 'Store Soft download request' \}, true\)/,
  );
});

test('successful submissions offer the localized Store Soft learning playlist', async () => {
  const [landingPage, landingScript, landingStyles] = await Promise.all([
    read('storesoft/download/index.html'),
    read('storesoft/download/script.js'),
    read('storesoft/download/styles.css'),
  ]);

  assert.match(
    landingPage,
    /id="successView"[\s\S]*href="https:\/\/www\.youtube\.com\/playlist\?list=PLZCuVpkDZZFE"/,
  );
  assert.match(landingPage, /target="_blank" rel="noopener noreferrer"/);
  assert.match(landingScript, /learningWait: 'يمكنك مشاهدة فيديوهات الشرح حتى يصلك البريد.'/);
  assert.match(landingScript, /learningWait: 'Vous pouvez regarder nos vidéos de formation en attendant l’e-mail.'/);
  assert.match(landingStyles, /\.success__learning a \{[^}]*min-height: 48px/);
});
