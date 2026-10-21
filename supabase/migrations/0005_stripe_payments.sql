-- Adds Stripe identifiers to payments so the webhook handler can look up
-- (and idempotently update) the right row when Stripe confirms a charge.
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.

alter table public.payments
  add column stripe_session_id text,
  add column stripe_payment_intent_id text;

create unique index payments_stripe_session_id_key
  on public.payments (stripe_session_id)
  where stripe_session_id is not null;
