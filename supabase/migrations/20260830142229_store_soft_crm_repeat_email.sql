begin;

set local lock_timeout = '5s';

alter table public.store_soft_leads
  add column if not exists email_sent_count integer not null default 0,
  add column if not exists email_last_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.store_soft_leads'::regclass
      and conname = 'store_soft_leads_email_sent_count_check'
  ) then
    alter table public.store_soft_leads
      add constraint store_soft_leads_email_sent_count_check
      check (email_sent_count >= 0) not valid;
  end if;
end
$$;

alter table public.store_soft_leads
  validate constraint store_soft_leads_email_sent_count_check;

update public.store_soft_leads
set email_sent_count = greatest(email_sent_count, 1),
    email_last_sent_at = coalesce(email_last_sent_at, email_sent_at)
where email_sent_at is not null
  and (email_sent_count = 0 or email_last_sent_at is null);

create or replace function public.sync_admin_crm_record_email_sent(p_lead uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_lead public.store_soft_leads%rowtype;
begin
  perform sync.require_vendor_admin();

  update public.store_soft_leads
  set email_sent_at = coalesce(email_sent_at, v_now),
      email_last_sent_at = v_now,
      email_sent_count = email_sent_count + 1,
      email_error = null,
      status = case when status in ('new', 'access_added') then 'email_sent' else status end,
      last_activity_at = v_now,
      updated_at = v_now
  where id = p_lead
  returning * into v_lead;

  if not found then
    raise exception 'lead not found' using errcode = 'P0002';
  end if;

  insert into public.lead_events (lead_id, event_type, occurred_at)
  values (p_lead, 'EMAIL_SENT', v_now)
  on conflict (lead_id, event_type)
    where event_type in ('FORM_SUBMITTED', 'CONFIRMED', 'PLAYSTORE_CLICKED',
      'APP_FIRST_OPEN', 'STORE_CREATED', 'PRODUCT_CREATED', 'FIRST_SALE',
      'SYNC_ENABLED', 'QUALIFIED', 'PURCHASED', 'LOST', 'EMAIL_SENT')
  do nothing;

  return (to_jsonb(v_lead) - array['tracking_token', 'tracking_code'])
    || jsonb_build_object(
      'tracked_url',
      'https://yousoft.site/storesoft/try/?t=' || v_lead.tracking_code
    );
end
$$;

revoke all on function public.sync_admin_crm_record_email_sent(uuid)
  from public, anon;
grant execute on function public.sync_admin_crm_record_email_sent(uuid)
  to authenticated, service_role;

comment on column public.store_soft_leads.email_sent_count is
  'Successful CRM confirmation emails sent to this lead, including repeats.';
comment on column public.store_soft_leads.email_last_sent_at is
  'Most recent successful CRM confirmation email delivery; email_sent_at remains the first.';
comment on function public.sync_admin_crm_record_email_sent(uuid) is
  'Vendor-admin-only atomic delivery counter update after the external sender succeeds.';

do $$
begin
  if exists (
    select 1 from public.store_soft_leads
    where email_sent_count < 0
       or (email_sent_at is not null and email_sent_count < 1)
       or (email_sent_count > 0 and email_last_sent_at is null)
  ) then
    raise exception 'CRM email delivery backfill is incomplete';
  end if;

  if has_function_privilege(
       'anon',
       'public.sync_admin_crm_record_email_sent(uuid)',
       'EXECUTE'
     ) then
    raise exception 'CRM email delivery counter RPC is exposed to anon';
  end if;
end
$$;

commit;
