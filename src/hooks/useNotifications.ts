import { useEffect, useCallback } from 'react';
import type { Task } from '../types';

/** Parse an offset string like "1d", "2h", "1w" into milliseconds */
function parseOffset(offset: string): number {
  const match = offset.match(/^(\d+)([hdw])$/);
  if (!match) return 0;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'h') return n * 60 * 60 * 1000;
  if (unit === 'd') return n * 24 * 60 * 60 * 1000;
  if (unit === 'w') return n * 7 * 24 * 60 * 60 * 1000;
  return 0;
}

/** Returns the notification fire time for a task, or null if not applicable */
function getNotificationTime(task: Task): Date | null {
  if (!task.notificationOffset || !task.deadline) return null;
  if (task.status !== 'open') return null;
  const offsetMs = parseOffset(task.notificationOffset);
  if (!offsetMs) return null;
  const deadlineMs = new Date(task.deadline + 'T00:00:00').getTime();
  return new Date(deadlineMs - offsetMs);
}

export function useNotifications(allTasks: Task[]) {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return Notification.requestPermission();
  }, []);

  const checkAndFire = useCallback(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = Date.now();
    const firedKey = 'bujo-notif-fired';
    const fired: Record<string, number> = JSON.parse(localStorage.getItem(firedKey) ?? '{}');

    for (const task of allTasks) {
      const notifTime = getNotificationTime(task);
      if (!notifTime) continue;
      const notifMs = notifTime.getTime();
      // Fire if notification time has passed but within last 24h, and not already fired
      const alreadyFired = fired[task.id] && fired[task.id] >= notifMs;
      if (alreadyFired) continue;
      if (notifMs <= now && now - notifMs < 24 * 60 * 60 * 1000) {
        new Notification(`bujo: ${task.content}`, {
          body: `Deadline: ${task.deadline}`,
          tag: `bujo-task-${task.id}`,
          icon: '/pwa-192x192.png',
        });
        fired[task.id] = now;
      }
    }
    localStorage.setItem(firedKey, JSON.stringify(fired));
  }, [allTasks]);

  // Check on mount and when app regains focus
  useEffect(() => {
    checkAndFire();
    const onFocus = () => checkAndFire();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [checkAndFire]);

  return { requestPermission };
}
