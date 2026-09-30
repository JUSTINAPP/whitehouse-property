import { Venue, VenueSlug } from "./types";

export const VENUES: Venue[] = [
  {
    id: "beach-road",
    slug: "beach-road",
    name: "Beach Road Hotel",
    shortName: "Beach Road",
    type: "Bondi Beachside Pub & Bar",
    accent: "var(--color-beach-road)",
    accentLight: "var(--color-beach-road-light)",
  },
  {
    id: "barrys",
    slug: "barrys",
    name: "Barrys Hotel",
    shortName: "Barrys",
    type: "Boutique Accommodation",
    accent: "var(--color-barrys)",
    accentLight: "var(--color-barrys-light)",
  },
  {
    id: "tilbury",
    slug: "tilbury",
    name: "The Tilbury",
    shortName: "The Tilbury",
    type: "Heritage Pub & Dining",
    accent: "var(--color-tilbury)",
    accentLight: "var(--color-tilbury-light)",
  },
  {
    id: "vicar",
    slug: "vicar",
    name: "The Vicar",
    shortName: "The Vicar",
    type: "Bar, Restaurant & Function Venue",
    accent: "var(--color-vicar)",
    accentLight: "var(--color-vicar-light)",
  },
];

export function getVenue(slug: VenueSlug): Venue {
  const venue = VENUES.find((v) => v.slug === slug);
  if (!venue) throw new Error(`Unknown venue: ${slug}`);
  return venue;
}
