import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getVenue } from "@/lib/venues";
import { GUIDELINES } from "@/lib/guidelines-data";
import { VENUE_MENUS } from "@/lib/menu-data";
import { fetchSearchConsoleServerData, SearchConsoleBreakdownRow } from "@/lib/marketing/search-console-server";
import { VenueSlug } from "@/lib/types";

const VENUE_SLUGS: VenueSlug[] = ["beach-road", "barrys", "tilbury", "vicar"];

interface Recommendation {
  title: string;
  detail: string;
}

function parseInsights(raw: string): { summary: string; recommendations: Recommendation[] } {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const summary = typeof parsed?.summary === "string" ? parsed.summary.trim() : "";
  const list = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];

  const recommendations: Recommendation[] = [];
  for (const item of list) {
    if (typeof item?.title === "string" && typeof item?.detail === "string") {
      recommendations.push({ title: item.title.trim(), detail: item.detail.trim() });
    }
  }
  return { summary, recommendations: recommendations.slice(0, 6) };
}

function formatRows(rows: SearchConsoleBreakdownRow[], labelName: string): string {
  if (rows.length === 0) return "(none)";
  return rows
    .map(
      (r) =>
        `- ${labelName}: "${r.label}" — ${r.clicks} clicks, ${r.impressions} impressions, ${(r.ctr * 100).toFixed(1)}% CTR, avg. position ${r.position.toFixed(1)}`
    )
    .join("\n");
}

// Lets Claude cross-reference what people are actually searching for
// against what's really on the menu — the gap Search Console data alone
// can't show (e.g. real search volume for "vegan pizza" but nothing on
// the menu flagged as vegan).
function formatMenu(venue: VenueSlug): string {
  const menu = VENUE_MENUS[venue];
  if (!menu) return "(no menu on file for this venue)";
  return menu.groups
    .flatMap((g) => g.sections.map((s) => `${s.title}: ${s.items.map((i) => i.name).join(", ")}`))
    .join("\n");
}

// Turns the raw Search Console numbers into plain-language, specific
// recommendations — what a marketer would actually do about a page with
// high impressions but poor CTR, a query stuck on page 2, or a keyword
// pattern the site doesn't currently target. Reads the real per-venue data,
// not a generic "improve your SEO" list.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const venueParam = body?.venue;
    const venue = VENUE_SLUGS.includes(venueParam) ? (venueParam as VenueSlug) : null;

    if (!venue) {
      return NextResponse.json({ error: "Unknown or missing venue" }, { status: 400 });
    }

    const scResult = await fetchSearchConsoleServerData(venue);
    if (!scResult.ok) {
      return NextResponse.json({ error: scResult.message }, { status: scResult.status });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your-anthropic-api-key") {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY isn't configured in this environment yet." }, { status: 503 });
    }

    const venueInfo = getVenue(venue);
    const guidelines = GUIDELINES[venue];
    const { totals, topQueries, topPages } = scResult.data;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1536,
      system: `You are an SEO analyst for hospitality venues, reviewing ${venueInfo.name}'s (a ${venueInfo.type}) real Google Search Console data from the last 28 days and turning it into specific, actionable next steps — not generic SEO advice. Every recommendation must reference an actual number, query, or page from the data given, and say concretely what to change (e.g. a specific page's title/meta description, a specific new page or menu section, a specific keyword pattern to target). If a page has high impressions but low CTR, that's a title/meta-description problem. If a query has decent impressions but a poor average position (5+), that's a content/on-page problem, not a title problem. If a close variant of the brand name has meaningfully different volume or position than the main name, that's worth flagging. You're also given the venue's actual current menu — cross-reference it against the queries: if there's real search volume for something (a dish, a diet type like vegan/gluten-free, a cuisine angle) that isn't clearly reflected in any menu item name or the menu page's content, call that out as a specific gap, naming the query and what's missing.

${guidelines ? `Brand voice, for tone only: ${guidelines.tagline}` : ""}

Return ONLY valid JSON, no commentary outside the JSON.`,
      messages: [
        {
          role: "user",
          content: `Here is ${venueInfo.name}'s Search Console data for ${scResult.data.startDate} to ${scResult.data.endDate}:

Totals: ${totals.clicks} clicks, ${totals.impressions} impressions, ${(totals.ctr * 100).toFixed(1)}% CTR, average position ${totals.position.toFixed(1)}.

Top queries:
${formatRows(topQueries, "query")}

Top pages:
${formatRows(topPages, "page")}

Current menu:
${formatMenu(venue)}

Give me a 2-3 sentence plain-English summary of what this data actually shows, then 3-5 specific recommendations — including at least one menu-content gap if the queries suggest one. Format exactly: {"summary": "...", "recommendations": [{"title": "short label", "detail": "1-3 sentences, specific and actionable"}]}`,
        },
      ],
    });

    const textBlock = response.content.find(
      (b): b is Extract<(typeof response.content)[number], { type: "text" }> => b.type === "text"
    );
    if (!textBlock) throw new Error("No text in Claude's response");

    const { summary, recommendations } = parseInsights(textBlock.text);
    if (!summary && recommendations.length === 0) {
      return NextResponse.json({ error: "Claude returned unparseable insights." }, { status: 502 });
    }

    return NextResponse.json({ summary, recommendations, generatedAt: new Date().toISOString() });
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
    console.error("Search Console insights route crashed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? `Unexpected error: ${error.message}` : "Unexpected error." },
      { status: 500 }
    );
  }
}
