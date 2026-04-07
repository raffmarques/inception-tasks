import { useState, useRef, useEffect, useCallback } from 'react';
import { getDaysInMonth } from 'date-fns';
import type { CalGroup, CalendarDef, CalEntry } from '../../types';
import './YearMap.css';

const PALETTE = [
  '#c8a882', '#e0b97a', '#6b8f71', '#3d7ab5', '#9b7fa6',
  '#c07070', '#7ab5d4', '#a08060', '#5a9e82', '#b87093',
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ZOOM_STEPS  = [16, 20, 24, 28, 34, 42, 52];
const BLOCK_STEPS = [12, 14, 16, 20, 22, 26, 32];
const LABEL_STEPS = [36, 40, 44, 48, 56, 64, 80];
const ZOOM_THRESHOLD = 150; // ~20% less sensitive than standard 120-unit notch

function isWeekend(year: number, month: number, day: number): boolean {
  const d = new Date(year, month, day).getDay();
  return d === 0 || d === 6;
}

function getEntrySpanInMonth(entry: CalEntry, year: number, monthIdx: number) {
  const lastDay = getDaysInMonth(new Date(year, monthIdx));
  const monthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

  const startInMonth = entry.startDate.startsWith(monthStr)
    ? parseInt(entry.startDate.slice(8), 10)
    : entry.startDate < monthStr ? 1 : null;
  if (startInMonth === null) return null;

  const endInMonth = entry.endDate.startsWith(monthStr)
    ? parseInt(entry.endDate.slice(8), 10)
    : entry.endDate > monthStr + '-99' ? lastDay : null;
  if (endInMonth === null) return null;

  return { start: startInMonth, end: endInMonth, lastDay };
}

// ── Sub-forms (group + calendar management, unchanged) ──

interface AddGroupFormProps {
  onAdd: (name: string, color: string) => void;
  onCancel: () => void;
}
function AddGroupForm({ onAdd, onCancel }: AddGroupFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[0]);
  return (
    <div className="yearmap__form">
      <input className="yearmap__form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" autoFocus />
      <div className="yearmap__palette">
        {PALETTE.map((c) => (
          <button key={c} className={`yearmap__swatch${color === c ? ' yearmap__swatch--active' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
      </div>
      <div className="yearmap__form-actions">
        <button className="yearmap__form-btn" onClick={() => { if (name.trim()) onAdd(name.trim(), color); }}>Add</button>
        <button className="yearmap__form-btn yearmap__form-btn--cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

interface AddCalendarFormProps {
  groupId: string;
  onAdd: (groupId: string, name: string, color: string) => void;
  onCancel: () => void;
}
function AddCalendarForm({ groupId, onAdd, onCancel }: AddCalendarFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PALETTE[2]);
  return (
    <div className="yearmap__form yearmap__form--nested">
      <input className="yearmap__form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Calendar name" autoFocus />
      <div className="yearmap__palette">
        {PALETTE.map((c) => (
          <button key={c} className={`yearmap__swatch${color === c ? ' yearmap__swatch--active' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
      </div>
      <div className="yearmap__form-actions">
        <button className="yearmap__form-btn" onClick={() => { if (name.trim()) onAdd(groupId, name.trim(), color); }}>Add</button>
        <button className="yearmap__form-btn yearmap__form-btn--cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Types ──

type DragState = { monthIdx: number; startDay: number; endDay: number } | null;
type PendingEntry = { monthIdx: number; lo: number; hi: number; anchorRect: DOMRect } | null;

interface Props {
  year: number;
  groups: CalGroup[];
  calendars: CalendarDef[];
  visibleEntries: CalEntry[];
  onAddGroup: (name: string, color: string) => void;
  onRemoveGroup: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onAddCalendar: (groupId: string, name: string, color: string) => void;
  onRemoveCalendar: (id: string) => void;
  onToggleCalendar: (id: string) => void;
  onAddEntry: (calendarId: string, name: string, startDate: string, endDate: string) => void;
  onRemoveEntry: (id: string) => void;
}

export function YearMap({
  year,
  groups,
  calendars,
  visibleEntries,
  onAddGroup,
  onRemoveGroup,
  onToggleGroup,
  onAddCalendar,
  onRemoveCalendar,
  onToggleCalendar,
  onAddEntry,
  onRemoveEntry,
}: Props) {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const currentMonthIdx = year === todayYear ? todayMonth : -1;

  // ── Sidebar state ──
  const [addingGroup, setAddingGroup] = useState(false);
  const [addingCalendarForGroup, setAddingCalendarForGroup] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  // ── Zoom ──
  const [zoomLevel, setZoomLevel] = useState(3);
  const wheelAccumRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const adjustZoom = useCallback((dir: number) => {
    setZoomLevel((z) => Math.max(0, Math.min(ZOOM_STEPS.length - 1, z + dir)));
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      wheelAccumRef.current += e.deltaY;
      if (Math.abs(wheelAccumRef.current) >= ZOOM_THRESHOLD) {
        const dir = wheelAccumRef.current < 0 ? 1 : -1;
        wheelAccumRef.current = 0;
        setZoomLevel((z) => Math.max(0, Math.min(ZOOM_STEPS.length - 1, z + dir)));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const zoomStyle = {
    '--ym-cell':  `${ZOOM_STEPS[zoomLevel]}px`,
    '--ym-block': `${BLOCK_STEPS[zoomLevel]}px`,
    '--ym-label': `${LABEL_STEPS[zoomLevel]}px`,
  } as React.CSSProperties;

  // ── Drag-to-create ──
  const dragRef = useRef<DragState>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<PendingEntry>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCalId, setDraftCalId] = useState('');

  // Set default calendar when panel opens
  useEffect(() => {
    if (pendingEntry && calendars.length > 0) {
      setDraftCalId(calendars[0].id);
    }
  }, [pendingEntry, calendars]);

  const updateDraftCells = (monthIdx: number, lo: number, hi: number) => {
    document.querySelectorAll('.yearmap__day--draft').forEach((el) => el.classList.remove('yearmap__day--draft'));
    for (let d = lo; d <= hi; d++) {
      document.querySelector(`[data-ym-month="${monthIdx}"][data-ym-day="${d}"]`)?.classList.add('yearmap__day--draft');
    }
  };

  const clearDraftCells = () => {
    document.querySelectorAll('.yearmap__day--draft').forEach((el) => el.classList.remove('yearmap__day--draft'));
  };

  // Document mouseup — finalize drag
  useEffect(() => {
    const handleMouseUp = () => {
      if (!dragRef.current) return;
      const { monthIdx, startDay, endDay } = dragRef.current;
      dragRef.current = null;
      setIsDragging(false);
      clearDraftCells();

      if (calendars.length === 0) return;
      const lo = Math.min(startDay, endDay);
      const hi = Math.max(startDay, endDay);
      const lastCell = document.querySelector(`[data-ym-month="${monthIdx}"][data-ym-day="${hi}"]`) as HTMLElement | null;
      if (!lastCell) return;
      setPendingEntry({ monthIdx, lo, hi, anchorRect: lastCell.getBoundingClientRect() });
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [calendars.length]);

  // Click outside inline panel → cancel
  useEffect(() => {
    if (!pendingEntry) return;
    const handleClick = (e: MouseEvent) => {
      const panel = document.querySelector('.yearmap__inline-panel');
      if (panel && !panel.contains(e.target as Node)) cancelEntry();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pendingEntry]);

  const confirmEntry = () => {
    if (!pendingEntry || !draftName.trim() || !draftCalId) { cancelEntry(); return; }
    const { monthIdx, lo, hi } = pendingEntry;
    const pad = (n: number) => String(n).padStart(2, '0');
    onAddEntry(draftCalId, draftName.trim(),
      `${year}-${pad(monthIdx + 1)}-${pad(lo)}`,
      `${year}-${pad(monthIdx + 1)}-${pad(hi)}`);
    cancelEntry();
  };

  const cancelEntry = () => {
    setPendingEntry(null);
    setDraftName('');
  };

  // Inline panel position
  const panelPos = pendingEntry ? (() => {
    const r = pendingEntry.anchorRect;
    let left = r.left;
    let top = r.bottom + 8;
    if (left + 240 > window.innerWidth) left = window.innerWidth - 248;
    if (top + 110 > window.innerHeight) top = r.top - 118;
    return { left, top };
  })() : { left: 0, top: 0 };

  const calendarById = Object.fromEntries(calendars.map((c) => [c.id, c]));

  return (
    <div className="yearmap" style={zoomStyle}>
      <div className="yearmap__layout">

        {/* ── Grid ── */}
        <div className="yearmap__grid-wrap">
          <div className="yearmap__grid-title">
            YEAR MAP — {year}
            <div className="yearmap__zoom-btns">
              <button className="yearmap__zoom-btn" onClick={() => adjustZoom(-1)} title="Zoom out">−</button>
              <button className="yearmap__zoom-btn" onClick={() => adjustZoom(1)} title="Zoom in">+</button>
            </div>
          </div>
          <div className="yearmap__scroll" ref={scrollRef}>
            <table className={`yearmap__table${isDragging ? ' yearmap__table--dragging' : ''}`}>
              <thead>
                <tr>
                  <th className="yearmap__th-label"></th>
                  {Array.from({ length: 31 }, (_, i) => (
                    <th key={i + 1} className={`yearmap__th-day${
                      i + 1 === todayDay && year === todayYear ? ' yearmap__th-day--today' : ''
                    }`}>
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTHS_SHORT.map((monthShort, monthIdx) => {
                  const lastDay = getDaysInMonth(new Date(year, monthIdx));
                  const isCurrent = monthIdx === currentMonthIdx;
                  const monthEntries = visibleEntries.filter((e) =>
                    getEntrySpanInMonth(e, year, monthIdx) !== null
                  );

                  return (
                    <>
                      <tr key={`month-${monthIdx}`} className="yearmap__month-row">
                        <td className={`yearmap__month-label${isCurrent ? ' yearmap__month-label--current' : ''}`}>
                          {monthShort}
                        </td>
                        {Array.from({ length: 31 }, (_, i) => {
                          const day = i + 1;
                          if (day > lastDay) return <td key={day} className="yearmap__day-empty" />;
                          const isToday = isCurrent && day === todayDay && year === todayYear;
                          const weekend = isWeekend(year, monthIdx, day);
                          return (
                            <td
                              key={day}
                              data-ym-month={monthIdx}
                              data-ym-day={day}
                              className={[
                                'yearmap__day',
                                weekend ? 'yearmap__day--weekend' : '',
                                isToday  ? 'yearmap__day--today'   : '',
                              ].filter(Boolean).join(' ')}
                              onMouseDown={(e) => {
                                if (e.button !== 0) return;
                                e.preventDefault();
                                dragRef.current = { monthIdx, startDay: day, endDay: day };
                                setIsDragging(true);
                                updateDraftCells(monthIdx, day, day);
                              }}
                              onMouseEnter={() => {
                                if (!dragRef.current || dragRef.current.monthIdx !== monthIdx) return;
                                dragRef.current.endDay = day;
                                const lo = Math.min(dragRef.current.startDay, day);
                                const hi = Math.max(dragRef.current.startDay, day);
                                updateDraftCells(monthIdx, lo, hi);
                              }}
                            >
                              <span className="yearmap__day-num">{day}</span>
                            </td>
                          );
                        })}
                      </tr>

                      {monthEntries.map((entry) => {
                        const span = getEntrySpanInMonth(entry, year, monthIdx)!;
                        const preSpan  = span.start - 1;
                        const blockSpan = span.end - span.start + 1;
                        const postSpan = 31 - span.end;
                        const cal = calendarById[entry.calendarId];
                        return (
                          <tr key={`block-${entry.id}-${monthIdx}`} className="yearmap__block-row">
                            <td className="yearmap__block-label"></td>
                            {preSpan > 0 && <td colSpan={preSpan} className="yearmap__block-empty" />}
                            <td colSpan={blockSpan} className="yearmap__block-cell">
                              <div className="yearmap__block-fill" style={{ background: cal?.color ?? '#aaa' }}>
                                <span className="yearmap__block-name">{entry.name}</span>
                                <button className="yearmap__block-del" onClick={() => onRemoveEntry(entry.id)} title="Remove">×</button>
                              </div>
                            </td>
                            {postSpan > 0 && <td colSpan={postSpan} className="yearmap__block-empty" />}
                          </tr>
                        );
                      })}

                      <tr key={`sep-${monthIdx}`} className="yearmap__month-sep">
                        <td colSpan={32} />
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="yearmap__panel">
          <div className="yearmap__panel-title">CALENDARS</div>

          {groups.map((group) => {
            const groupCals = calendars.filter((c) => c.groupId === group.id);
            const visibleCount = groupCals.filter((c) => c.visible).length;
            const isPartial = visibleCount > 0 && visibleCount < groupCals.length;
            const isCollapsed = collapsedGroups.has(group.id);

            return (
              <div key={group.id} className="yearmap__group">
                <div className="yearmap__group-header" style={{ color: group.color }}>
                  <button
                    className={`yearmap__group-toggle${group.visible ? ' yearmap__group-toggle--on' : ''}${isPartial ? ' yearmap__group-toggle--partial' : ''}`}
                    style={{ borderColor: group.color }}
                    onClick={() => onToggleGroup(group.id)}
                  >
                    {isPartial ? '–' : group.visible ? '✓' : ''}
                  </button>
                  <span className="yearmap__group-name">{group.name}</span>
                  <button className="yearmap__group-collapse" onClick={() => toggleCollapse(group.id)}>
                    {isCollapsed ? '▸' : '▾'}
                  </button>
                  <button className="yearmap__group-remove" onClick={() => onRemoveGroup(group.id)} title="Remove group">×</button>
                </div>

                {!isCollapsed && (
                  <>
                    {groupCals.map((cal) => (
                      <div key={cal.id} className="yearmap__cal-item">
                        <div className="yearmap__cal-dot" style={{ background: cal.color }} />
                        <span className="yearmap__cal-name">{cal.name}</span>
                        <button
                          className={`yearmap__cal-toggle${cal.visible ? ' yearmap__cal-toggle--on' : ''}`}
                          style={cal.visible ? { background: cal.color, borderColor: cal.color } : {}}
                          onClick={() => onToggleCalendar(cal.id)}
                        >
                          {cal.visible ? '✓' : ''}
                        </button>
                        <button className="yearmap__cal-remove" onClick={() => onRemoveCalendar(cal.id)} title="Remove">×</button>
                      </div>
                    ))}
                    {addingCalendarForGroup === group.id ? (
                      <AddCalendarForm
                        groupId={group.id}
                        onAdd={(gid, name, color) => { onAddCalendar(gid, name, color); setAddingCalendarForGroup(null); }}
                        onCancel={() => setAddingCalendarForGroup(null)}
                      />
                    ) : (
                      <button className="yearmap__add-cal" onClick={() => setAddingCalendarForGroup(group.id)}>
                        + add calendar
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {addingGroup ? (
            <AddGroupForm
              onAdd={(name, color) => { onAddGroup(name, color); setAddingGroup(false); }}
              onCancel={() => setAddingGroup(false)}
            />
          ) : (
            <button className="yearmap__add-group" onClick={() => setAddingGroup(true)}>+ add group</button>
          )}

          {calendars.length === 0 && (
            <p className="yearmap__drag-hint">Add a calendar, then drag on the grid to create events.</p>
          )}
          {calendars.length > 0 && (
            <p className="yearmap__drag-hint">Drag on the grid to create events.</p>
          )}
        </div>
      </div>

      {/* ── Inline entry panel (fixed, above scroll container) ── */}
      {pendingEntry && (
        <div
          className="yearmap__inline-panel"
          style={{ left: panelPos.left, top: panelPos.top }}
        >
          <div className="yearmap__inline-range">
            {MONTHS_SHORT[pendingEntry.monthIdx]} {pendingEntry.lo}
            {pendingEntry.lo !== pendingEntry.hi
              ? ` → ${MONTHS_SHORT[pendingEntry.monthIdx]} ${pendingEntry.hi}`
              : ''}
          </div>
          <input
            className="yearmap__inline-name"
            autoFocus
            placeholder="Event name…"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmEntry();
              if (e.key === 'Escape') cancelEntry();
            }}
          />
          <div className="yearmap__inline-bottom">
            <select
              className="yearmap__inline-cal"
              value={draftCalId}
              onChange={(e) => setDraftCalId(e.target.value)}
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="yearmap__inline-hint">↵ · esc</span>
          </div>
        </div>
      )}
    </div>
  );
}
