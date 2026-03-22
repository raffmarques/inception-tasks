import type { Task, Highlight, DayData } from '../types';

// === Supabase row types ===

export interface TaskRow {
  id: string;
  user_id: string;
  content: string;
  status: string;
  created_date: string;
  scheduled_date: string | null;
  migrated_to: string | null;
  parent_id: string | null;
  order: number;
  day_date: string;
  updated_at: string;
  deleted: boolean;
  planned_start: string | null;
  planned_end: string | null;
  deadline: string | null;
  description: string | null;
  category: string | null;
  time_estimate: number | null;
}

export interface HighlightRow {
  id: string;
  user_id: string;
  key: string;
  content: string;
  level: string;
  date: string;
  task_id: string | null;
  reflection_rating: string | null;
  reflection_note: string | null;
  updated_at: string;
  deleted: boolean;
}

export interface DayRow {
  id: string;
  user_id: string;
  date: string;
  migration_complete: boolean;
  updated_at: string;
}

// === Local → Supabase ===

export function taskToRow(task: Task, dayDate: string, userId: string): TaskRow {
  return {
    id: task.id,
    user_id: userId,
    content: task.content,
    status: task.status,
    created_date: task.createdDate,
    scheduled_date: task.scheduledDate ?? null,
    migrated_to: task.migratedTo ?? null,
    parent_id: task.parentId ?? null,
    order: task.order,
    day_date: dayDate,
    updated_at: task.updatedAt ?? new Date(0).toISOString(),
    deleted: false,
    planned_start: task.plannedStart ?? null,
    planned_end: task.plannedEnd ?? null,
    deadline: task.deadline ?? null,
    description: task.description ?? null,
    category: task.category ?? null,
    time_estimate: task.timeEstimate ?? null,
  };
}

export function highlightToRow(
  highlight: Highlight,
  key: string,
  userId: string,
): HighlightRow {
  return {
    id: highlight.id,
    user_id: userId,
    key,
    content: highlight.content,
    level: highlight.level,
    date: highlight.date,
    task_id: highlight.taskId ?? null,
    reflection_rating: highlight.reflection?.rating ?? null,
    reflection_note: highlight.reflection?.note ?? null,
    updated_at: highlight.updatedAt ?? new Date(0).toISOString(),
    deleted: false,
  };
}

export function dayToRow(day: DayData, userId: string): DayRow {
  return {
    id: day.date,
    user_id: userId,
    date: day.date,
    migration_complete: day.migrationComplete,
    updated_at: day.updatedAt ?? new Date(0).toISOString(),
  };
}

// === Supabase → Local ===

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    content: row.content,
    status: row.status as Task['status'],
    createdDate: row.created_date,
    scheduledDate: row.scheduled_date ?? undefined,
    migratedTo: row.migrated_to ?? undefined,
    parentId: row.parent_id ?? undefined,
    order: row.order,
    updatedAt: row.updated_at,
    plannedStart: row.planned_start ?? undefined,
    plannedEnd: row.planned_end ?? undefined,
    deadline: row.deadline ?? undefined,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    timeEstimate: row.time_estimate ?? undefined,
  };
}

function rowToHighlight(row: HighlightRow): { key: string; highlight: Highlight } {
  return {
    key: row.key,
    highlight: {
      id: row.id,
      content: row.content,
      level: row.level as Highlight['level'],
      date: row.date,
      taskId: row.task_id ?? undefined,
      reflection:
        row.reflection_rating
          ? {
              rating: row.reflection_rating as 'good' | 'okay' | 'missed',
              note: row.reflection_note ?? undefined,
            }
          : undefined,
      updatedAt: row.updated_at,
    },
  };
}

// === Merge helpers ===

const epoch = new Date(0).toISOString();

function newer(a?: string, b?: string): 'a' | 'b' {
  return (a ?? epoch) >= (b ?? epoch) ? 'a' : 'b';
}

/**
 * Merge local days with remote task/day rows.
 * Last-write-wins per task and per day metadata.
 */
export function mergeDays(
  local: Record<string, DayData>,
  remoteTasks: TaskRow[],
  remoteDays: DayRow[],
): Record<string, DayData> {
  const merged = { ...local };

  // Build map of remote tasks grouped by day
  const remoteTasksByDay = new Map<string, TaskRow[]>();
  for (const row of remoteTasks) {
    const arr = remoteTasksByDay.get(row.day_date) ?? [];
    arr.push(row);
    remoteTasksByDay.set(row.day_date, arr);
  }

  // Merge day metadata
  for (const dayRow of remoteDays) {
    const localDay = merged[dayRow.date];
    if (!localDay) {
      merged[dayRow.date] = {
        date: dayRow.date,
        tasks: [],
        migrationComplete: dayRow.migration_complete,
        updatedAt: dayRow.updated_at,
      };
    } else if (newer(dayRow.updated_at, localDay.updatedAt) === 'a') {
      merged[dayRow.date] = {
        ...localDay,
        migrationComplete: dayRow.migration_complete,
        updatedAt: dayRow.updated_at,
      };
    }
  }

  // Merge tasks
  for (const [dayDate, rows] of remoteTasksByDay) {
    if (!merged[dayDate]) {
      merged[dayDate] = { date: dayDate, tasks: [], migrationComplete: false };
    }
    const day = merged[dayDate];
    const localTaskMap = new Map(day.tasks.map((t) => [t.id, t]));

    for (const row of rows) {
      if (row.deleted) {
        // Remote says deleted — remove locally
        localTaskMap.delete(row.id);
        continue;
      }
      const localTask = localTaskMap.get(row.id);
      if (!localTask || newer(row.updated_at, localTask.updatedAt) === 'a') {
        localTaskMap.set(row.id, rowToTask(row));
      }
    }

    merged[dayDate] = {
      ...day,
      tasks: Array.from(localTaskMap.values()).sort((a, b) => a.order - b.order),
    };
  }

  return merged;
}

/**
 * Merge local highlights with remote highlight rows.
 */
export function mergeHighlights(
  local: Record<string, Highlight>,
  remoteRows: HighlightRow[],
): Record<string, Highlight> {
  const merged = { ...local };

  for (const row of remoteRows) {
    if (row.deleted) {
      delete merged[row.key];
      continue;
    }
    const localHL = merged[row.key];
    if (!localHL || newer(row.updated_at, localHL.updatedAt) === 'a') {
      const { key, highlight } = rowToHighlight(row);
      merged[key] = highlight;
    }
  }

  return merged;
}
