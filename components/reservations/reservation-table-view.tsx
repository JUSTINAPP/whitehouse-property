"use client";

import { Reservation } from "@/lib/types";
import { ReservationRow } from "@/components/reservations/reservation-timeline";

const UNASSIGNED = "Unassigned";

// Natural sort so "9" comes before "12" (plain string sort would put "12"
// first). Falls back to alphabetical for non-numeric table names.
function compareTableLabels(a: string, b: string): number {
  if (a === UNASSIGNED) return 1;
  if (b === UNASSIGNED) return -1;
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
  return a.localeCompare(b);
}

/**
 * Groups today's reservations by table instead of by time -- read-only, for
 * at-a-glance "what's table 5 got booked tonight" context. Table assignment
 * itself stays in SevenRooms (the host stand's system of record); this just
 * reflects whatever's already been assigned there, split across whichever
 * individual tables a party is seated at (a combined booking like "12, 15,
 * 14" appears once under each of those three tables).
 *
 * Only tables that have a reservation today are shown -- SevenRooms' API
 * doesn't expose a canonical list of every physical table at a venue, so an
 * empty table simply won't appear here, unlike a real floor plan.
 */
export function ReservationTableView({ reservations }: { reservations: Reservation[] }) {
  if (reservations.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-ink-soft">No reservations match your filters.</p>
      </div>
    );
  }

  const byTable = new Map<string, Reservation[]>();
  for (const r of reservations) {
    const labels = r.tableNumber
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const tables = labels.length > 0 ? labels : [UNASSIGNED];
    for (const table of tables) {
      const existing = byTable.get(table) ?? [];
      existing.push(r);
      byTable.set(table, existing);
    }
  }

  const tableLabels = Array.from(byTable.keys()).sort(compareTableLabels);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tableLabels.map((table) => {
        const rows = [...byTable.get(table)!].sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
        return (
          <div key={table} className="rounded-xl border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border bg-cream-dim/50 px-4 py-2.5">
              <h3 className="text-sm font-semibold text-ink">
                {table === UNASSIGNED ? "Unassigned" : `Table ${table}`}
              </h3>
              <span className="text-xs text-ink-soft">{rows.length}</span>
            </div>
            <div className="divide-y divide-border/70">
              {rows.map((r) => (
                <ReservationRow key={`${table}-${r.id}`} r={r} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
