# Luma: decisions so far (handoff for Claude Code)

Read this alongside the master brief (`LUMA_BRIEF.md`). Where they differ, this file wins: these are decisions made after the brief.

Mockups (reference only, not code to copy): https://claude.ai/artifact/SLQyoAH6QAe85bpfjmzn6A, using the **"bold direction (v2)"** row.

## 1. Technical decisions (all recommended defaults accepted)

1. **ES modules** (`import` / `export`), run with VS Code Live Server or `python3 -m http.server`. Deploy target: GitHub Pages.
2. **Dates:** never `new Date("YYYY-MM-DD")`. Use local-date helpers in `utils.js` and compare calendar dates as `YYYY-MM-DD` strings.
3. **Due date is optional.** Tasks without one show as "No deadline" and are left out of the Deadlines screen.
4. **An "activity" is a task with scheduled fields.** Planner "Add activity" creates a task. One data type only.
5. **Today's tasks** = tasks scheduled today, plus tasks due today that aren't scheduled on another day. The daily progress uses the same set.
6. **One `categories` collection** with `kind: "course" | "general"`. The five general categories are seeded on first run. `categoryId` may be empty ("Uncategorized").
7. **Deleting a course** keeps its tasks and moves them to Uncategorized. The confirm dialog says how many tasks are affected.
8. **Overdue:** a task with a due time is overdue after that time. A date-only task is overdue from the next day. "Due soon" means today through +7 days. A passed deadline never changes status.
9. **Checkbox and status stay in sync.** Ticking sets `Completed` and `completedAt`. Reopening sets `To Do` and clears `completedAt`.
10. **Import:** the user chooses Merge (keep existing records on an ID clash) or Replace all, and sees a summary ("12 added, 3 skipped") before anything is written.
11. **Theme:** light/dark toggle, built in Milestone 6.
12. **"Plan my day"** opens today's Daily Planner with the unscheduled panel in view.
13. **Overlaps:** blocks sit side by side, with a gentle warning banner.
14. **Milestone 1** shows each screen's real empty state. The Add Task modal opens and closes, and saving arrives in Milestone 2.
15. **All data goes through a small store API from Milestone 2**, so Milestone 3 only swaps in Local Storage.
16. **Extra files:** `js/ui.js` for toasts, modal and confirm dialogs.

Small UX extras agreed: Today / Tomorrow / Next week date chips, an **N** shortcut for Add Task, "Load sample data" in Settings, Undo toast after completing a task, and a mobile bottom tab bar with a floating + button.

**Parked for later (do not build yet):** reminders and notifications. The idea is in-app reminders plus optional browser notifications in Milestone 6, then a PWA and .ics calendar export after the MVP.

## 2. Design direction: "bold" (neo-brutalist, Qlack-inspired)

Warm paper, thick ink outlines, hard offset shadows with no blur, one baby-blue accent, flat colour.

### Colour tokens

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#141310` | All text, outlines, hard shadows, primary button fill |
| `--paper` | `#F3EFE6` | Page background; text on ink |
| `--card` | `#FFFDF8` | Cards, inputs, secondary buttons |
| `--sunk` | `#E9E4D9` | Sunken panels, completed rows, "soon" tags |
| `--desk` | `#DCD7CC` | Modal backdrop |
| `--line-soft` | `#E6E1D6` | Row dividers, planner hour lines |
| `--line-dashed` | `#A8A398` | Dashed outline for unscheduled items |
| `--ink-2` | `#3A372F` | Secondary text |
| `--ink-3` | `#5A564D` | Muted meta and labels |
| `--ink-4` | `#6B665C` | Muted labels, **only** on paper or card |
| `--accent` | `#A9CBFF` | Baby blue. Only for "yours / selected / main action" |

**Course palette** (the user picks one per course; text on these is always `--ink`): mint `#7FD8BE`, lilac `#B9A2FF`, orange `#FFB25B`, pink `#FF8FB8`, lime `#C6F432`. Personal or uncategorized uses `--card` with an ink outline.

### Type

- **Familjen Grotesk** (400–700) for headings and body. **DM Mono** (400/500) for labels, numbers, dates and tags. Both from Google Fonts.
- h1 64px / 700 / -0.04em / line-height 0.95. h2 32px / 700 / -0.02em. Lead 22px. Body 17px / 1.5.
- Labels: DM Mono 13px, UPPERCASE, letter-spacing 0.1em.
- Headings end with a period ("My tasks."). Buttons use sentence case.

### Shape

- **Radius:** tag 6, rail 8, input 10, button 12, row 14, card 16, hero 20, pill 999.
- **Border:** hair 2px (dividers, tags), chip 2.5px (pills), base 3px (default), hero 4px (dialog).
- **Shadows (no blur ever):**
  - xs: `3px 3px 0 var(--ink)`
  - md: `6px 6px 0 var(--ink)`
  - card: `10px 10px 0 var(--ink)`
  - hero: `14px 14px 0 var(--ink)`
  - cta: `6px 6px 0 var(--accent), 6px 6px 0 3px var(--ink)`
- **Selected state:** accent fill, lifted 2–4px up and left, with a bigger ink shadow.
- **Hover:** lift 2px. **Press:** push into the shadow over 80ms.
- **Focus:** `outline: 3px solid var(--ink); outline-offset: 3px`.

### Rules

- Primary button (ink fill with the cta shadow) appears **once per screen**: the sidebar's Add task.
- At most **one tilted sticker per screen** for playful copy ("almost there", "rest day", "due date ≠ work time").
- **No icon set.** Nav items are numbered 01–06, plus glyphs → ← + ✕ ✓.
- Priority is a **4-bar meter plus a text label**, not colour. Overdue is a solid ink "OVERDUE" tag. Form errors get a pink "fix" tag with ink text.
- Progress uses a **progress rail**: accent fill, 10% ticks and a checkered finish.
- No gradients except the rail's ticks and checker. No emoji.
- Touch targets are at least 44px. Mobile gets the bottom tab bar and a floating + button.