-- Store Soft CRM short referral follow-up.
-- Keeps the original 256-bit tracking token private and adds a six-character
-- opaque code for public links and the Google Play Install Referrer.

alter table public.store_soft_leads
  add column if not exists tracking_code text;

create unique index if not exists store_soft_leads_tracking_code_uidx
  on public.store_soft_leads (tracking_code);

create or replace function sync.generate_store_soft_referral_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_bytes bytea;
  v_code text;
  v_index integer;
begin
  loop
    v_bytes := extensions.gen_random_bytes(6);
    v_code := '';
    for v_index in 0..5 loop
      v_code := v_code || substr(
        v_alphabet,
        (get_byte(v_bytes, v_index) % length(v_alphabet)) + 1,
        1
      );
    end loop;
    exit when not exists (
      select 1 from public.store_soft_leads where tracking_code = v_code
    );
  end loop;
  return v_code;
end
$$;

revoke all on function sync.generate_store_soft_referral_code()
  from public, anon, authenticated;
grant execute on function sync.generate_store_soft_referral_code()
  to service_role;

do $$
declare
  v_lead_id uuid;
begin
  for v_lead_id in
    select id from public.store_soft_leads
    where tracking_code is null
    order by id
  loop
    update public.store_soft_leads
    set tracking_code = sync.generate_store_soft_referral_code()
    where id = v_lead_id;
  end loop;
end
$$;

alter table public.store_soft_leads
  alter column tracking_code set default sync.generate_store_soft_referral_code(),
  alter column tracking_code set not null,
  drop constraint if exists store_soft_leads_tracking_code_check,
  add constraint store_soft_leads_tracking_code_check
    check (tracking_code ~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$');

comment on column public.store_soft_leads.tracking_code is
  'Six-character opaque referral code for public trial links and Play Install Referrer; contains no lead PII.';

-- Keep the historical parameter name so deployed callers and PostgREST's
-- function signature remain compatible. It now accepts the six-character code
-- and retains private 64-character token lookup for rollback compatibility.
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
  v_reference text := btrim(coalesce(p_tracking_token, ''));
  v_event text := upper(coalesce(p_event_type, ''));
  v_time timestamptz := least(coalesce(p_occurred_at, now()), now() + interval '5 minutes');
  v_row_count integer := 0;
begin
  if not (
       upper(v_reference) ~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$'
       or v_reference ~ '^[0-9a-f]{64}$'
     )
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
  where tracking_code = upper(v_reference)
     or tracking_token = v_reference
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

create or replace function public.sync_admin_crm_leads(
  p_search text default null,
  p_stage text default null,
  p_form_status text default null,
  p_source text default null,
  p_campaign text default null,
  p_platform text default null,
  p_needs_followup boolean default false,
  p_sort text default 'activity',
  p_page integer default 1,
  p_page_size integer default 50
)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_page integer := greatest(coalesce(p_page,1),1);
  v_size integer := least(greatest(coalesce(p_page_size,50),1),100);
begin
  perform sync.require_vendor_admin();
  return (
    with filtered as (
      select l.*,
        (l.lead_stage not in ('CUSTOMER','LOST') and (
          l.next_followup_at <= now()
          or (l.lead_stage='NEW' and l.created_at <= now()-interval '12 hours')
          or (l.lead_stage='TRIAL_STARTED' and l.first_product_at is null and l.trial_started_at <= now()-interval '2 days')
          or (l.lead_stage='ACTIVE_TRIAL' and l.purchased_at is null
            and least(coalesce(l.first_product_at,'infinity'),coalesce(l.first_sale_at,'infinity')) <= now()-interval '3 days')
        )) as needs_followup
      from public.store_soft_leads l
      where (nullif(btrim(p_search),'') is null or concat_ws(' ',l.name,l.email,l.phone,l.shop_type,l.campaign,l.ad_set,l.ad_name) ilike '%'||btrim(p_search)||'%')
        and (p_stage is null or l.lead_stage=p_stage)
        and (p_form_status is null or l.form_status=p_form_status)
        and (p_source is null or l.source=p_source)
        and (p_campaign is null or l.campaign=p_campaign)
        and (p_platform is null or l.requested_platform=p_platform)
    ), paged as (
      select * from filtered
      where not p_needs_followup or needs_followup
      order by case when p_sort='newest' then created_at end desc nulls last,
               case when p_sort<>'newest' then last_activity_at end desc nulls last,
               id desc
      limit v_size offset (v_page-1)*v_size
    )
    select jsonb_build_object(
      'items', coalesce((select jsonb_agg(to_jsonb(p) - array['tracking_token','tracking_code'] order by
        case when p_sort='newest' then p.created_at end desc nulls last,
        case when p_sort<>'newest' then p.last_activity_at end desc nulls last) from paged p), '[]'::jsonb),
      'total', (select count(*) from filtered where not p_needs_followup or needs_followup),
      'page', v_page, 'page_size', v_size
    )
  );
end
$$;

create or replace function public.sync_admin_crm_lead(p_lead uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform sync.require_vendor_admin();
  return coalesce((select (to_jsonb(l) - array['tracking_token','tracking_code']) || jsonb_build_object(
      'tracked_url', 'https://yousoft.site/storesoft/try/?t=' || l.tracking_code,
      'events', coalesce((select jsonb_agg(to_jsonb(e) order by e.occurred_at, e.created_at)
        from public.lead_events e where e.lead_id=l.id), '[]'::jsonb))
    from public.store_soft_leads l where l.id=p_lead), '{}'::jsonb);
end
$$;

revoke all on function public.sync_admin_crm_leads(text,text,text,text,text,text,boolean,text,integer,integer)
  from public, anon;
grant execute on function public.sync_admin_crm_leads(text,text,text,text,text,text,boolean,text,integer,integer)
  to authenticated, service_role;
revoke all on function public.sync_admin_crm_lead(uuid) from public, anon;
grant execute on function public.sync_admin_crm_lead(uuid) to authenticated, service_role;

do $$
begin
  if exists (
    select 1 from public.store_soft_leads
    where tracking_code !~ '^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$'
  ) then
    raise exception 'invalid Store Soft referral code backfill';
  end if;
  if (select count(*) from public.store_soft_leads)
     <> (select count(distinct tracking_code) from public.store_soft_leads) then
    raise exception 'Store Soft referral codes are not complete and unique';
  end if;
  if has_function_privilege('anon', 'sync.generate_store_soft_referral_code()', 'EXECUTE')
     or has_function_privilege('authenticated', 'sync.generate_store_soft_referral_code()', 'EXECUTE') then
    raise exception 'referral code generator is exposed to client roles';
  end if;
end
$$;
