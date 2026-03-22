import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskItem } from '../TaskItem/TaskItem';
import type { Task } from '../../types';

interface Props {
  task: Task;
  onStatusChange: () => void;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
  onSetAsHighlight?: () => void;
  onTaskClick?: () => void;
}

export function SortableTaskItem(props: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskItem {...props} dragListeners={listeners} isDragging={isDragging} />
    </div>
  );
}
