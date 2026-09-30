import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getVenue } from "@/lib/venues";
import { GUIDELINES } from "@/lib/guidelines-data";
import { RESTAURANT_SOCIAL_STRATEGY } from "@/lib/social/strategy";
import { VenueSlug } from "@/lib/types";

const VENUE_SLUGS: VenueSlug[] = ["beach-road", "barrys", "tilbury", "vicar"];

interface PillarSuggestion {
  title: string;
  description: string;
}

function parsePillars(raw: string): PillarSuggestion[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const list = Array.isArray(parsed?.pillars) ? parsed.pillars : [];

  const valid: PillarSuggestion[] = [];
  for (const item of list) {
    if (typeof item?.title === "string" && typeof item?.description === "string") {
      valid.push({ title: item.title.trim(), description: item.description.trim() });
    }
  }
  return valid.slice(0, 4);
}

// Generates the recurring content "pillars" (Later's term) an Ideas board
// is organised around — named, repeatable content themes like "Juice of
// the Week", each with a short description of what that theme actually is.
// This is a pure generation step: nothing is written to the database here,
// the client persists whatever pillars the venue ends up keeping.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const venueParam = body?.venue;
  const brandDescription = typeof body?.brandDescription === "string" ? body.brandDescription.trim() : "";
  const venue = VENUE_SLUGS.includes(venueParam) ? (venueParam as VenueSlug) : null;

  if (!venue) {
    return NextResponse.json({ error: "Unknown or missing venue" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-api-key") {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY isn't configured in this environment yet." }, { status: 503 });
  }

  const venueInfo = getVenue(venue);
  const guidelines = GUIDELINES[venue];
  const client = new Anthropic({ apiKey });

  const brandProfileContext = guidelines
    ? [
        `Tagline: ${guidelines.tagline}`,
        `Photography style: ${guidelines.photography}`,
        `Voice: ${guidelines.voiceNotes.join(" ")}`,
      ].join("\n")
    : "";

  let text: string;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are a social media strategist for hospitality venues, defining recurring content pillars — named, repeatable content themes a venue posts under week after week (e.g. "Juice of the Week", "Behind the Bar", "Customer Spotlight") — for ${venueInfo.name}, a ${venueInfo.type}.

${RESTAURANT_SOCIAL_STRATEGY}

${brandProfileContext ? `This venue's own brand voice and positioning:\n${brandProfileContext}` : ""}
${brandDescription ? `The venue owner describes the business as: "${brandDescription}"` : ""}

Return ONLY valid JSON, no commentary outside the JSON.`,
      messages: [
        {
          role: "user",
          content: `Generate 4 content pillars for ${venueInfo.name}. Each needs a short, punchy title (2-4 words, title case, like a recurring series name) and a one-to-two sentence description of what that recurring content actually is and why it works for this venue. Cover a genuine mix — don't make all 4 about food photography. Format exactly: {"pillars": [{"title": "...", "description": "..."}]}`,
        },
      ],
    });

    const textBlock = response.content.find(
      (b): b is Extract<(typeof response.content)[number], { type: "text" }> => b.type === "text"
    );
    if (!textBlock) throw new Error("No text in Claude's response");
    text = textBlock.text;
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
    return NextResponse.json({ error: "Failed to reach Claude." }, { status: 502 });
  }

  let pillars: PillarSuggestion[];
  try {
    pillars = parsePillars(text);
  } catch {
    return NextResponse.json({ error: "Claude returned unparseable pillars." }, { status: 502 });
  }

  if (pillars.length === 0) {
    return NextResponse.json({ error: "Claude didn't return any usable pillars." }, { status: 502 });
  }

  return NextResponse.json({ pillars });
}
