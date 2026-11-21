// =============================================================================
// store.js — the one place that holds Luma's data.
//
// Every screen reads and changes tasks ONLY through the functions exported
// here (decision 15). The data lives in memory while the app runs, and
// after every change the store saves it to Local Storage (through
// storage.js), so it is still there after a refresh. When the app starts,
// the store loads the saved data and checks every record, so damaged or
// half-finished data can't break the screens.
//
// Whenever the data changes, the store fires a "luma:datachange" event on
// `document`, so any screen that is showing tasks can redraw itself.
// =============================================================================

import { makeId, isValidISODate } from './utils.js';
import { loadData, saveData, backupCorrupt, STORAGE_KEY } from './storage.js';

// ---------------------------------------------------------------------------
// Fixed lists (the form's options and their labels)
// ---------------------------------------------------------------------------

export const TASK_TYPES = ['Assignment', 'Quiz', 'Examination', 'Reading', 'Project', 'Study Session', 'Personal', 'Other'];

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

export const STATUSES = ['todo', 'in-progress', 'completed'];
export const STATUS_LABELS = { todo: 'To do', 'in-progress': 'In progress', completed: 'Completed' };

// The five general categories (decision 6), added on the first visit.
// Courses join this list in Milestone 5, with kind: "course".
const DEFAULT_CATEGORIES = [
  { id: 'academic', kind: 'general', name: 'Academic', color: 'var(--accent)' },
  { id: 'personal', kind: 'general', name: 'Personal', color: 'var(--c-grey)' },
  { id: 'extracurricular', kind: 'general', name: 'Extracurricular', color: 'var(--c-pink)' },
  { id: 'work', kind: 'general', name: 'Work', color: 'var(--c-sky)' },
  { id: 'projects', kind: 'general', name: 'Projects', color: 'var(--green)' },
];

// The colours a course can have (CSS variables from style.css)
export const COURSE_COLORS = [
  { value: 'var(--c-blue)', name: 'Blue' },
  { value: 'var(--c-purple)', name: 'Purple' },
  { value: 'var(--c-teal)', name: 'Teal' },
  { value: 'var(--c-orange)', name: 'Orange' },
  { value: 'var(--c-pink)', name: 'Pink' },
  { value: 'var(--c-sky)', name: 'Sky' },
  { value: 'var(--c-grey)', name: 'Grey' },
];
const COLOR_VALUES = COURSE_COLORS.map((c) => c.value);

const DEFAULT_SETTINGS = { displayName: '' };

// ---------------------------------------------------------------------------
// The data, held in memory while the app runs
// ---------------------------------------------------------------------------

let tasks = [];
let categories = [];
let settings = { ...DEFAULT_SETTINGS };

// A message for the user if the saved data couldn't be read (shown by app.js)
let loadProblem = null;

/** Fills the in-memory data from Local Storage. Runs once at start-up. */
function load() {
  const result = loadData();

  if (result.status === 'unavailable') {
    loadProblem = "This browser isn't letting Luma save. Your changes will be lost when you close the page.";
  } else if (result.status === 'corrupt') {
    backupCorrupt(result.raw);
    loadProblem = "Your saved data couldn't be read, so Luma started fresh. A copy of the old data was kept.";
  }

  const data = result.status === 'ok' ? result.data : {};
  const cleaned = cleanTasks(data.tasks);
  tasks = cleaned.tasks;
  categories = cleanCategories(data.categories);
  settings = { ...DEFAULT_SETTINGS, ...cleanSettings(data.settings) };

  if (cleaned.dropped > 0 && !loadProblem) {
    loadProblem = `${cleaned.dropped} saved ${cleaned.dropped === 1 ? 'task was' : 'tasks were'} damaged and couldn't be loaded.`;
  }

  // Save straight away on a first visit, so the default categories are stored
  if (result.status === 'empty') persist();
}

/** Writes the in-memory data to Local Storage. */
function persist() {
  const ok = saveData({ tasks, categories, settings });
  if (!ok) {
    document.dispatchEvent(new CustomEvent('luma:savefailed'));
  }
}

/** Saves, then tells every listening screen that the data changed. */
function announceChange() {
  persist();
  document.dispatchEvent(new CustomEvent('luma:datachange'));
}

/** The start-up problem message, or null if loading went fine. */
export function getLoadProblem() {
  return loadProblem;
}

// If Luma is open in two tabs, a change in one tab updates the other.
// The "storage" event fires only in the OTHER tabs, never the one that saved.
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  load();
  document.dispatchEvent(new CustomEvent('luma:datachange'));
});

// ---------------------------------------------------------------------------
// Checking loaded data. Anything we can't trust is fixed or left out.
// ---------------------------------------------------------------------------

const isText = (value) => typeof value === 'string';
const isTime = (value) => isText(value) && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

/** Returns { tasks, dropped }: the usable tasks and how many were thrown out. */
function cleanTasks(list) {
  if (!Array.isArray(list)) return { tasks: [], dropped: 0 };
  const seen = new Set();
  const result = [];
  for (const raw of list) {
    const task = cleanTask(raw);
    if (task && !seen.has(task.id)) {
      seen.add(task.id);
      result.push(task);
    }
  }
  return { tasks: result, dropped: list.length - result.length };
}

/** One task, repaired where possible, or null if it's beyond repair. */
function cleanTask(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!isText(raw.id) || raw.id === '') return null;
  if (!isText(raw.title) || raw.title.trim() === '') return null;

  const text = (field) => (isText(raw[field]) ? raw[field] : '');
  const date = (field) => (isValidISODate(raw[field]) ? raw[field] : '');
  const time = (field) => (isTime(raw[field]) ? raw[field] : '');
  const now = new Date().toISOString();

  const task = {
    id: raw.id,
    title: raw.title,
    description: text('description'),
    categoryId: text('categoryId'),
    taskType: TASK_TYPES.includes(raw.taskType) ? raw.taskType : 'Other',
    priority: PRIORITIES.includes(raw.priority) ? raw.priority : 'medium',
    status: STATUSES.includes(raw.status) ? raw.status : 'todo',
    dueDate: date('dueDate'),
    dueTime: time('dueTime'),
    scheduledDate: date('scheduledDate'),
    scheduledStartTime: time('scheduledStartTime'),
    scheduledEndTime: time('scheduledEndTime'),
    notes: text('notes'),
    createdAt: isText(raw.createdAt) ? raw.createdAt : now,
    updatedAt: isText(raw.updatedAt) ? raw.updatedAt : now,
    completedAt: isText(raw.completedAt) ? raw.completedAt : null,
  };
  if (!task.dueDate) task.dueTime = '';
  syncCompletion(task, task.updatedAt);
  return task;
}

/**
 * The five general categories always come from the code (so they can't go
 * missing), followed by any saved courses that look valid.
 */
function cleanCategories(list) {
  const general = DEFAULT_CATEGORIES.map((c) => ({ ...c }));
  if (!Array.isArray(list)) return general;
  const ids = new Set(general.map((c) => c.id));
  const courses = [];
  for (const c of list) {
    if (c && c.kind === 'course' && isText(c.id) && c.id && !ids.has(c.id) && isText(c.name) && c.name.trim()) {
      ids.add(c.id);
      courses.push({
        id: c.id,
        kind: 'course',
        name: c.name,
        code: isText(c.code) ? c.code : '',
        description: isText(c.description) ? c.description : '',
        color: COLOR_VALUES.includes(c.color) ? c.color : 'var(--c-grey)',
      });
    }
  }
  return [...general, ...courses];
}

function cleanSettings(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const result = {};
  if (isText(raw.displayName)) result.displayName = raw.displayName.slice(0, 40);
  return result;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** A copy of the settings, e.g. { displayName: 'Ama' }. */
export function getSettings() {
  return { ...settings };
}

/** Changes some settings and saves them. */
export function updateSettings(changes) {
  settings = { ...settings, ...cleanSettings(changes) };
  announceChange();
  return getSettings();
}

// ---------------------------------------------------------------------------
// Reading tasks and categories
// ---------------------------------------------------------------------------

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
  const category = categories.find((c) => c.id === id);
  return category ? { ...category } : null;
}

// ---------------------------------------------------------------------------
// Courses (categories with kind: "course")
// ---------------------------------------------------------------------------

/** Just the courses, in the order they were added. */
export function getCourses() {
  return categories.filter((c) => c.kind === 'course').map((c) => ({ ...c }));
}

/** Only the fields a course may have, trimmed. */
function courseFields(fields) {
  const result = {};
  if (isText(fields.name)) result.name = fields.name.trim();
  if (isText(fields.code)) result.code = fields.code.trim();
  if (isText(fields.description)) result.description = fields.description.trim();
  if (COLOR_VALUES.includes(fields.color)) result.color = fields.color;
  return result;
}

/** Adds a course: { name, code, description, color }. Returns it. */
export function addCourse(fields) {
  const course = {
    id: makeId(),
    kind: 'course',
    name: '',
    code: '',
    description: '',
    color: COURSE_COLORS[0].value,
    ...courseFields(fields),
  };
  categories.push(course);
  announceChange();
  return { ...course };
}

/** Changes a course's details. Returns the updated course, or null. */
export function updateCourse(id, changes) {
  const course = categories.find((c) => c.id === id && c.kind === 'course');
  if (!course) return null;
  Object.assign(course, courseFields(changes));
  announceChange();
  return { ...course };
}

/**
 * Deletes a course (decision 7). Its tasks are KEPT and become
 * Uncategorized. Returns how many tasks were moved.
 */
export function deleteCourse(id) {
  const before = categories.length;
  categories = categories.filter((c) => !(c.id === id && c.kind === 'course'));
  if (categories.length === before) return 0;
  const now = new Date().toISOString();
  let moved = 0;
  tasks.forEach((task) => {
    if (task.categoryId === id) {
      task.categoryId = '';
      task.updatedAt = now;
      moved++;
    }
  });
  announceChange();
  return moved;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

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

// Load the saved data as soon as this file is first imported
load();
