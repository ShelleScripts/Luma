# LUMA – MASTER PROJECT BRIEF & DEVELOPMENT SPECIFICATION

**Product tagline:** Your day, in focus.
**Project type:** Personal Productivity and Academic Management Web Application
**Development level:** Beginner to Intermediate
**Primary technologies:** HTML5, CSS3, Vanilla JavaScript
**Data storage:** Browser Local Storage
**Version:** 1.0 – MVP

---

# 1. YOUR ROLE

Act as a senior frontend developer, UI/UX designer, software architect and technical mentor.

You are helping me develop a complete, interactive productivity web application called **Luma**.

I am a Computer Science student with foundational knowledge of HTML, CSS and JavaScript. I want to strengthen my programming and software development skills through this project.

Help me build a well-structured, functional and visually appealing application while ensuring that the code remains understandable to a beginner developer.

Explain unfamiliar programming concepts, follow good development practices and implement the application in manageable stages.

# 2. PROJECT OVERVIEW

Luma is a personal productivity and academic management platform designed primarily for university students and young professionals.

The application provides a centralized environment where users can:

- Organize daily tasks and to-do lists.
- Manage academic assignments and deadlines.
- Plan daily and weekly schedules.
- Track completed and outstanding tasks.
- Organize responsibilities by course or category.
- Monitor upcoming deadlines.
- Review personal productivity and progress.

The main inspiration for this application comes from the difficulty of finding productivity platforms that combine simplicity, functionality and attractive design.

Platforms such as Notion offer extensive functionality but can feel overwhelming to users who simply want to organize their responsibilities without spending significant time configuring their workspace.

**Luma must solve this problem through simplicity.**

The application should be intuitive, visually engaging and easy to navigate, even for someone using a productivity application for the first time.

# 3. PRODUCT VISION AND OBJECTIVES

The vision is to create a personal productivity application that makes everyday organization easier.

The primary objectives are:

1. Provide an organized and easy-to-understand task management system.
2. Help students keep track of academic responsibilities and deadlines.
3. Allow users to plan and visualize their daily and weekly schedules.
4. Encourage consistent productivity through progress tracking.
5. Create a responsive and visually appealing user experience.
6. Build a technically sound project suitable for publication on GitHub and demonstration during technical interviews.

The application should prioritize functionality and usability over excessive features.

# 4. TARGET AUDIENCE

Primary users:

- University students.
- College students.
- Recent graduates.
- Young professionals.
- Individuals managing multiple personal and academic responsibilities.

The initial design should prioritize university students managing courses, assignments, quizzes, examinations, projects and extracurricular activities.

However, the application should remain flexible enough for users who want to organize personal and professional responsibilities.

# 5. CORE FUNCTIONAL REQUIREMENTS

## MODULE 1: PERSONAL DASHBOARD

The dashboard is the application's homepage.

It should provide a clear overview of the user's responsibilities.

Required components:

**A. Personalized greeting**

- Display a greeting based on the current time of day.
- Allow the user to set a preferred display name.
- Display the current date.

**B. Productivity overview**

Display summary cards showing:

- Total tasks.
- Tasks completed.
- Outstanding tasks.
- Upcoming deadlines.

All statistics must be calculated dynamically using saved task data.

**C. Today's Tasks**

Display tasks scheduled for the current day.

Each task should show:

- Task title.
- Scheduled time, if applicable.
- Priority.
- Associated course or category.
- Completion checkbox.

Users should be able to mark tasks as complete directly from the dashboard.

**D. Upcoming Deadlines**

Display the next five important deadlines.

Show:

- Task title.
- Deadline date.
- Associated course.
- Days remaining.
- Overdue indicators where applicable.

**E. Daily Progress**

Display a visual progress indicator based on completed tasks compared with total tasks scheduled for the day.

Update the progress indicator immediately when tasks are completed or reopened.

**F. Quick Actions**

Provide easily accessible buttons for:

- Add Task.
- Plan My Day.
- View All Tasks.

The dashboard should avoid overcrowding. Prioritize the information users need most.

## MODULE 2: TASK MANAGEMENT

This is the application's central functionality.

Users must be able to perform complete CRUD operations:

- Create tasks.
- View tasks.
- Edit tasks.
- Delete tasks.
- Mark tasks as complete.
- Reopen completed tasks.

### Task properties

Every task should support:

- Task title (required).
- Description (optional).
- Category or associated course.
- Task type.
- Priority.
- Status.
- Due date.
- Due time (optional).
- Scheduled date (optional).
- Scheduled start time (optional).
- Scheduled end time (optional).
- Personal notes (optional).
- Creation timestamp.
- Last updated timestamp.

### Task types

Provide predefined options:

- Assignment.
- Quiz.
- Examination.
- Reading.
- Project.
- Study Session.
- Personal.
- Other.

### Priority levels

- Low.
- Medium.
- High.
- Urgent.

Use clear visual indicators for each priority level.

### Task statuses

- To Do.
- In Progress.
- Completed.

### Task organization

Users should be able to:

- View all tasks.
- View tasks due today.
- View upcoming tasks.
- View completed tasks.
- Search tasks by title.
- Filter by status.
- Filter by priority.
- Filter by course or category.
- Sort by due date.
- Sort by priority.

Provide a clear and convenient Add Task action.

## MODULE 3: DAILY AND WEEKLY PLANNER

This module allows users to organize how they spend their time.

It is important to distinguish between a task's deadline and the time allocated to work on that task.

For example, an assignment might be due Friday but scheduled for Tuesday evening.

These must be stored separately.

### Daily Planner

Display a chronological timeline of activities for a selected date.

Users should be able to:

- View their scheduled tasks.
- View scheduled start and end times.
- Add new activities to specific time slots.
- Edit scheduled activities.
- Remove scheduled activities.
- Navigate between dates.
- See unscheduled tasks that still need to be planned.

### Weekly Planner

Provide a weekly overview running Monday through Sunday.

Display scheduled tasks across the seven days.

Users should be able to:

- Navigate between weeks.
- View scheduled activities.
- Identify busy and relatively free days.
- See tasks without scheduled time slots.
- Add activities to specific days.

Where two scheduled activities overlap, display a gentle conflict warning rather than silently creating confusion.

The interface should remain easy to understand and should not resemble a complicated enterprise calendar.

## MODULE 4: DEADLINE TRACKER

Create a dedicated screen for managing deadlines.

Organize deadlines into three sections:

**Overdue**

- Deadlines that have passed.
- Exclude completed tasks.

**Due Soon**

- Tasks due within the next seven calendar days.

**Upcoming**

- Tasks due more than seven days away.

Each deadline item should display:

- Task title.
- Associated course or category.
- Deadline date.
- Priority.
- Current status.

Provide clear visual indicators for overdue and approaching deadlines.

Users should be able to open the relevant task directly from the deadline list.

Deadline tracking must use the user's local date and time correctly.

A passed deadline must never automatically mark a task as completed or change its status.

## MODULE 5: COURSE AND CATEGORY MANAGEMENT

Allow users to create and manage courses or personal categories.

Each course should contain:

- Course name.
- Optional course code.
- Optional description.
- Assigned colour.

Users should be able to:

- Add courses.
- Edit course information.
- Delete courses.
- Assign tasks to courses.
- Filter tasks by course.

Also provide general categories such as:

- Academic.
- Personal.
- Extracurricular.
- Work.
- Projects.

Users should be able to organize non-academic responsibilities without being forced to associate them with a course.

If a course is deleted, existing tasks must not be accidentally deleted. Handle the relationship gracefully.

# 6. USER INTERFACE AND DESIGN REQUIREMENTS

The design is a major part of this project.

Luma must feel like a polished, modern productivity application rather than a basic student assignment.

## Design direction

Use an aesthetic that is:

- Minimalist.
- Modern.
- Soft and welcoming.
- Professional.
- Visually organized.
- Easy on the eyes.
- Consistent across all pages.

Avoid excessive colours, unnecessary animations, crowded layouts and complicated navigation.

## Suggested colour palette

- Deep navy: #243047
- Primary lavender: #8B83D9
- Soft lavender: #F0EEFF
- Light cream: #FAF9F6
- Background: #F7F7FB
- White: #FFFFFF
- Main text: #283044
- Secondary text: #858B9A
- Success green: #45A982
- Warning amber: #E5AD57
- Error red: #DC6875

Use these as initial design tokens. Maintain sufficient contrast and consistency.

## Typography

Use Inter or a similar modern sans-serif font.

Typography should establish a clear hierarchy:

- Page headings: prominent but not oversized.
- Section headings: medium emphasis.
- Body text: readable and comfortable.
- Supporting text: smaller and muted.
- Buttons: clear and consistent.

## Layout

Use a sidebar navigation layout on desktop.

The sidebar should contain:

- Luma branding.
- Dashboard.
- My Tasks.
- Planner.
- Deadlines.
- Courses.
- Settings.

Include a prominent Add Task action.

On smaller screens, use a compact navigation system suitable for mobile devices.

Use:

- Rounded cards.
- Consistent spacing.
- Subtle shadows.
- Light borders.
- Clear visual groupings.
- Reusable interface components.

Do not make every element a separate card. Maintain visual breathing room.

# 7. SCREEN-BY-SCREEN REQUIREMENTS

## SCREEN 1: DASHBOARD

Display:

- Personalized greeting.
- Current date.
- Productivity summary cards.
- Today's tasks.
- Upcoming deadlines.
- Daily progress indicator.
- Quick actions.

The dashboard must be dynamic and reflect changes to the saved data.

Provide a welcoming empty state when the user has no tasks.

## SCREEN 2: MY TASKS

Display:

- Page title.
- Add Task button.
- Search bar.
- Status filters.
- Priority filters.
- Category filters.
- Task list.

Each task should display:

- Completion checkbox.
- Task title.
- Course or category.
- Priority indicator.
- Due date.
- Status.
- Edit and delete actions.

On mobile, use stacked task cards rather than an overcrowded table.

## SCREEN 3: PLANNER

Include:

- Daily view.
- Weekly view.
- Date navigation.
- Chronological schedule.
- Scheduled task cards.
- Unscheduled task section.
- Add Activity action.

Make switching between daily and weekly views simple.

## SCREEN 4: DEADLINES

Include:

- Overdue tasks.
- Deadlines due soon.
- Upcoming deadlines.

Sort deadlines chronologically and provide links to individual tasks.

## SCREEN 5: COURSES AND CATEGORIES

Display courses as organized cards.

Allow users to add, edit and delete courses and assign colours.

Provide a separate section for personal categories.

## SCREEN 6: SETTINGS

Provide:

- Display name.
- Theme preferences.
- Week-start preference if practical.
- Data export.
- Data import.
- Clear all data with confirmation.

Do not implement user authentication in the MVP.

# 8. TASK DATA MODEL

Use a structured JavaScript object for each task.

Suggested properties:

- id
- title
- description
- categoryId
- taskType
- priority
- status
- dueDate
- dueTime
- scheduledDate
- scheduledStartTime
- scheduledEndTime
- notes
- createdAt
- updatedAt
- completedAt

Use unique identifiers for records.

Use consistent date representations, preferably ISO date strings for calendar dates and ISO timestamps for creation and modification times.

Do not treat a due date and a scheduled date as interchangeable.

Course records should have their own identifiers and should be referenced by tasks through categoryId or an appropriately named courseId.

# 9. DATA STORAGE AND PERSISTENCE

For the first version, use browser Local Storage.

Do not introduce a backend or database.

Create a dedicated storage module responsible for:

- Saving tasks.
- Retrieving tasks.
- Updating tasks.
- Deleting tasks.
- Saving courses and categories.
- Exporting data.
- Importing data.

Use JSON.stringify() and JSON.parse() appropriately.

Data must remain available after:

- Refreshing the browser.
- Closing and reopening the browser.
- Navigating between application pages.

Handle missing, corrupted or invalid stored data gracefully.

Use sensible Local Storage keys and consider a storage version to support future changes.

Provide JSON export and import functionality so users can back up and restore their data.

Never silently overwrite existing records during an import without informing the user.

# 10. TECHNICAL REQUIREMENTS

Use:

- HTML5.
- CSS3.
- Vanilla JavaScript.
- Browser Local Storage.
- Git and GitHub.

Do not use:

- React.
- Angular.
- Vue.
- TypeScript.
- Node.js.
- Backend frameworks.
- External databases.
- Unnecessary libraries.

Use separate files for structure, styling and application logic.

Suggested project structure:

luma/
│
├── index.html
│
├── css/
│   ├── style.css
│   ├── layout.css
│   ├── components.css
│   └── responsive.css
│
├── js/
│   ├── app.js
│   ├── tasks.js
│   ├── planner.js
│   ├── dashboard.js
│   ├── deadlines.js
│   ├── courses.js
│   ├── storage.js
│   └── utils.js
│
├── assets/
│   └── images/
│
├── screenshots/
│
├── README.md
└── .gitignore

You may recommend a different structure if there is a clear technical reason, but keep it beginner-friendly.

Avoid unnecessary duplication and keep each JavaScript module responsible for a clear set of functions.

# 11. VALIDATION AND ERROR HANDLING

Implement appropriate validation.

Examples:

- Task titles cannot be empty.
- Due dates must be valid.
- Scheduled end times must be later than scheduled start times.
- Required form fields must be completed.
- Invalid imported JSON must be rejected with an understandable message.
- Duplicate or missing identifiers must be handled safely.
- Deleting a task must require confirmation.
- Clearing all data must require explicit confirmation.

Display useful feedback for successful and unsuccessful actions.

Avoid relying exclusively on browser alert() dialogs. Prefer attractive in-application notifications, confirmation dialogs and validation messages.

# 12. NON-FUNCTIONAL REQUIREMENTS

**Usability:** A first-time user should be able to navigate the application without extensive instructions.

**Performance:** Common actions should execute quickly and update the interface immediately.

**Reliability:** Tasks and schedules must persist correctly.

**Responsiveness:** The application must work on desktop, tablet and mobile.

**Maintainability:** Code must be organized, readable and reusable.

**Accessibility:** Use semantic HTML, accessible labels, keyboard navigation, visible focus indicators and sufficient colour contrast.

**Consistency:** All screens should follow the same visual language and interaction patterns.

# 13. IMPORTANT UX BEHAVIOURS

Implement appropriate empty states.

Examples:

- Dashboard: "A fresh day, a fresh start. What would you like to accomplish?"
- My Tasks: "No tasks here yet. Add something you'd like to get done."
- Planner: "Your schedule is looking clear. Plan your next activity."
- Deadlines: "You're all caught up. No upcoming deadlines!"
- Courses: "Add your first course to start organizing your academic work."

Other expected behaviours:

- Completing a task updates progress immediately.
- Editing a task updates all relevant screens.
- Deleting a task removes it from all relevant views.
- Changing a deadline updates the deadline tracker.
- Changing a scheduled date updates the planner.
- Searching and filtering should work together.
- Navigation should never lead to broken or empty placeholder pages.
- All visible buttons and controls must perform their intended actions.

# 14. DEVELOPMENT MILESTONES

Implement Luma progressively.

**MILESTONE 1: Project Foundation and UI**

- Establish project structure.
- Create the main HTML layout.
- Implement the sidebar.
- Design the dashboard.
- Create the navigation system.
- Establish CSS design tokens.
- Implement responsive layouts.

**MILESTONE 2: Task Management**

- Create the task form.
- Implement task creation.
- Display task records.
- Implement editing and deletion.
- Add task completion.
- Add validation.

**MILESTONE 3: Local Storage**

- Implement persistent storage.
- Save and retrieve tasks.
- Save and retrieve courses.
- Ensure changes persist across refreshes.

**MILESTONE 4: Planner and Deadlines**

- Implement daily planner.
- Implement weekly planner.
- Implement schedule management.
- Implement deadline categorization.
- Add date navigation.

**MILESTONE 5: Dashboard and Organization**

- Implement dynamic statistics.
- Implement search and filtering.
- Implement sorting.
- Add course management.
- Add productivity progress indicators.

**MILESTONE 6: Testing and Refinement**

- Test all features.
- Fix bugs.
- Improve responsiveness.
- Improve accessibility.
- Handle edge cases.
- Refine the interface.
- Implement data export and import.

**MILESTONE 7: GitHub and Deployment**

- Prepare README documentation.
- Add screenshots.
- Document the technologies used.
- Explain installation and usage.
- Upload to GitHub.
- Deploy the application.

# 15. TESTING AND ACCEPTANCE CRITERIA

The MVP will be considered complete when:

1. Users can create, edit, delete and complete tasks.
2. Task records persist after refreshing the browser.
3. Users can organize tasks by course and category.
4. Users can set task priorities and deadlines.
5. Users can distinguish between deadlines and scheduled work periods.
6. The daily planner displays scheduled activities correctly.
7. The weekly planner displays the correct seven-day schedule.
8. The deadline tracker accurately categorizes overdue and upcoming tasks.
9. Dashboard statistics update when task data changes.
10. Search, filters and sorting work correctly.
11. The application provides meaningful empty states.
12. All main screens are responsive.
13. Data can be exported and imported safely.
14. There are no broken navigation links or non-functional buttons.
15. The browser console contains no unresolved application errors.

# 16. DEVELOPMENT AND COMMUNICATION RULES

I am learning software development, so I want to understand the application as it is being built.

Follow these rules:

- Do not generate the entire application in one response.
- Work on one milestone at a time.
- Explain the purpose of each file.
- Explain important functions and unfamiliar JavaScript concepts.
- Use beginner-friendly code without sacrificing good development practices.
- Do not unnecessarily overcomplicate the architecture.
- Do not introduce additional frameworks without my permission.
- Do not change the agreed requirements without discussing them.
- Do not leave placeholder buttons or non-functional features.
- Explain how to run and test each milestone.
- Identify which files need to be created or modified.
- When modifying existing files, provide the complete updated file where appropriate.
- Wait for me to test and approve a milestone before proceeding.

I will be using Claude as my coding assistant, while ChatGPT will help me with project planning, reviewing implementations, understanding code, troubleshooting and improving the product.

# 17. YOUR FIRST TASK

Before writing any code, carefully review this entire project specification.

Your first response should:

1. Demonstrate your understanding of Luma and the problem it solves.
2. Summarize the proposed technical architecture.
3. Explain how you intend to organize the frontend.
4. Identify any technical ambiguities, missing requirements or potential challenges.
5. Suggest any small improvements that would make the user experience better without unnecessarily expanding the scope.
6. Outline the implementation milestones.
7. Explain what will be included in the first milestone.

**DO NOT GENERATE CODE YET.**

Do not create files or begin implementation until I explicitly authorize you to start Milestone 1.

The priority is to build an intuitive, functional and visually excellent application that I will genuinely enjoy using throughout my university experience.

Remember: Luma should make productivity feel simpler, not more complicated.

**Let's build something useful, beautiful and worth showcasing on GitHub.**