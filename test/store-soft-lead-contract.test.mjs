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

test('lead endpoint supports the simplified email and shop-select form', async () => {
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
  assert.match(edgeFunction, /isEmailShopSelectForm=formVersion==='email_shop_select_v3'/);
  assert.match(edgeFunction, /allowedShopTypes\.has\(shopType\)/);
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

  assert.match(appsScript, /createTextFinder\(String\(leadId\)\)/);
  assert.doesNotMatch(appsScript, /createTextFinder\(String\(lead\.email\)\)/);
  assert.match(appsScript, /'requested_platform'/);
  assert.match(appsScript, /lead\.requested_platform \|\| ''/);
  assert.match(appsScript, /function upsertLead_/);
  assert.match(appsScript, /getRange\(existingRow, 1, 1, row\.length\)\.setValues/);
  assert.match(appsScript, /action === 'send_confirmation'/);
  assert.match(appsScript, /function enableCrmEmailControl\(\)/);
  assert.match(appsScript, /CRM_EMAIL_ENABLED/);
  assert.match(appsScript, /disableStatusEditTrigger_/);
});

test('CRM migration preserves legacy leads and protects tracking data', async () => {
  const [migration, shortReferral] = await Promise.all([
    read('supabase/migrations/20260829153849_store_soft_crm_core.sql'),
    read('supabase/migrations/20260829163153_store_soft_crm_short_referral.sql'),
  ]);
  assert.match(migration, /alter table public\.store_soft_leads/);
  assert.match(migration, /create table if not exists public\.lead_events/);
  assert.match(migration, /FORM_SUBMITTED/);
  assert.match(migration, /tracking_token ~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.match(migration, /revoke all on table public\.lead_events from public, anon, authenticated/);
  assert.match(migration, /perform sync\.require_vendor_admin\(\)/);
  assert.match(shortReferral, /tracking_code ~ '\^\[23456789ABCDEFGHJKLMNPQRSTUVWXYZ\]\{6\}\$'/);
  assert.match(shortReferral, /store_soft_leads_tracking_code_uidx/);
  assert.match(shortReferral, /to_jsonb\(p\) - array\['tracking_token','tracking_code'\]/);
});

test('CRM archive is reversible and permanent deletion requires an archived lead', async () => {
  const [migration, action] = await Promise.all([
    read('supabase/migrations/20260830150000_store_soft_crm_archive.sql'),
    read('supabase/functions/crm-admin-action/index.ts'),
  ]);
  assert.match(migration, /add column if not exists archived_at timestamptz/);
  assert.match(migration, /sync_admin_crm_archived_leads/);
  assert.match(migration, /archive the lead before permanent deletion/);
  assert.match(migration, /lead name confirmation does not match/);
  assert.match(migration, /where archived_at is null/);
  assert.match(migration, /jsonb_build_object\('tracked_url', 'https:\/\/yousoft\.site\/storesoft\/try\/\?t=' \|\| p\.tracking_code\)/);
  assert.match(migration, /perform sync\.require_vendor_admin\(\)/);
  assert.match(migration, /from public, anon/);
  assert.match(action, /'ARCHIVE'/);
  assert.match(action, /'RESTORE'/);
  assert.match(action, /'DELETE_PERMANENTLY'/);
});

test('public tracking accepts only six-character codes and allowlisted app events', async () => {
  const [record, redirect, tryPage, tryScript] = await Promise.all([
    read('supabase/functions/record-store-soft-lead-event/index.ts'),
    read('supabase/functions/store-soft-play-redirect/index.ts'),
    read('storesoft/try/index.html'), read('storesoft/try/script.js'),
  ]);
  assert.match(record, /APP_FIRST_OPEN/);
  assert.doesNotMatch(record, /QUALIFIED.*EVENT_TYPES|PURCHASED.*EVENT_TYPES|LOST.*EVENT_TYPES/);
  assert.match(record, /METADATA_KEYS/);
  assert.match(record, /body\.code/);
  assert.match(redirect, /encodeURIComponent\(code\)/);
  assert.doesNotMatch(redirect, /storesoft_lead_token/);
  assert.match(redirect, /status: 302/);
  assert.doesNotMatch(redirect, /name|phone|email/);
  assert.match(tryPage, /noindex,nofollow/);
  assert.match(tryScript, /\^\[23456789ABCDEFGHJKLMNPQRSTUVWXYZ\]\{6\}\$/);
});

test('confirmation email is authenticated, repeatable, counted, and uses branded tracked URL', async () => {
  const [action, appsScript, migration] = await Promise.all([
    read('supabase/functions/crm-admin-action/index.ts'), read('google-apps-script/Code.gs'),
    read('supabase/migrations/20260830142229_store_soft_crm_repeat_email.sql'),
  ]);
  assert.match(action, /sync_admin_crm_apply_action/);
  assert.match(action, /sync_admin_crm_record_email_sent/);
  assert.match(action, /action: 'send_confirmation'/);
  assert.match(action, /action === 'CONFIRM'/);
  assert.match(action, /warning: 'email_delivery_failed'/);
  assert.match(action, /origin === 'null'/);
  assert.match(action, /localhost\|127\\\.0\\\.0\\\.1/);
  assert.doesNotMatch(action, /if \(lead\.email_sent_at\) return/);
  assert.doesNotMatch(action, /already_sent: true/);
  assert.doesNotMatch(appsScript, /if \(sentCell\.getValue\(\)\) return/);
  assert.match(appsScript, /email_sent: true/);
  assert.match(appsScript, /storesoft\\\/try/);
  assert.match(appsScript, /sendConfirmedEmail_\(email, name, trackedUrl\)/);
  assert.match(appsScript, /حمّل Store Soft من Google Play/);
  assert.match(appsScript, /https:\/\/wa\.me\/213654338649/);
  assert.match(appsScript, /تواصل معنا عبر واتساب/);
  assert.match(migration, /email_sent_count = email_sent_count \+ 1/);
  assert.match(migration, /email_sent_at = coalesce\(email_sent_at, v_now\)/);
  assert.match(migration, /email_last_sent_at = v_now/);
  assert.match(migration, /perform sync\.require_vendor_admin\(\)/);
  assert.match(migration, /from public, anon/);
  assert.match(migration, /to authenticated, service_role/);
});

test('Sheet delivery never receives the CRM tracking token', async () => {
  const edgeFunction = await read('supabase/functions/submit-store-soft-lead/index.ts');
  assert.match(edgeFunction, /const sheetLead=\{id:lead\.id/);
  assert.match(
    edgeFunction,
    /EdgeRuntime\.waitUntil\(syncToSheet\(sheetLead\)\.catch/,
  );
  assert.doesNotMatch(edgeFunction, /await syncToSheet\(sheetLead\)/);
  const sheetPayload = edgeFunction.match(/const sheetLead=\{([^}]+)\}/)?.[1] || '';
  assert.doesNotMatch(sheetPayload, /tracking_token/);
});

test('every stored submission emits its own Meta Lead event', async () => {
  const landingScript = await read('storesoft/download/script.js');

  assert.doesNotMatch(landingScript, /submissionTracked/);
  assert.match(
    landingScript,
    /trackEvent\('Lead', \{ content_name: 'Store Soft download request' \}, true\)/,
  );
});

test('landing form asks only for name, selected shop type, and email', async () => {
  const landingPage = await read('storesoft/download/index.html');

  assert.match(landingPage, /id="name" name="name" type="text"/);
  assert.match(landingPage, /<select id="shopType" name="shop_type" required>/);
  assert.match(landingPage, /id="email" name="email" type="email"[^>]*required/);
  assert.match(landingPage, /value="grocery"/);
  assert.match(landingPage, /value="clothing"/);
  assert.match(landingPage, /value="cosmetics"/);
  assert.match(landingPage, /value="spare_parts"/);
  assert.match(landingPage, /value="repair_shop"/);
  assert.match(landingPage, /value="other"/);
  assert.doesNotMatch(landingPage, /id="phone"|id="requestedPlatform"/);
  assert.ok(landingPage.indexOf('id="name"') < landingPage.indexOf('id="shopType"'));
  assert.ok(landingPage.indexOf('id="shopType"') < landingPage.indexOf('id="email"'));

  const landingScript = await read('storesoft/download/script.js');
  assert.match(landingScript, /email: String\(data\.get\('email'\)/);
  assert.match(landingScript, /form_version: 'email_shop_select_v3'/);
  assert.match(landingScript, /isValidEmail\(values\.email\)/);
  assert.doesNotMatch(landingScript, /data\.get\('phone'\)|data\.get\('requested_platform'\)/);
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
