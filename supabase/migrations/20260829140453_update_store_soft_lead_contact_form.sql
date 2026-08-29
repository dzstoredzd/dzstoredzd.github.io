alter table public.store_soft_leads
  alter column email drop not null,
  alter column email_normalized drop not null;

alter table public.store_soft_leads
  drop constraint if exists store_soft_leads_shop_type_check;

alter table public.store_soft_leads
  add constraint store_soft_leads_shop_type_check
  check (char_length(btrim(shop_type)) between 2 and 100) not valid;

alter table public.store_soft_leads
  validate constraint store_soft_leads_shop_type_check;

alter table public.store_soft_leads
  add column if not exists requested_platform text;

alter table public.store_soft_leads
  drop constraint if exists store_soft_leads_requested_platform_check;

alter table public.store_soft_leads
  add constraint store_soft_leads_requested_platform_check
  check (requested_platform in ('phone', 'computer', 'both')) not valid;

alter table public.store_soft_leads
  validate constraint store_soft_leads_requested_platform_check;

comment on column public.store_soft_leads.email is
  'Optional legacy contact email. Current landing-page leads use phone or WhatsApp.';

comment on column public.store_soft_leads.email_normalized is
  'Optional lower-cased legacy email retained for grouping older leads.';

comment on column public.store_soft_leads.phone is
  'Phone or WhatsApp number supplied by the lead.';

comment on column public.store_soft_leads.shop_type is
  'Free-text activity or shop type supplied by the lead.';

comment on column public.store_soft_leads.requested_platform is
  'Requested Store Soft version: phone, computer, or both.';
