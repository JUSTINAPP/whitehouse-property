import { VenueSlug } from "../types";
import { getConfirmedTodayCount, getCoversThisWeek } from "./reservations";
import { getScheduledPostCount, getLastPostEngagementRate } from "./social-posts";

export interface OverviewKpis {
  reservationsToday: number;
  coversThisWeek: number;
  socialPostsScheduled: number;
  lastPostEngagementRate: number;
}

export function getOverviewKpis(venueId: VenueSlug): OverviewKpis {
  return {
    reservationsToday: getConfirmedTodayCount(venueId),
    coversThisWeek: getCoversThisWeek(venueId),
    socialPostsScheduled: getScheduledPostCount(venueId),
    lastPostEngagementRate: getLastPostEngagementRate(venueId),
  };
}
