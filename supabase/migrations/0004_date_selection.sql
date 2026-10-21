-- Structured daily/weekly date selection for camps and any future program
-- offering a per-day or per-week rate. Previously a registration only
-- stored a denormalized session label/date-range string ("Daily Rate",
-- "Dec 21 - Jan 1"), with no record of exactly which day(s) or week(s) the
-- parent actually picked. These columns are nullable and only populated
-- for sessions configured with a DateSelectionConfig (see
-- src/types/index.ts) — ordinary flat-rate sessions are unaffected.
--
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.

alter table public.registrations
  add column rate_type text check (rate_type in ('daily', 'weekly')),
  add column selected_dates jsonb,
  add column selected_weeks jsonb;
