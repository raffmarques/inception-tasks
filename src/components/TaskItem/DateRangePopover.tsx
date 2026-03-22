import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCheck } from '@fortawesome/free-solid-svg-icons';

interface Props {
  startDate?: string;
  endDate?: string;
  onSave: (start: string | undefined, end: string | undefined) => void;
  onClose: () => void;
}

export function DateRangePopover({ startDate, endDate, onSave, onClose }: Props) {
  const [start, setStart] = useState(startDate ?? '');
  const [end, setEnd] = useState(endDate ?? '');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    // Delay to avoid immediate close from the triggering click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSave = () => {
    if (!start) {
      onSave(undefined, undefined);
    } else {
      onSave(start, end || undefined);
    }
    onClose();
  };

  const handleClear = () => {
    onSave(undefined, undefined);
    onClose();
  };

  return (
    <div ref={popoverRef} className="date-popover">
      <div className="date-popover__header">
        <span className="date-popover__title">Planned Date</span>
        {(startDate || endDate) && (
          <button className="date-popover__clear" onClick={handleClear} title="Clear dates">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>
      <div className="date-popover__fields">
        <label className="date-popover__label">
          <span className="date-popover__label-text">From</span>
          <input
            type="date"
            className="date-popover__input"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              // If end is before new start, clear it
              if (end && e.target.value && end < e.target.value) {
                setEnd('');
              }
            }}
          />
        </label>
        <label className="date-popover__label">
          <span className="date-popover__label-text">To</span>
          <input
            type="date"
            className="date-popover__input"
            value={end}
            min={start || undefined}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <div className="date-popover__footer">
        <button className="date-popover__btn date-popover__btn--save" onClick={handleSave}>
          <FontAwesomeIcon icon={faCheck} /> Done
        </button>
      </div>
    </div>
  );
}
