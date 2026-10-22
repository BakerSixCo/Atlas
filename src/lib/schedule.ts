import { reader } from './content';

export const TIMEZONE = 'America/Boise';

export const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAY_ORDER)[number];
export const DAY_NAMES: Record<Day, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export const PROGRAM_LABELS: Record<string, string> = {
  nogi: 'No-Gi', wrestling: 'Wrestling', openmat: 'Open Mat',
  fundamentals: 'Fundamentals', competition: 'Competition', kids: 'Kids',
};
export const LEVEL_LABELS: Record<string, string> = {
  all: 'All levels', beginner: 'Beginner', advanced: 'Intermediate / Advanced',
};

export type ClassItem = {
  slug: string;
  title: string;
  program: string;
  days: Day[];
  start: string;
  end: string;
  level: string;
  instructor: string;
  description: string;
};

export type Session = ClassItem & { day: Day };

export async function getClasses(): Promise<ClassItem[]> {
  const all = await reader.collections.classes.all();
  return all
    .filter((c) => c.entry.active && c.entry.days.length && c.entry.start && c.entry.end)
    .map((c) => ({
      slug: c.slug,
      title: c.entry.title,
      program: c.entry.program,
      days: [...c.entry.days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b)),
      start: c.entry.start,
      end: c.entry.end,
      level: c.entry.level,
      instructor: c.entry.instructor,
      description: c.entry.description,
    }))
    .sort((a, b) => a.start.localeCompare(b.start) || DAY_ORDER.indexOf(a.days[0]) - DAY_ORDER.indexOf(b.days[0]));
}

/** One entry per class per day, grouped by weekday, sorted by start time. */
export function byDay(classes: ClassItem[]): Record<Day, Session[]> {
  const out = Object.fromEntries(DAY_ORDER.map((d) => [d, [] as Session[]])) as Record<Day, Session[]>;
  for (const c of classes) for (const d of c.days) out[d].push({ ...c, day: d });
  for (const d of DAY_ORDER) out[d].sort((a, b) => a.start.localeCompare(b.start));
  return out;
}

/** "18:30" → "6:30 PM" */
export function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "18:30","19:30" → "6:30–7:30 PM"; spans noon → "11:00 AM–12:00 PM" */
export function fmtRange(start: string, end: string): string {
  const s = fmtTime(start), e = fmtTime(end);
  return s.slice(-2) === e.slice(-2) ? `${s.slice(0, -3)}–${e}` : `${s}–${e}`;
}

export function fmtDays(days: Day[]): string {
  const short: Record<Day, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
  return days.map((d) => short[d]).join(' · ');
}

/** Today's date in the gym's timezone, as YYYY-MM-DD. Used at build time only for filtering past closures. */
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}

/** "2026-11-14T10:00" (gym-local, as stored by the CMS) → "2026-11-14T10:00:00-07:00". */
export function withBoiseOffset(local: string): string {
  const base = local.length === 16 ? `${local}:00` : local.slice(0, 19);
  const asUTC = new Date(`${base}Z`);
  const tzName = new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, timeZoneName: 'longOffset' })
    .formatToParts(asUTC).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-07:00';
  const offset = tzName.replace('GMT', '') || '+00:00';
  return `${base}${offset}`;
}
