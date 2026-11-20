// =============================================================================
// icons.js — the small line icons the screens draw, as SVG strings.
// Keeping them in one file means each icon is drawn the same way everywhere.
// "currentColor" makes an icon take the text colour of whatever contains it.
// =============================================================================

const svg = (size, body, extra = '') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;

export const icons = {
  plus: (s = 14) => svg(s, '<path d="M8 3v10M3 8h10"/>', 'stroke-width="1.75"'),
  calendar: (s = 14) => svg(s, '<rect x="2.5" y="3.5" width="11" height="10" rx="2"/><path d="M2.5 6.75h11M5.5 2v3M10.5 2v3"/>'),
  clock: (s = 16) => svg(s, '<circle cx="8" cy="8" r="5.75"/><path d="M8 5v3.2l2 1.3"/>'),
  check: (s = 16) => svg(s, '<rect x="2.5" y="2.5" width="11" height="11" rx="3"/><path d="M5.5 8.2l1.8 1.8 3.2-3.8"/>'),
  book: (s = 16) => svg(s, '<path d="M2.5 3.5h4a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 0-1.5-1.5h-4zM13.5 3.5h-4A1.5 1.5 0 0 0 8 5v8a1.5 1.5 0 0 1 1.5-1.5h4z"/>'),
  chevronLeft: (s = 14) => svg(s, '<path d="M10 3.5L5.5 8l4.5 4.5"/>', 'stroke-width="1.75"'),
  chevronRight: (s = 14) => svg(s, '<path d="M6 3.5L10.5 8 6 12.5"/>', 'stroke-width="1.75"'),
  chevronDown: (s = 14) => svg(s, '<path d="M3.5 6L8 10.5 12.5 6"/>', 'stroke-width="1.75"'),
};
