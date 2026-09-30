import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getVenue } from "@/lib/venues";
import { GUIDELINES } from "@/lib/guidelines-data";
import { RESTAURANT_SOCIAL_STRATEGY } from "@/lib/social/strategy";
import { VenueSlug } from "@/lib/types";

const VENUE_SLUGS: VenueSlug[] = ["beach-road", "barrys", "tilbury", "vicar"];
const IDEAS_PER_GENERATION = 3; // matches Later's "1 credit per 3 ideas" batch size

function parseIdeas(raw: string): string[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const list = Array.isArray(parsed?.ideas) ? parsed.ideas : [];
  return list.filter((i: unknown) => typeof i === "string" && i.trim().length > 0).map((i: string) => i.trim());
}

// Generates fresh ideas for one existing content pillar — the "Generate new
// ideas" action within a column, not the initial pillar-setting step (that's
// /api/social/ideas/pillars). Told what's already on the board for this
// pillar so it doesn't repeat itself.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const venueParam = body?.venue;
  const pillarTitle = typeof body?.pillarTitle === "string" ? body.pillarTitle.trim() : "";
  const pillarDescription = typeof body?.pillarDescription === "string" ? body.pillarDescription.trim() : "";
  const existingIdeas: string[] = Array.isArray(body?.existingIdeas)
    ? body.existingIdeas.filter((i: unknown) => typeof i === "string")
    : [];
  const venue = VENUE_SLUGS.includes(venueParam) ? (venueParam as VenueSlug) : null;

  if (!venue || !pillarTitle) {
    return NextResponse.json({ error: "Missing venue or pillar" }, { status: 400 });
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
        `Voice: ${guidelines.voiceNotes.join(" ")}`,
        guidelines.exampleCaptions.length
          ? `Example captions in this venue's actual voice:\n${guidelines.exampleCaptions.map((c) => `  "${c}"`).join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  let text: string;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `You are a social media content strategist for ${venueInfo.name}, a ${venueInfo.type}.

${RESTAURANT_SOCIAL_STRATEGY}

${brandProfileContext ? `This venue's own brand voice and positioning:\n${brandProfileContext}` : ""}

Return ONLY valid JSON, no commentary outside the JSON.`,
      messages: [
        {
          role: "user",
          content: `Generate ${IDEAS_PER_GENERATION} new post ideas for the content pillar "${pillarTitle}"${
            pillarDescription ? ` (${pillarDescription})` : ""
          }. Each idea should be a specific, ready-to-brief concept for ${venueInfo.name} — 1-3 sentences, concrete enough that someone could shoot it without more direction, not a vague theme restatement.${
            existingIdeas.length
              ? `\n\nAlready on the board for this pillar — don't repeat these or anything too close to them:\n${existingIdeas.map((i) => `- ${i}`).join("\n")}`
              : ""
          } Format exactly: {"ideas": ["...", "...", "..."]}`,
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

  let ideas: string[];
  try {
    ideas = parseIdeas(text);
  } catch {
    return NextResponse.json({ error: "Claude returned unparseable ideas." }, { status: 502 });
  }

  if (ideas.length === 0) {
    return NextResponse.json({ error: "Claude didn't return any usable ideas." }, { status: 502 });
  }

  return NextResponse.json({ ideas });
}
