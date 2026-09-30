import { NextResponse } from "next/server";

// Demo mode: no live SevenRooms connection for Whitehouse Property Group.
// Reservations come from lib/mock/reservations.ts via the client wrapper
// in lib/sevenrooms/reservations.ts, not from this route.
export async function GET() {
  return NextResponse.json({ reason: "not-configured", message: "SevenRooms isn't connected in this demo." }, { status: 503 });
}
