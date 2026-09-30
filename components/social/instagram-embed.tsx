import { ExternalLink, AtSign, Heart, MessageCircle, Film, GalleryHorizontal } from "lucide-react";
import { IntegrationNote } from "@/components/ui/integration-note";
import { InstagramProfileMock } from "@/lib/instagram-mock";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

export function InstagramEmbed({
  handle,
  embedUrl,
  accent,
  mock,
}: {
  handle?: string;
  embedUrl?: string;
  accent: string;
  mock?: InstagramProfileMock;
}) {
  if (!handle) {
    return <IntegrationNote text="No Instagram account linked for this venue yet." />;
  }

  if (embedUrl) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <iframe src={embedUrl} className="w-full" style={{ minHeight: "70vh", border: 0 }} title={`@${handle} Instagram feed`} />
      </div>
    );
  }

  if (!mock) {
    return (
      <div className="space-y-3">
        <IntegrationNote
          text={`@${handle} isn't connected to a live feed widget yet. Sign up at a service like Behold.so or SnapWidget, connect @${handle} through their Instagram login flow, then send the embed URL to add here — takes a few minutes per account.`}
        />
        <a
          href={`https://www.instagram.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink"
        >
          <AtSign className="h-4 w-4" />
          View @{handle} on Instagram
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <IntegrationNote
        text={`Preview built from @${handle}'s own venue photography — not the real live feed yet. Connect a widget (Behold.so or SnapWidget) and drop the embed URL in to replace this with the real thing.`}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex flex-wrap items-center gap-5 border-b border-border px-5 py-5">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            {mock.avatarInitial}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-ink">@{handle}</p>
              <a
                href={`https://www.instagram.com/${handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
              >
                View profile
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">{mock.bio}</p>
            <div className="mt-2 flex gap-5 text-sm">
              <span className="text-ink"><strong className="font-semibold">{formatCount(mock.posts)}</strong> <span className="text-ink-soft">posts</span></span>
              <span className="text-ink"><strong className="font-semibold">{formatCount(mock.followers)}</strong> <span className="text-ink-soft">followers</span></span>
              <span className="text-ink"><strong className="font-semibold">{formatCount(mock.following)}</strong> <span className="text-ink-soft">following</span></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0.5 bg-border p-0.5">
          {mock.feed.map((post, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden bg-cream-dim">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
              {post.format !== "grid" && (
                <span className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white">
                  {post.format === "reel" ? <Film className="h-3.5 w-3.5" /> : <GalleryHorizontal className="h-3.5 w-3.5" />}
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                <span className="flex items-center gap-1 text-sm font-semibold text-white">
                  <Heart className="h-4 w-4 fill-white" />
                  {formatCount(post.likes)}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-white">
                  <MessageCircle className="h-4 w-4 fill-white" />
                  {formatCount(post.comments)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
