function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day; // week starts Monday
  return addDays(copy, diff);
}

export function getCurrentWeekDates(): string[] {
  const monday = startOfWeek(today());
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(monday, i)));
}

export function daysAgoISO(days: number): string {
  return toISODate(addDays(today(), -days));
}

export function daysFromNowISO(days: number): string {
  return toISODate(addDays(today(), days));
}

export const TODAY_ISO = toISODate(today());

export function getMonthGrid(reference: Date): { date: string; inMonth: boolean }[][] {
  const month = reference.getMonth();
  const firstOfMonth = new Date(reference.getFullYear(), month, 1);
  const gridStart = startOfWeek(firstOfMonth);

  const weeks: { date: string; inMonth: boolean }[][] = [];
  let cursor = gridStart;
  for (let w = 0; w < 6; w++) {
    const week: { date: string; inMonth: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({ date: toISODate(cursor), inMonth: cursor.getMonth() === month });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}
