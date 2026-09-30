import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getVenue } from "@/lib/venues";
import { GUIDELINES } from "@/lib/guidelines-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentWeekDates } from "@/lib/mock/dates";
import { SUGGESTION_DAY_LABELS, PostingSuggestion } from "@/lib/social/suggestions";
import { RESTAURANT_SOCIAL_STRATEGY } from "@/lib/social/strategy";
import { VenueSlug, PostFormat } from "@/lib/types";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const VENUE_SLUGS: VenueSlug[] = ["beach-road", "barrys", "tilbury", "vicar"];

const CONTENT_TYPE_MAP: Record<string, PostFormat> = {
  photo: "grid",
  grid: "grid",
  carousel: "carousel",
  reel: "reel",
  story: "story",
};

function parseSuggestions(raw: string): { suggestions: PostingSuggestion[]; strategy: string } {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const list = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
  const strategy = typeof parsed?.strategy === "string" ? parsed.strategy.trim() : "";

  const valid: PostingSuggestion[] = [];
  for (const item of list) {
    const day = SUGGESTION_DAY_LABELS.find((d) => d.toLowerCase() === String(item?.day).toLowerCase());
    const contentType = CONTENT_TYPE_MAP[String(item?.content_type).toLowerCase()];
    const time = typeof item?.time === "string" && /^\d{2}:\d{2}$/.test(item.time) ? item.time : null;
    if (!day || !contentType || !time || !item?.content_suggestion) continue;
    valid.push({
      day,
      time,
      contentType,
      contentSuggestion: String(item.content_suggestion),
      reason: String(item.reason ?? ""),
    });
  }
  return { suggestions: valid.slice(0, 7), strategy };
}

export async function GET(request: NextRequest) {
  const venueParam = request.nextUrl.searchParams.get("venue");
  const force = request.nextUrl.searchParams.get("force") === "1";
  const venue = VENUE_SLUGS.includes(venueParam as VenueSlug) ? (venueParam as VenueSlug) : null;

  if (!venue) {
    return NextResponse.json({ error: "Unknown or missing venue" }, { status: 400 });
  }

  const weekStart = getCurrentWeekDates()[0];
  const supabase = getSupabaseServerClient();

  if (!force && supabase) {
    const { data: cached } = await supabase
      .from("social_suggestions_cache")
      .select("*")
      .eq("venue_slug", venue)
      .maybeSingle();

    if (
      cached &&
      cached.week_start === weekStart &&
      Date.now() - new Date(cached.generated_at).getTime() < CACHE_TTL_MS
    ) {
      return NextResponse.json({
        suggestions: cached.suggestions,
        strategy: cached.strategy ?? "",
        generatedAt: cached.generated_at,
        cached: true,
      });
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-api-key") {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY isn't configured in this environment yet." },
      { status: 503 }
    );
  }

  const venueInfo = getVenue(venue);
  const guidelines = GUIDELINES[venue];
  const client = new Anthropic({ apiKey });

  // "Read the customer" — the venue's own brand voice/positioning, already
  // captured on the Guidelines page, rather than treating every venue as an
  // interchangeable "hospitality business."
  const brandProfileContext = guidelines
    ? [
        `Tagline: ${guidelines.tagline}`,
        `Photography style: ${guidelines.photography}`,
        `Voice: ${guidelines.voiceNotes.join(" ")}`,
        guidelines.exampleCaptions.length
          ? `Example captions in this venue's actual voice:\n${guidelines.exampleCaptions.map((c) => `  "${c}"`).join("\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  // Ground the suggestions in what's actually been posted for this venue —
  // pulled straight from the same social_posts table the calendar reads and
  // writes — rather than generating purely generic ideas every time. Falls
  // back to no history gracefully (new venue, or Supabase not configured).
  let recentPostsContext = "";
  let topPerformerContext = "";
  if (supabase) {
    const { data: venueRow } = await supabase.from("venues").select("id").eq("slug", venue).maybeSingle();
    if (venueRow) {
      const { data: recentPosts } = await supabase
        .from("social_posts")
        .select("title, caption, format, channel, status, scheduled_date")
        .eq("venue_id", venueRow.id)
        .order("scheduled_date", { ascending: false })
        .limit(15);

      if (recentPosts && recentPosts.length > 0) {
        recentPostsContext = recentPosts
          .map(
            (p) =>
              `- [${p.status}] ${p.scheduled_date} (${p.format ?? p.channel}): "${p.title}"${
                p.caption ? ` — ${p.caption}` : ""
              }`
          )
          .join("\n");
      }

      // engagement_snapshots is populated once real Instagram metrics are
      // flowing in (post-OAuth); until then this simply comes back empty and
      // the prompt below omits the section entirely.
      const { data: topPosts } = await supabase
        .from("social_posts")
        .select("title, format, likes, comments, reach")
        .eq("venue_id", venueRow.id)
        .not("reach", "is", null)
        .order("reach", { ascending: false })
        .limit(5);

      if (topPosts && topPosts.length > 0) {
        topPerformerContext = topPosts
          .map((p) => `- "${p.title}" (${p.format ?? "post"}): ${p.reach} reach, ${p.likes ?? 0} likes, ${p.comments ?? 0} comments`)
          .join("\n");
      }
    }
  }

  let text: string;
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: `You are a social media strategist for hospitality venues in Sydney, Australia, generating this week's posting plan for ${venueInfo.name}, a ${venueInfo.type}.

${RESTAURANT_SOCIAL_STRATEGY}

${brandProfileContext ? `This venue's own brand voice and positioning (read this first — every suggestion should sound like it belongs to this specific venue, not a generic restaurant):\n${brandProfileContext}` : `No brand guidelines are on file yet for this venue, so keep suggestions tasteful and generic-premium-hospitality rather than inventing specific brand details.`}

First form a short strategy for the week (1-2 sentences, plain language, no jargon) that explains the angle you're taking and why — this is shown directly to the venue's marketing lead, not the guest. Then produce 7 suggestions that follow that strategy and the format/timing guidance above. Return ONLY valid JSON, no commentary outside the JSON.`,
      messages: [
        {
          role: "user",
          content: `Give me this week's plan for ${venueInfo.name}. For each of 7 suggestions provide: day (Mon/Tue/Wed/Thu/Fri/Sat/Sun), time (HH:MM), content_type (Reel/Photo/Carousel/Story), content_suggestion (specific idea for this venue, not a generic placeholder), reason (one short phrase). Format exactly: {"strategy": "...", "suggestions": [...]}${
            recentPostsContext
              ? `\n\nHere is what has actually been posted or scheduled recently for this venue (real calendar data) — don't repeat these ideas verbatim, and vary the day/time spread instead of clustering around the same slots already used:\n${recentPostsContext}`
              : ""
          }${
            topPerformerContext
              ? `\n\nThese real posts performed best by reach for this venue — lean into what's working (format, subject, tone) where it makes sense:\n${topPerformerContext}`
              : ""
          }`,
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

  let suggestions: PostingSuggestion[];
  let strategy: string;
  try {
    ({ suggestions, strategy } = parseSuggestions(text));
  } catch {
    return NextResponse.json({ error: "Claude returned unparseable suggestions." }, { status: 502 });
  }

  const generatedAt = new Date().toISOString();

  if (supabase) {
    await supabase
      .from("social_suggestions_cache")
      .upsert({ venue_slug: venue, week_start: weekStart, suggestions, strategy, generated_at: generatedAt });
  }

  return NextResponse.json({ suggestions, strategy, generatedAt, cached: false });
}
