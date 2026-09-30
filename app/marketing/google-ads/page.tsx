"use client";

import { Target } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { GOOGLE_ADS_CONFIG } from "@/lib/marketing/google-ads-config";

export default function GoogleAdsPage() {
  const { venue } = useVenue();
  const config = GOOGLE_ADS_CONFIG[venue.slug];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Google Ads"
        subtitle={`Paid search performance for ${venue.name} — reserved here so it doesn't get lost, ready to switch on once there's a campaign to report on.`}
      />

      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
          >
            <Target className="h-4 w-4" style={{ color: venue.accent }} />
          </span>
          <h3 className="text-sm font-semibold text-ink">Not set up yet</h3>
        </div>

        {!config ? (
          <IntegrationNote
            text={`No Google Ads account connected for ${venue.name} yet. Once a campaign exists, connecting it here needs: a Google Ads Manager (MCC) account with a developer token approved for API access, an OAuth client (Client ID + Secret) with a refresh token authorising access to the account, and the venue's Google Ads customer ID (the 10-digit number shown top-right in the Ads UI, e.g. 123-456-7890). Those go into GOOGLE_ADS_DEVELOPER_TOKEN / GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET / GOOGLE_ADS_REFRESH_TOKEN in .env.local and Vercel, and the customer ID into lib/marketing/google-ads-config.ts — same pattern as Search Console next door.`}
          />
        ) : (
          <IntegrationNote text="Customer ID is configured, but the Google Ads API connection itself hasn't been built yet." />
        )}
      </div>
    </div>
  );
}
