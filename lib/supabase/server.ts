import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./status";

export function getSupabaseServiceClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === "your-service-role-key") return null;

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });
}

/**
 * For server-side reads/writes that don't need the service role — falls
 * back to the anon key (this project's tables have RLS disabled, same as
 * the browser client) so routes work before a service key is provisioned.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const service = getSupabaseServiceClient();
  if (service) return service;
  if (!isSupabaseConfigured()) return null;

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}
