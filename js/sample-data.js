// =============================================================================
// sample-data.js — a realistic student week, for trying Luma out.
//
// "Load sample data" in Settings uses this. It's written in exactly the same
// shape as an exported backup file, so it goes through the same checks and
// the same "merge" as an import (store.js): nothing about it is special.
//
// Every date is worked out from TODAY, so the sample always looks current:
// some sessions today (two of them overlap, to show the warning), a few
// deadlines this week, one overdue task and a couple further ahead.
// =============================================================================

import { todayISO, addDays, makeId } from './utils.js';

/** Builds a fresh copy of the sample, with new ids each time. */
export function sampleData() {
  const today = todayISO();
  const day = (offset) => addDays(today, offset); // day(1) = tomorrow

  const courses = [
    { id: makeId(), kind: 'course', name: 'Data Structures', code: 'CS 201', description: 'Lists, trees, graphs and how fast they are.', color: 'var(--c-blue)' },
    { id: makeId(), kind: 'course', name: 'Calculus II', code: 'MATH 152', description: 'Integration techniques and series.', color: 'var(--c-purple)' },
    { id: makeId(), kind: 'course', name: 'Intro to Psychology', code: 'PSY 101', description: '', color: 'var(--c-teal)' },
  ];
  const [cs, calc, psych] = courses.map((c) => c.id);

  // A short way to write a task: only the fields that matter for each one
  const task = (fields) => ({
    id: makeId(),
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    dueTime: '',
    scheduledDate: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    notes: '',
    ...fields,
  });

  const tasks = [
    // Today
    task({ title: 'Review flashcards', categoryId: cs, taskType: 'Study Session', priority: 'low', status: 'completed',
      scheduledDate: day(0), scheduledStartTime: '08:30', scheduledEndTime: '09:00' }),
    task({ title: 'Read chapter 6: Memory', categoryId: psych, taskType: 'Reading',
      dueDate: day(1), scheduledDate: day(0), scheduledStartTime: '10:00', scheduledEndTime: '11:00' }),
    task({ title: 'Problem set 4', categoryId: calc, taskType: 'Assignment', priority: 'high',
      description: 'Questions 1–12 from section 7.3.', dueDate: day(2), dueTime: '23:59',
      scheduledDate: day(0), scheduledStartTime: '16:00', scheduledEndTime: '17:30' }),
    task({ title: 'Gym', categoryId: 'personal', taskType: 'Personal', priority: 'low',
      scheduledDate: day(0), scheduledStartTime: '17:00', scheduledEndTime: '18:00' }),
    task({ title: 'Weekly review', categoryId: 'personal', taskType: 'Personal', priority: 'low',
      scheduledDate: day(0), scheduledStartTime: '19:00', scheduledEndTime: '19:30' }),

    // This week
    task({ title: 'Linked list lab', categoryId: cs, taskType: 'Assignment', priority: 'high', status: 'in-progress',
      dueDate: day(4), dueTime: '17:00', scheduledDate: day(1), scheduledStartTime: '14:00', scheduledEndTime: '16:00' }),
    task({ title: 'Club meeting prep', categoryId: 'extracurricular', taskType: 'Other', priority: 'low',
      notes: 'Print the sign-up sheet.', scheduledDate: day(2) }),
    task({ title: 'Study for the midterm', categoryId: calc, taskType: 'Study Session', priority: 'high',
      dueDate: day(9), scheduledDate: day(3), scheduledStartTime: '18:00', scheduledEndTime: '20:00' }),
    task({ title: 'Quiz 3: Trees', categoryId: cs, taskType: 'Quiz', dueDate: day(5), dueTime: '10:00' }),

    // Overdue, and further ahead
    task({ title: 'Submit lab report', categoryId: cs, taskType: 'Assignment', priority: 'urgent', status: 'in-progress',
      dueDate: day(-1), dueTime: '23:59' }),
    task({ title: 'Calculus midterm', categoryId: calc, taskType: 'Examination', priority: 'urgent',
      dueDate: day(9), dueTime: '09:00', notes: 'Room B12. Bring a calculator.' }),
    task({ title: 'Research paper outline', categoryId: psych, taskType: 'Project', status: 'in-progress',
      dueDate: day(12) }),
    task({ title: 'Update CV', categoryId: 'work', taskType: 'Other', dueDate: day(14) }),

    // Already done
    task({ title: 'Watch lecture recording', categoryId: psych, taskType: 'Study Session', priority: 'low', status: 'completed',
      scheduledDate: day(-1), scheduledStartTime: '15:00', scheduledEndTime: '16:00' }),
  ];

  return { app: 'Luma', version: 1, tasks, categories: courses };
}
