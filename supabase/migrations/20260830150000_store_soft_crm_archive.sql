-- Store Soft CRM archive and guarded permanent deletion.
-- Active CRM analytics exclude archived rows. Permanent deletion is available
-- only after archiving and exact lead-name confirmation.

create temporary table store_soft_crm_archive_preflight on commit drop as
select count(*)::bigint as lead_count
from public.store_soft_leads;

alter table public.store_soft_leads
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid;

comment on column public.store_soft_leads.archived_at is
  'When set, hides the lead from the active CRM, follow-up queue, and funnel analytics.';
comment on column public.store_soft_leads.archived_by is
  'Vendor-admin auth user that most recently archived the lead; nullable for service-role operations.';

create index if not exists store_soft_leads_active_activity_idx
  on public.store_soft_leads (last_activity_at desc, id desc)
  where archived_at is null;
create index if not exists store_soft_leads_archived_activity_idx
  on public.store_soft_leads (archived_at desc, last_activity_at desc, id desc)
  where archived_at is not null;

alter table public.lead_events
  drop constraint if exists lead_events_event_type_check;
alter table public.lead_events
  add constraint lead_events_event_type_check check (
    event_type in ('FORM_SUBMITTED', 'CONFIRMED', 'CONTACTED', 'REPLIED',
      'PLAYSTORE_CLICKED', 'APP_FIRST_OPEN', 'STORE_CREATED', 'PRODUCT_CREATED',
      'FIRST_SALE', 'SYNC_ENABLED', 'USER_ADDED', 'QUALIFIED', 'PURCHASED',
      'LOST', 'NOTE_ADDED', 'FOLLOWUP_SET', 'EMAIL_SENT', 'LEAD_ARCHIVED',
      'LEAD_RESTORED')
  ) not valid;
alter table public.lead_events validate constraint lead_events_event_type_check;

-- Archived codes behave like invalid codes. No lead data is revealed.
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
  where archived_at is null
    and (tracking_code = upper(v_reference) or tracking_token = v_reference)
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
  where id = v_lead.id and archived_at is null;

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
    where id = v_lead.id and archived_at is null;
  end if;
  return true;
end
$$;

revoke all on function public.record_store_soft_lead_event(text, uuid, text, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.record_store_soft_lead_event(text, uuid, text, timestamptz, jsonb)
  to service_role;

create or replace function public.sync_admin_crm_overview()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
  perform sync.require_vendor_admin();
  with stages(stage, ordinal) as (values
    ('NEW',1),('CONTACTED',2),('REPLIED',3),('PLAYSTORE_CLICKED',4),
    ('TRIAL_STARTED',5),('ACTIVE_TRIAL',6),('QUALIFIED',7),('CUSTOMER',8),('LOST',9)
  ), stage_counts as (
    select s.stage, s.ordinal, count(l.id)::int as lead_count
    from stages s left join public.store_soft_leads l
      on l.lead_stage = s.stage and l.archived_at is null
    group by s.stage, s.ordinal
  ), funnel(event_type, ordinal) as (values
    ('FORM_SUBMITTED',1),('PLAYSTORE_CLICKED',2),('APP_FIRST_OPEN',3),
    ('PRODUCT_CREATED',4),('FIRST_SALE',5),('PURCHASED',6)
  ), funnel_counts as (
    select f.event_type, f.ordinal, count(distinct l.id)::int as lead_count
    from funnel f
    left join public.lead_events e on e.event_type = f.event_type
    left join public.store_soft_leads l on l.id = e.lead_id and l.archived_at is null
    group by f.event_type, f.ordinal
  ), funnel_conversions as (
    select event_type, ordinal, lead_count, lag(lead_count) over (order by ordinal) as previous_count
    from funnel_counts
  )
  select jsonb_build_object(
    'total', (select count(*) from public.store_soft_leads where archived_at is null),
    'archived', (select count(*) from public.store_soft_leads where archived_at is not null),
    'needs_followup', (select count(*) from public.store_soft_leads l where
      l.archived_at is null and l.lead_stage not in ('CUSTOMER','LOST') and (
        l.next_followup_at <= now()
        or (l.lead_stage = 'NEW' and l.created_at <= now() - interval '12 hours')
        or (l.lead_stage = 'TRIAL_STARTED' and l.first_product_at is null
          and l.trial_started_at <= now() - interval '2 days')
        or (l.lead_stage = 'ACTIVE_TRIAL' and l.purchased_at is null
          and least(coalesce(l.first_product_at, 'infinity'), coalesce(l.first_sale_at, 'infinity'))
            <= now() - interval '3 days')
      )),
    'stages', (select jsonb_agg(jsonb_build_object('stage', stage, 'count', lead_count) order by ordinal)
      from stage_counts),
    'funnel', (select jsonb_agg(jsonb_build_object(
      'event_type', event_type, 'count', lead_count,
      'conversion', case when previous_count is null or previous_count = 0 then null
        else round(lead_count::numeric * 100 / previous_count, 1) end
      ) order by ordinal) from funnel_conversions)
  ) into v_result;
  return v_result;
end
$$;

create or replace function public.sync_admin_crm_filter_options()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform sync.require_vendor_admin();
  return jsonb_build_object(
    'sources', coalesce((select jsonb_agg(value order by value) from
      (select distinct source value from public.store_soft_leads where nullif(source,'') is not null) q), '[]'::jsonb),
    'campaigns', coalesce((select jsonb_agg(value order by value) from
      (select distinct campaign value from public.store_soft_leads where nullif(campaign,'') is not null) q), '[]'::jsonb),
    'platforms', coalesce((select jsonb_agg(value order by value) from
      (select distinct requested_platform value from public.store_soft_leads where nullif(requested_platform,'') is not null) q), '[]'::jsonb)
  );
end
$$;

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
      where l.archived_at is null
        and (nullif(btrim(p_search),'') is null or concat_ws(' ',l.name,l.email,l.phone,l.shop_type,l.campaign,l.ad_set,l.ad_name) ilike '%'||btrim(p_search)||'%')
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
      'items', coalesce((select jsonb_agg((to_jsonb(p) - array['tracking_token','tracking_code'])
        || jsonb_build_object('tracked_url', 'https://yousoft.site/storesoft/try/?t=' || p.tracking_code) order by
        case when p_sort='newest' then p.created_at end desc nulls last,
        case when p_sort<>'newest' then p.last_activity_at end desc nulls last) from paged p), '[]'::jsonb),
      'total', (select count(*) from filtered where not p_needs_followup or needs_followup),
      'page', v_page, 'page_size', v_size
    )
  );
end
$$;

create or replace function public.sync_admin_crm_archived_leads(
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
      select l.*, false as needs_followup
      from public.store_soft_leads l
      where l.archived_at is not null
        and (nullif(btrim(p_search),'') is null or concat_ws(' ',l.name,l.email,l.phone,l.shop_type,l.campaign,l.ad_set,l.ad_name) ilike '%'||btrim(p_search)||'%')
        and (p_stage is null or l.lead_stage=p_stage)
        and (p_form_status is null or l.form_status=p_form_status)
        and (p_source is null or l.source=p_source)
        and (p_campaign is null or l.campaign=p_campaign)
        and (p_platform is null or l.requested_platform=p_platform)
    ), paged as (
      select * from filtered
      order by case when p_sort='newest' then created_at end desc nulls last,
               case when p_sort<>'newest' then archived_at end desc nulls last,
               id desc
      limit v_size offset (v_page-1)*v_size
    )
    select jsonb_build_object(
      'items', coalesce((select jsonb_agg(to_jsonb(p) - array['tracking_token','tracking_code'] order by
        case when p_sort='newest' then p.created_at end desc nulls last,
        case when p_sort<>'newest' then p.archived_at end desc nulls last) from paged p), '[]'::jsonb),
      'total', (select count(*) from filtered),
      'page', v_page, 'page_size', v_size
    )
  );
end
$$;

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
  v_lead public.store_soft_leads%rowtype;
begin
  perform sync.require_vendor_admin();
  if p_purchase_amount_centimes is not null and p_purchase_amount_centimes < 0 then
    raise exception 'purchase amount must be non-negative' using errcode='22023';
  end if;
  select * into v_lead from public.store_soft_leads where id=p_lead for update;
  if not found then raise exception 'lead not found' using errcode='P0002'; end if;

  if v_action = 'DELETE_PERMANENTLY' then
    if v_lead.archived_at is null then
      raise exception 'archive the lead before permanent deletion' using errcode='22023';
    end if;
    if coalesce(p_note, '') is distinct from coalesce(v_lead.name, '') then
      raise exception 'lead name confirmation does not match' using errcode='22023';
    end if;
    delete from public.store_soft_leads where id=p_lead;
    return jsonb_build_object('id', p_lead, 'deleted', true);
  end if;

  if v_action = 'ARCHIVE' then
    if v_lead.archived_at is null then
      update public.store_soft_leads set archived_at=v_now, archived_by=auth.uid(),
        next_followup_at=null, last_activity_at=v_now, updated_at=v_now where id=p_lead;
      v_event := 'LEAD_ARCHIVED';
    end if;
  elsif v_action = 'RESTORE' then
    if v_lead.archived_at is not null then
      update public.store_soft_leads set archived_at=null, archived_by=null,
        last_activity_at=v_now, updated_at=v_now where id=p_lead;
      v_event := 'LEAD_RESTORED';
    end if;
  elsif v_lead.archived_at is not null then
    raise exception 'restore the archived lead before changing it' using errcode='22023';
  elsif v_action='CONFIRM' then
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
      when v_action in ('ARCHIVE','RESTORE') then jsonb_build_object('admin_user_id',auth.uid())
      else '{}'::jsonb end)
    on conflict do nothing;
  end if;
  return public.sync_admin_crm_lead(p_lead);
end
$$;

revoke all on function public.sync_admin_crm_overview() from public, anon;
revoke all on function public.sync_admin_crm_filter_options() from public, anon;
revoke all on function public.sync_admin_crm_leads(text,text,text,text,text,text,boolean,text,integer,integer) from public, anon;
revoke all on function public.sync_admin_crm_archived_leads(text,text,text,text,text,text,boolean,text,integer,integer) from public, anon;
revoke all on function public.sync_admin_crm_apply_action(uuid,text,text,timestamptz,bigint) from public, anon;
grant execute on function public.sync_admin_crm_overview() to authenticated, service_role;
grant execute on function public.sync_admin_crm_filter_options() to authenticated, service_role;
grant execute on function public.sync_admin_crm_leads(text,text,text,text,text,text,boolean,text,integer,integer) to authenticated, service_role;
grant execute on function public.sync_admin_crm_archived_leads(text,text,text,text,text,text,boolean,text,integer,integer) to authenticated, service_role;
grant execute on function public.sync_admin_crm_apply_action(uuid,text,text,timestamptz,bigint) to authenticated, service_role;

do $$
begin
  if (select lead_count from store_soft_crm_archive_preflight)
     <> (select count(*) from public.store_soft_leads) then
    raise exception 'Store Soft lead count changed during archive migration';
  end if;
  if exists (select 1 from public.store_soft_leads where archived_at is not null or archived_by is not null) then
    raise exception 'Archive migration unexpectedly changed an existing lead';
  end if;
  if has_function_privilege('anon',
       'public.sync_admin_crm_archived_leads(text,text,text,text,text,text,boolean,text,integer,integer)',
       'EXECUTE') then
    raise exception 'Archived lead RPC is exposed to anon';
  end if;
end
$$;
