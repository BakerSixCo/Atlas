// Progressive enhancement only: every page is fully usable without JavaScript.

const TZ = 'America/Boise';
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const DAY_LABEL: Record<string, string> = {
  sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday',
};

type Session = { day: string; start: string; end: string; title: string; program: string };
type Closure = { date: string; endDate?: string | null; note: string };

/* ── Header: scrolled state + mobile menu ── */
const header = document.querySelector<HTMLElement>('[data-header]');
const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu-btn]');
const mobileNav = document.querySelector<HTMLElement>('[data-mobile-nav]');
menuBtn?.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') !== 'true';
  menuBtn.setAttribute('aria-expanded', String(open));
  if (mobileNav) mobileNav.hidden = !open;
  document.body.style.overflow = open ? 'hidden' : '';
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuBtn?.getAttribute('aria-expanded') === 'true') menuBtn.click();
});

/* ── Time helpers (always in the gym's timezone, wherever the visitor is) ── */
function gymNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  const day = parts.weekday.toLowerCase().slice(0, 3);
  return { day, minutes: Number(parts.hour) * 60 + Number(parts.minute), iso: `${parts.year}-${parts.month}-${parts.day}` };
}
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmt = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const inWords = (mins: number) => {
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `in ${h}h ${m}m` : `in ${h}h`;
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function readJSON<T>(selector: string): T | null {
  const el = document.querySelector(selector);
  if (!el?.textContent) return null;
  try { return JSON.parse(el.textContent) as T; } catch { return null; }
}

const sessions = readJSON<Session[]>('#schedule-data') ?? [];
const closures = readJSON<Closure[]>('#closure-data') ?? [];
const closureFor = (iso: string) =>
  closures.find((c) => iso >= c.date && iso <= (c.endDate || c.date));

/* ── Highlight today, hide past closures ── */
function paintToday() {
  const now = gymNow();
  document.querySelectorAll<HTMLElement>('[data-day]').forEach((el) => {
    el.classList.toggle('is-today', el.dataset.day === now.day);
  });
  document.querySelectorAll<HTMLElement>('[data-closure-end]').forEach((el) => {
    if ((el.dataset.closureEnd ?? '') < now.iso) el.hidden = true;
  });
  document.querySelectorAll<HTMLElement>('[data-session]').forEach((el) => {
    const live = el.dataset.day === now.day
      && toMin(el.dataset.start!) <= now.minutes && now.minutes < toMin(el.dataset.end!);
    el.classList.toggle('is-live', live);
  });
}

/* ── "Live now / Up next" status ── */
function liveStatus(): { state: 'live' | 'next' | 'closed' | 'none'; html: string } {
  if (!sessions.length) return { state: 'none', html: '' };
  const now = gymNow();
  const todayIdx = DAYS.indexOf(now.day as (typeof DAYS)[number]);
  const closedToday = closureFor(now.iso);

  if (!closedToday) {
    const live = sessions.find((s) => s.day === now.day && toMin(s.start) <= now.minutes && now.minutes < toMin(s.end));
    if (live) {
      return { state: 'live', html: `<strong>${esc(live.title)}</strong> is on the mats now · until ${fmt(live.end)}` };
    }
  }

  for (let offset = 0; offset < 14; offset++) {
    const day = DAYS[(todayIdx + offset) % 7];
    const iso = addDays(now.iso, offset);
    if (closureFor(iso)) continue;
    const upcoming = sessions
      .filter((s) => s.day === day && (offset > 0 || toMin(s.start) > now.minutes))
      .sort((a, b) => a.start.localeCompare(b.start))[0];
    if (!upcoming) continue;
    const when = offset === 0
      ? `Today ${fmt(upcoming.start)} · ${inWords(toMin(upcoming.start) - now.minutes)}`
      : offset === 1 ? `Tomorrow ${fmt(upcoming.start)}` : `${DAY_LABEL[day]} ${fmt(upcoming.start)}`;
    const prefix = closedToday && offset > 0 ? `${esc(closedToday.note || 'Closed today')}. ` : '';
    return { state: closedToday ? 'closed' : 'next', html: `${prefix}Up next: <strong>${esc(upcoming.title)}</strong> · ${when}` };
  }
  return { state: 'none', html: '' };
}

function paintStatus() {
  const targets = document.querySelectorAll<HTMLElement>('[data-live-status]');
  if (!targets.length) return;
  const { state, html } = liveStatus();
  targets.forEach((el) => {
    if (state === 'none') { el.hidden = true; return; }
    el.hidden = false;
    el.dataset.state = state;
    const text = el.querySelector<HTMLElement>('[data-live-text]');
    if (text) text.innerHTML = html;
    const chip = el.querySelector<HTMLElement>('[data-live-chip]');
    if (chip) chip.textContent = state === 'live' ? 'Live' : state === 'closed' ? 'Closed' : 'Next';
  });
}

paintToday();
paintStatus();
setInterval(() => { paintToday(); paintStatus(); }, 60_000);

/* ── Schedule: program filters + jump to today on mobile ── */
const filterBar = document.querySelector<HTMLElement>('[data-filters]');
if (filterBar) {
  filterBar.hidden = false;
  filterBar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-filter]');
    if (!btn) return;
    const value = btn.dataset.filter!;
    filterBar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    document.querySelectorAll<HTMLElement>('[data-session]').forEach((el) => {
      el.hidden = value !== 'all' && el.dataset.program !== value;
    });
    document.querySelectorAll<HTMLElement>('[data-day-group]').forEach((g) => {
      const any = g.querySelector('[data-session]:not([hidden])');
      g.classList.toggle('is-empty', !any);
    });
  });
}

document.querySelectorAll<HTMLAnchorElement>('[data-jump-today]').forEach((a) => {
  const day = gymNow().day;
  const target = document.getElementById(`day-${day}`);
  if (target) { a.href = `#day-${day}`; a.hidden = false; }
});

/* ── Click-to-play video (nothing downloads until the visitor asks) ── */
document.querySelectorAll<HTMLButtonElement>('[data-video-play]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const video = btn.parentElement?.querySelector('video');
    if (!video) return;
    video.controls = true;
    video.preload = 'auto';
    btn.hidden = true;
    void video.play();
  });
});
