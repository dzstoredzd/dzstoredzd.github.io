import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFile(path.join(root, relative), 'utf8');

test('public trial claims and share metadata use fourteen days in every language', async () => {
  for (const file of ['index.html', 'home.js', 'storesoft/download/index.html', 'storesoft/download/script.js']) {
    const text = await read(file);
    assert.doesNotMatch(text, /\b7[- ]days?\b|\b7 jours\b|7 أيام|7 DAYS/, file);
    assert.match(text, /14 (?:يومًا|jours|DAYS)/, file);
  }
});

test('policy and deletion explanations support identifiable CRM records without Sync', async () => {
  const privacy = await read('privacy.html');
  const deletion = await read('delete-account.html');
  assert.doesNotMatch(privacy, /add the email[\s\S]{0,80}Google Play test/);
  assert.doesNotMatch(deletion, /nothing of yours is stored on our servers|cannot be found and removed|These carry no name, email/);
  for (const text of [privacy, deletion]) {
    assert.match(text, /Google Sheet/);
    assert.match(text, /(?:without (?:having )?a Sync account|without a cloud account)/);
    assert.match(text, /linked/);
  }
  // Existing in-app links and policy anchors continue to resolve after rewriting sections.
  for (const [file, fragments] of [['privacy.html', ['analytics', 'sync', 'google', 'retention', 'limited-use']], ['delete-account.html', ['request', 'local', 'in-app', 'backups']]]) {
    const text = await read(file);
    for (const id of fragments) assert.match(text, new RegExp(`id="${id}"`));
  }
});
