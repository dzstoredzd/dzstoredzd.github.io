const EVENT_TYPES = new Set([
  'APP_FIRST_OPEN', 'STORE_CREATED', 'PRODUCT_CREATED', 'FIRST_SALE',
  'SYNC_ENABLED', 'USER_ADDED',
]);
const REFERRAL_CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const METADATA_KEYS = new Set(['app_version', 'platform', 'source', 'occurred_offline']);

function secretKey() {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modern) return JSON.parse(modern).default as string;
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}

function response(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function metadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const clean: Record<string, string | boolean> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!METADATA_KEYS.has(key)) throw new Error('metadata_not_allowed');
    if (typeof item === 'boolean') clean[key] = item;
    else if (typeof item === 'string') clean[key] = item.slice(0, 80);
    else throw new Error('metadata_not_allowed');
  }
  return clean;
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return response({ ok: false, error: 'method_not_allowed' }, 405);
  if (Number(request.headers.get('Content-Length') || 0) > 4096) return response({ ok: false, error: 'payload_too_large' }, 413);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch (_) { return response({ ok: false, error: 'invalid_json' }, 400); }
  const code = String(body.code || '').trim().toUpperCase();
  const eventId = String(body.event_id || '').trim();
  const eventType = String(body.event_type || '').trim().toUpperCase();
  const occurredAt = String(body.occurred_at || '').trim();
  if (!REFERRAL_CODE.test(code) || !UUID.test(eventId) || !EVENT_TYPES.has(eventType) || !Number.isFinite(Date.parse(occurredAt))) {
    return response({ ok: false, error: 'invalid_event' }, 422);
  }
  let safeMetadata: Record<string, string | boolean>;
  try { safeMetadata = metadata(body.metadata); } catch (_) { return response({ ok: false, error: 'invalid_metadata' }, 422); }
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = secretKey();
  if (!url || !key) return response({ ok: false, error: 'server_configuration' }, 500);
  const database = await fetch(`${url}/rest/v1/rpc/record_store_soft_lead_event`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_tracking_token: code, p_event_id: eventId, p_event_type: eventType, p_occurred_at: occurredAt, p_metadata: safeMetadata }),
  });
  if (!database.ok) {
    console.error('Lead event RPC failed', database.status, await database.text());
    return response({ ok: false, error: 'storage_failed' }, 503);
  }
  // Deliberately do not reveal whether the opaque referral code matched a lead.
  return response({ ok: true });
});
