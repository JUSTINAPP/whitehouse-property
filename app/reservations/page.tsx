"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { ReservationTimeline } from "@/components/reservations/reservation-timeline";
import { ReservationTableView } from "@/components/reservations/reservation-table-view";
import { CoversChart } from "@/components/overview/covers-chart";
import { getReservationsToday, getWeekCovers, DayCovers } from "@/lib/mock/reservations";
import { SEVENROOMS_VENUE_ID } from "@/lib/sevenrooms/venue-mapping";
import { fetchLiveReservations } from "@/lib/sevenrooms/reservations";
import { fetchLiveWeekCovers } from "@/lib/sevenrooms/week-covers";
import { fetchLastYearCovers } from "@/lib/crm/last-year-covers";
import { Reservation, ReservationStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { TODAY_ISO } from "@/lib/mock/dates";

type FilterTab = "all" | ReservationStatus;

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

export default function ReservationsPage() {
  const { venue } = useVenue();
  const [tab, setTab] = useState<FilterTab>("all");
  const [view, setView] = useState<"time" | "table">("time");
  const isLive = Boolean(SEVENROOMS_VENUE_ID[venue.slug]);
  // Which day the list/KPIs below are showing -- defaults to today, but
  // clicking a bar in the weekly chart jumps to that day instead (live
  // venues only; mock data only ever has "today" to show).
  const [selectedDate, setSelectedDate] = useState(TODAY_ISO);
  const [liveReservations, setLiveReservations] = useState<Reservation[] | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isLive);
  const [liveWeekCovers, setLiveWeekCovers] = useState<DayCovers[] | null>(null);
  const [weekCoversError, setWeekCoversError] = useState<string | null>(null);
  const [lastYearCovers, setLastYearCovers] = useState<DayCovers[] | null>(null);

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting before the fetch resolves is intentional here
    setLoading(true);
    setLiveError(null);
    fetchLiveReservations(venue.slug, selectedDate).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setLiveReservations(res.reservations);
      } else {
        setLiveError(res.message);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [venue.slug, isLive, selectedDate]);

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting before the fetch resolves is intentional here
    setWeekCoversError(null);
    fetchLiveWeekCovers(venue.slug).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setLiveWeekCovers(res.weekCovers);
      } else {
        setWeekCoversError(res.message);
      }
    });
    fetchLastYearCovers(venue.slug).then((res) => {
      if (cancelled) return;
      if (res.ok) setLastYearCovers(res.weekCovers);
      // Silently ignore failure -- the comparison overlay is a bonus, not
      // worth showing an error banner over if the ledger has no data yet
      // for a venue that's only just started syncing.
    });
    return () => {
      cancelled = true;
    };
  }, [venue.slug, isLive]);

  // Switching venues should reset back to today rather than keep whatever
  // day was selected for the previous venue.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the selected day when the venue changes is intentional
    setSelectedDate(TODAY_ISO);
  }, [venue.slug]);

  const weekCovers = isLive && liveWeekCovers ? liveWeekCovers : isLive ? [] : getWeekCovers(venue.slug);
  const hasCompare = isLive && lastYearCovers && lastYearCovers.some((d) => d.covers > 0);
  const thisWeekTotal = weekCovers.reduce((sum, d) => sum + d.covers, 0);
  const lastYearTotal = lastYearCovers?.reduce((sum, d) => sum + d.covers, 0) ?? 0;
  const yoyChangePct = hasCompare && lastYearTotal > 0 ? Math.round(((thisWeekTotal - lastYearTotal) / lastYearTotal) * 100) : null;

  const reservations = isLive && liveReservations ? liveReservations : isLive ? [] : getReservationsToday(venue.slug);
  const isToday = selectedDate === TODAY_ISO;
  // "All" means "everything relevant to running the floor today" -- a
  // cancelled booking sitting inline just adds noise to the view meant to
  // show real volume at a glance. Cancelled reservations are still fully
  // visible, just one click away on their own tab.
  const filtered =
    tab === "all" ? reservations.filter((r) => r.status !== "cancelled") : reservations.filter((r) => r.status === tab);

  const totalCoversToday = reservations
    .filter((r) => r.status !== "cancelled")
    .reduce((sum, r) => sum + r.partySize, 0);
  const confirmedCount = reservations.filter((r) => r.status === "confirmed").length;
  const pendingCount = reservations.filter((r) => r.status === "pending").length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Reservations"
        subtitle={`${isToday ? "Today, " : ""}${formatDate(selectedDate)} at ${venue.name}.`}
      />

      {!isLive && (
        <div className="mb-5">
          <IntegrationNote text="SevenRooms integration coming to this venue — reservations will sync automatically once its venue is connected." />
        </div>
      )}

      {isLive && liveError && (
        <div className="mb-5">
          <IntegrationNote text={liveError} />
        </div>
      )}

      {isLive && loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading reservations from SevenRooms...
        </div>
      ) : (
        <>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xl font-semibold text-ink">{reservations.length}</p>
          <p className="text-xs text-ink-soft">Total reservations</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xl font-semibold text-ink">{totalCoversToday}</p>
          <p className="text-xs text-ink-soft">Covers {isToday ? "today" : ""}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xl font-semibold text-ink">{confirmedCount}</p>
          <p className="text-xs text-ink-soft">Confirmed</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <p className="text-xl font-semibold text-ink">{pendingCount}</p>
          <p className="text-xs text-ink-soft">Pending</p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ink">This week&apos;s covers</h2>
            {yoyChangePct !== null && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  yoyChangePct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}
              >
                {yoyChangePct >= 0 ? "+" : ""}
                {yoyChangePct}% vs last year
              </span>
            )}
          </div>
          {isLive && <p className="text-xs text-ink-soft">Click a day to see its reservations</p>}
        </div>
        {isLive && weekCoversError && <p className="mb-3 text-xs text-ink-soft">{weekCoversError}</p>}
        <CoversChart
          data={weekCovers}
          accent={venue.accent}
          selectedDate={isLive ? selectedDate : undefined}
          onSelectDate={isLive ? setSelectedDate : undefined}
          compareData={hasCompare ? lastYearCovers! : undefined}
        />
        {isLive && !hasCompare && (
          <p className="mt-3 text-xs text-ink-soft">
            No data from this week last year yet — the guest visit ledger only started syncing recently, so year-over-year
            comparisons will fill in as more history is captured.
          </p>
        )}
      </div>

      {!isToday && (
        <div className="mb-4">
          <button
            onClick={() => setSelectedDate(TODAY_ISO)}
            className="text-xs font-medium underline decoration-dotted underline-offset-2"
            style={{ color: venue.accent }}
          >
            ← Back to today
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition",
                tab === t.value ? "bg-navy text-white" : "text-ink-soft hover:text-ink"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1 w-fit">
          {[
            { value: "time" as const, label: "By time" },
            { value: "table" as const, label: "By table" },
          ].map((v) => (
            <button
              key={v.value}
              onClick={() => setView(v.value)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition",
                view === v.value ? "bg-navy text-white" : "text-ink-soft hover:text-ink"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "time" ? (
        <ReservationTimeline reservations={filtered} />
      ) : (
        <ReservationTableView reservations={filtered} />
      )}
        </>
      )}
    </div>
  );
}
