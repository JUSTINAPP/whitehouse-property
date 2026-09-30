import { FunctionBooking, LeadSource, VenueSlug } from "../types";
import { getFunctionBookings } from "./function-bookings";
import { TODAY_ISO } from "./dates";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Standard cost assumptions used across the dashboard's breakeven maths —
// matches the "Calculating breakeven" table in the Functions ROAS template
// (Labour 30% / COGS 30% of function spend, leaving 40% gross margin).
export const LABOUR_PCT = 0.3;
export const COGS_PCT = 0.3;
export const GP_MARGIN = 1 - LABOUR_PCT - COGS_PCT;

export interface MonthlySeasonality {
  label: string;
  confirmedBookings: number;
  confirmedRevenue: number;
  pipelineBookings: number; // tentative + enquiry, not yet won
  pipelineRevenue: number;
}

export function getSeasonality(venueId: VenueSlug): MonthlySeasonality[] {
  const bookings = getFunctionBookings(venueId);
  const year = new Date(TODAY_ISO).getFullYear();

  return MONTH_LABELS.map((label, i) => {
    const prefix = `${year}-${String(i + 1).padStart(2, "0")}`;
    const monthBookings = bookings.filter((b) => b.eventDate.startsWith(prefix));
    const confirmed = monthBookings.filter((b) => b.status === "confirmed");
    const pipeline = monthBookings.filter((b) => b.status === "tentative" || b.status === "enquiry");
    return {
      label,
      confirmedBookings: confirmed.length,
      confirmedRevenue: confirmed.reduce((s, b) => s + b.totalValue, 0),
      pipelineBookings: pipeline.length,
      pipelineRevenue: pipeline.reduce((s, b) => s + b.totalValue, 0),
    };
  });
}

// Assumed CPC + conversion rate per paid channel — used to back into an
// illustrative "ad spend" and "traffic" for the two paid sources, the same
// way the ROAS template works forward from spend. Organic/referral sources
// have no media cost so those columns render as "—".
const PAID_CHANNEL_ASSUMPTIONS: Partial<Record<LeadSource, { cpc: number; conversionRate: number }>> = {
  "google-ads": { cpc: 3.4, conversionRate: 0.045 },
  "instagram-ads": { cpc: 2.1, conversionRate: 0.032 },
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  "google-ads": "Google Ads",
  "instagram-ads": "Instagram Ads",
  "google-organic": "Google (organic search)",
  "instagram-organic": "Instagram (organic)",
  "google-business": "Google Business Profile",
  referral: "Referral",
  "repeat-guest": "Repeat guest",
  "website-direct": "Direct / website",
};

export interface ChannelPerformance {
  source: LeadSource;
  label: string;
  paid: boolean;
  adSpend: number | null;
  cpc: number | null;
  traffic: number | null;
  leads: number;
  closeRate: number;
  bookings: number;
  avgSpend: number;
  revenue: number;
  grossProfit: number;
  roas: number | null; // revenue / adSpend
}

export function getChannelPerformance(venueId: VenueSlug): ChannelPerformance[] {
  const bookings = getFunctionBookings(venueId);
  const bySource = new Map<LeadSource, FunctionBooking[]>();
  for (const b of bookings) {
    if (!bySource.has(b.leadSource)) bySource.set(b.leadSource, []);
    bySource.get(b.leadSource)!.push(b);
  }

  const rows: ChannelPerformance[] = [];
  for (const [source, group] of bySource) {
    const leads = group.length;
    const won = group.filter((b) => b.status === "confirmed" || b.status === "tentative");
    const bookingsCount = won.length;
    const revenue = won.reduce((s, b) => s + b.totalValue, 0);
    const avgSpend = bookingsCount > 0 ? Math.round(revenue / bookingsCount) : 0;
    const grossProfit = Math.round(revenue * GP_MARGIN);
    const closeRate = leads > 0 ? bookingsCount / leads : 0;

    const assumption = PAID_CHANNEL_ASSUMPTIONS[source];
    let adSpend: number | null = null;
    let cpc: number | null = null;
    let traffic: number | null = null;
    let roas: number | null = null;
    if (assumption) {
      cpc = assumption.cpc;
      traffic = Math.round(leads / assumption.conversionRate);
      adSpend = Math.round(traffic * cpc);
      roas = adSpend > 0 ? Math.round((revenue / adSpend) * 10) / 10 : null;
    }

    rows.push({
      source,
      label: SOURCE_LABELS[source],
      paid: !!assumption,
      adSpend,
      cpc,
      traffic,
      leads,
      closeRate,
      bookings: bookingsCount,
      avgSpend,
      revenue,
      grossProfit,
      roas,
    });
  }

  return rows.sort((a, b) => b.revenue - a.revenue);
}

export interface BreakevenSummary {
  avgBookingValue: number;
  grossProfitPerBooking: number;
  monthlyMarketingSpend: number;
  breakevenRatio: number; // marketing spend / GP per booking — bookings' worth of GP needed to cover spend
}

export function getBreakeven(venueId: VenueSlug): BreakevenSummary {
  const channels = getChannelPerformance(venueId);
  const bookings = getFunctionBookings(venueId).filter((b) => b.status === "confirmed" || b.status === "tentative");
  const avgBookingValue = bookings.length > 0 ? Math.round(bookings.reduce((s, b) => s + b.totalValue, 0) / bookings.length) : 0;
  const grossProfitPerBooking = Math.round(avgBookingValue * GP_MARGIN);
  const monthlyMarketingSpend = Math.round(channels.reduce((s, c) => s + (c.adSpend ?? 0), 0) / 12);
  const breakevenRatio = grossProfitPerBooking > 0 ? Math.round((monthlyMarketingSpend / grossProfitPerBooking) * 100) / 100 : 0;

  return { avgBookingValue, grossProfitPerBooking, monthlyMarketingSpend, breakevenRatio };
}
