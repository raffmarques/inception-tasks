import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun } from '@fortawesome/free-solid-svg-icons';
import type { Task, Highlight } from '../../types';
import { SIGNIFIERS } from '../../types';

interface Props {
  periodKey: string;       // e.g. '2026-W12'
  periodLabel: string;     // e.g. 'W12' or 'March'
  tasks: Task[];
  highlight?: Highlight;
  onAddTask: (content: string) => void;
  onCycleStatus: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
}

export function PeriodPeekSidebar({
  periodKey,
  periodLabel,
  tasks,
  highlight,
  onAddTask,
  onCycleStatus,
  onTaskClick,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [addValue, setAddValue] = useState('');

  const openCount = tasks.filter((t) => t.status === 'open').length;
  const doneCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className={`peek-sidebar ${expanded ? 'peek-sidebar--expanded' : ''}`}>
      {/* Collapsed strip */}
      {!expanded && (
        <button
          className="peek-sidebar__strip"
          onClick={() => setExpanded(true)}
          title={`${periodLabel} — ${openCount} unscheduled`}
        >
          <span className="peek-sidebar__strip-label">{periodLabel}</span>
          <span className="peek-sidebar__strip-count">{openCount}</span>
          {highlight && (
            <FontAwesomeIcon icon={faSun} className="peek-sidebar__strip-star" />
          )}
        </button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div className="peek-sidebar__panel">
          <div className="peek-sidebar__panel-header">
            <div className="peek-sidebar__panel-title">{periodLabel}</div>
            <div className="peek-sidebar__panel-meta">
              {openCount} open · {doneCount} done
            </div>
            <button
              className="peek-sidebar__close"
              onClick={() => setExpanded(false)}
              aria-label="Collapse"
            >×</button>
          </div>

          {highlight && (
            <div className="peek-sidebar__highlight">
              <FontAwesomeIcon icon={faSun} className="peek-sidebar__highlight-icon" />
              <span>{highlight.content}</span>
            </div>
          )}

          <div className="peek-sidebar__tasks">
            {tasks.map((task) => (
              <DraggablePeriodTask
                key={task.id}
                task={task}
                periodKey={periodKey}
                onCycleStatus={onCycleStatus}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>

          <div className="peek-sidebar__add">
            <span className="peek-sidebar__signifier">{SIGNIFIERS.open}</span>
            <input
              className="peek-sidebar__add-input"
              placeholder="Add..."
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && addValue.trim()) {
                  onAddTask(addValue.trim());
                  setAddValue('');
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DraggablePeriodTask({
  task,
  periodKey,
  onCycleStatus,
  onTaskClick,
}: {
  task: Task;
  periodKey: string;
  onCycleStatus: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `period-task-${task.id}`,
    data: { type: 'period-task', taskId: task.id, periodKey },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`peek-sidebar__task peek-sidebar__task--${task.status}`}
    >
      <span
        className="peek-sidebar__signifier"
        onClick={() => onCycleStatus(task.id)}
      >
        {SIGNIFIERS[task.status]}
      </span>
      <span
        className="peek-sidebar__task-content"
        {...listeners}
        {...attributes}
        onClick={() => onTaskClick?.(task.id)}
      >
        {task.content}
      </span>
    </div>
  );
}
