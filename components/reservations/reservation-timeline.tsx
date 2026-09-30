"use client";

import { Users, MapPin } from "lucide-react";
import { Reservation } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";

// Simple time-of-day cutoff, not a real shift schedule -- good enough to
// group "who's coming in around lunch" vs "who's coming in for dinner",
// which is the actual planning unit for a floor manager, rather than one
// long undifferentiated list.
const DINNER_CUTOFF = "16:00";

function shiftLabel(time: string): "Lunch" | "Dinner" {
  return time < DINNER_CUTOFF ? "Lunch" : "Dinner";
}

export function ReservationRow({ r }: { r: Reservation }) {
  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <div className="w-16 shrink-0 pt-0.5 text-sm font-semibold text-ink">{formatTime(r.reservationTime)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-ink">{r.guestName}</p>
          <Badge variant={r.status === "confirmed" ? "confirmed" : r.status === "pending" ? "pending" : "cancelled"}>
            {r.status}
          </Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Party of {r.partySize}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {r.tableNumber}
          </span>
        </div>
        {r.specialNotes && <p className="mt-1.5 text-xs text-ink-soft italic">{r.specialNotes}</p>}
      </div>
    </div>
  );
}

export function ReservationTimeline({ reservations }: { reservations: Reservation[] }) {
  if (reservations.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-ink-soft">No reservations match your filters.</p>
      </div>
    );
  }

  const lunch = reservations.filter((r) => shiftLabel(r.reservationTime) === "Lunch");
  const dinner = reservations.filter((r) => shiftLabel(r.reservationTime) === "Dinner");
  const groups: { label: string; rows: Reservation[] }[] = [
    ...(lunch.length > 0 ? [{ label: "Lunch", rows: lunch }] : []),
    ...(dinner.length > 0 ? [{ label: "Dinner", rows: dinner }] : []),
  ];

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.label} className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-cream-dim/50 px-5 py-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{group.label}</h3>
            <span className="text-xs text-ink-soft">{group.rows.length} reservations</span>
          </div>
          <div className="divide-y divide-border/70">
            {group.rows.map((r) => (
              <ReservationRow key={r.id} r={r} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
