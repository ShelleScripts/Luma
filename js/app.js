// =============================================================================
// app.js — the entry point. index.html loads only this file; it imports
// everything else.
//
// It does three jobs:
//   1. Hash routing: shows the right screen for the part of the URL after #.
//   2. Keeps the sidebar and bottom tab bar highlighting the current screen.
//   3. Connects the theme buttons and the N keyboard shortcut.
// =============================================================================

// "import * as dashboard" collects everything dashboard.js exports
// (its `title` and `render`) into one object called `dashboard`.
import * as dashboard from './dashboard.js';
import * as tasks from './tasks.js';
import * as taskForm from './task-form.js';
import * as planner from './planner.js';
import * as deadlines from './deadlines.js';
import * as courses from './courses.js';
import * as settings from './settings.js';
import { initTheme, toggleTheme } from './theme.js';
import { escapeHTML } from './utils.js';

// Which screen belongs to which hash: "#/tasks" -> tasks, "#/tasks/new" -> taskForm
const routes = {
  dashboard,
  tasks,
  'tasks/new': taskForm,
  planner,
  deadlines,
  courses,
  settings,
};
const DEFAULT_ROUTE = 'dashboard';

const view = document.getElementById('view');
let previousHash = ''; // where you were before, so a form's Cancel can go back

/**
 * Splits the hash into its parts.
 * "#/tasks/new?date=2026-11-20" -> { parts: ["tasks", "new"], query: URLSearchParams }
 */
function readHash() {
  const [path, queryString = ''] = location.hash.replace(/^#\/?/, '').split('?');
  return {
    parts: path.split('/').filter(Boolean),
    query: new URLSearchParams(queryString),
  };
}

/** Reads the hash and draws that screen. */
function router() {
  const { parts, query } = readHash();

  // Try the longest match first: "tasks/new" before "tasks"
  const twoPart = parts.slice(0, 2).join('/');
  const key = routes[twoPart] ? twoPart : parts[0];
  const screen = routes[key];

  // Unknown or missing hash: go to the dashboard. replace() swaps the URL
  // without adding an extra entry to the Back button history.
  if (!screen) {
    location.replace(`#/${DEFAULT_ROUTE}`);
    return;
  }

  // Where "Back" and "Cancel" should go: the last screen, but never a form
  const from = previousHash && !previousHash.startsWith('#/tasks/new') ? previousHash : '#/tasks';

  const used = key.split('/').length;
  screen.render(view, {
    params: parts.slice(used), // anything after the route, e.g. "today"
    query,                     // anything after "?", e.g. date=...
    from: escapeHTML(from),
  });
  document.title = `${screen.title} · Luma`;
  highlightNav(parts[0]);
  previousHash = location.hash;

  // Move focus to the new heading so keyboard and screen-reader users
  // know the page changed.
  window.scrollTo(0, 0);
  const heading = view.querySelector('h1');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}

/** Sets aria-current="page" on the links for the current screen. */
function highlightNav(name) {
  document.querySelectorAll('[data-route]').forEach((link) => {
    if (link.dataset.route === name) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

/** True when the user is typing in a field, so "N" should type an N. */
function isTyping(target) {
  return target.closest('input, textarea, select, [contenteditable="true"]') !== null;
}

function init() {
  initTheme();

  // One listener handles every theme button, sidebar and top bar alike.
  // This is "event delegation".
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="toggle-theme"]')) toggleTheme();
  });

  // N opens a new task (unless you're typing)
  document.addEventListener('keydown', (event) => {
    const plainKey = !event.ctrlKey && !event.metaKey && !event.altKey;
    if (event.key.toLowerCase() === 'n' && plainKey && !isTyping(event.target)) {
      event.preventDefault();
      location.hash = '#/tasks/new';
    }
  });

  // Re-route whenever the hash changes (clicking a link, Back, Forward)
  window.addEventListener('hashchange', router);
  router();
}

init();
