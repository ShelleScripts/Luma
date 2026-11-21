// =============================================================================
// tasks.js — the My Tasks screen.
//
// Milestone 2: lists every task with its checkbox, course, priority, due
// date and status, plus Edit and Delete. The view tabs (All / Today /
// Upcoming / Completed) filter the list. Search, filters and sorting
// choices arrive in Milestone 5; for now the list is sorted by due date.
// =============================================================================

import { icons } from './icons.js';
import { escapeHTML } from './utils.js';
import { showToast, confirmDialog } from './ui.js';
import {
  getTasks, getCategory, setCompleted, restoreTask, deleteTask,
  PRIORITY_LABELS, STATUS_LABELS,
} from './store.js';
import { isDone, isToday, isUpcoming, isOverdue, dueLabel, compareByDue } from './task-helpers.js';

export const title = 'My Tasks';

const VIEWS = [
  { id: 'all', name: 'All', test: () => true },
  { id: 'today', name: 'Today', test: (t) => isToday(t) },
  { id: 'upcoming', name: 'Upcoming', test: (t) => isUpcoming(t) },
  { id: 'completed', name: 'Completed', test: (t) => isDone(t) },
];

const EMPTY_MESSAGES = {
  all: "No tasks here yet. Add something you'd like to get done.",
  today: 'Nothing for today. Enjoy the calm, or plan something.',
  upcoming: 'Nothing coming up yet.',
  completed: 'Completed tasks will show up here.',
};

// Remembered while you move around the app
let currentView = 'all';

// The element this screen is drawn into, so we can redraw it when data changes
let mounted = null;

export function render(container) {
  mounted = container;
  const all = getTasks();
  const view = VIEWS.find((v) => v.id === currentView);
  const shown = all.filter(view.test).sort(compareByDue);

  container.innerHTML = `
    <div class="page" style="gap:20px" data-screen="tasks">
      <header class="page-header" style="align-items:center">
        <div style="flex:1">
          <h1 class="h1" tabindex="-1">My Tasks</h1>
          <p class="muted num" style="margin-top:4px">${all.filter((t) => !isDone(t)).length} open · ${all.filter(isDone).length} done</p>
        </div>
        <a class="btn btn--primary" href="#/tasks/new">${icons.plus()}Add task</a>
      </header>

      <div class="tabs" role="tablist" aria-label="Task views">
        ${VIEWS.map((v) => `
          <button type="button" class="tab" role="tab" data-view="${v.id}"
                  aria-selected="${v.id === currentView}">${v.name}<span class="num muted">${all.filter(v.test).length}</span></button>
        `).join('')}
      </div>

      <ul class="list" role="tabpanel" aria-label="${view.name} tasks">
        ${shown.length ? shown.map(taskRow).join('') : emptyState()}
      </ul>
    </div>
  `;

  connect(container);
}

/** The HTML for one task. Everything the user typed goes through escapeHTML. */
function taskRow(task) {
  const done = isDone(task);
  const name = escapeHTML(task.title);
  const category = getCategory(task.categoryId);
  const overdue = isOverdue(task);

  let dueClass = '';
  if (overdue) dueClass = 'task-row__due--overdue';
  else if (!task.dueDate) dueClass = 'task-row__due--none';

  return `
    <li class="task-row ${done ? 'task-row--done' : ''}" data-id="${task.id}">
      <button type="button" class="checkbox" role="checkbox" aria-checked="${done}"
              aria-label="Completed: ${name}" data-toggle>${done ? icons.tick() : ''}</button>
      <a class="task-row__main" href="#/tasks/${task.id}/edit">
        <span class="task-row__title">${name}</span>
        <span class="task-row__type">${escapeHTML(task.taskType)}</span>
      </a>
      <span class="chip task-row__course">
        <span class="dot" style="background:${category ? category.color : 'var(--c-grey)'}"></span>
        <span>${category ? escapeHTML(category.name) : 'Uncategorized'}</span>
      </span>
      <span class="priority">${icons.priority(task.priority)}${PRIORITY_LABELS[task.priority]}</span>
      <span class="task-row__due ${dueClass}">${overdue ? 'Overdue · ' : ''}${dueLabel(task)}</span>
      <span class="task-row__status"><span class="status status--${task.status}">${STATUS_LABELS[task.status]}</span></span>
      <span class="task-row__actions">
        <a class="icon-btn" href="#/tasks/${task.id}/edit" aria-label="Edit ${name}">${icons.pencil()}</a>
        <button type="button" class="icon-btn" aria-label="Delete ${name}" data-delete>${icons.trash()}</button>
      </span>
    </li>
  `;
}

function emptyState() {
  return `
    <li class="empty">
      <span>${icons.check(32)}</span>
      <p>${EMPTY_MESSAGES[currentView]}</p>
      <a class="btn" href="#/tasks/new">Add task</a>
      <p class="small">Tip: press <kbd>N</kbd> anywhere to add a task.</p>
    </li>
  `;
}

/** Wires up the tabs and each row's buttons. */
function connect(container) {
  container.querySelectorAll('[data-view]').forEach((tab) => {
    tab.addEventListener('click', () => {
      currentView = tab.dataset.view;
      render(container);
      container.querySelector(`[data-view="${currentView}"]`).focus();
    });
  });

  // One listener on the list handles every row ("event delegation")
  container.querySelector('.list').addEventListener('click', async (event) => {
    const row = event.target.closest('[data-id]');
    if (!row) return;
    const id = row.dataset.id;

    if (event.target.closest('[data-toggle]')) {
      const nowDone = row.querySelector('[data-toggle]').getAttribute('aria-checked') !== 'true';
      const before = setCompleted(id, nowDone); // the store redraws this screen
      refocus(container, id, '[data-toggle]');
      showToast(nowDone ? 'Task completed.' : 'Task reopened.', {
        action: { label: 'Undo', onClick: () => restoreTask(before) },
      });
    }

    if (event.target.closest('[data-delete]')) {
      const task = getTasks().find((t) => t.id === id);
      const ok = await confirmDialog({
        title: 'Delete this task?',
        message: `"${task.title}" will be removed from every view. You can't undo this.`,
        confirmLabel: 'Delete task',
        cancelLabel: 'Keep task',
        danger: true,
      });
      if (!ok) return;
      deleteTask(id);
      showToast('Task deleted.');
      container.querySelector('h1').focus();
    }
  });
}

/**
 * After a redraw the old buttons are gone, so put keyboard focus back on the
 * same button in the new row (if the task is still in this view).
 */
function refocus(container, id, selector) {
  const row = container.querySelector(`[data-id="${CSS.escape(id)}"]`);
  const target = row ? row.querySelector(selector) : container.querySelector('h1');
  if (target) target.focus();
}

// When the store says the data changed (complete, undo, delete), redraw this
// screen, but only if it's still the one on screen.
document.addEventListener('luma:datachange', () => {
  if (mounted && mounted.querySelector('[data-screen="tasks"]')) {
    const focusedId = document.activeElement?.closest('[data-id]')?.dataset.id;
    render(mounted);
    if (focusedId) refocus(mounted, focusedId, '[data-toggle]');
  }
});
