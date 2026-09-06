-- Shared entry totals; preserve the existing platform payload for older consoles.
create or replace function public.sync_admin_crm_download_funnel()
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
  ), submitted_leads as materialized (
    select lead_id from events where event_type='FORM_SUBMITTED'
    union select lead_id from web where event_type='LEAD_SUBMITTED'
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
    'shared_submitted', (select to_jsonb(s) from shared_submitted s),
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

-- Rollback: restore the aggregate function definition from 20260905125917_crm_download_funnel.sql.
-- No tables or stored telemetry are changed.
