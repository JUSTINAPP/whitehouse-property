import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getVenue } from "@/lib/venues";
import { GUIDELINES } from "@/lib/guidelines-data";
import { gatherGuestInsightsContext } from "@/lib/insights/guest-insights-data";
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

// Turns the Guest CRM's real synced numbers into a plain-English read on
// the guest base: spend concentration, the win-back segment's dollar value,
// an allergy/highlight roll-up, guests whose visit rhythm has slowed
// relative to their own history, and (Volpino only) what the biggest
// spenders actually order. Mirrors the established insights pattern used
// on Overview and Website Analytics.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const venueParam = body?.venue;
    const venue = VENUE_SLUGS.includes(venueParam) ? (venueParam as VenueSlug) : null;

    if (!venue) {
      return NextResponse.json({ error: "Unknown or missing venue" }, { status: 400 });
    }

    const contextResult = await gatherGuestInsightsContext(venue);
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

    const spendLine = ctx.hasRealSpendData
      ? `Total recorded spend: $${ctx.totalSpend.toFixed(0)}. Top ${ctx.topSpendGuestCount} guests (~10%) account for ${ctx.topSpendSharePct}% of that spend.`
      : "No real spend data yet for this venue (its POS isn't feeding transaction data into the ledger) -- don't make any spend-based claims.";

    const highlightLines =
      ctx.highlightRollup.length > 0
        ? ctx.highlightRollup
            .map((h) => `- ${h.type}: ${h.count} guest(s), e.g. ${h.examples.join("; ")}`)
            .join("\n")
        : "(none on file)";

    const cadenceLines =
      ctx.cadenceFlags.length > 0
        ? ctx.cadenceFlags
            .map(
              (f) =>
                `- ${f.name}: usually every ~${Math.round(f.avgGapDays)} days, now ${f.currentGapDays} days since last visit (${f.visitCount} visits on record)`
            )
            .join("\n")
        : "(none -- no regulars showing a slowdown relative to their own history)";

    const topItemsLine =
      ctx.topItems === null
        ? null
        : ctx.topItems.length > 0
          ? ctx.topItems.map((i) => `- ${i.name} (ordered ${i.count} times)`).join("\n")
          : "(no itemized order data yet for the top spenders)";

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1536,
      system: `You are a guest-relationship analyst for ${venueInfo.name} (a ${venueInfo.type}), reading its real, synced guest CRM data and turning it into a plain-English briefing for the manager. Ground everything strictly in the numbers given -- never invent a guest name, count, or dollar figure that isn't in the data. If a data point says spend data isn't available, don't make spend claims. Focus on what's actionable: who's worth a personal touch, who's worth winning back, what the kitchen should know, which regulars are quietly slipping away.

${guidelines ? `Brand voice, for tone only: ${guidelines.tagline}` : ""}

Return ONLY valid JSON, no commentary outside the JSON.`,
      messages: [
        {
          role: "user",
          content: `Guest CRM data for ${venueInfo.name}, ${ctx.totalGuests} guests on file:

${spendLine}

One-and-done guests (visited exactly once, never returned): ${ctx.oneAndDoneCount} (${ctx.oneAndDoneRatePct}% of the guest base).

Lapsed regulars (2+ visits, haven't been back in 60+ days): ${ctx.lapsedCount} guests, representing $${ctx.lapsedSpendValue.toFixed(0)} in historical spend.

Highlights on file (allergies, seating preferences, occasions, service notes):
${highlightLines}

Regulars whose visit rhythm has slowed relative to their own history:
${cadenceLines}

${topItemsLine !== null ? `Most-ordered dishes among the top 20 spenders:\n${topItemsLine}\n` : ""}
Give me a 2-3 sentence plain-English summary of what this guest list tells us, then a short list of specific, actionable observations (who's worth protecting, who's worth winning back and what that's worth, what the kitchen should know, anything else notable). Format exactly: {"summary": "...", "watchItems": [{"title": "short label", "detail": "1-2 sentences, specific"}]}`,
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
    console.error("Guest insights route crashed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? `Unexpected error: ${error.message}` : "Unexpected error." },
      { status: 500 }
    );
  }
}
