-- Pre-launch security hardening.
--
-- Background: migrations 0001-0005 were written before Stripe existed, when
-- "payment" was a client-side mock. Three policies from 0001 explicitly
-- documented themselves as temporary (see their original comments) and were
-- never tightened once real Stripe payments landed:
--
--   payments_insert_authenticated  -- any signed-in user, any row
--   payments_update_authenticated  -- any signed-in user, any row (not even
--                                      scoped to their own payment!)
--   registrations_update_own       -- owning family could set status to
--                                      'confirmed' directly, no payment
--                                      required
--
-- Right now, with those still in place, a signed-in user could open
-- devtools and run e.g.
--   supabase.from('payments').update({status:'paid'}).eq('id', paymentId)
-- and mark their own registration as paid without ever paying. This
-- migration closes that off entirely: `payments` and `registrations` become
-- read-only to the `authenticated` role. Every write that used to go
-- through the browser's own Supabase client now goes through a server
-- route (POST /api/registrations, POST /api/checkout, POST
-- /api/registrations/payment-method, POST /api/waiver/accept) that
-- validates ownership and recomputes trusted values, then writes using the
-- service-role key — or, for payments, through the Stripe webhook, which
-- only Stripe (signature-verified) can trigger.
--
-- Revoking the table-level privilege (not just dropping the RLS policy) is
-- deliberate: even if a future policy change were sloppy, the `authenticated`
-- role has no base privilege to write these tables at all, so there is no
-- way to accidentally reopen this by editing a policy alone.
--
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe on a database with existing data — this only changes permissions,
-- it does not touch any row.

-- ============================================================================
-- payments — read-only to clients; all writes are service-role only
-- (POST /api/checkout creates + stamps stripe_session_id; the Stripe
-- webhook is the only thing that ever sets status to 'paid'/'failed').
-- ============================================================================

drop policy if exists "payments_insert_authenticated" on public.payments;
drop policy if exists "payments_update_authenticated" on public.payments;

revoke insert, update, delete on public.payments from authenticated, anon;

-- ============================================================================
-- registrations — read-only to clients; all writes are service-role only
-- (POST /api/registrations creates with a server-computed price; the
-- Stripe webhook confirms; POST /api/registrations/payment-method is the
-- only path that changes payment_method, for the Step Up selection).
-- ============================================================================

drop policy if exists "registrations_insert_own" on public.registrations;
drop policy if exists "registrations_update_own" on public.registrations;

revoke insert, update, delete on public.registrations from authenticated, anon;

-- ============================================================================
-- families — waiver acceptance can no longer be set by a direct client
-- write. Previously `families_update_own` let a signed-in user set
-- waiver_accepted = true on their own row with no server involvement at
-- all, bypassing the actual typed-signature capture in the waiver step.
-- Ordinary profile fields (name/email/phone/interested programs) stay
-- directly editable — only the waiver_* columns move behind
-- POST /api/waiver/accept (service-role).
-- ============================================================================

revoke update on public.families from authenticated;
grant update (parent_name, email, phone, interested_program_ids)
  on public.families to authenticated;
