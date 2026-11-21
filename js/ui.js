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

// ---------------------------------------------------------------------------
// Choice dialog
// ---------------------------------------------------------------------------

/**
 * Like confirmDialog, but the user picks one of a few options first
 * (radio buttons, each with a line explaining what it does).
 *
 *   const mode = await chooseDialog({
 *     title: 'Import backup',
 *     options: [
 *       { value: 'merge', label: 'Merge', hint: 'Adds 12 tasks.' },
 *       { value: 'replace', label: 'Replace all', hint: '...', danger: true },
 *     ],
 *   });
 *
 * Resolves to the chosen option's value, or null if the user cancels.
 * The first option starts selected. When a "danger" option is selected the
 * confirm button turns red, as a last warning.
 */
export function chooseDialog({ title, message = '', options, confirmLabel = 'Continue', cancelLabel = 'Cancel' }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'modal modal--form';
    dialog.setAttribute('aria-labelledby', 'choose-title');
    dialog.innerHTML = `
      <h2 class="modal__title" id="choose-title"></h2>
      <p class="modal__message muted"></p>
      <fieldset class="choices">
        <legend class="visually-hidden"></legend>
      </fieldset>
      <div class="modal__actions">
        <button type="button" class="btn" data-answer="no"></button>
        <button type="button" class="btn btn--primary" data-answer="yes"></button>
      </div>
    `;
    // textContent again, so nothing from a file can inject HTML
    dialog.querySelector('.modal__title').textContent = title;
    dialog.querySelector('legend').textContent = title;
    const messageEl = dialog.querySelector('.modal__message');
    messageEl.textContent = message;
    messageEl.hidden = !message;
    dialog.querySelector('[data-answer="no"]').textContent = cancelLabel;
    const confirmButton = dialog.querySelector('[data-answer="yes"]');
    confirmButton.textContent = confirmLabel;

    const fieldset = dialog.querySelector('.choices');
    options.forEach((option, i) => {
      const label = document.createElement('label');
      label.className = 'choice';
      label.innerHTML = `
        <input type="radio" name="choice">
        <span class="choice__text"><b></b><span class="small muted"></span></span>
      `;
      const radio = label.querySelector('input');
      radio.value = option.value;
      radio.checked = i === 0;
      label.querySelector('b').textContent = option.label;
      label.querySelector('.small').textContent = option.hint || '';
      fieldset.append(label);
    });

    /** The confirm button is red while a "danger" option is picked. */
    const selected = () => options.find((o) => o.value === dialog.querySelector('input:checked').value);
    const showDanger = () => {
      const danger = Boolean(selected().danger);
      confirmButton.classList.toggle('btn--danger', danger);
      confirmButton.classList.toggle('btn--primary', !danger);
    };
    fieldset.addEventListener('change', showDanger);
    showDanger();

    let answer = null;
    dialog.addEventListener('click', (event) => {
      const button = event.target.closest('[data-answer]');
      if (button) {
        answer = button.dataset.answer === 'yes' ? selected().value : null;
        dialog.close();
      } else if (event.target === dialog) {
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(answer);
    });

    document.body.append(dialog);
    dialog.showModal();
    dialog.querySelector('input:checked').focus();
  });
}
