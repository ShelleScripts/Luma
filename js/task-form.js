// =============================================================================
// task-form.js — the task page, for both a new task and editing one.
//
//   #/tasks/new                  -> empty form, "Save task" creates a task
//   #/tasks/new?date=2026-11-20  -> same, with the work-session date filled in
//   #/tasks/new?date=...&start=09:00&end=10:00 -> and its times (planner hours)
//   #/tasks/<id>/edit            -> form filled from that task, with Delete
//
// The page never touches the data directly: it calls the store
// (addTask / updateTask / deleteTask).
// =============================================================================

import { todayISO, addDays, escapeHTML, isValidISODate, formatTimestamp } from './utils.js';
import { icons } from './icons.js';
import { showToast, confirmDialog } from './ui.js';
import {
  TASK_TYPES, PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS,
  getTask, getCategories, addTask, updateTask, deleteTask,
} from './store.js';

export const title = 'Task';

const PRIORITY_COLORS = { low: 'var(--text-3)', medium: 'var(--c-blue)', high: 'var(--amber)', urgent: 'var(--red)' };

/**
 * Draws the page. For an edit, params[0] is the task's id.
 */
export function render(container, { params, query, from }) {
  const editing = params[0] ? getTask(params[0]) : null;

  // An edit link to a task that no longer exists (deleted, or a typo)
  if (params[0] && !editing) {
    container.innerHTML = `
      <div class="page page--form">
        <h1 class="h1">Task not found</h1>
        <p class="muted">It may have been deleted.</p>
        <p><a class="btn" href="#/tasks">Go to My Tasks</a></p>
      </div>
    `;
    return;
  }

  // The values to show: the task being edited, or defaults for a new one
  const task = editing || {
    title: '', description: '', categoryId: '', taskType: 'Assignment',
    priority: 'medium', status: 'todo', dueDate: '', dueTime: '',
    scheduledDate: query.get('date') || '', scheduledStartTime: query.get('start') || '',
    scheduledEndTime: query.get('end') || '', notes: '',
  };
  document.title = `${editing ? 'Edit task' : 'New task'} · Luma`;

  // escapeHTML on everything the user typed, because it goes into innerHTML
  const v = (field) => escapeHTML(task[field] ?? '');

  container.innerHTML = `
    <div class="page page--form">
      <div>
        <a href="${from}" class="back-link">${icons.chevronLeft()}Back</a>
        <h1 class="h1">${editing ? 'Edit task' : 'New task'}</h1>
        ${editing ? `<p class="muted num form-meta">Created ${formatTimestamp(task.createdAt)} · Last updated ${formatTimestamp(task.updatedAt)}</p>` : ''}
      </div>

      <form class="form" id="task-form" novalidate>
        <div class="f">
          <label class="f__label" for="task-title">Title</label>
          <input id="task-title" name="title" class="field field--title" autocomplete="off"
                 maxlength="200" value="${v('title')}" aria-describedby="title-error" required>
          <span id="title-error" class="err" hidden></span>
        </div>

        <div class="f">
          <label class="f__label" for="task-description">Description <span class="f__optional">(optional)</span></label>
          <textarea id="task-description" name="description" class="field" rows="3">${v('description')}</textarea>
        </div>

        <div class="grid-2">
          <div class="f">
            <label class="f__label" for="task-category">Course or category</label>
            <select id="task-category" name="categoryId" class="field">
              <option value="">Uncategorized</option>
              ${categoryOptions(task.categoryId)}
            </select>
          </div>
          <div class="f">
            <label class="f__label" for="task-type">Type</label>
            <select id="task-type" name="taskType" class="field">
              ${TASK_TYPES.map((t) => `<option ${t === task.taskType ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="row-wrap">
          <div class="f">
            <span class="f__label" id="prio-label">Priority</span>
            <div class="seg" role="group" aria-labelledby="prio-label">
              ${PRIORITIES.map((p) => `
                <button type="button" data-priority="${p}" aria-pressed="${p === task.priority}">
                  <span class="dot dot--small" style="background:${PRIORITY_COLORS[p]}"></span>${PRIORITY_LABELS[p]}
                </button>`).join('')}
            </div>
          </div>
          <div class="f">
            <span class="f__label" id="status-label">Status</span>
            <div class="seg" role="group" aria-labelledby="status-label">
              ${STATUSES.map((s) => `
                <button type="button" data-status="${s}" aria-pressed="${s === task.status}">${STATUS_LABELS[s]}</button>`).join('')}
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
                <input id="task-due-date" name="dueDate" type="date" class="field num" value="${v('dueDate')}" aria-describedby="due-error">
              </div>
              <div class="f">
                <label class="f__label" for="task-due-time">Due time</label>
                <input id="task-due-time" name="dueTime" type="time" class="field num" value="${v('dueTime')}">
              </div>
            </div>
            <span id="due-error" class="err" hidden></span>
          </fieldset>

          <fieldset class="card box">
            <legend class="box__legend"><span style="color:var(--accent-soft);display:flex">${icons.calendar(16)}</span>Work session</legend>
            <p class="box__hint">When you plan to work on it. Shows in your planner.</p>
            <div class="f">
              <label class="f__label" for="task-sched-date">Date</label>
              <input id="task-sched-date" name="scheduledDate" type="date" class="field num" value="${v('scheduledDate')}">
            </div>
            <div class="grid-2">
              <div class="f">
                <label class="f__label" for="task-start">Start</label>
                <input id="task-start" name="scheduledStartTime" type="time" class="field num" value="${v('scheduledStartTime')}">
              </div>
              <div class="f">
                <label class="f__label" for="task-end">End</label>
                <input id="task-end" name="scheduledEndTime" type="time" class="field num" value="${v('scheduledEndTime')}" aria-describedby="time-error">
              </div>
            </div>
            <span id="time-error" class="err" hidden></span>
          </fieldset>
        </div>

        <div class="f">
          <label class="f__label" for="task-notes">Notes <span class="f__optional">(optional)</span></label>
          <textarea id="task-notes" name="notes" class="field" rows="3">${v('notes')}</textarea>
        </div>

        <input type="hidden" name="priority" value="${v('priority')}">
        <input type="hidden" name="status" value="${v('status')}">

        <div class="form-actions">
          ${editing ? `<button type="button" class="btn btn--ghost-danger" data-delete>${icons.trash()}Delete task</button>` : ''}
          <a class="btn" href="${from}">Cancel</a>
          <button class="btn btn--primary" type="submit">Save task</button>
        </div>
      </form>
    </div>
  `;

  connect(container.querySelector('#task-form'), editing, from);
}

/**
 * The <option>s for the category dropdown: courses first, then the general
 * categories, each in its own <optgroup> (a labelled group in the list).
 */
function categoryOptions(selectedId) {
  const option = (c) => `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${escapeHTML(c.name)}</option>`;
  const all = getCategories();
  const courses = all.filter((c) => c.kind === 'course');
  const general = all.filter((c) => c.kind !== 'course');
  return `
    ${courses.length ? `<optgroup label="Courses">${courses.map(option).join('')}</optgroup>` : ''}
    <optgroup label="Categories">${general.map(option).join('')}</optgroup>
  `;
}

/** Wires up the form's buttons, validation and saving. */
function connect(form, editing, from) {
  // Segmented controls: one button pressed at a time, value kept in a hidden input
  const pickOne = (attr) => {
    form.querySelectorAll(`[data-${attr}]`).forEach((button) => {
      button.addEventListener('click', () => {
        form.elements[attr].value = button.dataset[attr];
        form.querySelectorAll(`[data-${attr}]`).forEach((b) => {
          b.setAttribute('aria-pressed', String(b === button));
        });
      });
    });
  };
  pickOne('priority');
  pickOne('status');

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

    const fields = readForm(form);
    if (editing) {
      updateTask(editing.id, fields);
      showToast('Task updated.');
    } else {
      addTask(fields);
      showToast('Task added.');
    }
    location.hash = from;
  });

  const deleteButton = form.querySelector('[data-delete]');
  if (deleteButton) {
    deleteButton.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Delete this task?',
        message: `"${editing.title}" will be removed from every view. You can't undo this.`,
        confirmLabel: 'Delete task',
        cancelLabel: 'Keep task',
        danger: true,
      });
      if (!ok) return;
      deleteTask(editing.id);
      showToast('Task deleted.');
      location.hash = '#/tasks';
    });
  }
}

/** Collects the form's values into a plain object, ready for the store. */
function readForm(form) {
  const get = (name) => form.elements[name].value.trim();
  return {
    title: get('title'),
    description: get('description'),
    categoryId: get('categoryId'),
    taskType: get('taskType'),
    priority: get('priority'),
    status: get('status'),
    dueDate: get('dueDate'),
    dueTime: get('dueTime'),
    scheduledDate: get('scheduledDate'),
    scheduledStartTime: get('scheduledStartTime'),
    scheduledEndTime: get('scheduledEndTime'),
    notes: get('notes'),
  };
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
 * Checks the form and shows any problems. Returns true when it's valid.
 * Rules from the brief: the title is required, dates must be real dates,
 * and a work session's end time must be later than its start time.
 */
function validate(form) {
  const el = form.elements;
  const errors = [];

  // Title
  const titleMessage = el.title.value.trim() === '' ? 'Give the task a title so you can find it later.' : '';
  setError(el.title, form.querySelector('#title-error'), titleMessage);
  errors.push(titleMessage);

  // Deadline
  let dueMessage = '';
  if (el.dueDate.value && !isValidISODate(el.dueDate.value)) {
    dueMessage = "That due date isn't a real date.";
  } else if (el.dueTime.value && !el.dueDate.value) {
    dueMessage = 'Add a due date for this time, or clear the time.';
  }
  setError(el.dueDate, form.querySelector('#due-error'), dueMessage);
  errors.push(dueMessage);

  // Work session
  const start = el.scheduledStartTime.value;
  const end = el.scheduledEndTime.value;
  let timeMessage = '';
  if (el.scheduledDate.value && !isValidISODate(el.scheduledDate.value)) {
    timeMessage = "That work-session date isn't a real date.";
  } else if ((start || end) && !el.scheduledDate.value) {
    timeMessage = 'Pick a date for the work session.';
  } else if (end && !start) {
    timeMessage = 'Add a start time too.';
  } else if (start && end && end <= start) {
    // "HH:MM" strings compare correctly as text: "15:00" < "16:00"
    timeMessage = 'The end time needs to be later than the start time.';
  }
  setError(el.scheduledEndTime, form.querySelector('#time-error'), timeMessage);
  errors.push(timeMessage);

  return errors.every((message) => message === '');
}
