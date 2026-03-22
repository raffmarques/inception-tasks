import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faPen, faXmark, faCheck } from '@fortawesome/free-solid-svg-icons';
import type { Highlight as HighlightType, Task } from '../../types';
import './Highlight.css';

interface Props {
  highlight?: HighlightType;
  onSet: (content: string, taskId?: string) => void;
  onClear: () => void;
  availableTasks?: Task[];
  droppable?: boolean;
}

export function Highlight({ highlight, onSet, onClear, availableTasks = [], droppable = false }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'highlight-drop',
    disabled: !droppable,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  const openEditor = () => {
    setInputValue(highlight?.content ?? '');
    setIsEditing(true);
    setShowTaskPicker(false);
  };

  const commitHighlight = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onSet(trimmed);
    }
    setIsEditing(false);
    setInputValue('');
  };

  const pickTask = (task: Task) => {
    onSet(task.content, task.id);
    setShowTaskPicker(false);
    setIsEditing(false);
  };

  // Empty state — no highlight set
  if (!highlight && !isEditing) {
    return (
      <div ref={setNodeRef} className={`highlight highlight--empty${isOver ? ' highlight--drop-active' : ''}`}>
        <div className="highlight__prompt">
          <FontAwesomeIcon icon={faSun} className="highlight__icon" />
          <span>What's your highlight for today?</span>
        </div>
        <div className="highlight__actions">
          <button className="highlight__btn" onClick={openEditor}>
            Write one
          </button>
          {availableTasks.length > 0 && (
            <button
              className="highlight__btn"
              onClick={() => {
                setShowTaskPicker(true);
                setIsEditing(true);
              }}
            >
              Pick from tasks
            </button>
          )}
        </div>
        {showTaskPicker && isEditing && (
          <div className="highlight__task-picker">
            {availableTasks.map((task) => (
              <button key={task.id} className="highlight__task-option" onClick={() => pickTask(task)}>
                {task.content}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Editing state
  if (isEditing) {
    return (
      <div className="highlight highlight--editing">
        <FontAwesomeIcon icon={faSun} className="highlight__icon" />
        {showTaskPicker ? (
          <div className="highlight__task-picker">
            {availableTasks.map((task) => (
              <button key={task.id} className="highlight__task-option" onClick={() => pickTask(task)}>
                {task.content}
              </button>
            ))}
            <button
              className="highlight__btn highlight__btn--secondary"
              onClick={() => {
                setShowTaskPicker(false);
              }}
            >
              Or type your own...
            </button>
          </div>
        ) : (
          <div className="highlight__edit-row">
            <input
              className="highlight__input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitHighlight();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              placeholder="Today's highlight..."
              autoFocus
            />
            <button className="highlight__confirm" onClick={commitHighlight}>
              <FontAwesomeIcon icon={faCheck} />
            </button>
            <button className="highlight__cancel" onClick={() => setIsEditing(false)}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Display state — highlight is set
  return (
    <div ref={setNodeRef} className={`highlight highlight--set${isOver ? ' highlight--drop-active' : ''}`}>
      <div className="highlight__label">
        <FontAwesomeIcon icon={faSun} className="highlight__icon" />
        today's highlight
      </div>
      <span className="highlight__content">{highlight!.content}</span>
      <div className="highlight__set-actions">
        <button className="highlight__edit-btn" onClick={openEditor} title="Edit highlight">
          <FontAwesomeIcon icon={faPen} />
        </button>
        <button className="highlight__clear-btn" onClick={onClear} title="Clear highlight">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
    </div>
  );
}
