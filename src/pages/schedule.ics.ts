import type { APIRoute } from 'astro';
import { getSettings, getScheduleNotes } from '../lib/content';
import { getClasses, TIMEZONE, type Day } from '../lib/schedule';

// Weekly-recurring calendar feed. Subscribing (rather than importing) keeps phones in sync as the schedule changes.
const BYDAY: Record<Day, string> = { mon: 'MO', tue: 'TU', wed: 'WE', thu: 'TH', fri: 'FR', sat: 'SA', sun: 'SU' };
const JS_DAY: Record<Day, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
// RFC 5545: fold lines longer than 75 octets.
const fold = (line: string) => {
  const out: string[] = [];
  let cur = '', bytes = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (bytes + n > 73) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch; bytes += n;
  }
  return [...out, cur].join('\r\n ');
};

/** First date on/after `from` that falls on any of `days`, as YYYYMMDD. */
function firstDate(from: Date, days: Day[]): string {
  const want = new Set(days.map((d) => JS_DAY[d]));
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  while (!want.has(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

const VTIMEZONE = [
  'BEGIN:VTIMEZONE', `TZID:${TIMEZONE}`,
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:-0700', 'TZOFFSETTO:-0600', 'TZNAME:MDT', 'DTSTART:19700308T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:-0600', 'TZOFFSETTO:-0700', 'TZNAME:MST', 'DTSTART:19701101T020000', 'RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

export const GET: APIRoute = async () => {
  const [classes, settings, notes] = await Promise.all([getClasses(), getSettings(), getScheduleNotes()]);
  const location = [settings.locationNote, settings.addressLine1, settings.addressLine2].filter(Boolean).join(', ');
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  // Skip classes on closure dates (all occurrences that day share the class's start time).
  const closureDates = notes.closures.flatMap((c) => {
    if (!c.date) return [];
    const out: string[] = [];
    const d = new Date(`${c.date}T12:00:00Z`);
    const end = new Date(`${c.endDate || c.date}T12:00:00Z`);
    for (; d <= end; d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
    return out;
  });

  const events = classes.flatMap((c) => {
    const date = firstDate(now, c.days);
    const t = (s: string) => s.replace(':', '') + '00';
    const exdates = closureDates.map((d) => `${d}T${t(c.start)}`);
    return [
      'BEGIN:VEVENT',
      `UID:${c.slug}@atlas-jiujitsu.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${TIMEZONE}:${date}T${t(c.start)}`,
      `DTEND;TZID=${TIMEZONE}:${date}T${t(c.end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${c.days.map((d) => BYDAY[d]).join(',')}`,
      ...(exdates.length ? [`EXDATE;TZID=${TIMEZONE}:${exdates.join(',')}`] : []),
      `SUMMARY:${esc(`${c.title} · Atlas Jiu-Jitsu`)}`,
      `DESCRIPTION:${esc(c.description ?? '')}`,
      `LOCATION:${esc(location)}`,
      'END:VEVENT',
    ];
  });

  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Atlas Jiu-Jitsu//Schedule//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Atlas Jiu-Jitsu', `X-WR-TIMEZONE:${TIMEZONE}`, 'REFRESH-INTERVAL;VALUE=DURATION:P1D',
    ...VTIMEZONE, ...events, 'END:VCALENDAR',
  ].map(fold).join('\r\n');

  return new Response(body + '\r\n', { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
