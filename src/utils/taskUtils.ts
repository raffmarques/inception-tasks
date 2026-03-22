import { format, parseISO, isBefore, isToday as isDateToday } from 'date-fns';

export function formatDateBadge(start: string, end?: string): string {
  const s = parseISO(start);
  if (!end || end === start) return format(s, 'MMM d');
  const e = parseISO(end);
  if (s.getMonth() === e.getMonth()) {
    return `${format(s, 'MMM d')}–${format(e, 'd')}`;
  }
  return `${format(s, 'MMM d')}–${format(e, 'MMM d')}`;
}

export function formatDateBadgeLong(start: string, end?: string): string {
  const s = parseISO(start);
  if (!end || end === start) return format(s, 'MMM d, yyyy');
  const e = parseISO(end);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${format(s, 'MMM d')}–${format(e, 'd, yyyy')}`;
  }
  return `${format(s, 'MMM d')}–${format(e, 'MMM d, yyyy')}`;
}

export function deadlineUrgency(deadline: string): 'overdue' | 'today' | 'future' {
  const d = parseISO(deadline);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (isDateToday(d)) return 'today';
  if (isBefore(d, now)) return 'overdue';
  return 'future';
}
