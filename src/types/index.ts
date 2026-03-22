export type TaskStatus = 'open' | 'completed' | 'migrated' | 'scheduled' | 'cancelled';

export type ZoomLevel = 'day' | 'week' | 'month' | 'quarter' | 'year';

export type ViewMode = 'focus' | 'flow';

export type ReflectionRating = 'good' | 'okay' | 'missed';

export interface SubTask {
  id: string;
  content: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;              // MIME type
  data: string;              // base64 data URL
  size: number;              // bytes
}

export interface Task {
  id: string;
  content: string;
  status: TaskStatus;
  createdDate: string;       // YYYY-MM-DD
  scheduledDate?: string;    // YYYY-MM-DD — for scheduled tasks
  migratedTo?: string;       // YYYY-MM-DD — where it was migrated to
  parentId?: string;         // for sub-tasks / nesting
  order: number;             // sort order within a day
  plannedStart?: string;     // YYYY-MM-DD — start of planned date range
  plannedEnd?: string;       // YYYY-MM-DD — end of planned date range (omit for single day)
  deadline?: string;         // YYYY-MM-DD — hard deadline
  description?: string;      // long-form notes / description
  category?: string;         // tag / category label
  timeEstimate?: number;     // estimated minutes
  subtasks?: SubTask[];      // checklist sub-items
  attachments?: Attachment[];
  updatedAt?: string;        // ISO timestamp for sync
}

export interface Highlight {
  id: string;
  content: string;
  level: ZoomLevel;
  date: string;              // YYYY-MM-DD for day, YYYY-Www for week, YYYY-MM for month, etc.
  taskId?: string;           // linked task id (if highlight came from a task)
  reflection?: {
    rating: ReflectionRating;
    note?: string;
  };
  updatedAt?: string;        // ISO timestamp for sync
}

export interface DayData {
  date: string;              // YYYY-MM-DD
  tasks: Task[];
  highlight?: Highlight;
  migrationComplete: boolean;
  updatedAt?: string;        // ISO timestamp for sync
}

export interface AppState {
  days: Record<string, DayData>;
  highlights: Record<string, Highlight>;  // keyed by `${level}-${date}`
  currentDate: string;
  currentZoom: ZoomLevel;
}

// === Day Organization Modes ===
export type DayOrgMode = 'manual' | 'time-effort' | 'time-boxing';
export type TimeBoxBucket = 'morning' | 'afternoon' | 'night';

export interface TimeEffortSession {
  totalMinutes: number;        // slider value
  taskIds: string[];           // ordered task IDs in session
}

export interface DayOrgData {
  mode: DayOrgMode;
  timeEffort?: TimeEffortSession;
  timeBoxing?: Record<string, TimeBoxBucket>; // taskId → bucket
}

// === Lists ===
export interface ListItem {
  id: string;
  content: string;
  order: number;
}

export interface BujoList {
  id: string;
  name: string;
  items: ListItem[];
  createdAt: string;
}

// Signifier map for rendering
export const SIGNIFIERS: Record<TaskStatus, string> = {
  open: '\u25CB',        // ○
  completed: '\u25CF',   // ●
  migrated: '\u203A',    // ›
  scheduled: '\u2039',   // ‹
  cancelled: '\u00D7',   // ×
};
