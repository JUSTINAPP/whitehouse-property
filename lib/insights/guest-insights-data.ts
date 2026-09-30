import { getSupabaseServerClient } from "@/lib/supabase/server";
import { GuestHighlight, VenueSlug } from "@/lib/types";

interface GuestAggRow {
  id: string;
  name: string | null;
  is_vip: boolean | null;
  highlights: GuestHighlight[] | null;
  visit_count: number | null;
  total_spend: number | null;
  first_seen: string | null;
  last_seen: string | null;
}

interface VisitItemRow {
  guest_id: string | null;
  items: { name: string; price: number; quantity: number }[] | null;
}

export interface HighlightRollupEntry {
  type: string;
  count: number;
  examples: string[];
}

export interface CadenceFlag {
  name: string;
  visitCount: number;
  avgGapDays: number;
  currentGapDays: number;
}

export interface TopItem {
  name: string;
  count: number;
}

export interface GuestInsightsContext {
  venue: VenueSlug;
  totalGuests: number;
  totalSpend: number;
  hasRealSpendData: boolean; // false for venues not yet on a POS feeding real spend (e.g. South Beach)
  topSpendGuestCount: number;
  topSpendSharePct: number | null; // top 10%'s share of total spend
  oneAndDoneCount: number;
  oneAndDoneRatePct: number;
  lapsedCount: number;
  lapsedSpendValue: number;
  highlightRollup: HighlightRollupEntry[];
  cadenceFlags: CadenceFlag[];
  topItems: TopItem[] | null; // only populated for venues with itemized POS data (Volpino)
}

const LAPSED_MIN_VISITS = 2;
const LAPSED_MIN_DAYS = 60;

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((now.getTime() - d.getTime()) / 86400000);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`).getTime();
  const db = new Date(`${b}T00:00:00`).getTime();
  return Math.round((db - da) / 86400000);
}

export type GuestInsightsContextResult =
  | { ok: true; data: GuestInsightsContext }
  | { ok: false; message: string };

/**
 * Assembles the real, synced numbers behind a "what does this guest list
 * actually tell us" briefing: spend concentration, the win-back segment's
 * dollar value, an allergy/highlight roll-up for kitchen prep, guests whose
 * visit rhythm has slowed relative to their own history (not just a flat
 * day cutoff), and -- for venues with itemized POS data -- which dishes the
 * biggest spenders actually order.
 */
export async function gatherGuestInsightsContext(venue: VenueSlug): Promise<GuestInsightsContextResult> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: "Supabase isn't configured in this environment." };
  }

  const { data: guestRows, error } = await supabase
    .from("crm_guests")
    .select("id, name, is_vip, highlights, visit_count, total_spend, first_seen, last_seen")
    .eq("venue_slug", venue);

  if (error) {
    return { ok: false, message: `Failed to read guests: ${error.message}` };
  }

  const guests = (guestRows ?? []) as GuestAggRow[];
  const totalGuests = guests.length;
  const totalSpend = guests.reduce((sum, g) => sum + (g.total_spend ?? 0), 0);
  const hasRealSpendData = totalSpend > 0;

  const bySpendDesc = [...guests].sort((a, b) => (b.total_spend ?? 0) - (a.total_spend ?? 0));
  const topSpendGuestCount = Math.max(1, Math.ceil(totalGuests * 0.1));
  const topSpendSharePct = hasRealSpendData
    ? Math.round(
        (bySpendDesc.slice(0, topSpendGuestCount).reduce((sum, g) => sum + (g.total_spend ?? 0), 0) / totalSpend) * 100
      )
    : null;

  const oneAndDoneCount = guests.filter((g) => (g.visit_count ?? 0) === 1).length;
  const oneAndDoneRatePct = totalGuests > 0 ? Math.round((oneAndDoneCount / totalGuests) * 100) : 0;

  const lapsedGuests = guests.filter(
    (g) => (g.visit_count ?? 0) >= LAPSED_MIN_VISITS && (daysSince(g.last_seen) ?? -1) >= LAPSED_MIN_DAYS
  );
  const lapsedCount = lapsedGuests.length;
  const lapsedSpendValue = lapsedGuests.reduce((sum, g) => sum + (g.total_spend ?? 0), 0);

  const highlightMap = new Map<string, string[]>();
  for (const g of guests) {
    for (const h of g.highlights ?? []) {
      const list = highlightMap.get(h.type) ?? [];
      if (list.length < 3) list.push(h.text);
      highlightMap.set(h.type, list);
    }
  }
  const highlightCounts = new Map<string, number>();
  for (const g of guests) {
    for (const h of g.highlights ?? []) {
      highlightCounts.set(h.type, (highlightCounts.get(h.type) ?? 0) + 1);
    }
  }
  const highlightRollup: HighlightRollupEntry[] = Array.from(highlightCounts.entries())
    .map(([type, count]) => ({ type, count, examples: highlightMap.get(type) ?? [] }))
    .sort((a, b) => b.count - a.count);

  // Cadence flags: guests with enough history (3+ visits) whose current gap
  // since their last visit is more than double their own historical average
  // gap -- catches a slowing-down regular earlier than a flat day cutoff
  // would, since it's relative to each guest's own rhythm.
  const cadenceFlags: CadenceFlag[] = guests
    .filter((g) => (g.visit_count ?? 0) >= 3 && g.first_seen && g.last_seen && g.first_seen !== g.last_seen)
    .map((g) => {
      const span = daysBetween(g.first_seen!, g.last_seen!);
      const avgGapDays = span / ((g.visit_count ?? 1) - 1);
      const currentGapDays = daysSince(g.last_seen) ?? 0;
      return { name: g.name ?? "Guest", visitCount: g.visit_count ?? 0, avgGapDays, currentGapDays };
    })
    .filter((f) => f.avgGapDays > 0 && f.currentGapDays >= 21 && f.currentGapDays > f.avgGapDays * 2)
    .sort((a, b) => b.currentGapDays / b.avgGapDays - a.currentGapDays / a.avgGapDays)
    .slice(0, 6);

  // Menu cross-sell: only meaningful for venues with itemized POS data.
  // No Whitehouse venue has one connected in this demo, so this never
  // triggers -- kept so it activates automatically if that ever changes.
  // Looks at what the top spenders actually order, not the whole guest base.
  let topItems: TopItem[] | null = null;
  if (hasRealSpendData) {
    const topSpenderIds = bySpendDesc.slice(0, 20).map((g) => g.id);
    if (topSpenderIds.length > 0) {
      const { data: visitRows } = await supabase
        .from("crm_guest_visits")
        .select("guest_id, items")
        .eq("venue_slug", venue)
        .neq("status", "cancelled")
        .in("guest_id", topSpenderIds);

      const itemCounts = new Map<string, number>();
      for (const row of (visitRows ?? []) as VisitItemRow[]) {
        for (const item of row.items ?? []) {
          itemCounts.set(item.name, (itemCounts.get(item.name) ?? 0) + (item.quantity ?? 1));
        }
      }
      topItems = Array.from(itemCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    }
  }

  return {
    ok: true,
    data: {
      venue,
      totalGuests,
      totalSpend,
      hasRealSpendData,
      topSpendGuestCount,
      topSpendSharePct,
      oneAndDoneCount,
      oneAndDoneRatePct,
      lapsedCount,
      lapsedSpendValue,
      highlightRollup,
      cadenceFlags,
      topItems,
    },
  };
}
