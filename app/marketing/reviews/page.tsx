"use client";

import { Star } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { GOOGLE_BUSINESS_CONFIG } from "@/lib/marketing/google-business-config";

export default function ReviewsPage() {
  const { venue } = useVenue();
  const hasGoogleBusiness = Boolean(GOOGLE_BUSINESS_CONFIG[venue.slug]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Reviews"
        subtitle={`Rating and review trend for ${venue.name} across the platforms that actually matter for a venue like this. Reserved here, ready as pieces connect.`}
      />

      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
          >
            <Star className="h-4 w-4" style={{ color: venue.accent }} />
          </span>
          <h3 className="text-sm font-semibold text-ink">Not set up yet</h3>
        </div>

        <IntegrationNote
          text={
            hasGoogleBusiness
              ? `Google's rating/review count for ${venue.name} can be pulled in now that Business Profile is connected — this page just needs the actual widget built.`
              : `Google's rating and review count for ${venue.name} will show here once the Google Business page next door is connected — that's the source, not this page directly.`
          }
        />

        <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-soft">
          <p>
            <span className="font-medium text-ink">Google: </span>
            comes from the Business Profile connection (see the Google Business page) — once that&rsquo;s live, this
            page can show the rating and review count over time, not just a snapshot.
          </p>
          <p>
            <span className="font-medium text-ink">TripAdvisor and Facebook: </span>
            these don&rsquo;t have a straightforward self-serve API the way Google does — TripAdvisor&rsquo;s Content
            API is aimed at large travel platforms and Facebook&rsquo;s review data isn&rsquo;t exposed for
            third-party dashboards this way. Realistically that means either checking those ratings by hand
            periodically and logging them here manually, or a paid review-aggregation service (e.g. Birdeye,
            Podium) if it&rsquo;s worth automating properly — worth flagging now rather than promising an API
            connection that likely isn&rsquo;t available.
          </p>
        </div>
      </div>
    </div>
  );
}
