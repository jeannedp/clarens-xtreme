/**
 * The venue is a single site in South Africa (SAST, UTC+2, no DST). Ride "days"
 * and "today" are reckoned in site-local time, not UTC or the viewer's browser
 * time. When multi-site support arrives this becomes per-reader config.
 */
export const SITE_UTC_OFFSET_HOURS = 2;

const MS_PER_HOUR = 3_600_000;

/** UTC instant for 00:00 site-local on the given site-local calendar day (`YYYY-MM-DD`). */
export function siteDayStartUtc(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - SITE_UTC_OFFSET_HOURS * MS_PER_HOUR);
}

/** UTC instant for the end of the given site-local calendar day (23:59:59.999). */
export function siteDayEndUtc(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999) - SITE_UTC_OFFSET_HOURS * MS_PER_HOUR);
}

/** The site-local calendar day (`YYYY-MM-DD`) that a UTC instant falls on. */
export function siteDayOf(instant: Date | string): string {
  const t = typeof instant === "string" ? new Date(instant) : instant;
  const shifted = new Date(t.getTime() + SITE_UTC_OFFSET_HOURS * MS_PER_HOUR);
  return shifted.toISOString().slice(0, 10);
}

/** Site-local wall-clock time (`HH:MM`) of a UTC instant. */
export function siteClockOf(instant: Date | string): string {
  const t = typeof instant === "string" ? new Date(instant) : instant;
  const shifted = new Date(t.getTime() + SITE_UTC_OFFSET_HOURS * MS_PER_HOUR);
  return shifted.toISOString().slice(11, 16);
}

/** Today's site-local calendar day (`YYYY-MM-DD`). */
export function siteToday(now: Date = new Date()): string {
  return siteDayOf(now);
}
