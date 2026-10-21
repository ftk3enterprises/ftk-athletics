import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client — used by AuthProvider and every client
 * ("use client") service file. Safe to call repeatedly; createBrowserClient
 * returns a singleton under the hood.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
