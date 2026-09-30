import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getVenue } from "@/lib/venues";
import { GUIDELINES } from "@/lib/guidelines-data";
import { fetchWebsiteAnalyticsServerData, WebsiteAnalyticsBreakdownRow } from "@/lib/marketing/website-analytics-server";
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

function formatRows(rows: WebsiteAnalyticsBreakdownRow[], labelName: string): string {
  if (rows.length === 0) return "(none)";
  return rows.map((r) => `- ${labelName}: "${r.label}" — ${r.sessions} sessions, ${r.activeUsers} active users`).join("\n");
}

// Mirrors /api/marketing/search-console/insights: turns the raw GA4 numbers
// into plain-language, specific recommendations rather than generic
// "improve engagement" advice — grounded in the venue's actual top pages
// and traffic channels for this period.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const venueParam = body?.venue;
    const venue = VENUE_SLUGS.includes(venueParam) ? (venueParam as VenueSlug) : null;

    if (!venue) {
      return NextResponse.json({ error: "Unknown or missing venue" }, { status: 400 });
    }

    const gaResult = await fetchWebsiteAnalyticsServerData(venue);
    if (!gaResult.ok) {
      return NextResponse.json({ error: gaResult.message }, { status: gaResult.status });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your-anthropic-api-key") {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY isn't configured in this environment yet." }, { status: 503 });
    }

    const venueInfo = getVenue(venue);
    const guidelines = GUIDELINES[venue];
    const { totals, topPages, channels } = gaResult.data;

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1536,
      system: `You are a web analytics consultant for hospitality venues, reviewing ${venueInfo.name}'s (a ${venueInfo.type}) real GA4 (Google Analytics 4) data from the last 28 days and turning it into specific, actionable next steps — not generic "improve engagement" advice. Every recommendation must reference an actual number, page, or channel from the data given. If a low-value page (e.g. an about/contact page) is getting more sessions than a page that actually drives bookings (the menu, reservations, or events pages), that's worth flagging as a navigation or homepage-priority problem. If one traffic channel (organic search, direct, referral, social, paid) is doing most of the work while others are near zero, name which ones are underused and what that implies. If engagement rate looks low relative to sessions, that points to a landing-experience problem on whichever page gets the most traffic. Don't invent booking-conversion numbers — this data doesn't include button-click tracking yet, so don't claim to know reservation conversion rates.

${guidelines ? `Brand voice, for tone only: ${guidelines.tagline}` : ""}

Return ONLY valid JSON, no commentary outside the JSON.`,
      messages: [
        {
          role: "user",
          content: `Here is ${venueInfo.name}'s GA4 data for ${gaResult.data.startDate} to ${gaResult.data.endDate}:

Totals: ${totals.sessions} sessions, ${totals.activeUsers} active users, ${totals.pageViews} page views, ${(totals.engagementRate * 100).toFixed(1)}% engagement rate.

Top pages:
${formatRows(topPages, "page")}

Traffic sources:
${formatRows(channels, "channel")}

Give me a 2-3 sentence plain-English summary of what this data actually shows, then 3-5 specific recommendations. Format exactly: {"summary": "...", "recommendations": [{"title": "short label", "detail": "1-3 sentences, specific and actionable"}]}`,
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
    console.error("Website Analytics insights route crashed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? `Unexpected error: ${error.message}` : "Unexpected error." },
      { status: 500 }
    );
  }
}
