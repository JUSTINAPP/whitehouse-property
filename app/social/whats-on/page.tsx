"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ExternalLink, Loader2, Ticket, PencilLine } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { SANITY_CONFIG } from "@/lib/sanity-config";
import { fetchWhatsOn, WhatsOnEvent } from "@/lib/sanity/whats-on";
import { cn } from "@/lib/utils";

function formatEventDate(iso: string | null): string {
  if (!iso) return "Date TBC";
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function EventCard({ event, accent, now }: { event: WhatsOnEvent; accent: string; now: number }) {
  const isPast = event.date ? new Date(event.date).getTime() < now : false;

  return (
    <div
      className={cn(
        "flex gap-4 rounded-xl border border-border bg-white p-4 shadow-sm",
        isPast && "opacity-60"
      )}
    >
      {event.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${event.imageUrl}?w=240&h=240&fit=crop`} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-cream-dim">
          <CalendarDays className="h-6 w-6 text-ink-soft" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">{event.title}</h3>
          {!event.published && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Draft</span>
          )}
          {isPast && <span className="rounded-full bg-cream-dim px-2 py-0.5 text-[10px] font-medium text-ink-soft">Past</span>}
        </div>
        <p className="mt-0.5 text-xs font-medium" style={{ color: accent }}>
          {formatEventDate(event.date)}
          {event.price ? ` · ${event.price}` : ""}
        </p>
        {event.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-soft">{event.description}</p>
        )}
        {event.bookingLink && (
          <a
            href={event.bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
            style={{ color: accent }}
          >
            <Ticket className="h-3 w-3" />
            {event.bookingsRequired ? "Booking link" : "More info"}
          </a>
        )}
      </div>
    </div>
  );
}

export default function WhatsOnPage() {
  const { venue } = useVenue();
  const config = SANITY_CONFIG[venue.slug];
  const [events, setEvents] = useState<WhatsOnEvent[] | null>(null);
  const [loading, setLoading] = useState(Boolean(config));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting for the new venue before the fetch resolves is intentional here
    setLoading(true);
    setFailed(false);
    fetchWhatsOn(venue.slug).then((result) => {
      if (cancelled) return;
      if (result === null) {
        setFailed(true);
      } else {
        setEvents(result);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [venue.slug, config]);

  const [now] = useState(() => Date.now());
  const upcoming = (events ?? []).filter((e) => !e.date || new Date(e.date).getTime() >= now);
  const past = (events ?? []).filter((e) => e.date && new Date(e.date).getTime() < now);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:px-10">
      <PageHeader
        title="What's On"
        subtitle={`Live from ${venue.name}'s own website — the same events guests see on the "What's On" page.`}
        action={
          config && (
            <a
              href={config.studioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: venue.accent }}
            >
              <PencilLine className="h-4 w-4" />
              Edit in Sanity Studio
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )
        }
      />

      {!config ? (
        <IntegrationNote
          text={`No live website or Sanity project set up yet for ${venue.name}, so there's no "What's On" content to pull in.`}
        />
      ) : loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading events from {venue.name}&rsquo;s site...
        </div>
      ) : failed ? (
        <IntegrationNote text={`Couldn't reach ${venue.name}'s Sanity project just now — try refreshing.`} />
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              Upcoming ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-ink-soft">No upcoming events published right now.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((e) => (
                  <EventCard key={e.id} event={e} accent={venue.accent} now={now} />
                ))}
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">Past ({past.length})</h2>
              <div className="space-y-3">
                {past.map((e) => (
                  <EventCard key={e.id} event={e} accent={venue.accent} now={now} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
