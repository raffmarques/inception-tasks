import { useState, useCallback } from 'react';
import type { ZoomLevel, ViewMode } from '../types';
import { today, navigateDay } from '../utils/dates';
import { addWeeks, subWeeks, addMonths, subMonths, addQuarters, subQuarters, addYears, subYears } from 'date-fns';
import { fromDateKey, toDateKey } from '../utils/dates';

export function useNavigation() {
  const [currentDate, setCurrentDate] = useState(today());
  const [currentZoom, setCurrentZoom] = useState<ZoomLevel>('day');
  const [viewMode, setViewMode] = useState<ViewMode>('focus');

  const goToToday = useCallback(() => setCurrentDate(today()), []);

  const navigate = useCallback(
    (direction: 'prev' | 'next') => {
      setCurrentDate((prev) => {
        const date = fromDateKey(prev);
        switch (currentZoom) {
          case 'day':
            return navigateDay(prev, direction);
          case 'week':
            return toDateKey(direction === 'next' ? addWeeks(date, 1) : subWeeks(date, 1));
          case 'month':
            return toDateKey(direction === 'next' ? addMonths(date, 1) : subMonths(date, 1));
          case 'quarter':
            return toDateKey(direction === 'next' ? addQuarters(date, 1) : subQuarters(date, 1));
          case 'year':
            return toDateKey(direction === 'next' ? addYears(date, 1) : subYears(date, 1));
          default:
            return navigateDay(prev, direction);
        }
      });
    },
    [currentZoom],
  );

  const setZoom = useCallback((zoom: ZoomLevel) => {
    setCurrentZoom(zoom);
  }, []);

  return {
    currentDate,
    currentZoom,
    viewMode,
    setCurrentDate,
    setZoom,
    setViewMode,
    navigate,
    goToToday,
  };
}
