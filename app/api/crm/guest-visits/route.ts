import { NextRequest, NextResponse } from "next/server";
import { fetchGuestVisitsServerData } from "@/lib/crm/guest-visits-server";

export async function GET(request: NextRequest) {
  try {
    const guestId = request.nextUrl.searchParams.get("guestId");
    if (!guestId) {
      return NextResponse.json({ reason: "error", message: "Missing guestId" }, { status: 400 });
    }

    const result = await fetchGuestVisitsServerData(guestId);
    if (!result.ok) {
      return NextResponse.json({ reason: result.reason, message: result.message }, { status: 500 });
    }

    return NextResponse.json({ reason: "ok", visits: result.data });
  } catch (error) {
    console.error("CRM guest-visits route crashed:", error);
    return NextResponse.json(
      { reason: "error", message: error instanceof Error ? `Unexpected error: ${error.message}` : "Unexpected error." },
      { status: 500 }
    );
  }
}
