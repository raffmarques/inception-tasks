import { useState, useRef, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import type { Task, Highlight as HighlightType, DayOrgData, DayOrgMode, TimeBoxBucket } from '../../types';
import type { DayData } from '../../types';
import type { CalendarEvent } from '../../hooks/useGoogleCalendar';
import { SIGNIFIERS } from '../../types';
import { Highlight } from '../Highlight/Highlight';
import { CalendarEvents } from '../CalendarEvents/CalendarEvents';
import { TaskItem } from '../TaskItem/TaskItem';
import { SortableTaskItem } from './SortableTaskItem';
import { ModeSelector } from './ModeSelector';
import { TimeBoxingView } from './TimeBoxingView';
import { TimeEffortView } from './TimeEffortView';
import { TimeEstimatePrompt } from './TimeEstimatePrompt';
import './DayView.css';

interface Props {
  dayData: DayData;
  highlight?: HighlightType;
  onAddTask: (content: string) => void;
  onCycleStatus: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onSetHighlight: (content: string, taskId?: string) => void;
  onClearHighlight: () => void;
  onReorderTask?: (taskId: string, newOrder: number) => void;
  onTaskClick?: (taskId: string) => void;
  calendarEvents?: CalendarEvent[];
  calendarLoading?: boolean;
  orgData: DayOrgData;
  onSetMode: (mode: DayOrgMode) => void;
  onSetSessionTime: (minutes: number) => void;
  onAddTaskToSession: (taskId: string) => void;
  onRemoveTaskFromSession: (taskId: string) => void;
  onReorderSession: (taskId: string, newIndex: number) => void;
  onSetTaskBucket: (taskId: string, bucket: TimeBoxBucket) => void;
  onClearTaskBucket: (taskId: string) => void;
}

export function DayView({
  dayData,
  highlight,
  onAddTask,
  onCycleStatus,
  onUpdateTask,
  onDeleteTask,
  onSetHighlight,
  onClearHighlight,
  onReorderTask,
  onTaskClick,
  calendarEvents,
  calendarLoading,
  orgData,
  onSetMode,
  onSetSessionTime,
  onAddTaskToSession,
  onRemoveTaskFromSession,
  onReorderSession,
  onSetTaskBucket,
  onClearTaskBucket,
}: Props) {
  const [newTaskValue, setNewTaskValue] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [pendingSessionTask, setPendingSessionTask] = useState<Task | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleAddTask = () => {
    const trimmed = newTaskValue.trim();
    if (!trimmed) return;
    onAddTask(trimmed);
    setNewTaskValue('');
    inputRef.current?.focus();
  };

  const openTasks = dayData.tasks.filter((t) => t.status === 'open');
  const completedTasks = dayData.tasks.filter((t) => t.status === 'completed');
  const otherTasks = dayData.tasks.filter(
    (t) => t.status !== 'open' && t.status !== 'completed',
  );

  const openTaskIds = useMemo(() => openTasks.map((t) => t.id), [openTasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = openTasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }, [openTasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    // Dropped on highlight zone
    if (over.id === 'highlight-drop') {
      const task = openTasks.find((t) => t.id === active.id);
      if (task) {
        onSetHighlight(task.content, task.id);
      }
      return;
    }

    // Time Effort: dropped on session zone
    if (over.id === 'session-drop') {
      const task = openTasks.find((t) => t.id === active.id);
      if (!task) return;
      const alreadyInSession = orgData.timeEffort?.taskIds?.includes(task.id);
      if (alreadyInSession) return;
      if (!task.timeEstimate) {
        setPendingSessionTask(task);
      } else {
        onAddTaskToSession(task.id);
      }
      return;
    }

    // Time-Boxing: dropped on a bucket
    const overId = String(over.id);
    if (overId.startsWith('bucket-')) {
      const bucket = overId.replace('bucket-', '') as TimeBoxBucket;
      onSetTaskBucket(active.id as string, bucket);
      return;
    }

    // Reorder within session (time-effort mode)
    if (orgData.mode === 'time-effort' && orgData.timeEffort?.taskIds?.includes(active.id as string)) {
      const sessionIds = orgData.timeEffort.taskIds.filter((id) =>
        openTasks.some((t) => t.id === id),
      );
      const newIndex = sessionIds.indexOf(over.id as string);
      if (newIndex !== -1 && active.id !== over.id) {
        onReorderSession(active.id as string, newIndex);
        return;
      }
    }

    // Reorder within task list (manual mode fallback)
    if (active.id !== over.id && onReorderTask) {
      const newIndex = openTasks.findIndex((t) => t.id === over.id);
      if (newIndex !== -1) {
        onReorderTask(active.id as string, newIndex);
      }
    }
  }, [openTasks, onSetHighlight, onReorderTask, orgData, onAddTaskToSession, onSetTaskBucket, onReorderSession]);

  const handleTimeEstimateConfirm = useCallback((minutes: number) => {
    if (!pendingSessionTask) return;
    onUpdateTask(pendingSessionTask.id, { timeEstimate: minutes });
    onAddTaskToSession(pendingSessionTask.id);
    setPendingSessionTask(null);
  }, [pendingSessionTask, onUpdateTask, onAddTaskToSession]);

  // Shared task rendering helpers
  const renderCompletedAndOther = () => (
    <>
      {completedTasks.length > 0 && (
        <>
          <div className="day-view__divider" />
          {completedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onStatusChange={() => onCycleStatus(task.id)}
              onUpdate={(updates) => onUpdateTask(task.id, updates)}
              onDelete={() => onDeleteTask(task.id)}
              onTaskClick={onTaskClick ? () => onTaskClick(task.id) : undefined}
            />
          ))}
        </>
      )}
      {otherTasks.length > 0 && (
        <>
          <div className="day-view__divider" />
          {otherTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onStatusChange={() => onCycleStatus(task.id)}
              onUpdate={(updates) => onUpdateTask(task.id, updates)}
              onDelete={() => onDeleteTask(task.id)}
              onTaskClick={onTaskClick ? () => onTaskClick(task.id) : undefined}
            />
          ))}
        </>
      )}
    </>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="day-view">
        <Highlight
          highlight={highlight}
          onSet={onSetHighlight}
          onClear={onClearHighlight}
          availableTasks={openTasks}
          droppable={activeTask !== null}
        />

        {calendarEvents && calendarEvents.length > 0 && orgData.mode === 'manual' && (
          <CalendarEvents events={calendarEvents} loading={calendarLoading} />
        )}

        <div className="day-view__add-task">
          <input
            ref={inputRef}
            className="day-view__add-input"
            value={newTaskValue}
            onChange={(e) => setNewTaskValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask();
            }}
            placeholder="Add a task..."
          />
          <button
            className="day-view__add-btn"
            onClick={handleAddTask}
            disabled={!newTaskValue.trim()}
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>

        <ModeSelector mode={orgData.mode} onChange={onSetMode} />

        <div className="day-view__tasks">
          {orgData.mode === 'manual' && (
            <>
              {openTasks.length === 0 && completedTasks.length === 0 && otherTasks.length === 0 && (
                <div className="day-view__empty">
                  <p>No tasks yet. Add one above, or set your highlight first.</p>
                </div>
              )}

              <SortableContext items={openTaskIds} strategy={verticalListSortingStrategy}>
                {openTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    onStatusChange={() => onCycleStatus(task.id)}
                    onUpdate={(updates) => onUpdateTask(task.id, updates)}
                    onDelete={() => onDeleteTask(task.id)}
                    onSetAsHighlight={() => onSetHighlight(task.content, task.id)}
                    onTaskClick={onTaskClick ? () => onTaskClick(task.id) : undefined}
                  />
                ))}
              </SortableContext>

              {renderCompletedAndOther()}
            </>
          )}

          {orgData.mode === 'time-boxing' && (
            <>
              <TimeBoxingView
                openTasks={openTasks}
                bucketAssignments={orgData.timeBoxing ?? {}}
                onCycleStatus={onCycleStatus}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onSetAsHighlight={(taskId) => {
                  const task = openTasks.find((t) => t.id === taskId);
                  if (task) onSetHighlight(task.content, task.id);
                }}
                onTaskClick={onTaskClick}
                onClearTaskBucket={onClearTaskBucket}
              />
              {renderCompletedAndOther()}
            </>
          )}

          {orgData.mode === 'time-effort' && (
            <>
              <TimeEffortView
                openTasks={openTasks}
                session={orgData.timeEffort ?? { totalMinutes: 60, taskIds: [] }}
                onSessionTimeChange={onSetSessionTime}
                onRemoveFromSession={onRemoveTaskFromSession}
                onCycleStatus={onCycleStatus}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onSetAsHighlight={(taskId) => {
                  const task = openTasks.find((t) => t.id === taskId);
                  if (task) onSetHighlight(task.content, task.id);
                }}
                onTaskClick={onTaskClick}
              />
              {renderCompletedAndOther()}
            </>
          )}
        </div>
      </div>

      {pendingSessionTask && (
        <TimeEstimatePrompt
          taskContent={pendingSessionTask.content}
          onConfirm={handleTimeEstimateConfirm}
          onCancel={() => setPendingSessionTask(null)}
        />
      )}

      <DragOverlay>
        {activeTask ? (
          <div className="task-item task-item--overlay">
            <span className="task-item__signifier">{SIGNIFIERS[activeTask.status]}</span>
            <span className="task-item__content">{activeTask.content}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
