"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Film, Play } from "lucide-react";
import { VenueSlug } from "@/lib/types";
import { fetchSocialPosts } from "@/lib/social/social-posts-data";
import { INSTAGRAM_MOCK } from "@/lib/instagram-mock";
import { SITE_THEMES } from "@/lib/site-theme";

// Enough tiles to fill the frame's visible grid area (~5.4 rows) plus a
// partial row below it, so there's always something to scroll to — same
// "peek at the next row" affordance the real Instagram app has. Real posts
// fill first, then mock site photography, then plain blank squares — never
// fewer tiles than this, so the frame never looks sparse or mis-shapen.
const TARGET_TILES = 18;

interface Tile {
  image: string | null; // null = blank placeholder square, not a missing image
  isVideo: boolean;
}

/**
 * A phone-frame mockup of the Instagram grid, scrollable like the real app —
 * requested as a Guidelines-page companion to the static "in practice" grid
 * image, so the rhythm/variety guidance can be checked against something
 * that scrolls like a real profile rather than a single flat photo.
 *
 * The frame itself is a fixed size (a set iPhone-like shape/ratio) regardless
 * of how much content a venue has — it does not stretch or shrink to fit;
 * short of content, it pads out with plain blank squares instead.
 */
export function PhoneGridPreview({ venueSlug, accent, venueName }: { venueSlug: VenueSlug; accent: string; venueName: string }) {
  const [tiles, setTiles] = useState<Tile[] | null>(null);
  const mock = INSTAGRAM_MOCK[venueSlug];
  const handle = SITE_THEMES[venueSlug].instagramHandle;

  useEffect(() => {
    let cancelled = false;
    fetchSocialPosts(venueSlug).then((posts) => {
      if (cancelled) return;
      const real: Tile[] = (posts ?? [])
        .filter((p) => p.imageUrl && (p.status === "published" || p.status === "scheduled"))
        .sort((a, b) => (b.scheduledDate + b.scheduledTime).localeCompare(a.scheduledDate + a.scheduledTime))
        .map((p) => ({ image: p.imageUrl!, isVideo: p.format === "reel" }));

      const fillNeeded = Math.max(0, TARGET_TILES - real.length);
      const fill: Tile[] = (mock?.feed ?? [])
        .slice(0, fillNeeded)
        .map((item) => ({ image: item.image, isVideo: item.format === "reel" }));

      const blanksNeeded = Math.max(0, TARGET_TILES - real.length - fill.length);
      const blanks: Tile[] = Array.from({ length: blanksNeeded }, () => ({ image: null, isVideo: false }));

      setTiles([...real, ...fill, ...blanks].slice(0, Math.max(TARGET_TILES, real.length)));
    });
    return () => {
      cancelled = true;
    };
  }, [venueSlug, mock]);

  return (
    <div className="flex justify-center">
      {/* Fixed width + height, close to a real iPhone's ~9:19.5 ratio — a set
          shape that never stretches or squashes based on content amount. */}
      <div className="flex h-[580px] w-[268px] flex-col overflow-hidden rounded-[2.25rem] border-[6px] border-ink bg-white shadow-lg">
        <div className="flex shrink-0 justify-center bg-white pt-1.5">
          <div className="h-1 w-14 rounded-full bg-ink/15" />
        </div>

        <div className="flex shrink-0 items-center gap-2.5 px-3.5 py-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            {mock?.avatarInitial ?? venueName.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-semibold text-ink">{venueName}</p>
            {handle && <p className="truncate text-[11px] text-ink-soft">@{handle}</p>}
          </div>
        </div>

        <div className="flex shrink-0 border-t border-border">
          <div className="flex flex-1 items-center justify-center border-b-2 py-2" style={{ borderColor: accent }}>
            <LayoutGrid className="h-4 w-4" style={{ color: accent }} />
          </div>
          <div className="flex flex-1 items-center justify-center border-b-2 border-transparent py-2 opacity-25">
            <Film className="h-4 w-4 text-ink" />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-3 content-start gap-px overflow-y-auto bg-border">
          {tiles === null
            ? Array.from({ length: 18 }, (_, i) => <div key={i} className="aspect-square animate-pulse bg-cream-dim" />)
            : tiles.map((tile, i) =>
                tile.image ? (
                  <div key={i} className="relative aspect-square overflow-hidden bg-cream-dim">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={tile.image} alt="" className="h-full w-full object-cover" />
                    {tile.isVideo && (
                      <span className="absolute right-1 top-1 text-white drop-shadow">
                        <Play className="h-3 w-3 fill-white" />
                      </span>
                    )}
                  </div>
                ) : (
                  <div key={i} className="aspect-square bg-cream-dim" />
                )
              )}
        </div>
      </div>
    </div>
  );
}
