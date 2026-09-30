// All three venues are in Mount Martha, VIC — Australia/Melbourne. Server
// code (Vercel functions, cron jobs) runs in UTC by default, so a plain
// `new Date()` server-side gives the wrong calendar date for a large part of
// the Australian day: Melbourne is 10-11 hours ahead of UTC, so anytime
// before ~10-11am AEST/AEDT, `new Date()` on the server still thinks it's
// "yesterday". Anything that needs "today" or "this week" for the venues
// must go through here rather than calling `new Date()` directly.
const VENUE_TIMEZONE = "Australia/Melbourne";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * The current date in the venues' own timezone, as a real Date object whose
 * y/m/d fields (read with the getters below) already reflect Melbourne's
 * calendar date -- safe to feed into day-of-week/addDays arithmetic.
 */
export function nowInVenueTimezone(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VENUE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return new Date(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second"))
  );
}

/** Today's date in the venues' own timezone, as yyyy-MM-dd. */
export function todayInVenueTimezone(): string {
  const d = nowInVenueTimezone();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
