import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCircleDot, faRightFromBracket, faCalendar } from '@fortawesome/free-solid-svg-icons';
import type { ZoomLevel } from '../../types';
import type { SyncStatus } from '../../hooks/useSync';
import type { GCalStatus } from '../../hooks/useGoogleCalendar';
import { ZoomNav } from '../ZoomNav/ZoomNav';
import {
  formatDayHeader,
  formatWeekHeader,
  formatMonthHeader,
  formatQuarterHeader,
  formatYearHeader,
  isDayToday,
} from '../../utils/dates';
import './Layout.css';

interface Props {
  currentDate: string;
  currentZoom: ZoomLevel;
  onZoomChange: (zoom: ZoomLevel) => void;
  onNavigate: (dir: 'prev' | 'next') => void;
  onGoToday: () => void;
  syncStatus?: SyncStatus;
  onSignOut?: () => void;
  gcalStatus?: GCalStatus;
  gcalEnabled?: boolean;
  onGcalConnect?: () => void;
  onGcalDisconnect?: () => void;
  onToggleLists?: () => void;
  listsOpen?: boolean;
  yearMapOpen?: boolean;
  onToggleYearMap?: () => void;
  children: React.ReactNode;
}

function getHeader(zoom: ZoomLevel, date: string): string {
  switch (zoom) {
    case 'day':   return formatDayHeader(date);
    case 'week':  return formatWeekHeader(date);
    case 'month': return formatMonthHeader(date);
    case 'quarter': return formatQuarterHeader(date);
    case 'year':  return formatYearHeader(date);
    default:      return formatDayHeader(date);
  }
}

const syncLabels: Record<SyncStatus, string> = {
  idle: 'Synced',
  syncing: 'Syncing...',
  error: 'Sync error',
  offline: 'Offline',
};

export function Layout({
  currentDate,
  currentZoom,
  onZoomChange,
  onNavigate,
  onGoToday,
  syncStatus = 'idle',
  onSignOut,
  gcalStatus,
  gcalEnabled,
  onGcalConnect,
  onGcalDisconnect,
  onToggleLists,
  listsOpen,
  yearMapOpen,
  onToggleYearMap,
  children,
}: Props) {
  const isToday = isDayToday(currentDate);

  return (
    <div className="layout">
      <header className="layout__header">
        {/* Brand row */}
        <div className="layout__top-row">
          <div className="layout__top-left">
            <span className="layout__brand">bujo</span>
            <span className="layout__date-sub">{getHeader(currentZoom, currentDate).toLowerCase()}</span>
          </div>
          {/* Zoom nav — desktop only, center */}
          <div className="layout__zoom-inline">
            <ZoomNav current={currentZoom} onChange={onZoomChange} />
          </div>
          <div className="layout__top-right">
            {!isToday && (
              <button className="layout__today-btn" onClick={onGoToday}>
                <FontAwesomeIcon icon={faCircleDot} size="xs" />
                Today
              </button>
            )}
            {onToggleYearMap && (
              <button
                className={`layout__nav-link${yearMapOpen ? ' layout__nav-link--active' : ''}`}
                onClick={onToggleYearMap}
              >
                Year Map
              </button>
            )}
            {onToggleLists && (
              <>
                <span className="layout__nav-sep">·</span>
                <button
                  className={`layout__nav-link${listsOpen ? ' layout__nav-link--active' : ''}`}
                  onClick={onToggleLists}
                >
                  Lists
                </button>
              </>
            )}
            {onSignOut && (
              <>
                <span className="layout__nav-sep">·</span>
                <button className="layout__signout-btn" onClick={onSignOut} title="Sign out">
                  <FontAwesomeIcon icon={faRightFromBracket} size="sm" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Zoom strip — mobile only */}
        <div className="layout__zoom-strip">
          <ZoomNav current={currentZoom} onChange={onZoomChange} />
        </div>

        {/* Date nav — between header and content, left-aligned title */}
        <div className="layout__date-row">
          <button className="layout__nav-btn" onClick={() => onNavigate('prev')}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <h1 className="layout__date-title">{getHeader(currentZoom, currentDate)}</h1>
          <button className="layout__nav-btn" onClick={() => onNavigate('next')}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </header>

      <main className="layout__content">{children}</main>

      <footer className="layout__footer">
        <span className={`layout__sync layout__sync--${syncStatus}`} title={syncLabels[syncStatus]}>
          <span className="layout__sync-dot" />
          <span className="layout__sync-label">{syncLabels[syncStatus]}</span>
        </span>
        {gcalEnabled && gcalStatus === 'disconnected' && (
          <>
            <span className="layout__footer-sep">·</span>
            <button className="layout__gcal-btn" onClick={onGcalConnect} title="Connect Google Calendar">
              <FontAwesomeIcon icon={faCalendar} size="sm" />
              <span>Google Calendar</span>
            </button>
          </>
        )}
        {gcalEnabled && gcalStatus === 'connected' && (
          <>
            <span className="layout__footer-sep">·</span>
            <button className="layout__gcal-btn layout__gcal-btn--connected" onClick={onGcalDisconnect} title="Disconnect Google Calendar">
              <FontAwesomeIcon icon={faCalendar} size="sm" />
              <span>Google Calendar</span>
            </button>
          </>
        )}
        {gcalEnabled && gcalStatus === 'loading' && (
          <>
            <span className="layout__footer-sep">·</span>
            <span className="layout__gcal-btn layout__gcal-btn--loading" title="Connecting...">
              <FontAwesomeIcon icon={faCalendar} size="sm" />
              <span>Connecting...</span>
            </span>
          </>
        )}
        <span className="layout__footer-sep">·</span>
        <a className="layout__design-link" href="#/design-system">Design System</a>
      </footer>

      {/* Mobile bottom nav */}
      {(onToggleLists || onToggleYearMap) && (
        <nav className="layout__bottom-nav">
          {onToggleYearMap && (
            <button
              className={`layout__bottom-nav-item${yearMapOpen ? ' active' : ''}`}
              onClick={onToggleYearMap}
            >
              <span className="layout__bottom-nav-icon">◫</span>
              <span className="layout__bottom-nav-label">year map</span>
            </button>
          )}
          {onToggleLists && (
            <button
              className={`layout__bottom-nav-item${listsOpen ? ' active' : ''}`}
              onClick={onToggleLists}
            >
              <span className="layout__bottom-nav-icon">⊞</span>
              <span className="layout__bottom-nav-label">lists</span>
            </button>
          )}
        </nav>
      )}
    </div>
  );
}
