import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Guest, GuestHighlight, GuestTag, VenueSlug } from "@/lib/types";

interface CrmGuestRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  is_vip: boolean | null;
  notes: string | null;
  staff_notes: string | null;
  highlights: GuestHighlight[] | null;
  visit_count: number | null;
  last_seen: string | null;
  total_spend: number | null;
}

export type CrmGuestsResult =
  | { ok: true; data: Guest[] }
  | { ok: false; reason: "not-configured" | "error"; message: string };

function mapRow(row: CrmGuestRow, venue: VenueSlug): Guest {
  const tags: GuestTag[] = row.is_vip ? ["VIP"] : [];
  return {
    id: row.id,
    venueId: venue,
    name: row.name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    visitCount: row.visit_count ?? 0,
    lastVisit: row.last_seen ?? "",
    totalSpend: row.total_spend ?? 0,
    tags,
    notes: row.notes ?? undefined,
    staffNotes: row.staff_notes ?? undefined,
    highlights: row.highlights ?? [],
    // Populated on demand when a guest's profile is opened -- see
    // lib/crm/guest-visits-server.ts -- rather than eagerly loaded for
    // every guest in the list.
    visitHistory: [],
  };
}

/**
 * Reads the synced guest roster from Supabase (crm_guests) rather than
 * calling SevenRooms live -- populated by lib/sevenrooms/sync.ts, which
 * runs nightly via Vercel Cron plus whenever triggered manually. This is
 * what gives guest totalSpend real numbers (aggregated from the visit
 * ledger, including real POS data for venues on OrderMate) instead of the
 * $0 SevenRooms itself reports via clients/export.
 */
export async function fetchCrmGuestsServerData(venue: VenueSlug): Promise<CrmGuestsResult> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase isn't configured in this environment." };
  }

  const { data, error } = await supabase
    .from("crm_guests")
    .select("id, name, email, phone, is_vip, notes, staff_notes, highlights, visit_count, last_seen, total_spend")
    .eq("venue_slug", venue)
    .order("visit_count", { ascending: false });

  if (error) {
    return { ok: false, reason: "error", message: `Failed to read guests: ${error.message}` };
  }

  return { ok: true, data: (data ?? []).map((row) => mapRow(row, venue)) };
}

export type UpdateStaffNotesResult = { ok: true } | { ok: false; reason: "not-configured" | "error"; message: string };

/** Updates only staff_notes -- never touches any SevenRooms-sourced column. */
export async function updateGuestStaffNotes(guestId: string, staffNotes: string): Promise<UpdateStaffNotesResult> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase isn't configured in this environment." };
  }

  const { error } = await supabase
    .from("crm_guests")
    .update({ staff_notes: staffNotes, updated_at: new Date().toISOString() })
    .eq("id", guestId);

  if (error) {
    return { ok: false, reason: "error", message: `Failed to save note: ${error.message}` };
  }

  return { ok: true };
}

/** Updates only highlights -- same dashboard-only rule as staff_notes. */
export async function updateGuestHighlights(guestId: string, highlights: GuestHighlight[]): Promise<UpdateStaffNotesResult> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase isn't configured in this environment." };
  }

  const { error } = await supabase
    .from("crm_guests")
    .update({ highlights, updated_at: new Date().toISOString() })
    .eq("id", guestId);

  if (error) {
    return { ok: false, reason: "error", message: `Failed to save highlights: ${error.message}` };
  }

  return { ok: true };
}
