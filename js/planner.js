// =============================================================================
// planner.js — the Daily and Weekly planner.
//
// The planner shows WORK SESSIONS: when you plan to work on a task
// (scheduledDate + start/end time). That's separate from the deadline
// (dueDate): an essay can be due Friday but planned for Tuesday evening.
//
//   Day view   an hour-by-hour timeline. Click an empty hour to add an
//              activity there; overlapping sessions sit side by side.
//   Week view  Monday to Sunday, with how busy each day is.
//   Aside      "Not planned yet": open tasks with no work session, each
//              with a button to plan it on the selected day.
// =============================================================================

import { todayISO, addDays, startOfWeek, parseISODate, formatLongDate, formatDayMonth, formatShortDate, escapeHTML } from './utils.js';
import { icons } from './icons.js';
import { showToast } from './ui.js';
import { getTasks, getTask, getCategory, updateTask, restoreTask } from './store.js';
import {
  isDone, isOverdue, dueLabel, compareByDue, compareBySession,
  sessionSpan, sessionLabel, layoutSessions, fromMinutes,
} from './task-helpers.js';

export const title = 'Planner';

// The planner remembers which view and date you were looking at
// while you move around the app.
const state = {
  view: 'week',       // 'day' or 'week'
  date: todayISO(),   // the selected day ("YYYY-MM-DD")
};

// The day view always shows at least 08:00 to 20:00, and stretches to fit
// sessions that start earlier or end later.
const FIRST_HOUR = 8;
const LAST_HOUR = 20;
const HOUR_HEIGHT = 48; // pixels per hour, matches .hour in the CSS

// A day with this many planned hours (or more) counts as busy
const BUSY_MINUTES = 6 * 60;

// The element the planner is drawn into, so it can redraw when data changes
let mounted = null;

/**
 * Draws the planner. "Plan my day" links to #/planner/today, which jumps
 * to today's daily view and brings the "Not planned yet" panel into view.
 */
export function render(container, { params }) {
  mounted = container;
  const planMyDay = params[0] === 'today';
  if (planMyDay) {
    state.view = 'day';
    state.date = todayISO();
  }

  draw(container);

  if (planMyDay) {
    container.querySelector('#unplanned').scrollIntoView({ block: 'nearest' });
  }
}

/** Tasks with a work session on one date. */
const sessionsOn = (tasks, iso) => tasks.filter((t) => t.scheduledDate === iso);

/** Re-draws the whole screen from `state`. */
function draw(container) {
  const isDay = state.view === 'day';
  const tasks = getTasks();

  container.innerHTML = `
    <div class="planner-head" data-screen="planner">
      <div class="planner-head__title">
        <h1 class="h1" tabindex="-1">Planner</h1>
        <p class="muted num" style="margin-top:4px;font-weight:500" aria-live="polite">${rangeLabel()}</p>
      </div>
      <div class="seg" role="group" aria-label="View">
        <button type="button" data-planner="day" aria-pressed="${isDay}">Day</button>
        <button type="button" data-planner="week" aria-pressed="${!isDay}">Week</button>
      </div>
      <div style="display:flex;gap:4px">
        <button type="button" class="icon-btn icon-btn--boxed" data-planner="prev"
                aria-label="${isDay ? 'Previous day' : 'Previous week'}">${icons.chevronLeft()}</button>
        <button type="button" class="btn" data-planner="today">Today</button>
        <button type="button" class="icon-btn icon-btn--boxed" data-planner="next"
                aria-label="${isDay ? 'Next day' : 'Next week'}">${icons.chevronRight()}</button>
      </div>
      <a class="btn btn--primary" href="#/tasks/new?date=${state.date}">${icons.plus()}Add activity</a>
    </div>

    <div class="planner-body">
      <section class="planner-schedule" aria-label="Schedule">
        ${isDay ? dayView(tasks) : weekView(tasks)}
      </section>
      ${unplannedPanel(tasks)}
    </div>
  `;

  connectButtons(container);
}

/** The line under the title: one day, or the Monday–Sunday range. */
function rangeLabel() {
  if (state.view === 'day') {
    return state.date === todayISO() ? `Today · ${formatLongDate(state.date)}` : formatLongDate(state.date);
  }
  const monday = startOfWeek(state.date);
  return `${formatDayMonth(monday)} – ${formatDayMonth(addDays(monday, 6))}`;
}

/** The gentle amber warning shown when sessions overlap (decision 13). */
const overlapBanner = (text) => `
  <p class="planner-warning" role="status">${icons.clock(15)}<span>${text}</span></p>
`;

/** A category's colour, or grey for Uncategorized. */
const colorOf = (task) => getCategory(task.categoryId)?.color || 'var(--c-grey)';

// ---------------------------------------------------------------------------
// Day view
// ---------------------------------------------------------------------------

function dayView(tasks) {
  const day = sessionsOn(tasks, state.date).sort(compareBySession);
  const timed = day.filter((t) => t.scheduledStartTime);
  const untimed = day.filter((t) => !t.scheduledStartTime);
  const { layout, overlaps } = layoutSessions(timed);

  // Stretch the timeline to fit early or late sessions
  let first = FIRST_HOUR;
  let last = LAST_HOUR;
  timed.forEach((t) => {
    const span = sessionSpan(t);
    first = Math.min(first, Math.floor(span.start / 60));
    last = Math.max(last, Math.ceil(span.end / 60));
  });
  last = Math.min(last, 24);

  // One row per hour. The row itself is a link: click an empty hour to add
  // an activity that starts then.
  const rows = [];
  for (let h = first; h < last; h++) {
    const start = fromMinutes(h * 60);
    const end = fromMinutes(Math.min((h + 1) * 60, 24 * 60 - 1));
    rows.push(`
      <li class="hour">
        <span class="hour__label">${start}</span>
        <a class="hour__add" href="#/tasks/new?date=${state.date}&start=${start}&end=${end}"
           aria-label="Add activity at ${start}">${icons.plus(12)}</a>
      </li>
    `);
  }

  const blocks = timed.map((task) => {
    const span = sessionSpan(task);
    const { column, columns } = layout.get(task.id);
    const top = ((span.start - first * 60) / 60) * HOUR_HEIGHT;
    const height = Math.max(((span.end - span.start) / 60) * HOUR_HEIGHT - 2, 26);
    const style = [
      `top:${top}px`,
      `height:${height}px`,
      `left:calc(${(column / columns) * 100}% + 2px)`,
      `width:calc(${100 / columns}% - 4px)`,
      `--block-color:${colorOf(task)}`,
    ].join(';');
    return sessionCard(task, 'block', style);
  }).join('');

  return `
    <div class="day">
      ${overlaps ? overlapBanner('Some sessions overlap on this day, so they sit side by side. You might want to move one.') : ''}
      ${day.length === 0 ? `
        <p class="empty empty--compact day__empty">Your schedule is looking clear. Plan your next activity, or click an hour below.</p>` : ''}
      ${untimed.length ? `
        <div class="day__anytime">
          <h2 class="small muted">Any time</h2>
          <ul class="anytime-list">${untimed.map((t) => `<li>${sessionCard(t, 'wcard')}</li>`).join('')}</ul>
        </div>` : ''}
      <div class="timeline" style="height:${(last - first) * HOUR_HEIGHT}px">
        <ol class="hours" aria-label="Hours">${rows.join('')}</ol>
        <div class="blocks">${blocks}</div>
      </div>
    </div>
  `;
}

/**
 * One work session: its title and time link to the task's edit page, and a
 * small button takes it off the planner (the task itself is kept).
 */
function sessionCard(task, className, style = `--block-color:${colorOf(task)}`) {
  const name = escapeHTML(task.title);
  const time = sessionLabel(task);
  return `
    <div class="${className} ${isDone(task) ? `${className}--done` : ''}" style="${style}" data-id="${task.id}">
      <a class="${className}__link" href="#/tasks/${task.id}/edit">
        <span class="${className}__title">${name}</span>
        ${time ? `<span class="${className}__time num">${time}</span>` : ''}
      </a>
      <button type="button" class="${className}__remove" data-unschedule
              aria-label="Remove ${name} from the planner">${icons.close(12)}</button>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Week view
// ---------------------------------------------------------------------------

/** "2h 30m", "45m", "3h". */
function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  return h ? `${h}h` : `${m}m`;
}

function weekView(tasks) {
  const monday = startOfWeek(state.date);
  const today = todayISO();
  const heads = [];
  const columns = [];
  let daysWithOverlaps = 0;

  for (let i = 0; i < 7; i++) {
    const iso = addDays(monday, i);
    const date = parseISODate(iso);
    const name = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const day = sessionsOn(tasks, iso).sort(compareBySession);

    // How busy is the day? Add up the planned time of open sessions.
    const minutes = day
      .filter((t) => !isDone(t))
      .reduce((sum, t) => {
        const span = sessionSpan(t);
        return sum + (span ? span.end - span.start : 0);
      }, 0);
    const { overlaps } = layoutSessions(day);
    if (overlaps) daysWithOverlaps++;

    // "free", "2h 30m", "busy", or "1 task" for sessions without times
    const open = day.filter((t) => !isDone(t)).length;
    let load = 'free';
    if (minutes >= BUSY_MINUTES) load = 'busy';
    else if (minutes) load = formatDuration(minutes);
    else if (open) load = `${open} ${open === 1 ? 'task' : 'tasks'}`;
    else if (day.length) load = 'done';
    const fill = Math.min(minutes / BUSY_MINUTES, 1) * 100;

    heads.push(`
      <button type="button" class="day-head ${selectedClass(iso)}" data-open-day="${iso}"
              aria-label="Open ${formatLongDate(iso)} in day view. ${load === 'free' ? 'Nothing planned' : `${day.length} planned`}${overlaps ? ', with overlapping sessions' : ''}."
              ${iso === today ? 'aria-current="date"' : ''}>
        <span class="day-head__top">
          <span>${name}</span><span class="day-head__num">${date.getDate()}</span>
          ${overlaps ? '<span class="day-head__warn" aria-hidden="true">!</span>' : ''}
          <span class="day-head__free ${load === 'busy' ? 'day-head__free--busy' : ''}">${load}</span>
        </span>
        <span class="bar" style="height:4px"><span class="bar__fill" style="width:${fill}%;background:${load === 'busy' ? 'var(--amber)' : 'var(--accent)'}"></span></span>
      </button>
    `);

    columns.push(`
      <div class="week-col" aria-label="${formatLongDate(iso)}" role="group">
        <ul class="week-col__list">${day.map((t) => `<li>${sessionCard(t, 'wcard')}</li>`).join('')}</ul>
        <a class="week-col__add" href="#/tasks/new?date=${iso}" aria-label="Add activity on ${formatLongDate(iso)}">${icons.plus(12)}<span>Add</span></a>
      </div>
    `);
  }

  return `
    ${daysWithOverlaps ? `<div style="padding:12px 16px 0">${overlapBanner(`${daysWithOverlaps === 1 ? 'One day has' : `${daysWithOverlaps} days have`} overlapping sessions. Open the day to see them side by side.`)}</div>` : ''}
    <div class="week">
      <div class="week-head">${heads.join('')}</div>
      <div class="week-cols">${columns.join('')}</div>
    </div>
  `;
}

/** Highlights the selected day in the week (the day "Plan" buttons use). */
const selectedClass = (iso) => (iso === state.date ? 'day-head--selected' : '');

// ---------------------------------------------------------------------------
// Not planned yet
// ---------------------------------------------------------------------------

function unplannedPanel(tasks) {
  const waiting = tasks.filter((t) => !isDone(t) && !t.scheduledDate).sort(compareByDue);
  const target = formatShortDate(state.date);

  return `
    <aside class="planner-aside" id="unplanned" aria-labelledby="unplanned-heading">
      <div style="display:flex;align-items:baseline;gap:8px">
        <h2 class="h2" id="unplanned-heading" tabindex="-1">Not planned yet</h2>
        <span class="num muted">${waiting.length}</span>
      </div>
      <p class="muted small">Open tasks with no work session. Plan one on ${state.date === todayISO() ? 'today' : target}, then click it to set a time.</p>
      ${waiting.length ? `
        <ul class="plan-list">
          ${waiting.map((t) => `
            <li class="plan-item" data-id="${t.id}">
              <span class="dot" style="background:${colorOf(t)}"></span>
              <a class="plan-item__main" href="#/tasks/${t.id}/edit">
                <span class="plan-item__title">${escapeHTML(t.title)}</span>
                <span class="plan-item__due num ${isOverdue(t) ? 'plan-item__due--overdue' : ''}">${isOverdue(t) ? 'Overdue · ' : ''}${dueLabel(t)}</span>
              </a>
              <button type="button" class="btn btn--small" data-plan
                      aria-label="Plan ${escapeHTML(t.title)} on ${formatLongDate(state.date)}">${icons.plus(12)}${target}</button>
            </li>`).join('')}
        </ul>` : '<p class="empty empty--compact">Nothing waiting to be planned.</p>'}
    </aside>
  `;
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

/** Wires up the buttons that were just drawn. */
function connectButtons(container) {
  const step = () => (state.view === 'day' ? 1 : 7);
  const actions = {
    day: () => { state.view = 'day'; },
    week: () => { state.view = 'week'; },
    prev: () => { state.date = addDays(state.date, -step()); },
    next: () => { state.date = addDays(state.date, step()); },
    today: () => { state.date = todayISO(); },
  };

  container.querySelectorAll('[data-planner]').forEach((button) => {
    const action = button.dataset.planner;
    button.addEventListener('click', () => {
      actions[action]();
      draw(container);
      // Keep keyboard focus on the same control after re-drawing
      container.querySelector(`[data-planner="${action}"]`).focus();
    });
  });

  container.querySelectorAll('[data-open-day]').forEach((button) => {
    button.addEventListener('click', () => {
      state.view = 'day';
      state.date = button.dataset.openDay;
      draw(container);
      container.querySelector('[data-planner="day"]').focus();
    });
  });

  // Session cards and "Not planned yet" items, handled with one listener
  container.querySelector('.planner-body').addEventListener('click', (event) => {
    const item = event.target.closest('[data-id]');
    if (!item) return;
    const id = item.dataset.id;

    if (event.target.closest('[data-unschedule]')) {
      const before = getTask(id);
      updateTask(id, { scheduledDate: '', scheduledStartTime: '', scheduledEndTime: '' });
      container.querySelector('h1').focus();
      showToast('Removed from the planner. The task is still in My Tasks.', {
        action: { label: 'Undo', onClick: () => restoreTask(before) },
      });
    }

    if (event.target.closest('[data-plan]')) {
      const before = getTask(id);
      updateTask(id, { scheduledDate: state.date });
      container.querySelector('#unplanned-heading').focus();
      showToast(`Planned for ${formatShortDate(state.date)}. Click it to set a time.`, {
        action: { label: 'Undo', onClick: () => restoreTask(before) },
      });
    }
  });
}

// When tasks change (planned, removed, undone, edited in another tab),
// redraw the planner, but only if it's still the screen on show.
document.addEventListener('luma:datachange', () => {
  if (mounted && mounted.querySelector('[data-screen="planner"]')) {
    const hadFocus = mounted.contains(document.activeElement) ? document.activeElement.id : '';
    draw(mounted);
    if (hadFocus) mounted.querySelector(`#${hadFocus}`)?.focus();
  }
});
