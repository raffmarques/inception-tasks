import { useMemo } from 'react';
import { isToday, getDaysInMonth } from 'date-fns';
import { fromDateKey, toDateKey } from '../../utils/dates';
import type { DayData } from '../../types';
import './YearView.css';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX_WEEKS = 6; // A month spans at most 6 calendar weeks
const TOTAL_COLS = MAX_WEEKS * 7; // 42

/** Returns 0=Mon .. 6=Sun for a given date */
function mondayBasedDow(date: Date): number {
  const dow = date.getDay(); // 0=Sun, 1=Mon .. 6=Sat
  return dow === 0 ? 6 : dow - 1;
}

interface CellData {
  day: number;
  col: number;
  dateKey: string;
  today: boolean;
  weekend: boolean;
  hasTasks: boolean;
}

interface Props {
  currentDate: string;
  days: Record<string, DayData>;
  onDayClick: (date: string) => void;
}

export function YearView({ currentDate, days, onDayClick }: Props) {
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

        cells.push({
          day: d,
          col,
          dateKey,
          today: isToday(date),
          weekend: col % 7 >= 5,
          hasTasks: (days[dateKey]?.tasks?.length ?? 0) > 0,
        });
      }

      return { name, cells };
    });
  }, [year, days]);

  // Build weekend column set for header highlighting
  const weekendCols = new Set<number>();
  for (let c = 0; c < TOTAL_COLS; c++) {
    if (c % 7 >= 5) weekendCols.add(c);
  }

  return (
    <div className="year-view">
      <div className="year-view__scroll">
        <table className="year-view__table">
          <thead>
            <tr>
              <th className="year-view__corner">{year}</th>
              {Array.from({ length: TOTAL_COLS }, (_, c) => (
                <th
                  key={c}
                  className={`year-view__weekday ${weekendCols.has(c) ? 'year-view__weekday--weekend' : ''}`}
                >
                  {WEEKDAYS[c % 7]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthRows.map((month, mi) => {
              // Sparse array for the row
              const row: (CellData | null)[] = new Array(TOTAL_COLS).fill(null);
              for (const cell of month.cells) {
                row[cell.col] = cell;
              }

              return (
                <tr key={mi}>
                  <td className="year-view__month-label">{month.name}</td>
                  {row.map((cell, ci) => {
                    const isWeekend = weekendCols.has(ci);

                    if (!cell) {
                      return (
                        <td
                          key={ci}
                          className={`year-view__cell year-view__cell--empty ${isWeekend ? 'year-view__cell--weekend' : ''}`}
                        />
                      );
                    }

                    return (
                      <td
                        key={ci}
                        className={
                          'year-view__cell' +
                          (cell.weekend ? ' year-view__cell--weekend' : '') +
                          (cell.today ? ' year-view__cell--today' : '') +
                          (cell.hasTasks ? ' year-view__cell--has-tasks' : '')
                        }
                        onClick={() => onDayClick(cell.dateKey)}
                      >
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
