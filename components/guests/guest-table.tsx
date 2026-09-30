"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Guest } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { HIGHLIGHT_TYPE_BADGE } from "@/lib/guest-highlight-meta";
import { cn, formatCurrency, formatDate, initials } from "@/lib/utils";

const TAG_VARIANT: Record<string, "gold" | "neutral"> = {
  VIP: "gold",
};

export type GuestSortKey = "visits" | "lastVisit" | "spend";
export type SortDir = "asc" | "desc";

function SortableHeader({
  label,
  sortKeyName,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  sortKeyName: GuestSortKey;
  sortKey: GuestSortKey;
  sortDir: SortDir;
  onSort: (key: GuestSortKey) => void;
}) {
  const active = sortKey === sortKeyName;
  return (
    <th className="px-5 py-3 font-medium">
      <button
        onClick={() => onSort(sortKeyName)}
        className={cn("flex items-center gap-1 transition", active ? "text-ink" : "text-ink-soft hover:text-ink")}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

export function GuestTable({
  guests,
  onSelect,
  accent,
  sortKey,
  sortDir,
  onSort,
}: {
  guests: Guest[];
  onSelect: (g: Guest) => void;
  accent: string;
  sortKey: GuestSortKey;
  sortDir: SortDir;
  onSort: (key: GuestSortKey) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-cream-dim/50 text-xs text-ink-soft">
              <th className="px-5 py-3 font-medium">Guest</th>
              <th className="px-5 py-3 font-medium">Contact</th>
              <SortableHeader label="Visits" sortKeyName="visits" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortableHeader label="Last visit" sortKeyName="lastVisit" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <SortableHeader label="Total spend" sortKeyName="spend" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <th className="px-5 py-3 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <tr
                key={g.id}
                onClick={() => onSelect(g)}
                className="cursor-pointer border-b border-border/60 transition last:border-0 hover:bg-cream-dim/40"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
                    >
                      {initials(g.name)}
                    </span>
                    <div>
                      <span className="font-medium text-ink">{g.name}</span>
                      {g.highlights?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {[...g.highlights]
                            .sort((a, b) => (a.type === "allergy" ? -1 : b.type === "allergy" ? 1 : 0))
                            .slice(0, 2)
                            .map((h, i) => (
                              <Badge key={i} variant={HIGHLIGHT_TYPE_BADGE[h.type]} className="normal-case">
                                {h.text}
                              </Badge>
                            ))}
                          {g.highlights.length > 2 && (
                            <Badge variant="neutral">+{g.highlights.length - 2}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  <div>{g.email}</div>
                  <div className="text-xs">{g.phone}</div>
                </td>
                <td className="px-5 py-3 text-ink">{g.visitCount}</td>
                <td className="px-5 py-3 text-ink-soft">{formatDate(g.lastVisit)}</td>
                <td className="px-5 py-3 font-medium text-ink">{formatCurrency(g.totalSpend)}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {g.tags.map((t) => (
                      <Badge key={t} variant={TAG_VARIANT[t] ?? "neutral"}>
                        {t}
                      </Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {guests.length === 0 && <p className="py-12 text-center text-sm text-ink-soft">No guests match your filters.</p>}
      </div>
    </div>
  );
}
