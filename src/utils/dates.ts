import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  isToday,
  isSameDay,
  parseISO,
  getISOWeek,
  getQuarter,
  startOfQuarter,
  endOfQuarter,
} from 'date-fns';

export const toDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');
export const toWeekKey = (date: Date): string => `${format(date, 'yyyy')}-W${String(getISOWeek(date)).padStart(2, '0')}`;
export const toMonthKey = (date: Date): string => format(date, 'yyyy-MM');
export const toQuarterKey = (date: Date): string => `${format(date, 'yyyy')}-Q${getQuarter(date)}`;
export const toYearKey = (date: Date): string => format(date, 'yyyy');

export const fromDateKey = (key: string): Date => parseISO(key);

export const today = (): string => toDateKey(new Date());
export const yesterday = (): string => toDateKey(subDays(new Date(), 1));

export const navigateDay = (dateKey: string, direction: 'prev' | 'next'): string => {
  const date = fromDateKey(dateKey);
  return toDateKey(direction === 'next' ? addDays(date, 1) : subDays(date, 1));
};

export const getWeekDays = (dateKey: string): string[] => {
  const date = fromDateKey(dateKey);
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map(toDateKey);
};

export const getMonthDays = (dateKey: string): string[] => {
  const date = fromDateKey(dateKey);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return eachDayOfInterval({ start, end }).map(toDateKey);
};

export const getQuarterRange = (dateKey: string) => {
  const date = fromDateKey(dateKey);
  return {
    start: toDateKey(startOfQuarter(date)),
    end: toDateKey(endOfQuarter(date)),
    quarter: getQuarter(date),
    year: date.getFullYear(),
  };
};

export const getQuarterDays = (dateKey: string): string[] => {
  const date = fromDateKey(dateKey);
  const start = startOfQuarter(date);
  const end = endOfQuarter(date);
  return eachDayOfInterval({ start, end }).map(toDateKey);
};

export const getYearDays = (dateKey: string): string[] => {
  const date = fromDateKey(dateKey);
  const start = startOfYear(date);
  const end = endOfYear(date);
  return eachDayOfInterval({ start, end }).map(toDateKey);
};

export const formatDayHeader = (dateKey: string): string => {
  const date = fromDateKey(dateKey);
  return format(date, 'EEEE, MMM d');
};

export const formatDayShort = (dateKey: string): string => {
  const date = fromDateKey(dateKey);
  return format(date, 'EEE d');
};

export const formatMonthHeader = (dateKey: string): string => {
  const date = fromDateKey(dateKey);
  return format(date, 'MMMM yyyy');
};

export const formatWeekHeader = (dateKey: string): string => {
  const date = fromDateKey(dateKey);
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return `Week ${getISOWeek(date)} · ${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
};

export const formatQuarterHeader = (dateKey: string): string => {
  const date = fromDateKey(dateKey);
  return `Q${getQuarter(date)} ${format(date, 'yyyy')}`;
};

export const formatYearHeader = (dateKey: string): string => {
  const date = fromDateKey(dateKey);
  return format(date, 'yyyy');
};

export const isDayToday = (dateKey: string): boolean => isToday(fromDateKey(dateKey));

export const isSameDate = (a: string, b: string): boolean =>
  isSameDay(fromDateKey(a), fromDateKey(b));

export { getISOWeek, getQuarter };
