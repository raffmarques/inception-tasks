import { useState } from 'react';
import { getDaysInMonth, getDay } from 'date-fns';
import type { CalGroup, CalendarDef, CalEntry } from '../../types';
import './YearMap.css';

const PALETTE = [
  '#c8a882', '#e0b97a', '#6b8f71', '#3d7ab5', '#9b7fa6',
  '#c07070', '#7ab5d4', '#a08060', '#5a9e82', '#b87093',
];

function getDayOfWeek(year: number, month: number, day: number): number {
  return getDay(new Date(year, month, day)); // 0=Sun,6=Sat
}

function isWeekend(year: number, month: number, day: number): boolean {
  const d = getDayOfWeek(year, month, day);
  return d === 0 || d === 6;
}

function getEntrySpanInMonth(entry: CalEntry, year: number, monthIdx: number) {
  const lastDay = getDaysInMonth(new Date(year, monthIdx));
  const monthStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

  const startInMonth = entry.startDate.startsWith(monthStr)
    ? parseInt(entry.startDate.slice(8), 10)
    : entry.startDate < monthStr
    ? 1
    : null;

  if (startInMonth === null) return null; // doesn't start before/in this month

  const endInMonth = entry.endDate.startsWith(monthStr)
    ? parseInt(entry.endDate.slice(8), 10)
    : entry.endDate > monthStr + '-99'
    ? lastDay
    : null;

  if (endInMonth === null) return null; // already ended before this month

  return { start: startInMonth, end: endInMonth, lastDay };
}

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
        <button className="yearmap__form-btn" onClick={() => { if (name.trim()) { onAdd(name.trim(), color); } }}>Add</button>
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
        <button className="yearmap__form-btn" onClick={() => { if (name.trim()) { onAdd(groupId, name.trim(), color); } }}>Add</button>
        <button className="yearmap__form-btn yearmap__form-btn--cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

interface AddEntryFormProps {
  calendars: CalendarDef[];
  onAdd: (calendarId: string, name: string, startDate: string, endDate: string) => void;
  onCancel: () => void;
}
function AddEntryForm({ calendars, onAdd, onCancel }: AddEntryFormProps) {
  const [calendarId, setCalendarId] = useState(calendars[0]?.id ?? '');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  return (
    <div className="yearmap__form yearmap__entry-form">
      <select className="yearmap__form-input" value={calendarId} onChange={(e) => setCalendarId(e.target.value)}>
        {calendars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input className="yearmap__form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" autoFocus />
      <div className="yearmap__form-dates">
        <input className="yearmap__form-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <span>→</span>
        <input className="yearmap__form-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <div className="yearmap__form-actions">
        <button className="yearmap__form-btn" onClick={() => {
          if (name.trim() && startDate && endDate && calendarId) {
            onAdd(calendarId, name.trim(), startDate, endDate <= startDate ? startDate : endDate);
          }
        }}>Add</button>
        <button className="yearmap__form-btn yearmap__form-btn--cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  const [addingGroup, setAddingGroup] = useState(false);
  const [addingCalendarForGroup, setAddingCalendarForGroup] = useState<string | null>(null);
  const [addingEntry, setAddingEntry] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const calendarById = Object.fromEntries(calendars.map((c) => [c.id, c]));

  const toggleCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  return (
    <div className="yearmap">
      <div className="yearmap__layout">
        {/* ── Grid ── */}
        <div className="yearmap__grid-wrap">
          <div className="yearmap__grid-title">YEAR MAP — {year}</div>
          <div className="yearmap__scroll">
            <table className="yearmap__table">
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
                      {/* Month day row */}
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
                            <td key={day} className={[
                              'yearmap__day',
                              weekend ? 'yearmap__day--weekend' : '',
                              isToday ? 'yearmap__day--today' : '',
                            ].filter(Boolean).join(' ')}>
                              <span className="yearmap__day-num">{day}</span>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Block rows for this month */}
                      {monthEntries.map((entry) => {
                        const span = getEntrySpanInMonth(entry, year, monthIdx)!;
                        const preSpan = span.start - 1;
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
                                <button
                                  className="yearmap__block-del"
                                  onClick={() => onRemoveEntry(entry.id)}
                                  title="Remove"
                                >×</button>
                              </div>
                            </td>
                            {postSpan > 0 && <td colSpan={postSpan} className="yearmap__block-empty" />}
                          </tr>
                        );
                      })}

                      {/* Month separator */}
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
                        onAdd={(gid, name, color) => {
                          onAddCalendar(gid, name, color);
                          setAddingCalendarForGroup(null);
                        }}
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
              onAdd={(name, color) => {
                onAddGroup(name, color);
                setAddingGroup(false);
              }}
              onCancel={() => setAddingGroup(false)}
            />
          ) : (
            <button className="yearmap__add-group" onClick={() => setAddingGroup(true)}>
              + add group
            </button>
          )}

          <div className="yearmap__panel-divider" />

          {addingEntry ? (
            <AddEntryForm
              calendars={calendars}
              onAdd={(calId, name, start, end) => {
                onAddEntry(calId, name, start, end);
                setAddingEntry(false);
              }}
              onCancel={() => setAddingEntry(false)}
            />
          ) : (
            <button
              className="yearmap__add-block"
              onClick={() => setAddingEntry(true)}
              disabled={calendars.length === 0}
              title={calendars.length === 0 ? 'Add a calendar first' : undefined}
            >
              + add block
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
