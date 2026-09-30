import { SocialChannel, SocialPost, SocialStatus, PostFormat, VenueSlug } from "../types";
import { getCurrentWeekDates } from "./dates";

interface PostSeed {
  dayIndex: number; // 0 = Monday ... 6 = Sunday
  time: string;
  channel: SocialChannel;
  format?: PostFormat;
  title: string;
  caption: string;
  contentBrief?: string;
  videoUrl?: string;
  status: SocialStatus;
  engagement?: { likes: number; comments: number; reach: number };
}

const BEACH_ROAD_SEEDS: PostSeed[] = [
  { dayIndex: 0, time: "10:00", channel: "instagram", format: "grid", title: "Wednesday beachy vibes", caption: "Midweek = Beachy Wednesdays. DJs, $7 drinks, happy hour, free pool + beer pong. We'll see you there 🍻", status: "published", engagement: { likes: 412, comments: 22, reach: 5100 } },
  { dayIndex: 1, time: "11:00", channel: "instagram", format: "reel", title: "Tuesday trivia + burgers", caption: "$20 burgers from 5pm, trivia from 7pm. Round up the crew. Link in bio 🍻", status: "published", engagement: { likes: 356, comments: 18, reach: 4300 } },
  { dayIndex: 3, time: "09:30", channel: "facebook", title: "Saturday DJ lineup", caption: "Beer garden to dance floor. DJs on from 6pm this Saturday — Bondi's biggest dance floor awaits.", status: "scheduled" },
  { dayIndex: 4, time: "14:00", channel: "instagram", format: "carousel", title: "Footy season is here", caption: "NRL & AFL live and loud on the big screens every weekend. Big Screen Sports at The Beachy.", status: "scheduled" },
];

const BARRYS_SEEDS: PostSeed[] = [
  { dayIndex: 0, time: "09:00", channel: "instagram", format: "grid", title: "Terrace rooms, Bondi views", caption: "Dust off the sand and stay a while. Terrace access, right above The Beachy.", status: "published", engagement: { likes: 198, comments: 9, reach: 2600 } },
  { dayIndex: 2, time: "10:00", channel: "instagram", format: "reel", title: "Keyless with GOKI", caption: "Forget key cards — your phone does it all. Download GOKI before you arrive and stroll straight in.", status: "published", engagement: { likes: 145, comments: 6, reach: 1900 } },
  { dayIndex: 5, time: "11:00", channel: "facebook", title: "Summer booking reminder", caption: "Terrace rooms are filling up fast for summer. Lock in your Bondi stay.", status: "scheduled" },
];

const TILBURY_SEEDS: PostSeed[] = [
  { dayIndex: 0, time: "10:00", channel: "instagram", format: "carousel", title: "The new Tilbury", caption: "Our first major redesign in 12 years — soft pastels, light woods, and a lot of heritage charm kept intact.", status: "published", engagement: { likes: 521, comments: 34, reach: 6800 } },
  { dayIndex: 2, time: "12:00", channel: "instagram", format: "grid", title: "Spicy snapper, XO mussels", caption: "Chef James Wallis' new menu is here. Mediterranean-inspired, locally sourced, built to share.", status: "published", engagement: { likes: 398, comments: 21, reach: 5200 } },
  { dayIndex: 4, time: "09:00", channel: "facebook", title: "Courtyard bookings open", caption: "Sydney's best-kept courtyard is open for bookings. Ask about private dining for your next celebration.", status: "scheduled" },
];

const VICAR_SEEDS: PostSeed[] = [
  { dayIndex: 0, time: "09:00", channel: "instagram", format: "grid", title: "Rosa's Bottomless Brunch", caption: "Every Saturday from 11:30am — 3-course sharing menu, 2-hour beverage package, $99pp. Bookings essential.", status: "published", engagement: { likes: 467, comments: 29, reach: 6100 } },
  { dayIndex: 1, time: "11:30", channel: "instagram", format: "reel", title: "Tuesday Trivia + rump steak", caption: "Dural's best quiz, paired with a $20 rump steak special. Gather your mates.", status: "published", engagement: { likes: 312, comments: 15, reach: 4000 } },
  { dayIndex: 3, time: "10:00", channel: "facebook", title: "Hops In The Hills", caption: "Our own bespoke beer festival is coming to The Vicar, Dural. Save the date.", status: "scheduled" },
  { dayIndex: 5, time: "13:00", channel: "instagram", format: "carousel", title: "Functions at The Vicar", caption: "Birthdays, engagements, corporate — our function room and courtyard are ready for your next event.", status: "scheduled" },
];

const SEED_MAP: Record<VenueSlug, PostSeed[]> = {
  "beach-road": BEACH_ROAD_SEEDS,
  barrys: BARRYS_SEEDS,
  tilbury: TILBURY_SEEDS,
  vicar: VICAR_SEEDS,
};

function buildPosts(venueId: VenueSlug): SocialPost[] {
  const weekDates = getCurrentWeekDates();
  return SEED_MAP[venueId].map((seed, i) => ({
    id: `${venueId}-post-${i + 1}`,
    venueId,
    channel: seed.channel,
    format: seed.format,
    title: seed.title,
    caption: seed.caption,
    contentBrief: seed.contentBrief ?? null,
    scheduledDate: weekDates[seed.dayIndex],
    scheduledTime: seed.time,
    imageUrl: null,
    videoUrl: seed.videoUrl ?? null,
    status: seed.status,
    likes: seed.engagement?.likes,
    comments: seed.engagement?.comments,
    reach: seed.engagement?.reach,
  }));
}

export const SOCIAL_POSTS: Record<VenueSlug, SocialPost[]> = {
  "beach-road": buildPosts("beach-road"),
  barrys: buildPosts("barrys"),
  tilbury: buildPosts("tilbury"),
  vicar: buildPosts("vicar"),
};

export function getSocialPosts(venueId: VenueSlug): SocialPost[] {
  return SOCIAL_POSTS[venueId];
}

export function getScheduledPostCount(venueId: VenueSlug): number {
  return SOCIAL_POSTS[venueId].filter((p) => p.status === "scheduled").length;
}

export function getLastPostEngagementRate(venueId: VenueSlug): number {
  const published = SOCIAL_POSTS[venueId]
    .filter((p) => p.status === "published" && p.reach)
    .sort((a, b) => (a.scheduledDate + a.scheduledTime < b.scheduledDate + b.scheduledTime ? 1 : -1));
  const last = published[0];
  if (!last || !last.reach) return 0;
  const engagement = (last.likes ?? 0) + (last.comments ?? 0);
  return Math.round((engagement / last.reach) * 1000) / 10;
}

export const CHANNEL_COLORS: Record<SocialChannel, { bg: string; border: string; text: string; dot: string }> = {
  instagram: { bg: "#fce4ec", border: "#f3a8c5", text: "#9d174d", dot: "#e1306c" },
  facebook: { bg: "#e3f0fb", border: "#a7cdf0", text: "#1e4f8a", dot: "#1877f2" },
  tiktok: { bg: "#efe6fb", border: "#c9aef0", text: "#5b21a6", dot: "#833ab4" },
  event: { bg: "#fef3e0", border: "#f6d896", text: "#92620a", dot: "#f5a623" },
  article: { bg: "#e6f5f0", border: "#a8ddc8", text: "#0f6848", dot: "#14b876" },
};

export const CHANNEL_LABELS: Record<SocialChannel, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  event: "Event",
  article: "Article",
};
