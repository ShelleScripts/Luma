// =============================================================================
// store.js — the one place that holds Luma's data.
//
// Every screen reads and changes tasks ONLY through the functions exported
// here (decision 15). Right now the data lives in a plain array in memory,
// so it disappears when you refresh the page. Milestone 3 changes the inside
// of this file to save to Local Storage, and no screen has to change.
//
// Whenever the data changes, the store fires a "luma:datachange" event on
// `document`, so any screen that is showing tasks can redraw itself.
// =============================================================================

import { makeId } from './utils.js';

// ---------------------------------------------------------------------------
// Fixed lists (the form's options and their labels)
// ---------------------------------------------------------------------------

export const TASK_TYPES = ['Assignment', 'Quiz', 'Examination', 'Reading', 'Project', 'Study Session', 'Personal', 'Other'];

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

export const STATUSES = ['todo', 'in-progress', 'completed'];
export const STATUS_LABELS = { todo: 'To do', 'in-progress': 'In progress', completed: 'Completed' };

// The five general categories (decision 6). Courses join this list in
// Milestone 5, with kind: "course".
const categories = [
  { id: 'academic', kind: 'general', name: 'Academic', color: 'var(--accent)' },
  { id: 'personal', kind: 'general', name: 'Personal', color: 'var(--c-grey)' },
  { id: 'extracurricular', kind: 'general', name: 'Extracurricular', color: 'var(--c-pink)' },
  { id: 'work', kind: 'general', name: 'Work', color: 'var(--c-sky)' },
  { id: 'projects', kind: 'general', name: 'Projects', color: 'var(--green)' },
];

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

let tasks = [];

/** Tells every listening screen that the data changed. */
function announceChange() {
  document.dispatchEvent(new CustomEvent('luma:datachange'));
}

/**
 * A copy of an object, so code outside the store can't change the stored
 * task by accident (it has to call updateTask instead).
 */
const copy = (task) => ({ ...task });

/** All tasks (copies). */
export function getTasks() {
  return tasks.map(copy);
}

/** One task by id, or null if there isn't one. */
export function getTask(id) {
  const task = tasks.find((t) => t.id === id);
  return task ? copy(task) : null;
}

/** All categories (copies). */
export function getCategories() {
  return categories.map((c) => ({ ...c }));
}

/** One category by id, or null for "Uncategorized" or an unknown id. */
export function getCategory(id) {
  return categories.find((c) => c.id === id) || null;
}

/**
 * Creates a task from the form's fields and returns it.
 * The store fills in id, createdAt, updatedAt and completedAt.
 */
export function addTask(fields) {
  const now = new Date().toISOString();
  const task = {
    id: makeId(),
    title: '',
    description: '',
    categoryId: '',
    taskType: 'Assignment',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    dueTime: '',
    scheduledDate: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    notes: '',
    ...fields,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
  syncCompletion(task, now);
  tasks.push(task);
  announceChange();
  return copy(task);
}

/** Changes some fields of a task. Returns the updated task, or null. */
export function updateTask(id, changes) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  const now = new Date().toISOString();
  Object.assign(task, changes, { id: task.id, createdAt: task.createdAt, updatedAt: now });
  syncCompletion(task, now);
  announceChange();
  return copy(task);
}

/** Removes a task. Returns true if it existed. */
export function deleteTask(id) {
  const before = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  const removed = tasks.length < before;
  if (removed) announceChange();
  return removed;
}

/**
 * The checkbox (decision 9): ticking sets "completed", unticking sets "todo".
 * Returns the task as it was BEFORE, so the caller can offer Undo.
 */
export function setCompleted(id, done) {
  const before = getTask(id);
  if (!before) return null;
  updateTask(id, { status: done ? 'completed' : 'todo' });
  return before;
}

/** Puts a task back exactly as it was (used by Undo). */
export function restoreTask(snapshot) {
  const index = tasks.findIndex((t) => t.id === snapshot.id);
  if (index === -1) return;
  tasks[index] = copy(snapshot);
  announceChange();
}

/**
 * Keeps status and completedAt in step: a completed task has a
 * completedAt time, and any other task has none.
 */
function syncCompletion(task, now) {
  if (task.status === 'completed') {
    task.completedAt = task.completedAt || now;
  } else {
    task.completedAt = null;
  }
}
