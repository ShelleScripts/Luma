// =============================================================================
// courses.js — the Courses and categories screen.
//
// Milestone 1: the courses empty state, plus the five general categories
// every user starts with. Milestone 3 saves these in Local Storage and
// Milestone 5 adds creating, editing and deleting courses.
// =============================================================================

import { icons } from './icons.js';

export const title = 'Courses';

/** The general categories seeded on first run (decision 6). */
export const GENERAL_CATEGORIES = [
  { name: 'Academic', color: 'var(--accent)' },
  { name: 'Personal', color: 'var(--c-grey)' },
  { name: 'Extracurricular', color: 'var(--c-pink)' },
  { name: 'Work', color: 'var(--c-sky)' },
  { name: 'Projects', color: 'var(--green)' },
];

export function render(container) {
  container.innerHTML = `
    <div class="page" style="gap:24px">
      <header class="page-header">
        <div class="page-header__text">
          <h1 class="h1">Courses</h1>
          <p class="muted">Group your work by course, or by a category for everything else.</p>
        </div>
      </header>

      <section aria-label="Courses">
        <div class="dashed-box">
          <span>${icons.book(28)}</span>
          <p>Add your first course to start organizing your academic work.</p>
          <p class="small">Adding courses arrives in Milestone 5.</p>
        </div>
      </section>

      <section aria-labelledby="categories-heading" style="max-width:720px">
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:4px">
          <h2 class="h2" id="categories-heading">Categories</h2>
          <span class="muted small">For work that doesn't belong to a course.</span>
        </div>
        <ul class="list">
          ${GENERAL_CATEGORIES.map((c) => `
            <li class="cat-row">
              <span class="dot" style="background:${c.color}"></span>
              <span class="cat-row__name">${c.name}</span>
              <span class="num muted small">No tasks yet</span>
            </li>
          `).join('')}
        </ul>
      </section>
    </div>
  `;
}
