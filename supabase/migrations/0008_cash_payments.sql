-- Adds a "cash" payment method for programs flagged cashPaymentEligible
-- (currently the daily/weekly-rate camps — see src/data/programs.ts). A
-- cash registration never gets a Payment record, same as "step_up" —
-- cash_collected_at is the only new state, set once an admin confirms the
-- cash actually arrived (see POST /api/admin/registrations/[id]/collect-cash).
--
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe on a database with existing data — no existing row's payment_method
-- changes; the new column just defaults to null.

alter table public.registrations
  drop constraint if exists registrations_payment_method_check;

alter table public.registrations
  add constraint registrations_payment_method_check
  check (payment_method in ('online', 'step_up', 'cash'));

alter table public.registrations
  add column cash_collected_at timestamptz;
