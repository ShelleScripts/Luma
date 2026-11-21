# Luma: decisions so far (handoff for Claude Code)

Read this alongside the master brief (`LUMA_BRIEF.md`). Where they differ, this file wins: these are decisions made after the brief.

Mockups (reference only, not code to copy): https://claude.ai/artifact/TcztuEyr5oDewx98hACLjs, the "Luma screens" canvas with a **Dark** row and a **Light** row (Dashboard, My Tasks, Task form, Planner, Deadlines, Courses, Settings). This replaces the earlier "bold direction (v2)" mockups.

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
11. **Theme:** dark, light or system, built in Milestone 1 (the new design has a theme toggle in the sidebar). The preference is stored in Local Storage under `luma.theme`; the default is "system". A small inline script in `<head>` applies it before the page draws, so there is no flash of the wrong theme.
12. **"Plan my day"** opens today's Daily Planner (`#/planner/today`) with the "Not planned yet" panel in view.
13. **Overlaps:** blocks sit side by side, with a gentle amber warning banner.
14. **Milestone 1** shows each screen's real empty state. The task form is a **full page** at `#/tasks/new` (not a modal): it opens, validates and goes back, and saving arrives in Milestone 2. Milestone 2 reuses the same page for Edit task.
15. **All data goes through a small store API from Milestone 2**, so Milestone 3 only swaps in Local Storage.
16. **Extra files:** `js/ui.js` (toasts now, confirm dialogs from Milestone 2), `js/theme.js` (theme switching), `js/icons.js` (shared SVG icons), `js/task-form.js` (the task page) and `js/settings.js` (one module per screen).
17. **Routing:** hash routes `#/dashboard`, `#/tasks`, `#/tasks/new`, `#/planner`, `#/deadlines`, `#/courses`, `#/settings`. Anything after `?` is a query (for example `#/tasks/new?date=2026-11-20` pre-fills the work-session date). Unknown routes go to the dashboard.
18. **Storage (Milestone 3):** all data is saved as one JSON object under the Local Storage key `luma.data`: `{ version: 1, tasks, categories, settings }`. `js/storage.js` reads and writes it; only `store.js` calls it. On load every record is checked: fixable fields are repaired, unusable records are skipped, and the user gets a toast saying how many. Unreadable data is copied to `luma.data.backup` before starting fresh. Changes in one tab update other open tabs. The display name (Settings) is stored in `settings` and shown in the dashboard greeting.

Small UX extras agreed: Today / Tomorrow / Next week date chips, an **N** shortcut for a new task, "Load sample data" in Settings, Undo toast after completing a task, and a mobile bottom tab bar with a floating + button.

**Parked for later (do not build yet):** reminders and notifications. The idea is in-app reminders plus optional browser notifications in Milestone 6, then a PWA and .ics calendar export after the MVP.

## 2. Design direction: calm, dark-first app UI

A quiet, Linear-style interface: dark by default with a matching light theme, Inter throughout, one lavender accent, thin 1px borders, small radii and line icons. The light theme uses the brief's original palette.

### Colour tokens

All colours are CSS variables in `css/style.css`. Dark values sit on `:root`; `:root[data-theme="light"]` overrides them.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#0E0E10` | `#F7F7FB` | Behind everything |
| `--panel` | `#151517` | `#FFFFFF` | The main content panel |
| `--raised` | `#18181B` | `#FBFBFE` | Cards, hovered rows |
| `--raised-2` | `#1A1A1D` | `#F4F4F9` | Nav hover, group headers |
| `--control` | `#1B1B1F` | `#FFFFFF` | Buttons and inputs |
| `--control-hover` | `#232328` | `#F4F4F9` | Button hover, selected tab |
| `--selected` | `#1F1F23` | `#F0EEFF` | Current nav item |
| `--track` | `#26262B` | `#ECECF2` | Empty part of progress bars |
| `--line-soft` | `#1D1D21` | `#EFEFF4` | Row dividers, hour lines |
| `--line` | `#232327` | `#E6E6EE` | Card and panel borders |
| `--line-strong` | `#2A2A30` | `#DCDCE6` | Control borders |
| `--text-strong` | `#F2F2F4` | `#243047` | Headings |
| `--text` | `#E8E8EA` | `#283044` | Body text |
| `--text-2` | `#B4B4BC` | `#4C5468` | Secondary text, form labels |
| `--text-3` | `#8A8A93` | `#6B7183` | Muted meta |
| `--accent` | `#8B83D9` | `#8B83D9` | Primary buttons, focus, today's date |
| `--accent-soft` | `#A9A3EA` | `#6E66C9` | Active nav icon, focus ring |
| `--green` | `#45A982` | `#2B7A5B` | Completed, progress |
| `--amber` | `#E5AD57` | `#9A6410` | Due soon, deadlines, in progress |
| `--red` | `#DC6875` | `#C44A5A` | Overdue, errors, delete |

Light mode adds a faint shadow (`0 1px 2px rgba(36, 48, 71, 0.06)`) to cards and the panel; dark mode has none.

**Course palette** (shown as 8px dots and course badges): blue `#5B9CF6`, purple `#B58CF2`, orange `#E0A04F`, teal `#4FC1B0`, pink `#E58AB0`, sky `#6FB5D6`, grey `#A0A0A8`. General categories: Academic uses the accent, Personal grey, Extracurricular pink, Work sky, Projects green.

### Type

- **Inter** (400–700) from Google Fonts for everything. Numbers use `font-variant-numeric: tabular-nums` so they line up.
- h1 28px / 700 / -0.02em. h2 15px / 600. Body 13.5px / 1.45. Small and meta text 12.5px.
- Headings have no trailing period ("My Tasks"). Screen names use title case in navigation; buttons use sentence case ("Add task", "Plan my day").

### Shape

- **Radius:** nav items and icon buttons 6, buttons and inputs 7, segmented controls 8, cards 10, main panel and course cards 12, pills 999.
- **Borders:** 1px everywhere. Dashed 1px for "add" placeholders.
- **Layout:** a 220px sidebar on the background, and the content in one rounded panel with an 8px gap around it.
- **Focus:** `outline: 2px solid var(--accent-soft); outline-offset: 2px`.

### Components

- **Buttons:** 32px tall. Default is `--control` with a `--line-strong` border; primary is solid lavender with dark text.
- **Segmented control** for Day/Week, Priority, Status and Theme. The pressed option gets a `--line-strong` fill.
- **Tabs** (My Tasks views) are rounded pills with counts.
- **Priority:** a small 3-bar signal icon plus a text label; Urgent uses a red square with "!".
- **Status pills:** To do (grey), In progress (amber), Completed (green), each with a tinted background.
- **Progress:** a thin green bar beside "Today's tasks", and a green ring on the Daily progress card.
- **Deadlines:** collapsible groups (Overdue red, Due soon amber, Upcoming grey) with a date tile on each row.
- **Planner:** week header with a load bar per day; today's date in a lavender circle; work sessions are dashed-outline blocks, classes or events are tinted blocks.
- **Errors:** red field border plus red helper text under the field.

### Rules

- **Line icons** (16px, 1.5px stroke, `currentColor`) from `js/icons.js`. No emoji.
- The primary button may appear in the sidebar and once in a page header.
- Touch targets are at least 44px on phones. On phones the sidebar becomes a top bar, a bottom tab bar (Home, Tasks, Planner, Due, Courses) and a floating + button. The mockups don't cover phones, so this layout is our own.
