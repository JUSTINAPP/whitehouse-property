"use client";

import { useMemo, useState } from "react";
import { Plus, Play, Heart, MessageCircle, X } from "lucide-react";
import { SocialPost, VenueSlug } from "@/lib/types";
import { InstagramFeedPost, InstagramProfileMock } from "@/lib/instagram-mock";
import { TODAY_ISO, daysFromNowISO } from "@/lib/mock/dates";
import { cn } from "@/lib/utils";

const MIN_TILES = 9;
const MAX_TILES = 12;

type Tile =
  | { kind: "scheduled"; post: SocialPost }
  | { kind: "published"; item: InstagramFeedPost }
  | { kind: "empty"; date: string };

export function FeedPreview({
  venueSlug,
  accent,
  posts,
  connected,
  mock,
  onEditPost,
  onCreatePost,
}: {
  venueSlug: VenueSlug;
  accent: string;
  posts: SocialPost[];
  connected: boolean;
  mock?: InstagramProfileMock;
  onEditPost: (post: SocialPost) => void;
  onCreatePost: (date: string) => void;
}) {
  const [showScheduled, setShowScheduled] = useState(true);
  const [detail, setDetail] = useState<InstagramFeedPost | null>(null);

  // Real content for the grid: any Instagram post that's actually scheduled
  // or published with an image attached, whatever its date — a scheduled
  // post whose time has already passed is still real content someone put
  // together, not something to hide just because "today" moved on. Upcoming
  // scheduled posts without an image yet still show as a placeholder tile
  // (useful for seeing what's queued), but a past post needs an actual
  // image to be worth a tile. Sorted most-recent/soonest first, like a real
  // profile grid.
  const scheduledPosts = useMemo(
    () =>
      posts
        .filter(
          (p) =>
            p.channel === "instagram" &&
            (p.status === "scheduled" || p.status === "published") &&
            (p.imageUrl || (p.status === "scheduled" && p.scheduledDate >= TODAY_ISO))
        )
        .sort((a, b) => (b.scheduledDate + b.scheduledTime).localeCompare(a.scheduledDate + a.scheduledTime))
        .slice(0, MAX_TILES),
    [posts]
  );

  const tiles = useMemo<Tile[]>(() => {
    const scheduledTiles: Tile[] = showScheduled ? scheduledPosts.map((post) => ({ kind: "scheduled", post })) : [];
    const publishedSource = mock?.feed ?? [];
    const target = Math.max(MIN_TILES, Math.min(MAX_TILES, scheduledTiles.length + publishedSource.length));
    const publishedNeeded = Math.max(0, target - scheduledTiles.length);
    const publishedTiles: Tile[] = publishedSource.slice(0, publishedNeeded).map((item) => ({ kind: "published", item }));
    const emptyCount = Math.max(0, target - scheduledTiles.length - publishedTiles.length);
    const emptyTiles: Tile[] = Array.from({ length: emptyCount }, (_, i) => ({
      kind: "empty",
      date: daysFromNowISO(i + 1),
    }));
    return [...scheduledTiles, ...publishedTiles, ...emptyTiles];
  }, [scheduledPosts, showScheduled, mock]);

  return (
    <div className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Feed preview</h2>
          <p className="text-sm text-ink-soft">
            {connected
              ? "How the Instagram grid will look, including what's queued up."
              : "Illustrative preview — connect Instagram to show the real feed alongside what's scheduled."}
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft">
          <input
            type="checkbox"
            checked={showScheduled}
            onChange={(e) => setShowScheduled(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-current"
            style={{ accentColor: accent }}
          />
          Show scheduled
        </label>
      </div>

      <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-xl border border-border bg-border">
        {tiles.map((tile, i) => {
          if (tile.kind === "empty") {
            return (
              <button
                key={`empty-${i}`}
                onClick={() => onCreatePost(tile.date)}
                className="group flex aspect-square items-center justify-center bg-cream-dim transition hover:bg-cream-dim/70"
              >
                <Plus className="h-5 w-5 text-ink-soft/40 transition group-hover:text-ink-soft" />
              </button>
            );
          }

          if (tile.kind === "scheduled") {
            const post = tile.post;
            const isVideo = post.format === "reel";
            // Only badge it as "Scheduled" (with the dimmed queued-up look)
            // while it's genuinely still upcoming — a scheduled post whose
            // time has already passed, or one already marked published,
            // reads as real content instead, same as anything from the
            // mock/live feed.
            const isUpcoming = post.status === "scheduled" && post.scheduledDate >= TODAY_ISO;

            if (!isUpcoming) {
              return (
                <button
                  key={post.id}
                  onClick={() => onEditPost(post)}
                  className="group relative aspect-square overflow-hidden bg-cream-dim"
                >
                  {post.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.imageUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                  )}
                  {isVideo && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white">
                      <Play className="h-3.5 w-3.5 fill-white" />
                    </span>
                  )}
                </button>
              );
            }

            return (
              <button
                key={post.id}
                onClick={() => onEditPost(post)}
                className="group relative aspect-square overflow-hidden bg-navy"
              >
                {post.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.imageUrl} alt="" className="h-full w-full object-cover opacity-50" />
                ) : (
                  <div className="h-full w-full bg-navy-light opacity-70" />
                )}
                {isVideo && (
                  <span className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white">
                    <Play className="h-3.5 w-3.5 fill-white" />
                  </span>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30 p-2 text-center">
                  <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink">
                    Scheduled
                  </span>
                  <span className="line-clamp-2 text-xs font-medium text-white">{post.title}</span>
                </div>
              </button>
            );
          }

          const item = tile.item;
          const isVideo = item.format === "reel";
          return (
            <button
              key={`published-${i}`}
              onClick={() => setDetail(item)}
              className="group relative aspect-square overflow-hidden bg-cream-dim"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
              {isVideo && (
                <span className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white">
                  <Play className="h-3.5 w-3.5 fill-white" />
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                <span className="flex items-center gap-1 text-sm font-semibold text-white">
                  <Heart className="h-4 w-4 fill-white" />
                  {item.likes}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-white">
                  <MessageCircle className="h-4 w-4 fill-white" />
                  {item.comments}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {!connected && !mock && (
        <p className="mt-3 text-xs text-ink-soft">
          No Instagram account connected for {venueSlug} yet — placeholder slots shown above. Connect Instagram to pull in the real feed.
        </p>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setDetail(null)}>
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold text-ink">Published post</h3>
              <button onClick={() => setDetail(null)} className="rounded-md p-1 text-ink-soft hover:bg-cream-dim hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className={cn("relative aspect-square bg-cream-dim")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={detail.image} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="space-y-3 px-5 py-4">
              <div className="flex items-center gap-4 text-sm text-ink">
                <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" /> {detail.likes} likes</span>
                <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {detail.comments} comments</span>
              </div>
              <p className="text-sm text-ink-soft">
                Caption not available in this preview — connect Instagram to see real captions, likes and comments here.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
