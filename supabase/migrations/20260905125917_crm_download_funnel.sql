-- Additive CRM reporting. Existing leads, milestones and app ingestion are unchanged.
create table sync.crm_download_visitors (
  visitor_id uuid primary key,
  platform text not null check (platform in ('android', 'windows', 'other')),
  first_seen_at timestamptz not null default now()
);
create table sync.crm_download_lead_events (
  lead_id uuid not null references public.store_soft_leads(id) on delete cascade,
  event_type text not null check (event_type in ('LEAD_SUBMITTED', 'DOWNLOAD_CLICKED')),
  platform text not null check (platform in ('android', 'windows', 'other')),
  occurred_at timestamptz not null default now(),
  primary key (lead_id, event_type, platform)
);
alter table sync.crm_download_visitors enable row level security;
alter table sync.crm_download_lead_events enable row level security;
revoke all on sync.crm_download_visitors, sync.crm_download_lead_events from public, anon, authenticated;

-- Public, write-only telemetry. Returns no lead identity or code validity.
-- The anonymous browser ID is never stored alongside a lead or its contact details.
create function public.record_store_soft_download_event(
  p_visitor_id uuid, p_event_type text, p_platform text, p_tracking_code text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare v_lead uuid;
begin
  if p_visitor_id is null or p_platform is null or p_platform not in ('android','windows','other')
    or p_event_type is null or p_event_type not in ('DOWNLOAD_PAGE_VISIT','LEAD_SUBMITTED','DOWNLOAD_CLICKED') then
    raise exception 'invalid download event' using errcode = '22023';
  end if;
  if p_event_type = 'DOWNLOAD_PAGE_VISIT' then
    insert into sync.crm_download_visitors(visitor_id, platform) values(p_visitor_id,p_platform)
      on conflict (visitor_id) do nothing;
    return;
  end if;
  select id into v_lead from public.store_soft_leads
    where tracking_code = p_tracking_code and archived_at is null;
  if v_lead is null then return; end if;
  insert into sync.crm_download_lead_events(lead_id,event_type,platform)
    values(v_lead,p_event_type,p_platform) on conflict do nothing;
end $$;
revoke all on function public.record_store_soft_download_event(uuid,text,text,text) from public;
grant execute on function public.record_store_soft_download_event(uuid,text,text,text) to anon, authenticated;

create function public.sync_admin_crm_download_funnel()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb;
begin
  perform sync.require_vendor_admin();
  with active as materialized (
    select id, requested_platform from public.store_soft_leads where archived_at is null
  ), events as materialized (
    select e.lead_id, e.event_type from public.lead_events e join active a on a.id=e.lead_id
  ), web as materialized (
    select e.* from sync.crm_download_lead_events e join active a on a.id=e.lead_id
  ), membership as materialized (
    select lead_id, platform from web where platform <> 'other'
    union
    select a.id, p.platform from active a cross join (values ('android'),('windows')) p(platform)
      where a.requested_platform = 'both'
        or (a.requested_platform = 'phone' and p.platform='android')
        or (a.requested_platform = 'computer' and p.platform='windows')
    union
    select lead_id, 'android' from events where event_type in
      ('PLAYSTORE_CLICKED','APP_FIRST_OPEN','PRODUCT_CREATED','FIRST_SALE')
  ), clicks as materialized (
    select lead_id, platform from web where event_type='DOWNLOAD_CLICKED'
    union select lead_id, 'android' from events where event_type='PLAYSTORE_CLICKED'
  ), platforms(platform, ordinal) as (values ('android',1),('windows',2)),
  counts as (
    select p.platform, p.ordinal,
      (select count(*) from sync.crm_download_visitors v where v.platform=p.platform) as visits,
      (select count(distinct e.lead_id) from events e join membership m on m.lead_id=e.lead_id
        where e.event_type='FORM_SUBMITTED' and m.platform=p.platform) as submitted,
      (select count(*) from clicks c where c.platform=p.platform) as clicked,
      case when p.platform='windows' then (select installs from public.analytics_windows_funnel)
        else (select count(distinct lead_id) from events where event_type='APP_FIRST_OPEN') end as opened,
      case when p.platform='windows' then (select first_product from public.analytics_windows_funnel)
        else (select count(distinct lead_id) from events where event_type='PRODUCT_CREATED') end as product,
      case when p.platform='windows' then (select first_sale from public.analytics_windows_funnel)
        else (select count(distinct lead_id) from events where event_type='FIRST_SALE') end as sale,
      (select count(distinct e.lead_id) from events e join membership m on m.lead_id=e.lead_id
        where e.event_type='PURCHASED' and m.platform=p.platform) as purchased
    from platforms p
  )
  select jsonb_build_object(
    'unique_visitors', (select count(*) from sync.crm_download_visitors),
    'other_visitors', (select count(*) from sync.crm_download_visitors where platform='other'),
    'unassigned_leads', (select count(*) from active a where not exists(select 1 from membership m where m.lead_id=a.id)),
    'unassigned_purchases', (select count(distinct e.lead_id) from events e where e.event_type='PURCHASED'
      and not exists(select 1 from membership m where m.lead_id=e.lead_id)),
    'platforms', (select jsonb_agg(jsonb_build_object('platform',platform,'steps',jsonb_build_array(
      jsonb_build_object('event_type','DOWNLOAD_PAGE_VISIT','count',visits,'unit','Unique visitors'),
      jsonb_build_object('event_type','FORM_SUBMITTED','count',submitted,'unit','Distinct leads'),
      jsonb_build_object('event_type','DOWNLOAD_CLICKED','count',clicked,'unit','Distinct leads'),
      jsonb_build_object('event_type','APP_FIRST_OPEN','count',opened,'unit',case when platform='windows' then 'Installations' else 'Distinct leads' end),
      jsonb_build_object('event_type','PRODUCT_CREATED','count',product,'unit',case when platform='windows' then 'Installations' else 'Distinct leads' end),
      jsonb_build_object('event_type','FIRST_SALE','count',sale,'unit',case when platform='windows' then 'Installations' else 'Distinct leads' end),
      jsonb_build_object('event_type','PURCHASED','count',purchased,'unit','Distinct leads')
    )) order by ordinal) from counts)
  ) into v_result;
  return v_result;
end $$;
revoke all on function public.sync_admin_crm_download_funnel() from public, anon;
grant execute on function public.sync_admin_crm_download_funnel() to authenticated, service_role;

-- Rollback: drop the two new functions; retain both private telemetry tables to
-- preserve collected visitors/events. No existing object is replaced by this migration.
