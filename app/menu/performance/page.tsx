"use client";

import { BarChart4 } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";

export default function MenuPerformancePage() {
  const { venue } = useVenue();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Menu Performance"
        subtitle={`Which dishes at ${venue.name} are actually selling, not just sitting on the page — reserved here, ready to switch on once POS/sales data is connected.`}
      />

      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
          >
            <BarChart4 className="h-4 w-4" style={{ color: venue.accent }} />
          </span>
          <h3 className="text-sm font-semibold text-ink">Not set up yet</h3>
        </div>

        <IntegrationNote
          text={`No point-of-sale or order data is connected for ${venue.name} yet. What this covers once connected: item-level sales volume and margin, which dishes are actually top sellers vs. just well-positioned, and which shot-list priorities (see Shot List & Gallery) should move up because the dish is outselling its photography coverage.`}
        />

        <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-soft">
          <p>
            <span className="font-medium text-ink">Why this is separate from Menu Insights: </span>
            The existing menu-engineering briefing (on the Current Menu tab) already reasons about layout and pricing psychology, but
            explicitly avoids claiming anything is &ldquo;selling well&rdquo; since no sales data is connected. Once a POS integration is
            in place, this tab replaces that caveat with real numbers — and the Food Strategy tab&rsquo;s photography priorities can be
            weighted by what&rsquo;s actually moving, not just by layout position.
          </p>
        </div>
      </div>
    </div>
  );
}
