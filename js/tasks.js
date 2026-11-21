// =============================================================================
// tasks.js — the My Tasks screen.
//
// Lists every task with its checkbox, course, priority, due date and status,
// plus Edit and Delete. The view tabs (All / Today / Upcoming / Completed),
// the search box, the three filters and the sort all work TOGETHER: a task
// is shown only if it passes every one of them.
//
// #/tasks?category=<id> opens the list filtered to one course or category
// (the Courses screen links here).
// =============================================================================

import { icons } from './icons.js';
import { escapeHTML } from './utils.js';
import {
  getTasks, getCategories, PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS,
} from './store.js';
import {
  isDone, isToday, isUpcoming, compareByDue, compareByPriority, compareByNewest,
} from './task-helpers.js';
import { taskRow, connectTaskActions, refocus, focusedTaskId } from './task-list.js';

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

const SORTS = [
  { id: 'due', name: 'Due date', compare: compareByDue },
  { id: 'priority', name: 'Priority', compare: compareByPriority },
  { id: 'newest', name: 'Newest first', compare: compareByNewest },
];

// Your choices, remembered while you move around the app
const state = {
  view: 'all',
  search: '',
  status: '',    // '' means any
  priority: '',
  category: '',  // '' any, 'none' Uncategorized, or a category id
  sort: 'due',
};

// The element this screen is drawn into, so we can redraw it when data changes
let mounted = null;

/** True when any search or filter is narrowing the list. */
const isFiltering = () => Boolean(state.search || state.status || state.priority || state.category);

/** Does a task pass the search box and the three filters? */
function passesFilters(task) {
  if (state.search && !task.title.toLowerCase().includes(state.search.toLowerCase())) return false;
  if (state.status && task.status !== state.status) return false;
  if (state.priority && task.priority !== state.priority) return false;
  if (state.category === 'none' && task.categoryId) return false;
  if (state.category && state.category !== 'none' && task.categoryId !== state.category) return false;
  return true;
}

export function render(container, { query } = {}) {
  mounted = container;

  // A link like #/tasks?category=abc shows just that course or category
  const fromLink = query?.get('category');
  if (fromLink) {
    Object.assign(state, { view: 'all', search: '', status: '', priority: '', category: fromLink });
    // Tidy the address back to #/tasks (replaceState doesn't re-run the
    // router), so coming back later doesn't re-apply this filter
    history.replaceState(null, '', '#/tasks');
  }

  // Forget a filter for a course that has since been deleted
  const categories = getCategories();
  if (state.category && state.category !== 'none' && !categories.some((c) => c.id === state.category)) {
    state.category = '';
  }
  const courses = categories.filter((c) => c.kind === 'course');
  const general = categories.filter((c) => c.kind !== 'course');
  const option = (value, label, current) =>
    `<option value="${escapeHTML(value)}" ${value === current ? 'selected' : ''}>${label}</option>`;

  container.innerHTML = `
    <div class="page" style="gap:20px" data-screen="tasks">
      <header class="page-header" style="align-items:center">
        <div style="flex:1">
          <h1 class="h1" tabindex="-1">My Tasks</h1>
          <p class="muted num" style="margin-top:4px" id="task-summary"></p>
        </div>
        <a class="btn btn--primary" href="#/tasks/new">${icons.plus()}Add task</a>
      </header>

      <div class="toolbar" role="search">
        <label class="toolbar__search">
          <span class="visually-hidden">Search tasks by title</span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
          <input type="search" class="field" id="task-search" placeholder="Search by title" autocomplete="off" value="${escapeHTML(state.search)}">
        </label>
        <label class="toolbar__filter">
          <span class="visually-hidden">Status</span>
          <select class="field" data-filter="status">
            ${option('', 'Any status', state.status)}
            ${STATUSES.map((s) => option(s, STATUS_LABELS[s], state.status)).join('')}
          </select>
        </label>
        <label class="toolbar__filter">
          <span class="visually-hidden">Priority</span>
          <select class="field" data-filter="priority">
            ${option('', 'Any priority', state.priority)}
            ${PRIORITIES.map((p) => option(p, PRIORITY_LABELS[p], state.priority)).join('')}
          </select>
        </label>
        <label class="toolbar__filter">
          <span class="visually-hidden">Course or category</span>
          <select class="field" data-filter="category">
            ${option('', 'All courses and categories', state.category)}
            ${courses.length ? `<optgroup label="Courses">${courses.map((c) => option(c.id, escapeHTML(c.name), state.category)).join('')}</optgroup>` : ''}
            <optgroup label="Categories">
              ${general.map((c) => option(c.id, escapeHTML(c.name), state.category)).join('')}
              ${option('none', 'Uncategorized', state.category)}
            </optgroup>
          </select>
        </label>
        <label class="toolbar__filter">
          <span class="visually-hidden">Sort by</span>
          <select class="field" data-filter="sort">
            ${SORTS.map((s) => option(s.id, `Sort: ${s.name}`, state.sort)).join('')}
          </select>
        </label>
        <button type="button" class="btn btn--small" data-clear ${isFiltering() ? '' : 'hidden'}>Clear filters</button>
      </div>

      <div class="tabs" role="tablist" aria-label="Task views">
        ${VIEWS.map((v) => `
          <button type="button" class="tab" role="tab" data-view="${v.id}"
                  aria-selected="${v.id === state.view}">${v.name}<span class="num muted" data-count="${v.id}"></span></button>
        `).join('')}
      </div>

      <ul class="list" role="tabpanel" id="task-list"></ul>
    </div>
  `;

  drawList(container);
  connect(container);
}

/**
 * Redraws only the counts and the list, not the search box, so typing
 * doesn't lose your place in the box.
 */
function drawList(container) {
  const all = getTasks();
  const filtered = all.filter(passesFilters);
  const view = VIEWS.find((v) => v.id === state.view);
  const sort = SORTS.find((s) => s.id === state.sort);
  const shown = filtered.filter(view.test).sort(sort.compare);

  const open = all.filter((t) => !isDone(t)).length;
  container.querySelector('#task-summary').textContent = isFiltering()
    ? `${filtered.length} of ${all.length} tasks match`
    : `${open} open · ${all.length - open} done`;

  // The tab counts follow the search and filters too
  VIEWS.forEach((v) => {
    container.querySelector(`[data-count="${v.id}"]`).textContent = filtered.filter(v.test).length;
  });
  container.querySelectorAll('[data-view]').forEach((tab) => {
    tab.setAttribute('aria-selected', String(tab.dataset.view === state.view));
  });
  container.querySelector('[data-clear]').hidden = !isFiltering();

  const list = container.querySelector('#task-list');
  list.setAttribute('aria-label', `${view.name} tasks`);
  list.innerHTML = shown.length ? shown.map(taskRow).join('') : emptyState(all.length);
}

function emptyState(taskCount) {
  // Tasks exist, but the search or filters hide them all
  if (taskCount > 0 && isFiltering()) {
    return `
      <li class="empty">
        <span>${icons.check(32)}</span>
        <p>No tasks match your search and filters.</p>
        <button type="button" class="btn" data-clear>Clear filters</button>
      </li>
    `;
  }
  return `
    <li class="empty">
      <span>${icons.check(32)}</span>
      <p>${EMPTY_MESSAGES[state.view]}</p>
      <a class="btn" href="#/tasks/new">Add task</a>
      <p class="small">Tip: press <kbd>N</kbd> anywhere to add a task.</p>
    </li>
  `;
}

/** Wires up the search, filters, tabs and the list's buttons. */
function connect(container) {
  // "input" fires on every keystroke, so results update as you type
  container.querySelector('#task-search').addEventListener('input', (event) => {
    state.search = event.target.value.trim();
    drawList(container);
  });

  // "change" fires when you pick a different option in a dropdown
  container.querySelectorAll('[data-filter]').forEach((select) => {
    select.addEventListener('change', () => {
      state[select.dataset.filter] = select.value;
      drawList(container);
    });
  });

  container.querySelectorAll('[data-view]').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.view = tab.dataset.view;
      drawList(container);
    });
  });

  // Both "Clear filters" buttons (toolbar and empty state). The listener goes
  // on this screen's page element, not on #view which every screen shares.
  container.querySelector('[data-screen]').addEventListener('click', (event) => {
    if (!event.target.closest('[data-clear]')) return;
    Object.assign(state, { search: '', status: '', priority: '', category: '' });
    render(container);
    container.querySelector('#task-search').focus();
  });

  connectTaskActions(container.querySelector('#task-list'), container);
}

// When the store says the data changed (complete, undo, delete), redraw the
// list, but only if this screen is still the one on show.
document.addEventListener('luma:datachange', () => {
  if (mounted && mounted.querySelector('[data-screen="tasks"]')) {
    const focusedId = focusedTaskId(mounted);
    drawList(mounted);
    if (focusedId) refocus(mounted, focusedId);
  }
});
