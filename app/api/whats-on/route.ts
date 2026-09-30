import { NextRequest, NextResponse } from "next/server";
import { SANITY_CONFIG } from "@/lib/sanity-config";
import { queryEventsServerSide } from "@/lib/sanity/whats-on";
import { VenueSlug } from "@/lib/types";

// Proxies the venue's Sanity "What's On" query server-side. Sanity's CORS
// allowlist for both projects only covers the venues' own domains, so a
// browser call straight to api.sanity.io from this dashboard's origin gets
// rejected — routing through this same-origin API route sidesteps that
// entirely, since it's a server-to-server request under the hood.
export async function GET(request: NextRequest) {
  const venue = request.nextUrl.searchParams.get("venue") as VenueSlug | null;
  const config = venue ? SANITY_CONFIG[venue] : undefined;

  if (!config) {
    return NextResponse.json({ error: "No Sanity project configured for this venue" }, { status: 404 });
  }

  const events = await queryEventsServerSide(config);
  if (events === null) {
    return NextResponse.json({ error: "Could not reach Sanity" }, { status: 502 });
  }

  return NextResponse.json({ events });
}
