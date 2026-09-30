"use client";

import { MapPin } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { GOOGLE_BUSINESS_CONFIG } from "@/lib/marketing/google-business-config";

export default function GoogleBusinessPage() {
  const { venue } = useVenue();
  const config = GOOGLE_BUSINESS_CONFIG[venue.slug];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Google Business"
        subtitle={`How ${venue.name} shows up in local search and Maps — the "near me" side of visibility, separate from web search. Reserved here, ready to switch on once access is approved.`}
      />

      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
          >
            <MapPin className="h-4 w-4" style={{ color: venue.accent }} />
          </span>
          <h3 className="text-sm font-semibold text-ink">Not set up yet</h3>
        </div>

        {!config ? (
          <>
            <IntegrationNote
              text={`No Business Profile connection for ${venue.name} yet. What this covers once connected: how people found the listing (direct search for the name vs. discovery via a category search), direction requests, calls, photo views, and the real star rating/review count — replacing the "we can't pull that in" note on the Search & Visibility page.`}
            />
            <div className="mt-4 space-y-2.5 text-sm leading-relaxed text-ink-soft">
              <p>
                <span className="font-medium text-ink">This one&rsquo;s slower to start than Search Console: </span>
                Google gates the Business Profile API behind a one-time developer approval. It&rsquo;s applied for
                once against a Google Business Profile that&rsquo;s already verified and 60+ days old — one of the
                existing venues&rsquo; listings, not the client&rsquo;s. Google typically takes up to two weeks to
                review it.
              </p>
              <p>
                <span className="font-medium text-ink">The good news for the client: </span>
                once that one-time approval is through, connecting each venue is just a &ldquo;Connect Google
                Business&rdquo; button — the client (or whoever manages the listing) clicks it, signs in with the
                Google account tied to their profile, and clicks Allow. No settings menus, no adding anyone as a
                manager, nothing technical — the same one-click flow tools like Birdeye and Podium use.
              </p>
              <p>
                <span className="font-medium text-ink">What&rsquo;s next: </span>
                the developer approval step is on us to submit — send the word and we&rsquo;ll get that request in,
                since the review time is the long pole regardless of when the button gets built.
              </p>
            </div>
          </>
        ) : (
          <IntegrationNote text="Location is configured, but the Business Profile API connection itself hasn't been built yet." />
        )}
      </div>
    </div>
  );
}
