import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faCheck,
  faXmark,
  faForward,
  faSun,
  faThumbsUp,
  faThumbsDown,
  faMeh,
} from '@fortawesome/free-solid-svg-icons';
import type { Task, Highlight, ReflectionRating } from '../../types';
import { SIGNIFIERS } from '../../types';
import { formatDayHeader } from '../../utils/dates';
import './MigrationFlow.css';

interface Props {
  yesterdayDate: string;
  todayDate: string;
  openTasks: Task[];
  yesterdayHighlight?: Highlight;
  onMigrateTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onCancelTask: (taskId: string) => void;
  onScheduleTask: (taskId: string, date: string) => void;
  onReflect: (rating: ReflectionRating, note?: string) => void;
  onSetTodayHighlight: (content: string, taskId?: string) => void;
  onComplete: () => void;
}

type Step = 'reflect' | 'migrate' | 'highlight' | 'done';

export function MigrationFlow({
  yesterdayDate,
  todayDate,
  openTasks,
  yesterdayHighlight,
  onMigrateTask,
  onCompleteTask,
  onCancelTask,
  onReflect,
  onSetTodayHighlight,
  onComplete,
}: Props) {
  const hasReflection = !!yesterdayHighlight;
  const hasTasks = openTasks.length > 0;

  const getInitialStep = (): Step => {
    if (hasReflection) return 'reflect';
    if (hasTasks) return 'migrate';
    return 'highlight';
  };

  const [step, setStep] = useState<Step>(getInitialStep);
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
  const [highlightInput, setHighlightInput] = useState('');

  const advanceFromReflect = () => {
    setStep(hasTasks ? 'migrate' : 'highlight');
  };

  const advanceFromMigrate = () => {
    const next = currentTaskIdx + 1;
    if (next < openTasks.length) {
      setCurrentTaskIdx(next);
    } else {
      setStep('highlight');
    }
  };

  const handleHighlightSubmit = () => {
    const trimmed = highlightInput.trim();
    if (trimmed) {
      onSetTodayHighlight(trimmed);
    }
    onComplete();
  };

  const skipHighlight = () => {
    onComplete();
  };

  // === REFLECT step ===
  if (step === 'reflect' && yesterdayHighlight) {
    return (
      <div className="migration-flow">
        <div className="migration-flow__header">
          <span className="migration-flow__step-label">reflect</span>
          <span className="migration-flow__date">{formatDayHeader(yesterdayDate)}</span>
        </div>

        <div className="migration-flow__body">
          <p className="migration-flow__prompt">Yesterday's highlight was:</p>
          <div className="migration-flow__highlight-display">
            <FontAwesomeIcon icon={faSun} className="migration-flow__sun" />
            <span>{yesterdayHighlight.content}</span>
          </div>
          <p className="migration-flow__prompt">How did it go?</p>
          <div className="migration-flow__reflect-btns">
            <button
              className="migration-flow__reflect-btn"
              onClick={() => { onReflect('good'); advanceFromReflect(); }}
            >
              <FontAwesomeIcon icon={faThumbsUp} />
              <span>Good</span>
            </button>
            <button
              className="migration-flow__reflect-btn"
              onClick={() => { onReflect('okay'); advanceFromReflect(); }}
            >
              <FontAwesomeIcon icon={faMeh} />
              <span>Okay</span>
            </button>
            <button
              className="migration-flow__reflect-btn"
              onClick={() => { onReflect('missed'); advanceFromReflect(); }}
            >
              <FontAwesomeIcon icon={faThumbsDown} />
              <span>Missed</span>
            </button>
          </div>
        </div>

        <button className="migration-flow__skip" onClick={advanceFromReflect}>
          Skip
        </button>
      </div>
    );
  }

  // === MIGRATE step ===
  if (step === 'migrate' && hasTasks) {
    const task = openTasks[currentTaskIdx];
    return (
      <div className="migration-flow">
        <div className="migration-flow__header">
          <span className="migration-flow__step-label">migrate</span>
          <span className="migration-flow__counter">
            {currentTaskIdx + 1} of {openTasks.length}
          </span>
        </div>

        <div className="migration-flow__body">
          <div className="migration-flow__task-display">
            <span className="migration-flow__signifier">{SIGNIFIERS.open}</span>
            <span>{task.content}</span>
          </div>

          <div className="migration-flow__migrate-btns">
            <button
              className="migration-flow__migrate-btn"
              onClick={() => { onMigrateTask(task.id); advanceFromMigrate(); }}
            >
              <FontAwesomeIcon icon={faArrowRight} />
              <span>Move to today</span>
            </button>
            <button
              className="migration-flow__migrate-btn"
              onClick={() => { onCompleteTask(task.id); advanceFromMigrate(); }}
            >
              <FontAwesomeIcon icon={faCheck} />
              <span>Done</span>
            </button>
            <button
              className="migration-flow__migrate-btn"
              onClick={() => { onCancelTask(task.id); advanceFromMigrate(); }}
            >
              <FontAwesomeIcon icon={faXmark} />
              <span>Drop</span>
            </button>
            <button
              className="migration-flow__migrate-btn"
              onClick={advanceFromMigrate}
            >
              <FontAwesomeIcon icon={faForward} />
              <span>Skip</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === HIGHLIGHT step ===
  return (
    <div className="migration-flow">
      <div className="migration-flow__header">
        <span className="migration-flow__step-label">highlight</span>
        <span className="migration-flow__date">{formatDayHeader(todayDate)}</span>
      </div>

      <div className="migration-flow__body">
        <p className="migration-flow__prompt">
          <FontAwesomeIcon icon={faSun} className="migration-flow__sun" />
          What's your highlight for today?
        </p>
        <div className="migration-flow__highlight-input-row">
          <input
            className="migration-flow__highlight-input"
            value={highlightInput}
            onChange={(e) => setHighlightInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleHighlightSubmit();
            }}
            placeholder="The one thing that matters today..."
            autoFocus
          />
        </div>
        <div className="migration-flow__highlight-actions">
          <button className="migration-flow__primary-btn" onClick={handleHighlightSubmit}>
            {highlightInput.trim() ? 'Set highlight & start' : 'Start without highlight'}
          </button>
          <button className="migration-flow__skip" onClick={skipHighlight}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
