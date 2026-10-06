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

// Returns null (rather than throwing) on anything unparseable, so the
// route can tell a genuinely-empty/malformed reply apart from a truncated
// one and give a clear error either way instead of a raw JSON.parse crash.
function parseInsights(raw: string): { summary: string; watchItems: WatchItem[] } | null {
  let cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  // A response cut off by max_tokens lands here mid-object/array rather
  // than empty — trim back to the last complete top-level brace so a
  // slightly-truncated reply still parses instead of failing outright.
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
 * Menu-engineering / pricing-psychology briefing, grounded in the menu's
 * actual reading order (printed piece/page/column order,
 * online document order elsewhere) and real prices — not sales data, since
 * no venue has item-level POS data synced yet (see lib/insights/menu-
 * insights-data.ts). Claude is told that explicitly so it never claims
 * something is or isn't "selling well."
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
      // South Beach's menu has 16+ sections, so the full positional
      // description plus named real items in every recommendation adds up
      // -- 2048 was cutting replies off mid-JSON for venues this size.
      max_tokens: 4096,
      system: `You are a menu engineering and restaurant pricing consultant with deep expertise in Australian hospitality, particularly pubs, bars and restaurants. You know the established menu-engineering literature (eye-path / "Golden Triangle" reading patterns, primacy and recency effects, price anchoring, decoy pricing, charm pricing vs clean round pricing for a premium venue, the risk of "price column scanning" when prices are aligned in a straight right-hand column, category breadth and choice overload) and you know current Australian hospitality trends and price benchmarks.

You are given ${ctx.sourceDescription} for ${ctx.venueName} (a ${ctx.venueType}) — the exact order and position every section and item appears in, and every real price. Ground every observation in this actual layout and these actual prices: name real items, real sections, real positions ("first item in the Brunch column", "last section before the footer"), never invented ones.

Critical constraint: you do NOT have sales data — no POS or order history for this venue is connected yet. Never claim anything is "selling well", "underperforming", "popular", or "a top seller" — you have no basis for that. Frame every recommendation around menu-engineering best practice and positioning/pricing psychology instead (e.g. "this is prime eye-path real estate and currently holds a low-margin item" is fine; "this isn't selling" is not).

Give a short plain-English summary, then specific, actionable recommendations covering: positioning (is anything high-value sitting in a weak spot, or something that should be a workhorse buried last), pricing psychology (charm vs round pricing, price column alignment/anchoring, any pricing that looks out of step with Australian market norms for this kind of dish/drink), and category/structural observations (section order, choice count per section, anything a guest would find hard to scan). Each recommendation needs a one-word-ish category label: "Positioning", "Pricing", or "Structure".

Return ONLY valid JSON, no commentary outside the JSON. Format exactly: {"summary": "2-3 sentences", "watchItems": [{"category": "Positioning|Pricing|Structure", "title": "short label", "detail": "1-2 sentences, specific, naming real items/sections/prices"}]}`,
      messages: [
        {
          role: "user",
          content: `Here is the full menu, in its real reading order:\n${ctx.positionalMenuText}\n\nAnalyse this as a menu engineering and pricing-psychology expert would, exactly as described in your instructions.`,
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
    console.error("Menu insights route crashed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? `Unexpected error: ${error.message}` : "Unexpected error." },
      { status: 500 }
    );
  }
}
