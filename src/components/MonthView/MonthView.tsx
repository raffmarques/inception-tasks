import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import type { DayData, Highlight } from '../../types';
import { SIGNIFIERS } from '../../types';
import {
  getMonthDays,
  fromDateKey,
  isDayToday,
} from '../../utils/dates';
import { format, getISOWeek } from 'date-fns';
import './MonthView.css';

interface Props {
  currentDate: string;
  days: Record<string, DayData>;
  highlights: Record<string, Highlight>;
  monthHighlight?: Highlight;
  monthKey: string;
  onDayClick: (date: string) => void;
  onSetMonthHighlight: (content: string) => void;
  onClearMonthHighlight: () => void;
  onAddMonthTask: (content: string) => void;
  onCycleDayTaskStatus: (date: string, taskId: string) => void;
  onCycleMonthTaskStatus: (taskId: string) => void;
  onTaskClick: (dateKey: string, taskId: string) => void;
}

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function MonthView({
  currentDate,
  days,
  highlights,
  monthHighlight,
  monthKey,
  onDayClick,
  onSetMonthHighlight,
  onClearMonthHighlight,
  onAddMonthTask,
  onCycleDayTaskStatus,
  onCycleMonthTaskStatus,
  onTaskClick,
}: Props) {
  const monthDays = getMonthDays(currentDate);
  const monthTasks = days[monthKey]?.tasks ?? [];
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');

  // Group days by ISO week number for separators
  const weeks: string[][] = [];
  let currentWeek: string[] = [];
  let lastWeekNum = -1;

  for (const dateKey of monthDays) {
    const date = fromDateKey(dateKey);
    const weekNum = getISOWeek(date);
    if (lastWeekNum !== -1 && weekNum !== lastWeekNum) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(dateKey);
    lastWeekNum = weekNum;
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const handleAddTask = () => {
    const content = newTaskContent.trim();
    if (content) {
      onAddMonthTask(content);
      setNewTaskContent('');
    }
    setAddingTask(false);
  };

  return (
    <div className="month-view">
      {/* Month highlight */}
      <div className="month-view__highlight">
        {monthHighlight ? (
          <div className="month-view__highlight-set">
            <FontAwesomeIcon icon={faSun} className="month-view__sun" />
            <span className="month-view__highlight-text">{monthHighlight.content}</span>
            <button className="month-view__highlight-clear" onClick={onClearMonthHighlight}>
              clear
            </button>
          </div>
        ) : (
          <div className="month-view__highlight-empty">
            <FontAwesomeIcon icon={faSun} className="month-view__sun" />
            <input
              className="month-view__highlight-input"
              placeholder="This month's theme..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    onSetMonthHighlight(val);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Two-column body */}
      <div className="month-view__body">
        {/* Left: vertical day list */}
        <div className="month-view__list">
          {weeks.map((week, wi) => (
            <div key={wi} className="month-view__week">
              {week.map((dateKey) => {
                const date = fromDateKey(dateKey);
                const dayNum = format(date, 'd');
                const dayOfWeek = (date.getDay() + 6) % 7; // Monday=0
                const weekdayLetter = WEEKDAY_LETTERS[dayOfWeek];
                const isCurrentDay = isDayToday(dateKey);
                const day = days[dateKey];
                const dayHighlight = highlights[`day-${dateKey}`];
                const tasks = day?.tasks ?? [];

                return (
                  <div
                    key={dateKey}
                    className={`month-view__row ${isCurrentDay ? 'month-view__row--today' : ''}`}
                  >
                    <button
                      className="month-view__row-date-btn"
                      onClick={() => onDayClick(dateKey)}
                    >
                      <span className="month-view__date">
                        <span className="month-view__day-num">{dayNum}</span>
                        <span className="month-view__weekday">{weekdayLetter}</span>
                      </span>
                    </button>

                    <span className="month-view__items">
                      {dayHighlight && (
                        <span className="month-view__item month-view__item--highlight">
                          <FontAwesomeIcon icon={faSun} className="month-view__item-icon" />
                          {dayHighlight.content}
                        </span>
                      )}
                      {tasks.map((task) => (
                        <span key={task.id} className={`month-view__item month-view__item--${task.status}`}>
                          <button
                            className="month-view__signifier"
                            onClick={() => onCycleDayTaskStatus(dateKey, task.id)}
                          >
                            {SIGNIFIERS[task.status]}
                          </button>
                          <button
                            className="month-view__item-content"
                            onClick={() => onTaskClick(dateKey, task.id)}
                          >
                            {task.content}
                          </button>
                        </span>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right: month tasks panel */}
        <div className="month-view__panel">
          <div className="month-view__panel-label">Month</div>

          {monthTasks.map((task) => (
            <div key={task.id} className={`month-view__month-task month-view__month-task--${task.status}`}>
              <button
                className="month-view__month-task-sig"
                onClick={() => onCycleMonthTaskStatus(task.id)}
              >
                {SIGNIFIERS[task.status]}
              </button>
              <button
                className="month-view__month-task-content"
                onClick={() => onTaskClick(monthKey, task.id)}
              >
                {task.content}
              </button>
            </div>
          ))}

          {addingTask ? (
            <input
              className="month-view__panel-input"
              value={newTaskContent}
              placeholder="new task..."
              autoFocus
              onChange={(e) => setNewTaskContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') {
                  setNewTaskContent('');
                  setAddingTask(false);
                }
              }}
              onBlur={handleAddTask}
            />
          ) : (
            <button
              className="month-view__panel-add"
              onClick={() => setAddingTask(true)}
            >
              + add task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
