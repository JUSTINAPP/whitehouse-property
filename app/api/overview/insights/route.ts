import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getVenue } from "@/lib/venues";
import { GUIDELINES } from "@/lib/guidelines-data";
import { gatherOverviewInsightsContext } from "@/lib/insights/overview-insights-data";
import { VenueSlug } from "@/lib/types";

const VENUE_SLUGS: VenueSlug[] = ["beach-road", "barrys", "tilbury", "vicar"];

interface WatchItem {
  title: string;
  detail: string;
}

function parseInsights(raw: string): { summary: string; watchItems: WatchItem[] } {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const summary = typeof parsed?.summary === "string" ? parsed.summary.trim() : "";
  const list = Array.isArray(parsed?.watchItems) ? parsed.watchItems : [];

  const watchItems: WatchItem[] = [];
  for (const item of list) {
    if (typeof item?.title === "string" && typeof item?.detail === "string") {
      watchItems.push({ title: item.title.trim(), detail: item.detail.trim() });
    }
  }
  return { summary, watchItems: watchItems.slice(0, 8) };
}

// A once-a-click morning briefing for the Overview page: how today looks
// against the same week last year, which of today's guests are VIPs, and
// what staff should know going in (allergies, occasions, service flags) --
// all grounded in the real synced data from lib/insights/overview-insights-data.ts,
// not invented. Mirrors the established pattern in
// /api/marketing/website-analytics/insights.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const venueParam = body?.venue;
    const venue = VENUE_SLUGS.includes(venueParam) ? (venueParam as VenueSlug) : null;

    if (!venue) {
      return NextResponse.json({ error: "Unknown or missing venue" }, { status: 400 });
    }

    const contextResult = await gatherOverviewInsightsContext(venue);
    if (!contextResult.ok) {
      return NextResponse.json({ error: contextResult.message }, { status: 502 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your-anthropic-api-key") {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY isn't configured in this environment yet." }, { status: 503 });
    }

    const venueInfo = getVenue(venue);
    const guidelines = GUIDELINES[venue];
    const ctx = contextResult.data;

    const yoyLine =
      ctx.lastYearSameWeekTotal !== null
        ? `This week's covers so far: ${ctx.thisWeekTotal}. Same week last year: ${ctx.lastYearSameWeekTotal} covers.`
        : `This week's covers so far: ${ctx.thisWeekTotal}. No comparable data from the same week last year yet (the guest visit ledger is still building history).`;

    const vipLines =
      ctx.vipGuestsToday.length > 0
        ? ctx.vipGuestsToday
            .map((g) => `- ${g.name}, ${g.time}, party of ${g.partySize}, ${g.visitCount} visits on record`)
            .join("\n")
        : "(none booked today)";

    const flaggedLines =
      ctx.flaggedGuestsToday.length > 0
        ? ctx.flaggedGuestsToday
            .map((g) => `- ${g.name}, ${g.time}: ${g.highlights.map((h) => `[${h.type}] ${h.text}`).join("; ")}`)
            .join("\n")
        : "(none)";

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1536,
      system: `You are writing a short morning floor briefing for the manager at ${venueInfo.name} (a ${venueInfo.type}), covering ${ctx.today}. Ground everything strictly in the real data given -- never invent a name, number, or detail that isn't in the data. If a list is empty, say so plainly rather than making something up. Keep the tone practical and specific, like a manager briefing their team before service, not a marketing summary.

${guidelines ? `Brand voice, for tone only: ${guidelines.tagline}` : ""}

Return ONLY valid JSON, no commentary outside the JSON.`,
      messages: [
        {
          role: "user",
          content: `Today's numbers for ${venueInfo.name}:

Reservations today: ${ctx.todayReservationsCount}, ${ctx.todayCoversCount} covers.
${yoyLine}

VIP guests booked today:
${vipLines}

Guests with a staff highlight on file (allergy, seating preference, occasion, service note) booked today:
${flaggedLines}

Give me a 2-3 sentence plain-English summary of what today looks like, then a short list of specific things worth flagging to staff before service (VIPs to acknowledge, allergies/occasions to prep for, and how today compares to last year if that's notable). Format exactly: {"summary": "...", "watchItems": [{"title": "short label", "detail": "1-2 sentences, specific"}]}`,
        },
      ],
    });

    const textBlock = response.content.find(
      (b): b is Extract<(typeof response.content)[number], { type: "text" }> => b.type === "text"
    );
    if (!textBlock) throw new Error("No text in Claude's response");

    const { summary, watchItems } = parseInsights(textBlock.text);
    if (!summary && watchItems.length === 0) {
      return NextResponse.json({ error: "Claude returned unparseable insights." }, { status: 502 });
    }

    return NextResponse.json({ summary, watchItems, generatedAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Rate limited by Claude — try again shortly." }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY was rejected — check the key." }, { status: 502 });
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Claude API error: ${error.message}` }, { status: 502 });
    }
    console.error("Overview insights route crashed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? `Unexpected error: ${error.message}` : "Unexpected error." },
      { status: 500 }
    );
  }
}
