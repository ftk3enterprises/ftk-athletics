-- Two independent additions:
--
-- 1. "interested" registration status — Coming Soon programs flagged
--    allowsInterest (see src/data/programs.ts) let a visitor go through the
--    normal registration flow (participant info + waiver, no payment) and
--    land as a Registration with status 'interested' instead of being
--    blocked outright. It's a real row in the same table, never a separate
--    system — admins see it in the same Registrations dashboard, just
--    distinguishable by status. See POST /api/registrations.
--
-- 2. Optional involvement preferences on families — "interested in
--    coaching / volunteering / sponsoring", collected once at profile setup
--    (src/components/profile/create-family-form.tsx) and editable later from
--    My Profile. All default false so existing families are unaffected.
--
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe on a database with existing data — no existing row's status or
-- family preferences change; the new columns just default in.

-- ============================================================================
-- registrations.status: allow 'interested' alongside the existing values
-- ============================================================================

alter table public.registrations
  drop constraint if exists registrations_status_check;

alter table public.registrations
  add constraint registrations_status_check
  check (status in ('pending_payment', 'confirmed', 'cancelled', 'interested'));

-- ============================================================================
-- families: optional involvement preferences
-- ============================================================================

alter table public.families
  add column interested_coaching boolean not null default false,
  add column interested_volunteering boolean not null default false,
  add column interested_sponsorship boolean not null default false;

-- Column-level grant from 0006 only covered the columns that existed at the
-- time (parent_name, email, phone, interested_program_ids) — Postgres does
-- not retroactively include new columns in an existing grant, so these three
-- need to be added explicitly or a signed-in user could never save their own
-- preferences from My Profile.
grant update (interested_coaching, interested_volunteering, interested_sponsorship)
  on public.families to authenticated;
