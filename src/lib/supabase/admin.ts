import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — full read/write access, bypasses RLS.
 * Server-only (the `server-only` import throws a build error if this is
 * ever pulled into a client bundle). Used exclusively by admin-service.ts
 * to read data no single family's RLS policy would allow seeing — never
 * import this from a "use client" file or anything a browser could trigger.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
