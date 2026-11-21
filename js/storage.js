// =============================================================================
// storage.js — reads and writes Luma's data in the browser's Local Storage.
//
// Local Storage is a small key/value box that belongs to this website and
// survives refreshes and closing the browser. It can only hold TEXT, so we
// turn our data into text with JSON.stringify() before saving, and back into
// objects with JSON.parse() when loading.
//
// Everything is saved under ONE key, as one object:
//
//   luma.data = { "version": 1, "tasks": [...], "categories": [...], "settings": {...} }
//
// The "version" number lets a future Luma notice old data and upgrade it.
// (The theme is kept separately under "luma.theme", see theme.js, because the
// little script in index.html has to read it before anything else loads.)
//
// Only store.js uses this file. Screens never touch Local Storage directly.
// =============================================================================

export const STORAGE_KEY = 'luma.data';
export const STORAGE_VERSION = 1;

/**
 * Reads the saved data.
 * Returns one of:
 *   { status: 'ok', data }       saved data found and readable
 *   { status: 'empty' }          nothing saved yet (first visit)
 *   { status: 'corrupt', raw }   something is saved but it can't be read
 *   { status: 'unavailable' }    the browser won't let us use Local Storage
 */
export function loadData() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // e.g. some private-browsing modes, or storage turned off
    return { status: 'unavailable' };
  }
  if (raw === null) return { status: 'empty' };

  try {
    const data = JSON.parse(raw);
    // It must at least look like our object
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { status: 'corrupt', raw };
    }
    if (typeof data.version === 'number' && data.version > STORAGE_VERSION) {
      // Saved by a newer Luma; treat it as unreadable rather than damage it
      return { status: 'corrupt', raw };
    }
    return { status: 'ok', data };
  } catch {
    // JSON.parse throws on text that isn't valid JSON
    return { status: 'corrupt', raw };
  }
}

/**
 * Saves the data. Returns true if it worked, false if the browser refused
 * (for example because storage is full or switched off).
 */
export function saveData({ tasks, categories, settings }) {
  try {
    const text = JSON.stringify({ version: STORAGE_VERSION, tasks, categories, settings });
    localStorage.setItem(STORAGE_KEY, text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Keeps a copy of unreadable data under another key before we start fresh,
 * so nothing is thrown away for good. Returns the key it used.
 */
export function backupCorrupt(raw) {
  const key = `${STORAGE_KEY}.backup`;
  try {
    localStorage.setItem(key, raw);
  } catch {
    // Nothing more we can do; the app still works from a clean slate
  }
  return key;
}

/** Deletes that backup copy (used by "Clear all data" in Settings). */
export function removeBackup() {
  try {
    localStorage.removeItem(`${STORAGE_KEY}.backup`);
  } catch {
    // Storage is off; there's no backup to remove anyway
  }
}
