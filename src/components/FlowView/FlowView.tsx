import { useRef, useEffect, useState, useMemo } from 'react';
import { DndContext, useDroppable, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
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
import { PeriodPeekSidebar } from './PeriodPeekSidebar';
import './FlowView.css';

interface Props {
  currentDate: string;
  currentZoom: ZoomLevel;
  days: Record<string, DayData>;
  highlights: Record<string, Highlight>;
  onAddTask: (date: string, content: string) => void;
  onCycleStatus: (date: string, taskId: string) => void;
  onTaskClick: (date: string, taskId: string) => void;
  onMoveTask: (fromKey: string, taskId: string, toKey: string) => void;
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

interface PeriodParent {
  key: string;
  label: string;
  highlightKey: string;
}

function getPeriodParent(currentDate: string, zoom: ZoomLevel): PeriodParent | null {
  const d = fromDateKey(currentDate);
  if (zoom === 'day') {
    const ws = startOfWeek(d, { weekStartsOn: 1 });
    const key = toWeekKey(ws);
    return { key, label: `W${getISOWeek(d)}`, highlightKey: `week-${key}` };
  }
  if (zoom === 'week') {
    const ms = startOfMonth(d);
    const key = toMonthKey(ms);
    return { key, label: format(ms, 'MMMM'), highlightKey: `month-${key}` };
  }
  if (zoom === 'month') {
    const qs = startOfQuarter(d);
    const key = toQuarterKey(qs);
    return { key, label: `Q${getQuarter(d)}`, highlightKey: `quarter-${key}` };
  }
  if (zoom === 'quarter') {
    const ys = startOfYear(d);
    const key = toYearKey(ys);
    return { key, label: format(ys, 'yyyy'), highlightKey: `year-${key}` };
  }
  return null;
}

const ZOOM_UP: Partial<Record<ZoomLevel, { label: string; level: ZoomLevel }>> = {
  day:     { label: 'WEEK',    level: 'week' },
  week:    { label: 'MONTH',   level: 'month' },
  month:   { label: 'QUARTER', level: 'quarter' },
  quarter: { label: 'YEAR',    level: 'year' },
};

export function FlowView({
  currentDate,
  currentZoom,
  days,
  highlights,
  onAddTask,
  onCycleStatus,
  onTaskClick,
  onMoveTask,
  onDayClick,
  onZoomUp,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const columns = useMemo(() => getColumns(currentDate, currentZoom), [currentDate, currentZoom]);
  const zoomUp = ZOOM_UP[currentZoom];
  const periodParent = useMemo(() => getPeriodParent(currentDate, currentZoom), [currentDate, currentZoom]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const data = active.data.current;
    if (data?.type !== 'period-task') return;
    const targetKey = over.data.current?.dayKey as string | undefined;
    if (!targetKey || targetKey === data.periodKey) return;
    onMoveTask(data.periodKey, data.taskId, targetKey);
  }

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

  const periodTasks = periodParent ? (days[periodParent.key]?.tasks ?? []) : [];
  const periodHighlight = periodParent ? highlights[periodParent.highlightKey] : undefined;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
              <DroppableColumn
                key={col.key}
                col={col}
                allTasks={allTasks}
                highlight={highlight}
                onDayClick={onDayClick}
                onCycleStatus={onCycleStatus}
                onTaskClick={onTaskClick}
                onAddTask={onAddTask}
              />
            );
          })}

          {/* Zoom-up edge label */}
          {zoomUp && (
            <button
              className="flow-view__zoom-label"
              onClick={() => onZoomUp(zoomUp.level)}
              title={`Switch to ${zoomUp.label.toLowerCase()} view`}
            >
              <span>{zoomUp.label}</span>
            </button>
          )}
        </div>

        {periodParent && (
          <PeriodPeekSidebar
            periodKey={periodParent.key}
            periodLabel={periodParent.label}
            tasks={periodTasks}
            highlight={periodHighlight}
            onAddTask={(content) => onAddTask(periodParent.key, content)}
            onCycleStatus={(taskId) => onCycleStatus(periodParent.key, taskId)}
            onTaskClick={(taskId) => onTaskClick(periodParent.key, taskId)}
          />
        )}
      </div>
    </DndContext>
  );
}

function DroppableColumn({
  col,
  allTasks,
  highlight,
  onDayClick,
  onCycleStatus,
  onTaskClick,
  onAddTask,
}: {
  col: ColumnData;
  allTasks: { task: Task; dayDate: string }[];
  highlight: Highlight | undefined;
  onDayClick: (date: string) => void;
  onCycleStatus: (date: string, taskId: string) => void;
  onTaskClick: (date: string, taskId: string) => void;
  onAddTask: (date: string, content: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${col.key}`,
    data: { dayKey: col.dateKeys[0] ?? col.key },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flow-view__col ${col.isCurrent ? 'flow-view__col--current' : ''} ${isOver ? 'flow-view__col--drop-over' : ''}`}
    >
      <div
        className="flow-view__col-header"
        onClick={() => {
          if (col.dateKeys.length > 0) onDayClick(col.dateKeys[0]);
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
          >
            <span
              className="flow-view__signifier"
              onClick={() => onCycleStatus(dayDate, task.id)}
            >{SIGNIFIERS[task.status]}</span>
            <span
              className="flow-view__task-content"
              onClick={() => onTaskClick(dayDate, task.id)}
            >{task.content}</span>
          </div>
        ))}

        <FlowAddTask onAdd={(content) => {
          if (col.dateKeys.length > 0) onAddTask(col.dateKeys[0], content);
        }} />
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
