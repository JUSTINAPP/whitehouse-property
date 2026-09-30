import { NextRequest, NextResponse } from "next/server";
import { fetchSearchConsoleServerData } from "@/lib/marketing/search-console-server";
import { VenueSlug } from "@/lib/types";

const VENUE_SLUGS: VenueSlug[] = ["beach-road", "barrys", "tilbury", "vicar"];

export async function GET(request: NextRequest) {
  try {
    const venueParam = request.nextUrl.searchParams.get("venue");
    const venue = VENUE_SLUGS.includes(venueParam as VenueSlug) ? (venueParam as VenueSlug) : null;

    if (!venue) {
      return NextResponse.json({ reason: "error", message: "Unknown or missing venue" }, { status: 400 });
    }

    const result = await fetchSearchConsoleServerData(venue);
    if (!result.ok) {
      return NextResponse.json({ reason: result.reason, message: result.message }, { status: result.status });
    }

    return NextResponse.json({ reason: "ok", ...result.data });
  } catch (error) {
    // Anything unexpected (a malformed private key breaking the JWT signing
    // step, most likely) previously bubbled up as Next.js's generic 500 page
    // with no JSON body — which the client then showed as a bare "(500)"
    // with no way to tell what actually went wrong. Surface the real reason.
    console.error("Search Console route crashed:", error);
    return NextResponse.json(
      {
        reason: "error",
        message: error instanceof Error ? `Unexpected error: ${error.message}` : "Unexpected error.",
      },
      { status: 500 }
    );
  }
}
