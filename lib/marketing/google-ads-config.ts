import { VenueSlug } from "@/lib/types";

export interface GoogleAdsConfig {
  // The Google Ads customer ID this venue's campaigns run under, digits
  // only, no dashes (e.g. "1234567890" for a Google Ads ID shown as
  // 123-456-7890). Find it top-right of the Google Ads UI once an account
  // exists for the venue.
  customerId: string;
}

// Empty until a venue actually has a Google Ads account running — add an
// entry here once one exists, alongside GOOGLE_ADS_DEVELOPER_TOKEN /
// GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET / GOOGLE_ADS_REFRESH_TOKEN
// in .env.local and Vercel (see app/marketing/google-ads/page.tsx for what
// each of those is and where it comes from).
export const GOOGLE_ADS_CONFIG: Partial<Record<VenueSlug, GoogleAdsConfig>> = {};
