-- Admin role assignment. A user is an admin if and only if a row exists
-- here for their auth.users id. This table is deliberately NOT writable by
-- any client role (anon/authenticated) -- the only way to create or remove
-- an admin is the service-role key (src/lib/supabase/admin.ts), used from
-- trusted server-side code or a manual insert in the Supabase dashboard.
-- This is the single source of truth for admin authorization -- never
-- trust user_metadata, a hardcoded email list, or any client-supplied flag
-- for this (see src/lib/admin-auth.ts).
--
-- Run once in the Supabase Dashboard: SQL Editor -> New query -> paste -> Run.

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- A signed-in user may check ONLY their own admin status (needed so the
-- client-side nav can show "Admin Portal" vs "My Profile"). There is
-- intentionally no insert/update/delete policy for anon or authenticated
-- roles -- that means this table can only ever be written using the
-- service-role key, so there is no path for a user to grant themselves
-- admin access.
create policy "admin_users_select_own" on public.admin_users
  for select using (auth.uid() = user_id);
