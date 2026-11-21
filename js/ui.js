// =============================================================================
// ui.js — shared interface pieces: toast notifications (optionally with an
// Undo button) and the confirm dialog used before deleting something.
// =============================================================================

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

/**
 * Shows a short message at the bottom of the screen for a few seconds.
 * Pass `action` to add a button, e.g. { label: 'Undo', onClick: () => ... },
 * and `duration` (milliseconds) to keep it up longer.
 */
export function showToast(message, { action, duration } = {}) {
  const region = document.getElementById('toasts');
  const toast = document.createElement('div');
  toast.className = 'toast';

  const text = document.createElement('span');
  text.textContent = message; // textContent, not innerHTML: always safe
  toast.append(text);

  if (action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'toast__action';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      action.onClick();
      toast.remove();
    });
    toast.append(button);
  }

  region.append(toast);
  // Toasts with a button stay a little longer, so there's time to press it.
  // Important warnings can ask for longer still with `duration`.
  setTimeout(() => toast.remove(), duration || (action ? 6000 : 4000));
}

// ---------------------------------------------------------------------------
// Confirm dialog
// ---------------------------------------------------------------------------

/**
 * Asks a yes/no question in a pop-up and waits for the answer.
 * Returns a Promise: it "resolves" to true if the user confirms, false if not.
 *
 *   const ok = await confirmDialog({ title: 'Delete this task?', ... });
 *   if (ok) { ...delete it... }
 *
 * `await` pauses the function until the user clicks a button.
 */
export function confirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'modal';
    dialog.setAttribute('aria-labelledby', 'modal-title');
    dialog.innerHTML = `
      <h2 class="modal__title" id="modal-title"></h2>
      <p class="modal__message muted"></p>
      <div class="modal__actions">
        <button type="button" class="btn" data-answer="no"></button>
        <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-answer="yes"></button>
      </div>
    `;
    // Fill the text with textContent so a task title can never inject HTML
    dialog.querySelector('.modal__title').textContent = title;
    dialog.querySelector('.modal__message').textContent = message;
    dialog.querySelector('[data-answer="no"]').textContent = cancelLabel;
    dialog.querySelector('[data-answer="yes"]').textContent = confirmLabel;

    let answer = false;
    dialog.addEventListener('click', (event) => {
      const button = event.target.closest('[data-answer]');
      if (button) {
        answer = button.dataset.answer === 'yes';
        dialog.close();
      } else if (event.target === dialog) {
        dialog.close(); // a click on the dim backdrop means "no"
      }
    });
    // "close" fires however the dialog closes: a button, Esc, or the backdrop
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(answer);
    });

    document.body.append(dialog);
    dialog.showModal(); // modal: traps focus, dims the page, Esc closes it
    dialog.querySelector('[data-answer="no"]').focus(); // the safe choice first
  });
}
