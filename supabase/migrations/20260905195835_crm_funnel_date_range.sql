-- Date-filtered first milestones. Existing no-argument aggregate and all stored data remain unchanged.
create or replace function public.sync_admin_crm_download_funnel_range(p_period text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_result jsonb;
  v_from timestamptz;
  v_to timestamptz := now();
  v_today timestamp := date_trunc('day', now() at time zone 'Africa/Algiers');
begin
  perform sync.require_vendor_admin();
  if p_period is null or p_period not in ('today','7d','30d','all') then
    raise exception 'invalid funnel period' using errcode='22023';
  end if;
  if p_period='all' then
    return public.sync_admin_crm_download_funnel() || jsonb_build_object(
      'period',p_period,'timezone','Africa/Algiers','from',null,'to',v_to);
  end if;
  v_from := (v_today - case p_period when '7d' then interval '6 days'
    when '30d' then interval '29 days' else interval '0 days' end) at time zone 'Africa/Algiers';
  with active as materialized (
    select id, requested_platform, created_at from public.store_soft_leads where archived_at is null
  ), all_events as materialized (
    select e.lead_id, e.event_type, min(e.occurred_at) as occurred_at
    from public.lead_events e join active a on a.id=e.lead_id group by e.lead_id,e.event_type
  ), events as materialized (
    select * from all_events where occurred_at >= v_from and occurred_at < v_to
  ), visitors as materialized (
    select * from sync.crm_download_visitors where first_seen_at >= v_from and first_seen_at < v_to
  ), web as materialized (
    select e.* from sync.crm_download_lead_events e join active a on a.id=e.lead_id
  ), submitted_leads as materialized (
    select lead_id from (
      select lead_id, occurred_at from all_events where event_type='FORM_SUBMITTED'
      union all select lead_id, occurred_at from web where event_type='LEAD_SUBMITTED'
    ) s group by lead_id having min(occurred_at) >= v_from and min(occurred_at) < v_to
  ), submission_devices as materialized (
    -- Earliest observed submission only. Download target/requested platform is not the sending device.
    select distinct on (lead_id) lead_id, platform from web
    where event_type='LEAD_SUBMITTED' order by lead_id, occurred_at, platform
  ), shared_submitted as (
    select count(*) as total,
      count(*) filter (where d.platform='windows') as pc,
      count(*) filter (where d.platform='android') as phone,
      count(*) filter (where d.platform is null or d.platform='other') as other_unknown
    from submitted_leads s left join submission_devices d using (lead_id)
  ), membership as materialized (
    select lead_id, platform from web where platform <> 'other'
    union
    select a.id, p.platform from active a cross join (values ('android'),('windows')) p(platform)
      where a.requested_platform = 'both'
        or (a.requested_platform = 'phone' and p.platform='android')
        or (a.requested_platform = 'computer' and p.platform='windows')
    union
    select lead_id, 'android' from all_events where event_type in
      ('PLAYSTORE_CLICKED','APP_FIRST_OPEN','PRODUCT_CREATED','FIRST_SALE')
  ), clicks as materialized (
    select lead_id, platform from (
      select lead_id, platform, occurred_at from web where event_type='DOWNLOAD_CLICKED'
      union all select lead_id, 'android', occurred_at from all_events where event_type='PLAYSTORE_CLICKED'
    ) c group by lead_id,platform having min(occurred_at) >= v_from and min(occurred_at) < v_to
  ), windows_events as materialized (
    select e.install_id,e.event,min(e.created_at) as occurred_at from public.app_events e
    join public.installations i on i.install_id=e.install_id and i.platform='windows'
    where e.platform='windows' and e.event in ('first_product','first_sale')
    group by e.install_id,e.event
  ), platforms(platform, ordinal) as (values ('android',1),('windows',2)),
  counts as (
    select p.platform, p.ordinal,
      (select count(*) from visitors v where v.platform=p.platform) as visits,
      (select count(distinct e.lead_id) from events e join membership m on m.lead_id=e.lead_id
        where e.event_type='FORM_SUBMITTED' and m.platform=p.platform) as submitted,
      (select count(*) from clicks c where c.platform=p.platform) as clicked,
      case when p.platform='windows' then (select count(*) from public.installations where platform='windows' and first_seen_at >= v_from and first_seen_at < v_to)
        else (select count(distinct lead_id) from events where event_type='APP_FIRST_OPEN') end as opened,
      case when p.platform='windows' then (select count(*) from windows_events where event='first_product' and occurred_at >= v_from and occurred_at < v_to)
        else (select count(distinct lead_id) from events where event_type='PRODUCT_CREATED') end as product,
      case when p.platform='windows' then (select count(*) from windows_events where event='first_sale' and occurred_at >= v_from and occurred_at < v_to)
        else (select count(distinct lead_id) from events where event_type='FIRST_SALE') end as sale,
      (select count(distinct e.lead_id) from events e join membership m on m.lead_id=e.lead_id
        where e.event_type='PURCHASED' and m.platform=p.platform) as purchased
    from platforms p
  )
  select jsonb_build_object(
    'period',p_period,'timezone','Africa/Algiers','from',v_from,'to',v_to,
    'shared_submitted', (select to_jsonb(s) from shared_submitted s),
    'unique_visitors', (select count(*) from visitors),
    'other_visitors', (select count(*) from visitors where platform='other'),
    'unassigned_leads', (select count(*) from active a where a.created_at >= v_from and a.created_at < v_to and not exists(select 1 from membership m where m.lead_id=a.id)),
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
revoke all on function public.sync_admin_crm_download_funnel_range(text) from public, anon;
grant execute on function public.sync_admin_crm_download_funnel_range(text) to authenticated, service_role;

-- Rollback: DROP FUNCTION public.sync_admin_crm_download_funnel_range(text);
-- No tables or stored telemetry are changed.
