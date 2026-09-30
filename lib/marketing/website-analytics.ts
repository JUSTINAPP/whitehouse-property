import { VenueSlug } from "@/lib/types";

export interface WebsiteAnalyticsTotals {
  sessions: number;
  activeUsers: number;
  pageViews: number;
  engagementRate: number;
}

export interface WebsiteAnalyticsBreakdownRow {
  label: string;
  sessions: number;
  activeUsers: number;
}

export interface WebsiteAnalyticsData {
  startDate: string;
  endDate: string;
  totals: WebsiteAnalyticsTotals;
  topPages: WebsiteAnalyticsBreakdownRow[];
  channels: WebsiteAnalyticsBreakdownRow[];
}

export type WebsiteAnalyticsResult =
  | { ok: true; data: WebsiteAnalyticsData }
  | { ok: false; reason: "not-configured-venue" | "not-configured-env" | "error"; message: string };

export async function fetchWebsiteAnalyticsData(venueSlug: VenueSlug): Promise<WebsiteAnalyticsResult> {
  try {
    const res = await fetch(`/api/marketing/website-analytics?venue=${venueSlug}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        reason: body.reason ?? "error",
        message: body.message ?? `Failed to load Website Analytics data (${res.status})`,
      };
    }
    return { ok: true, data: body as WebsiteAnalyticsData };
  } catch {
    return { ok: false, reason: "error", message: "Couldn't reach the server." };
  }
}
