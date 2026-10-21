import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * The single source of truth for "is the currently signed-in user an
 * admin?" — backed by the `admin_users` table (see
 * supabase/migrations/0003_admin_roles.sql), never by a hardcoded email
 * list or editable user metadata. Uses the session-bound server client, not
 * the service-role client — RLS already allows a user to read only their
 * own row, which is exactly the check this needs.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return Boolean(data);
}
