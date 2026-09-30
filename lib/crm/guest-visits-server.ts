import { getSupabaseServerClient } from "@/lib/supabase/server";
import { VisitRecord } from "@/lib/types";

interface CrmGuestVisitRow {
  visit_date: string | null;
  party_size: number | null;
  spend_total: number | null;
  status: string | null;
  notes: string | null;
}

export type GuestVisitsResult =
  | { ok: true; data: VisitRecord[] }
  | { ok: false; reason: "not-configured" | "error"; message: string };

/**
 * Fetches one guest's full visit ledger (crm_guest_visits) for the Guest
 * Profile drawer -- fetched on demand per guest rather than eagerly for the
 * whole list, since a single venue can have 1,000+ visit rows.
 */
export async function fetchGuestVisitsServerData(guestId: string): Promise<GuestVisitsResult> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "not-configured", message: "Supabase isn't configured in this environment." };
  }

  const { data, error } = await supabase
    .from("crm_guest_visits")
    .select("visit_date, party_size, spend_total, status, notes")
    .eq("guest_id", guestId)
    .neq("status", "cancelled")
    .order("visit_date", { ascending: false });

  if (error) {
    return { ok: false, reason: "error", message: `Failed to read visit history: ${error.message}` };
  }

  const visits: VisitRecord[] = (data ?? []).map((row: CrmGuestVisitRow) => ({
    date: row.visit_date ?? "",
    partySize: row.party_size ?? 0,
    spend: row.spend_total ?? 0,
    notes: row.notes ?? undefined,
  }));

  return { ok: true, data: visits };
}
