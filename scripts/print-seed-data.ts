import { randomUUID } from "crypto";
import { VENUES } from "../lib/venues";
import { GUESTS } from "../lib/mock/guests";
import { RESERVATIONS_TODAY } from "../lib/mock/reservations";
import { GuestHighlight } from "../lib/types";

// Prints JSON for scripts/seed-crm.sql generation -- no Supabase client or
// keys needed here, just re-exposing the deterministic mock data so it can
// be turned into SQL INSERT statements.

const HIGHLIGHT_SAMPLES: GuestHighlight[][] = [
  [{ type: "allergy", text: "Nut allergy" }],
  [{ type: "occasion", text: "Birthday regular, ask about their usual table" }],
  [{ type: "seating", text: "Prefers a quiet corner table" }],
  [{ type: "service", text: "Always offer the specials board first" }],
];

const out: Record<string, unknown> = {};

for (const venue of VENUES) {
  const guests = GUESTS[venue.slug];
  const todaysConfirmed = RESERVATIONS_TODAY[venue.slug].filter((r) => r.status !== "cancelled");

  const guestRows = guests.map((g, i) => ({
    id: randomUUID(),
    sevenrooms_client_id: `${venue.slug}-guest-${i + 1}`,
    name: g.name,
    email: g.email,
    phone: g.phone,
    is_vip: g.tags.includes("VIP"),
    notes: g.notes ?? null,
    first_seen: g.visitHistory[0]?.date ?? g.lastVisit,
    last_seen: g.lastVisit,
    visit_count: g.visitCount,
    total_spend: g.totalSpend,
    highlights: i < HIGHLIGHT_SAMPLES.length ? HIGHLIGHT_SAMPLES[i] : [],
    visits: g.visitHistory.map((v, vi) => ({
      sevenrooms_reservation_id: `${venue.slug}-guest-${i + 1}-visit-${vi + 1}`,
      visit_date: v.date,
      party_size: v.partySize,
      spend_total: v.spend,
      notes: v.notes ?? null,
    })),
  }));

  // Guarantee the Overview AI insights demo always finds at least one VIP
  // and one highlighted guest booked "today" -- pick the first two
  // confirmed reservations and seed matching crm_guests rows under their
  // exact reservation name.
  const forcedMatches = todaysConfirmed.slice(0, 2).map((r, i) => ({
    id: randomUUID(),
    sevenrooms_client_id: `${venue.slug}-today-match-${i + 1}`,
    name: r.guestName,
    email: r.guestEmail ?? null,
    phone: null,
    is_vip: i === 0,
    notes: null,
    first_seen: g_daysAgo(400),
    last_seen: g_daysAgo(10),
    visit_count: 12 + i,
    total_spend: 1400 + i * 300,
    highlights: i === 1 ? [{ type: "occasion", text: "Celebrating today — let the team know" }] : i === 0 ? [{ type: "service", text: "VIP, always greet by name" }] : [],
    visits: [],
  }));

  out[venue.slug] = { guests: [...guestRows, ...forcedMatches] };
}

function g_daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

console.log(JSON.stringify(out));
