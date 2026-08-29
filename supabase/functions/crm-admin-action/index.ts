const ACTIONS = new Set(['CONFIRM', 'MARK_CONTACTED', 'MARK_REPLIED', 'MARK_QUALIFIED', 'MARK_CUSTOMER', 'MARK_LOST', 'ADD_NOTE', 'SET_FOLLOWUP', 'RETRY_EMAIL']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function publishableKey() {
  const modern = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (modern) return JSON.parse(modern).default as string;
  return Deno.env.get('SUPABASE_ANON_KEY') || '';
}
function cors(origin: string | null) {
  const allowed = origin === 'https://yousoft.site' || origin === 'https://www.yousoft.site' ? origin : 'https://yousoft.site';
  return { 'Access-Control-Allow-Origin': allowed, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' };
}
function json(body: unknown, status: number, origin: string | null) {
  return Response.json(body, { status, headers: { ...cors(origin), 'Cache-Control': 'no-store' } });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405, origin);
  const authorization = request.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return json({ ok: false, error: 'unauthorized' }, 401, origin);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch (_) { return json({ ok: false, error: 'invalid_json' }, 400, origin); }
  const leadId = String(body.lead_id || '');
  const action = String(body.action || '').toUpperCase();
  if (!UUID.test(leadId) || !ACTIONS.has(action)) return json({ ok: false, error: 'invalid_action' }, 422, origin);
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = publishableKey();
  const call = async (rpcAction: string, note: unknown = body.note) => {
    const result = await fetch(`${url}/rest/v1/rpc/sync_admin_crm_apply_action`, {
      method: 'POST', headers: { apikey: key, Authorization: authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_lead: leadId, p_action: rpcAction, p_note: note || null, p_followup_at: body.next_followup_at || null, p_purchase_amount_centimes: body.purchase_amount_centimes ?? null }),
    });
    const payload = await result.json().catch(() => ({}));
    if (!result.ok) throw Object.assign(new Error(result.status === 403 ? 'not_admin' : 'database_action_failed'), { status: result.status, detail: payload });
    return payload;
  };
  let lead: Record<string, unknown>;
  try { lead = await call(action); }
  catch (error) { const value = error as { status?: number; message?: string }; return json({ ok: false, error: value.message }, value.status === 403 ? 403 : 400, origin); }
  if (!['CONFIRM', 'RETRY_EMAIL'].includes(action)) return json({ ok: true, lead }, 200, origin);
  if (lead.email_sent_at) return json({ ok: true, lead, email_sent: true, already_sent: true }, 200, origin);
  if (!lead.email) {
    await call('EMAIL_ERROR', 'No email; contact by phone or WhatsApp');
    return json({ ok: true, lead, email_sent: false, warning: 'no_email' }, 200, origin);
  }
  const webhook = Deno.env.get('GOOGLE_SHEETS_WEBHOOK_URL');
  const secret = Deno.env.get('GOOGLE_SHEETS_WEBHOOK_SECRET');
  if (!webhook || !secret) {
    await call('EMAIL_ERROR', 'Confirmation sender is not configured');
    return json({ ok: false, error: 'email_sender_not_configured' }, 503, origin);
  }
  try {
    const sent = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', body: JSON.stringify({ secret, action: 'send_confirmation', lead }) });
    const result = await sent.json().catch(() => ({}));
    if (!sent.ok || result.ok !== true) throw new Error(String(result.error || `Sender returned ${sent.status}`));
    lead = await call('EMAIL_SENT');
    return json({ ok: true, lead, email_sent: true, already_sent: result.already_sent === true }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : 'Email delivery failed';
    await call('EMAIL_ERROR', message);
    return json({ ok: false, error: 'email_delivery_failed' }, 502, origin);
  }
});
