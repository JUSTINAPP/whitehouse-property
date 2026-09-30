"use client";

import { useEffect, useState } from "react";
import { Download, LayoutGrid, Film, BookOpen, Loader2, LucideIcon } from "lucide-react";
import { ContentType, GeneratedContentRow, fetchGeneratedContent, generatedContentPublicUrl } from "@/lib/generated-content";
import { VenueSlug } from "@/lib/types";
import { cn } from "@/lib/utils";

const TABS: { id: ContentType | "feed"; label: string; icon: LucideIcon; matches: ContentType[] }[] = [
  { id: "feed", label: "Grid & Carousel", icon: LayoutGrid, matches: ["grid", "carousel"] },
  { id: "reel", label: "Reels", icon: Film, matches: ["reel"] },
  { id: "story", label: "Stories", icon: BookOpen, matches: ["story"] },
];

export function GeneratedContentGallery({ venueSlug, accent }: { venueSlug: VenueSlug; accent: string }) {
  const [items, setItems] = useState<GeneratedContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("feed");

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the loading flag when venueSlug changes is intentional here
    setLoading(true);
    fetchGeneratedContent(venueSlug).then((rows) => {
      if (!cancelled) {
        setItems(rows);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [venueSlug]);

  const activeMatches = TABS.find((t) => t.id === tab)?.matches ?? [];
  const visible = items.filter((item) => activeMatches.includes(item.content_type));

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 rounded-lg border border-border bg-white p-1 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition",
                active ? "text-white" : "text-ink-soft hover:text-ink"
              )}
              style={active ? { backgroundColor: accent } : undefined}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading generated content…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white py-14 text-center text-sm text-ink-soft">
          Nothing generated in this category yet for this venue.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((item) => (
            <ContentCard key={item.id} item={item} accent={accent} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentCard({ item, accent }: { item: GeneratedContentRow; accent: string }) {
  const url = generatedContentPublicUrl(item.storage_path);
  const isVideo = item.mime_type.startsWith("video/");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="relative aspect-[4/5] bg-cream-dim">
        {isVideo ? (
          <video src={url} className="h-full w-full object-cover" muted loop playsInline controls />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={item.title ?? item.content_type} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-ink">{item.title ?? item.content_type}</p>
        {item.caption && <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{item.caption}</p>}
        <a
          href={url}
          download
          className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: accent }}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </div>
    </div>
  );
}
