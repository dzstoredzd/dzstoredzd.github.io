const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.yousoft.storesoft';
const REFERRAL_CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;

function secretKey() {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modern) return JSON.parse(modern).default as string;
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}

function redirect(location: string) {
  return new Response(null, { status: 302, headers: { Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}

Deno.serve(async (request: Request) => {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
  const code = new URL(request.url).searchParams.get('t')?.trim().toUpperCase() || '';
  if (!REFERRAL_CODE.test(code)) return redirect(PLAY_URL);
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = secretKey();
  try {
    const database = await fetch(`${url}/rest/v1/rpc/record_store_soft_lead_event`, {
      method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_tracking_token: code, p_event_id: crypto.randomUUID(), p_event_type: 'PLAYSTORE_CLICKED', p_occurred_at: new Date().toISOString(), p_metadata: {} }),
    });
    const matched = database.ok && await database.json().catch(() => false) === true;
    if (matched) return redirect(`${PLAY_URL}&referrer=${encodeURIComponent(code)}`);
  } catch (error) { console.error('Play tracking failed', error); }
  return redirect(PLAY_URL);
});
