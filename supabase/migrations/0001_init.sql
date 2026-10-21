-- FTK initial schema: families, children, waivers, payments, registrations,
-- sponsor inquiries. Programs/Sessions intentionally stay as code
-- (src/data/programs.ts), so there is no programs table here.
--
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.

-- ============================================================================
-- Tables
-- ============================================================================

create table public.families (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  parent_name text not null,
  email text not null,
  phone text not null,
  interested_program_ids text[] not null default '{}',
  -- Family.waiver flattened onto this row (fast "already signed?" check) —
  -- the full signing-event audit trail lives in waiver_acceptances below.
  waiver_accepted boolean not null default false,
  waiver_accepted_at timestamptz,
  waiver_version text,
  waiver_withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  dob date not null,
  grade text,
  school text,
  created_at timestamptz not null default now()
);

create table public.waiver_acceptances (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  participant_ids text[] not null,
  program_ids text[] not null,
  version text not null,
  signature_name text not null,
  accepted_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  registration_ids uuid[] not null,
  amount numeric(10, 2) not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  reference text not null,
  created_at timestamptz not null default now()
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  -- Not a FK: programs/sessions are static data in src/data/programs.ts, not
  -- database rows.
  program_id text not null,
  participant_id text not null,
  participant_name text not null,
  session_id text not null,
  session_label text not null,
  session_date_range text,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'cancelled')),
  price numeric(10, 2) not null,
  school_location text,
  waiver_accepted_at timestamptz,
  payment_id uuid references public.payments(id),
  payment_method text not null default 'online'
    check (payment_method in ('online', 'step_up')),
  created_at timestamptz not null default now()
);

create table public.sponsor_inquiries (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  message text,
  submitted_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.families enable row level security;
alter table public.children enable row level security;
alter table public.waiver_acceptances enable row level security;
alter table public.payments enable row level security;
alter table public.registrations enable row level security;
alter table public.sponsor_inquiries enable row level security;

-- families: a signed-in user can only see/create/edit their own family row.
create policy "families_select_own" on public.families
  for select using (user_id = auth.uid());

create policy "families_insert_own" on public.families
  for insert with check (user_id = auth.uid());

create policy "families_update_own" on public.families
  for update using (user_id = auth.uid());

-- children: scoped through the owning family.
create policy "children_all_own" on public.children
  for all using (
    family_id in (select id from public.families where user_id = auth.uid())
  ) with check (
    family_id in (select id from public.families where user_id = auth.uid())
  );

-- waiver_acceptances: append-only audit log, readable/writable only by the
-- owning family.
create policy "waiver_acceptances_select_own" on public.waiver_acceptances
  for select using (
    family_id in (select id from public.families where user_id = auth.uid())
  );

create policy "waiver_acceptances_insert_own" on public.waiver_acceptances
  for insert with check (
    family_id in (select id from public.families where user_id = auth.uid())
  );

-- payments: no real payment processor yet (Stripe is explicitly future
-- work), so the owning family's browser client creates/updates its own mock
-- checkout row directly — mirrors exactly what the old localStorage mock
-- did. TODO once Stripe lands: move writes to a server-only webhook path and
-- drop the insert/update policies below.
create policy "payments_select_own" on public.payments
  for select using (
    registration_ids <@ (
      select coalesce(array_agg(id), '{}') from public.registrations
      where family_id in (select id from public.families where user_id = auth.uid())
    )
  );

create policy "payments_insert_authenticated" on public.payments
  for insert with check (auth.uid() is not null);

create policy "payments_update_authenticated" on public.payments
  for update using (auth.uid() is not null);

-- registrations: owning family can read/create its own rows. Same
-- documented tradeoff as payments above — update is allowed for the owning
-- family only because there's no real payment confirmation path yet.
create policy "registrations_select_own" on public.registrations
  for select using (
    family_id in (select id from public.families where user_id = auth.uid())
  );

create policy "registrations_insert_own" on public.registrations
  for insert with check (
    family_id in (select id from public.families where user_id = auth.uid())
  );

create policy "registrations_update_own" on public.registrations
  for update using (
    family_id in (select id from public.families where user_id = auth.uid())
  );

-- sponsor_inquiries: public insert (anonymous sponsor-interest form), no
-- client select policy at all — only the service-role admin path
-- (src/lib/supabase/admin.ts) can read these.
create policy "sponsor_inquiries_insert_anyone" on public.sponsor_inquiries
  for insert with check (true);
