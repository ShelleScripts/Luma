// =============================================================================
// ui.js — shared interface pieces. For now that's toast notifications;
// confirm dialogs join it in Milestone 2, when there is something to delete.
// =============================================================================

/** Shows a short message at the bottom of the screen for a few seconds. */
export function showToast(message) {
  const region = document.getElementById('toasts');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message; // textContent, not innerHTML: always safe
  region.append(toast);
  setTimeout(() => toast.remove(), 4000);
}
