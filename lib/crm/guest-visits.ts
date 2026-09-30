import { VisitRecord } from "@/lib/types";

export type GuestVisitsResult =
  | { ok: true; visits: VisitRecord[] }
  | { ok: false; reason: "not-configured" | "error"; message: string };

export async function fetchGuestVisits(guestId: string): Promise<GuestVisitsResult> {
  try {
    const res = await fetch(`/api/crm/guest-visits?guestId=${guestId}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, reason: body.reason ?? "error", message: body.message ?? `Failed to load visit history (${res.status})` };
    }
    return { ok: true, visits: body.visits as VisitRecord[] };
  } catch {
    return { ok: false, reason: "error", message: "Couldn't reach the server." };
  }
}
