import { VenueSlug } from "@/lib/types";

// This demo has no real SevenRooms connection (Whitehouse Property Group is
// a prospective client, not a connected one) -- but every venue is still
// marked "connected" here so the dashboard presents its full, live-feeling
// experience rather than "integration coming soon" placeholders. The
// underlying fetchers in reservations.ts / week-covers.ts read from the
// deterministic mock generators instead of a real SevenRooms API.
export const SEVENROOMS_VENUE_ID: Partial<Record<VenueSlug, string>> = {
  "beach-road": "demo-beach-road",
  barrys: "demo-barrys",
  tilbury: "demo-tilbury",
  vicar: "demo-vicar",
};
