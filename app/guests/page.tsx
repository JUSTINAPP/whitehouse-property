"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { GuestTable, GuestSortKey, SortDir } from "@/components/guests/guest-table";
import { GuestProfileDrawer } from "@/components/guests/guest-profile-drawer";
import { getGuests } from "@/lib/mock/guests";
import { SEVENROOMS_VENUE_ID } from "@/lib/sevenrooms/venue-mapping";
import { fetchCrmGuests } from "@/lib/crm/guests";
import { fetchGuestInsights, GuestInsightsResult } from "@/lib/insights/guest-insights";
import { Guest, GuestTag } from "@/lib/types";
import { cn } from "@/lib/utils";

const ALL_TAGS: GuestTag[] = [
  "VIP", "Regular", "Vegetarian", "Vegan", "Gluten-Free", "Nut Allergy", "Shellfish Allergy", "Birthday Club", "Wine Club", "Corporate",
];

type QuickFilter = "all" | "top-spenders" | "lapsed";

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: "all", label: "All guests" },
  { value: "top-spenders", label: "Top spenders" },
  { value: "lapsed", label: "Lapsed regulars" },
];

// A "lapsed regular" is someone who's been in more than once (so this isn't
// just a one-time diner) but hasn't been back in a while -- the standard
// win-back segment in restaurant CRM practice, and arguably more actionable
// day-to-day than a VIP list.
const LAPSED_MIN_VISITS = 2;
const LAPSED_MIN_DAYS = 60;

function daysSince(dateStr: string): number | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((now.getTime() - d.getTime()) / 86400000);
}

export default function GuestsPage() {
  const { venue } = useVenue();
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<GuestTag[]>([]);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sortKey, setSortKey] = useState<GuestSortKey>("visits");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const isLive = Boolean(SEVENROOMS_VENUE_ID[venue.slug]);
  const [liveGuests, setLiveGuests] = useState<Guest[] | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isLive);
  const [insights, setInsights] = useState<GuestInsightsResult | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting for the new venue before the fetch resolves is intentional here
    setLoading(true);
    setLiveError(null);
    fetchCrmGuests(venue.slug).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setLiveGuests(res.guests);
      } else {
        setLiveError(res.message);
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
    fetchGuestInsights(venue.slug).then((res) => {
      setInsights(res);
      setInsightsLoading(false);
    });
  };

  const guests = useMemo(
    () => (isLive && liveGuests ? liveGuests : isLive ? [] : getGuests(venue.slug)),
    [isLive, liveGuests, venue.slug]
  );
  const presentTags = useMemo(() => ALL_TAGS.filter((t) => guests.some((g) => g.tags.includes(t))), [guests]);

  const filtered = guests.filter((g) => {
    const matchesQuery =
      query.trim() === "" ||
      g.name.toLowerCase().includes(query.toLowerCase()) ||
      g.email.toLowerCase().includes(query.toLowerCase());
    const matchesTags = activeTags.length === 0 || activeTags.every((t) => g.tags.includes(t));
    const matchesQuickFilter =
      quickFilter !== "lapsed" ||
      (g.visitCount >= LAPSED_MIN_VISITS && (daysSince(g.lastVisit) ?? -1) >= LAPSED_MIN_DAYS);
    return matchesQuery && matchesTags && matchesQuickFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "visits") cmp = a.visitCount - b.visitCount;
    else if (sortKey === "spend") cmp = a.totalSpend - b.totalSpend;
    else if (sortKey === "lastVisit") cmp = (a.lastVisit || "").localeCompare(b.lastVisit || "");
    return sortDir === "asc" ? cmp : -cmp;
  });

  function toggleTag(tag: GuestTag) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function handleQuickFilter(qf: QuickFilter) {
    setQuickFilter(qf);
    if (qf === "top-spenders") {
      setSortKey("spend");
      setSortDir("desc");
    } else if (qf === "lapsed") {
      setSortKey("lastVisit");
      setSortDir("asc");
    } else {
      setSortKey("visits");
      setSortDir("desc");
    }
  }

  function handleSort(key: GuestSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Guest CRM"
        subtitle={
          isLive
            ? `${guests.length} guests on file for ${venue.name} — spend tracking isn't available for this venue's POS yet, and tags reflect VIP status only, not dietary/loyalty categories.`
            : `${guests.length} guests on file for ${venue.name}.`
        }
      />

      {!isLive && (
        <div className="mb-5">
          <IntegrationNote text="SevenRooms integration coming to this venue — data will sync automatically once its venue is connected." />
        </div>
      )}

      {isLive && liveError && (
        <div className="mb-5">
          <IntegrationNote text={liveError} />
        </div>
      )}

      {isLive && loading && (
        <div className="flex items-center gap-2 py-12 text-sm text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading guests...
        </div>
      )}

      {(!isLive || (!loading && !liveError)) && (
      <>
      <div className="mb-5 space-y-3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-gold"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1 w-fit">
          {QUICK_FILTERS.map((qf) => (
            <button
              key={qf.value}
              onClick={() => handleQuickFilter(qf.value)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm font-medium transition",
                quickFilter === qf.value ? "bg-navy text-white" : "text-ink-soft hover:text-ink"
              )}
            >
              {qf.label}
            </button>
          ))}
        </div>

        {quickFilter === "lapsed" && (
          <p className="text-xs text-ink-soft">
            Guests with {LAPSED_MIN_VISITS}+ visits who haven&apos;t been back in {LAPSED_MIN_DAYS}+ days — a win-back
            list, sorted longest-gone first.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {presentTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                activeTags.includes(tag)
                  ? "border-transparent text-white"
                  : "border-border bg-white text-ink-soft hover:border-ink-soft"
              )}
              style={activeTags.includes(tag) ? { backgroundColor: venue.accent } : undefined}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {isLive && (
        <div className="mb-5 rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `color-mix(in srgb, ${venue.accent} 14%, transparent)` }}
              >
                <Sparkles className="h-4 w-4" style={{ color: venue.accent }} />
              </span>
              <h3 className="text-sm font-semibold text-ink">Guest insights</h3>
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
              Reads the full guest list and surfaces spend concentration, the win-back segment&apos;s dollar value, an
              allergy/highlight roll-up, and regulars whose visit rhythm has slowed.
            </p>
          )}

          {insightsLoading && (
            <div className="flex items-center gap-2 py-4 text-sm text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              Reading the guest list...
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

      <GuestTable
        guests={sorted}
        onSelect={setSelectedGuest}
        accent={venue.accent}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
      />

      <GuestProfileDrawer
        guest={selectedGuest}
        onClose={() => setSelectedGuest(null)}
        accent={venue.accent}
        onNoteSaved={(guestId, staffNotes) => {
          setLiveGuests((prev) => prev?.map((g) => (g.id === guestId ? { ...g, staffNotes } : g)) ?? prev);
          setSelectedGuest((prev) => (prev && prev.id === guestId ? { ...prev, staffNotes } : prev));
        }}
        onHighlightsSaved={(guestId, highlights) => {
          setLiveGuests((prev) => prev?.map((g) => (g.id === guestId ? { ...g, highlights } : g)) ?? prev);
          setSelectedGuest((prev) => (prev && prev.id === guestId ? { ...prev, highlights } : prev));
        }}
      />
      </>
      )}
    </div>
  );
}
