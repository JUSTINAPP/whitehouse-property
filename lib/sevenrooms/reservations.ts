import { Reservation, VenueSlug } from "@/lib/types";
import { getReservationsToday } from "@/lib/mock/reservations";
import { TODAY_ISO } from "@/lib/mock/dates";

export type ReservationsResult =
  | { ok: true; date: string; reservations: Reservation[] }
  | { ok: false; reason: "not-configured-venue" | "not-configured-env" | "error"; message: string };

// Demo mode: no real SevenRooms connection exists for this prospective
// client, so this reads from the deterministic mock generator instead of
// calling a real API. Only "today" has a generated reservation list (same
// limitation the mock data always had); other dates return an empty day
// rather than fabricating a second full day of data.
export async function fetchLiveReservations(venueSlug: VenueSlug, date?: string): Promise<ReservationsResult> {
  const targetDate = date ?? TODAY_ISO;
  const reservations = targetDate === TODAY_ISO ? getReservationsToday(venueSlug) : [];
  return { ok: true, date: targetDate, reservations };
}
