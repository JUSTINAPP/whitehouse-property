import { VenueSlug } from "@/lib/types";

export interface SearchConsoleRecommendation {
  title: string;
  detail: string;
}

export interface SearchConsoleInsights {
  summary: string;
  recommendations: SearchConsoleRecommendation[];
  generatedAt: string;
}

export type SearchConsoleInsightsResult = { ok: true; data: SearchConsoleInsights } | { ok: false; message: string };

export async function fetchSearchConsoleInsights(venueSlug: VenueSlug): Promise<SearchConsoleInsightsResult> {
  try {
    const res = await fetch("/api/marketing/search-console/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venue: venueSlug }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: body.error ?? `Failed to generate insights (${res.status})` };
    }
    return { ok: true, data: body as SearchConsoleInsights };
  } catch {
    return { ok: false, message: "Couldn't reach the server." };
  }
}
