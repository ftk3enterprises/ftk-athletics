-- Mirrors cash_collected_at (0008) for Step Up registrations: an admin can
-- now mark a Step Up payment as received once FTK confirms the scholarship
-- funds actually arrived, the same manual-confirmation flow as cash. See
-- POST /api/admin/registrations/[id]/confirm-payment.
--
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe on a database with existing data — the new column just defaults to null.

alter table public.registrations
  add column step_up_received_at timestamptz;
