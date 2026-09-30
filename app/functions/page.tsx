"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PartyPopper, DollarSign, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import { useVenue } from "@/context/venue-context";
import { PageHeader } from "@/components/ui/page-header";
import { IntegrationNote } from "@/components/ui/integration-note";
import { Badge } from "@/components/ui/badge";
import { KpiTile } from "@/components/ui/kpi-tile";
import { FunctionsMonthView } from "@/components/functions/functions-month-view";
import { FunctionModal, FunctionDraft } from "@/components/functions/function-modal";
import { FUNCTION_STATUS_BADGE, FUNCTION_STATUS_COLORS, FUNCTION_STATUS_LABELS } from "@/lib/function-status-meta";
import { getFunctionBookings, getFunctionSpaces, getUpcomingFunctionBookings } from "@/lib/mock/function-bookings";
import { FunctionBooking, FunctionStatus, VenueSlug } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";
import { TODAY_ISO } from "@/lib/mock/dates";

export default function FunctionsPage() {
  const { venue } = useVenue();
  const [bookingsByVenue, setBookingsByVenue] = useState<Record<VenueSlug, FunctionBooking[]>>(() => ({
    "beach-road": [...getFunctionBookings("beach-road")],
    barrys: [...getFunctionBookings("barrys")],
    tilbury: [...getFunctionBookings("tilbury")],
    vicar: [...getFunctionBookings("vicar")],
  }));
  const [reference, setReference] = useState(() => new Date(TODAY_ISO));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FunctionBooking | null>(null);
  const [newDate, setNewDate] = useState<string | null>(null);

  const bookings = bookingsByVenue[venue.slug];
  const spaces = getFunctionSpaces(venue.slug);
  const upcoming = getUpcomingFunctionBookings(venue.slug, 6);

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(reference),
    [reference]
  );

  const monthPrefix = `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthBookings = bookings.filter((b) => b.eventDate.startsWith(monthPrefix));
  const confirmedThisMonth = thisMonthBookings.filter((b) => b.status === "confirmed");
  const pipelineThisMonth = thisMonthBookings.filter((b) => b.status === "tentative" || b.status === "enquiry");
  const confirmedRevenue = confirmedThisMonth.reduce((s, b) => s + b.totalValue, 0);
  const pipelineValue = pipelineThisMonth.reduce((s, b) => s + b.totalValue, 0);
  const avgGuestCount = thisMonthBookings.length > 0 ? Math.round(thisMonthBookings.reduce((s, b) => s + b.guestCount, 0) / thisMonthBookings.length) : 0;

  function openCreate(date: string) {
    setEditing(null);
    setNewDate(date);
    setModalOpen(true);
  }

  function openEdit(booking: FunctionBooking) {
    setEditing(booking);
    setNewDate(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setNewDate(null);
  }

  function handleSave(draft: FunctionDraft) {
    setBookingsByVenue((prev) => {
      const current = prev[venue.slug];
      const totalValue = draft.guestCount * draft.avgSpendPerHead;
      if (editing) {
        return {
          ...prev,
          [venue.slug]: current.map((b) => (b.id === editing.id ? { ...b, ...draft, totalValue } : b)),
        };
      }
      const newBooking: FunctionBooking = {
        id: `${venue.slug}-fn-${Date.now()}`,
        venueId: venue.slug,
        totalValue,
        ...draft,
      };
      return { ...prev, [venue.slug]: [...current, newBooking] };
    });
    closeModal();
  }

  function handleDelete() {
    if (!editing) return;
    setBookingsByVenue((prev) => ({
      ...prev,
      [venue.slug]: prev[venue.slug].filter((b) => b.id !== editing.id),
    }));
    closeModal();
  }

  const modalInitial = editing ?? { eventDate: newDate ?? TODAY_ISO };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <PageHeader
        title="Functions & Private Events"
        subtitle={`${venue.name}'s private function calendar — separate from table reservations.`}
        action={
          <Link
            href="/functions/analytics"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink"
          >
            Seasonality & channel analytics <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="mb-5">
        <IntegrationNote text="This calendar is sample data, not yet live -- SevenRooms doesn't expose a working private-events/functions API endpoint for this dashboard to connect to, so everything below (bookings, revenue, pipeline) is illustrative until a real data source is found." />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Confirmed this month" value={confirmedThisMonth.length} icon={PartyPopper} accent={venue.accent} />
        <KpiTile label="Confirmed revenue" value={`$${confirmedRevenue.toLocaleString()}`} icon={DollarSign} accent={venue.accent} />
        <KpiTile label="Pipeline value" value={`$${pipelineValue.toLocaleString()}`} icon={TrendingUp} accent={venue.accent} trend={`${pipelineThisMonth.length} in progress`} />
        <KpiTile label="Avg guest count" value={avgGuestCount} icon={Users} accent={venue.accent} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReference(new Date(reference.getFullYear(), reference.getMonth() - 1, 1))}
            className="rounded-lg border border-border bg-white p-1.5 text-ink-soft hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="w-40 text-sm font-semibold text-ink">{monthLabel}</h2>
          <button
            onClick={() => setReference(new Date(reference.getFullYear(), reference.getMonth() + 1, 1))}
            className="rounded-lg border border-border bg-white p-1.5 text-ink-soft hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {(["confirmed", "tentative", "enquiry"] as FunctionStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-xs text-ink-soft">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FUNCTION_STATUS_COLORS[s].dot }} />
              {FUNCTION_STATUS_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      <FunctionsMonthView reference={reference} bookings={bookings} onDayClick={openCreate} onBookingClick={openEdit} />

      <div className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-ink">Upcoming functions</h2>
        <div className="space-y-3">
          {upcoming.map((b) => (
            <button
              key={b.id}
              onClick={() => openEdit(b)}
              className="flex w-full items-center gap-4 rounded-lg border border-border/70 p-3 text-left transition hover:bg-cream-dim/40"
            >
              <div className="w-20 shrink-0">
                <p className="text-sm font-semibold text-ink">{formatDate(b.eventDate)}</p>
                <p className="text-xs text-ink-soft">{formatTime(b.startTime)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{b.clientName} &middot; {b.eventType}</p>
                <p className="mt-0.5 truncate text-xs text-ink-soft">{b.space} &middot; {b.guestCount} guests &middot; ${b.totalValue.toLocaleString()}</p>
              </div>
              <Badge variant={FUNCTION_STATUS_BADGE[b.status]}>{FUNCTION_STATUS_LABELS[b.status]}</Badge>
            </button>
          ))}
          {upcoming.length === 0 && <p className="py-6 text-center text-sm text-ink-soft">No upcoming functions booked.</p>}
        </div>
      </div>

      <FunctionModal
        key={editing?.id ?? `new-${newDate}`}
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
        initial={modalInitial}
        accent={venue.accent}
        spaces={spaces}
      />
    </div>
  );
}
