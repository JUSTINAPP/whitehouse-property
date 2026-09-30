import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./status";

/**
 * Cookie-aware Supabase client for Server Components and Route Handlers —
 * reads/writes the same session cookies the browser client and middleware
 * use, so `supabase.auth.getUser()` reflects who's actually logged in.
 */
export async function getSupabaseServerAuthClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component that can't set cookies — safe to
          // ignore since middleware refreshes the session on every request.
        }
      },
    },
  });
}
