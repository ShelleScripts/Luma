// =============================================================================
// planner.js — the Daily and Weekly planner.
//
// Milestone 1: the Day/Week switch, date navigation, clicking a day in the
// week, and "Add activity" all work; the schedule is empty until tasks exist.
// Milestone 4 places scheduled tasks on the grid and fills "Not planned yet".
// =============================================================================

import { todayISO, addDays, startOfWeek, parseISODate, formatLongDate, formatDayMonth } from './utils.js';
import { icons } from './icons.js';

export const title = 'Planner';

// The planner remembers which view and date you were looking at
// while you move around the app.
const state = {
  view: 'week',       // 'day' or 'week'
  date: todayISO(),   // the selected day ("YYYY-MM-DD")
};

const FIRST_HOUR = 8;
const LAST_HOUR = 20;

/**
 * Draws the planner. "Plan my day" links to #/planner/today, which jumps
 * to today's daily view and brings the "Not planned yet" panel into view.
 */
export function render(container, { params }) {
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

/** Re-draws the whole screen from `state`. */
function draw(container) {
  const isDay = state.view === 'day';

  container.innerHTML = `
    <div class="planner-head">
      <div class="planner-head__title">
        <h1 class="h1">Planner</h1>
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
        ${isDay ? dayView() : weekView()}
      </section>

      <aside class="planner-aside" id="unplanned" aria-labelledby="unplanned-heading">
        <div style="display:flex;align-items:baseline;gap:8px">
          <h2 class="h2" id="unplanned-heading">Not planned yet</h2>
          <span class="num muted">0</span>
        </div>
        <p class="muted small">Tasks with a deadline but no work session land here, ready to plan.</p>
        <p class="empty empty--compact">Nothing waiting to be planned.</p>
      </aside>
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

const emptySchedule = () => `
  <div class="empty">
    <span>${icons.calendar(32)}</span>
    <p>Your schedule is looking clear. Plan your next activity.</p>
    <a class="btn" href="#/tasks/new?date=${state.date}">Add activity</a>
  </div>
`;

/** An hour-by-hour list for the selected day. */
function dayView() {
  const hours = [];
  for (let h = FIRST_HOUR; h <= LAST_HOUR; h++) {
    hours.push(`<li class="hour"><span class="hour__label">${String(h).padStart(2, '0')}:00</span></li>`);
  }
  return `${emptySchedule()}<ol class="hours" aria-label="Hours">${hours.join('')}</ol>`;
}

/** Seven day headers, Monday to Sunday. Click one to open that day. */
function weekView() {
  const monday = startOfWeek(state.date);
  const today = todayISO();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const iso = addDays(monday, i);
    const date = parseISODate(iso);
    const name = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const full = formatLongDate(iso);
    days.push(`
      <button type="button" class="day-head" data-open-day="${iso}" aria-label="Open ${full} in day view"
              ${iso === today ? 'aria-current="date"' : ''}>
        <span class="day-head__top">
          <span>${name}</span><span class="day-head__num">${date.getDate()}</span>
          <span class="day-head__free">free</span>
        </span>
        <span class="bar" style="height:4px"><span class="bar__fill" style="background:var(--accent)"></span></span>
      </button>
    `);
  }
  return `<div class="week-head">${days.join('')}</div>${emptySchedule()}`;
}

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
}
