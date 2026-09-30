import { NextResponse } from "next/server";

// Diagnostic route from the original codebase -- not applicable here since
// Whitehouse Property Group has no real SevenRooms connection in this demo.
export async function GET() {
  return NextResponse.json({ ok: false, message: "SevenRooms isn't connected in this demo." }, { status: 503 });
}
