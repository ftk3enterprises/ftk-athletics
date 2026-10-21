import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session cookie on every request. Named
 * `proxy.ts` (not `middleware.ts`) — Next.js 16 renamed the convention; see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Required by @supabase/ssr to trigger a token refresh when needed.
  await supabase.auth.getUser();

  return response;
}

/**
 * Excludes, in addition to the existing static-asset exclusions, routes that
 * never render user/session-specific UI: the marketing pages, program
 * listings, schedule, and the Stripe webhook (machine-to-machine,
 * signature-verified, never has a user session). Skipping the middleware on
 * these lets Cloudflare serve them as static assets or plain Worker
 * responses without the per-request session-refresh round trip — the
 * client-side Supabase client still refreshes its own session as needed, so
 * auth correctness on session-aware routes (auth/profile/register/admin/
 * other API routes) is unaffected.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|programs(?:/.*)?$|schedule$|robots\\.txt$|sitemap\\.xml$|api/webhooks/stripe$|$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
