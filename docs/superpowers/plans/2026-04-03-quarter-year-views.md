# Quarter View + Year View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a QuarterView component and replace the YearView table grid with a two-column layout, both following the same week/month view pattern already established in the codebase.

**Architecture:** Two new components — `QuarterView` (weeks grouped by month on left, quarter tasks on right) and a rebuilt `YearView` (months grouped by quarter on left, year tasks on right). The existing `YearView` table grid is extracted to `YearGrid.tsx` and preserved but not rendered. Both components are wired into `App.tsx` replacing the current quarter placeholder and year view.

**Tech Stack:** React 19 + TypeScript, date-fns, existing CSS variables/BEM conventions from `src/index.css`.

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `src/components/QuarterView/QuarterView.tsx` | Quarter view component |
| Create | `src/components/QuarterView/QuarterView.css` | Quarter view styles |
| Create | `src/components/YearView/YearGrid.tsx` | Extracted existing table grid (preserved, not rendered) |
| Modify | `src/components/YearView/YearView.tsx` | Replace with two-column month layout |
| Modify | `src/components/YearView/YearView.css` | Replace with new layout styles |
| Modify | `src/App.tsx` | Wire QuarterView; update YearView props |

---

## Task 1: Extract existing YearView grid to YearGrid

The current `YearView.tsx` is a table-based calendar grid. Extract it to `YearGrid.tsx` verbatim before replacing `YearView.tsx`, so it's preserved for the future Year Map feature.

**Files:**
- Create: `src/components/YearView/YearGrid.tsx`

- [ ] **Step 1: Copy current YearView.tsx to YearGrid.tsx**

Copy the entire contents of `src/components/YearView/YearView.tsx` to `src/components/YearView/YearGrid.tsx`, renaming the exported function from `YearView` to `YearGrid`:

```tsx
// src/components/YearView/YearGrid.tsx
// Preserved original table-based year grid. Not currently rendered.
// Will be used for the Year Map feature in the future.
import { useMemo } from 'react';
import { isToday, getDaysInMonth } from 'date-fns';
import { fromDateKey, toDateKey } from '../../utils/dates';
import type { DayData } from '../../types';
import './YearView.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX_WEEKS = 6;
const TOTAL_COLS = MAX_WEEKS * 7;

function mondayBasedDow(date: Date): number {
  const dow = date.getDay();
  return dow === 0 ? 6 : dow - 1;
}

interface CellData {
  day: number; col: number; dateKey: string;
  today: boolean; weekend: boolean; hasTasks: boolean;
}

interface Props {
  currentDate: string;
  days: Record<string, DayData>;
  onDayClick: (date: string) => void;
}

export function YearGrid({ currentDate, days, onDayClick }: Props) {
  const year = fromDateKey(currentDate).getFullYear();

  const monthRows = useMemo(() => {
    return MONTHS.map((name, monthIdx) => {
      const numDays = getDaysInMonth(new Date(year, monthIdx));
      const firstDow = mondayBasedDow(new Date(year, monthIdx, 1));
      const cells: CellData[] = [];
      for (let d = 1; d <= numDays; d++) {
        const col = firstDow + (d - 1);
        const date = new Date(year, monthIdx, d);
        const dateKey = toDateKey(date);
        cells.push({ day: d, col, dateKey, today: isToday(date), weekend: col % 7 >= 5, hasTasks: (days[dateKey]?.tasks?.length ?? 0) > 0 });
      }
      return { name, cells };
    });
  }, [year, days]);

  const weekendCols = new Set<number>();
  for (let c = 0; c < TOTAL_COLS; c++) { if (c % 7 >= 5) weekendCols.add(c); }

  return (
    <div className="year-view">
      <div className="year-view__scroll">
        <table className="year-view__table">
          <thead>
            <tr>
              <th className="year-view__corner">{year}</th>
              {Array.from({ length: TOTAL_COLS }, (_, c) => (
                <th key={c} className={`year-view__weekday ${weekendCols.has(c) ? 'year-view__weekday--weekend' : ''}`}>
                  {WEEKDAYS[c % 7]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthRows.map((month, mi) => {
              const row: (CellData | null)[] = new Array(TOTAL_COLS).fill(null);
              for (const cell of month.cells) row[cell.col] = cell;
              return (
                <tr key={mi}>
                  <td className="year-view__month-label">{month.name}</td>
                  {row.map((cell, ci) => {
                    const isWeekend = weekendCols.has(ci);
                    if (!cell) return <td key={ci} className={`year-view__cell year-view__cell--empty ${isWeekend ? 'year-view__cell--weekend' : ''}`} />;
                    return (
                      <td key={ci} className={'year-view__cell' + (cell.weekend ? ' year-view__cell--weekend' : '') + (cell.today ? ' year-view__cell--today' : '') + (cell.hasTasks ? ' year-view__cell--has-tasks' : '')} onClick={() => onDayClick(cell.dateKey)}>
                        <span className="year-view__day-num">{cell.day}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run build 2>&1 | grep -E "error|YearGrid"
```

Expected: no errors mentioning YearGrid.

- [ ] **Step 3: Commit**

```bash
git add src/components/YearView/YearGrid.tsx
git commit -m "refactor: extract YearGrid from YearView (preserved for Year Map)"
```

---

## Task 2: Build QuarterView component

**Files:**
- Create: `src/components/QuarterView/QuarterView.tsx`
- Create: `src/components/QuarterView/QuarterView.css`

### Understanding the data model before coding

- **Week-pinned tasks**: `days['2026-W09'].tasks` — tasks assigned to the whole week
- **Day-specific tasks in a week**: iterate `days['2026-03-09']` through `days['2026-03-15']`
- **Past weeks** show completed/migrated/cancelled tasks (both week-pinned + day tasks)
- **Current + future weeks** show open/scheduled tasks (both sources)
- **Date badge**: tasks from a specific day get a small label showing the day (e.g. `Mar 9`)
- **Quarter tasks**: `days['2026-Q1'].tasks`
- **Quarter highlight**: `highlights['quarter-2026-Q1']`

### Helper: getWeeksInQuarter

You'll need a helper that returns all ISO week keys in a quarter. Add it to `src/utils/dates.ts`:

```ts
export const getWeeksInQuarter = (dateKey: string): string[] => {
  const date = fromDateKey(dateKey);
  const start = startOfQuarter(date);
  const end = endOfQuarter(date);
  const weeks: string[] = [];
  let cur = startOfWeek(start, { weekStartsOn: 1 });
  while (cur <= end) {
    weeks.push(toWeekKey(cur));
    cur = addDays(cur, 7);
  }
  return [...new Set(weeks)]; // dedupe
};
```

Also add the needed import in dates.ts — `startOfWeek` and `addDays` are already imported.

- [ ] **Step 1: Add helpers to `src/utils/dates.ts`**

Open `src/utils/dates.ts`. The imports at the top already include `startOfQuarter`, `endOfQuarter`, `startOfWeek`, `addDays`. Add these exports at the end of the file:

```ts
export const getWeeksInQuarter = (dateKey: string): string[] => {
  const date = fromDateKey(dateKey);
  const qStart = startOfQuarter(date);
  const qEnd = endOfQuarter(date);
  const weeks: string[] = [];
  let cur = startOfWeek(qStart, { weekStartsOn: 1 });
  while (cur <= qEnd) {
    weeks.push(toWeekKey(cur));
    cur = addDays(cur, 7);
  }
  return [...new Set(weeks)];
};

/**
 * Returns the first day (Monday) of a week key like "2026-W09" as a YYYY-MM-DD string.
 * Used for navigating to a week from QuarterView.
 */
export const fromWeekKey = (weekKey: string): string => {
  const [yearStr, wStr] = weekKey.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  const jan4 = new Date(year, 0, 4);
  const weekOneMonday = startOfWeek(jan4, { weekStartsOn: 1 });
  const targetMonday = addDays(weekOneMonday, (week - 1) * 7);
  return toDateKey(targetMonday);
};

/**
 * Returns the first day of a month key like "2026-03" as a YYYY-MM-DD string.
 * Used for navigating to a month from YearView.
 */
export const fromMonthKey = (monthKey: string): string => `${monthKey}-01`;
```

- [ ] **Step 2: Verify build still passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ built in ...ms`

- [ ] **Step 3: Create `src/components/QuarterView/QuarterView.tsx`**

```tsx
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import type { DayData, Highlight, Task } from '../../types';
import { SIGNIFIERS } from '../../types';
import {
  fromDateKey,
  toWeekKey,
  getWeeksInQuarter,
} from '../../utils/dates';
import { format, startOfWeek, endOfWeek, getISOWeek, isBefore, isAfter, startOfDay } from 'date-fns';
import './QuarterView.css';

// ── Types ────────────────────────────────────────────────────────────────────

interface TaskWithDate {
  task: Task;
  dateKey: string; // the specific day key, or weekKey if week-pinned
  dayLabel?: string; // e.g. "Mar 9" — only set for day-specific tasks
}

type WeekPosition = 'past' | 'current' | 'future';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekPosition(weekKey: string): WeekPosition {
  const now = startOfDay(new Date());
  const date = fromDateKey(weekKey.replace(/W(\d+)$/, (_, w) => {
    // Parse week key back to a date using the first day of that ISO week
    return w; // handled below
  }));
  // Get first day of the given week
  const [yearStr, weekStr] = weekKey.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  // Find Jan 4 of the year (always in week 1), then offset
  const jan4 = new Date(year, 0, 4);
  const weekOneStart = startOfWeek(jan4, { weekStartsOn: 1 });
  const weekStart = new Date(weekOneStart.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

  if (isAfter(weekStart, now)) return 'future';
  if (isBefore(weekEnd, now)) return 'past';
  return 'current';
}

function getWeekDateRange(weekKey: string): { start: Date; end: Date } {
  const [yearStr, weekStr] = weekKey.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(year, 0, 4);
  const weekOneStart = startOfWeek(jan4, { weekStartsOn: 1 });
  const start = new Date(weekOneStart.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  return { start, end };
}

function collectWeekTasks(
  weekKey: string,
  days: Record<string, DayData>,
  position: WeekPosition,
): TaskWithDate[] {
  const results: TaskWithDate[] = [];
  const showStatuses = position === 'past'
    ? new Set(['completed', 'migrated', 'cancelled'])
    : new Set(['open', 'scheduled']);

  // Week-pinned tasks
  for (const task of days[weekKey]?.tasks ?? []) {
    if (showStatuses.has(task.status)) {
      results.push({ task, dateKey: weekKey });
    }
  }

  // Day-specific tasks within the week
  const { start, end } = getWeekDateRange(weekKey);
  let cur = new Date(start);
  while (cur <= end) {
    const dateKey = format(cur, 'yyyy-MM-dd');
    for (const task of days[dateKey]?.tasks ?? []) {
      if (showStatuses.has(task.status)) {
        results.push({
          task,
          dateKey,
          dayLabel: format(cur, 'MMM d'),
        });
      }
    }
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }

  return results;
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  currentDate: string;
  days: Record<string, DayData>;
  highlights: Record<string, Highlight>;
  quarterHighlight?: Highlight;
  quarterKey: string;
  onSetQuarterHighlight: (content: string) => void;
  onClearQuarterHighlight: () => void;
  onAddQuarterTask: (content: string) => void;
  onCycleQuarterTaskStatus: (taskId: string) => void;
  onCycleDayTaskStatus: (dateKey: string, taskId: string) => void;
  onTaskClick: (dateKey: string, taskId: string) => void;
  onWeekClick: (weekKey: string) => void;
}

export function QuarterView({
  currentDate,
  days,
  highlights,
  quarterHighlight,
  quarterKey,
  onSetQuarterHighlight,
  onClearQuarterHighlight,
  onAddQuarterTask,
  onCycleQuarterTaskStatus,
  onCycleDayTaskStatus,
  onTaskClick,
  onWeekClick,
}: Props) {
  const weekKeys = getWeeksInQuarter(currentDate);
  const quarterTasks = days[quarterKey]?.tasks ?? [];
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');

  // Group weeks by month label
  const monthGroups: { monthLabel: string; weeks: string[] }[] = [];
  for (const wk of weekKeys) {
    const { start } = getWeekDateRange(wk);
    const monthLabel = format(start, 'MMMM');
    const last = monthGroups[monthGroups.length - 1];
    if (!last || last.monthLabel !== monthLabel) {
      monthGroups.push({ monthLabel, weeks: [wk] });
    } else {
      last.weeks.push(wk);
    }
  }

  const handleAddTask = () => {
    const content = newTaskContent.trim();
    if (content) { onAddQuarterTask(content); setNewTaskContent(''); }
    setAddingTask(false);
  };

  const currentWeekKey = toWeekKey(fromDateKey(currentDate));

  return (
    <div className="quarter-view">
      {/* Quarter highlight */}
      <div className="quarter-view__highlight">
        {quarterHighlight ? (
          <div className="quarter-view__highlight-set">
            <FontAwesomeIcon icon={faSun} className="quarter-view__sun" />
            <span className="quarter-view__highlight-text">{quarterHighlight.content}</span>
            <button className="quarter-view__highlight-clear" onClick={onClearQuarterHighlight}>clear</button>
          </div>
        ) : (
          <div className="quarter-view__highlight-empty">
            <FontAwesomeIcon icon={faSun} className="quarter-view__sun" />
            <input
              className="quarter-view__highlight-input"
              placeholder="This quarter's focus..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) { onSetQuarterHighlight(val); (e.target as HTMLInputElement).value = ''; }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Two-column body */}
      <div className="quarter-view__body">
        {/* Left: weeks list */}
        <div className="quarter-view__list">
          {monthGroups.map((group) => (
            <div key={group.monthLabel} className="quarter-view__month-group">
              <div className="quarter-view__month-header">{group.monthLabel}</div>
              {group.weeks.map((wk) => {
                const position = getWeekPosition(wk);
                const isCurrent = wk === currentWeekKey;
                const tasksWithDates = collectWeekTasks(wk, days, position);
                const weekHighlight = highlights[`week-${wk}`];
                const { start, end } = getWeekDateRange(wk);
                const weekNum = getISOWeek(start);
                const dateRange = `${format(start, 'MMM d')}–${format(end, 'd')}`;

                return (
                  <div
                    key={wk}
                    className={[
                      'quarter-view__week-row',
                      isCurrent ? 'quarter-view__week-row--current' : '',
                      position === 'past' ? 'quarter-view__week-row--past' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <button
                      className={`quarter-view__week-label${isCurrent ? ' quarter-view__week-label--current' : ''}`}
                      onClick={() => onWeekClick(wk)}
                    >
                      W{weekNum}
                    </button>
                    <span className="quarter-view__week-dates">{dateRange}</span>
                    <div className="quarter-view__week-tasks">
                      {tasksWithDates.length === 0 && (
                        <span className="quarter-view__week-empty">—</span>
                      )}
                      {tasksWithDates.map(({ task, dateKey, dayLabel }) => (
                        <div key={task.id} className="quarter-view__task-line">
                          <button
                            className={`quarter-view__task-sig quarter-view__task-sig--${task.status}`}
                            onClick={() => {
                              if (dateKey === wk) onCycleQuarterTaskStatus(task.id);
                              else onCycleDayTaskStatus(dateKey, task.id);
                            }}
                          >
                            {SIGNIFIERS[task.status]}
                          </button>
                          <button
                            className={`quarter-view__task-text quarter-view__task-text--${task.status}`}
                            onClick={() => onTaskClick(dateKey, task.id)}
                          >
                            {task.content}
                          </button>
                          {dayLabel && (
                            <span className={`quarter-view__task-date${position === 'past' ? ' quarter-view__task-date--past' : ''}`}>
                              {dayLabel}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {weekHighlight && (
                      <span className="quarter-view__week-highlight">{weekHighlight.content}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right: quarter tasks panel */}
        <div className="quarter-view__panel">
          <div className="quarter-view__panel-label">{quarterKey}</div>
          {quarterTasks.map((task) => (
            <div key={task.id} className={`quarter-view__quarter-task quarter-view__quarter-task--${task.status}`}>
              <button
                className="quarter-view__quarter-task-sig"
                onClick={() => onCycleQuarterTaskStatus(task.id)}
              >
                {SIGNIFIERS[task.status]}
              </button>
              <button
                className="quarter-view__quarter-task-content"
                onClick={() => onTaskClick(quarterKey, task.id)}
              >
                {task.content}
              </button>
            </div>
          ))}
          {addingTask ? (
            <input
              className="quarter-view__panel-input"
              value={newTaskContent}
              placeholder="new task..."
              autoFocus
              onChange={(e) => setNewTaskContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') { setNewTaskContent(''); setAddingTask(false); }
              }}
              onBlur={handleAddTask}
            />
          ) : (
            <button className="quarter-view__panel-add" onClick={() => setAddingTask(true)}>
              + add task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/QuarterView/QuarterView.css`**

```css
.quarter-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Highlight bar */
.quarter-view__highlight {
  background: var(--bg-highlight);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
  padding: var(--space-md);
}

.quarter-view__highlight-set,
.quarter-view__highlight-empty {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.quarter-view__sun { color: var(--accent); flex-shrink: 0; }
.quarter-view__highlight-text { flex: 1; font-weight: 500; }
.quarter-view__highlight-clear { font-size: var(--fs-xs); color: var(--text-faint); }
.quarter-view__highlight-clear:hover { color: var(--danger); }
.quarter-view__highlight-input {
  flex: 1; border: none; background: transparent; padding: var(--space-xs);
}
.quarter-view__highlight-input:focus { border: none; }

/* Two-column body */
.quarter-view__body {
  display: flex;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

/* Left: weeks list */
.quarter-view__list {
  flex: 1;
  min-width: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

/* Month groupings */
.quarter-view__month-group {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--border);
}
.quarter-view__month-group:last-child { border-bottom: none; }

.quarter-view__month-header {
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-elevated);
}

/* Week row */
.quarter-view__week-row {
  display: flex;
  align-items: flex-start;
  gap: 0;
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 1px dotted var(--border-light);
  min-height: 28px;
}
.quarter-view__week-row:last-child { border-bottom: none; }

.quarter-view__week-row--current {
  background: var(--accent-light);
  box-shadow: inset 3px 0 0 var(--accent);
  border-bottom-color: transparent;
}

.quarter-view__week-label {
  font-size: var(--fs-xs);
  color: var(--text-faint);
  width: 32px;
  flex-shrink: 0;
  padding-top: 2px;
  text-align: left;
  padding: 2px 0 0 0;
}
.quarter-view__week-label--current {
  color: var(--accent);
  font-weight: 600;
}
.quarter-view__week-label:hover { color: var(--accent); }

.quarter-view__week-dates {
  font-size: var(--fs-xs);
  color: var(--text-faint);
  width: 72px;
  flex-shrink: 0;
  padding-top: 2px;
  font-variant-numeric: tabular-nums;
}

/* Task lines */
.quarter-view__week-tasks {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.quarter-view__week-empty {
  font-size: var(--fs-xs);
  color: var(--text-faint);
  padding-top: 2px;
}

.quarter-view__task-line {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  font-size: var(--fs-sm);
}

.quarter-view__task-sig {
  width: 12px;
  flex-shrink: 0;
  font-size: var(--fs-xs);
  text-align: center;
  padding: 0;
  color: var(--text);
}

.quarter-view__task-text {
  flex: 1;
  min-width: 0;
  text-align: left;
  padding: 0;
  font-size: var(--fs-sm);
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.quarter-view__task-text--completed,
.quarter-view__task-text--cancelled {
  color: var(--text-muted);
  text-decoration: line-through;
}

.quarter-view__task-text--migrated,
.quarter-view__task-text--scheduled {
  color: var(--text-faint);
}

.quarter-view__task-date {
  font-size: var(--fs-xs);
  color: var(--accent);
  background: var(--accent-light);
  padding: 1px 4px;
  border-radius: 2px;
  white-space: nowrap;
  flex-shrink: 0;
}

.quarter-view__task-date--past {
  color: var(--text-faint);
  background: var(--bg-elevated);
}

/* Week highlight note */
.quarter-view__week-highlight {
  font-size: var(--fs-xs);
  font-style: italic;
  color: var(--accent);
  border-left: 2px solid var(--border);
  padding-left: var(--space-xs);
  margin-left: var(--space-xs);
  align-self: flex-start;
  flex-shrink: 0;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-top: 2px;
}

/* Right: quarter tasks panel */
.quarter-view__panel {
  flex: 0 0 35%;
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.quarter-view__panel-label {
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-bottom: var(--space-xs);
}

.quarter-view__quarter-task {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--fs-sm);
  padding: 3px var(--space-xs);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-elevated);
  line-height: 1.4;
}

.quarter-view__quarter-task--completed,
.quarter-view__quarter-task--cancelled {
  color: var(--text-muted);
  text-decoration: line-through;
}

.quarter-view__quarter-task--migrated,
.quarter-view__quarter-task--scheduled {
  color: var(--text-faint);
}

.quarter-view__quarter-task-sig {
  width: 12px;
  flex-shrink: 0;
  font-size: var(--fs-xs);
  text-align: center;
  padding: 0;
  color: inherit;
}

.quarter-view__quarter-task-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  text-align: left;
  padding: 0;
  font-size: var(--fs-sm);
  color: inherit;
}

.quarter-view__panel-add {
  font-size: var(--fs-xs);
  color: var(--text-faint);
  text-align: left;
  padding: var(--space-xs) 0;
  border-top: 1px solid var(--border-light);
  margin-top: auto;
}
.quarter-view__panel-add:hover { color: var(--text-muted); }

.quarter-view__panel-input {
  font-size: var(--fs-sm);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  padding: 3px var(--space-xs);
  background: var(--bg-elevated);
  width: 100%;
}
```

- [ ] **Step 5: Run build**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ built in ...ms` (QuarterView not yet wired in App.tsx, that's fine)

- [ ] **Step 6: Commit**

```bash
git add src/components/QuarterView/ src/utils/dates.ts
git commit -m "feat: add QuarterView component with week rows and quarter tasks panel"
```

---

## Task 3: Wire QuarterView into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports to App.tsx**

Add after the existing `MonthView` import line:

```tsx
import { QuarterView } from './components/QuarterView/QuarterView';
```

Add `toQuarterKey` and `fromWeekKey` to the dates import:

```tsx
import { today, yesterday, toWeekKey, toMonthKey, toQuarterKey, fromDateKey, fromWeekKey, formatDayHeader } from './utils/dates';
```

- [ ] **Step 2: Replace the quarter placeholder in App.tsx**

Find this block in App.tsx:

```tsx
          {currentZoom === 'quarter' && (
            <div className="placeholder-view">
              <p className="placeholder-view__label">Quarter view coming soon</p>
            </div>
          )}
```

Replace with:

```tsx
          {currentZoom === 'quarter' && (() => {
            const quarterKey = toQuarterKey(fromDateKey(currentDate));
            return (
              <QuarterView
                currentDate={currentDate}
                days={days}
                highlights={highlights}
                quarterHighlight={getHighlight('quarter', quarterKey)}
                quarterKey={quarterKey}
                onSetQuarterHighlight={(content) => setHighlight('quarter', quarterKey, content)}
                onClearQuarterHighlight={() => clearHighlight('quarter', quarterKey)}
                onAddQuarterTask={(content) => addTask(quarterKey, content)}
                onCycleQuarterTaskStatus={(taskId) => cycleTaskStatus(quarterKey, taskId)}
                onCycleDayTaskStatus={(date, taskId) => cycleTaskStatus(date, taskId)}
                onTaskClick={(dateKey, taskId) => setSelectedTask({ date: dateKey, taskId })}
                onWeekClick={(weekKey) => {
                  setCurrentDate(fromWeekKey(weekKey));
                  setZoom('week');
                }}
              />
            );
          })()}
```

- [ ] **Step 3: Run build**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ built in ...ms`

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire QuarterView into App — replaces quarter placeholder"
```

---

## Task 4: Rebuild YearView with two-column layout

**Files:**
- Modify: `src/components/YearView/YearView.tsx`
- Modify: `src/components/YearView/YearView.css`

### Understanding the data

- Month rows show only **month-pinned tasks** from `days[monthKey]` (e.g. `days['2026-03']`)
- Month note = month highlight content from `highlights['month-2026-03']`
- Year tasks from `days[yearKey]` (e.g. `days['2026']`)
- Year highlight from `highlights['year-2026']`
- Current month: `toMonthKey(new Date())`

- [ ] **Step 1: Replace `src/components/YearView/YearView.tsx`**

```tsx
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import type { DayData, Highlight } from '../../types';
import { SIGNIFIERS } from '../../types';
import { fromDateKey, toMonthKey, toYearKey } from '../../utils/dates';
import { format, getQuarter, startOfYear, addMonths } from 'date-fns';
import './YearView.css';

const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4'];

interface MonthGroup {
  quarterLabel: string;
  months: { monthKey: string; monthName: string }[];
}

function getYearMonthGroups(year: number): MonthGroup[] {
  const groups: MonthGroup[] = [];
  const jan = new Date(year, 0, 1);
  for (let q = 0; q < 4; q++) {
    const months = [];
    for (let m = 0; m < 3; m++) {
      const date = addMonths(jan, q * 3 + m);
      months.push({
        monthKey: format(date, 'yyyy-MM'),
        monthName: format(date, 'MMMM'),
      });
    }
    groups.push({ quarterLabel: QUARTER_LABELS[q], months });
  }
  return groups;
}

type MonthPosition = 'past' | 'current' | 'future';

function getMonthPosition(monthKey: string): MonthPosition {
  const current = toMonthKey(new Date());
  if (monthKey < current) return 'past';
  if (monthKey === current) return 'current';
  return 'future';
}

interface Props {
  currentDate: string;
  days: Record<string, DayData>;
  highlights: Record<string, Highlight>;
  yearHighlight?: Highlight;
  yearKey: string;
  onSetYearHighlight: (content: string) => void;
  onClearYearHighlight: () => void;
  onAddYearTask: (content: string) => void;
  onCycleYearTaskStatus: (taskId: string) => void;
  onTaskClick: (dateKey: string, taskId: string) => void;
  onMonthClick: (monthKey: string) => void;
}

export function YearView({
  currentDate,
  days,
  highlights,
  yearHighlight,
  yearKey,
  onSetYearHighlight,
  onClearYearHighlight,
  onAddYearTask,
  onCycleYearTaskStatus,
  onTaskClick,
  onMonthClick,
}: Props) {
  const year = fromDateKey(currentDate).getFullYear();
  const monthGroups = getYearMonthGroups(year);
  const yearTasks = days[yearKey]?.tasks ?? [];
  const currentMonthKey = toMonthKey(new Date());

  const [addingTask, setAddingTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');

  const handleAddTask = () => {
    const content = newTaskContent.trim();
    if (content) { onAddYearTask(content); setNewTaskContent(''); }
    setAddingTask(false);
  };

  return (
    <div className="year-view">
      {/* Year highlight */}
      <div className="year-view__highlight">
        {yearHighlight ? (
          <div className="year-view__highlight-set">
            <FontAwesomeIcon icon={faSun} className="year-view__sun" />
            <span className="year-view__highlight-text">{yearHighlight.content}</span>
            <button className="year-view__highlight-clear" onClick={onClearYearHighlight}>clear</button>
          </div>
        ) : (
          <div className="year-view__highlight-empty">
            <FontAwesomeIcon icon={faSun} className="year-view__sun" />
            <input
              className="year-view__highlight-input"
              placeholder="This year's theme..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) { onSetYearHighlight(val); (e.target as HTMLInputElement).value = ''; }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Two-column body */}
      <div className="year-view__body">
        {/* Left: months list */}
        <div className="year-view__list">
          {monthGroups.map((group) => (
            <div key={group.quarterLabel} className="year-view__quarter-group">
              <div className="year-view__quarter-header">{group.quarterLabel}</div>
              {group.months.map(({ monthKey, monthName }) => {
                const position = getMonthPosition(monthKey);
                const isCurrent = monthKey === currentMonthKey;
                const showStatuses = position === 'past'
                  ? new Set(['completed', 'migrated', 'cancelled'])
                  : new Set(['open', 'scheduled']);
                const monthTasks = (days[monthKey]?.tasks ?? []).filter((t) => showStatuses.has(t.status));
                const monthNote = highlights[`month-${monthKey}`];

                return (
                  <div
                    key={monthKey}
                    className={[
                      'year-view__month-row',
                      isCurrent ? 'year-view__month-row--current' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <button
                      className={`year-view__month-label${isCurrent ? ' year-view__month-label--current' : ''}`}
                      onClick={() => onMonthClick(monthKey)}
                    >
                      {monthName}
                    </button>
                    <div className="year-view__month-tasks">
                      {monthTasks.length === 0 && !monthNote && (
                        <span className="year-view__month-empty">—</span>
                      )}
                      {monthTasks.map((task) => (
                        <div key={task.id} className="year-view__task-line">
                          <button
                            className={`year-view__task-sig year-view__task-sig--${task.status}`}
                            onClick={() => onCycleYearTaskStatus(task.id)}
                          >
                            {SIGNIFIERS[task.status]}
                          </button>
                          <button
                            className={`year-view__task-text year-view__task-text--${task.status}`}
                            onClick={() => onTaskClick(monthKey, task.id)}
                          >
                            {task.content}
                          </button>
                        </div>
                      ))}
                    </div>
                    {monthNote && (
                      <span className={`year-view__month-note${isCurrent ? ' year-view__month-note--current' : ''}`}>
                        {monthNote.content}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right: year tasks panel */}
        <div className="year-view__panel">
          <div className="year-view__panel-label">{year}</div>
          {yearTasks.map((task) => (
            <div key={task.id} className={`year-view__year-task year-view__year-task--${task.status}`}>
              <button
                className="year-view__year-task-sig"
                onClick={() => onCycleYearTaskStatus(task.id)}
              >
                {SIGNIFIERS[task.status]}
              </button>
              <button
                className="year-view__year-task-content"
                onClick={() => onTaskClick(yearKey, task.id)}
              >
                {task.content}
              </button>
            </div>
          ))}
          {addingTask ? (
            <input
              className="year-view__panel-input"
              value={newTaskContent}
              placeholder="new task..."
              autoFocus
              onChange={(e) => setNewTaskContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') { setNewTaskContent(''); setAddingTask(false); }
              }}
              onBlur={handleAddTask}
            />
          ) : (
            <button className="year-view__panel-add" onClick={() => setAddingTask(true)}>
              + add task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/components/YearView/YearView.css`**

```css
.year-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Highlight bar */
.year-view__highlight {
  background: var(--bg-highlight);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
  padding: var(--space-md);
}

.year-view__highlight-set,
.year-view__highlight-empty {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.year-view__sun { color: var(--accent); flex-shrink: 0; }
.year-view__highlight-text { flex: 1; font-weight: 500; }
.year-view__highlight-clear { font-size: var(--fs-xs); color: var(--text-faint); }
.year-view__highlight-clear:hover { color: var(--danger); }
.year-view__highlight-input {
  flex: 1; border: none; background: transparent; padding: var(--space-xs);
}
.year-view__highlight-input:focus { border: none; }

/* Two-column body */
.year-view__body {
  display: flex;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

/* Left: months list */
.year-view__list {
  flex: 1;
  min-width: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

/* Quarter groupings */
.year-view__quarter-group {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--border);
}
.year-view__quarter-group:last-child { border-bottom: none; }

.year-view__quarter-header {
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-elevated);
}

/* Month row */
.year-view__month-row {
  display: flex;
  align-items: flex-start;
  gap: 0;
  padding: var(--space-xs) var(--space-sm);
  border-bottom: 1px dotted var(--border-light);
  min-height: 28px;
}
.year-view__month-row:last-child { border-bottom: none; }

.year-view__month-row--current {
  background: var(--accent-light);
  box-shadow: inset 3px 0 0 var(--accent);
  border-bottom-color: transparent;
}

.year-view__month-label {
  font-size: var(--fs-sm);
  color: var(--text-muted);
  width: 80px;
  flex-shrink: 0;
  padding-top: 2px;
  text-align: left;
  padding: 2px 0 0 0;
}
.year-view__month-label--current {
  color: var(--accent);
  font-weight: 600;
}
.year-view__month-label:hover { color: var(--accent); }

/* Task lines */
.year-view__month-tasks {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.year-view__month-empty {
  font-size: var(--fs-xs);
  color: var(--text-faint);
  padding-top: 2px;
}

.year-view__task-line {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
}

.year-view__task-sig {
  width: 12px;
  flex-shrink: 0;
  font-size: var(--fs-xs);
  text-align: center;
  padding: 0;
  color: var(--text);
}

.year-view__task-text {
  flex: 1;
  min-width: 0;
  text-align: left;
  padding: 0;
  font-size: var(--fs-sm);
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.year-view__task-text--completed,
.year-view__task-text--cancelled {
  color: var(--text-muted);
  text-decoration: line-through;
}

.year-view__task-text--migrated,
.year-view__task-text--scheduled {
  color: var(--text-faint);
}

/* Month note (from month highlight) */
.year-view__month-note {
  font-size: var(--fs-xs);
  font-style: italic;
  color: var(--text-faint);
  border-left: 2px solid var(--border);
  padding-left: var(--space-xs);
  margin-left: var(--space-xs);
  align-self: flex-start;
  flex-shrink: 0;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-top: 2px;
}
.year-view__month-note--current {
  color: var(--accent);
  border-left-color: var(--accent);
}

/* Right: year tasks panel */
.year-view__panel {
  flex: 0 0 35%;
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.year-view__panel-label {
  font-size: var(--fs-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding-bottom: var(--space-xs);
}

.year-view__year-task {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--fs-sm);
  padding: 3px var(--space-xs);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-elevated);
  line-height: 1.4;
}

.year-view__year-task--completed,
.year-view__year-task--cancelled {
  color: var(--text-muted);
  text-decoration: line-through;
}

.year-view__year-task--migrated,
.year-view__year-task--scheduled {
  color: var(--text-faint);
}

.year-view__year-task-sig {
  width: 12px;
  flex-shrink: 0;
  font-size: var(--fs-xs);
  text-align: center;
  padding: 0;
  color: inherit;
}

.year-view__year-task-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  text-align: left;
  padding: 0;
  font-size: var(--fs-sm);
  color: inherit;
}

.year-view__panel-add {
  font-size: var(--fs-xs);
  color: var(--text-faint);
  text-align: left;
  padding: var(--space-xs) 0;
  border-top: 1px solid var(--border-light);
  margin-top: auto;
}
.year-view__panel-add:hover { color: var(--text-muted); }

.year-view__panel-input {
  font-size: var(--fs-sm);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  padding: 3px var(--space-xs);
  background: var(--bg-elevated);
  width: 100%;
}
```

- [ ] **Step 3: Run build**

```bash
npm run build 2>&1 | tail -8
```

Expected: TypeScript errors because App.tsx still passes old props to YearView. That's expected — fix in next step.

- [ ] **Step 4: Update YearView usage in App.tsx**

Find the current YearView block in App.tsx:

```tsx
          {currentZoom === 'year' && (
            <YearView
              currentDate={currentDate}
              days={days}
              onDayClick={(date) => {
                setCurrentDate(date);
                setZoom('day');
              }}
            />
          )}
```

Replace with:

```tsx
          {currentZoom === 'year' && (() => {
            const yearKey = toYearKey(fromDateKey(currentDate));
            return (
              <YearView
                currentDate={currentDate}
                days={days}
                highlights={highlights}
                yearHighlight={getHighlight('year', yearKey)}
                yearKey={yearKey}
                onSetYearHighlight={(content) => setHighlight('year', yearKey, content)}
                onClearYearHighlight={() => clearHighlight('year', yearKey)}
                onAddYearTask={(content) => addTask(yearKey, content)}
                onCycleYearTaskStatus={(taskId) => cycleTaskStatus(yearKey, taskId)}
                onTaskClick={(dateKey, taskId) => setSelectedTask({ date: dateKey, taskId })}
                onMonthClick={(monthKey) => {
                  setCurrentDate(fromMonthKey(monthKey));
                  setZoom('month');
                }}
              />
            );
          })()}
```

Also add `toYearKey` and `fromMonthKey` to the dates import in App.tsx:

```tsx
import { today, yesterday, toWeekKey, toMonthKey, toQuarterKey, toYearKey, fromDateKey, fromWeekKey, fromMonthKey, formatDayHeader } from './utils/dates';
```

- [ ] **Step 5: Run build — must be clean**

```bash
npm run build 2>&1 | tail -8
```

Expected: `✓ built in ...ms` with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/YearView/YearView.tsx src/components/YearView/YearView.css src/App.tsx
git commit -m "feat: rebuild YearView as two-column month layout with year tasks panel"
```

---

## Task 5: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Verify CLAUDE.md component structure section already reflects the new components**

The component structure in CLAUDE.md should already show `QuarterView/` and the updated `YearView/`. Check:

```bash
grep -n "QuarterView\|YearGrid\|YearView" CLAUDE.md
```

Expected: lines showing the new components. If missing, add them.

- [ ] **Step 2: Commit if updated**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for QuarterView and YearView changes"
```

---

## Task 6: Final verification

- [ ] **Step 1: Clean build**

```bash
npm run build 2>&1 | tail -10
```

Expected: `✓ built in ...ms`

- [ ] **Step 2: Lint**

```bash
npm run lint 2>&1 | tail -10
```

Expected: no errors (warnings about unused vars are fine if they pre-existed)

- [ ] **Step 3: Manual smoke test in browser**

```bash
npm run dev
```

Verify:
- Navigate to Quarter zoom level → QuarterView renders with week rows grouped by month
- Current week has warm background + copper left border
- Navigate to Year zoom level → YearView renders with 12 month rows grouped by Q1–Q4
- Current month has warm background + copper left border
- Right panels show task input and "+ add task" button
- Clicking "+ add task" in quarter panel → input appears → task added → appears in list
- Clicking "+ add task" in year panel → same
- Task signifier click → status cycles
- Task content click → TaskDetail overlay opens

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -p
git commit -m "fix: <describe any issues found>"
```
