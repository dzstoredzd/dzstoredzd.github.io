alter table public.store_soft_leads
  alter column phone drop not null;

comment on column public.store_soft_leads.phone is
  'Optional legacy contact number; new landing-page leads are contacted by email.';
