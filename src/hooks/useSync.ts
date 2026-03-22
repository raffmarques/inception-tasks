import { useEffect, useRef, useCallback, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { DayData, Highlight } from '../types';
import {
  taskToRow,
  highlightToRow,
  dayToRow,
  mergeDays,
  mergeHighlights,
  type TaskRow,
  type HighlightRow,
  type DayRow,
} from '../utils/syncMappers';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface UseSyncOptions {
  session: Session | null;
  days: Record<string, DayData>;
  setDays: (value: Record<string, DayData> | ((prev: Record<string, DayData>) => Record<string, DayData>)) => void;
  highlights: Record<string, Highlight>;
  setHighlights: (value: Record<string, Highlight> | ((prev: Record<string, Highlight>) => Record<string, Highlight>)) => void;
}

export function useSync({ session, days, setDays, highlights, setHighlights }: UseSyncOptions) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const syncReady = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushedTaskIds = useRef<Set<string>>(new Set());
  const lastPushedHighlightKeys = useRef<Set<string>>(new Set());
  const isSyncing = useRef(false);

  const userId = session?.user?.id;

  // Collect all current task IDs from days
  const getAllTaskIds = useCallback((d: Record<string, DayData>): Set<string> => {
    const ids = new Set<string>();
    for (const day of Object.values(d)) {
      for (const task of day.tasks) {
        ids.add(task.id);
      }
    }
    return ids;
  }, []);

  // === PULL from Supabase ===
  const pull = useCallback(async () => {
    if (!userId) return;

    const [tasksRes, highlightsRes, daysRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('highlights').select('*').eq('user_id', userId),
      supabase.from('days').select('*').eq('user_id', userId),
    ]);

    if (tasksRes.error) throw tasksRes.error;
    if (highlightsRes.error) throw highlightsRes.error;
    if (daysRes.error) throw daysRes.error;

    const remoteTasks = tasksRes.data as TaskRow[];
    const remoteHighlights = highlightsRes.data as HighlightRow[];
    const remoteDays = daysRes.data as DayRow[];

    // Merge with current localStorage state
    setDays((currentDays) => {
      const merged = mergeDays(currentDays, remoteTasks, remoteDays);
      // Update tracked IDs after merge
      lastPushedTaskIds.current = getAllTaskIds(merged);
      return merged;
    });

    setHighlights((currentHighlights) => {
      const merged = mergeHighlights(currentHighlights, remoteHighlights);
      lastPushedHighlightKeys.current = new Set(Object.keys(merged));
      return merged;
    });
  }, [userId, setDays, setHighlights, getAllTaskIds]);

  // === PUSH to Supabase ===
  const push = useCallback(async () => {
    if (!userId || !syncReady.current) return;

    const currentTaskIds = getAllTaskIds(days);
    const currentHighlightKeys = new Set(Object.keys(highlights));

    // Find deleted task IDs (were in last push, now gone)
    const deletedTaskIds: string[] = [];
    for (const id of lastPushedTaskIds.current) {
      if (!currentTaskIds.has(id)) {
        deletedTaskIds.push(id);
      }
    }

    // Find deleted highlight keys
    const deletedHighlightKeys: string[] = [];
    for (const key of lastPushedHighlightKeys.current) {
      if (!currentHighlightKeys.has(key)) {
        deletedHighlightKeys.push(key);
      }
    }

    // Build task rows to upsert
    const taskRows: TaskRow[] = [];
    const dayRows: DayRow[] = [];

    for (const [dateKey, day] of Object.entries(days)) {
      dayRows.push(dayToRow(day, userId));
      for (const task of day.tasks) {
        taskRows.push(taskToRow(task, dateKey, userId));
      }
    }

    // Build highlight rows to upsert
    const highlightRows: HighlightRow[] = [];
    for (const [key, hl] of Object.entries(highlights)) {
      highlightRows.push(highlightToRow(hl, key, userId));
    }

    // Execute upserts in parallel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops: PromiseLike<any>[] = [];

    if (taskRows.length > 0) {
      // Batch in chunks of 500
      for (let i = 0; i < taskRows.length; i += 500) {
        const chunk = taskRows.slice(i, i + 500);
        ops.push(supabase.from('tasks').upsert(chunk, { onConflict: 'id' }).select());
      }
    }

    if (dayRows.length > 0) {
      ops.push(supabase.from('days').upsert(dayRows, { onConflict: 'id' }).select());
    }

    if (highlightRows.length > 0) {
      ops.push(
        supabase.from('highlights').upsert(highlightRows, { onConflict: 'user_id,key' }).select(),
      );
    }

    // Soft-delete removed tasks
    if (deletedTaskIds.length > 0) {
      ops.push(
        supabase
          .from('tasks')
          .update({ deleted: true, updated_at: new Date().toISOString() })
          .in('id', deletedTaskIds)
          .eq('user_id', userId)
          .select(),
      );
    }

    // Soft-delete removed highlights
    if (deletedHighlightKeys.length > 0) {
      ops.push(
        supabase
          .from('highlights')
          .update({ deleted: true, updated_at: new Date().toISOString() })
          .in('key', deletedHighlightKeys)
          .eq('user_id', userId)
          .select(),
      );
    }

    await Promise.all(ops);

    // Update tracked state
    lastPushedTaskIds.current = currentTaskIds;
    lastPushedHighlightKeys.current = currentHighlightKeys;
  }, [userId, days, highlights, getAllTaskIds]);

  // === Full sync cycle ===
  const sync = useCallback(async () => {
    if (!userId || isSyncing.current) return;
    isSyncing.current = true;
    setSyncStatus('syncing');

    try {
      await pull();
      syncReady.current = true;
      await push();
      setSyncStatus('idle');
    } catch (err) {
      console.error('[sync] error:', err);
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
    } finally {
      isSyncing.current = false;
    }
  }, [userId, pull, push]);

  // === Initial sync on auth ===
  useEffect(() => {
    if (!session) {
      syncReady.current = false;
      return;
    }
    sync();
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // === Debounced push on data change ===
  useEffect(() => {
    if (!syncReady.current || !userId) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      setSyncStatus('syncing');
      try {
        await push();
        setSyncStatus('idle');
      } catch (err) {
        console.error('[sync] push error:', err);
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
      } finally {
        isSyncing.current = false;
      }
    }, 500);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [days, highlights, userId, push]);

  // === Sync on reconnect / tab focus ===
  useEffect(() => {
    if (!session) return;

    const handleOnline = () => sync();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [session, sync]);

  return { syncStatus };
}
