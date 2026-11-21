// =============================================================================
// settings.js — the Settings screen.
// (Not in the brief's file list; it gets its own file so every screen
// follows the same pattern: one module per screen.)
//
//   You          display name (shown in the dashboard greeting)
//   Preferences  theme, and which day the weekly planner starts on
//   Your data    export a backup, import one (Merge or Replace all),
//                load sample data, and clear everything
//
// The big data actions (import, sample data, clear all) can be undone from
// the toast that follows them: the store takes a snapshot first.
// =============================================================================

import { getThemePref, setThemePref } from './theme.js';
import {
  getSettings, updateSettings, getTasks, getCourses,
  exportData, prepareImport, applyImport, clearAllData, restoreSnapshot,
} from './store.js';
import { sampleData } from './sample-data.js';
import { escapeHTML, todayISO } from './utils.js';
import { showToast, confirmDialog, chooseDialog } from './ui.js';
import { icons } from './icons.js';

export const title = 'Settings';

const THEMES = [
  { value: 'system', name: 'System' },
  { value: 'light', name: 'Light' },
  { value: 'dark', name: 'Dark' },
];

const WEEK_STARTS = [
  { value: 'monday', name: 'Monday' },
  { value: 'sunday', name: 'Sunday' },
];

// Bigger than any real backup; stops someone picking a huge file by mistake
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

// Undo toasts after a big change stay up longer than usual
const UNDO_DURATION = 10000;

// The container Settings was last drawn into (to update it on data changes)
let mounted = null;

export function render(container) {
  mounted = container;
  container.innerHTML = `
    <div class="page" style="max-width:860px" data-screen="settings">
      <header>
        <h1 class="h1">Settings</h1>
        <p class="muted" style="margin-top:6px">Luma keeps everything in this browser. Nothing is sent anywhere.</p>
      </header>

      <section aria-labelledby="s-you">
        <h2 class="h2 section-title" id="s-you">You</h2>
        <div class="settings-group">
          <form class="settings-row" id="name-form">
            <label class="settings-row__label" for="display-name"><b>Display name</b><span>Used in your greeting on the dashboard.</span></label>
            <div class="row-wrap" style="gap:8px">
              <input id="display-name" class="field" style="width:200px" maxlength="40" autocomplete="given-name"
                     placeholder="Your name" value="${escapeHTML(getSettings().displayName)}">
              <button class="btn" type="submit">Save</button>
            </div>
          </form>
        </div>
      </section>

      <section aria-labelledby="s-prefs">
        <h2 class="h2 section-title" id="s-prefs">Preferences</h2>
        <div class="settings-group">
          <div class="settings-row">
            <div class="settings-row__label" id="theme-label"><b>Theme</b><span>System follows your device setting.</span></div>
            <div class="seg" role="group" aria-labelledby="theme-label">
              ${THEMES.map((t) => `<button type="button" data-theme-pref="${t.value}">${t.name}</button>`).join('')}
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row__label" id="week-label"><b>Week starts on</b><span>The first day of the weekly planner.</span></div>
            <div class="seg" role="group" aria-labelledby="week-label">
              ${WEEK_STARTS.map((w) => `<button type="button" data-week-start="${w.value}">${w.name}</button>`).join('')}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="s-data">
        <h2 class="h2 section-title" id="s-data">Your data</h2>
        <div class="settings-group">
          <div class="settings-row">
            <div class="settings-row__label"><b>Export a backup</b><span>Saves <span data-data-count></span> as a .json file you can import later, here or in another browser.</span></div>
            <button type="button" class="btn" data-export>${icons.download()}Export</button>
          </div>
          <div class="settings-row">
            <div class="settings-row__label"><b>Import a backup</b><span>Adds tasks and courses from a Luma .json file, or replaces everything with it. You choose before anything changes.</span></div>
            <button type="button" class="btn" data-import>${icons.upload()}Import</button>
            <!-- A real file picker, hidden; the Import button opens it -->
            <input type="file" accept=".json,application/json" hidden data-import-file>
          </div>
          <div class="settings-row">
            <div class="settings-row__label"><b>Sample data</b><span>Adds a week of example courses and tasks, so you can explore Luma before adding your own.</span></div>
            <button type="button" class="btn" data-sample>Load sample data</button>
          </div>
          <div class="settings-row">
            <div class="settings-row__label"><b>Clear all data</b><span>Removes every task, course and setting from this browser.</span></div>
            <button type="button" class="btn btn--ghost-danger" data-clear>${icons.trash()}Clear all data</button>
          </div>
        </div>
      </section>
    </div>
  `;

  container.querySelector('#name-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = container.querySelector('#display-name').value.trim();
    updateSettings({ displayName: name });
    showToast(name ? `Saved. Hello, ${name}.` : 'Display name cleared.');
  });

  container.querySelectorAll('[data-theme-pref]').forEach((button) => {
    button.addEventListener('click', () => setThemePref(button.dataset.themePref));
  });
  container.querySelectorAll('[data-week-start]').forEach((button) => {
    button.addEventListener('click', () => updateSettings({ weekStart: button.dataset.weekStart }));
  });

  const fileInput = container.querySelector('[data-import-file]');
  container.querySelector('[data-export]').addEventListener('click', exportBackup);
  container.querySelector('[data-import]').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    fileInput.value = ''; // so picking the same file again still fires "change"
    if (file) importBackup(file);
  });
  container.querySelector('[data-sample]').addEventListener('click', loadSample);
  container.querySelector('[data-clear]').addEventListener('click', clearEverything);

  showPressedTheme();
  refresh();
}

// ---------------------------------------------------------------------------
// Keeping the screen up to date
// ---------------------------------------------------------------------------

/** Marks the theme button that matches the saved preference. */
function showPressedTheme() {
  const pref = getThemePref();
  document.querySelectorAll('[data-theme-pref]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.themePref === pref));
  });
}

/**
 * Updates the parts of the screen that show saved data. Used instead of a
 * full redraw, so the button you just pressed keeps keyboard focus.
 */
function refresh() {
  if (!mounted || !mounted.querySelector('[data-screen="settings"]')) return;
  const settings = getSettings();

  mounted.querySelectorAll('[data-week-start]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.weekStart === settings.weekStart));
  });

  // Don't overwrite the name while someone is typing it
  const nameInput = mounted.querySelector('#display-name');
  if (document.activeElement !== nameInput) nameInput.value = settings.displayName;

  const counts = currentCounts();
  mounted.querySelector('[data-data-count]').textContent =
    counts.tasks || counts.courses ? `your ${both(counts.tasks, counts.courses)}` : 'your tasks and courses';
}

// The sidebar toggle can change the theme while Settings is open.
// (When Settings isn't on screen there are no buttons, so this does nothing.)
document.addEventListener('themechange', showPressedTheme);
// An import, Undo, or another tab can change the data while Settings is open
document.addEventListener('luma:datachange', refresh);

// ---------------------------------------------------------------------------
// Wording helpers
// ---------------------------------------------------------------------------

/** count(1, 'task') -> "1 task", count(3, 'task') -> "3 tasks". */
const count = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** both(4, 2) -> "4 tasks and 2 courses"; leaves out a zero; "nothing" for 0 and 0. */
function both(tasks, courses) {
  const parts = [];
  if (tasks) parts.push(count(tasks, 'task'));
  if (courses) parts.push(count(courses, 'course'));
  return parts.join(' and ') || 'nothing';
}

const currentCounts = () => ({ tasks: getTasks().length, courses: getCourses().length });

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function exportBackup() {
  const data = exportData();
  const filename = `luma-backup-${todayISO()}.json`;
  // JSON.stringify's third argument indents the file, so it's readable
  downloadFile(filename, JSON.stringify(data, null, 2));
  showToast(`Exported ${both(data.tasks.length, data.categories.length)} to ${filename}.`);
}

/**
 * Makes the browser download some text as a file. A Blob is a chunk of data
 * in memory; createObjectURL gives it a temporary address that a link with
 * a "download" attribute can save.
 */
function downloadFile(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Free the memory once the download has started
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------------
// Import (decision 10: Merge or Replace all, with a summary first)
// ---------------------------------------------------------------------------

async function importBackup(file) {
  if (file.size > MAX_IMPORT_BYTES) {
    showToast('That file is too large to be a Luma backup, so nothing was imported.', { duration: 6000 });
    return;
  }

  // file.text() reads the file; `await` waits for it to finish
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    showToast("That file isn't valid JSON, so nothing was imported.", { duration: 6000 });
    return;
  }

  const prepared = prepareImport(data);
  if (prepared.error) {
    showToast(prepared.error, { duration: 6000 });
    return;
  }

  // Show what each choice would do, then let the user pick
  const { merge, replace, dropped } = prepared;
  const now = currentCounts();
  const skipped = merge.skippedTasks + merge.skippedCourses;
  const damaged = dropped
    ? ` ${count(dropped, 'task')} in it ${dropped === 1 ? 'is' : 'are'} damaged and will be left out.`
    : '';

  const mode = await chooseDialog({
    title: 'Import backup',
    message: `From “${file.name}”.${damaged}`,
    confirmLabel: 'Import',
    options: [
      {
        value: 'merge',
        label: 'Merge with my data',
        hint: `Adds ${both(merge.tasks, merge.courses)}.`
          + (skipped ? ` Skips ${skipped} you already have, keeping your versions.` : '')
          + ' Nothing you have is removed.',
      },
      {
        value: 'replace',
        label: 'Replace all my data',
        hint: (now.tasks || now.courses ? `Removes your ${both(now.tasks, now.courses)}, then loads` : 'Loads')
          + ` ${both(replace.tasks, replace.courses)} from the file. Settings come from the file too.`,
        danger: now.tasks + now.courses > 0,
      },
    ],
  });
  if (!mode) return; // cancelled: nothing was changed

  const before = applyImport(prepared, mode);
  const message = mode === 'replace'
    ? `Replaced your data with ${both(replace.tasks, replace.courses)}.`
    : merge.tasks || merge.courses
      ? `Imported ${both(merge.tasks, merge.courses)}.`
      : 'Nothing new to import. Everything in that file is already here.';
  showToast(message, {
    action: { label: 'Undo', onClick: () => restoreSnapshot(before) },
    duration: UNDO_DURATION,
  });
}

// ---------------------------------------------------------------------------
// Sample data and Clear all
// ---------------------------------------------------------------------------

function loadSample() {
  // The sample is shaped like a backup, so it's merged like one
  const prepared = prepareImport(sampleData());
  const before = applyImport(prepared, 'merge');
  showToast(`Added ${both(prepared.merge.tasks, prepared.merge.courses)} as samples. Have a look around.`, {
    action: { label: 'Undo', onClick: () => restoreSnapshot(before) },
    duration: UNDO_DURATION,
  });
}

async function clearEverything() {
  const now = currentCounts();
  const settings = getSettings();
  const hasData = now.tasks || now.courses || settings.displayName || settings.weekStart !== 'monday'
    || getThemePref() !== 'system';
  if (!hasData) {
    showToast('There’s nothing to clear. Luma is already empty.');
    return;
  }

  const ok = await confirmDialog({
    title: 'Clear all data?',
    message: `This removes ${now.tasks || now.courses ? `your ${both(now.tasks, now.courses)}` : 'your data'}`
      + ' and resets your settings in this browser. Export a backup first if you might want them later.',
    confirmLabel: 'Clear all data',
    danger: true,
  });
  if (!ok) return;

  const theme = getThemePref();
  const before = clearAllData();
  setThemePref('system');
  showToast('All data cleared.', {
    action: {
      label: 'Undo',
      onClick: () => {
        restoreSnapshot(before);
        setThemePref(theme);
      },
    },
    duration: UNDO_DURATION,
  });
}
