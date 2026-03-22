import type { ZoomLevel } from '../../types';
import './ZoomNav.css';

interface Props {
  current: ZoomLevel;
  onChange: (zoom: ZoomLevel) => void;
}

const levels: { key: ZoomLevel; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year', label: 'Year' },
];

export function ZoomNav({ current, onChange }: Props) {
  return (
    <nav className="zoom-nav">
      {levels.map(({ key, label }) => (
        <button
          key={key}
          className={`zoom-nav__btn ${current === key ? 'zoom-nav__btn--active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
