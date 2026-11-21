// =============================================================================
// task-helpers.js — small rules about tasks that several screens share:
// which tasks count as "today", which are overdue, how to label a due date,
// and how to sort. None of these change any data; they only answer questions.
// =============================================================================

import { todayISO, daysBetween, formatShortDate } from './utils.js';

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 };

export const isDone = (task) => task.status === 'completed';

/**
 * Decision 5: today's tasks are those scheduled today, plus those due today
 * that aren't scheduled on some other day.
 */
export function isToday(task, today = todayISO()) {
  if (task.scheduledDate === today) return true;
  return task.dueDate === today && (!task.scheduledDate || task.scheduledDate === today);
}

/** Open tasks whose deadline or work session is after today. */
export function isUpcoming(task, today = todayISO()) {
  if (isDone(task)) return false;
  return task.dueDate > today || task.scheduledDate > today;
}

/**
 * Decision 8: a task with a due time is overdue once that time passes;
 * a date-only task is overdue from the next day. Completed tasks never are.
 */
export function isOverdue(task, now = new Date()) {
  if (isDone(task) || !task.dueDate) return false;
  const today = todayISO();
  if (task.dueDate < today) return true;
  if (task.dueDate > today || !task.dueTime) return false;
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return task.dueTime < nowTime;
}

/** "Today, 23:59", "Tomorrow", "Yesterday", "Mon 23 Nov" or "No deadline". */
export function dueLabel(task) {
  if (!task.dueDate) return 'No deadline';
  const days = daysBetween(todayISO(), task.dueDate);
  let label;
  if (days === 0) label = 'Today';
  else if (days === 1) label = 'Tomorrow';
  else if (days === -1) label = 'Yesterday';
  else label = formatShortDate(task.dueDate);
  return task.dueTime ? `${label}, ${task.dueTime}` : label;
}

/**
 * Sort helper: earliest deadline first, tasks with no deadline last,
 * then higher priority first. Use with array.sort(compareByDue).
 */
export function compareByDue(a, b) {
  const aKey = a.dueDate ? `${a.dueDate} ${a.dueTime || '99:99'}` : '9999';
  const bKey = b.dueDate ? `${b.dueDate} ${b.dueTime || '99:99'}` : '9999';
  if (aKey !== bKey) return aKey < bKey ? -1 : 1;
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
}
