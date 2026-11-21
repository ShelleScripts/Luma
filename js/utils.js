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

/**
 * The first day of the week that contains this date: its Monday, or its
 * Sunday when weekStart is "sunday" (the Settings option).
 */
export function startOfWeek(iso, weekStart = 'monday') {
  const day = parseISODate(iso).getDay();   // 0 = Sunday, 1 = Monday ... 6 = Saturday
  const first = weekStart === 'sunday' ? 0 : 1;
  const back = (day - first + 7) % 7;       // how many days since the week began
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

/** True for a real calendar date written as "YYYY-MM-DD" (rejects "2026-02-31"). */
export function isValidISODate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return toISODate(parseISODate(iso)) === iso;
}

/** Whole days from one "YYYY-MM-DD" to another: daysBetween(today, tomorrow) = 1. */
export function daysBetween(fromISO, toISO) {
  const ms = parseISODate(toISO) - parseISODate(fromISO);
  return Math.round(ms / 86400000); // Math.round copes with daylight-saving hours
}

/** "18 Nov, 21:40" from an ISO timestamp like "2026-11-18T21:40:00.000Z" (shown in local time). */
export function formatTimestamp(isoTimestamp) {
  const date = new Date(isoTimestamp);
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${day}, ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/**
 * A unique id for a new record. crypto.randomUUID() is built into modern
 * browsers but only on secure pages (https or localhost), so there's a
 * fallback for e.g. testing on your phone over your home network.
 */
export function makeId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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
