import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleDot, faRightFromBracket, faCalendar } from '@fortawesome/free-solid-svg-icons';
import { useRef, useEffect } from 'react';
import {
  addDays, addWeeks, addMonths, addYears,
  format, startOfWeek, endOfWeek, startOfMonth, startOfQuarter, startOfYear,
  getISOWeek, getQuarter, isToday as dateFnsIsToday,
} from 'date-fns';
import type { ZoomLevel } from '../../types';
import type { SyncStatus } from '../../hooks/useSync';
import type { GCalStatus } from '../../hooks/useGoogleCalendar';
import { ZoomNav } from '../ZoomNav/ZoomNav';
import {
  isDayToday,
  fromDateKey,
  toDateKey,
  toWeekKey,
  toMonthKey,
  toQuarterKey,
  toYearKey,
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
  onGoToDate?: (date: string) => void;
  onToggleLists?: () => void;
  listsOpen?: boolean;
  yearMapOpen?: boolean;
  onToggleYearMap?: () => void;
  children: React.ReactNode;
}

const DAY_ABBREVS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const QUARTER_RANGES = ['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec'];
const STRIP_WINDOW: Record<ZoomLevel, number> = { day: 20, week: 20, month: 20, quarter: 8, year: 10 };

type StripCell = { navKey: string; main: string; sub: string | null; isCurrent: boolean; isPresentPeriod: boolean; };

function buildCells(zoom: ZoomLevel, currentDate: string): StripCell[] {
  const base = fromDateKey(currentDate);
  const now = new Date();
  const w = STRIP_WINDOW[zoom];

  return Array.from({ length: w * 2 + 1 }, (_, i) => {
    const offset = i - w;
    let d: Date;
    if (zoom === 'day')         d = addDays(base, offset);
    else if (zoom === 'week')   d = addWeeks(base, offset);
    else if (zoom === 'month')  d = addMonths(base, offset);
    else if (zoom === 'quarter') d = addMonths(base, offset * 3);
    else                        d = addYears(base, offset);

    if (zoom === 'day') {
      const navKey = toDateKey(d);
      return { navKey, main: format(d, 'd'), sub: DAY_ABBREVS[d.getDay()],
        isCurrent: navKey === currentDate, isPresentPeriod: dateFnsIsToday(d) };
    }
    if (zoom === 'week') {
      const mon = startOfWeek(d, { weekStartsOn: 1 });
      const sun = endOfWeek(d, { weekStartsOn: 1 });
      return { navKey: toDateKey(mon),
        main: `W${String(getISOWeek(d)).padStart(2, '0')}`,
        sub: `${format(mon, 'MMM d')}–${format(sun, 'd')}`,
        isCurrent: toWeekKey(d) === toWeekKey(base),
        isPresentPeriod: toWeekKey(d) === toWeekKey(now) };
    }
    if (zoom === 'month') {
      return { navKey: toDateKey(startOfMonth(d)),
        main: format(d, 'MMM').toUpperCase(), sub: format(d, 'yyyy'),
        isCurrent: toMonthKey(d) === toMonthKey(base),
        isPresentPeriod: toMonthKey(d) === toMonthKey(now) };
    }
    if (zoom === 'quarter') {
      const q = getQuarter(d) - 1;
      return { navKey: toDateKey(startOfQuarter(d)),
        main: `Q${q + 1}`, sub: QUARTER_RANGES[q],
        isCurrent: toQuarterKey(d) === toQuarterKey(base),
        isPresentPeriod: toQuarterKey(d) === toQuarterKey(now) };
    }
    // year
    return { navKey: toDateKey(startOfYear(d)),
      main: format(d, 'yyyy'), sub: null,
      isCurrent: toYearKey(d) === toYearKey(base),
      isPresentPeriod: toYearKey(d) === toYearKey(now) };
  });
}

function ZoomStrip({ currentDate, currentZoom, onGoToDate }: {
  currentDate: string; currentZoom: ZoomLevel; onGoToDate: (date: string) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);
  const cells = buildCells(currentZoom, currentDate);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
  }, [currentDate, currentZoom]);

  return (
    <div className={`layout__day-strip layout__day-strip--${currentZoom}`}>
      {cells.map((cell, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === cells.length - 1;
        const cls = [
          'layout__day-cell',
          `layout__day-cell--${currentZoom}`,
          cell.isCurrent ? 'layout__day-cell--selected' : '',
          cell.isPresentPeriod ? 'layout__day-cell--today' : '',
          isFirst ? 'layout__day-cell--first' : '',
          isLast  ? 'layout__day-cell--last'  : '',
        ].filter(Boolean).join(' ');
        return (
          <button
            key={cell.navKey + idx}
            ref={cell.isCurrent ? selectedRef : undefined}
            className={cls}
            onClick={() => onGoToDate(cell.navKey)}
          >
            <span className="layout__day-cell-num">{cell.main}</span>
            {cell.sub && <span className="layout__day-cell-abbr">{cell.sub}</span>}
          </button>
        );
      })}
    </div>
  );
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
  onNavigate: _onNavigate,
  onGoToday,
  syncStatus = 'idle',
  onSignOut,
  gcalStatus,
  gcalEnabled,
  onGcalConnect,
  onGcalDisconnect,
  onGoToDate,
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
            {/* Zoom nav — desktop only, center */}
            <div className="layout__zoom-inline">
              <ZoomNav current={currentZoom} onChange={onZoomChange} />
            </div>          
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

        {/* Scrollable period strip — all zoom levels */}
        {onGoToDate && (
          <ZoomStrip currentDate={currentDate} currentZoom={currentZoom} onGoToDate={onGoToDate} />
        )}
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
