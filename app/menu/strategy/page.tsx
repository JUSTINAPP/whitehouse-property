"use client";

import { useState } from "react";
import { Camera, Loader2, Sparkles, TrendingUp, Palette } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { fetchMenuStrategyInsights, MenuStrategyInsightsResult } from "@/lib/insights/menu-strategy-insights";

const CATEGORY_ICON: Record<string, typeof Camera> = {
  Photography: Camera,
  Trends: TrendingUp,
  Content: Sparkles,
};

const BEST_PRACTICES = [
  {
    icon: Camera,
    title: "Shoot to the shot list, not around it",
    detail:
      "Use the Shot List & Gallery tab to see every dish that's never been photographed. Prioritise anything in a high-traffic section (first panel, top of a column) over a dish already well covered — an empty square there is lost reach every day it stays empty.",
  },
  {
    icon: Palette,
    title: "Match photography to brand, not trends",
    detail:
      "Check the Guidelines tab under Social Calendar before a shoot — colour palette, tone, and styling direction are set there. A trending food-photo style that clashes with the venue's established look costs more in brand consistency than it gains in engagement.",
  },
  {
    icon: TrendingUp,
    title: "Shoot seasonally, ahead of the menu change",
    detail:
      "Plan shoots 2–3 weeks before a seasonal menu refresh goes live, not after — this gives content a head start for teaser posts and means the print/online menu never launches with a placeholder image.",
  },
  {
    icon: Sparkles,
    title: "Treat drinks and atmosphere as equally sellable",
    detail:
      "A beautifully shot cocktail or room shot sells the venue, not just one dish — keep the Featured hero shots section stocked, not just the per-dish grid, since those are what typically perform best as the first image in a carousel or ad.",
  },
];

export default function MenuStrategyPage() {
  const { venue } = useVenue();
  const [insights, setInsights] = useState<MenuStrategyInsightsResult | null>(null);
  const [loading, setLoading] = useState(false);

  function handleGetInsights() {
    setLoading(true);
    fetchMenuStrategyInsights(venue.slug).then((res) => {
      setInsights(res);
      setLoading(false);
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Food Strategy"
        subtitle={`Photography priorities, trends, and content ideas for ${venue.name} — grounded in the real, current menu, not generic advice.`}
      />

      <div className="mb-8 rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
            >
              <Sparkles className="h-4 w-4" style={{ color: venue.accent }} />
            </span>
            <h3 className="text-sm font-semibold text-ink">AI strategy briefing</h3>
          </div>
          <button
            onClick={handleGetInsights}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: venue.accent }}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {insights?.ok ? "Regenerate briefing" : "Get strategy briefing"}
          </button>
        </div>

        {!insights && !loading && (
          <p className="text-sm text-ink-soft">
            Reads {venue.name}&apos;s actual current menu and gives real, dish-specific recommendations: which items are the strongest hero-shot
            candidates, current Australian hospitality food trends relevant to this menu, and concrete content/shoot ideas — all naming real
            dishes, not generic advice.
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-2 py-4 text-sm text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" />
            Reading the menu...
          </div>
        )}

        {insights && !insights.ok && <IntegrationNote text={insights.message} />}

        {insights?.ok && (
          <div>
            <p className="mb-4 text-sm leading-relaxed text-ink">{insights.data.summary}</p>
            {insights.data.watchItems.length > 0 && (
              <div className="space-y-2.5">
                {insights.data.watchItems.map((item, i) => {
                  const Icon = CATEGORY_ICON[item.category] ?? Sparkles;
                  return (
                    <div key={i} className="rounded-lg bg-cream-dim px-3.5 py-3">
                      <div className="mb-1 flex items-center gap-2">
                        <span
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                          style={{ backgroundColor: venue.accent }}
                        >
                          <Icon className="h-2.5 w-2.5" />
                          {item.category}
                        </span>
                        <p className="text-sm font-medium text-ink">{item.title}</p>
                      </div>
                      <p className="text-sm text-ink-soft">{item.detail}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-ink">Food content best practice</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {BEST_PRACTICES.map((bp) => (
            <div key={bp.title} className="flex gap-3 rounded-lg bg-cream-dim px-3.5 py-3.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
              >
                <bp.icon className="h-3.5 w-3.5" style={{ color: venue.accent }} />
              </span>
              <div>
                <p className="mb-1 text-sm font-medium text-ink">{bp.title}</p>
                <p className="text-sm text-ink-soft">{bp.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
