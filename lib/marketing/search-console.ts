import { VenueSlug } from "@/lib/types";

export interface SearchConsoleTotals {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleBreakdownRow {
  label: string; // a query string, or a page URL, depending on the list
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleData {
  startDate: string;
  endDate: string;
  totals: SearchConsoleTotals;
  topQueries: SearchConsoleBreakdownRow[];
  topPages: SearchConsoleBreakdownRow[];
}

export type SearchConsoleResult =
  | { ok: true; data: SearchConsoleData }
  | { ok: false; reason: "not-configured-venue" | "not-configured-env" | "error"; message: string };

export async function fetchSearchConsoleData(venueSlug: VenueSlug): Promise<SearchConsoleResult> {
  try {
    const res = await fetch(`/api/marketing/search-console?venue=${venueSlug}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        reason: body.reason ?? "error",
        message: body.message ?? `Failed to load Search Console data (${res.status})`,
      };
    }
    return { ok: true, data: body as SearchConsoleData };
  } catch {
    return { ok: false, reason: "error", message: "Couldn't reach the server." };
  }
}
