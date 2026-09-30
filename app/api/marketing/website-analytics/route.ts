import { NextRequest, NextResponse } from "next/server";
import { fetchWebsiteAnalyticsServerData } from "@/lib/marketing/website-analytics-server";
import { VenueSlug } from "@/lib/types";

const VENUE_SLUGS: VenueSlug[] = ["beach-road", "barrys", "tilbury", "vicar"];

export async function GET(request: NextRequest) {
  try {
    const venueParam = request.nextUrl.searchParams.get("venue");
    const venue = VENUE_SLUGS.includes(venueParam as VenueSlug) ? (venueParam as VenueSlug) : null;

    if (!venue) {
      return NextResponse.json({ reason: "error", message: "Unknown or missing venue" }, { status: 400 });
    }

    const result = await fetchWebsiteAnalyticsServerData(venue);
    if (!result.ok) {
      return NextResponse.json({ reason: result.reason, message: result.message }, { status: result.status });
    }

    return NextResponse.json({ reason: "ok", ...result.data });
  } catch (error) {
    console.error("Website Analytics route crashed:", error);
    return NextResponse.json(
      {
        reason: "error",
        message: error instanceof Error ? `Unexpected error: ${error.message}` : "Unexpected error.",
      },
      { status: 500 }
    );
  }
}
