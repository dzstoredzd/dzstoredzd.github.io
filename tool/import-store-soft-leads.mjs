#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';

const USAGE = `Usage:
  node tool/import-store-soft-leads.mjs <sheet.csv> [--output report.json]
  node tool/import-store-soft-leads.mjs <sheet.csv> --apply [--output report.json]

Dry-run is the default. --apply requires SUPABASE_URL and
SUPABASE_SERVICE_ROLE_KEY and only reconciles Sheet delivery fields for
unambiguous matches; it never changes CRM stages, events, notes, or contact data.`;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(USAGE);
  process.exit(args.length === 0 ? 1 : 0);
}
const apply = args.includes('--apply');
const positional = args.filter((value, index) =>
  !value.startsWith('--') && args[index - 1] !== '--output');
const csvPath = positional[0];
const outputAt = args.indexOf('--output');
const outputPath = outputAt >= 0 ? args[outputAt + 1] : null;
if (!csvPath || (outputAt >= 0 && !outputPath)) {
  console.error(USAGE);
  process.exit(1);
}

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseUrl || !serviceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error('CSV has an unterminated quoted field');
  row.push(cell.replace(/\r$/, ''));
  if (row.some((value) => value !== '')) rows.push(row);
  return rows;
}

function key(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

const aliases = {
  id: ['leadid', 'id'],
  createdAt: ['createdat', 'timestamp', 'submittedat', 'date'],
  email: ['email', 'emailaddress'],
  phone: ['phone', 'phonewhatsapp', 'whatsapp', 'phonenumber'],
  sheetStatus: ['sheetsyncstatus', 'syncstatus'],
  sheetSyncedAt: ['sheetsyncedat', 'syncedat'],
};

function cellFor(record, name) {
  for (const alias of aliases[name]) {
    if (record[alias] != null) return String(record[alias]).trim();
  }
  return '';
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function normalizePhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00213')) digits = digits.slice(2);
  if (/^0[567]\d{8}$/.test(digits)) digits = `213${digits.slice(1)}`;
  if (/^[567]\d{8}$/.test(digits)) digits = `213${digits}`;
  return digits;
}

function parseTime(value) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function rest(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  }
  return response;
}

async function loadLeads() {
  const leads = [];
  for (let offset = 0; ; offset += 1000) {
    const query = new URLSearchParams({
      select: 'id,created_at,email,phone,sheet_sync_status,sheet_synced_at',
      order: 'created_at.asc',
      offset: String(offset),
      limit: '1000',
    });
    const page = await (await rest(`store_soft_leads?${query}`)).json();
    leads.push(...page);
    if (page.length < 1000) return leads;
  }
}

function matchRow(source, leadsById, leads) {
  const suppliedId = cellFor(source, 'id').toLowerCase();
  if (suppliedId) {
    const direct = leadsById.get(suppliedId);
    return direct
      ? { kind: 'lead_id', lead: direct }
      : { kind: 'unmatched', reason: 'lead_id_not_found' };
  }

  const email = normalizeEmail(cellFor(source, 'email'));
  const phone = normalizePhone(cellFor(source, 'phone'));
  const occurredAt = parseTime(cellFor(source, 'createdAt'));
  if ((!email && !phone) || occurredAt == null) {
    return { kind: 'unmatched', reason: 'contact_and_valid_timestamp_required' };
  }

  const windowMs = 15 * 60 * 1000;
  const candidates = leads
    .map((lead) => {
      const emailMatch = Boolean(email) && normalizeEmail(lead.email || '') === email;
      const phoneMatch = Boolean(phone) && normalizePhone(lead.phone || '') === phone;
      const time = parseTime(lead.created_at);
      const inWindow = time != null && Math.abs(time - occurredAt) <= windowMs;
      return { lead, score: Number(emailMatch) + Number(phoneMatch), inWindow };
    })
    .filter((candidate) => candidate.inWindow && candidate.score > 0);
  if (candidates.length === 0) {
    return { kind: 'unmatched', reason: 'no_contact_match_within_15_minutes' };
  }
  const bestScore = Math.max(...candidates.map((candidate) => candidate.score));
  const best = candidates.filter((candidate) => candidate.score === bestScore);
  if (best.length !== 1) {
    return {
      kind: 'ambiguous',
      reason: 'multiple_best_matches',
      candidate_lead_ids: best.map((candidate) => candidate.lead.id),
    };
  }
  return { kind: 'contact_timestamp', lead: best[0].lead };
}

function proposedSheetPatch(source, lead) {
  const sourceStatus = cellFor(source, 'sheetStatus').toLowerCase();
  const sourceTime = cellFor(source, 'sheetSyncedAt');
  const validTime = parseTime(sourceTime) != null ? new Date(sourceTime).toISOString() : null;
  const patch = {};
  if (sourceStatus === 'synced' && lead.sheet_sync_status !== 'synced') {
    patch.sheet_sync_status = 'synced';
    patch.sheet_sync_error = null;
  }
  if (validTime && !lead.sheet_synced_at) patch.sheet_synced_at = validTime;
  return patch;
}

const table = parseCsv(await readFile(csvPath, 'utf8'));
if (table.length < 2) throw new Error('CSV must contain a header and at least one data row');
const headers = table[0].map(key);
const sourceRows = table.slice(1).map((values, index) => ({
  row_number: index + 2,
  ...Object.fromEntries(headers.map((header, column) => [header, values[column] || ''])),
}));
const leads = await loadLeads();
const leadsById = new Map(leads.map((lead) => [lead.id.toLowerCase(), lead]));
const report = {
  mode: apply ? 'apply' : 'dry-run',
  generated_at: new Date().toISOString(),
  csv_rows: sourceRows.length,
  database_leads: leads.length,
  matched_by_lead_id: 0,
  matched_by_contact_timestamp: 0,
  unchanged: 0,
  applied: 0,
  ambiguous: [],
  unmatched: [],
  proposed: [],
};

for (const source of sourceRows) {
  const match = matchRow(source, leadsById, leads);
  if (match.kind === 'unmatched') {
    report.unmatched.push({ row_number: source.row_number, reason: match.reason });
    continue;
  }
  if (match.kind === 'ambiguous') {
    report.ambiguous.push({ row_number: source.row_number, ...match });
    continue;
  }
  if (match.kind === 'lead_id') report.matched_by_lead_id += 1;
  else report.matched_by_contact_timestamp += 1;
  const patch = proposedSheetPatch(source, match.lead);
  if (Object.keys(patch).length === 0) {
    report.unchanged += 1;
    continue;
  }
  report.proposed.push({
    row_number: source.row_number,
    match: match.kind,
    lead_id: match.lead.id,
    patch,
  });
  if (apply) {
    await rest(`store_soft_leads?id=eq.${encodeURIComponent(match.lead.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
    report.applied += 1;
  }
}

if (outputPath) await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.ambiguous.length > 0) process.exitCode = 2;
