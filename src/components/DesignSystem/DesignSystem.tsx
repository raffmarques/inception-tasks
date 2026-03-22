import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faGripVertical,
  faTrash,
  faCalendarDays,
  faBullseye,
  faPen,
  faXmark,
  faSun,
  faChevronLeft,
  faChevronRight,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { SIGNIFIERS } from '../../types';
import type { DayOrgMode, TaskStatus } from '../../types';
import { ModeSelector } from '../DayView/ModeSelector';
import '../TaskItem/TaskItem.css';
import '../Highlight/Highlight.css';
import '../DayView/ModeSelector.css';
import './DesignSystem.css';

// === Data for sections ===

const COLORS = [
  { name: '--bg', hex: '#faf9f7' },
  { name: '--bg-elevated', hex: '#ffffff' },
  { name: '--bg-highlight', hex: '#fffbeb' },
  { name: '--border', hex: '#e5e2dc' },
  { name: '--border-light', hex: '#f0ede8' },
  { name: '--text', hex: '#2c2c2c' },
  { name: '--text-muted', hex: '#8a8580' },
  { name: '--text-faint', hex: '#b8b3ad' },
  { name: '--accent', hex: '#d4740a' },
  { name: '--accent-light', hex: '#fef3e2' },
  { name: '--danger', hex: '#c0392b' },
  { name: '--success', hex: '#27ae60' },
];

const FONT_SIZES = [
  { name: '--fs-xs', rem: '0.7rem' },
  { name: '--fs-sm', rem: '0.8rem' },
  { name: '--fs-base', rem: '0.9rem' },
  { name: '--fs-lg', rem: '1.05rem' },
  { name: '--fs-xl', rem: '1.3rem' },
  { name: '--fs-2xl', rem: '1.7rem' },
];

const SPACING = [
  { name: '--space-xs', px: '4px' },
  { name: '--space-sm', px: '8px' },
  { name: '--space-md', px: '16px' },
  { name: '--space-lg', px: '24px' },
  { name: '--space-xl', px: '32px' },
  { name: '--space-2xl', px: '48px' },
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Open',
  completed: 'Completed',
  migrated: 'Migrated',
  scheduled: 'Scheduled',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  open: 'var(--text)',
  completed: 'var(--success)',
  migrated: 'var(--text-faint)',
  scheduled: 'var(--text-faint)',
  cancelled: 'var(--danger)',
};

export function DesignSystem() {
  const [demoMode, setDemoMode] = useState<DayOrgMode>('manual');

  return (
    <div className="ds">
      {/* Header */}
      <a
        className="ds__back-link"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.location.hash = '';
        }}
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Back to app
      </a>

      <h1 className="ds__title">bujo Design System</h1>
      <p className="ds__subtitle">
        Living reference of design tokens and UI components. Changes here reflect across the app.
      </p>

      {/* === Colors === */}
      <section className="ds__section">
        <h2 className="ds__section-title">Colors</h2>
        <p className="ds__section-desc">Core color palette defined as CSS custom properties.</p>
        <div className="ds__color-grid">
          {COLORS.map((c) => (
            <div key={c.name} className="ds__swatch">
              <div
                className="ds__swatch-color"
                style={{ background: `var(${c.name})` }}
              />
              <span className="ds__swatch-name">{c.name}</span>
              <span className="ds__swatch-hex">{c.hex}</span>
            </div>
          ))}
        </div>
      </section>

      {/* === Typography === */}
      <section className="ds__section">
        <h2 className="ds__section-title">Typography</h2>
        <p className="ds__section-desc">Two font families with six size steps.</p>

        <div className="ds__type-group">
          <div className="ds__type-group-label">--font-mono (IBM Plex Mono)</div>
          {FONT_SIZES.map((fs) => (
            <div key={fs.name + '-mono'} className="ds__type-sample">
              <span className="ds__type-label">{fs.name} / {fs.rem}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: `var(${fs.name})` }}>
                The quick brown fox jumps over the lazy dog
              </span>
            </div>
          ))}
        </div>

        <div className="ds__type-group">
          <div className="ds__type-group-label">--font-sans (Inter)</div>
          {FONT_SIZES.map((fs) => (
            <div key={fs.name + '-sans'} className="ds__type-sample">
              <span className="ds__type-label">{fs.name} / {fs.rem}</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: `var(${fs.name})` }}>
                The quick brown fox jumps over the lazy dog
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* === Spacing === */}
      <section className="ds__section">
        <h2 className="ds__section-title">Spacing</h2>
        <p className="ds__section-desc">Consistent spacing scale used for padding, margins, and gaps.</p>
        <div className="ds__spacing-row">
          {SPACING.map((s) => (
            <div key={s.name} className="ds__spacing-item">
              <div
                className="ds__spacing-block"
                style={{ width: s.px, height: s.px }}
              />
              <span className="ds__spacing-label">{s.name}</span>
              <span className="ds__spacing-label">{s.px}</span>
            </div>
          ))}
        </div>

        <div className="ds__radius-row">
          <div className="ds__radius-item">
            <div className="ds__radius-box" style={{ borderRadius: 'var(--radius)' }} />
            <span className="ds__spacing-label">--radius (4px)</span>
          </div>
          <div className="ds__radius-item">
            <div className="ds__radius-box" style={{ borderRadius: 'var(--radius-lg)' }} />
            <span className="ds__spacing-label">--radius-lg (8px)</span>
          </div>
        </div>
      </section>

      {/* === Bullet Signifiers === */}
      <section className="ds__section">
        <h2 className="ds__section-title">Bullet Signifiers</h2>
        <p className="ds__section-desc">Core bullet journal status indicators.</p>
        <div className="ds__signifier-row">
          {(Object.keys(SIGNIFIERS) as TaskStatus[]).map((status) => (
            <div key={status} className="ds__signifier-item">
              <span className="ds__signifier-char" style={{ color: STATUS_COLORS[status] }}>
                {SIGNIFIERS[status]}
              </span>
              <span className="ds__signifier-label">{STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* === Buttons === */}
      <section className="ds__section">
        <h2 className="ds__section-title">Buttons</h2>
        <p className="ds__section-desc">Icon buttons, primary, outline, and ghost variants.</p>

        <div className="ds__button-group">
          <div className="ds__button-group-label">Icon buttons (28px / 32px)</div>
          <div className="ds__button-row">
            <button className="task-item__action" title="28px action">
              <FontAwesomeIcon icon={faTrash} />
            </button>
            <button className="task-item__action" title="28px action">
              <FontAwesomeIcon icon={faPen} />
            </button>
            <button className="task-item__action" title="28px action">
              <FontAwesomeIcon icon={faCalendarDays} />
            </button>
            <button className="task-item__action" title="28px action">
              <FontAwesomeIcon icon={faBullseye} />
            </button>
            <span style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 4px' }} />
            <button className="highlight__confirm" title="32px confirm">
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <button className="highlight__cancel" title="32px cancel">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>

        <div className="ds__button-group">
          <div className="ds__button-group-label">Primary</div>
          <div className="ds__button-row">
            <button className="date-popover__btn date-popover__btn--save">Save</button>
          </div>
        </div>

        <div className="ds__button-group">
          <div className="ds__button-group-label">Outline & ghost</div>
          <div className="ds__button-row">
            <button className="highlight__btn">Outline</button>
            <button className="highlight__btn highlight__btn--secondary">Secondary</button>
            <button className="layout__today-btn">
              <FontAwesomeIcon icon={faBullseye} size="xs" />
              Today
            </button>
          </div>
        </div>

        <div className="ds__button-group">
          <div className="ds__button-group-label">Navigation (32px)</div>
          <div className="ds__button-row">
            <button className="layout__nav-btn">
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button className="layout__nav-btn">
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </section>

      {/* === Inputs === */}
      <section className="ds__section">
        <h2 className="ds__section-title">Inputs</h2>
        <p className="ds__section-desc">Global input styles from index.css — no custom classes needed.</p>
        <div className="ds__input-group">
          <input type="text" placeholder="Task content..." />
          <textarea placeholder="Description or notes..." rows={3} />
          <input type="date" defaultValue="2026-03-14" />
        </div>
      </section>

      {/* === Badges === */}
      <section className="ds__section">
        <h2 className="ds__section-title">Badges</h2>
        <p className="ds__section-desc">Inline metadata badges using TaskItem CSS classes.</p>

        <div className="ds__button-group">
          <div className="ds__button-group-label">Category & subtasks</div>
          <div className="ds__badge-row">
            <span className="task-item__category-badge">design</span>
            <span className="task-item__category-badge">dev</span>
            <span className="task-item__category-badge">personal</span>
            <span className="task-item__subtask-count">2/5</span>
            <span className="task-item__subtask-count">0/3</span>
          </div>
        </div>

        <div className="ds__button-group">
          <div className="ds__button-group-label">Date badges</div>
          <div className="ds__badge-row">
            <span className="task-item__badge task-item__badge--planned">
              <FontAwesomeIcon icon={faCalendarDays} /> Mar 14–16
            </span>
            <span className="task-item__badge task-item__badge--deadline task-item__badge--overdue">
              <FontAwesomeIcon icon={faBullseye} /> Mar 10 (overdue)
            </span>
            <span className="task-item__badge task-item__badge--deadline task-item__badge--today">
              <FontAwesomeIcon icon={faBullseye} /> Mar 14 (today)
            </span>
            <span className="task-item__badge task-item__badge--deadline task-item__badge--future">
              <FontAwesomeIcon icon={faBullseye} /> Mar 20 (future)
            </span>
          </div>
        </div>
      </section>

      {/* === Task Item === */}
      <section className="ds__section">
        <h2 className="ds__section-title">Task Item</h2>
        <p className="ds__section-desc">All five status variants with real TaskItem CSS classes.</p>
        <div className="ds__task-list">
          {/* Full example task */}
          <div className="task-item">
            <span className="task-item__drag-handle">
              <FontAwesomeIcon icon={faGripVertical} />
            </span>
            <button className="task-item__signifier" style={{ color: 'var(--text)' }}>
              {SIGNIFIERS.open}
            </button>
            <div className="task-item__body">
              <span className="task-item__content task-item__content--clickable">
                Build design system page
                <span className="task-item__subtask-count">2/5</span>
                <span className="task-item__category-badge">dev</span>
              </span>
              <div className="task-item__badges">
                <span className="task-item__badge task-item__badge--planned">
                  <FontAwesomeIcon icon={faCalendarDays} /> Mar 14–16
                </span>
                <span className="task-item__badge task-item__badge--deadline task-item__badge--today">
                  <FontAwesomeIcon icon={faBullseye} /> Mar 14
                </span>
              </div>
            </div>
            <div className="task-item__actions" style={{ opacity: 1 }}>
              <button className="task-item__action task-item__action--planned">
                <FontAwesomeIcon icon={faCalendarDays} />
              </button>
              <button className="task-item__action task-item__action--delete">
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>

          {/* Status variants */}
          <div className="task-item task-item--completed">
            <span className="task-item__drag-handle" style={{ visibility: 'hidden' }}>
              <FontAwesomeIcon icon={faGripVertical} />
            </span>
            <button className="task-item__signifier">{SIGNIFIERS.completed}</button>
            <div className="task-item__body">
              <span className="task-item__content">Set up project structure</span>
            </div>
          </div>

          <div className="task-item task-item--migrated">
            <span className="task-item__drag-handle" style={{ visibility: 'hidden' }}>
              <FontAwesomeIcon icon={faGripVertical} />
            </span>
            <button className="task-item__signifier">{SIGNIFIERS.migrated}</button>
            <div className="task-item__body">
              <span className="task-item__content">Review pull requests</span>
            </div>
          </div>

          <div className="task-item task-item--scheduled">
            <span className="task-item__drag-handle" style={{ visibility: 'hidden' }}>
              <FontAwesomeIcon icon={faGripVertical} />
            </span>
            <button className="task-item__signifier">{SIGNIFIERS.scheduled}</button>
            <div className="task-item__body">
              <span className="task-item__content">Prepare quarterly report</span>
            </div>
          </div>

          <div className="task-item task-item--cancelled">
            <span className="task-item__drag-handle" style={{ visibility: 'hidden' }}>
              <FontAwesomeIcon icon={faGripVertical} />
            </span>
            <button className="task-item__signifier">{SIGNIFIERS.cancelled}</button>
            <div className="task-item__body">
              <span className="task-item__content">Deprecated feature work</span>
            </div>
          </div>
        </div>
      </section>

      {/* === Highlight === */}
      <section className="ds__section">
        <h2 className="ds__section-title">Highlight</h2>
        <p className="ds__section-desc">Daily highlight component — empty and set states.</p>
        <div className="ds__highlight-specimens">
          {/* Empty state */}
          <div className="highlight highlight--empty">
            <div className="highlight__prompt">
              <FontAwesomeIcon icon={faSun} className="highlight__icon" />
              <span>What's your highlight for today?</span>
            </div>
            <div className="highlight__actions">
              <button className="highlight__btn">Write one</button>
              <button className="highlight__btn highlight__btn--secondary">Pick from tasks</button>
            </div>
          </div>

          {/* Set state */}
          <div className="highlight highlight--set">
            <FontAwesomeIcon icon={faSun} className="highlight__icon" />
            <span className="highlight__content">Ship the design system page</span>
            <div className="highlight__set-actions" style={{ opacity: 1 }}>
              <button className="highlight__edit-btn">
                <FontAwesomeIcon icon={faPen} />
              </button>
              <button className="highlight__clear-btn">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* === Cards & Containers === */}
      <section className="ds__section">
        <h2 className="ds__section-title">Cards & Containers</h2>
        <p className="ds__section-desc">Elevated and bordered container patterns.</p>
        <div className="ds__card-row">
          <div className="ds__card ds__card--elevated">
            <div className="ds__card-label">Elevated card</div>
            <div className="ds__card-text">
              White background with border and shadow. Used for popovers, modals, and prominent UI.
            </div>
          </div>
          <div className="ds__card ds__card--bordered">
            <div className="ds__card-label">Bordered section</div>
            <div className="ds__card-text">
              Light border on the app background. Used for grouping content and secondary containers.
            </div>
          </div>
        </div>
      </section>

      {/* === Mode Selector === */}
      <section className="ds__section">
        <h2 className="ds__section-title">Mode Selector</h2>
        <p className="ds__section-desc">Day organization mode tabs — interactive demo using the actual component.</p>
        <div className="ds__mode-demo">
          <ModeSelector mode={demoMode} onChange={setDemoMode} />
          <p style={{ marginTop: 'var(--space-sm)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>
            Selected: {demoMode}
          </p>
        </div>
      </section>
    </div>
  );
}
