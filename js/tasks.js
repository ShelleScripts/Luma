// =============================================================================
// tasks.js — the My Tasks screen.
//
// Milestone 1: the view tabs switch (All / Today / Upcoming / Completed) and
// each shows its empty state. Milestone 2 adds the task rows with edit,
// delete and completion; Milestone 5 adds search, filters and sorting.
// =============================================================================

import { icons } from './icons.js';

export const title = 'My Tasks';

const VIEWS = [
  { id: 'all', name: 'All' },
  { id: 'today', name: 'Today' },
  { id: 'upcoming', name: 'Upcoming' },
  { id: 'completed', name: 'Completed' },
];

// Remembered while you move around the app
let currentView = 'all';

export function render(container) {
  container.innerHTML = `
    <div class="page" style="gap:20px">
      <header class="page-header" style="align-items:center">
        <h1 class="h1" style="flex:1">My Tasks</h1>
        <a class="btn btn--primary" href="#/tasks/new">${icons.plus()}Add task</a>
      </header>

      <div class="tabs" role="tablist" aria-label="Task views">
        ${VIEWS.map((v) => `
          <button type="button" class="tab" role="tab" data-view="${v.id}"
                  aria-selected="${v.id === currentView}">${v.name}<span class="num muted">0</span></button>
        `).join('')}
      </div>

      <div class="list" role="tabpanel">
        <div class="empty">
          <span>${icons.check(32)}</span>
          <p>${emptyMessage()}</p>
          <a class="btn" href="#/tasks/new">Add task</a>
          <p class="small">Tip: press <kbd>N</kbd> anywhere to add a task.</p>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-view]').forEach((tab) => {
    tab.addEventListener('click', () => {
      currentView = tab.dataset.view;
      render(container);
      container.querySelector(`[data-view="${currentView}"]`).focus();
    });
  });
}

function emptyMessage() {
  if (currentView === 'today') return 'Nothing for today. Enjoy the calm, or plan something.';
  if (currentView === 'upcoming') return 'Nothing coming up yet.';
  if (currentView === 'completed') return 'Completed tasks will show up here.';
  return "No tasks here yet. Add something you'd like to get done.";
}
