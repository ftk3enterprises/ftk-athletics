import type { User } from "@/types";
import { createClient } from "@/lib/supabase/client";

/**
 * Real Supabase Auth. Display name lives in `user_metadata.name` (set at
 * sign-up) rather than a separate profiles table — Family already covers
 * everything else about a signed-in parent.
 */

function toPublicUser(supabaseUser: {
  id: string;
  email?: string;
  created_at: string;
  user_metadata: Record<string, unknown>;
}): User {
  // Google (and other OAuth providers) populate `full_name`/`name` instead
  // of the `name` key our own sign-up form writes — check both so a
  // Google-authenticated parent gets their real name, not a blank one.
  const metadataName =
    (supabaseUser.user_metadata.name as string | undefined) ??
    (supabaseUser.user_metadata.full_name as string | undefined) ??
    "";
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    name: metadataName,
    createdAt: supabaseUser.created_at,
  };
}

/**
 * `needsEmailConfirmation: true` means the account was created but there is
 * no active session yet — this Supabase project requires the user to click
 * the link in their confirmation email (handled by
 * src/app/auth/confirm/route.ts) before they're actually signed in. Callers
 * must not treat this as a normal signed-in state.
 */
export async function signUp(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: User; needsEmailConfirmation: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { name: input.name },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Sign up failed. Please try again.");
  return { user: toPublicUser(data.user), needsEmailConfirmation: !data.session };
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<User> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) throw new Error("Invalid email or password.");
  if (!data.user) throw new Error("Sign in failed. Please try again.");
  return toPublicUser(data.user);
}

/**
 * Starts the Google OAuth flow. Google client ID/secret live only in the
 * Supabase Dashboard (Authentication -> Providers -> Google) — never in
 * this codebase, client or server. Supabase redirects the browser to
 * Google, then back to its own /auth/v1/callback, then on to our
 * `/auth/callback?next=...` route handler which exchanges the code for a
 * session and routes the user based on role.
 */
export async function signInWithGoogle(next: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? toPublicUser(user) : null;
}

/**
 * Checks the `admin_users` table (see supabase/migrations/0003_admin_roles.sql)
 * for the current user's own row. RLS only allows a user to read their own
 * row, so this can never be used to probe whether someone else is an admin —
 * this is a read, not an authorization decision by itself; server-side
 * pages/routes re-check via src/lib/admin-auth.ts before showing admin data.
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Sends a password-reset email. The link lands on /auth/reset-password,
 * which handles establishing the temporary recovery session itself (it
 * can't rely on a known param shape without a custom email template, which
 * requires SMTP to be configured first — see that page for the details).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw new Error(error.message);
}

/** Must be called with an active recovery session (see /auth/reset-password). */
export async function updatePassword(newPassword: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}
