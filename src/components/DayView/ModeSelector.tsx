import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faClock, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import type { DayOrgMode } from '../../types';
import './ModeSelector.css';

interface Props {
  mode: DayOrgMode;
  onChange: (mode: DayOrgMode) => void;
}

const MODES: { value: DayOrgMode; icon: typeof faList; label: string }[] = [
  { value: 'manual', icon: faList, label: 'Manual' },
  { value: 'time-effort', icon: faClock, label: 'Time Effort' },
  { value: 'time-boxing', icon: faLayerGroup, label: 'Time-Boxing' },
];

export function ModeSelector({ mode, onChange }: Props) {
  return (
    <div className="mode-selector">
      {MODES.map((m) => (
        <button
          key={m.value}
          className={`mode-selector__btn${mode === m.value ? ' mode-selector__btn--active' : ''}`}
          onClick={() => onChange(m.value)}
        >
          <FontAwesomeIcon icon={m.icon} className="mode-selector__icon" />
          <span className="mode-selector__label">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
