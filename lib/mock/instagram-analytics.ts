import { VenueSlug } from "../types";
import { INSTAGRAM_MOCK } from "../instagram-mock";
import { mulberry32, randInt } from "./rng";

/**
 * Mock Instagram analytics. Deterministic (seeded), not Math.random, so
 * server and client render identically. Pending a real Meta Graph API
 * connection — see the note rendered at the top of the Analytics page —
 * this is illustrative only, built around the same profile stats used in
 * the Live Instagram preview.
 */
export interface DailyMetric {
  label: string; // short day label, e.g. "Mon"
  followers: number;
  reach: number;
  profileVisits: number;
}

export interface TopPost {
  image: string;
  caption: string;
  likes: number;
  comments: number;
  reach: number;
  format: "grid" | "carousel" | "reel" | "story";
}

export interface InstagramAnalytics {
  followers: number;
  followerGrowth14d: number; // net new followers over the trend window
  avgEngagementRate: number; // percent
  avgReachPerPost: number;
  postsThisMonth: number;
  trend: DailyMetric[];
  topPosts: TopPost[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TREND_SEEDS: Partial<Record<VenueSlug, number>> = {
  "beach-road": 8801,
  barrys: 8802,
  vicar: 8804,
};

function generateTrend(seed: number, startFollowers: number, weekendBoost: number): DailyMetric[] {
  const rng = mulberry32(seed);
  let followers = startFollowers;
  const trend: DailyMetric[] = [];
  for (let week = 0; week < 2; week++) {
    for (let day = 0; day < 7; day++) {
      const isWeekend = day >= 4;
      followers += randInt(rng, 0, isWeekend ? 6 : 3);
      const reach = randInt(rng, 1800, 3400) + (isWeekend ? weekendBoost : 0);
      const profileVisits = Math.round(reach * (0.045 + rng() * 0.02));
      trend.push({ label: DAY_LABELS[day], followers, reach, profileVisits });
    }
  }
  return trend;
}

const TREND_MAP: Partial<Record<VenueSlug, DailyMetric[]>> = {
  "beach-road": generateTrend(TREND_SEEDS["beach-road"]!, 18320, 2600),
  barrys: generateTrend(TREND_SEEDS.barrys!, 2910, 900),
  vicar: generateTrend(TREND_SEEDS.vicar!, 9180, 1800),
};

export function getInstagramAnalytics(venueSlug: VenueSlug): InstagramAnalytics | null {
  const profile = INSTAGRAM_MOCK[venueSlug];
  const trend = TREND_MAP[venueSlug];
  if (!profile || !trend) return null;

  const topPosts: TopPost[] = [...profile.feed]
    .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
    .slice(0, 5)
    .map((p) => ({
      image: p.image,
      caption: "",
      likes: p.likes,
      comments: p.comments,
      reach: Math.round((p.likes + p.comments) * 6.4),
      format: p.format,
    }));

  const totalEngagement = profile.feed.reduce((sum, p) => sum + p.likes + p.comments, 0);
  const avgReachPerPost = Math.round(topPosts.reduce((s, p) => s + p.reach, 0) / topPosts.length);
  const avgEngagementRate = Math.round(((totalEngagement / profile.feed.length) / avgReachPerPost) * 1000) / 10;

  return {
    followers: profile.followers,
    followerGrowth14d: trend[trend.length - 1].followers - trend[0].followers,
    avgEngagementRate,
    avgReachPerPost,
    postsThisMonth: 18,
    trend,
    topPosts,
  };
}
