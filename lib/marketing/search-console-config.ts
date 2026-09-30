import { VenueSlug } from "@/lib/types";

export interface SearchConsoleConfig {
  property: string;
}

// Empty until Whitehouse Property Group connects Search Console for a
// venue -- no verified properties exist yet for a prospective client.
export const SEARCH_CONSOLE_CONFIG: Partial<Record<VenueSlug, SearchConsoleConfig>> = {};
