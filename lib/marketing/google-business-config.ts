import { VenueSlug } from "@/lib/types";

export interface GoogleBusinessConfig {
  // The Business Profile location resource name, e.g.
  // "accounts/123456789/locations/987654321" — only obtainable after API
  // access is approved and you can call accounts.list / locations.list
  // against the account that manages the listing.
  locationName: string;
}

// Empty until Business Profile API access is approved for a venue — see
// app/marketing/google-business/page.tsx for the (more involved than
// Search Console) process to get there.
export const GOOGLE_BUSINESS_CONFIG: Partial<Record<VenueSlug, GoogleBusinessConfig>> = {};
