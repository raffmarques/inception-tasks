import { useState, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faTrash,
  faCalendarDays,
  faBullseye,
  faClock,
  faTag,
  faPaperclip,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, isBefore, isToday as isDateToday } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Task, SubTask, Attachment } from '../../types';
import { SIGNIFIERS } from '../../types';
import { formatTime, parseTimeInput } from '../../utils/time';
import { DateRangePopover } from '../TaskItem/DateRangePopover';
import './TaskDetail.css';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

interface Props {
  task: Task;
  allCategories: string[];
  onUpdate: (updates: Partial<Task>) => void;
  onClose: () => void;
  onCycleStatus: () => void;
  onDelete: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function deadlineUrgency(deadline: string): 'overdue' | 'today' | 'future' {
  const d = parseISO(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (isDateToday(d)) return 'today';
  if (isBefore(d, now)) return 'overdue';
  return 'future';
}

function formatDateBadge(start: string, end?: string): string {
  const s = parseISO(start);
  if (!end || end === start) return format(s, 'MMM d, yyyy');
  const e = parseISO(end);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${format(s, 'MMM d')}–${format(e, 'd, yyyy')}`;
  }
  return `${format(s, 'MMM d')}–${format(e, 'MMM d, yyyy')}`;
}

export function TaskDetail({ task, allCategories, onUpdate, onClose, onCycleStatus, onDelete }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.content);
  const [descValue, setDescValue] = useState(task.description ?? '');
  const [newSubtask, setNewSubtask] = useState('');
  const [categoryInput, setCategoryInput] = useState(task.category ?? '');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [timeInput, setTimeInput] = useState(task.timeEstimate ? formatTime(task.timeEstimate) : '');
  const [showPlannedPopover, setShowPlannedPopover] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const subtaskRef = useRef<HTMLInputElement>(null);
  const deadlineRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const interactable = task.status === 'open' || task.status === 'completed' || task.status === 'cancelled';

  // Title
  const commitTitle = useCallback(() => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== task.content) {
      onUpdate({ content: trimmed });
    }
    setEditingTitle(false);
    setTitleValue(task.content);
  }, [titleValue, task.content, onUpdate]);

  // Description
  const commitDescription = useCallback(() => {
    const val = descValue.trim() || undefined;
    if (val !== (task.description ?? undefined)) {
      onUpdate({ description: val });
    }
  }, [descValue, task.description, onUpdate]);

  // Category
  const commitCategory = useCallback(() => {
    const val = categoryInput.trim() || undefined;
    if (val !== (task.category ?? undefined)) {
      onUpdate({ category: val });
    }
    setShowCategorySuggestions(false);
  }, [categoryInput, task.category, onUpdate]);

  const filteredCategories = allCategories.filter(
    (c) => c.toLowerCase().includes(categoryInput.toLowerCase()) && c !== categoryInput,
  );

  // Time estimate
  const commitTime = useCallback(() => {
    const parsed = parseTimeInput(timeInput);
    if (parsed !== task.timeEstimate) {
      onUpdate({ timeEstimate: parsed });
    }
  }, [timeInput, task.timeEstimate, onUpdate]);

  // Subtasks
  const addSubtask = useCallback(() => {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    const sub: SubTask = { id: uuidv4(), content: trimmed, completed: false };
    onUpdate({ subtasks: [...(task.subtasks ?? []), sub] });
    setNewSubtask('');
    subtaskRef.current?.focus();
  }, [newSubtask, task.subtasks, onUpdate]);

  const toggleSubtask = useCallback((id: string) => {
    const updated = (task.subtasks ?? []).map((s) =>
      s.id === id ? { ...s, completed: !s.completed } : s,
    );
    onUpdate({ subtasks: updated });
  }, [task.subtasks, onUpdate]);

  const deleteSubtask = useCallback((id: string) => {
    const updated = (task.subtasks ?? []).filter((s) => s.id !== id);
    onUpdate({ subtasks: updated.length > 0 ? updated : undefined });
  }, [task.subtasks, onUpdate]);

  // Attachments
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large (max ${formatFileSize(MAX_FILE_SIZE)})`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const attachment: Attachment = {
        id: uuidv4(),
        name: file.name,
        type: file.type,
        data: reader.result as string,
        size: file.size,
      };
      onUpdate({ attachments: [...(task.attachments ?? []), attachment] });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [task.attachments, onUpdate]);

  const deleteAttachment = useCallback((id: string) => {
    const updated = (task.attachments ?? []).filter((a) => a.id !== id);
    onUpdate({ attachments: updated.length > 0 ? updated : undefined });
  }, [task.attachments, onUpdate]);

  const subtasks = task.subtasks ?? [];
  const attachments = task.attachments ?? [];
  const completedCount = subtasks.filter((s) => s.completed).length;

  return (
    <div className="task-detail__overlay">
      <div className="task-detail">
        {/* Header */}
        <div className="task-detail__header">
          <button className="task-detail__back" onClick={onClose}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="task-detail__header-actions">
            <button
              className="task-detail__header-btn task-detail__header-btn--delete"
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>

        {/* Status + Title */}
        <div className="task-detail__title-row">
          <button
            className={`task-detail__signifier task-detail__signifier--${task.status}`}
            onClick={interactable ? onCycleStatus : undefined}
            disabled={!interactable}
          >
            {SIGNIFIERS[task.status]}
          </button>
          {editingTitle ? (
            <input
              ref={titleRef}
              className="task-detail__title-input"
              value={titleValue}
              autoFocus
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') {
                  setEditingTitle(false);
                  setTitleValue(task.content);
                }
              }}
            />
          ) : (
            <h2
              className={`task-detail__title${task.status === 'completed' || task.status === 'cancelled' ? ' task-detail__title--done' : ''}`}
              onClick={() => {
                if (interactable) {
                  setEditingTitle(true);
                  setTitleValue(task.content);
                }
              }}
            >
              {task.content}
            </h2>
          )}
        </div>

        {/* Date row */}
        <div className="task-detail__dates">
          <div className="task-detail__date-item">
            <button
              className={`task-detail__date-btn${task.plannedStart ? ' task-detail__date-btn--active' : ''}`}
              onClick={() => interactable && setShowPlannedPopover(!showPlannedPopover)}
            >
              <FontAwesomeIcon icon={faCalendarDays} />
              {task.plannedStart ? (
                <span>{formatDateBadge(task.plannedStart, task.plannedEnd)}</span>
              ) : (
                <span className="task-detail__date-placeholder">Planned date</span>
              )}
            </button>
            {showPlannedPopover && (
              <div className="task-detail__popover-anchor">
                <DateRangePopover
                  startDate={task.plannedStart}
                  endDate={task.plannedEnd}
                  onSave={(start, end) => onUpdate({ plannedStart: start, plannedEnd: end })}
                  onClose={() => setShowPlannedPopover(false)}
                />
              </div>
            )}
          </div>

          <div className="task-detail__date-item">
            <input
              ref={deadlineRef}
              type="date"
              className="task-detail__hidden-input"
              tabIndex={-1}
              value={task.deadline ?? ''}
              onChange={(e) => onUpdate({ deadline: e.target.value || undefined })}
            />
            <button
              className={`task-detail__date-btn${task.deadline ? ` task-detail__date-btn--${deadlineUrgency(task.deadline)}` : ''}`}
              onClick={() => interactable && deadlineRef.current?.showPicker()}
            >
              <FontAwesomeIcon icon={faBullseye} />
              {task.deadline ? (
                <span>{format(parseISO(task.deadline), 'MMM d, yyyy')}</span>
              ) : (
                <span className="task-detail__date-placeholder">Deadline</span>
              )}
            </button>
          </div>
        </div>

        {/* Meta row: category + time estimate */}
        <div className="task-detail__meta">
          <div className="task-detail__meta-field">
            <FontAwesomeIcon icon={faTag} className="task-detail__meta-icon" />
            <div className="task-detail__category-wrapper">
              <input
                className="task-detail__meta-input"
                placeholder="Category"
                value={categoryInput}
                onChange={(e) => {
                  setCategoryInput(e.target.value);
                  setShowCategorySuggestions(true);
                }}
                onFocus={() => setShowCategorySuggestions(true)}
                onBlur={() => {
                  // Delay to allow suggestion click
                  setTimeout(() => {
                    commitCategory();
                    setShowCategorySuggestions(false);
                  }, 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitCategory();
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
              {showCategorySuggestions && filteredCategories.length > 0 && (
                <ul className="task-detail__suggestions">
                  {filteredCategories.map((cat) => (
                    <li
                      key={cat}
                      className="task-detail__suggestion"
                      onMouseDown={() => {
                        setCategoryInput(cat);
                        onUpdate({ category: cat });
                        setShowCategorySuggestions(false);
                      }}
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="task-detail__meta-field">
            <FontAwesomeIcon icon={faClock} className="task-detail__meta-icon" />
            <input
              className="task-detail__meta-input task-detail__meta-input--time"
              placeholder="e.g. 2h 30m"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              onBlur={commitTime}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitTime();
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="task-detail__section">
          <label className="task-detail__label">Notes</label>
          <textarea
            className="task-detail__textarea"
            placeholder="Add notes or description..."
            value={descValue}
            rows={4}
            onChange={(e) => setDescValue(e.target.value)}
            onBlur={commitDescription}
          />
        </div>

        {/* Subtasks */}
        <div className="task-detail__section">
          <div className="task-detail__section-header">
            <label className="task-detail__label">
              Subtasks
              {subtasks.length > 0 && (
                <span className="task-detail__count">{completedCount}/{subtasks.length}</span>
              )}
            </label>
          </div>

          {subtasks.length > 0 && (
            <div className="task-detail__subtask-progress">
              <div
                className="task-detail__subtask-progress-bar"
                style={{ width: `${subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0}%` }}
              />
            </div>
          )}

          <div className="task-detail__subtasks">
            {subtasks.map((sub) => (
              <div key={sub.id} className={`task-detail__subtask${sub.completed ? ' task-detail__subtask--done' : ''}`}>
                <button
                  className="task-detail__subtask-check"
                  onClick={() => toggleSubtask(sub.id)}
                >
                  {sub.completed ? '●' : '○'}
                </button>
                <span className="task-detail__subtask-text">{sub.content}</span>
                <button
                  className="task-detail__subtask-delete"
                  onClick={() => deleteSubtask(sub.id)}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            ))}
          </div>

          <div className="task-detail__subtask-add">
            <input
              ref={subtaskRef}
              className="task-detail__subtask-input"
              placeholder="Add subtask..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addSubtask();
              }}
            />
            <button
              className="task-detail__subtask-add-btn"
              onClick={addSubtask}
              disabled={!newSubtask.trim()}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        </div>

        {/* Attachments */}
        <div className="task-detail__section">
          <label className="task-detail__label">Attachments</label>

          {attachments.length > 0 && (
            <div className="task-detail__attachments">
              {attachments.map((att) => (
                <div key={att.id} className="task-detail__attachment">
                  <FontAwesomeIcon icon={faPaperclip} className="task-detail__attachment-icon" />
                  <a
                    className="task-detail__attachment-name"
                    href={att.data}
                    download={att.name}
                  >
                    {att.name}
                  </a>
                  <span className="task-detail__attachment-size">{formatFileSize(att.size)}</span>
                  <button
                    className="task-detail__attachment-delete"
                    onClick={() => deleteAttachment(att.id)}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            className="task-detail__hidden-input"
            tabIndex={-1}
            onChange={handleFileSelect}
          />
          <button
            className="task-detail__add-attachment"
            onClick={() => fileRef.current?.click()}
          >
            <FontAwesomeIcon icon={faPaperclip} /> Add attachment
          </button>
        </div>
      </div>
    </div>
  );
}
