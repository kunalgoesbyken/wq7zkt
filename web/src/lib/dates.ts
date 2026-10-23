export const calendarTimeZone = "UTC";

const hourInMs = 3_600_000;

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromIsoDate(isoDate: string): Date {
  return new Date(isoDate);
}

export function isWithin(date: Date, start: string, end: string): boolean {
  const isoDate = toIsoDate(date);
  return isoDate >= start && isoDate <= end;
}

export function addDays(isoDate: string, days: number): string {
  const date = fromIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

export function addHours(isoDateTime: string, hours: number): string {
  return new Date(Date.parse(isoDateTime) + hours * hourInMs).toISOString();
}

export function hoursBetween(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / hourInMs;
}
