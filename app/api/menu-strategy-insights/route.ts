import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { gatherMenuInsightsContext } from "@/lib/insights/menu-insights-data";
import { VenueSlug } from "@/lib/types";

const VENUE_SLUGS: VenueSlug[] = ["beach-road", "barrys", "tilbury", "vicar"];

interface WatchItem {
  title: string;
  detail: string;
  category: string;
}

// Same truncation-tolerant JSON parsing as /api/menu-insights.
function parseInsights(raw: string): { summary: string; watchItems: WatchItem[] } | null {
  let cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  const lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.slice(0, lastBrace + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  const obj = parsed as { summary?: unknown; watchItems?: unknown };
  const summary = typeof obj?.summary === "string" ? obj.summary.trim() : "";
  const list = Array.isArray(obj?.watchItems) ? obj.watchItems : [];

  const watchItems: WatchItem[] = [];
  for (const item of list) {
    if (typeof (item as WatchItem)?.title === "string" && typeof (item as WatchItem)?.detail === "string") {
      const w = item as WatchItem;
      watchItems.push({
        title: w.title.trim(),
        detail: w.detail.trim(),
        category: typeof w.category === "string" ? w.category.trim() : "General",
      });
    }
  }
  return { summary, watchItems: watchItems.slice(0, 10) };
}

/**
 * Food & content strategy briefing -- distinct from /api/menu-insights
 * (which is menu-engineering/pricing-psychology). This one is about the
 * menu as a marketing and photography asset: what's worth shooting and
 * promoting, seasonal/trend angles grounded in current Australian
 * hospitality, and food-photography craft (styling, light, plating for
 * camera) tied to real dishes on the real menu -- never invented ones.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const venueParam = body?.venue;
    const venue = VENUE_SLUGS.includes(venueParam) ? (venueParam as VenueSlug) : null;

    if (!venue) {
      return NextResponse.json({ error: "Unknown or missing venue" }, { status: 400 });
    }

    const contextResult = await gatherMenuInsightsContext(venue);
    if (!contextResult.ok) {
      return NextResponse.json({ error: contextResult.message }, { status: 502 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your-anthropic-api-key") {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY isn't configured in this environment yet." }, { status: 503 });
    }

    const ctx = contextResult.data;
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: `You are a food content strategist and photography director for Australian hospitality venues, the kind a group would bring in to plan what gets shot, when, and why -- separate from menu engineering or pricing.

You are given ${ctx.sourceDescription} for ${ctx.venueName} (a ${ctx.venueType}) -- every real section and item. Ground every recommendation in these actual dishes and drinks: name real items, never invented ones.

Cover three things, each with a one-word-ish category label:
- "Photography" -- which real dishes/drinks are the strongest hero-shot candidates and why (colour, texture, height, a sauce or garnish moment that reads well on camera), plus concrete styling/lighting/plating-for-camera craft (natural side light vs. overhead, negative space, steam/condensation timing, prop choices that suit an Australian pub/restaurant aesthetic rather than generic stock-food styling).
- "Trends" -- current (2025/2026) Australian hospitality food and menu-content trends genuinely relevant to this venue's actual style and dishes (e.g. transparency/provenance storytelling, low-waste or whole-ingredient use, naturally fermented or low-intervention drinks, texture-forward plating, seasonal/local sourcing callouts, the shift toward short-form video over static photos) -- always tied back to a specific real item or section where one applies, not generic trend-listing.
- "Content" -- specific shoot or content ideas built from the real menu (a seasonal section worth a dedicated shoot, a behind-the-scenes angle for a signature dish, a pairing or "how it's made" story), each naming real items.

Return ONLY valid JSON, no commentary outside the JSON. Format exactly: {"summary": "2-3 sentences setting the overall photography/content priority for this venue right now", "watchItems": [{"category": "Photography|Trends|Content", "title": "short label", "detail": "1-2 sentences, specific, naming real items/sections"}]}`,
      messages: [
        {
          role: "user",
          content: `Here is the full menu:\n${ctx.positionalMenuText}\n\nGive a food content & photography strategy briefing exactly as described in your instructions.`,
        },
      ],
    });

    const textBlock = response.content.find(
      (b): b is Extract<(typeof response.content)[number], { type: "text" }> => b.type === "text"
    );
    if (!textBlock) {
      return NextResponse.json({ error: "Claude returned no text — try again." }, { status: 502 });
    }

    const result = parseInsights(textBlock.text);
    if (!result || (!result.summary && result.watchItems.length === 0)) {
      const truncated = response.stop_reason === "max_tokens";
      return NextResponse.json(
        {
          error: truncated
            ? "Claude's response was cut off before finishing — try again, it usually completes on a retry."
            : "Claude returned unparseable insights — try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ summary: result.summary, watchItems: result.watchItems, generatedAt: new Date().toISOString() });
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
    console.error("Menu strategy insights route crashed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? `Unexpected error: ${error.message}` : "Unexpected error." },
      { status: 500 }
    );
  }
}
