import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { InstagramConnection, VenueSlug } from "@/lib/types";

/**
 * Reads connection status from venues_instagram_config. The OAuth flow that
 * populates this table is built separately — for now every venue reads back
 * as not connected (either because the table doesn't exist yet, or because
 * no row has an access_token), and the UI shows a "Connect Instagram"
 * placeholder rather than failing.
 */
export async function fetchInstagramConnection(venueSlug: VenueSlug): Promise<InstagramConnection> {
  const fallback: InstagramConnection = { venueId: venueSlug, connected: false };

  const client = getSupabaseBrowserClient();
  if (!client) return fallback;

  const { data: venueRow } = await client.from("venues").select("id").eq("slug", venueSlug).maybeSingle();
  if (!venueRow) return fallback;

  const { data, error } = await client
    .from("venues_instagram_config")
    .select("username, access_token, connected_at")
    .eq("venue_id", venueRow.id)
    .maybeSingle();

  if (error || !data || !data.access_token) return fallback;

  return {
    venueId: venueSlug,
    connected: true,
    username: data.username,
    connectedAt: data.connected_at,
  };
}
