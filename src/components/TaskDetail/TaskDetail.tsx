import { useState, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faTrash,
  faPaperclip,
  faXmark,
  faBell,
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { Task, SubTask, Attachment } from '../../types';
import { SIGNIFIERS } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';
import { MiniCalendar } from './MiniCalendar';
import './TaskDetail.css';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

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

function formatDateRange(start?: string, end?: string): string {
  if (!start) return '';
  const s = format(parseISO(start), 'MMM d');
  if (!end || end === start) return s;
  const startMonth = format(parseISO(start), 'MMM');
  const endMonth = format(parseISO(end), 'MMM');
  const e = startMonth === endMonth ? format(parseISO(end), 'd') : format(parseISO(end), 'MMM d');
  return `${s} → ${e}`;
}

const NOTIFICATION_OPTIONS = [
  { label: 'None', value: '' },
  { label: '1 hour before', value: '1h' },
  { label: '2 hours before', value: '2h' },
  { label: '1 day before', value: '1d' },
  { label: '2 days before', value: '2d' },
  { label: '1 week before', value: '1w' },
];

export function TaskDetail({ task, allCategories, onUpdate, onClose, onCycleStatus, onDelete }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.content);
  const [descValue, setDescValue] = useState(task.description ?? '');
  const [newSubtask, setNewSubtask] = useState('');
  const [categoryInput, setCategoryInput] = useState(task.category ?? '');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [timeInput, setTimeInput] = useState(() => {
    if (!task.timeEstimate) return '';
    const h = Math.floor(task.timeEstimate / 60);
    const m = task.timeEstimate % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  });
  const [openCal, setOpenCal] = useState<'planned' | 'deadline' | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const subtaskRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const interactable = task.status === 'open' || task.status === 'completed' || task.status === 'cancelled';
  const { requestPermission } = useNotifications([task]);

  // ── Title ────────────────────────────────────────────────────────────────

  const commitTitle = useCallback(() => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== task.content) onUpdate({ content: trimmed });
    setEditingTitle(false);
    setTitleValue(task.content);
  }, [titleValue, task.content, onUpdate]);

  // ── Description ──────────────────────────────────────────────────────────

  const commitDescription = useCallback(() => {
    const val = descValue.trim() || undefined;
    if (val !== (task.description ?? undefined)) onUpdate({ description: val });
  }, [descValue, task.description, onUpdate]);

  // ── Category ─────────────────────────────────────────────────────────────

  const commitCategory = useCallback(() => {
    const val = categoryInput.trim() || undefined;
    if (val !== (task.category ?? undefined)) onUpdate({ category: val });
    setShowCategorySuggestions(false);
  }, [categoryInput, task.category, onUpdate]);

  const filteredCategories = allCategories.filter(
    (c) => c.toLowerCase().includes(categoryInput.toLowerCase()) && c !== categoryInput,
  );

  // ── Time estimate ─────────────────────────────────────────────────────────

  const commitTime = useCallback(() => {
    const raw = timeInput.trim().toLowerCase();
    if (!raw) { onUpdate({ timeEstimate: undefined }); return; }
    let total = 0;
    const hMatch = raw.match(/(\d+)\s*h/);
    const mMatch = raw.match(/(\d+)\s*m/);
    if (hMatch) total += parseInt(hMatch[1]) * 60;
    if (mMatch) total += parseInt(mMatch[1]);
    if (!hMatch && !mMatch) { const n = parseInt(raw); if (!isNaN(n)) total = n; }
    if (total !== task.timeEstimate) onUpdate({ timeEstimate: total || undefined });
  }, [timeInput, task.timeEstimate, onUpdate]);

  // ── Subtasks ──────────────────────────────────────────────────────────────

  const addSubtask = useCallback(() => {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    const sub: SubTask = { id: uuidv4(), content: trimmed, completed: false };
    onUpdate({ subtasks: [...(task.subtasks ?? []), sub] });
    setNewSubtask('');
    subtaskRef.current?.focus();
  }, [newSubtask, task.subtasks, onUpdate]);

  const toggleSubtask = useCallback((id: string) => {
    const updated = (task.subtasks ?? []).map((s) => s.id === id ? { ...s, completed: !s.completed } : s);
    onUpdate({ subtasks: updated });
  }, [task.subtasks, onUpdate]);

  const deleteSubtask = useCallback((id: string) => {
    const updated = (task.subtasks ?? []).filter((s) => s.id !== id);
    onUpdate({ subtasks: updated.length > 0 ? updated : undefined });
  }, [task.subtasks, onUpdate]);

  // ── Attachments ───────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { alert('File too large (max 2 MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const attachment: Attachment = { id: uuidv4(), name: file.name, type: file.type, data: reader.result as string, size: file.size };
      onUpdate({ attachments: [...(task.attachments ?? []), attachment] });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [task.attachments, onUpdate]);

  const deleteAttachment = useCallback((id: string) => {
    const updated = (task.attachments ?? []).filter((a) => a.id !== id);
    onUpdate({ attachments: updated.length > 0 ? updated : undefined });
  }, [task.attachments, onUpdate]);

  // ── Notification ──────────────────────────────────────────────────────────

  const handleNotificationChange = useCallback(async (value: string) => {
    if (value) {
      const perm = await requestPermission();
      if (perm !== 'granted') {
        alert('Enable notifications in your browser to use this feature.');
        return;
      }
    }
    onUpdate({ notificationOffset: value || undefined });
  }, [requestPermission, onUpdate]);

  const subtasks = task.subtasks ?? [];
  const attachments = task.attachments ?? [];
  const completedCount = subtasks.filter((s) => s.completed).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="td-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="td">

        {/* Dark header bar */}
        <div className="td__header">
          <button className="td__back" onClick={onClose}>
            <FontAwesomeIcon icon={faArrowLeft} /> back
          </button>
          <button className="td__delete" onClick={onDelete}>
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>

        {/* Title strip — full-width */}
        <div className="td__title-strip">
          <button
            className={`td__signifier td__signifier--${task.status}`}
            onClick={interactable ? onCycleStatus : undefined}
            disabled={!interactable}
          >
            {SIGNIFIERS[task.status]}
          </button>
          {editingTitle ? (
            <input
              ref={titleRef}
              className="td__title-input"
              value={titleValue}
              autoFocus
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(task.content); }
              }}
            />
          ) : (
            <h2
              className={`td__title${task.status === 'completed' || task.status === 'cancelled' ? ' td__title--done' : ''}`}
              onClick={() => { if (interactable) { setEditingTitle(true); setTitleValue(task.content); } }}
            >
              {task.content}
            </h2>
          )}
        </div>

        {/* Two-column body */}
        <div className="td__body">

          {/* Left column: schedule + meta */}
          <div className="td__col td__col--left">

            <div className="td__section">
              <div className="td__section-label">Schedule</div>
              <div className="td__date-card">

                {/* Planned range row */}
                <div
                  className={`td__date-row${openCal === 'planned' ? ' td__date-row--open' : ''}`}
                  onClick={() => setOpenCal(openCal === 'planned' ? null : 'planned')}
                >
                  <span className="td__date-row-label">Planned</span>
                  <span className="td__date-icon">📅</span>
                  {task.plannedStart ? (
                    <span className="td__date-val">{formatDateRange(task.plannedStart, task.plannedEnd)}</span>
                  ) : (
                    <span className="td__date-val td__date-val--empty">Set dates…</span>
                  )}
                  {task.plannedStart && (
                    <button className="td__date-clear" onClick={(e) => { e.stopPropagation(); onUpdate({ plannedStart: undefined, plannedEnd: undefined }); }}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  )}
                </div>
                {openCal === 'planned' && (
                  <div className="td__cal-wrap">
                    <MiniCalendar
                      range
                      startDate={task.plannedStart}
                      endDate={task.plannedEnd}
                      onSelectRange={(start, end) => {
                        onUpdate({ plannedStart: start, plannedEnd: end });
                        if (end) setOpenCal(null);
                      }}
                    />
                  </div>
                )}

                {/* Deadline row */}
                <div
                  className={`td__date-row${openCal === 'deadline' ? ' td__date-row--open' : ''}${task.deadline ? ' td__date-row--deadline' : ''}`}
                  onClick={() => setOpenCal(openCal === 'deadline' ? null : 'deadline')}
                >
                  <span className="td__date-row-label">Deadline</span>
                  <span className="td__date-icon td__date-icon--deadline">🎯</span>
                  {task.deadline ? (
                    <span className="td__date-val td__date-val--deadline">{format(parseISO(task.deadline), 'MMM d, yyyy')}</span>
                  ) : (
                    <span className="td__date-val td__date-val--empty">Set deadline…</span>
                  )}
                  {task.deadline && (
                    <button className="td__date-clear" onClick={(e) => { e.stopPropagation(); onUpdate({ deadline: undefined, notificationOffset: undefined }); }}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  )}
                </div>
                {openCal === 'deadline' && (
                  <div className="td__cal-wrap">
                    <MiniCalendar
                      startDate={task.deadline}
                      onSelectSingle={(date) => { onUpdate({ deadline: date }); setOpenCal(null); }}
                    />
                  </div>
                )}

                {/* Notify row — only when deadline is set */}
                {task.deadline && (
                  <div className="td__date-row td__date-row--notif" onClick={(e) => e.stopPropagation()}>
                    <span className="td__date-row-label">Notify</span>
                    <span className="td__date-icon td__date-icon--notif">
                      <FontAwesomeIcon icon={faBell} />
                    </span>
                    <select
                      className="td__notif-select"
                      value={task.notificationOffset ?? ''}
                      onChange={(e) => handleNotificationChange(e.target.value)}
                    >
                      {NOTIFICATION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Category + time */}
            <div className="td__section">
              <div className="td__section-label">Meta</div>
              <div className="td__meta-row">
                <div className="td__meta-field">
                  <span className="td__meta-icon">🏷</span>
                  <div className="td__autocomplete">
                    <input
                      className="td__meta-input"
                      placeholder="Category"
                      value={categoryInput}
                      onChange={(e) => { setCategoryInput(e.target.value); setShowCategorySuggestions(true); }}
                      onFocus={() => setShowCategorySuggestions(true)}
                      onBlur={() => setTimeout(() => { commitCategory(); setShowCategorySuggestions(false); }, 150)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { commitCategory(); (e.target as HTMLInputElement).blur(); } }}
                    />
                    {showCategorySuggestions && filteredCategories.length > 0 && (
                      <ul className="td__suggestions">
                        {filteredCategories.map((cat) => (
                          <li key={cat} className="td__suggestion" onMouseDown={() => { setCategoryInput(cat); onUpdate({ category: cat }); setShowCategorySuggestions(false); }}>
                            {cat}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="td__meta-field">
                  <span className="td__meta-icon">⏱</span>
                  <input
                    className="td__meta-input"
                    placeholder="e.g. 2h 30m"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    onBlur={commitTime}
                    onKeyDown={(e) => { if (e.key === 'Enter') { commitTime(); (e.target as HTMLInputElement).blur(); } }}
                  />
                </div>
              </div>
            </div>

          </div>{/* /left col */}

          {/* Right column: notes + subtasks + attachments */}
          <div className="td__col td__col--right">

            <div className="td__section td__section--grow">
              <div className="td__section-label">Notes</div>
              <textarea
                className="td__textarea"
                placeholder="Add notes or description…"
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onBlur={commitDescription}
              />
            </div>

            <div className="td__section">
              <div className="td__section-label">
                Subtasks
                {subtasks.length > 0 && <span className="td__count"> {completedCount}/{subtasks.length}</span>}
              </div>
              {subtasks.length > 0 && (
                <div className="td__progress">
                  <div className="td__progress-fill" style={{ width: `${(completedCount / subtasks.length) * 100}%` }} />
                </div>
              )}
              <div className="td__subtask-list">
                {subtasks.map((sub) => (
                  <div key={sub.id} className={`td__subtask${sub.completed ? ' td__subtask--done' : ''}`}>
                    <button className="td__subtask-check" onClick={() => toggleSubtask(sub.id)}>
                      {sub.completed ? '●' : '○'}
                    </button>
                    <span className="td__subtask-text">{sub.content}</span>
                    <button className="td__subtask-del" onClick={() => deleteSubtask(sub.id)}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="td__subtask-add">
                <input
                  ref={subtaskRef}
                  className="td__subtask-input"
                  placeholder="Add subtask…"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addSubtask(); }}
                />
                <button className="td__subtask-add-btn" onClick={addSubtask} disabled={!newSubtask.trim()}>
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>

            <div className="td__section">
              <div className="td__section-label">Attachments</div>
              {attachments.length > 0 && (
                <div className="td__attachment-list">
                  {attachments.map((att) => (
                    <div key={att.id} className="td__attachment">
                      <FontAwesomeIcon icon={faPaperclip} className="td__attachment-icon" />
                      <a className="td__attachment-name" href={att.data} download={att.name}>{att.name}</a>
                      <span className="td__attachment-size">{formatFileSize(att.size)}</span>
                      <button className="td__attachment-del" onClick={() => deleteAttachment(att.id)}>
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={fileRef} type="file" className="td__hidden-input" tabIndex={-1} onChange={handleFileSelect} />
              <button className="td__add-attachment" onClick={() => fileRef.current?.click()}>
                <FontAwesomeIcon icon={faPaperclip} /> Add attachment
              </button>
            </div>

          </div>{/* /right col */}
        </div>{/* /body */}
      </div>
    </div>
  );
}
