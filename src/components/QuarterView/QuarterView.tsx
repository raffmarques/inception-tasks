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
import { format, startOfWeek, getISOWeek, isBefore, isAfter, startOfDay, addDays } from 'date-fns';
import './QuarterView.css';

// ── Types ────────────────────────────────────────────────────────────────────

interface TaskWithDate {
  task: Task;
  dateKey: string; // the specific day key, or weekKey if week-pinned
  dayLabel?: string; // e.g. "Mar 9" — only set for day-specific tasks
}

type WeekPosition = 'past' | 'current' | 'future';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDateRange(weekKey: string): { start: Date; end: Date } {
  const [yearStr, wStr] = weekKey.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  const jan4 = new Date(year, 0, 4);
  const weekOneMonday = startOfWeek(jan4, { weekStartsOn: 1 });
  const start = addDays(weekOneMonday, (week - 1) * 7);
  const end = addDays(start, 6);
  return { start, end };
}

function getWeekPosition(weekKey: string): WeekPosition {
  const now = startOfDay(new Date());
  const { start, end } = getWeekDateRange(weekKey);
  if (isAfter(start, now)) return 'future';
  if (isBefore(end, now)) return 'past';
  return 'current';
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
    cur = addDays(cur, 1);
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
