// =============================================================================
// utils.js — small helpers shared by every screen.
//
// Dates: we NEVER write new Date("2026-11-18"). The browser reads that string
// as midnight UTC, which can be "yesterday" in your timezone. Instead, calendar
// dates are kept as "YYYY-MM-DD" strings and turned into Date objects with the
// local year/month/day parts (see parseISODate below).
// =============================================================================

/** Pads a number to two digits: 7 -> "07". */
function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Turns a Date into a local "YYYY-MM-DD" string. */
export function toISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Today's date as "YYYY-MM-DD", in the user's own timezone. */
export function todayISO() {
  return toISODate(new Date());
}

/** Turns "YYYY-MM-DD" into a Date at local midnight. */
export function parseISODate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Adds (or subtracts) whole days: addDays("2026-11-18", 1) -> "2026-11-19". */
export function addDays(iso, days) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/** The Monday of the week that contains this date. */
export function startOfWeek(iso) {
  const date = parseISODate(iso);
  const day = date.getDay();          // 0 = Sunday, 1 = Monday ... 6 = Saturday
  const back = (day + 6) % 7;         // how many days since Monday
  return addDays(iso, -back);
}

/** "Friday, 20 November" */
export function formatLongDate(iso) {
  const date = parseISODate(iso);
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const rest = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  return `${weekday}, ${rest}`;
}

/** "Fri 20 Nov" */
export function formatShortDate(iso) {
  const date = parseISODate(iso);
  return date
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(',', '');
}

/** "20 Nov" */
export function formatDayMonth(iso) {
  return parseISODate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** "morning", "afternoon" or "evening", from the current hour. */
export function timeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Makes text safe to put inside HTML. Anything a user types (a task title,
 * a course name) must go through this before it goes into innerHTML,
 * otherwise "<b>" in a title would become real HTML.
 */
export function escapeHTML(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
