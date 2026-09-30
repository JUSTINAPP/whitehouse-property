"use client";

import { FunctionBooking } from "@/lib/types";
import { FUNCTION_STATUS_COLORS } from "@/lib/function-status-meta";
import { getMonthGrid, TODAY_ISO } from "@/lib/mock/dates";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function FunctionsMonthView({
  reference,
  bookings,
  onDayClick,
  onBookingClick,
}: {
  reference: Date;
  bookings: FunctionBooking[];
  onDayClick: (date: string) => void;
  onBookingClick: (booking: FunctionBooking) => void;
}) {
  const weeks = getMonthGrid(reference);

  function bookingsFor(date: string): FunctionBooking[] {
    return bookings.filter((b) => b.eventDate === date && b.status !== "cancelled");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="border-l border-border px-3 py-2 text-center text-xs font-medium text-ink-soft first:border-l-0">
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
          {week.map(({ date, inMonth }) => {
            const dayBookings = bookingsFor(date);
            const visible = dayBookings.slice(0, 3);
            const overflow = dayBookings.length - visible.length;
            const dayNum = parseInt(date.split("-")[2], 10);
            return (
              <button
                key={date}
                onClick={() => onDayClick(date)}
                className={cn(
                  "flex min-h-[104px] flex-col gap-1 border-l border-border p-2 text-left align-top transition first:border-l-0 hover:bg-cream-dim/50",
                  !inMonth && "bg-cream-dim/30"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    date === TODAY_ISO ? "bg-gold text-white" : inMonth ? "text-ink" : "text-ink-soft/50"
                  )}
                >
                  {dayNum}
                </span>
                <div className="space-y-1">
                  {visible.map((booking) => {
                    const colors = FUNCTION_STATUS_COLORS[booking.status];
                    return (
                      <div
                        key={booking.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookingClick(booking);
                        }}
                        className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: colors.bg, color: colors.text, borderLeft: `2px solid ${colors.dot}` }}
                      >
                        {booking.clientName} · {booking.guestCount}
                      </div>
                    );
                  })}
                  {overflow > 0 && <p className="px-1.5 text-[10px] text-ink-soft">+{overflow} more</p>}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
