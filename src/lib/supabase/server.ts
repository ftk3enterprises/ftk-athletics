import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side Supabase client for Server Components / Server Actions /
 * Route Handlers — reads the signed-in user's session from cookies. Create
 * a new one per request; never share across requests.
 *
 * `setAll` throws when called from a plain Server Component (cookies are
 * read-only there) — safe to ignore because `src/proxy.ts` already refreshes
 * the session cookie on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — ignore, proxy.ts handles refresh.
          }
        },
      },
    }
  );
}
