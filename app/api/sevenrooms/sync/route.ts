import { NextResponse } from "next/server";

// Demo mode: no live SevenRooms sync job for Whitehouse Property Group.
// crm_guests/crm_guest_visits were seeded once with synthetic data
// (see scripts/seed-*.sql) rather than kept current by a nightly sync.
// Not scheduled by vercel.json in this project.
export async function GET() {
  return NextResponse.json({ ok: false, message: "Sync is disabled in this demo." }, { status: 503 });
}
