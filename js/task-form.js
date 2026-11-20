// =============================================================================
// task-form.js — the New task page (#/tasks/new).
//
// In the new design the task form is its own page rather than a pop-up.
// Milestone 1: every control works and the form is validated, but Save
// doesn't store anything yet. Milestone 2 turns the form into a task object
// and saves it (and reuses this page for "Edit task").
//
// Links can pre-fill the work-session date: #/tasks/new?date=2026-11-20
// (the Planner's "Add activity" does this).
// =============================================================================

import { todayISO, addDays } from './utils.js';
import { icons } from './icons.js';
import { showToast } from './ui.js';

export const title = 'New task';

const PRIORITIES = [
  { value: 'low', name: 'Low', color: 'var(--text-3)' },
  { value: 'medium', name: 'Medium', color: 'var(--c-blue)' },
  { value: 'high', name: 'High', color: 'var(--amber)' },
  { value: 'urgent', name: 'Urgent', color: 'var(--red)' },
];

const STATUSES = [
  { value: 'todo', name: 'To do' },
  { value: 'in-progress', name: 'In progress' },
  { value: 'completed', name: 'Completed' },
];

const TYPES = ['Assignment', 'Quiz', 'Examination', 'Reading', 'Project', 'Study Session', 'Personal', 'Other'];
const CATEGORIES = ['Academic', 'Personal', 'Extracurricular', 'Work', 'Projects'];

export function render(container, { query, from }) {
  const scheduledDate = query.get('date') || '';

  container.innerHTML = `
    <div class="page page--form">
      <div>
        <a href="${from}" class="back-link">${icons.chevronLeft()}Back</a>
        <h1 class="h1">New task</h1>
      </div>

      <form class="form" id="task-form" novalidate>
        <div class="f">
          <label class="f__label" for="task-title">Title</label>
          <input id="task-title" name="title" class="field field--title" autocomplete="off"
                 aria-describedby="title-error" required>
          <span id="title-error" class="err" hidden>Give the task a title so you can find it later.</span>
        </div>

        <div class="f">
          <label class="f__label" for="task-description">Description <span class="f__optional">(optional)</span></label>
          <textarea id="task-description" name="description" class="field" rows="3"></textarea>
        </div>

        <div class="grid-2">
          <div class="f">
            <label class="f__label" for="task-category">Course or category</label>
            <select id="task-category" name="categoryId" class="field">
              <option value="">Uncategorized</option>
              ${CATEGORIES.map((c) => `<option value="${c.toLowerCase()}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="f">
            <label class="f__label" for="task-type">Type</label>
            <select id="task-type" name="taskType" class="field">
              ${TYPES.map((t) => `<option>${t}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="row-wrap">
          <div class="f">
            <span class="f__label" id="prio-label">Priority</span>
            <div class="seg" role="group" aria-labelledby="prio-label">
              ${PRIORITIES.map((p) => `
                <button type="button" data-priority="${p.value}" aria-pressed="${p.value === 'medium'}">
                  <span class="dot dot--small" style="background:${p.color}"></span>${p.name}
                </button>`).join('')}
            </div>
          </div>
          <div class="f">
            <span class="f__label" id="status-label">Status</span>
            <div class="seg" role="group" aria-labelledby="status-label">
              ${STATUSES.map((s) => `
                <button type="button" data-status="${s.value}" aria-pressed="${s.value === 'todo'}">${s.name}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="boxes">
          <fieldset class="card box">
            <legend class="box__legend"><span style="color:var(--amber);display:flex">${icons.clock()}</span>Deadline</legend>
            <p class="box__hint">When it has to be handed in. Leave it empty if there isn't one.</p>
            <div class="box__chips">
              <button type="button" class="btn btn--small" data-due="0">Today</button>
              <button type="button" class="btn btn--small" data-due="1">Tomorrow</button>
              <button type="button" class="btn btn--small" data-due="7">Next week</button>
            </div>
            <div class="grid-2">
              <div class="f">
                <label class="f__label" for="task-due-date">Due date</label>
                <input id="task-due-date" name="dueDate" type="date" class="field num">
              </div>
              <div class="f">
                <label class="f__label" for="task-due-time">Due time</label>
                <input id="task-due-time" name="dueTime" type="time" class="field num">
              </div>
            </div>
          </fieldset>

          <fieldset class="card box">
            <legend class="box__legend"><span style="color:var(--accent-soft);display:flex">${icons.calendar(16)}</span>Work session</legend>
            <p class="box__hint">When you plan to work on it. Shows in your planner.</p>
            <div class="f">
              <label class="f__label" for="task-sched-date">Date</label>
              <input id="task-sched-date" name="scheduledDate" type="date" class="field num" value="${scheduledDate}">
            </div>
            <div class="grid-2">
              <div class="f">
                <label class="f__label" for="task-start">Start</label>
                <input id="task-start" name="scheduledStartTime" type="time" class="field num">
              </div>
              <div class="f">
                <label class="f__label" for="task-end">End</label>
                <input id="task-end" name="scheduledEndTime" type="time" class="field num" aria-describedby="time-error">
              </div>
            </div>
            <span id="time-error" class="err" hidden></span>
          </fieldset>
        </div>

        <div class="f">
          <label class="f__label" for="task-notes">Notes <span class="f__optional">(optional)</span></label>
          <textarea id="task-notes" name="notes" class="field" rows="3"></textarea>
        </div>

        <input type="hidden" name="priority" value="medium">
        <input type="hidden" name="status" value="todo">

        <div class="form-actions">
          <a class="btn" href="${from}">Cancel</a>
          <button class="btn btn--primary" type="submit">Save task</button>
        </div>
      </form>
    </div>
  `;

  connect(container.querySelector('#task-form'), from);
}

/** Wires up the form's buttons and validation. */
function connect(form, from) {
  // Segmented controls: one button pressed at a time, value kept in a hidden input
  const pickOne = (attr, field) => {
    form.querySelectorAll(`[data-${attr}]`).forEach((button) => {
      button.addEventListener('click', () => {
        form.elements[field].value = button.dataset[attr];
        form.querySelectorAll(`[data-${attr}]`).forEach((b) => {
          b.setAttribute('aria-pressed', String(b === button));
        });
      });
    });
  };
  pickOne('priority', 'priority');
  pickOne('status', 'status');

  // Today / Tomorrow / Next week fill in the due date
  form.querySelectorAll('[data-due]').forEach((button) => {
    button.addEventListener('click', () => {
      form.elements.dueDate.value = addDays(todayISO(), Number(button.dataset.due));
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault(); // stop the browser reloading the page
    if (!validate(form)) {
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    // Milestone 2 replaces this with: build a task object and save it.
    showToast('Form looks good. Saving tasks arrives in Milestone 2.');
    location.hash = from;
  });
}

/** Shows or hides one field's error. */
function setError(input, errorEl, message) {
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
    errorEl.hidden = false;
  } else {
    input.removeAttribute('aria-invalid');
    errorEl.hidden = true;
  }
}

/**
 * Checks the form. Returns true when everything is valid.
 * Rules from the brief: the title is required, and a scheduled end time
 * must be later than its start time.
 */
function validate(form) {
  const { title, scheduledDate, scheduledStartTime, scheduledEndTime } = form.elements;
  const titleError = form.querySelector('#title-error');
  const timeError = form.querySelector('#time-error');

  const titleOk = title.value.trim() !== '';
  setError(title, titleError, titleOk ? '' : titleError.textContent);

  const start = scheduledStartTime.value;
  const end = scheduledEndTime.value;
  let timeMessage = '';
  if ((start || end) && !scheduledDate.value) {
    timeMessage = 'Pick a date for the work session.';
  } else if (end && !start) {
    timeMessage = 'Add a start time too.';
  } else if (start && end && end <= start) {
    // "HH:MM" strings compare correctly as text: "15:00" < "16:00"
    timeMessage = 'The end time needs to be later than the start time.';
  }
  setError(scheduledEndTime, timeError, timeMessage);

  return titleOk && !timeMessage;
}
