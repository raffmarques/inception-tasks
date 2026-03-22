import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faLocationDot, faClock } from '@fortawesome/free-solid-svg-icons';
import { format, parseISO } from 'date-fns';
import type { CalendarEvent } from '../../hooks/useGoogleCalendar';
import './CalendarEvents.css';

interface Props {
  events: CalendarEvent[];
  loading?: boolean;
}

function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return 'All day';
  try {
    const start = parseISO(event.start);
    const end = parseISO(event.end);
    return `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`;
  } catch {
    return '';
  }
}

export function CalendarEvents({ events, loading }: Props) {
  if (loading) {
    return (
      <div className="cal-events">
        <div className="cal-events__header">
          <FontAwesomeIcon icon={faCalendar} className="cal-events__header-icon" />
          <span className="cal-events__header-label">Calendar</span>
        </div>
        <div className="cal-events__loading">Loading events...</div>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="cal-events">
      <div className="cal-events__header">
        <FontAwesomeIcon icon={faCalendar} className="cal-events__header-icon" />
        <span className="cal-events__header-label">Calendar</span>
        <span className="cal-events__count">{events.length}</span>
      </div>
      <div className="cal-events__list">
        {events.map((event) => (
          <a
            key={event.id}
            className="cal-events__item"
            href={event.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="cal-events__dot" />
            <div className="cal-events__body">
              <span className="cal-events__summary">{event.summary}</span>
              <div className="cal-events__meta">
                <span className="cal-events__time">
                  <FontAwesomeIcon icon={faClock} />
                  {formatEventTime(event)}
                </span>
                {event.location && (
                  <span className="cal-events__location">
                    <FontAwesomeIcon icon={faLocationDot} />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
