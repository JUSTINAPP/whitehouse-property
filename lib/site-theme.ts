import { VenueSlug } from "./types";

/**
 * Visual tokens for the Menu / Guidelines pages, giving each venue its own
 * look rather than the dashboard's default theme. Colors are drawn from each
 * venue's real branding (logo colours, site palette); example photography is
 * hotlinked from each venue's own public website where available.
 */
export interface SiteTheme {
  hasSite: boolean;
  siteUrl?: string;
  displayFont: string;
  sansFont: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    gold: string;
    charcoal: string;
    warm: string;
    cream: string;
  };
  palette: { hex: string; label: string }[];
  exampleImages: string[];
  instagramHandle?: string;
  instagramEmbedUrl?: string;
}

export const SITE_THEMES: Record<VenueSlug, SiteTheme> = {
  "beach-road": {
    hasSite: true,
    siteUrl: "https://www.beachroadhotel.com.au",
    displayFont: "var(--font-cormorant)",
    sansFont: "var(--font-jost)",
    colors: {
      primary: "#D9622B",
      primaryDark: "#A6481C",
      primaryLight: "#F7E2D3",
      gold: "#D4A853",
      charcoal: "#1A1916",
      warm: "#6B6459",
      cream: "#FAF8F4",
    },
    palette: [
      { hex: "D9622B", label: "Beachy Orange" },
      { hex: "1E2A66", label: "Navy" },
      { hex: "F7E2D3", label: "Sand" },
      { hex: "2B2B2B", label: "Charcoal" },
    ],
    exampleImages: [
      "https://images.squarespace-cdn.com/content/v1/67d25b7a1217250a2db74ac8/5ed7a4ae-8592-4542-a0cc-3821531dd20f/BeachRdArvo9.12-PhotoMariaBoyadgis-1.jpg",
      "https://images.squarespace-cdn.com/content/v1/67d25b7a1217250a2db74ac8/67197484-3bd2-4aeb-95a0-4bf2a36063a4/bs+2.jpg",
      "https://images.squarespace-cdn.com/content/v1/67d25b7a1217250a2db74ac8/3de6be8a-cd9a-4b3d-8b97-2589f1b40b46/250502-BeachRoadHotel-Food-GroupShots-049.jpg",
    ],
    instagramHandle: "beachroadbondi",
  },
  barrys: {
    hasSite: true,
    siteUrl: "https://www.barryshotel.com.au",
    displayFont: "var(--font-cormorant)",
    sansFont: "var(--font-jost)",
    colors: {
      primary: "#A9825A",
      primaryDark: "#7A5B3D",
      primaryLight: "#EDE2D3",
      gold: "#C9A84C",
      charcoal: "#1A1916",
      warm: "#6B6459",
      cream: "#FAF8F3",
    },
    palette: [
      { hex: "A9825A", label: "Warm Tan" },
      { hex: "FAF8F3", label: "Cream" },
      { hex: "1A1916", label: "Charcoal" },
    ],
    exampleImages: [
      "https://images.squarespace-cdn.com/content/v1/68a6c91f29207744a29cc5cc/d1e9080e-4699-40bf-b381-f563e629924e/BeachRdSaturdaySession-MariaBoyadgis-97.jpg",
      "https://images.squarespace-cdn.com/content/v1/68a6c91f29207744a29cc5cc/08ad0fe2-f4c9-4d18-9f7f-70ad04a2a607/barrys+3.jpg",
    ],
    instagramHandle: "barryshotel",
  },
  tilbury: {
    // No photography synced yet -- Tilbury's own site is JS-rendered and
    // wasn't reachable to pull real asset URLs from during setup. Same
    // honest "not yet populated" treatment the real VSB dashboard uses for
    // a venue with no photo drop yet, rather than inventing placeholder
    // images.
    hasSite: true,
    siteUrl: "https://www.tilburyhotel.com.au",
    displayFont: "var(--font-cormorant)",
    sansFont: "var(--font-jost)",
    colors: {
      primary: "#2F5D50",
      primaryDark: "#1E3E35",
      primaryLight: "#DCE8E4",
      gold: "#C9A84C",
      charcoal: "#1A1916",
      warm: "#6B6459",
      cream: "#FAF8F4",
    },
    palette: [
      { hex: "2F5D50", label: "Heritage Green" },
      { hex: "C9A84C", label: "Brass" },
      { hex: "DCE8E4", label: "Soft Pastel" },
    ],
    exampleImages: [],
    instagramHandle: "tilburyhotel",
  },
  vicar: {
    hasSite: true,
    siteUrl: "https://thevicar.com.au",
    displayFont: "var(--font-cormorant)",
    sansFont: "var(--font-jost)",
    colors: {
      primary: "#6B2737",
      primaryDark: "#471A25",
      primaryLight: "#ECDADF",
      gold: "#C9A853",
      charcoal: "#1A1916",
      warm: "#6B6459",
      cream: "#FAF8F4",
    },
    palette: [
      { hex: "6B2737", label: "Wine" },
      { hex: "C9A853", label: "Brass" },
      { hex: "ECDADF", label: "Blush" },
    ],
    exampleImages: [
      "https://thevicar.com.au/wp-content/uploads/2026/04/260402-TheVicar-Food-Venue-271-scaled.jpg",
      "https://thevicar.com.au/wp-content/uploads/2026/04/260402-TheVicar-Food-Venue-079.jpg",
    ],
    instagramHandle: "thevicar__",
  },
};
