"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, UtensilsCrossed, Send, Heart, ArrowUpRight, Loader2, Sparkles } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { KpiTile } from "@/components/ui/kpi-tile";
import { IntegrationNote } from "@/components/ui/integration-note";
import { getOverviewKpis } from "@/lib/mock/kpis";
import { getWeekCovers, getReservationsToday, DayCovers } from "@/lib/mock/reservations";
import { getSocialPosts, CHANNEL_COLORS, CHANNEL_LABELS } from "@/lib/mock/social-posts";
import { SEVENROOMS_VENUE_ID } from "@/lib/sevenrooms/venue-mapping";
import { fetchLiveReservations } from "@/lib/sevenrooms/reservations";
import { fetchLiveWeekCovers } from "@/lib/sevenrooms/week-covers";
import { fetchOverviewInsights, OverviewInsightsResult } from "@/lib/insights/overview-insights";
import { CoversChart } from "@/components/overview/covers-chart";
import { Badge } from "@/components/ui/badge";
import { Reservation } from "@/lib/types";
import { formatTime } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function OverviewPage() {
  const { venue } = useVenue();
  const isLive = Boolean(SEVENROOMS_VENUE_ID[venue.slug]);
  const [liveReservations, setLiveReservations] = useState<Reservation[] | null>(null);
  const [liveWeekCovers, setLiveWeekCovers] = useState<DayCovers[] | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isLive);
  const [insights, setInsights] = useState<OverviewInsightsResult | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting for the new venue before the fetch resolves is intentional here
    setLoading(true);
    setLiveError(null);
    Promise.all([fetchLiveReservations(venue.slug), fetchLiveWeekCovers(venue.slug)]).then(([resResult, coversResult]) => {
      if (cancelled) return;
      if (resResult.ok) {
        setLiveReservations(resResult.reservations);
      } else {
        setLiveError(resResult.message);
      }
      if (coversResult.ok) {
        setLiveWeekCovers(coversResult.weekCovers);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [venue.slug, isLive]);

  // Switching venues should clear any insights generated for the previous
  // one, rather than showing a stale briefing under the new venue's name.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting when the venue changes is intentional
    setInsights(null);
  }, [venue.slug]);

  const handleGetInsights = () => {
    setInsightsLoading(true);
    fetchOverviewInsights(venue.slug).then((res) => {
      setInsights(res);
      setInsightsLoading(false);
    });
  };

  const mockKpis = getOverviewKpis(venue.slug);
  const reservationsToday = isLive && liveReservations ? liveReservations : isLive ? [] : getReservationsToday(venue.slug);
  const weekCovers = isLive && liveWeekCovers ? liveWeekCovers : isLive ? [] : getWeekCovers(venue.slug);
  const coversThisWeek = isLive ? weekCovers.reduce((sum, d) => sum + d.covers, 0) : mockKpis.coversThisWeek;
  const reservationsTodayCount = isLive
    ? reservationsToday.filter((r) => r.status !== "cancelled").length
    : mockKpis.reservationsToday;
  const todaysReservations = reservationsToday.slice(0, 5);
  // Social posts scheduled + last post engagement aren't wired to a live
  // source yet -- Instagram/Meta integration is a separate, not-yet-started
  // stage -- so these two KPIs stay on mock data even for a live-connected
  // venue.
  const upcomingPosts = getSocialPosts(venue.slug)
    .filter((p) => p.status === "scheduled")
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <div className="mb-8">
        <p className="text-sm font-medium" style={{ color: venue.accent }}>
          {venue.type}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          {getGreeting()}, {venue.name}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">Here&apos;s what&apos;s happening across your venue today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Reservations today"
          value={reservationsTodayCount}
          icon={CalendarCheck}
          accent={venue.accent}
        />
        <KpiTile
          label="Covers this week"
          value={coversThisWeek.toLocaleString()}
          icon={UtensilsCrossed}
          accent={venue.accent}
        />
        <KpiTile
          label="Social posts scheduled"
          value={mockKpis.socialPostsScheduled}
          icon={Send}
          accent={venue.accent}
        />
        <KpiTile
          label="Last post engagement"
          value={mockKpis.lastPostEngagementRate}
          suffix="%"
          icon={Heart}
          accent={venue.accent}
        />
      </div>

      {isLive && (
        <div className="mt-6 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
              >
                <Sparkles className="h-4 w-4" style={{ color: venue.accent }} />
              </span>
              <h3 className="text-sm font-semibold text-ink">Today&apos;s insights</h3>
            </div>
            <button
              onClick={handleGetInsights}
              disabled={insightsLoading}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: venue.accent }}
            >
              {insightsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {insights?.ok ? "Regenerate insights" : "Get AI insights"}
            </button>
          </div>

          {!insights && !insightsLoading && (
            <p className="text-sm text-ink-soft">
              A quick morning briefing — how today compares to this week last year, which VIP guests are booked in, and
              any allergies, occasions or service notes staff should know before service.
            </p>
          )}

          {insightsLoading && (
            <div className="flex items-center gap-2 py-4 text-sm text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              Reading today&apos;s reservations and guest notes...
            </div>
          )}

          {insights && !insights.ok && <IntegrationNote text={insights.message} />}

          {insights?.ok && (
            <div>
              <p className="mb-4 text-sm leading-relaxed text-ink">{insights.data.summary}</p>
              {insights.data.watchItems.length > 0 && (
                <div className="space-y-2.5">
                  {insights.data.watchItems.map((item, i) => (
                    <div key={i} className="rounded-lg bg-cream-dim px-3.5 py-3">
                      <p className="text-sm font-medium text-ink">{item.title}</p>
                      <p className="mt-0.5 text-sm text-ink-soft">{item.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Covers this week</h2>
            <Link
              href="/reservations"
              className="flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
            >
              View reservations <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {isLive && liveError && <IntegrationNote text={liveError} />}
          {isLive && loading ? (
            <div className="flex items-center gap-2 py-16 text-sm text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading from SevenRooms...
            </div>
          ) : (
            <CoversChart data={weekCovers} accent={venue.accent} />
          )}
        </div>

        <div className="rounded-xl border border-border bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Upcoming posts</h2>
            <Link
              href="/social"
              className="flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
            >
              View calendar <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingPosts.map((post) => {
              const colors = CHANNEL_COLORS[post.channel];
              return (
                <div key={post.id} className="flex items-start gap-3 rounded-lg border border-border/70 p-3">
                  <span
                    className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: colors.dot }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{post.title}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {CHANNEL_LABELS[post.channel]} &middot; {formatTime(post.scheduledTime)}
                    </p>
                  </div>
                </div>
              );
            })}
            {upcomingPosts.length === 0 && (
              <p className="py-6 text-center text-sm text-ink-soft">No posts scheduled yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Today&apos;s reservations</h2>
          <Link
            href="/reservations"
            className="flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        {isLive && loading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading today&apos;s reservations from SevenRooms...
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-soft">
                <th className="pb-2 pr-4 font-medium">Time</th>
                <th className="pb-2 pr-4 font-medium">Guest</th>
                <th className="pb-2 pr-4 font-medium">Party</th>
                <th className="pb-2 pr-4 font-medium">Table</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {todaysReservations.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-4 text-ink">{formatTime(r.reservationTime)}</td>
                  <td className="py-2.5 pr-4 text-ink">{r.guestName}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{r.partySize}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{r.tableNumber}</td>
                  <td className="py-2.5">
                    <Badge
                      variant={
                        r.status === "confirmed" ? "confirmed" : r.status === "pending" ? "pending" : "cancelled"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
