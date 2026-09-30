import { Guest, GuestHighlight, VenueSlug } from "@/lib/types";

export type CrmGuestsResult =
  | { ok: true; guests: Guest[] }
  | { ok: false; reason: "not-configured" | "error"; message: string };

export async function fetchCrmGuests(venueSlug: VenueSlug): Promise<CrmGuestsResult> {
  try {
    const res = await fetch(`/api/crm/guests?venue=${venueSlug}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, reason: body.reason ?? "error", message: body.message ?? `Failed to load guests (${res.status})` };
    }
    return { ok: true, guests: body.guests as Guest[] };
  } catch {
    return { ok: false, reason: "error", message: "Couldn't reach the server." };
  }
}

export type SaveStaffNoteResult = { ok: true } | { ok: false; message: string };

export async function saveGuestStaffNote(guestId: string, staffNotes: string): Promise<SaveStaffNoteResult> {
  try {
    const res = await fetch("/api/crm/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, staffNotes }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: body.message ?? `Failed to save note (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Couldn't reach the server." };
  }
}

export async function saveGuestHighlights(guestId: string, highlights: GuestHighlight[]): Promise<SaveStaffNoteResult> {
  try {
    const res = await fetch("/api/crm/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, highlights }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: body.message ?? `Failed to save highlights (${res.status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Couldn't reach the server." };
  }
}
