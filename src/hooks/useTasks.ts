import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { Task, TaskStatus, DayData } from '../types';
import { useLocalStorage } from './useLocalStorage';

const emptyDay = (date: string): DayData => ({
  date,
  tasks: [],
  migrationComplete: false,
});

export function useTasks() {
  const [days, setDays] = useLocalStorage<Record<string, DayData>>('bujo-days', {});

  const getDay = useCallback(
    (date: string): DayData => days[date] ?? emptyDay(date),
    [days],
  );

  const updateDay = useCallback(
    (date: string, updater: (day: DayData) => DayData) => {
      setDays((prev) => ({
        ...prev,
        [date]: updater(prev[date] ?? emptyDay(date)),
      }));
    },
    [setDays],
  );

  const addTask = useCallback(
    (date: string, content: string): Task => {
      const now = new Date().toISOString();
      const id = uuid();
      updateDay(date, (day) => {
        const task: Task = {
          id,
          content,
          status: 'open',
          createdDate: date,
          order: day.tasks.length,
          updatedAt: now,
        };
        return { ...day, updatedAt: now, tasks: [...day.tasks, task] };
      });
      // Return a placeholder — callers that need the task should use the day state
      return { id, content, status: 'open', createdDate: date, order: 0, updatedAt: now };
    },
    [updateDay],
  );

  const updateTask = useCallback(
    (date: string, taskId: string, updates: Partial<Task>) => {
      const now = new Date().toISOString();
      updateDay(date, (day) => ({
        ...day,
        updatedAt: now,
        tasks: day.tasks.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: now } : t)),
      }));
    },
    [updateDay],
  );

  const cycleTaskStatus = useCallback(
    (date: string, taskId: string) => {
      const now = new Date().toISOString();
      const cycle: TaskStatus[] = ['open', 'completed', 'cancelled'];
      updateDay(date, (day) => ({
        ...day,
        updatedAt: now,
        tasks: day.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const idx = cycle.indexOf(t.status);
          const next = cycle[(idx + 1) % cycle.length];
          return { ...t, status: next, updatedAt: now };
        }),
      }));
    },
    [updateDay],
  );

  const migrateTask = useCallback(
    (fromDate: string, taskId: string, toDate: string) => {
      const now = new Date().toISOString();
      const sourceDay = days[fromDate] ?? emptyDay(fromDate);
      const task = sourceDay.tasks.find((t) => t.id === taskId);
      if (!task) return;

      updateTask(fromDate, taskId, { status: 'migrated', migratedTo: toDate });

      const newId = uuid();
      const baseTask = { ...task };
      updateDay(toDate, (day) => ({
        ...day,
        updatedAt: now,
        tasks: [...day.tasks, {
          ...baseTask,
          id: newId,
          status: 'open' as const,
          createdDate: fromDate,
          scheduledDate: toDate,
          migratedTo: undefined,
          order: day.tasks.length,
          updatedAt: now,
        }],
      }));
    },
    [days, updateDay, updateTask],
  );

  const deleteTask = useCallback(
    (date: string, taskId: string) => {
      const now = new Date().toISOString();
      updateDay(date, (day) => ({
        ...day,
        updatedAt: now,
        tasks: day.tasks.filter((t) => t.id !== taskId),
      }));
    },
    [updateDay],
  );

  const setMigrationComplete = useCallback(
    (date: string) => {
      const now = new Date().toISOString();
      updateDay(date, (day) => ({ ...day, migrationComplete: true, updatedAt: now }));
    },
    [updateDay],
  );

  const getOpenTasksForDate = useCallback(
    (date: string): Task[] => {
      const day = days[date] ?? emptyDay(date);
      return day.tasks.filter((t) => t.status === 'open');
    },
    [days],
  );

  const moveTask = useCallback(
    (fromDate: string, taskId: string, toDate: string) => {
      if (fromDate === toDate) return;
      const now = new Date().toISOString();
      setDays((prev) => {
        const sourceDay = prev[fromDate] ?? emptyDay(fromDate);
        const task = sourceDay.tasks.find((t) => t.id === taskId);
        if (!task) return prev;

        const targetDay = prev[toDate] ?? emptyDay(toDate);
        return {
          ...prev,
          [fromDate]: {
            ...sourceDay,
            updatedAt: now,
            tasks: sourceDay.tasks.filter((t) => t.id !== taskId),
          },
          [toDate]: {
            ...targetDay,
            updatedAt: now,
            tasks: [...targetDay.tasks, { ...task, order: targetDay.tasks.length, updatedAt: now }],
          },
        };
      });
    },
    [setDays],
  );

  const reorderTask = useCallback(
    (date: string, taskId: string, newOrder: number) => {
      const now = new Date().toISOString();
      updateDay(date, (day) => {
        const tasks = [...day.tasks];
        const idx = tasks.findIndex((t) => t.id === taskId);
        if (idx === -1) return day;
        const [moved] = tasks.splice(idx, 1);
        tasks.splice(newOrder, 0, moved);
        return {
          ...day,
          updatedAt: now,
          tasks: tasks.map((t, i) => ({ ...t, order: i, updatedAt: now })),
        };
      });
    },
    [updateDay],
  );

  return {
    days,
    setDays,
    getDay,
    addTask,
    updateTask,
    cycleTaskStatus,
    migrateTask,
    deleteTask,
    setMigrationComplete,
    getOpenTasksForDate,
    reorderTask,
    moveTask,
  };
}
