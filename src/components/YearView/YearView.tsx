import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import type { DayData, Highlight } from '../../types';
import { SIGNIFIERS } from '../../types';
import { fromDateKey, toMonthKey } from '../../utils/dates';
import { format, addMonths } from 'date-fns';
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
                      position === 'past' ? 'year-view__month-row--past' : '',
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
