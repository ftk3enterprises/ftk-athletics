import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Lands here after Google OAuth (see authService.signInWithGoogle) and after
 * Supabase's own /auth/v1/callback exchanges the Google code for a Supabase
 * auth code. We exchange that code for a session, then route by role:
 * admins always go to /admin regardless of what `next` was, everyone else
 * goes to `next` (the page they started from, or /profile by default) —
 * same pattern as the email/password sign-in handler in auth-form.tsx.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const rawNext = searchParams.get("next");
  const next = rawNext && rawNext.startsWith("/") ? rawNext : "/profile";

  // User closed the Google account picker or denied consent.
  if (oauthError) {
    return NextResponse.redirect(`${origin}/auth?tab=sign-in&error=oauth_cancelled`);
  }

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      return NextResponse.redirect(`${origin}${adminRow ? "/admin" : next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?tab=sign-in&error=oauth_failed`);
}
