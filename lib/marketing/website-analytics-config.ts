import { VenueSlug } from "@/lib/types";

export interface WebsiteAnalyticsConfig {
  propertyId: string;
}

// Empty until Whitehouse Property Group connects GA4 for a venue -- no
// property IDs exist yet for a prospective client. Once set, the page
// automatically shows real data instead of its "not connected" placeholder.
export const WEBSITE_ANALYTICS_CONFIG: Partial<Record<VenueSlug, WebsiteAnalyticsConfig>> = {};
