import { VenueSlug } from "./types";

export interface SanityConfig {
  projectId: string;
  dataset: string;
  studioUrl: string;
}

// No Sanity project exists for any Whitehouse Property Group venue yet --
// this is a prospective client, not a connected one.
export const SANITY_CONFIG: Partial<Record<VenueSlug, SanityConfig>> = {};
