create table if not exists public.store_soft_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 254),
  email_normalized text not null unique check (email_normalized = lower(email_normalized)),
  phone text not null check (char_length(phone) between 8 and 24),
  shop_type text not null check (shop_type in ('grocery','clothing','cosmetics','spare_parts','repair_shop','other')),
  status text not null default 'new' check (status in ('new','access_added','email_sent','installed','paid','lost')),
  language text not null default 'ar' check (language in ('ar','fr')),
  source text, medium text, campaign text, content text, term text, referrer text, landing_page text,
  sheet_sync_status text not null default 'pending' check (sheet_sync_status in ('pending','synced','failed','not_configured')),
  sheet_synced_at timestamptz, sheet_sync_error text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
comment on table public.store_soft_leads is 'Store Soft trial/download requests submitted through yousoft.site.';
comment on column public.store_soft_leads.email_normalized is 'Lower-cased email used to make repeated submissions idempotent.';
alter table public.store_soft_leads enable row level security;
revoke all on table public.store_soft_leads from anon, authenticated;
grant all on table public.store_soft_leads to service_role;
create policy "No browser role can access leads"
  on public.store_soft_leads as restrictive for all
  to anon, authenticated
  using (false)
  with check (false);
