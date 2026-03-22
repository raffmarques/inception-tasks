import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { parseTimeInput } from '../../utils/time';
import './TimeEstimatePrompt.css';

interface Props {
  taskContent: string;
  onConfirm: (minutes: number) => void;
  onCancel: () => void;
}

export function TimeEstimatePrompt({ taskContent, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleConfirm = () => {
    const minutes = parseTimeInput(value);
    if (minutes) {
      onConfirm(minutes);
    }
  };

  return (
    <div className="time-estimate-prompt__overlay" onClick={onCancel}>
      <div className="time-estimate-prompt" onClick={(e) => e.stopPropagation()}>
        <div className="time-estimate-prompt__task">{taskContent}</div>
        <label className="time-estimate-prompt__label">How long will this take?</label>
        <div className="time-estimate-prompt__input-row">
          <input
            ref={inputRef}
            className="time-estimate-prompt__input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') onCancel();
            }}
            placeholder="e.g. 30m, 1h 30m"
          />
          <button
            className="time-estimate-prompt__btn time-estimate-prompt__btn--confirm"
            onClick={handleConfirm}
            disabled={!parseTimeInput(value)}
          >
            <FontAwesomeIcon icon={faCheck} />
          </button>
          <button
            className="time-estimate-prompt__btn time-estimate-prompt__btn--cancel"
            onClick={onCancel}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      </div>
    </div>
  );
}
