import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faCircleDot, faRightFromBracket, faCalendar, faList } from '@fortawesome/free-solid-svg-icons';
import type { ZoomLevel, ViewMode } from '../../types';
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
  viewMode: ViewMode;
  onZoomChange: (zoom: ZoomLevel) => void;
  onViewModeChange: (mode: ViewMode) => void;
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
  children: React.ReactNode;
}

function getHeader(zoom: ZoomLevel, date: string): string {
  switch (zoom) {
    case 'day':
      return formatDayHeader(date);
    case 'week':
      return formatWeekHeader(date);
    case 'month':
      return formatMonthHeader(date);
    case 'quarter':
      return formatQuarterHeader(date);
    case 'year':
      return formatYearHeader(date);
    default:
      return formatDayHeader(date);
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
  viewMode,
  onZoomChange,
  onViewModeChange,
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
  children,
}: Props) {
  const isToday = isDayToday(currentDate);
  const isFlow = viewMode === 'flow';

  return (
    <div className={`layout ${isFlow ? 'layout--flow' : ''}`}>
      <header className={`layout__header ${isFlow ? 'layout__header--flow' : ''}`}>
        {/* Brand row */}
        <div className="layout__top-row">
          <div className="layout__top-left">
            <span className="layout__brand">bujo</span>
            <span className="layout__date-sub">{getHeader(currentZoom, currentDate).toLowerCase()}</span>
          </div>
          <div className="layout__top-right">
            <button
              className={`layout__mode-btn${viewMode === 'focus' ? ' layout__mode-btn--active' : ''}`}
              onClick={() => onViewModeChange('focus')}
            >focus</button>
            <button
              className={`layout__mode-btn${viewMode === 'flow' ? ' layout__mode-btn--active' : ''}`}
              onClick={() => onViewModeChange('flow')}
            >flow</button>
            <span className={`layout__sync layout__sync--${syncStatus}`} title={syncLabels[syncStatus]}>
              <span className="layout__sync-dot" />
            </span>
            {!isToday && (
              <button className="layout__today-btn" onClick={onGoToday}>
                <FontAwesomeIcon icon={faCircleDot} size="xs" />
                Today
              </button>
            )}
            {gcalEnabled && gcalStatus === 'disconnected' && (
              <button className="layout__gcal-btn" onClick={onGcalConnect} title="Connect Google Calendar">
                <FontAwesomeIcon icon={faCalendar} size="sm" />
              </button>
            )}
            {gcalEnabled && gcalStatus === 'connected' && (
              <button className="layout__gcal-btn layout__gcal-btn--connected" onClick={onGcalDisconnect} title="Disconnect Google Calendar">
                <FontAwesomeIcon icon={faCalendar} size="sm" />
              </button>
            )}
            {gcalEnabled && gcalStatus === 'loading' && (
              <span className="layout__gcal-btn layout__gcal-btn--loading" title="Connecting...">
                <FontAwesomeIcon icon={faCalendar} size="sm" />
              </span>
            )}
            {onToggleLists && (
              <button
                className={`layout__lists-btn${listsOpen ? ' layout__lists-btn--active' : ''}`}
                onClick={onToggleLists}
                title="Lists"
              >
                <FontAwesomeIcon icon={faList} size="sm" />
              </button>
            )}
            {onSignOut && (
              <button className="layout__signout-btn" onClick={onSignOut} title="Sign out">
                <FontAwesomeIcon icon={faRightFromBracket} size="sm" />
              </button>
            )}
          </div>
        </div>

        {/* Zoom strip */}
        <div className="layout__zoom-strip">
          <ZoomNav current={currentZoom} onChange={onZoomChange} />
        </div>

        {/* Date nav — focus mode only */}
        {!isFlow && (
          <div className="layout__date-row">
            <button className="layout__nav-btn" onClick={() => onNavigate('prev')}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <h1 className="layout__date-title">{getHeader(currentZoom, currentDate)}</h1>
            <button className="layout__nav-btn" onClick={() => onNavigate('next')}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </header>

      <main className={`layout__content ${isFlow ? 'layout__content--flow' : ''}`}>{children}</main>

      <footer className="layout__footer">
        <a className="layout__design-link" href="#/design-system">Design System</a>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="layout__bottom-nav">
        <button
          className={`layout__bottom-nav-item${viewMode === 'focus' ? ' active' : ''}`}
          onClick={() => onViewModeChange('focus')}
        >
          <span className="layout__bottom-nav-icon">○</span>
          <span className="layout__bottom-nav-label">focus</span>
        </button>
        <button
          className={`layout__bottom-nav-item${viewMode === 'flow' ? ' active' : ''}`}
          onClick={() => onViewModeChange('flow')}
        >
          <span className="layout__bottom-nav-icon">≡</span>
          <span className="layout__bottom-nav-label">flow</span>
        </button>
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
    </div>
  );
}
