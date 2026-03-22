import { useDroppable } from '@dnd-kit/core';
import './ListsPanel.css';

interface Props {
  date: string;
  label: string;
}

export function DayDropZone({ date, label }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-drop-${date}` });

  return (
    <div
      ref={setNodeRef}
      className={`day-drop-zone${isOver ? ' day-drop-zone--over' : ''}`}
    >
      {label}
    </div>
  );
}
