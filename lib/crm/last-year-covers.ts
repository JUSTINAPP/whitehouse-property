import { VenueSlug } from "@/lib/types";
import type { DayCovers } from "@/lib/mock/reservations";
import { getLastYearWeekCovers } from "@/lib/mock/reservations";

export type LastYearCoversResult =
  | { ok: true; weekCovers: DayCovers[] }
  | { ok: false; reason: "not-configured" | "error"; message: string };

// Demo mode: reads the deterministic mock "last year" generator directly
// rather than querying the Supabase visit ledger.
export async function fetchLastYearCovers(venueSlug: VenueSlug): Promise<LastYearCoversResult> {
  return { ok: true, weekCovers: getLastYearWeekCovers(venueSlug) };
}
