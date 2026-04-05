import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfISOWeek, addDays, isSameDay, isWithinInterval, isBefore, isAfter, addMonths, subMonths } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface Props {
  /** If true, supports selecting a start+end range; otherwise single date */
  range?: boolean;
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;     // YYYY-MM-DD
  onSelectSingle?: (date: string) => void;
  onSelectRange?: (start: string, end: string | undefined) => void;
}

function toDateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function fromKey(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function MiniCalendar({ range, startDate, endDate, onSelectSingle, onSelectRange }: Props) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(() => {
    if (startDate) return fromKey(startDate);
    return today;
  });
  // For range mode: first click sets pendingStart, second click finalises range
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [hovered, setHovered] = useState<Date | null>(null);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const gridStart = startOfISOWeek(monthStart);

  // Build 6-row grid (42 cells)
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(gridStart, i));

  const selStart = startDate ? fromKey(startDate) : null;
  const selEnd = endDate ? fromKey(endDate) : null;

  const handleDayClick = (d: Date) => {
    if (!range) {
      onSelectSingle?.(toDateKey(d));
      return;
    }
    if (!pendingStart) {
      // First click
      setPendingStart(d);
      onSelectRange?.(toDateKey(d), undefined);
    } else {
      // Second click — ensure start <= end
      const [s, e] = isBefore(d, pendingStart) ? [d, pendingStart] : [pendingStart, d];
      onSelectRange?.(toDateKey(s), toDateKey(e));
      setPendingStart(null);
    }
  };

  const isSelected = (d: Date) => {
    if (pendingStart) return isSameDay(d, pendingStart);
    return (selStart && isSameDay(d, selStart)) || (selEnd && isSameDay(d, selEnd)) || false;
  };

  const isInRange = (d: Date) => {
    // Live range preview while hovering
    const rangeEnd = pendingStart ? hovered : selEnd;
    const rangeStart = pendingStart ?? selStart;
    if (!rangeStart || !rangeEnd) return false;
    const [s, e] = isBefore(rangeEnd, rangeStart) ? [rangeEnd, rangeStart] : [rangeStart, rangeEnd];
    return isWithinInterval(d, { start: s, end: e }) && !isSameDay(d, s) && !isSameDay(d, e);
  };

  const isToday = (d: Date) => isSameDay(d, today);
  const isOutside = (d: Date) => isBefore(d, monthStart) || isAfter(d, monthEnd);

  return (
    <div className="mini-cal">
      <div className="mini-cal__header">
        <button className="mini-cal__nav" onClick={() => setViewMonth(subMonths(viewMonth, 1))}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <span className="mini-cal__month">{format(viewMonth, 'MMM yyyy')}</span>
        <button className="mini-cal__nav" onClick={() => setViewMonth(addMonths(viewMonth, 1))}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
      <div className="mini-cal__grid">
        {['M','T','W','T','F','S','S'].map((l, i) => (
          <div key={i} className="mini-cal__cell mini-cal__cell--head">{l}</div>
        ))}
        {cells.map((d, i) => (
          <button
            key={i}
            className={[
              'mini-cal__cell',
              'mini-cal__cell--day',
              isSelected(d) ? 'mini-cal__cell--selected' : '',
              isInRange(d) ? 'mini-cal__cell--range' : '',
              isToday(d) ? 'mini-cal__cell--today' : '',
              isOutside(d) ? 'mini-cal__cell--outside' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => handleDayClick(d)}
            onMouseEnter={() => setHovered(d)}
            onMouseLeave={() => setHovered(null)}
          >
            {format(d, 'd')}
          </button>
        ))}
      </div>
    </div>
  );
}
