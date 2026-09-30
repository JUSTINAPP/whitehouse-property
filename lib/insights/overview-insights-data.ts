import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getReservationsToday, getWeekCovers, getLastYearWeekCovers } from "@/lib/mock/reservations";
import { todayInVenueTimezone } from "@/lib/venue-time";
import { GuestHighlight, VenueSlug } from "@/lib/types";

export interface OverviewInsightsContext {
  venue: VenueSlug;
  today: string;
  todayCoversCount: number;
  todayReservationsCount: number;
  thisWeekTotal: number;
  lastYearSameWeekTotal: number | null;
  vipGuestsToday: { name: string; time: string; partySize: number; visitCount: number }[];
  flaggedGuestsToday: { name: string; time: string; highlights: GuestHighlight[] }[];
}

export type OverviewInsightsContextResult =
  | { ok: true; data: OverviewInsightsContext }
  | { ok: false; message: string };

/**
 * Demo mode: this dashboard has no real SevenRooms connection (Whitehouse
 * Property Group is a prospective client), so "today's reservations" and
 * week covers come from the deterministic mock generators instead of a
 * live reservations API. VIPs and highlights are still cross-referenced
 * against the real, seeded Supabase crm_guests roster -- matched by guest
 * name rather than a SevenRooms client_id, since the mock reservations
 * don't carry one.
 */
export async function gatherOverviewInsightsContext(venue: VenueSlug): Promise<OverviewInsightsContextResult> {
  const today = todayInVenueTimezone();

  const todaysReservations = getReservationsToday(venue).filter((r) => r.status !== "cancelled");
  const weekCovers = getWeekCovers(venue);
  const lastYearCovers = getLastYearWeekCovers(venue);

  const thisWeekTotal = weekCovers.reduce((sum, d) => sum + d.covers, 0);
  const lastYearSameWeekTotal = lastYearCovers.reduce((sum, d) => sum + d.covers, 0);

  let vipGuestsToday: OverviewInsightsContext["vipGuestsToday"] = [];
  let flaggedGuestsToday: OverviewInsightsContext["flaggedGuestsToday"] = [];

  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data: guestRows } = await supabase
      .from("crm_guests")
      .select("name, is_vip, highlights, visit_count")
      .eq("venue_slug", venue);

    const byName = new Map(
      (guestRows ?? []).map((g) => [
        (g.name as string | null)?.toLowerCase().trim() ?? "",
        { isVip: g.is_vip as boolean | null, highlights: (g.highlights ?? []) as GuestHighlight[], visitCount: g.visit_count as number | null },
      ])
    );

    for (const r of todaysReservations) {
      const guest = byName.get(r.guestName.toLowerCase().trim());
      if (!guest) continue;
      if (guest.isVip) {
        vipGuestsToday.push({ name: r.guestName, time: r.reservationTime, partySize: r.partySize, visitCount: guest.visitCount ?? 0 });
      }
      if (guest.highlights.length > 0) {
        flaggedGuestsToday.push({ name: r.guestName, time: r.reservationTime, highlights: guest.highlights });
      }
    }
  }

  vipGuestsToday = vipGuestsToday.slice(0, 10);
  flaggedGuestsToday = flaggedGuestsToday.slice(0, 10);

  return {
    ok: true,
    data: {
      venue,
      today,
      todayCoversCount: todaysReservations.reduce((sum, r) => sum + r.partySize, 0),
      todayReservationsCount: todaysReservations.length,
      thisWeekTotal,
      lastYearSameWeekTotal,
      vipGuestsToday,
      flaggedGuestsToday,
    },
  };
}
