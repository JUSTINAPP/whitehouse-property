"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { Venue, VenueSlug } from "@/lib/types";
import { VENUES, getVenue } from "@/lib/venues";

interface VenueContextValue {
  venue: Venue;
  venues: Venue[];
  setVenueSlug: (slug: VenueSlug) => void;
}

const VenueContext = createContext<VenueContextValue | null>(null);

export function VenueProvider({ children }: { children: ReactNode }) {
  const [slug, setSlug] = useState<VenueSlug>("beach-road");

  const value = useMemo<VenueContextValue>(
    () => ({
      venue: getVenue(slug),
      venues: VENUES,
      setVenueSlug: setSlug,
    }),
    [slug]
  );

  return <VenueContext.Provider value={value}>{children}</VenueContext.Provider>;
}

export function useVenue(): VenueContextValue {
  const ctx = useContext(VenueContext);
  if (!ctx) throw new Error("useVenue must be used within a VenueProvider");
  return ctx;
}
