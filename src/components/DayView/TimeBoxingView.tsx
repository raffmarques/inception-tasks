import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faCloudSun, faMoon, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { Task, TimeBoxBucket } from '../../types';
import { SortableTaskItem } from './SortableTaskItem';
import './TimeBoxingView.css';

interface Props {
  openTasks: Task[];
  bucketAssignments: Record<string, TimeBoxBucket>;
  onCycleStatus: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onSetAsHighlight: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onClearTaskBucket: (taskId: string) => void;
}

const BUCKETS: { key: TimeBoxBucket; label: string; icon: typeof faSun }[] = [
  { key: 'morning', label: 'Morning', icon: faSun },
  { key: 'afternoon', label: 'Afternoon', icon: faCloudSun },
  { key: 'night', label: 'Night', icon: faMoon },
];

function BucketZone({
  bucket,
  tasks,
  onCycleStatus,
  onUpdateTask,
  onDeleteTask,
  onSetAsHighlight,
  onTaskClick,
  onRemove,
}: {
  bucket: (typeof BUCKETS)[number];
  tasks: Task[];
  onCycleStatus: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onSetAsHighlight: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onRemove: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `bucket-${bucket.key}` });
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={`time-boxing__bucket${isOver ? ' time-boxing__bucket--over' : ''}`}
    >
      <div className="time-boxing__bucket-header">
        <FontAwesomeIcon icon={bucket.icon} className="time-boxing__bucket-icon" />
        <span className="time-boxing__bucket-label">{bucket.label}</span>
        <span className="time-boxing__bucket-count">{tasks.length}</span>
      </div>
      <div className="time-boxing__bucket-tasks">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <div key={task.id} className="time-boxing__task-wrapper">
              <SortableTaskItem
                task={task}
                onStatusChange={() => onCycleStatus(task.id)}
                onUpdate={(updates) => onUpdateTask(task.id, updates)}
                onDelete={() => onDeleteTask(task.id)}
                onSetAsHighlight={() => onSetAsHighlight(task.id)}
                onTaskClick={onTaskClick ? () => onTaskClick(task.id) : undefined}
              />
              <button
                className="time-boxing__remove-btn"
                onClick={() => onRemove(task.id)}
                title="Remove from bucket"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="time-boxing__bucket-empty">Drag tasks here</div>
        )}
      </div>
    </div>
  );
}

export function TimeBoxingView({
  openTasks,
  bucketAssignments,
  onCycleStatus,
  onUpdateTask,
  onDeleteTask,
  onSetAsHighlight,
  onTaskClick,
  onClearTaskBucket,
}: Props) {
  const { unassigned, bucketTasks } = useMemo(() => {
    const unassigned: Task[] = [];
    const bucketTasks: Record<TimeBoxBucket, Task[]> = {
      morning: [],
      afternoon: [],
      night: [],
    };

    for (const task of openTasks) {
      const bucket = bucketAssignments[task.id];
      if (bucket && bucketTasks[bucket]) {
        bucketTasks[bucket].push(task);
      } else {
        unassigned.push(task);
      }
    }

    return { unassigned, bucketTasks };
  }, [openTasks, bucketAssignments]);

  const unassignedIds = useMemo(() => unassigned.map((t) => t.id), [unassigned]);

  return (
    <div className="time-boxing">
      {unassigned.length > 0 && (
        <div className="time-boxing__unassigned">
          <div className="time-boxing__unassigned-header">
            Unassigned
            <span className="time-boxing__bucket-count">{unassigned.length}</span>
          </div>
          <SortableContext items={unassignedIds} strategy={verticalListSortingStrategy}>
            {unassigned.map((task) => (
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

      {BUCKETS.map((bucket) => (
        <BucketZone
          key={bucket.key}
          bucket={bucket}
          tasks={bucketTasks[bucket.key]}
          onCycleStatus={onCycleStatus}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onSetAsHighlight={onSetAsHighlight}
          onTaskClick={onTaskClick}
          onRemove={onClearTaskBucket}
        />
      ))}
    </div>
  );
}
