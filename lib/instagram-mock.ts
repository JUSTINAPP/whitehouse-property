import { VenueSlug, PostFormat } from "./types";

/**
 * Preview data for the Live Instagram tab. Until each venue's account is
 * connected through a widget service (Behold.so / SnapWidget), this renders
 * a realistic mock of what the live grid will look like, built from each
 * venue's own site photography — NOT real-time data from Instagram.
 */
export interface InstagramFeedPost {
  image: string;
  likes: number;
  comments: number;
  format: PostFormat;
}

export interface InstagramProfileMock {
  followers: number;
  following: number;
  posts: number;
  bio: string;
  avatarInitial: string;
  feed: InstagramFeedPost[];
}

export const INSTAGRAM_MOCK: Partial<Record<VenueSlug, InstagramProfileMock>> = {
  "beach-road": {
    followers: 18400,
    following: 210,
    posts: 940,
    bio: "Dust off the sand and stay a while 🍻 Bondi Beach",
    avatarInitial: "B",
    feed: [
      { image: "https://images.squarespace-cdn.com/content/v1/67d25b7a1217250a2db74ac8/5ed7a4ae-8592-4542-a0cc-3821531dd20f/BeachRdArvo9.12-PhotoMariaBoyadgis-1.jpg", likes: 512, comments: 24, format: "grid" },
      { image: "https://images.squarespace-cdn.com/content/v1/67d25b7a1217250a2db74ac8/67197484-3bd2-4aeb-95a0-4bf2a36063a4/bs+2.jpg", likes: 388, comments: 19, format: "grid" },
      { image: "https://images.squarespace-cdn.com/content/v1/67d25b7a1217250a2db74ac8/3de6be8a-cd9a-4b3d-8b97-2589f1b40b46/250502-BeachRoadHotel-Food-GroupShots-049.jpg", likes: 671, comments: 41, format: "reel" },
      { image: "https://images.squarespace-cdn.com/content/v1/67d25b7a1217250a2db74ac8/788404e1-4187-46e4-8cae-d754eabe0bec/250502-BeachRoadHotel-Food-WhiteBackground+%2886%29.jpg", likes: 302, comments: 14, format: "grid" },
    ],
  },
  barrys: {
    followers: 2960,
    following: 180,
    posts: 145,
    bio: "Your place in Bondi 🌊 Book direct — link below",
    avatarInitial: "B",
    feed: [
      { image: "https://images.squarespace-cdn.com/content/v1/68a6c91f29207744a29cc5cc/d1e9080e-4699-40bf-b381-f563e629924e/BeachRdSaturdaySession-MariaBoyadgis-97.jpg", likes: 214, comments: 8, format: "grid" },
      { image: "https://images.squarespace-cdn.com/content/v1/68a6c91f29207744a29cc5cc/08ad0fe2-f4c9-4d18-9f7f-70ad04a2a607/barrys+3.jpg", likes: 167, comments: 5, format: "grid" },
      { image: "https://images.squarespace-cdn.com/content/v1/68a6c91f29207744a29cc5cc/f524521f-4f97-493d-9eff-88b680850096/barrys+6.jpg", likes: 189, comments: 7, format: "carousel" },
    ],
  },
  vicar: {
    followers: 9280,
    following: 340,
    posts: 720,
    bio: "Your place in The Hills 🍷 Dural, NSW",
    avatarInitial: "V",
    feed: [
      { image: "https://thevicar.com.au/wp-content/uploads/2026/04/260402-TheVicar-Food-Venue-271-scaled.jpg", likes: 445, comments: 26, format: "grid" },
      { image: "https://thevicar.com.au/wp-content/uploads/2026/04/260402-TheVicar-Food-Venue-079.jpg", likes: 398, comments: 21, format: "grid" },
      { image: "https://thevicar.com.au/wp-content/uploads/2025/01/Vicar_home_page_01_2500x1500-768x461.png", likes: 512, comments: 33, format: "reel" },
    ],
  },
  // tilbury: no photography synced yet -- see site-theme.ts note.
};
