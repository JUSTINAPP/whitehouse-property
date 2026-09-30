import { getSupabaseServerClient } from "@/lib/supabase/server";
import { VenueSlug } from "@/lib/types";
import type { DayCovers } from "@/lib/mock/reservations";
import { nowInVenueTimezone } from "@/lib/venue-time";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Same Mon-Sun as currentWeekDates() in week-covers-server.ts, but shifted
 * back 364 days (52 full weeks) rather than a literal 365/366 -- keeps the
 * day-of-week alignment exact (this Monday compares to a Monday, not a
 * Tuesday), which matters more for a covers comparison than the calendar
 * date being exactly one year prior.
 */
function lastYearWeekDates(): string[] {
  // Melbourne's calendar date, not the server's (Vercel runs in UTC) --
  // otherwise this week's comparison range can drift onto the wrong week
  // for most of the Australian day.
  const now = nowInVenueTimezone();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + diff - 364);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return toISODate(d);
  });
}

export type LastYearCoversResult =
  | { ok: true; data: DayCovers[]; weekStart: string; weekEnd: string }
  | { ok: false; reason: "not-configured" | "error"; message: string };

/**
 * Reads the same week from ~a year ago out of the Supabase visit ledger
 * (crm_guest_visits) rather than SevenRooms directly -- SevenRooms could
 * technically answer this too via an old date range, but the ledger is
 * already synced and cheaper to query repeatedly than re-fetching a year-old
 * date range from SevenRooms on every page load.
 */
export async function fetchLastYearWeekCoversServerData(venue: VenueSlug): Promise<LastYearCoversResult> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase isn't configured in this environment." };
  }

  const weekDates = lastYearWeekDates();

  const { data, error } = await supabase
    .from("crm_guest_visits")
    .select("visit_date, party_size, status")
    .eq("venue_slug", venue)
    .gte("visit_date", weekDates[0])
    .lte("visit_date", weekDates[6]);

  if (error) {
    return { ok: false, reason: "error", message: `Failed to read last year's covers: ${error.message}` };
  }

  const coversByDate = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.status === "cancelled" || !row.visit_date) continue;
    coversByDate.set(row.visit_date, (coversByDate.get(row.visit_date) ?? 0) + (row.party_size ?? 0));
  }

  const result: DayCovers[] = weekDates.map((date, i) => ({
    date,
    label: DAY_LABELS[i],
    covers: coversByDate.get(date) ?? 0,
  }));

  return { ok: true, data: result, weekStart: weekDates[0], weekEnd: weekDates[6] };
}
