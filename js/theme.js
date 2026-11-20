// =============================================================================
// theme.js — dark / light / system theme.
//
// The preference ("dark", "light" or "system") is remembered in Local
// Storage under "luma.theme". The colours themselves live in style.css:
// this file only sets data-theme="dark" or data-theme="light" on <html>.
// (A tiny copy of applyTheme also runs in index.html's <head>, so the page
// never flashes the wrong theme while it loads.)
// =============================================================================

const KEY = 'luma.theme';
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

/** The saved preference, or "system" if none is saved (or storage is blocked). */
export function getThemePref() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
  } catch {
    // Some private windows block storage. Fall through to the default.
  }
  return 'system';
}

/** "dark" or "light": what is actually on screen right now. */
export function currentTheme() {
  const pref = getThemePref();
  if (pref === 'system') return systemDark.matches ? 'dark' : 'light';
  return pref;
}

function applyTheme() {
  document.documentElement.dataset.theme = currentTheme();
  // Let any screen that shows the theme (Settings) update itself
  document.dispatchEvent(new CustomEvent('themechange'));
}

/** Saves a new preference and applies it. */
export function setThemePref(pref) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    // Can't save: the theme still changes for this visit.
  }
  applyTheme();
}

/** The sidebar button: flip between dark and light. */
export function toggleTheme() {
  setThemePref(currentTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
  applyTheme();
  // If the preference is "system", follow the device when it changes
  systemDark.addEventListener('change', () => {
    if (getThemePref() === 'system') applyTheme();
  });
}
