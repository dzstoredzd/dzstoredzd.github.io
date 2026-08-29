-- Follow-up to the live CRM core migration.
-- Advances contacted/replied leads on Play click and preserves an existing
-- purchase amount when an idempotent Customer action omits it.

create or replace function public.record_store_soft_lead_event(
  p_tracking_token text,
  p_event_id uuid,
  p_event_type text,
  p_occurred_at timestamptz default now(),
  p_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead public.store_soft_leads%rowtype;
  v_event text := upper(coalesce(p_event_type, ''));
  v_time timestamptz := least(coalesce(p_occurred_at, now()), now() + interval '5 minutes');
  v_row_count integer := 0;
begin
  if p_tracking_token !~ '^[0-9a-f]{64}$'
     or v_event not in ('PLAYSTORE_CLICKED', 'APP_FIRST_OPEN', 'STORE_CREATED',
       'PRODUCT_CREATED', 'FIRST_SALE', 'SYNC_ENABLED', 'USER_ADDED')
     or jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) <> 'object'
     or (coalesce(p_metadata, '{}'::jsonb)
       - array['app_version','platform','source','occurred_offline']) <> '{}'::jsonb
     or pg_column_size(coalesce(p_metadata, '{}'::jsonb)) > 2048 then
    return false;
  end if;

  select * into v_lead
  from public.store_soft_leads
  where tracking_token = p_tracking_token
  for update;
  if not found then return false; end if;

  insert into public.lead_events (id, lead_id, event_type, occurred_at, metadata)
  values (p_event_id, v_lead.id, v_event, v_time, coalesce(p_metadata, '{}'::jsonb))
  on conflict do nothing;
  get diagnostics v_row_count = row_count;
  if v_row_count = 0 then return true; end if;

  update public.store_soft_leads
  set
    trial_started_at = case when v_event = 'APP_FIRST_OPEN'
      then coalesce(trial_started_at, v_time) else trial_started_at end,
    first_product_at = case when v_event = 'PRODUCT_CREATED'
      then coalesce(first_product_at, v_time) else first_product_at end,
    first_sale_at = case when v_event = 'FIRST_SALE'
      then coalesce(first_sale_at, v_time) else first_sale_at end,
    lead_stage = case
      when lead_stage in ('CUSTOMER', 'LOST') then lead_stage
      when v_event = 'PLAYSTORE_CLICKED'
        and lead_stage in ('NEW', 'CONTACTED', 'REPLIED') then 'PLAYSTORE_CLICKED'
      when v_event = 'APP_FIRST_OPEN'
        and lead_stage in ('NEW', 'CONTACTED', 'REPLIED', 'PLAYSTORE_CLICKED') then 'TRIAL_STARTED'
      when v_event in ('PRODUCT_CREATED', 'FIRST_SALE')
        and lead_stage <> 'QUALIFIED' then 'ACTIVE_TRIAL'
      else lead_stage
    end,
    last_activity_at = greatest(last_activity_at, v_time),
    updated_at = now()
  where id = v_lead.id;

  if v_event in ('PRODUCT_CREATED', 'FIRST_SALE')
     and exists (select 1 from public.lead_events where lead_id = v_lead.id and event_type = 'PRODUCT_CREATED')
     and exists (select 1 from public.lead_events where lead_id = v_lead.id and event_type = 'FIRST_SALE') then
    insert into public.lead_events (lead_id, event_type, occurred_at, metadata)
    values (v_lead.id, 'QUALIFIED', v_time, jsonb_build_object('automatic', true))
    on conflict (lead_id, event_type)
      where event_type in ('FORM_SUBMITTED', 'CONFIRMED', 'PLAYSTORE_CLICKED',
        'APP_FIRST_OPEN', 'STORE_CREATED', 'PRODUCT_CREATED', 'FIRST_SALE',
        'SYNC_ENABLED', 'QUALIFIED', 'PURCHASED', 'LOST', 'EMAIL_SENT')
    do nothing;
    update public.store_soft_leads
    set lead_stage = case when lead_stage in ('CUSTOMER', 'LOST') then lead_stage else 'QUALIFIED' end,
        last_activity_at = greatest(last_activity_at, v_time), updated_at = now()
    where id = v_lead.id;
  end if;
  return true;
end
$$;

revoke all on function public.record_store_soft_lead_event(text, uuid, text, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.record_store_soft_lead_event(text, uuid, text, timestamptz, jsonb)
  to service_role;

create or replace function public.sync_admin_crm_apply_action(
  p_lead uuid,
  p_action text,
  p_note text default null,
  p_followup_at timestamptz default null,
  p_purchase_amount_centimes bigint default null
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_action text := upper(coalesce(p_action,''));
  v_now timestamptz := now();
  v_event text;
begin
  perform sync.require_vendor_admin();
  if p_purchase_amount_centimes is not null and p_purchase_amount_centimes < 0 then
    raise exception 'purchase amount must be non-negative' using errcode='22023';
  end if;
  perform 1 from public.store_soft_leads where id=p_lead for update;
  if not found then raise exception 'lead not found' using errcode='P0002'; end if;

  if v_action='CONFIRM' then
    update public.store_soft_leads set form_status='CONFIRMED',
      status=case when status='new' then 'access_added' else status end,
      last_activity_at=v_now, updated_at=v_now where id=p_lead;
    v_event := 'CONFIRMED';
  elsif v_action='MARK_CONTACTED' then
    update public.store_soft_leads set
      lead_stage=case when lead_stage in ('NEW','PLAYSTORE_CLICKED') then 'CONTACTED' else lead_stage end,
      last_contacted_at=coalesce(last_contacted_at,v_now),
      followup_count=case when last_contacted_at is null then followup_count else followup_count+1 end,
      last_followup_at=case when last_contacted_at is null then last_followup_at else v_now end,
      last_activity_at=v_now, updated_at=v_now where id=p_lead;
    v_event := 'CONTACTED';
  elsif v_action='MARK_REPLIED' then
    update public.store_soft_leads set
      lead_stage=case when lead_stage in ('NEW','CONTACTED','PLAYSTORE_CLICKED') then 'REPLIED' else lead_stage end,
      last_activity_at=v_now, updated_at=v_now where id=p_lead;
    v_event := 'REPLIED';
  elsif v_action='MARK_QUALIFIED' then
    update public.store_soft_leads set
      lead_stage=case when lead_stage in ('CUSTOMER','LOST') then lead_stage else 'QUALIFIED' end,
      last_activity_at=v_now, updated_at=v_now where id=p_lead;
    v_event := 'QUALIFIED';
  elsif v_action='MARK_CUSTOMER' then
    update public.store_soft_leads set lead_stage='CUSTOMER', status='paid', form_status='CONFIRMED',
      purchased_at=coalesce(purchased_at,v_now),
      purchase_amount_centimes=coalesce(p_purchase_amount_centimes,purchase_amount_centimes),
      lost_reason=null, last_activity_at=v_now, updated_at=v_now where id=p_lead;
    v_event := 'PURCHASED';
  elsif v_action='MARK_LOST' then
    if nullif(btrim(p_note),'') is null then raise exception 'lost reason is required' using errcode='22023'; end if;
    update public.store_soft_leads set lead_stage='LOST', status='lost', lost_reason=btrim(p_note),
      last_activity_at=v_now, updated_at=v_now where id=p_lead;
    v_event := 'LOST';
  elsif v_action='ADD_NOTE' then
    if nullif(btrim(p_note),'') is null then raise exception 'note is required' using errcode='22023'; end if;
    update public.store_soft_leads set notes=concat_ws(E'\n\n',nullif(notes,''),to_char(v_now at time zone 'Africa/Algiers','YYYY-MM-DD HH24:MI')||' — '||btrim(p_note)),
      last_activity_at=v_now, updated_at=v_now where id=p_lead;
    v_event := 'NOTE_ADDED';
  elsif v_action='SET_FOLLOWUP' then
    update public.store_soft_leads set next_followup_at=p_followup_at,
      last_activity_at=v_now, updated_at=v_now where id=p_lead;
    v_event := 'FOLLOWUP_SET';
  elsif v_action='EMAIL_SENT' then
    update public.store_soft_leads set email_sent_at=coalesce(email_sent_at,v_now), email_error=null,
      status=case when status in ('new','access_added') then 'email_sent' else status end,
      last_activity_at=v_now, updated_at=v_now where id=p_lead;
    v_event := 'EMAIL_SENT';
  elsif v_action='EMAIL_ERROR' then
    update public.store_soft_leads set email_error=left(coalesce(p_note,'Email delivery failed'),1000),
      last_activity_at=v_now, updated_at=v_now where id=p_lead;
  elsif v_action<>'RETRY_EMAIL' then
    raise exception 'unsupported CRM action' using errcode='22023';
  end if;

  if v_event is not null then
    insert into public.lead_events (lead_id,event_type,occurred_at,metadata)
    values (p_lead,v_event,v_now,case when v_action='MARK_CUSTOMER' and p_purchase_amount_centimes is not null
      then jsonb_build_object('purchase_amount_centimes',p_purchase_amount_centimes)
      when v_action in ('MARK_LOST','ADD_NOTE') then jsonb_build_object('note',btrim(p_note))
      when v_action='SET_FOLLOWUP' then jsonb_build_object('next_followup_at',p_followup_at)
      else '{}'::jsonb end)
    on conflict do nothing;
  end if;
  return public.sync_admin_crm_lead(p_lead);
end
$$;

revoke all on function public.sync_admin_crm_apply_action(uuid,text,text,timestamptz,bigint)
  from public, anon;
grant execute on function public.sync_admin_crm_apply_action(uuid,text,text,timestamptz,bigint)
  to authenticated, service_role;

