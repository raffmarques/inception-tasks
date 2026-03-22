import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { DayOrgData, DayOrgMode, TimeBoxBucket } from '../types';

const DEFAULT_ORG: DayOrgData = { mode: 'manual' };

export function useDayOrganization() {
  const [orgData, setOrgData] = useLocalStorage<Record<string, DayOrgData>>('bujo-day-org', {});

  const getOrgForDate = useCallback(
    (date: string): DayOrgData => orgData[date] ?? DEFAULT_ORG,
    [orgData],
  );

  const updateDate = useCallback(
    (date: string, updater: (prev: DayOrgData) => DayOrgData) => {
      setOrgData((prev) => ({
        ...prev,
        [date]: updater(prev[date] ?? DEFAULT_ORG),
      }));
    },
    [setOrgData],
  );

  const setMode = useCallback(
    (date: string, mode: DayOrgMode) => {
      updateDate(date, (prev) => ({ ...prev, mode }));
    },
    [updateDate],
  );

  const setSessionTime = useCallback(
    (date: string, totalMinutes: number) => {
      updateDate(date, (prev) => ({
        ...prev,
        timeEffort: {
          totalMinutes,
          taskIds: prev.timeEffort?.taskIds ?? [],
        },
      }));
    },
    [updateDate],
  );

  const addTaskToSession = useCallback(
    (date: string, taskId: string) => {
      updateDate(date, (prev) => {
        const existing = prev.timeEffort?.taskIds ?? [];
        if (existing.includes(taskId)) return prev;
        return {
          ...prev,
          timeEffort: {
            totalMinutes: prev.timeEffort?.totalMinutes ?? 60,
            taskIds: [...existing, taskId],
          },
        };
      });
    },
    [updateDate],
  );

  const removeTaskFromSession = useCallback(
    (date: string, taskId: string) => {
      updateDate(date, (prev) => ({
        ...prev,
        timeEffort: {
          totalMinutes: prev.timeEffort?.totalMinutes ?? 60,
          taskIds: (prev.timeEffort?.taskIds ?? []).filter((id) => id !== taskId),
        },
      }));
    },
    [updateDate],
  );

  const reorderSession = useCallback(
    (date: string, taskId: string, newIndex: number) => {
      updateDate(date, (prev) => {
        const ids = [...(prev.timeEffort?.taskIds ?? [])];
        const oldIndex = ids.indexOf(taskId);
        if (oldIndex === -1) return prev;
        ids.splice(oldIndex, 1);
        ids.splice(newIndex, 0, taskId);
        return {
          ...prev,
          timeEffort: {
            totalMinutes: prev.timeEffort?.totalMinutes ?? 60,
            taskIds: ids,
          },
        };
      });
    },
    [updateDate],
  );

  const setTaskBucket = useCallback(
    (date: string, taskId: string, bucket: TimeBoxBucket) => {
      updateDate(date, (prev) => ({
        ...prev,
        timeBoxing: {
          ...(prev.timeBoxing ?? {}),
          [taskId]: bucket,
        },
      }));
    },
    [updateDate],
  );

  const clearTaskBucket = useCallback(
    (date: string, taskId: string) => {
      updateDate(date, (prev) => {
        const buckets = { ...(prev.timeBoxing ?? {}) };
        delete buckets[taskId];
        return { ...prev, timeBoxing: buckets };
      });
    },
    [updateDate],
  );

  return {
    getOrgForDate,
    setMode,
    setSessionTime,
    addTaskToSession,
    removeTaskFromSession,
    reorderSession,
    setTaskBucket,
    clearTaskBucket,
  };
}
