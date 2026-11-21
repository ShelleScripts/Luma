// =============================================================================
// deadlines.js — the Deadlines screen: Overdue, Due soon and Upcoming.
//
// Only open tasks with a due date appear here, soonest first. A passed
// deadline never changes a task's status (decision 8): it just shows in
// Overdue until you complete it or move the date.
// =============================================================================

import { icons } from './icons.js';
import { escapeHTML, formatShortDate } from './utils.js';
import { getTasks, getCategory, PRIORITY_LABELS, STATUS_LABELS } from './store.js';
import { deadlineGroup, relativeDue, compareByDue } from './task-helpers.js';

export const title = 'Deadlines';

const GROUPS = [
  { id: 'overdue', name: 'Overdue', color: 'var(--red)', hint: 'Still open. Status is never changed for you.', empty: 'Nothing overdue.' },
  { id: 'soon', name: 'Due soon', color: 'var(--amber)', hint: 'Next 7 days', empty: 'Nothing due in the next 7 days.' },
  { id: 'upcoming', name: 'Upcoming', color: 'var(--text-3)', hint: 'More than 7 days away', empty: 'Nothing further ahead yet.' },
];

// Which groups are open, remembered while you move around the app
const open = { overdue: true, soon: true, upcoming: true };

// The element this screen is drawn into, so it can redraw when data changes
let mounted = null;

export function render(container) {
  mounted = container;

  // Sort every open task with a deadline into its group
  const grouped = { overdue: [], soon: [], upcoming: [] };
  getTasks().sort(compareByDue).forEach((task) => {
    const group = deadlineGroup(task);
    if (group) grouped[group].push(task);
  });
  const total = grouped.overdue.length + grouped.soon.length + grouped.upcoming.length;

  container.innerHTML = `
    <div class="page page--narrow" style="gap:20px" data-screen="deadlines">
      <header class="page-header">
        <div class="page-header__text">
          <h1 class="h1" tabindex="-1">Deadlines</h1>
          <p class="muted">Everything you still need to hand in, soonest first.</p>
        </div>
        <div class="page-header__actions">
          ${GROUPS.map((g) => `
            <span class="chip"><span class="dot" style="background:${g.color}"></span><span class="num" style="font-weight:600">${grouped[g.id].length}</span><span class="muted">${g.name.toLowerCase()}</span></span>
          `).join('')}
        </div>
      </header>

      ${total === 0 ? `
        <div class="empty">
          <span>${icons.clock(32)}</span>
          <p>You're all caught up. No upcoming deadlines!</p>
          <a class="btn" href="#/tasks/new">Add task</a>
        </div>` : GROUPS.map((g) => `
        <section aria-label="${g.name}" style="display:flex;flex-direction:column;gap:4px">
          <button type="button" class="group-head" data-group="${g.id}"
                  aria-expanded="${open[g.id]}" aria-controls="group-${g.id}">
            ${icons.chevronDown()}
            <span class="dot" style="background:${g.color}"></span>${g.name}<span class="num muted" style="font-weight:400">${grouped[g.id].length}</span>
            <span class="group-head__hint">${g.hint}</span>
          </button>
          <div id="group-${g.id}" ${open[g.id] ? '' : 'hidden'}>
            ${grouped[g.id].length
              ? `<ul class="deadline-list">${grouped[g.id].map((t) => deadlineRow(t, g.id)).join('')}</ul>`
              : `<p class="group-body muted">${g.empty}</p>`}
          </div>
        </section>
      `).join('')}
    </div>
  `;

  container.querySelectorAll('[data-group]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.group;
      open[id] = !open[id];
      button.setAttribute('aria-expanded', String(open[id]));
      container.querySelector(`#group-${id}`).hidden = !open[id];
    });
  });
}

/**
 * One deadline. The whole row links to the task, and shows its title,
 * course or category, date, priority and status.
 */
function deadlineRow(task, group) {
  const category = getCategory(task.categoryId);
  return `
    <li>
      <a class="deadline-row deadline-row--${group}" href="#/tasks/${task.id}/edit">
        <span class="deadline-row__main">
          <span class="deadline-row__title">${escapeHTML(task.title)}</span>
          <span class="deadline-row__meta">
            <span class="dot dot--small" style="background:${category ? category.color : 'var(--c-grey)'}"></span>
            ${category ? escapeHTML(category.name) : 'Uncategorized'}
            <span aria-hidden="true">·</span>
            <span class="priority" style="width:auto">${icons.priority(task.priority)}${PRIORITY_LABELS[task.priority]}</span>
          </span>
        </span>
        <span class="deadline-row__when">
          <span class="deadline-row__date num">${formatShortDate(task.dueDate)}${task.dueTime ? `, ${task.dueTime}` : ''}</span>
          <span class="deadline-row__rel">${relativeDue(task)}</span>
        </span>
        <span class="status status--${task.status}">${STATUS_LABELS[task.status]}</span>
      </a>
    </li>
  `;
}

// Redraw when tasks change (e.g. edited in another tab), if still on screen
document.addEventListener('luma:datachange', () => {
  if (mounted && mounted.querySelector('[data-screen="deadlines"]')) render(mounted);
});
