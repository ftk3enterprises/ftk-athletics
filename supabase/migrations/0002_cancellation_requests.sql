-- Cancellation requests: a parent-submitted request to cancel a registration.
-- Intentionally minimal — this never changes the registration's actual
-- status. FTK reviews the notification email and handles each request
-- manually (see src/app/api/cancellation-requests/route.ts).
--
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.

create table public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  -- One request per registration — this unique constraint is the
  -- authoritative duplicate-prevention guard (the API also checks before
  -- inserting, but the constraint is what actually makes it safe).
  registration_id uuid not null unique references public.registrations(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  preferred_resolution text not null check (preferred_resolution in ('credit', 'refund')),
  reason text not null,
  -- Set by the server after attempting the Resend notification — lets a
  -- failed send be spotted and retried manually without losing the request
  -- or creating a duplicate.
  email_sent boolean not null default false,
  email_error text,
  created_at timestamptz not null default now()
);

alter table public.cancellation_requests enable row level security;

-- Families can see their own requests (to render "Cancellation Requested")
-- and create new ones, but never update or delete — once submitted, FTK
-- handles it manually. The admin export/table path reads via the
-- service-role client (see src/services/admin-service.ts), which bypasses
-- RLS entirely, so no admin-specific policy is needed here.
create policy "cancellation_requests_select_own" on public.cancellation_requests
  for select using (
    family_id in (select id from public.families where user_id = auth.uid())
  );

create policy "cancellation_requests_insert_own" on public.cancellation_requests
  for insert with check (
    family_id in (select id from public.families where user_id = auth.uid())
    and registration_id in (
      select id from public.registrations
      where family_id in (select id from public.families where user_id = auth.uid())
    )
  );
