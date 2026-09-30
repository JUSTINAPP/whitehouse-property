"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { cn } from "@/lib/utils";

export function VenueSwitcher() {
  const { venue, venues, setVenueSlug } = useVenue();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white"
          style={{ backgroundColor: venue.accent }}
        >
          {venue.shortName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">{venue.name}</span>
          <span className="block truncate text-xs text-white/50">{venue.type}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-white/40" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-white/10 bg-[#182633] shadow-xl">
          {venues.map((v) => (
            <button
              key={v.slug}
              onClick={() => {
                setVenueSlug(v.slug);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/10",
                v.slug === venue.slug && "bg-white/5"
              )}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold text-white"
                style={{ backgroundColor: v.accent }}
              >
                {v.shortName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">{v.name}</span>
                <span className="block truncate text-xs text-white/50">{v.type}</span>
              </span>
              {v.slug === venue.slug && <Check className="h-4 w-4 shrink-0 text-gold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
