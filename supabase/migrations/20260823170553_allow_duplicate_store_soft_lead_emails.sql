alter table public.store_soft_leads
  drop constraint if exists store_soft_leads_email_normalized_key;

comment on column public.store_soft_leads.email_normalized is
  'Lower-cased email retained for grouping repeated submissions; duplicate values are allowed and every submission is a separate lead.';
