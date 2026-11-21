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
  pencil: (s = 15) => svg(s, '<path d="M3 13l.6-2.6L10.8 3.2a1.4 1.4 0 0 1 2 2L5.6 12.4z"/>'),
  close: (s = 14) => svg(s, '<path d="M4 4l8 8M12 4l-8 8"/>'),
  trash: (s = 15) => svg(s, '<path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/>'),

  /** The tick inside a completed checkbox. */
  tick: () => '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',

  /**
   * Priority: three bars that fill up with the level, or a red "!" for urgent.
   * Filled bars are solid; empty ones are faint.
   */
  priority: (level) => {
    if (level === 'urgent') {
      return '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="1" y="1" width="12" height="12" rx="3" fill="var(--red)"/><path d="M7 4v3.6M7 9.8v.1" stroke="var(--on-accent)" stroke-width="1.8" stroke-linecap="round"/></svg>';
    }
    const filled = { low: 1, medium: 2, high: 3 }[level] || 1;
    const bar = (i, x, y, h) => `<rect x="${x}" y="${y}" width="2.5" height="${h}" rx="1" fill="currentColor" fill-opacity="${i <= filled ? 1 : 0.25}"/>`;
    return `<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">${bar(1, 1.5, 8, 4.5)}${bar(2, 5.75, 5, 7.5)}${bar(3, 10, 2, 10.5)}</svg>`;
  },
};
