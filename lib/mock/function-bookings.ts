import { FunctionBooking, FunctionEventType, FunctionStatus, LeadSource, VenueSlug } from "../types";
import { FIRST_NAMES, LAST_NAMES } from "./names";
import { mulberry32, pick, randInt } from "./rng";
import { TODAY_ISO, toISODate, addDays } from "./dates";

// Southern-hemisphere function-season weighting: quiet deep winter (Jun–Aug),
// building through spring, peaking in the Nov/Dec Christmas-party + wedding
// run, with a smaller Valentine's/engagement bump in February.
const MONTH_WEIGHT = [0.7, 1.1, 0.9, 1.0, 0.7, 0.5, 0.5, 0.6, 0.9, 1.2, 1.55, 1.85]; // Jan..Dec

const EVENT_WEIGHTS: [FunctionEventType, number][] = [
  ["Wedding", 0.14],
  ["Engagement", 0.12],
  ["Birthday", 0.2],
  ["Corporate", 0.22],
  ["Christmas Party", 0.16],
  ["Wake", 0.06],
  ["Christening", 0.06],
  ["Other", 0.04],
];

const SOURCE_WEIGHTS: [LeadSource, number][] = [
  ["google-organic", 0.22],
  ["google-ads", 0.16],
  ["instagram-organic", 0.14],
  ["instagram-ads", 0.12],
  ["google-business", 0.12],
  ["referral", 0.13],
  ["repeat-guest", 0.08],
  ["website-direct", 0.03],
];

function weightedPick<T extends string>(rng: () => number, weights: [T, number][]): T {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [value, w] of weights) {
    r -= w;
    if (r <= 0) return value;
  }
  return weights[weights.length - 1][0];
}

interface VenueProfile {
  seed: number;
  baseMonthlyCount: number;
  guestRange: [number, number];
  spendPerHeadRange: [number, number];
  spaces: string[];
  leadTimeDaysRange: [number, number]; // enquiry-to-event
}

const PROFILES: Record<VenueSlug, VenueProfile> = {
  "beach-road": {
    seed: 7101,
    baseMonthlyCount: 3,
    guestRange: [20, 90],
    spendPerHeadRange: [45, 70],
    spaces: ["Beer Garden", "Upstairs Courtyard", "Dance Floor"],
    leadTimeDaysRange: [14, 90],
  },
  barrys: {
    seed: 7202,
    baseMonthlyCount: 1,
    guestRange: [8, 20],
    spendPerHeadRange: [180, 280],
    spaces: ["Rooftop Terrace"],
    leadTimeDaysRange: [21, 120],
  },
  tilbury: {
    seed: 7303,
    baseMonthlyCount: 4,
    guestRange: [20, 100],
    spendPerHeadRange: [90, 130],
    spaces: ["Courtyard", "Upper Level", "Private Dining"],
    leadTimeDaysRange: [21, 180],
  },
  vicar: {
    seed: 7404,
    baseMonthlyCount: 6,
    guestRange: [20, 150],
    spendPerHeadRange: [70, 110],
    spaces: ["Function Room", "Courtyard", "Rosa's Private Room"],
    leadTimeDaysRange: [21, 210],
  },
};

function statusFor(rng: () => number, eventDate: string): FunctionStatus {
  const isPast = eventDate < TODAY_ISO;
  const daysOut = (new Date(eventDate).getTime() - new Date(TODAY_ISO).getTime()) / 86400000;
  const r = rng();
  if (isPast) {
    // Past events: mostly happened (we count them as confirmed/delivered), a slice cancelled
    return r < 0.9 ? "confirmed" : "cancelled";
  }
  if (daysOut < 21) {
    // Very close: pipeline has mostly firmed up
    if (r < 0.75) return "confirmed";
    if (r < 0.93) return "tentative";
    return "cancelled";
  }
  // Further out: earlier in the funnel
  if (r < 0.35) return "confirmed";
  if (r < 0.72) return "tentative";
  if (r < 0.92) return "enquiry";
  return "cancelled";
}

function generateVenueBookings(venueId: VenueSlug, year: number): FunctionBooking[] {
  const profile = PROFILES[venueId];
  const rng = mulberry32(profile.seed);
  const bookings: FunctionBooking[] = [];
  let counter = 1;

  for (let month = 0; month < 12; month++) {
    const count = Math.max(1, Math.round(profile.baseMonthlyCount * MONTH_WEIGHT[month]));
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < count; i++) {
      const day = randInt(rng, 1, daysInMonth);
      const eventDate = toISODate(new Date(year, month, day));
      const eventType = weightedPick(rng, EVENT_WEIGHTS);
      const leadSource = weightedPick(rng, SOURCE_WEIGHTS);
      const status = statusFor(rng, eventDate);
      const guestCount = randInt(rng, profile.guestRange[0], profile.guestRange[1]);
      const avgSpendPerHead = randInt(rng, profile.spendPerHeadRange[0], profile.spendPerHeadRange[1]);
      const totalValue = guestCount * avgSpendPerHead;
      const depositPaid = status === "confirmed" ? Math.round(totalValue * 0.25) : status === "tentative" ? Math.round(totalValue * 0.1) : 0;
      const leadTime = randInt(rng, profile.leadTimeDaysRange[0], profile.leadTimeDaysRange[1]);
      const enquiryDate = toISODate(addDays(new Date(eventDate), -leadTime));
      const name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;

      bookings.push({
        id: `${venueId}-fn-${counter++}`,
        venueId,
        clientName: name,
        clientEmail: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        eventType,
        eventDate,
        startTime: eventType === "Wedding" ? "15:00" : eventType === "Corporate" ? "12:00" : "18:30",
        guestCount,
        space: pick(rng, profile.spaces),
        avgSpendPerHead,
        totalValue,
        depositPaid,
        status,
        leadSource,
        enquiryDate,
      });
    }
  }

  return bookings.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}

const YEAR = new Date(TODAY_ISO).getFullYear();

export const FUNCTION_BOOKINGS: Record<VenueSlug, FunctionBooking[]> = {
  "beach-road": generateVenueBookings("beach-road", YEAR),
  barrys: generateVenueBookings("barrys", YEAR),
  tilbury: generateVenueBookings("tilbury", YEAR),
  vicar: generateVenueBookings("vicar", YEAR),
};

export function getFunctionBookings(venueId: VenueSlug): FunctionBooking[] {
  return FUNCTION_BOOKINGS[venueId];
}

export function getUpcomingFunctionBookings(venueId: VenueSlug, limit = 5): FunctionBooking[] {
  return FUNCTION_BOOKINGS[venueId]
    .filter((b) => b.eventDate >= TODAY_ISO && b.status !== "cancelled")
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, limit);
}

export function getFunctionBookingsForMonth(venueId: VenueSlug, year: number, month: number): FunctionBooking[] {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return FUNCTION_BOOKINGS[venueId].filter((b) => b.eventDate.startsWith(prefix));
}

export function getFunctionSpaces(venueId: VenueSlug): string[] {
  return PROFILES[venueId].spaces;
}
