/**
 * Calendar days as `yyyy-MM-dd` keys — the API's Algiers days. The arithmetic
 * runs on UTC dates so no browser time zone or DST change can shift a day.
 * Weeks start on Sunday, as on the app's other calendars.
 */

const pad = (n: number) => String(n).padStart(2, '0');

const toDate = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y ?? 2000, (m ?? 1) - 1, d ?? 1));
};

const toKey = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

/** Today in Algiers — the day the server's `date` fields speak of. */
export function algiersToday(): string {
  // en-CA formats as yyyy-MM-dd.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers' }).format(new Date());
}

export const isDayKey = (value: string | null): value is string =>
  !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toDate(value).getTime());

export const addDays = (key: string, n: number) => {
  const date = toDate(key);
  date.setUTCDate(date.getUTCDate() + n);
  return toKey(date);
};

/** The first day of the month `n` months away (0: this month). */
export const monthStart = (key: string, n = 0) => {
  const date = toDate(key);
  return toKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1)));
};

export const monthEnd = (key: string) => addDays(monthStart(key, 1), -1);

/** 0 = Sunday. */
export const weekdayOf = (key: string) => toDate(key).getUTCDay();

export const weekStart = (key: string) => addDays(key, -weekdayOf(key));

export const partsOf = (key: string) => {
  const date = toDate(key);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDate() };
};

/** `n` consecutive days from `from`. */
export const daysFrom = (from: string, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i));

/** « 06:00 » → minutes since midnight; null when not a time. */
export function minutesOf(label: string | null | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(label?.trim() ?? '');
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
