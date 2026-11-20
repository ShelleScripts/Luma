// =============================================================================
// settings.js — the Settings screen.
// (Not in the brief's file list; it gets its own file so every screen
// follows the same pattern: one module per screen.)
//
// Milestone 1: the Theme control works. The other rows say when they
// arrive: display name in Milestone 3 (it needs saving), week start and
// the data tools in Milestone 6.
// =============================================================================

import { getThemePref, setThemePref } from './theme.js';

export const title = 'Settings';

const THEMES = [
  { value: 'system', name: 'System' },
  { value: 'light', name: 'Light' },
  { value: 'dark', name: 'Dark' },
];

export function render(container) {
  container.innerHTML = `
    <div class="page" style="max-width:860px">
      <header>
        <h1 class="h1">Settings</h1>
        <p class="muted" style="margin-top:6px">Luma keeps everything in this browser. Nothing is sent anywhere.</p>
      </header>

      <section aria-labelledby="s-you">
        <h2 class="h2 section-title" id="s-you">You</h2>
        <div class="settings-group">
          ${comingRow('Display name', 'Used in your greeting on the dashboard.', 'Milestone 3')}
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
          ${comingRow('Week starts on', 'Changes the order of days in the weekly planner.', 'Milestone 6')}
        </div>
      </section>

      <section aria-labelledby="s-data">
        <h2 class="h2 section-title" id="s-data">Your data</h2>
        <div class="settings-group">
          ${comingRow('Export and import', 'Back up your tasks and courses as a JSON file, or restore one.', 'Milestone 6')}
          ${comingRow('Clear all data', 'Removes every task, course and setting from this browser.', 'Milestone 6')}
        </div>
      </section>
    </div>
  `;

  container.querySelectorAll('[data-theme-pref]').forEach((button) => {
    button.addEventListener('click', () => setThemePref(button.dataset.themePref));
  });
  showPressedTheme();
}

/** Marks the theme button that matches the saved preference. */
function showPressedTheme() {
  const pref = getThemePref();
  document.querySelectorAll('[data-theme-pref]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.themePref === pref));
  });
}

// The sidebar toggle can change the theme while Settings is open.
// (When Settings isn't on screen there are no buttons, so this does nothing.)
document.addEventListener('themechange', showPressedTheme);

/** A row for a setting that arrives in a later milestone. */
function comingRow(name, hint, when) {
  return `
    <div class="settings-row">
      <div class="settings-row__label"><b>${name}</b><span>${hint}</span></div>
      <span class="muted small">Arrives in ${when}</span>
    </div>
  `;
}
