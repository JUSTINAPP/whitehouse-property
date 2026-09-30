import { VenueSlug } from "./types";

export interface GuidelinesContent {
  tagline: string;
  device: string;
  typography: string;
  photography: string;
  filterStyle?: {
    name: string;
    recipe: string;
    cssFilter: string;
  };
  cropRatios: string;
  voiceNotes: string[];
  exampleCaptions: string[];
  editingCapability: {
    weDoEndToEnd: string[];
    weDoWithLimit: string[];
    needsVenue: string[];
  };
}

const SHARED_CAPABILITY = {
  weDoEndToEnd: [
    "Photo selection & curation from connected folders",
    "Cropping, resizing, colour grading",
    "Templated tiles (event tiles, quote cards, menu highlights)",
    "Carousel sequencing",
    "Captions & hashtags",
    "Story templates & copy",
    "Monthly shot list brief",
  ],
  weDoWithLimit: [
    "Simple Reels — still-image slideshow, crossfades, text overlays (no trending-audio pairing, no motion graphics)",
  ],
  needsVenue: [
    "Raw photography / video capture",
    "Pushing Stories live (Instagram API restriction)",
    "Cinematic-grade video edits",
    "Final approval before anything goes live",
  ],
};

export const GUIDELINES: Record<VenueSlug, GuidelinesContent | null> = {
  "beach-road": {
    tagline: "Loud. Local. Bondi.",
    device: "The BRH orange wordmark as a recurring stamp on tiles and Story frames; big, bold event-poster style tiles for DJ nights and specials.",
    typography: "Bold, condensed uppercase for headline statements over photos or on an orange statement tile — short, punchy, 3-5 words max.",
    photography: "High-energy crowd shots, beer garden and dance floor moments, sports on the big screens, golden-hour rooftop shots. Warm, saturated grading — nothing moody or clinical.",
    cropRatios: "4:5 feed · 9:16 Stories & Reels · 1:1 grid",
    voiceNotes: ["Casual, high-energy, a little cheeky. Short sentences. Emoji used freely."],
    exampleCaptions: [
      "Midweek = Beachy Wednesdays. DJs, $7 drinks, happy hour, free pool + beer pong. We'll see you there 🍻",
      "Tuesdays sorted — $20 burgers from 5pm and trivia from 7pm. Round up the crew.",
    ],
    editingCapability: SHARED_CAPABILITY,
  },
  barrys: {
    tagline: "Your place in Bondi.",
    device: "Clean cream-and-charcoal wordmark, minimal styling — the accommodation brand sits quieter than the pub downstairs.",
    typography: "Simple serif headlines, lowercase-led, understated.",
    photography: "Bright, airy room shots, terrace views, styled interior detail shots. Soft natural light, no heavy grading.",
    cropRatios: "4:5 feed · 9:16 Stories & Reels · 1:1 grid",
    voiceNotes: ["Warm, understated, hospitality-forward. No hard sell."],
    exampleCaptions: [
      "Dust off the sand and stay a while. Terrace access, right above The Beachy.",
      "Forget key cards — your phone does it all. Download GOKI before you arrive.",
    ],
    editingCapability: SHARED_CAPABILITY,
  },
  tilbury: {
    tagline: "Heritage, reimagined.",
    device: "The heritage-green and brass palette from the recent redesign, used as a consistent frame for tiles and quote cards.",
    typography: "Elegant serif headlines, restrained and confident — no more than a short phrase per tile.",
    photography: "Refined interior shots showing the new Luchetti Krelle design, plated dishes on natural light, courtyard atmosphere at golden hour.",
    cropRatios: "4:5 feed · 9:16 Stories & Reels · 1:1 grid",
    voiceNotes: ["Polished, a little proud of the redesign, still warm and welcoming."],
    exampleCaptions: [
      "Our first major redesign in 12 years — soft pastels, light woods, and a lot of heritage charm kept intact.",
      "Chef James Wallis' new menu is here. Mediterranean-inspired, locally sourced, built to share.",
    ],
    editingCapability: SHARED_CAPABILITY,
  },
  vicar: {
    tagline: "Your place in the Hills.",
    device: "The deep wine-and-brass palette, used consistently across Bistro and Rosa's content so both feel part of one venue.",
    typography: "Clean serif for headlines, short and inviting — built for weekly recurring events (trivia, brunch, roast).",
    photography: "Warm, communal dining shots — shared plates, courtyard DJ nights, family-style Sunday roasts. Rosa's gets a slightly more romantic, low-light treatment than the Bistro's brighter everyday shots.",
    cropRatios: "4:5 feed · 9:16 Stories & Reels · 1:1 grid",
    voiceNotes: ["Warm, community-first, built around the weekly rhythm of what's on."],
    exampleCaptions: [
      "Every Saturday from 11:30am — 3-course sharing menu, 2-hour beverage package, $99pp. Bookings essential.",
      "Dural's best quiz, paired with a $20 rump steak special. Gather your mates.",
    ],
    editingCapability: SHARED_CAPABILITY,
  },
};
