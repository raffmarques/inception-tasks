import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import type { Task, TimeEffortSession } from '../../types';
import { formatTime } from '../../utils/time';
import { SortableTaskItem } from './SortableTaskItem';
import './TimeEffortView.css';

interface Props {
  openTasks: Task[];
  session: TimeEffortSession;
  onSessionTimeChange: (minutes: number) => void;
  onRemoveFromSession: (taskId: string) => void;
  onCycleStatus: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onSetAsHighlight: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
}

export function TimeEffortView({
  openTasks,
  session,
  onSessionTimeChange,
  onRemoveFromSession,
  onCycleStatus,
  onUpdateTask,
  onDeleteTask,
  onSetAsHighlight,
  onTaskClick,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'session-drop' });

  const { sessionTasks, availableTasks } = useMemo(() => {
    const taskMap = new Map(openTasks.map((t) => [t.id, t]));
    const sessionTasks: Task[] = [];
    for (const id of session.taskIds) {
      const task = taskMap.get(id);
      if (task) sessionTasks.push(task);
    }
    const sessionSet = new Set(session.taskIds);
    const availableTasks = openTasks.filter((t) => !sessionSet.has(t.id));
    return { sessionTasks, availableTasks };
  }, [openTasks, session.taskIds]);

  const sessionTaskIds = useMemo(() => sessionTasks.map((t) => t.id), [sessionTasks]);
  const availableTaskIds = useMemo(() => availableTasks.map((t) => t.id), [availableTasks]);

  const usedMinutes = useMemo(
    () => sessionTasks.reduce((sum, t) => sum + (t.timeEstimate ?? 0), 0),
    [sessionTasks],
  );

  const ratio = session.totalMinutes > 0 ? usedMinutes / session.totalMinutes : 0;
  const progressClass =
    ratio > 1 ? 'time-effort__progress-fill--over' :
    ratio >= 0.8 ? 'time-effort__progress-fill--warn' : '';

  return (
    <div className="time-effort">
      {/* Slider */}
      <div className="time-effort__slider-row">
        <label className="time-effort__slider-label">Session time</label>
        <span className="time-effort__slider-value">{formatTime(session.totalMinutes)}</span>
      </div>
      <input
        type="range"
        className="time-effort__slider"
        min={15}
        max={480}
        step={15}
        value={session.totalMinutes}
        onChange={(e) => onSessionTimeChange(Number(e.target.value))}
      />

      {/* Progress bar */}
      <div className="time-effort__progress">
        <div className="time-effort__progress-bar">
          <div
            className={`time-effort__progress-fill ${progressClass}`}
            style={{ width: `${Math.min(ratio * 100, 100)}%` }}
          />
        </div>
        <span className="time-effort__progress-text">
          {formatTime(usedMinutes)} / {formatTime(session.totalMinutes)}
        </span>
      </div>

      {/* Session drop zone */}
      <div
        ref={setNodeRef}
        className={`time-effort__session${isOver ? ' time-effort__session--over' : ''}`}
      >
        <div className="time-effort__session-header">
          Session
          <span className="time-effort__session-count">{sessionTasks.length}</span>
        </div>
        <SortableContext items={sessionTaskIds} strategy={verticalListSortingStrategy}>
          {sessionTasks.map((task) => (
            <div key={task.id} className="time-effort__task-wrapper">
              <SortableTaskItem
                task={task}
                onStatusChange={() => onCycleStatus(task.id)}
                onUpdate={(updates) => onUpdateTask(task.id, updates)}
                onDelete={() => onDeleteTask(task.id)}
                onSetAsHighlight={() => onSetAsHighlight(task.id)}
                onTaskClick={onTaskClick ? () => onTaskClick(task.id) : undefined}
              />
              <div className="time-effort__task-meta">
                {task.timeEstimate && (
                  <span className="time-effort__task-time">{formatTime(task.timeEstimate)}</span>
                )}
                <button
                  className="time-effort__remove-btn"
                  onClick={() => onRemoveFromSession(task.id)}
                  title="Remove from session"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>
          ))}
        </SortableContext>
        {sessionTasks.length === 0 && (
          <div className="time-effort__session-empty">Drag tasks here to plan your session</div>
        )}
      </div>

      {/* Available tasks */}
      {availableTasks.length > 0 && (
        <div className="time-effort__available">
          <div className="time-effort__available-header">
            Available
            <span className="time-effort__session-count">{availableTasks.length}</span>
          </div>
          <SortableContext items={availableTaskIds} strategy={verticalListSortingStrategy}>
            {availableTasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                onStatusChange={() => onCycleStatus(task.id)}
                onUpdate={(updates) => onUpdateTask(task.id, updates)}
                onDelete={() => onDeleteTask(task.id)}
                onSetAsHighlight={() => onSetAsHighlight(task.id)}
                onTaskClick={onTaskClick ? () => onTaskClick(task.id) : undefined}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
