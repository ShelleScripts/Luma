// =============================================================================
// courses.js — the Courses and categories screen.
//
// Courses are shown as cards. You can add, edit and delete them, and each
// card shows its progress and links to its tasks. Adding and editing happen
// in a <dialog> form. Deleting a course keeps its tasks: they move to
// Uncategorized (decision 7), and the confirm dialog says how many.
//
// Below the courses are the five general categories, for everything that
// doesn't belong to a course.
// =============================================================================

import { icons } from './icons.js';
import { escapeHTML } from './utils.js';
import { showToast, confirmDialog } from './ui.js';
import {
  getTasks, getCourses, getCategories, getCategory, addCourse, updateCourse, deleteCourse, COURSE_COLORS,
} from './store.js';
import { isDone } from './task-helpers.js';

export const title = 'Courses';

// The element this screen is drawn into, so it can redraw when data changes
let mounted = null;

export function render(container) {
  mounted = container;
  const tasks = getTasks();
  const courses = getCourses();
  const general = getCategories().filter((c) => c.kind !== 'course');

  /** Open and done task counts for one category id. */
  const countFor = (id) => {
    const mine = tasks.filter((t) => t.categoryId === id);
    const done = mine.filter(isDone).length;
    return { total: mine.length, done, open: mine.length - done };
  };

  container.innerHTML = `
    <div class="page" style="gap:24px" data-screen="courses">
      <header class="page-header" style="align-items:center">
        <div class="page-header__text">
          <h1 class="h1" tabindex="-1">Courses</h1>
          <p class="muted">Group your work by course, or by a category for everything else.</p>
        </div>
        <button type="button" class="btn btn--primary" data-add-course>${icons.plus()}Add course</button>
      </header>

      <section aria-labelledby="courses-heading">
        <h2 class="visually-hidden" id="courses-heading">Your courses</h2>
        ${courses.length ? `
          <ul class="course-grid">
            ${courses.map((c) => courseCard(c, countFor(c.id))).join('')}
          </ul>` : `
          <div class="dashed-box">
            <span>${icons.book(28)}</span>
            <p>Add your first course to start organizing your academic work.</p>
            <button type="button" class="btn" data-add-course>${icons.plus()}Add course</button>
          </div>`}
      </section>

      <section aria-labelledby="categories-heading" style="max-width:720px">
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:4px">
          <h2 class="h2" id="categories-heading">Categories</h2>
          <span class="muted small">For work that doesn't belong to a course.</span>
        </div>
        <ul class="list">
          ${general.map((c) => categoryRow(c, countFor(c.id))).join('')}
          ${categoryRow({ id: 'none', name: 'Uncategorized', color: 'var(--c-grey)' }, countFor(''), true)}
        </ul>
      </section>
    </div>
  `;

  connect(container);
}

/** "3 open · 2 done", or "No tasks yet". */
function countLabel({ total, open, done }) {
  return total ? `${open} open · ${done} done` : 'No tasks yet';
}

/** One course card: colour edge, name, code, description, progress, actions. */
function courseCard(course, counts) {
  const name = escapeHTML(course.name);
  const pct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;
  return `
    <li class="course-card" style="--course-color:${course.color}" data-course="${course.id}">
      <div class="course-card__head">
        <span class="dot" style="background:${course.color}"></span>
        <h3 class="course-card__name">${name}</h3>
        ${course.code ? `<span class="course-card__code num">${escapeHTML(course.code)}</span>` : ''}
      </div>
      ${course.description ? `<p class="course-card__desc">${escapeHTML(course.description)}</p>` : ''}
      <div class="course-card__progress">
        <span class="num muted small">${countLabel(counts)}</span>
        <span class="bar" aria-hidden="true"><span class="bar__fill" style="width:${pct}%;background:${course.color}"></span></span>
      </div>
      <div class="course-card__actions">
        <a class="btn btn--small" href="#/tasks?category=${course.id}">View tasks</a>
        <button type="button" class="icon-btn" data-edit-course aria-label="Edit ${name}">${icons.pencil()}</button>
        <button type="button" class="icon-btn" data-delete-course aria-label="Delete ${name}">${icons.trash()}</button>
      </div>
    </li>
  `;
}

/** One general category (or Uncategorized), linking to its tasks. */
function categoryRow(category, counts) {
  return `
    <li>
      <a class="cat-row" href="#/tasks?category=${category.id}">
        <span class="dot" style="background:${category.color}"></span>
        <span class="cat-row__name">${escapeHTML(category.name)}</span>
        <span class="num muted small">${countLabel(counts)}</span>
        <span class="muted" aria-hidden="true">${icons.chevronRight()}</span>
      </a>
    </li>
  `;
}

/** Wires up Add, Edit and Delete. */
function connect(container) {
  // Listen on this screen's own page element (not #view, which every screen
  // shares), so the listener disappears when the screen is redrawn
  container.querySelector('[data-screen]').addEventListener('click', async (event) => {
    if (event.target.closest('[data-add-course]')) {
      openCourseDialog(null);
      return;
    }

    const card = event.target.closest('[data-course]');
    if (!card) return;
    const course = getCategory(card.dataset.course);

    if (event.target.closest('[data-edit-course]')) {
      openCourseDialog(course);
    }

    if (event.target.closest('[data-delete-course]')) {
      const count = getTasks().filter((t) => t.categoryId === course.id).length;
      const ok = await confirmDialog({
        title: `Delete ${course.name}?`,
        message: count
          ? `Its ${count} ${count === 1 ? 'task' : 'tasks'} will be kept and moved to Uncategorized.`
          : "It has no tasks, so nothing else changes.",
        confirmLabel: 'Delete course',
        cancelLabel: 'Keep course',
        danger: true,
      });
      if (!ok) return;
      const moved = deleteCourse(course.id);
      showToast(moved ? `Course deleted. ${moved} ${moved === 1 ? 'task' : 'tasks'} moved to Uncategorized.` : 'Course deleted.');
      container.querySelector('h1').focus();
    }
  });
}

/**
 * The Add / Edit course form, in a <dialog>. For an edit, `course` is the
 * course being changed; for a new one it's null.
 */
function openCourseDialog(course) {
  const editing = Boolean(course);
  const values = course || { name: '', code: '', description: '', color: COURSE_COLORS[0].value };
  const opener = document.activeElement; // to give focus back afterwards

  const dialog = document.createElement('dialog');
  dialog.className = 'modal modal--form';
  dialog.setAttribute('aria-labelledby', 'course-dialog-title');
  dialog.innerHTML = `
    <form method="dialog" class="form" novalidate style="gap:16px">
      <h2 class="modal__title" id="course-dialog-title">${editing ? 'Edit course' : 'Add course'}</h2>

      <div class="f">
        <label class="f__label" for="course-name">Course name</label>
        <input id="course-name" name="name" class="field" maxlength="60" autocomplete="off"
               value="${escapeHTML(values.name)}" aria-describedby="course-name-error" required>
        <span id="course-name-error" class="err" hidden></span>
      </div>

      <div class="f">
        <label class="f__label" for="course-code">Course code <span class="f__optional">(optional)</span></label>
        <input id="course-code" name="code" class="field num" maxlength="20" autocomplete="off"
               placeholder="e.g. CS 101" value="${escapeHTML(values.code)}">
      </div>

      <div class="f">
        <label class="f__label" for="course-description">Description <span class="f__optional">(optional)</span></label>
        <textarea id="course-description" name="description" class="field" rows="2" maxlength="200">${escapeHTML(values.description)}</textarea>
      </div>

      <fieldset class="f">
        <legend class="f__label" style="margin-bottom:6px">Colour</legend>
        <div class="swatches">
          ${COURSE_COLORS.map((c) => `
            <label class="swatch" style="--swatch:${c.value}">
              <input type="radio" name="color" value="${c.value}" ${c.value === values.color ? 'checked' : ''}>
              <span class="visually-hidden">${c.name}</span>
            </label>`).join('')}
        </div>
      </fieldset>

      <div class="modal__actions" style="margin-top:4px">
        <button type="button" class="btn" data-cancel>Cancel</button>
        <button type="submit" class="btn btn--primary">${editing ? 'Save changes' : 'Add course'}</button>
      </div>
    </form>
  `;

  const form = dialog.querySelector('form');
  const nameInput = form.elements.name;
  const nameError = dialog.querySelector('#course-name-error');

  form.addEventListener('submit', (event) => {
    event.preventDefault(); // we close the dialog ourselves once it's valid
    const name = nameInput.value.trim();

    // Validation: a name is required, and two courses can't share one
    let message = '';
    if (!name) {
      message = 'Give the course a name.';
    } else if (getCategories().some((c) => c.id !== course?.id && c.name.toLowerCase() === name.toLowerCase())) {
      message = 'You already have a course or category with that name.';
    }
    if (message) {
      nameInput.setAttribute('aria-invalid', 'true');
      nameError.textContent = message;
      nameError.hidden = false;
      nameInput.focus();
      return;
    }

    const fields = {
      name,
      code: form.elements.code.value,
      description: form.elements.description.value,
      color: form.elements.color.value,
    };
    if (editing) {
      updateCourse(course.id, fields);
      showToast('Course updated.');
    } else {
      addCourse(fields);
      showToast('Course added. You can pick it on any task now.');
    }
    dialog.close();
  });

  dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close(); // backdrop click
  });
  dialog.addEventListener('close', () => {
    dialog.remove();
    // Focus goes back to the button that opened the dialog, if it's still
    // there, otherwise to the page heading (the screen may have redrawn)
    if (opener && document.body.contains(opener)) opener.focus();
    else document.querySelector('#view h1')?.focus();
  });

  document.body.append(dialog);
  dialog.showModal();
  nameInput.focus();
}

// Redraw when data changes (a course added, edited, deleted, or tasks
// changed in another tab), if this screen is on show
document.addEventListener('luma:datachange', () => {
  if (mounted && mounted.querySelector('[data-screen="courses"]')) render(mounted);
});
