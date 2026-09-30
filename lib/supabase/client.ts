import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./status";

let browserClient: SupabaseClient | null = null;

// Uses @supabase/ssr's browser client (not the plain supabase-js client) so
// the session is stored in cookies rather than localStorage — that's what
// lets middleware.ts read the session server-side and gate every route.
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return browserClient;
}
