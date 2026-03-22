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
  onDayClick: (date: string) => void;
  onSetMonthHighlight: (content: string) => void;
  onClearMonthHighlight: () => void;
}

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function MonthView({
  currentDate,
  days,
  highlights,
  monthHighlight,
  onDayClick,
  onSetMonthHighlight,
  onClearMonthHighlight,
}: Props) {
  const monthDays = getMonthDays(currentDate);

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

      {/* Vertical day list */}
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
                <button
                  key={dateKey}
                  className={`month-view__row ${isCurrentDay ? 'month-view__row--today' : ''}`}
                  onClick={() => onDayClick(dateKey)}
                >
                  <span className="month-view__date">
                    <span className="month-view__day-num">{dayNum}</span>
                    <span className="month-view__weekday">{weekdayLetter}</span>
                  </span>

                  <span className="month-view__items">
                    {dayHighlight && (
                      <span className="month-view__item month-view__item--highlight">
                        <FontAwesomeIcon icon={faSun} className="month-view__item-icon" />
                        {dayHighlight.content}
                      </span>
                    )}
                    {tasks.map((task) => (
                      <span key={task.id} className={`month-view__item month-view__item--${task.status}`}>
                        <span className="month-view__signifier">{SIGNIFIERS[task.status]}</span>
                        {task.content}
                      </span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
