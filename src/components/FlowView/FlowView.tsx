import { useRef, useEffect, useState } from 'react';
import type { ZoomLevel, DayData, Highlight, Task } from '../../types';
import { SIGNIFIERS } from '../../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import {
  fromDateKey,
  toDateKey,
  toWeekKey,
  toMonthKey,
  toQuarterKey,
  toYearKey,
  getWeekDays,
  getMonthDays,
  getQuarterDays,
  getYearDays,
} from '../../utils/dates';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addQuarters,
  subQuarters,
  addYears,
  subYears,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  getISOWeek,
  getQuarter,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameQuarter,
  isSameYear,
} from 'date-fns';
import './FlowView.css';

interface Props {
  currentDate: string;
  currentZoom: ZoomLevel;
  days: Record<string, DayData>;
  highlights: Record<string, Highlight>;
  onAddTask: (date: string, content: string) => void;
  onCycleStatus: (date: string, taskId: string) => void;
  onDayClick: (date: string) => void;
  onZoomUp: (zoom: ZoomLevel) => void;
}

// How many columns to show on each side of current
const SPREAD = 3;

interface ColumnData {
  key: string;         // unique key
  title: string;       // e.g. "Thursday"
  subtitle: string;    // e.g. "March 12"
  isCurrent: boolean;
  dateKeys: string[];  // all day keys in this column (for gathering tasks)
  highlightKey?: string; // key into highlights record
}

function getColumns(currentDate: string, zoom: ZoomLevel): ColumnData[] {
  const now = new Date();
  const center = fromDateKey(currentDate);
  const columns: ColumnData[] = [];

  if (zoom === 'day') {
    for (let i = -SPREAD; i <= SPREAD; i++) {
      const d = i > 0 ? addDays(center, i) : i < 0 ? subDays(center, -i) : center;
      const key = toDateKey(d);
      columns.push({
        key,
        title: format(d, 'EEEE'),
        subtitle: format(d, 'MMMM d'),
        isCurrent: isSameDay(d, now),
        dateKeys: [key],
        highlightKey: `day-${key}`,
      });
    }
  } else if (zoom === 'week') {
    for (let i = -SPREAD; i <= SPREAD; i++) {
      const d = i > 0 ? addWeeks(center, i) : i < 0 ? subWeeks(center, -i) : center;
      const weekStart = startOfWeek(d, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(d, { weekStartsOn: 1 });
      const weekNum = getISOWeek(d);
      const year = format(weekStart, 'yyyy');
      const weekKey = toWeekKey(weekStart);
      const dayKeys = getWeekDays(toDateKey(weekStart));
      columns.push({
        key: weekKey,
        title: `W${weekNum}, ${year}`,
        subtitle: `${format(weekStart, 'd')}\u2013${format(weekEnd, 'd MMMM')}`,
        isCurrent: isSameWeek(d, now, { weekStartsOn: 1 }),
        dateKeys: dayKeys,
        highlightKey: `week-${weekKey}`,
      });
    }
  } else if (zoom === 'month') {
    for (let i = -SPREAD; i <= SPREAD; i++) {
      const d = i > 0 ? addMonths(center, i) : i < 0 ? subMonths(center, -i) : center;
      const monthStart = startOfMonth(d);
      const monthKey = toMonthKey(monthStart);
      const dayKeys = getMonthDays(toDateKey(monthStart));
      columns.push({
        key: monthKey,
        title: format(d, 'MMMM'),
        subtitle: format(d, 'yyyy'),
        isCurrent: isSameMonth(d, now),
        dateKeys: dayKeys,
        highlightKey: `month-${monthKey}`,
      });
    }
  } else if (zoom === 'quarter') {
    for (let i = -SPREAD; i <= SPREAD; i++) {
      const d = i > 0 ? addQuarters(center, i) : i < 0 ? subQuarters(center, -i) : center;
      const qStart = startOfQuarter(d);
      const qEnd = endOfQuarter(d);
      const quarterKey = toQuarterKey(qStart);
      const dayKeys = getQuarterDays(toDateKey(qStart));
      columns.push({
        key: quarterKey,
        title: `Q${getQuarter(d)}`,
        subtitle: `${format(qStart, 'MMM')}–${format(qEnd, 'MMM yyyy')}`,
        isCurrent: isSameQuarter(d, now),
        dateKeys: dayKeys,
        highlightKey: `quarter-${quarterKey}`,
      });
    }
  } else if (zoom === 'year') {
    for (let i = -SPREAD; i <= SPREAD; i++) {
      const d = i > 0 ? addYears(center, i) : i < 0 ? subYears(center, -i) : center;
      const yearStart = startOfYear(d);
      const yearKey = toYearKey(yearStart);
      const dayKeys = getYearDays(toDateKey(yearStart));
      columns.push({
        key: yearKey,
        title: format(d, 'yyyy'),
        subtitle: '',
        isCurrent: isSameYear(d, now),
        dateKeys: dayKeys,
      });
    }
  }

  return columns;
}

function getZoomUpLabel(zoom: ZoomLevel): string | null {
  switch (zoom) {
    case 'day': return 'WEEK';
    case 'week': return 'MONTH';
    case 'month': return 'QUARTER';
    case 'quarter': return 'YEAR';
    default: return null;
  }
}

function getZoomUpLevel(zoom: ZoomLevel): ZoomLevel | null {
  switch (zoom) {
    case 'day': return 'week';
    case 'week': return 'month';
    case 'month': return 'quarter';
    case 'quarter': return 'year';
    default: return null;
  }
}

export function FlowView({
  currentDate,
  currentZoom,
  days,
  highlights,
  onAddTask,
  onCycleStatus,
  onDayClick,
  onZoomUp,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const columns = getColumns(currentDate, currentZoom);
  const zoomUpLabel = getZoomUpLabel(currentZoom);
  const zoomUpLevel = getZoomUpLevel(currentZoom);

  // Scroll to center column on mount / when date changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const centerCol = el.querySelector('.flow-view__col--current') as HTMLElement;
    if (centerCol) {
      const scrollLeft = centerCol.offsetLeft - el.offsetWidth / 2 + centerCol.offsetWidth / 2;
      el.scrollTo({ left: scrollLeft, behavior: 'instant' });
    }
  }, [currentDate, currentZoom]);

  return (
    <div className="flow-view">
      <div className="flow-view__scroll" ref={scrollRef}>
        {columns.map((col) => {
          // Gather all tasks for this column
          const allTasks: { task: Task; dayDate: string }[] = [];
          for (const dk of col.dateKeys) {
            const day = days[dk];
            if (day) {
              for (const task of day.tasks) {
                allTasks.push({ task, dayDate: dk });
              }
            }
          }

          const highlight = col.highlightKey ? highlights[col.highlightKey] : undefined;

          return (
            <div
              key={col.key}
              className={`flow-view__col ${col.isCurrent ? 'flow-view__col--current' : ''}`}
            >
              <div
                className="flow-view__col-header"
                onClick={() => {
                  // Click header to navigate to that period in focus mode
                  if (col.dateKeys.length > 0) {
                    onDayClick(col.dateKeys[0]);
                  }
                }}
              >
                <div className={`flow-view__col-title ${col.isCurrent ? 'flow-view__col-title--current' : ''}`}>
                  {col.title}
                </div>
                <div className={`flow-view__col-subtitle ${col.isCurrent ? 'flow-view__col-subtitle--current' : ''}`}>
                  {col.subtitle}
                </div>
              </div>

              <div className="flow-view__col-body">
                {highlight && (
                  <div className="flow-view__highlight-item">
                    <FontAwesomeIcon icon={faSun} className="flow-view__highlight-icon" />
                    <span>{highlight.content}</span>
                  </div>
                )}

                {allTasks.map(({ task, dayDate }) => (
                  <div
                    key={task.id}
                    className={`flow-view__task flow-view__task--${task.status}`}
                    onClick={() => onCycleStatus(dayDate, task.id)}
                  >
                    <span className="flow-view__signifier">{SIGNIFIERS[task.status]}</span>
                    <span className="flow-view__task-content">{task.content}</span>
                  </div>
                ))}

                <FlowAddTask onAdd={(content) => {
                  // Add to first day in the column
                  if (col.dateKeys.length > 0) {
                    onAddTask(col.dateKeys[0], content);
                  }
                }} />
              </div>
            </div>
          );
        })}

        {/* Zoom-up edge label */}
        {zoomUpLabel && zoomUpLevel && (
          <button
            className="flow-view__zoom-label"
            onClick={() => onZoomUp(zoomUpLevel)}
            title={`Switch to ${zoomUpLabel.toLowerCase()} view`}
          >
            <span>{zoomUpLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function FlowAddTask({ onAdd }: { onAdd: (content: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <div className="flow-view__add">
      <span className="flow-view__signifier flow-view__signifier--add">{SIGNIFIERS.open}</span>
      <input
        className="flow-view__add-input"
        placeholder="Add..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onAdd(value.trim());
            setValue('');
          }
        }}
      />
    </div>
  );
}
