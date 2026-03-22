import { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { DayData, Highlight, Task } from '../../types';
import { SIGNIFIERS } from '../../types';
import { getWeekDays, fromDateKey, isDayToday } from '../../utils/dates';
import { format, isWeekend } from 'date-fns';
import './WeekView.css';

// ── Draggable week task ──────────────────────────────────────────────────────

function DraggableWeekTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `week-task-${task.id}`,
    data: { taskId: task.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`week-view__week-task${isDragging ? ' week-view__week-task--dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <span className="week-view__week-task-grip">⠿</span>
      <span className="week-view__week-task-sig">{SIGNIFIERS[task.status]}</span>
      <span className="week-view__week-task-content">{task.content}</span>
    </div>
  );
}

// ── Droppable day row ────────────────────────────────────────────────────────

function DroppableDayRow({
  dateKey,
  day,
  dayHighlight,
  isToday,
  isWeekendDay,
  onDayClick,
  onCycleStatus,
}: {
  dateKey: string;
  day?: DayData;
  dayHighlight?: Highlight;
  isToday: boolean;
  isWeekendDay: boolean;
  onDayClick: (date: string) => void;
  onCycleStatus: (date: string, taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dateKey}` });
  const date = fromDateKey(dateKey);
  const dayNum = format(date, 'd');
  const dayName = format(date, 'EEE').toUpperCase().slice(0, 3);
  const tasks = day?.tasks ?? [];

  return (
    <div
      ref={setNodeRef}
      className={[
        'week-view__day-row',
        isToday ? 'week-view__day-row--today' : '',
        isWeekendDay ? 'week-view__day-row--weekend' : '',
        isOver ? 'week-view__day-row--over' : '',
      ].filter(Boolean).join(' ')}
    >
      <div className="week-view__day-header">
        <button
          className="week-view__day-date"
          onClick={() => onDayClick(dateKey)}
        >
          {dayName} {dayNum}
        </button>
        {dayHighlight && (
          <span className="week-view__day-highlight">
            <FontAwesomeIcon icon={faSun} size="xs" />
            {dayHighlight.content}
          </span>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="week-view__day-tasks">
          {tasks.map((task) => (
            <button
              key={task.id}
              className={`week-view__day-task week-view__day-task--${task.status}`}
              onClick={() => onCycleStatus(dateKey, task.id)}
            >
              <span className="week-view__day-task-sig">{SIGNIFIERS[task.status]}</span>
              <span className="week-view__day-task-content">{task.content}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  currentDate: string;
  days: Record<string, DayData>;
  highlights: Record<string, Highlight>;
  weekHighlight?: Highlight;
  weekKey: string;
  onDayClick: (date: string) => void;
  onSetWeekHighlight: (content: string) => void;
  onClearWeekHighlight: () => void;
  onAddWeekTask: (content: string) => void;
  onCycleDayTaskStatus: (date: string, taskId: string) => void;
  onMoveTaskToDay: (fromKey: string, taskId: string, toDate: string) => void;
}

export function WeekView({
  currentDate,
  days,
  highlights,
  weekHighlight,
  weekKey,
  onDayClick,
  onSetWeekHighlight,
  onClearWeekHighlight,
  onAddWeekTask,
  onCycleDayTaskStatus,
  onMoveTaskToDay,
}: Props) {
  const weekDays = getWeekDays(currentDate);
  const weekTasks = days[weekKey]?.tasks ?? [];

  const [addingTask, setAddingTask] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = (event.active.data.current as { taskId: string }).taskId;
    const task = weekTasks.find((t) => t.id === taskId) ?? null;
    setDraggingTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTask(null);
    if (!event.over) return;
    const overId = String(event.over.id);
    if (!overId.startsWith('day-')) return;
    const targetDate = overId.replace('day-', '');
    const taskId = (event.active.data.current as { taskId: string }).taskId;
    onMoveTaskToDay(weekKey, taskId, targetDate);
  };

  const handleAddTask = () => {
    const content = newTaskContent.trim();
    if (content) {
      onAddWeekTask(content);
      setNewTaskContent('');
    }
    setAddingTask(false);
  };

  return (
    <div className="week-view">
      {/* Week highlight */}
      <div className="week-view__highlight">
        {weekHighlight ? (
          <div className="week-view__highlight-set">
            <FontAwesomeIcon icon={faSun} className="week-view__sun" />
            <span className="week-view__highlight-text">{weekHighlight.content}</span>
            <button className="week-view__highlight-clear" onClick={onClearWeekHighlight}>
              clear
            </button>
          </div>
        ) : (
          <div className="week-view__highlight-empty">
            <FontAwesomeIcon icon={faSun} className="week-view__sun" />
            <input
              className="week-view__highlight-input"
              placeholder="This week's focus..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    onSetWeekHighlight(val);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Two-column body */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="week-view__body">

          {/* Left: day list */}
          <div className="week-view__days">
            {weekDays.map((dateKey) => {
              const date = fromDateKey(dateKey);
              return (
                <DroppableDayRow
                  key={dateKey}
                  dateKey={dateKey}
                  day={days[dateKey]}
                  dayHighlight={highlights[`day-${dateKey}`]}
                  isToday={isDayToday(dateKey)}
                  isWeekendDay={isWeekend(date)}
                  onDayClick={onDayClick}
                  onCycleStatus={onCycleDayTaskStatus}
                />
              );
            })}
          </div>

          {/* Right: week tasks panel */}
          <div className="week-view__panel">
            <div className="week-view__panel-label">Week</div>

            {weekTasks.map((task) => (
              <DraggableWeekTask key={task.id} task={task} />
            ))}

            {addingTask ? (
              <input
                ref={inputRef}
                className="week-view__panel-input"
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
                className="week-view__panel-add"
                onClick={() => setAddingTask(true)}
              >
                + add task
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {draggingTask ? (
            <div className="week-view__week-task week-view__week-task--overlay">
              <span className="week-view__week-task-grip">⠿</span>
              <span className="week-view__week-task-sig">{SIGNIFIERS[draggingTask.status]}</span>
              <span className="week-view__week-task-content">{draggingTask.content}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
