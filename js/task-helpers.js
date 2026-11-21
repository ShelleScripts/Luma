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

// ---------------------------------------------------------------------------
// Work sessions (the planner)
// ---------------------------------------------------------------------------

// A session with a start time but no end time is drawn this long
export const DEFAULT_SESSION_MINUTES = 60;

/** "09:30" -> 570 (minutes since midnight). */
export function toMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** 570 -> "09:30". */
export function fromMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * A timed session's start and end in minutes, or null if it has no start
 * time. Without an end time it lasts DEFAULT_SESSION_MINUTES.
 */
export function sessionSpan(task) {
  if (!task.scheduledStartTime) return null;
  const start = toMinutes(task.scheduledStartTime);
  const end = task.scheduledEndTime
    ? toMinutes(task.scheduledEndTime)
    : Math.min(start + DEFAULT_SESSION_MINUTES, 24 * 60);
  return { start, end };
}

/** "09:00 – 10:30", "09:00" or "" for a session. */
export function sessionLabel(task) {
  if (!task.scheduledStartTime) return '';
  return task.scheduledEndTime
    ? `${task.scheduledStartTime} – ${task.scheduledEndTime}`
    : task.scheduledStartTime;
}

/** Sort helper: timed sessions by start time, untimed ones after them. */
export function compareBySession(a, b) {
  const aKey = a.scheduledStartTime || '99:99';
  const bKey = b.scheduledStartTime || '99:99';
  if (aKey !== bKey) return aKey < bKey ? -1 : 1;
  return a.title.localeCompare(b.title);
}

/**
 * Lays out one day's timed sessions so overlapping ones sit side by side
 * (decision 13). Returns a Map from task id to { column, columns }, e.g.
 * { column: 1, columns: 2 } means "the right half". Also returns how many
 * overlapping pairs it found, for the warning banner.
 *
 * How it works: walk the sessions from earliest start. Sessions that overlap
 * each other (directly or through a chain) form a "cluster". Inside a
 * cluster each session takes the first column that is free by its start.
 */
export function layoutSessions(tasks) {
  const timed = tasks
    .map((task) => ({ task, span: sessionSpan(task) }))
    .filter((item) => item.span)
    .sort((a, b) => a.span.start - b.span.start || b.span.end - a.span.end);

  const layout = new Map();
  let overlaps = 0;
  let cluster = [];   // items in the current cluster
  let columnEnds = []; // when each column in the cluster is free again
  let clusterEnd = -1;

  const finishCluster = () => {
    cluster.forEach((item) => {
      layout.get(item.task.id).columns = columnEnds.length;
    });
    cluster = [];
    columnEnds = [];
  };

  for (const item of timed) {
    if (item.span.start >= clusterEnd) finishCluster();

    // Count every earlier session in this cluster that this one overlaps
    overlaps += cluster.filter((other) => other.span.end > item.span.start).length;

    let column = columnEnds.findIndex((end) => end <= item.span.start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.span.end);
    } else {
      columnEnds[column] = item.span.end;
    }
    layout.set(item.task.id, { column, columns: 1 });
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.span.end);
  }
  finishCluster();

  return { layout, overlaps };
}

// ---------------------------------------------------------------------------
// Deadlines
// ---------------------------------------------------------------------------

/**
 * Which Deadlines group an open task belongs in: 'overdue', 'soon'
 * (today to 7 days ahead) or 'upcoming' (further away). Null for completed
 * tasks and tasks with no due date.
 */
export function deadlineGroup(task, today = todayISO()) {
  if (isDone(task) || !task.dueDate) return null;
  if (isOverdue(task)) return 'overdue';
  return daysBetween(today, task.dueDate) <= 7 ? 'soon' : 'upcoming';
}

/** "Due today", "Due in 3 days", "1 day late" and so on. */
export function relativeDue(task, today = todayISO()) {
  const days = daysBetween(today, task.dueDate);
  if (days < 0) return `${-days} ${days === -1 ? 'day' : 'days'} late`;
  if (days === 0) return isOverdue(task) ? 'Late today' : 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}
