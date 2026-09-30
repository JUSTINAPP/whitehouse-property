import { Guest, GuestTag, VenueSlug, VisitRecord } from "../types";
import { FIRST_NAMES, LAST_NAMES } from "./names";
import { mulberry32, pick, pickMany, randInt } from "./rng";
import { daysAgoISO } from "./dates";

interface VenueGuestProfile {
  seed: number;
  avgSpendMin: number;
  avgSpendMax: number;
  tagPool: GuestTag[];
  visitNotePool: string[];
}

const PROFILES: Record<VenueSlug, VenueGuestProfile> = {
  "beach-road": {
    seed: 1001,
    avgSpendMin: 25,
    avgSpendMax: 90,
    tagPool: ["VIP", "Regular", "Birthday Club", "Corporate", "Gluten-Free"],
    visitNotePool: [
      "Always grabs a spot by the big screens for footy",
      "Regular at Trivia Tuesdays, usual team of six",
      "Asked about Saturday DJ lineup",
      "Celebrated a birthday in the beer garden",
      "Backpacker crew, usually in on Wednesdays",
      "Prefers the front bar, free pool table",
    ],
  },
  barrys: {
    seed: 2002,
    avgSpendMin: 180,
    avgSpendMax: 370,
    tagPool: ["VIP", "Regular", "Corporate", "Birthday Club"],
    visitNotePool: [
      "Requested a Superior Queen with terrace access again",
      "Asked about early check-in for a beach day",
      "Travelling for a friend's Bondi wedding",
      "Regular guest, books the same room each visit",
      "Corporate stay, expensing via company card",
      "Asked GOKI app support to set up their phone key",
    ],
  },
  tilbury: {
    seed: 3003,
    avgSpendMin: 70,
    avgSpendMax: 220,
    tagPool: ["VIP", "Regular", "Wine Club", "Corporate", "Nut Allergy", "Gluten-Free"],
    visitNotePool: [
      "Asked for the courtyard table again",
      "Celebrated an engagement upstairs",
      "Regular for Friday after-work drinks",
      "Loved the redesign, asked about private dining",
      "Corporate dinner, six guests, wine pairing requested",
      "Prefers the Mediterranean sharing menu",
    ],
  },
  vicar: {
    seed: 4004,
    avgSpendMin: 50,
    avgSpendMax: 260,
    tagPool: ["VIP", "Regular", "Birthday Club", "Corporate", "Gluten-Free", "Vegetarian"],
    visitNotePool: [
      "Regular at Rosa's Bottomless Brunch, usual group of eight",
      "Booked the courtyard for an engagement party",
      "Asked about the Sunday roast bookings",
      "Corporate function, repeat client for product launches",
      "Loves Tuesday Trivia, same table every week",
      "Celebrated a birthday with the Bistro's rump steak special",
    ],
  },
};

function generateVisitHistory(
  rng: () => number,
  count: number,
  spendMin: number,
  spendMax: number,
  notePool: string[]
): VisitRecord[] {
  const history: VisitRecord[] = [];
  let daysBack = randInt(rng, 4, 20);
  for (let i = 0; i < count; i++) {
    history.push({
      date: daysAgoISO(daysBack),
      partySize: randInt(rng, 2, 8),
      spend: randInt(rng, spendMin, spendMax),
      notes: rng() > 0.6 ? pick(rng, notePool) : undefined,
    });
    daysBack += randInt(rng, 18, 65);
  }
  return history.reverse();
}

function generateGuestsForVenue(venueId: VenueSlug): Guest[] {
  const profile = PROFILES[venueId];
  const rng = mulberry32(profile.seed);
  const guests: Guest[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < 20; i++) {
    let name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
    while (usedNames.has(name)) {
      name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
    }
    usedNames.add(name);

    const visitCount = randInt(rng, 1, venueId === "barrys" ? 6 : 24);
    const tagCount = randInt(rng, 1, 3);
    const tags = pickMany(rng, profile.tagPool, tagCount);
    const visitHistory = generateVisitHistory(
      rng,
      Math.min(visitCount, 6),
      profile.avgSpendMin,
      profile.avgSpendMax,
      profile.visitNotePool
    );
    const totalSpend = Math.round(
      visitHistory.reduce((sum, v) => sum + v.spend, 0) *
        (visitCount / Math.max(visitHistory.length, 1))
    );

    const emailHandle = name.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, ".");

    guests.push({
      id: `${venueId}-guest-${i + 1}`,
      venueId,
      name,
      email: `${emailHandle}@example.com`,
      phone: `(${randInt(rng, 200, 989)}) ${randInt(rng, 200, 999)}-${randInt(rng, 1000, 9999)}`,
      visitCount,
      lastVisit: visitHistory[0]?.date ?? daysAgoISO(randInt(rng, 5, 60)),
      totalSpend,
      tags,
      notes: rng() > 0.7 ? pick(rng, profile.visitNotePool) : undefined,
      highlights: [],
      visitHistory,
    });
  }

  return guests.sort((a, b) => (a.lastVisit < b.lastVisit ? 1 : -1));
}

export const GUESTS: Record<VenueSlug, Guest[]> = {
  "beach-road": generateGuestsForVenue("beach-road"),
  barrys: generateGuestsForVenue("barrys"),
  tilbury: generateGuestsForVenue("tilbury"),
  vicar: generateGuestsForVenue("vicar"),
};

export function getGuests(venueId: VenueSlug): Guest[] {
  return GUESTS[venueId];
}
