import { NextResponse } from "next/server";

// Demo mode: no live SevenRooms connection for Whitehouse Property Group.
// The Guest CRM page reads directly from Supabase (see /api/crm/guests),
// not from this route.
export async function GET() {
  return NextResponse.json({ reason: "not-configured", message: "SevenRooms isn't connected in this demo." }, { status: 503 });
}
