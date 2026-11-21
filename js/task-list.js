// =============================================================================
// task-list.js — pieces shared by every list of tasks (My Tasks and the
// Dashboard's "Today's tasks"):
//
//   taskRow(task)              the HTML for one full task row
//   connectTaskActions(list)   makes the rows' checkbox and delete work
//   refocus(container, id)     puts keyboard focus back after a redraw
// =============================================================================

import { icons } from './icons.js';
import { escapeHTML } from './utils.js';
import { showToast, confirmDialog } from './ui.js';
import { getTask, getCategory, setCompleted, restoreTask, deleteTask, PRIORITY_LABELS, STATUS_LABELS } from './store.js';
import { isDone, isOverdue, dueLabel } from './task-helpers.js';

/** The coloured chip for a task's course or category. */
export function categoryChip(task) {
  const category = getCategory(task.categoryId);
  return `
    <span class="chip task-row__course">
      <span class="dot" style="background:${category ? category.color : 'var(--c-grey)'}"></span>
      <span>${category ? escapeHTML(category.name) : 'Uncategorized'}</span>
    </span>
  `;
}

/** The completion checkbox. It's a <button role="checkbox"> so it works with keys. */
export function checkbox(task) {
  const done = isDone(task);
  return `
    <button type="button" class="checkbox" role="checkbox" aria-checked="${done}"
            aria-label="Completed: ${escapeHTML(task.title)}" data-toggle>${done ? icons.tick() : ''}</button>
  `;
}

/** The HTML for one task. Everything the user typed goes through escapeHTML. */
export function taskRow(task) {
  const done = isDone(task);
  const name = escapeHTML(task.title);
  const overdue = isOverdue(task);

  let dueClass = '';
  if (overdue) dueClass = 'task-row__due--overdue';
  else if (!task.dueDate) dueClass = 'task-row__due--none';

  return `
    <li class="task-row ${done ? 'task-row--done' : ''}" data-id="${task.id}">
      ${checkbox(task)}
      <a class="task-row__main" href="#/tasks/${task.id}/edit">
        <span class="task-row__title">${name}</span>
        <span class="task-row__type">${escapeHTML(task.taskType)}</span>
      </a>
      ${categoryChip(task)}
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

/**
 * One listener on the list handles every row's checkbox and delete button
 * ("event delegation"). The store then fires luma:datachange and the screen
 * redraws itself, so this code never edits the rows directly.
 */
export function connectTaskActions(list, container) {
  list.addEventListener('click', async (event) => {
    const row = event.target.closest('[data-id]');
    if (!row) return;
    const id = row.dataset.id;

    if (event.target.closest('[data-toggle]')) {
      const nowDone = row.querySelector('[data-toggle]').getAttribute('aria-checked') !== 'true';
      const before = setCompleted(id, nowDone);
      refocus(container, id);
      showToast(nowDone ? 'Task completed.' : 'Task reopened.', {
        action: { label: 'Undo', onClick: () => restoreTask(before) },
      });
    }

    if (event.target.closest('[data-delete]')) {
      const task = getTask(id);
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
 * same task's checkbox (or the heading, if the task left this list).
 */
export function refocus(container, id) {
  const row = container.querySelector(`[data-id="${CSS.escape(id)}"]`);
  const target = row ? row.querySelector('[data-toggle]') : container.querySelector('h1');
  if (target) target.focus();
}

/** The id of the task whose row has keyboard focus, if any. */
export function focusedTaskId(container) {
  const el = document.activeElement;
  return container.contains(el) ? el.closest('[data-id]')?.dataset.id : undefined;
}
