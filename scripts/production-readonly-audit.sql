-- Read-only audit of the PRODUCTION Supabase project. Run this in that
-- project's SQL Editor (not the sandbox project) and paste the output back.
-- Nothing here writes, alters, or deletes anything.

-- 1. Which of our 6 migrations' objects already exist?
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'families', 'children', 'waiver_acceptances', 'payments', 'registrations',
    'sponsor_inquiries', 'cancellation_requests', 'admin_users'
  )
order by table_name;

-- 2. Does `registrations` have the 0004/0005 columns (rate_type, selected_dates,
--    selected_weeks, stripe_session_id, stripe_payment_intent_id)?
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('registrations', 'payments')
order by table_name, column_name;

-- 3. RLS enabled on every table?
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
join pg_namespace on pg_namespace.oid = pg_class.relnamespace
where pg_namespace.nspname = 'public'
  and relkind = 'r'
order by relname;

-- 4. Current policies (should match migrations 0001/0002/0003; payments and
--    registrations should have ONLY select policies post-0006, no insert/update).
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 5. Did 0006's privilege revocations land? (should show NO rows for
--    authenticated/anon having insert/update/delete on payments/registrations)
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('payments', 'registrations')
  and grantee in ('authenticated', 'anon')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
order by table_name, grantee, privilege_type;

-- 6. How many admins are currently configured?
select count(*) as admin_count from public.admin_users;

-- 7. Rough row counts, for context (no PII returned).
select
  (select count(*) from public.families) as families,
  (select count(*) from public.children) as children,
  (select count(*) from public.registrations) as registrations,
  (select count(*) from public.payments) as payments,
  (select count(*) from public.payments where status = 'paid') as paid_payments,
  (select count(*) from public.cancellation_requests) as cancellation_requests;

-- 8. Auth settings relevant to the Cloudflare redirect (Site URL / Redirect
--    URLs aren't queryable via SQL — check Authentication -> URL
--    Configuration in the dashboard directly and tell me what's listed).
