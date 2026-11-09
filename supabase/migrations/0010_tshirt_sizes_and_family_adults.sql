-- Two additions:
--
-- 1. T-shirt sizes. Added as nullable columns on children, families (for
--    "self", the signed-in account holder), and registrations (a
--    denormalized snapshot at registration time, same treatment as
--    participant_name/session_label elsewhere in this table). Nullable
--    rather than NOT NULL so this is safe to run against a database with
--    existing rows — "required" is enforced in the UI and in
--    POST /api/registrations, not by the database, the same way
--    payment_method/status business rules are enforced there rather than
--    with a stricter constraint (see 0006's rationale).
--
-- 2. family_adults: a second table of registrable people per family,
--    sibling to children, for registering additional adults (spouse,
--    grandparent, etc.) alongside or instead of the account holder and any
--    kids. Same shape and RLS policy as children — full client CRUD scoped
--    to the owning family; adult profile info needs no server-mediation,
--    only registrations/payments do (per 0006).
--
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.
-- Safe on a database with existing data — no existing row's data changes;
-- every new column defaults to null and the new table starts empty.

-- ============================================================================
-- family_adults
-- ============================================================================

create table public.family_adults (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  tshirt_size text check (tshirt_size is null or tshirt_size in (
    'youth-xs', 'youth-s', 'youth-m', 'youth-l', 'youth-xl',
    'adult-xs', 'adult-s', 'adult-m', 'adult-l', 'adult-xl', 'adult-2xl', 'adult-3xl'
  )),
  created_at timestamptz not null default now()
);

alter table public.family_adults enable row level security;

create policy "family_adults_all_own" on public.family_adults
  for all using (
    family_id in (select id from public.families where user_id = auth.uid())
  ) with check (
    family_id in (select id from public.families where user_id = auth.uid())
  );

-- ============================================================================
-- children: t-shirt size
-- ============================================================================

alter table public.children
  add column tshirt_size text check (tshirt_size is null or tshirt_size in (
    'youth-xs', 'youth-s', 'youth-m', 'youth-l', 'youth-xl',
    'adult-xs', 'adult-s', 'adult-m', 'adult-l', 'adult-xl', 'adult-2xl', 'adult-3xl'
  ));

-- ============================================================================
-- families: t-shirt size for "self" (the signed-in account holder)
-- ============================================================================

alter table public.families
  add column tshirt_size text check (tshirt_size is null or tshirt_size in (
    'youth-xs', 'youth-s', 'youth-m', 'youth-l', 'youth-xl',
    'adult-xs', 'adult-s', 'adult-m', 'adult-l', 'adult-xl', 'adult-2xl', 'adult-3xl'
  ));

-- Column-level grant, same pattern as 0006/0007 — a signed-in user can set
-- their own t-shirt size directly, same as parent_name/email/phone.
grant update (tshirt_size) on public.families to authenticated;

-- ============================================================================
-- registrations: t-shirt size snapshot at registration time
-- ============================================================================

alter table public.registrations
  add column tshirt_size text check (tshirt_size is null or tshirt_size in (
    'youth-xs', 'youth-s', 'youth-m', 'youth-l', 'youth-xl',
    'adult-xs', 'adult-s', 'adult-m', 'adult-l', 'adult-xl', 'adult-2xl', 'adult-3xl'
  ));
