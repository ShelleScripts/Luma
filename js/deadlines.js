// =============================================================================
// deadlines.js — the Deadlines screen: Overdue, Due soon and Upcoming.
//
// Milestone 1: the three groups open and close, each showing its empty
// state. Milestone 4 sorts real tasks into them.
// =============================================================================

import { icons } from './icons.js';

export const title = 'Deadlines';

const GROUPS = [
  { id: 'overdue', name: 'Overdue', color: 'var(--red)', hint: 'Still open. Status is never changed for you.' },
  { id: 'soon', name: 'Due soon', color: 'var(--amber)', hint: 'Next 7 days' },
  { id: 'upcoming', name: 'Upcoming', color: 'var(--text-3)', hint: 'More than 7 days away' },
];

// Which groups are open, remembered while you move around the app
const open = { overdue: true, soon: true, upcoming: true };

export function render(container) {
  container.innerHTML = `
    <div class="page page--narrow" style="gap:20px">
      <header class="page-header">
        <div class="page-header__text">
          <h1 class="h1">Deadlines</h1>
          <p class="muted">Everything you still need to hand in, soonest first.</p>
        </div>
        <div class="page-header__actions">
          ${GROUPS.map((g) => `
            <span class="chip"><span class="dot" style="background:${g.color}"></span><span class="num" style="font-weight:600">0</span><span class="muted">${g.name.toLowerCase()}</span></span>
          `).join('')}
        </div>
      </header>

      ${GROUPS.map((g) => `
        <section aria-label="${g.name}" style="display:flex;flex-direction:column;gap:4px">
          <button type="button" class="group-head" data-group="${g.id}"
                  aria-expanded="${open[g.id]}" aria-controls="group-${g.id}">
            ${icons.chevronDown()}
            <span class="dot" style="background:${g.color}"></span>${g.name}<span class="num muted" style="font-weight:400">0</span>
            <span class="group-head__hint">${g.hint}</span>
          </button>
          <div class="group-body muted" id="group-${g.id}" ${open[g.id] ? '' : 'hidden'}>
            ${g.id === 'soon' ? "You're all caught up. No upcoming deadlines!" : 'Nothing here.'}
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
