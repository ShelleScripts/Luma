// =============================================================================
// dashboard.js — the home screen.
//
// Milestone 1: there is no task data yet, so every number is 0 and each
// section shows its real empty state. Milestone 5 replaces the zeros with
// numbers calculated from saved tasks.
// =============================================================================

import { todayISO, formatLongDate, timeOfDay, escapeHTML } from './utils.js';
import { getSettings } from './store.js';
import { icons } from './icons.js';

export const title = 'Dashboard';

// The progress ring's circle has radius 36, so its length is 2 × π × 36
const RING_LENGTH = 2 * Math.PI * 36;

/** Draws the dashboard into `container`. */
export function render(container) {
  // Stand-in numbers until tasks exist
  const stats = { total: 0, completed: 0, outstanding: 0, dueSoon: 0 };
  const todayDone = 0;
  const todayTotal = 0;
  const ratio = todayTotal === 0 ? 0 : todayDone / todayTotal;
  const pct = Math.round(ratio * 100);

  // A template literal (backticks) lets us write HTML across many lines
  // and drop values in with ${...}.
  container.innerHTML = `
    <div class="page">
      <header class="page-header">
        <div class="page-header__text">
          <span class="page-header__eyebrow">${formatLongDate(todayISO())}</span>
          <h1 class="h1">Good ${timeOfDay()}${greetingName()}</h1>
        </div>
        <div class="page-header__actions">
          <a class="btn" href="#/planner/today">${icons.calendar()}Plan my day</a>
          <a class="btn" href="#/tasks">View all tasks</a>
          <a class="btn btn--primary" href="#/tasks/new">${icons.plus()}Add task</a>
        </div>
      </header>

      <section class="card stats" aria-label="Summary">
        ${stat('Total tasks', stats.total)}
        ${stat('Completed', stats.completed, 'stat__value--green')}
        ${stat('Outstanding', stats.outstanding)}
        ${stat('Due in 7 days', stats.dueSoon, 'stat__value--amber')}
      </section>

      <div class="split">
        <section class="split__main" aria-labelledby="today-heading">
          <div class="list-head">
            <h2 class="h2" id="today-heading">Today's tasks</h2>
            <span class="num muted">${todayDone} of ${todayTotal} done</span>
            <div class="bar" aria-hidden="true"><span class="bar__fill" style="width:${pct}%"></span></div>
          </div>
          <div class="list">
            <div class="empty">
              <span style="color:var(--text-3)">${icons.check(32)}</span>
              <p>A fresh day, a fresh start. What would you like to accomplish?</p>
              <a class="btn" href="#/tasks/new">Add task</a>
            </div>
          </div>
        </section>

        <aside class="split__side" aria-label="Progress and deadlines">
          <div class="card progress-card">
            <svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label="${todayDone} of ${todayTotal} tasks done today">
              <circle class="ring__track" cx="42" cy="42" r="36"/>
              <circle class="ring__fill" cx="42" cy="42" r="36" transform="rotate(-90 42 42)"
                      stroke-dasharray="${(ratio * RING_LENGTH).toFixed(1)} ${RING_LENGTH.toFixed(1)}"
                      ${ratio === 0 ? 'stroke-opacity="0"' : ''}/>
              <text class="ring__label" x="42" y="47" text-anchor="middle">${pct}%</text>
            </svg>
            <div>
              <h2 class="h2">Daily progress</h2>
              <p class="muted num" style="margin-top:4px">${todayDone} of ${todayTotal} done today</p>
              <p class="muted small" style="margin-top:2px">Nothing scheduled yet.</p>
            </div>
          </div>

          <div class="card">
            <div class="card__head">
              <h2 class="h2">Upcoming deadlines</h2>
              <a href="#/deadlines" class="muted small">See all</a>
            </div>
            <p class="empty--compact empty muted">You're all caught up. No upcoming deadlines!</p>
          </div>
        </aside>
      </div>
    </div>
  `;
}

/** Builds the HTML for one summary number. */
function stat(label, value, valueClass = '') {
  return `
    <div class="stat">
      <span class="stat__label">${label}</span>
      <span class="stat__value ${valueClass}">${value}</span>
    </div>
  `;
}

/** ", Ama" when a display name is set in Settings, otherwise nothing. */
function greetingName() {
  const name = getSettings().displayName.trim();
  return name ? `, ${escapeHTML(name)}` : '';
}
