import { Reservation, ReservationStatus, VenueSlug } from "../types";
import { FIRST_NAMES, LAST_NAMES } from "./names";
import { mulberry32, pick, randInt } from "./rng";
import { TODAY_ISO, getCurrentWeekDates } from "./dates";

interface ReservationProfile {
  seed: number;
  count: number;
  tables: string[];
  timeSlots: string[];
  partyRange: [number, number];
  notePool: string[];
  weekdayCoverRange: [number, number];
  weekendCoverRange: [number, number];
}

const PROFILES: Record<VenueSlug, ReservationProfile> = {
  "beach-road": {
    seed: 4001,
    count: 34,
    tables: ["Front Bar 1", "Front Bar 2", "Beer Garden 1", "Beer Garden 2", "Beer Garden 3", "Upstairs Courtyard", "Dance Floor Booth", "Pool Table Area", "Bar Stool 1", "Bar Stool 2"],
    timeSlots: ["11:30", "12:00", "12:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"],
    partyRange: [2, 14],
    notePool: [
      "Here for the footy, big screen seating",
      "Trivia team of six, regular Tuesday booking",
      "Birthday group, wants the beer garden",
      "Backpacker group, first time in Bondi",
      "Asked about the DJ set start time",
      "Regular, usual spot at the front bar",
      "Dog-friendly table requested",
      "Bachelorette group before a big night out",
    ],
    weekdayCoverRange: [140, 210],
    weekendCoverRange: [260, 380],
  },
  barrys: {
    seed: 5002,
    count: 10,
    tables: ["Basic Queen 1", "Basic Queen 2", "Standard Queen 1", "Standard Queen 2", "Deluxe Queen 1", "Superior Queen 1", "Deluxe Family 1", "Deluxe Family 2"],
    timeSlots: ["14:00", "14:30", "15:00", "15:30", "16:00", "11:00", "10:00"],
    partyRange: [1, 5],
    notePool: [
      "Early check-in requested for a beach day",
      "Travelling for a Bondi wedding, staying 3 nights",
      "Asked about GOKI app phone-key setup",
      "Late checkout requested",
      "Celebrating an anniversary, requested a terrace room",
      "Repeat guest, same room as last stay",
    ],
    weekdayCoverRange: [8, 16],
    weekendCoverRange: [18, 28],
  },
  tilbury: {
    seed: 6003,
    count: 26,
    tables: ["Courtyard 1", "Courtyard 2", "Courtyard 3", "Restaurant 1", "Restaurant 2", "Restaurant 3", "Restaurant 4", "Upper Level 1", "Upper Level 2", "Public Bar 1", "Public Bar 2"],
    timeSlots: ["12:00", "12:30", "13:00", "13:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"],
    partyRange: [2, 10],
    notePool: [
      "Asked for the courtyard, loves the new redesign",
      "Engagement dinner, requested a quiet table",
      "Corporate dinner, wine pairing requested",
      "Regular for Friday after-work drinks",
      "Anniversary, celebrating with the sharing menu",
      "First visit since the renovation, keen to see it",
      "Nut allergy — kitchen notified",
      "Requested a table overlooking the courtyard",
    ],
    weekdayCoverRange: [90, 140],
    weekendCoverRange: [180, 250],
  },
  vicar: {
    seed: 7004,
    count: 30,
    tables: ["Bistro 1", "Bistro 2", "Bistro 3", "Bistro 4", "Rosa's 1", "Rosa's 2", "Rosa's 3", "Courtyard 1", "Courtyard 2", "Function Room", "Bar 1", "Bar 2"],
    timeSlots: ["11:30", "12:00", "12:30", "13:00", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"],
    partyRange: [2, 16],
    notePool: [
      "Regular at Rosa's Bottomless Brunch",
      "Booked the courtyard for a birthday",
      "Corporate function, product launch setup needed",
      "Tuesday Trivia regulars, team of eight",
      "Sunday roast booking, family of six",
      "Engagement party, requested the function room",
      "Asked about the Saturday cocktail hour",
      "Gluten-free options needed for two guests",
    ],
    weekdayCoverRange: [120, 180],
    weekendCoverRange: [220, 320],
  },
};

function statusForIndex(rng: () => number): ReservationStatus {
  const r = rng();
  if (r < 0.78) return "confirmed";
  if (r < 0.93) return "pending";
  return "cancelled";
}

function generateTodayReservations(venueId: VenueSlug): Reservation[] {
  const profile = PROFILES[venueId];
  const rng = mulberry32(profile.seed);
  const reservations: Reservation[] = [];
  const usedTables = new Set<string>();

  for (let i = 0; i < profile.count; i++) {
    const name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
    const time = pick(rng, profile.timeSlots);
    let table = pick(rng, profile.tables);
    // allow table reuse across different time slots but avoid dupes in same generation pass too tightly
    if (usedTables.has(`${table}-${time}`)) {
      table = pick(rng, profile.tables);
    }
    usedTables.add(`${table}-${time}`);

    reservations.push({
      id: `${venueId}-res-${i + 1}`,
      venueId,
      guestName: name,
      guestEmail: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      partySize: randInt(rng, profile.partyRange[0], profile.partyRange[1]),
      reservationDate: TODAY_ISO,
      reservationTime: time,
      tableNumber: table,
      status: statusForIndex(rng),
      specialNotes: rng() > 0.55 ? pick(rng, profile.notePool) : undefined,
    });
  }

  return reservations.sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
}

export interface DayCovers {
  date: string;
  label: string;
  covers: number;
}

function generateWeekCovers(venueId: VenueSlug): DayCovers[] {
  const profile = PROFILES[venueId];
  const rng = mulberry32(profile.seed + 777);
  const weekDates = getCurrentWeekDates();
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return weekDates.map((date, i) => {
    const isWeekend = i >= 4; // Fri, Sat, Sun feel busier
    const [min, max] = isWeekend ? profile.weekendCoverRange : profile.weekdayCoverRange;
    return {
      date,
      label: labels[i],
      covers: randInt(rng, min, max),
    };
  });
}

export const RESERVATIONS_TODAY: Record<VenueSlug, Reservation[]> = {
  "beach-road": generateTodayReservations("beach-road"),
  barrys: generateTodayReservations("barrys"),
  tilbury: generateTodayReservations("tilbury"),
  vicar: generateTodayReservations("vicar"),
};

export const WEEK_COVERS: Record<VenueSlug, DayCovers[]> = {
  "beach-road": generateWeekCovers("beach-road"),
  barrys: generateWeekCovers("barrys"),
  tilbury: generateWeekCovers("tilbury"),
  vicar: generateWeekCovers("vicar"),
};

/**
 * Same-week-last-year comparison, generated the same deterministic way as
 * this week's covers but from a different seed offset -- used by the
 * Overview AI insights demo (no real historical ledger exists for a
 * prospect, so this stands in for it).
 */
function generateLastYearWeekCovers(venueId: VenueSlug): DayCovers[] {
  const profile = PROFILES[venueId];
  const rng = mulberry32(profile.seed + 1414);
  const weekDates = getCurrentWeekDates();
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return weekDates.map((date, i) => {
    const isWeekend = i >= 4;
    const [min, max] = isWeekend ? profile.weekendCoverRange : profile.weekdayCoverRange;
    // Slightly lower than this year, so the YoY comparison reads as growth.
    return { date, label: labels[i], covers: Math.round(randInt(rng, min, max) * 0.88) };
  });
}

export const LAST_YEAR_WEEK_COVERS: Record<VenueSlug, DayCovers[]> = {
  "beach-road": generateLastYearWeekCovers("beach-road"),
  barrys: generateLastYearWeekCovers("barrys"),
  tilbury: generateLastYearWeekCovers("tilbury"),
  vicar: generateLastYearWeekCovers("vicar"),
};

export function getLastYearWeekCovers(venueId: VenueSlug): DayCovers[] {
  return LAST_YEAR_WEEK_COVERS[venueId];
}

export function getReservationsToday(venueId: VenueSlug): Reservation[] {
  return RESERVATIONS_TODAY[venueId];
}

export function getWeekCovers(venueId: VenueSlug): DayCovers[] {
  return WEEK_COVERS[venueId];
}

export function getCoversThisWeek(venueId: VenueSlug): number {
  return WEEK_COVERS[venueId].reduce((sum, d) => sum + d.covers, 0);
}

export function getConfirmedTodayCount(venueId: VenueSlug): number {
  return RESERVATIONS_TODAY[venueId].filter((r) => r.status !== "cancelled").length;
}
