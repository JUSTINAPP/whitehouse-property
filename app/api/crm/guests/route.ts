import { NextRequest, NextResponse } from "next/server";
import { fetchCrmGuestsServerData, updateGuestStaffNotes, updateGuestHighlights } from "@/lib/crm/guests-server";
import { GuestHighlight, HighlightType, VenueSlug } from "@/lib/types";

const HIGHLIGHT_TYPES: HighlightType[] = ["allergy", "seating", "occasion", "service", "other"];

function isValidHighlights(value: unknown): value is GuestHighlight[] {
  return (
    Array.isArray(value) &&
    value.every(
      (h) =>
        h &&
        typeof h === "object" &&
        typeof h.text === "string" &&
        HIGHLIGHT_TYPES.includes(h.type)
    )
  );
}

const VENUE_SLUGS: VenueSlug[] = ["beach-road", "barrys", "tilbury", "vicar"];

export async function GET(request: NextRequest) {
  try {
    const venueParam = request.nextUrl.searchParams.get("venue");
    const venue = VENUE_SLUGS.includes(venueParam as VenueSlug) ? (venueParam as VenueSlug) : null;

    if (!venue) {
      return NextResponse.json({ reason: "error", message: "Unknown or missing venue" }, { status: 400 });
    }

    const result = await fetchCrmGuestsServerData(venue);
    if (!result.ok) {
      return NextResponse.json({ reason: result.reason, message: result.message }, { status: 500 });
    }

    return NextResponse.json({ reason: "ok", guests: result.data });
  } catch (error) {
    console.error("CRM guests route crashed:", error);
    return NextResponse.json(
      { reason: "error", message: error instanceof Error ? `Unexpected error: ${error.message}` : "Unexpected error." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const guestId = typeof body.guestId === "string" ? body.guestId : null;
    if (!guestId) {
      return NextResponse.json({ reason: "error", message: "Missing guestId" }, { status: 400 });
    }

    if (typeof body.staffNotes === "string") {
      const result = await updateGuestStaffNotes(guestId, body.staffNotes);
      if (!result.ok) {
        return NextResponse.json({ reason: result.reason, message: result.message }, { status: 500 });
      }
    }

    if (body.highlights !== undefined) {
      if (!isValidHighlights(body.highlights)) {
        return NextResponse.json({ reason: "error", message: "Invalid highlights payload" }, { status: 400 });
      }
      const result = await updateGuestHighlights(guestId, body.highlights);
      if (!result.ok) {
        return NextResponse.json({ reason: result.reason, message: result.message }, { status: 500 });
      }
    }

    if (typeof body.staffNotes !== "string" && body.highlights === undefined) {
      return NextResponse.json({ reason: "error", message: "Nothing to update" }, { status: 400 });
    }

    return NextResponse.json({ reason: "ok" });
  } catch (error) {
    console.error("CRM guests PATCH crashed:", error);
    return NextResponse.json(
      { reason: "error", message: error instanceof Error ? `Unexpected error: ${error.message}` : "Unexpected error." },
      { status: 500 }
    );
  }
}
