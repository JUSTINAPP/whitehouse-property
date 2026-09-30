import { VenueSlug } from "@/lib/types";
import type { DayCovers } from "@/lib/mock/reservations";
import { getWeekCovers } from "@/lib/mock/reservations";

export type WeekCoversResult =
  | { ok: true; weekCovers: DayCovers[] }
  | { ok: false; reason: "not-configured-venue" | "not-configured-env" | "error"; message: string };

// Demo mode: reads the deterministic mock week-covers generator directly
// rather than calling a real SevenRooms-backed API.
export async function fetchLiveWeekCovers(venueSlug: VenueSlug): Promise<WeekCoversResult> {
  return { ok: true, weekCovers: getWeekCovers(venueSlug) };
}
