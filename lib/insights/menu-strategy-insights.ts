import { VenueSlug } from "@/lib/types";

interface WatchItem {
  title: string;
  detail: string;
  category: string;
}

export type MenuStrategyInsightsResult =
  | { ok: true; data: { summary: string; watchItems: WatchItem[]; generatedAt: string } }
  | { ok: false; message: string };

export async function fetchMenuStrategyInsights(venue: VenueSlug): Promise<MenuStrategyInsightsResult> {
  try {
    const res = await fetch("/api/menu-strategy-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venue }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: typeof body?.error === "string" ? body.error : "Failed to get insights." };
    }
    return { ok: true, data: { summary: body.summary ?? "", watchItems: body.watchItems ?? [], generatedAt: body.generatedAt } };
  } catch {
    return { ok: false, message: "Failed to reach the insights service." };
  }
}
