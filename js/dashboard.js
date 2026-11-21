// =============================================================================
// dashboard.js — the home screen.
//
// Everything here is calculated from the saved tasks each time it draws:
// the summary numbers, today's tasks (decision 5), the daily progress ring
// and the next five deadlines. When the data changes (a task is ticked,
// edited or deleted), the screen redraws itself.
// =============================================================================

import { todayISO, formatLongDate, formatShortDate, timeOfDay, escapeHTML } from './utils.js';
import { getTasks, getSettings, getCategory, PRIORITY_LABELS } from './store.js';
import { icons } from './icons.js';
import {
  isDone, isToday, isOverdue, deadlineGroup, relativeDue, compareByDue, compareBySession, sessionLabel,
} from './task-helpers.js';
import { checkbox, connectTaskActions, refocus, focusedTaskId } from './task-list.js';

export const title = 'Dashboard';

// The progress ring's circle has radius 36, so its length is 2 × π × 36
const RING_LENGTH = 2 * Math.PI * 36;

// How many deadlines the dashboard shows (the brief asks for five)
const DEADLINE_COUNT = 5;

// The element the dashboard is drawn into, so it can redraw on changes
let mounted = null;

/** Draws the dashboard into `container`. */
export function render(container) {
  mounted = container;
  const tasks = getTasks();
  const today = todayISO();

  // ---- The numbers ----
  const completed = tasks.filter(isDone).length;
  const deadlines = tasks
    .filter((t) => deadlineGroup(t, today)) // open tasks with a due date
    .sort(compareByDue);
  const stats = {
    total: tasks.length,
    completed,
    outstanding: tasks.length - completed,
    dueSoon: deadlines.filter((t) => deadlineGroup(t, today) === 'soon').length,
    overdue: deadlines.filter((t) => deadlineGroup(t, today) === 'overdue').length,
  };

  // Today's tasks: open ones first, each group in time order
  const todays = tasks.filter((t) => isToday(t, today)).sort(compareBySession);
  todays.sort((a, b) => Number(isDone(a)) - Number(isDone(b)));
  const todayDone = todays.filter(isDone).length;
  const todayTotal = todays.length;
  const ratio = todayTotal === 0 ? 0 : todayDone / todayTotal;
  const pct = Math.round(ratio * 100);

  container.innerHTML = `
    <div class="page" data-screen="dashboard">
      <header class="page-header">
        <div class="page-header__text">
          <span class="page-header__eyebrow">${formatLongDate(today)}</span>
          <h1 class="h1" tabindex="-1">Good ${timeOfDay()}${greetingName()}</h1>
        </div>
        <div class="page-header__actions">
          <a class="btn" href="#/planner/today">${icons.calendar()}Plan my day</a>
          <a class="btn" href="#/tasks">View all tasks</a>
          <a class="btn btn--primary" href="#/tasks/new">${icons.plus()}Add task</a>
        </div>
      </header>

      <section class="card stats" aria-label="Summary">
        ${stat('Total tasks', stats.total, '', '#/tasks')}
        ${stat('Completed', stats.completed, 'stat__value--green', '#/tasks')}
        ${stat('Outstanding', stats.outstanding, '', '#/tasks')}
        ${stat('Due in 7 days', stats.dueSoon, 'stat__value--amber', '#/deadlines',
          stats.overdue ? `<span class="stat__note">${stats.overdue} overdue</span>` : '')}
      </section>

      <div class="split">
        <section class="split__main" aria-labelledby="today-heading">
          <div class="list-head">
            <h2 class="h2" id="today-heading">Today's tasks</h2>
            <span class="num muted">${todayDone} of ${todayTotal} done</span>
            <div class="bar" aria-hidden="true"><span class="bar__fill" style="width:${pct}%"></span></div>
          </div>
          <ul class="list" id="today-list">
            ${todays.length ? todays.map(todayRow).join('') : todayEmpty(tasks.length)}
          </ul>
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
              <p class="muted small" style="margin-top:2px">${progressNote(todayDone, todayTotal)}</p>
            </div>
          </div>

          <div class="card">
            <div class="card__head">
              <h2 class="h2">Upcoming deadlines</h2>
              <a href="#/deadlines" class="muted small">See all</a>
            </div>
            ${deadlines.length ? `
              <ul class="mini-deadlines">${deadlines.slice(0, DEADLINE_COUNT).map(deadlineItem).join('')}</ul>`
              : `<p class="empty--compact empty muted">You're all caught up. No upcoming deadlines!</p>`}
          </div>
        </aside>
      </div>
    </div>
  `;

  connectTaskActions(container.querySelector('#today-list'), container);
}

/** Builds the HTML for one summary number. Each one links to its screen. */
function stat(label, value, valueClass, href, extra = '') {
  return `
    <a class="stat" href="${href}">
      <span class="stat__label">${label}</span>
      <span class="stat__value ${valueClass}">${value}</span>
      ${extra}
    </a>
  `;
}

/** One of today's tasks: checkbox, title, time, priority and course. */
function todayRow(task) {
  const done = isDone(task);
  const category = getCategory(task.categoryId);
  // A work session's time, or the deadline's time if it's due today
  const time = sessionLabel(task) || (task.dueTime ? `Due ${task.dueTime}` : '');

  return `
    <li class="task-row today-row ${done ? 'task-row--done' : ''}" data-id="${task.id}">
      ${checkbox(task)}
      <a class="task-row__main" href="#/tasks/${task.id}/edit">
        <span class="task-row__title">${escapeHTML(task.title)}</span>
      </a>
      <span class="today-row__time num">${time}</span>
      <span class="priority" title="${PRIORITY_LABELS[task.priority]} priority">${icons.priority(task.priority)}<span class="visually-hidden">${PRIORITY_LABELS[task.priority]} priority</span></span>
      <span class="today-row__course">
        <span class="dot dot--small" style="background:${category ? category.color : 'var(--c-grey)'}"></span>
        ${category ? escapeHTML(category.name) : 'Uncategorized'}
      </span>
    </li>
  `;
}

/** What to show when nothing is on for today. */
function todayEmpty(taskCount) {
  if (taskCount === 0) {
    return `
      <li class="empty">
        <span style="color:var(--text-3)">${icons.check(32)}</span>
        <p>A fresh day, a fresh start. What would you like to accomplish?</p>
        <a class="btn btn--primary" href="#/tasks/new">${icons.plus()}Add your first task</a>
      </li>
    `;
  }
  return `
    <li class="empty">
      <span style="color:var(--text-3)">${icons.calendar(32)}</span>
      <p>Nothing planned for today yet.</p>
      <a class="btn" href="#/planner/today">Plan my day</a>
    </li>
  `;
}

function progressNote(done, total) {
  if (total === 0) return 'Nothing scheduled yet.';
  if (done === total) return 'All done for today. Nice work!';
  const left = total - done;
  return `${left} ${left === 1 ? 'task' : 'tasks'} to go.`;
}

/** One deadline in the side card: title, course, date and days remaining. */
function deadlineItem(task) {
  const category = getCategory(task.categoryId);
  const overdue = isOverdue(task);
  return `
    <li>
      <a class="mini-deadline ${overdue ? 'mini-deadline--overdue' : ''}" href="#/tasks/${task.id}/edit">
        <span class="mini-deadline__main">
          <span class="mini-deadline__title">${escapeHTML(task.title)}</span>
          <span class="mini-deadline__meta">
            <span class="dot dot--small" style="background:${category ? category.color : 'var(--c-grey)'}"></span>
            ${category ? escapeHTML(category.name) : 'Uncategorized'}
          </span>
        </span>
        <span class="mini-deadline__when">
          <span class="num">${formatShortDate(task.dueDate)}</span>
          <span class="mini-deadline__rel">${relativeDue(task)}</span>
        </span>
      </a>
    </li>
  `;
}

/** ", Ama" when a display name is set in Settings, otherwise nothing. */
function greetingName() {
  const name = getSettings().displayName.trim();
  return name ? `, ${escapeHTML(name)}` : '';
}

// Redraw when tasks change (ticked here, Undo, another tab), if on screen
document.addEventListener('luma:datachange', () => {
  if (mounted && mounted.querySelector('[data-screen="dashboard"]')) {
    const focusedId = focusedTaskId(mounted);
    render(mounted);
    if (focusedId) refocus(mounted, focusedId);
  }
});
