import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faSun, faGripVertical, faCalendarDays, faBullseye } from '@fortawesome/free-solid-svg-icons';
import { format, isBefore, isToday as isDateToday, parseISO } from 'date-fns';
import type { Task, TaskStatus } from '../../types';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { SIGNIFIERS } from '../../types';
import { DateRangePopover } from './DateRangePopover';
import './TaskItem.css';

interface Props {
  task: Task;
  onStatusChange: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onSetAsHighlight?: () => void;
  onTaskClick?: () => void;
  dragListeners?: SyntheticListenerMap;
  isDragging?: boolean;
}

const statusClass: Record<TaskStatus, string> = {
  open: '',
  completed: 'task-item--completed',
  migrated: 'task-item--migrated',
  scheduled: 'task-item--scheduled',
  cancelled: 'task-item--cancelled',
};

function formatDateBadge(start: string, end?: string): string {
  const s = parseISO(start);
  if (!end || end === start) {
    return format(s, 'MMM d');
  }
  const e = parseISO(end);
  if (s.getMonth() === e.getMonth()) {
    return `${format(s, 'MMM d')}–${format(e, 'd')}`;
  }
  return `${format(s, 'MMM d')}–${format(e, 'MMM d')}`;
}

function deadlineUrgency(deadline: string): 'overdue' | 'today' | 'future' {
  const d = parseISO(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (isDateToday(d)) return 'today';
  if (isBefore(d, now)) return 'overdue';
  return 'future';
}

export function TaskItem({ task, onStatusChange, onUpdate, onDelete, onSetAsHighlight, onTaskClick, dragListeners, isDragging }: Props) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.content);
  const [showPlannedPopover, setShowPlannedPopover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const deadlineRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.content) {
      onUpdate({ content: trimmed });
    }
    setEditing(false);
    setEditValue(task.content);
  };

  const interactable = task.status === 'open' || task.status === 'completed' || task.status === 'cancelled';

  const hasPlanned = !!task.plannedStart;
  const hasDeadline = !!task.deadline;
  const urgency = hasDeadline ? deadlineUrgency(task.deadline!) : null;

  return (
    <div className={`task-item ${statusClass[task.status]}${isDragging ? ' task-item--dragging' : ''}`}>
      {dragListeners && (
        <button
          className="task-item__drag-handle"
          {...dragListeners}
          title="Drag to reorder or drop on highlight"
        >
          <FontAwesomeIcon icon={faGripVertical} />
        </button>
      )}

      <button
        className="task-item__signifier"
        onClick={interactable ? onStatusChange : undefined}
        title={`Status: ${task.status}`}
        disabled={!interactable}
      >
        {SIGNIFIERS[task.status]}
      </button>

      <div className="task-item__body">
        {editing ? (
          <input
            ref={inputRef}
            className="task-item__edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') {
                setEditing(false);
                setEditValue(task.content);
              }
            }}
          />
        ) : (
          <span
            className={`task-item__content${onTaskClick ? ' task-item__content--clickable' : ''}`}
            onClick={onTaskClick}
            onDoubleClick={() => {
              if (interactable && !onTaskClick) {
                setEditing(true);
                setEditValue(task.content);
              }
            }}
          >
            {task.content}
            {(task.subtasks?.length ?? 0) > 0 && (
              <span className="task-item__subtask-count">
                {task.subtasks!.filter((s) => s.completed).length}/{task.subtasks!.length}
              </span>
            )}
            {task.category && (
              <span className="task-item__category-badge">{task.category}</span>
            )}
          </span>
        )}

        {(hasPlanned || hasDeadline) && (
          <div className="task-item__badges">
            {hasPlanned && (
              <button
                className="task-item__badge task-item__badge--planned"
                onClick={() => interactable && setShowPlannedPopover(true)}
                title="Planned date"
              >
                <FontAwesomeIcon icon={faCalendarDays} />
                <span>{formatDateBadge(task.plannedStart!, task.plannedEnd)}</span>
              </button>
            )}
            {hasDeadline && (
              <button
                className={`task-item__badge task-item__badge--deadline task-item__badge--${urgency}`}
                onClick={() => interactable && deadlineRef.current?.showPicker()}
                title={`Deadline: ${format(parseISO(task.deadline!), 'MMM d, yyyy')}`}
              >
                <FontAwesomeIcon icon={faBullseye} />
                <span>{format(parseISO(task.deadline!), 'MMM d')}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="task-item__actions">
        {interactable && (
          <>
            <div className="task-item__action-wrapper">
              <button
                className={`task-item__action task-item__action--planned${hasPlanned ? ' task-item__action--active' : ''}`}
                onClick={() => setShowPlannedPopover(!showPlannedPopover)}
                title="Set planned date"
              >
                <FontAwesomeIcon icon={faCalendarDays} />
              </button>
              {showPlannedPopover && (
                <DateRangePopover
                  startDate={task.plannedStart}
                  endDate={task.plannedEnd}
                  onSave={(start, end) => onUpdate({ plannedStart: start, plannedEnd: end })}
                  onClose={() => setShowPlannedPopover(false)}
                />
              )}
            </div>

            <input
              ref={deadlineRef}
              type="date"
              className="task-item__date-input"
              tabIndex={-1}
              value={task.deadline ?? ''}
              onChange={(e) => {
                onUpdate({ deadline: e.target.value || undefined });
              }}
            />
            <button
              className={`task-item__action task-item__action--deadline${hasDeadline ? ' task-item__action--active' : ''}`}
              onClick={() => deadlineRef.current?.showPicker()}
              title="Set deadline"
            >
              <FontAwesomeIcon icon={faBullseye} />
            </button>
          </>
        )}
        {onSetAsHighlight && task.status === 'open' && (
          <button
            className="task-item__action task-item__action--highlight"
            onClick={onSetAsHighlight}
            title="Set as today's highlight"
          >
            <FontAwesomeIcon icon={faSun} />
          </button>
        )}
        <button
          className="task-item__action task-item__action--delete"
          onClick={onDelete}
          title="Delete task"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
}
