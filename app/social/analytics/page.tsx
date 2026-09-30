"use client";

import { Users, TrendingUp, Heart, Send, Film, GalleryHorizontal, LayoutGrid, Bookmark } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { KpiTile } from "@/components/ui/kpi-tile";
import { ReachChart } from "@/components/social/reach-chart";
import { FollowersChart } from "@/components/social/followers-chart";
import { getInstagramAnalytics } from "@/lib/mock/instagram-analytics";
import { SITE_THEMES } from "@/lib/site-theme";

const FORMAT_ICON = { grid: LayoutGrid, carousel: GalleryHorizontal, reel: Film, story: Bookmark };

export default function AnalyticsPage() {
  const { venue } = useVenue();
  const theme = SITE_THEMES[venue.slug];
  const analytics = getInstagramAnalytics(venue.slug);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Instagram Analytics"
        subtitle={`How @${theme.instagramHandle ?? venue.slug}'s content is performing.`}
      />

      {!analytics ? (
        <IntegrationNote
          text={
            theme.instagramHandle
              ? `No analytics data set up yet for @${theme.instagramHandle}.`
              : `No Instagram account linked for ${venue.name} yet — add one in the Live Instagram tab under Content.`
          }
        />
      ) : (
        <div className="space-y-6">
          <IntegrationNote text="Illustrative data based on this account's typical performance — connect the Meta Graph API (or a widget service that exposes insights) to replace this with real-time analytics." />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile label="Followers" value={analytics.followers.toLocaleString()} icon={Users} accent={venue.accent} trend={`+${analytics.followerGrowth14d} / 14d`} />
            <KpiTile label="Avg. engagement rate" value={analytics.avgEngagementRate} suffix="%" icon={Heart} accent={venue.accent} />
            <KpiTile label="Avg. reach per post" value={analytics.avgReachPerPost.toLocaleString()} icon={TrendingUp} accent={venue.accent} />
            <KpiTile label="Posts this month" value={analytics.postsThisMonth} icon={Send} accent={venue.accent} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-ink">Reach — last 14 days</h2>
              <ReachChart data={analytics.trend} accent={venue.accent} />
            </div>
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-ink">Follower growth — last 14 days</h2>
              <FollowersChart data={analytics.trend} accent={venue.accent} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-ink">Top posts</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {analytics.topPosts.map((post, i) => {
                const FormatIcon = FORMAT_ICON[post.format];
                return (
                  <div key={i} className="overflow-hidden rounded-lg border border-border">
                    <div className="relative aspect-square bg-cream-dim">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.image} alt="" className="h-full w-full object-cover" />
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1 text-white">
                        <FormatIcon className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="space-y-0.5 px-2 py-2 text-xs">
                      <p className="flex items-center gap-1 font-medium text-ink">
                        <Heart className="h-3 w-3" /> {post.likes.toLocaleString()}
                      </p>
                      <p className="text-ink-soft">{post.reach.toLocaleString()} reach</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
