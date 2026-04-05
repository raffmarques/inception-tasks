import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from './useLocalStorage';
import type { CalGroup, CalendarDef, CalEntry, YearMapData } from '../types';

const INITIAL: YearMapData = { groups: [], calendars: [], entries: [] };

export function useYearMap() {
  const [data, setData] = useLocalStorage<YearMapData>('bujo-yearmap', INITIAL);

  const addGroup = useCallback((name: string, color: string) => {
    setData((d) => ({
      ...d,
      groups: [...d.groups, { id: uuidv4(), name, color, visible: true }],
    }));
  }, [setData]);

  const removeGroup = useCallback((groupId: string) => {
    setData((d) => {
      const calIds = new Set(d.calendars.filter((c) => c.groupId === groupId).map((c) => c.id));
      return {
        groups: d.groups.filter((g) => g.id !== groupId),
        calendars: d.calendars.filter((c) => c.groupId !== groupId),
        entries: d.entries.filter((e) => !calIds.has(e.calendarId)),
      };
    });
  }, [setData]);

  const toggleGroup = useCallback((groupId: string) => {
    setData((d) => ({
      ...d,
      groups: d.groups.map((g) => g.id === groupId ? { ...g, visible: !g.visible } : g),
    }));
  }, [setData]);

  const addCalendar = useCallback((groupId: string, name: string, color: string) => {
    setData((d) => ({
      ...d,
      calendars: [...d.calendars, { id: uuidv4(), groupId, name, color, visible: true }],
    }));
  }, [setData]);

  const removeCalendar = useCallback((calendarId: string) => {
    setData((d) => ({
      ...d,
      calendars: d.calendars.filter((c) => c.id !== calendarId),
      entries: d.entries.filter((e) => e.calendarId !== calendarId),
    }));
  }, [setData]);

  const toggleCalendar = useCallback((calendarId: string) => {
    setData((d) => ({
      ...d,
      calendars: d.calendars.map((c) => c.id === calendarId ? { ...c, visible: !c.visible } : c),
    }));
  }, [setData]);

  const addEntry = useCallback((calendarId: string, name: string, startDate: string, endDate: string) => {
    setData((d) => ({
      ...d,
      entries: [...d.entries, { id: uuidv4(), calendarId, name, startDate, endDate }],
    }));
  }, [setData]);

  const removeEntry = useCallback((entryId: string) => {
    setData((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== entryId) }));
  }, [setData]);

  const getVisibleEntries = useCallback((groups: CalGroup[], calendars: CalendarDef[], entries: CalEntry[]) => {
    const visibleCalIds = new Set(
      calendars
        .filter((c) => c.visible && (groups.find((g) => g.id === c.groupId)?.visible ?? true))
        .map((c) => c.id)
    );
    return entries.filter((e) => visibleCalIds.has(e.calendarId));
  }, []);

  return {
    ...data,
    addGroup,
    removeGroup,
    toggleGroup,
    addCalendar,
    removeCalendar,
    toggleCalendar,
    addEntry,
    removeEntry,
    visibleEntries: getVisibleEntries(data.groups, data.calendars, data.entries),
  };
}
