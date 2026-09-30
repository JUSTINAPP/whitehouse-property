import { VenueSlug } from "@/lib/types";

export interface WebsiteAnalyticsRecommendation {
  title: string;
  detail: string;
}

export interface WebsiteAnalyticsInsights {
  summary: string;
  recommendations: WebsiteAnalyticsRecommendation[];
  generatedAt: string;
}

export type WebsiteAnalyticsInsightsResult = { ok: true; data: WebsiteAnalyticsInsights } | { ok: false; message: string };

export async function fetchWebsiteAnalyticsInsights(venueSlug: VenueSlug): Promise<WebsiteAnalyticsInsightsResult> {
  try {
    const res = await fetch("/api/marketing/website-analytics/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venue: venueSlug }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: body.error ?? `Failed to generate insights (${res.status})` };
    }
    return { ok: true, data: body as WebsiteAnalyticsInsights };
  } catch {
    return { ok: false, message: "Couldn't reach the server." };
  }
}
