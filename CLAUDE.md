# bujo — Bullet Journal Daily Highlight Task Manager

## Maintenance Instructions
**Always update this file when a substantial or relevant change happens** — including changes to architecture, new features, removed features, new dependencies, data model changes, deployment setup, or environment variables. Keep it accurate and up to date at all times.

## Project Overview
A PWA bullet journal task manager built with React + TypeScript + Vite. Designed for mobile-first use. Requires authentication (Supabase) when configured. Data is stored in **both localStorage (offline cache) and Supabase (cloud sync)**. The app works without Supabase configured (localStorage-only mode, no login required).

## Tech Stack
- **Framework**: React 19 + TypeScript
- **Build**: Vite 7 with vite-plugin-pwa
- **Icons**: FontAwesome (free-solid-svg-icons via @fortawesome/react-fontawesome)
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Dates**: date-fns
- **IDs**: uuid v13
- **Auth & DB**: Supabase (optional — app degrades gracefully without it)
- **Google Calendar**: OAuth2 via Supabase Edge Function (`google-calendar`)

## Environment Variables
| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Optional | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Optional | Supabase anonymous key |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID for calendar integration |

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set, the app runs in **localStorage-only mode** (no login screen, no sync).

## Commands
- `npm run dev` — Start dev server (localhost:5173)
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint
- `npm run preview` — Preview production build locally

## Architecture

### Data Persistence
- **localStorage** — Primary offline store. Used for all state (tasks, highlights, day org, lists).
- **Supabase** — Cloud sync layer. On login, pulls remote data and merges with localStorage. Pushes changes debounced every 500ms. Data is per-user (not per-URL).
- **Sync hook** (`useSync`) — Handles pull/push cycle, soft-deletes, and reconnect/tab-focus re-sync.

### localStorage Keys
| Key | Hook | Contents |
|---|---|---|
| `bujo-days` | `useTasks` | `Record<string, DayData>` keyed by `YYYY-MM-DD` (day tasks) or period keys like `2026-W12`, `2026-03`, `2026-Q1`, `2026` (period-pinned tasks) |
| `bujo-highlights` | `useHighlights` | `Record<string, Highlight>` keyed by `${level}-${date}` |
| `bujo-day-org` | `useDayOrganization` | `Record<string, DayOrgData>` — per-day planning mode |
| `bujo-lists` | `useLists` | `BujoList[]` — named lists with items |

### State Management
All state lives in custom hooks using `useLocalStorage`:
- **`useTasks`** — Task CRUD, status cycling, migration, reordering, date moving.
- **`useHighlights`** — Highlights at day/week/month/year level. Includes reflection rating.
- **`useNavigation`** — Current date, zoom level, and view mode (focus/flow).
- **`useAuth`** — Supabase session, sign in/up/out. Exposes `supabaseConfigured` flag.
- **`useSync`** — Syncs localStorage ↔ Supabase when session is active.
- **`useDayOrganization`** — Per-day planning modes: manual, time-effort, time-boxing.
- **`useLists`** — Named reference lists with drag-to-day support.
- **`useGoogleCalendar`** — Google Calendar OAuth + event fetching via Supabase Edge Function.

### Key Data Types (src/types/index.ts)
- **Task**: `{ id, content, status, createdDate, scheduledDate?, migratedTo?, parentId?, order, plannedStart?, plannedEnd?, deadline?, description?, category?, timeEstimate?, subtasks?, attachments?, updatedAt? }`
- **TaskStatus**: `'open' | 'completed' | 'migrated' | 'scheduled' | 'cancelled'`
- **Highlight**: `{ id, content, level, date, taskId?, reflection?: { rating, note? }, updatedAt? }`
- **DayData**: `{ date, tasks[], highlight?, migrationComplete, updatedAt? }`
- **DayOrgMode**: `'manual' | 'time-effort' | 'time-boxing'`
- **BujoList**: `{ id, name, items: ListItem[], createdAt }`
- **ZoomLevel**: `'day' | 'week' | 'month' | 'quarter' | 'year'`
- **ViewMode**: `'focus' | 'flow'`

### Component Structure
```
App.tsx — Root, wires all hooks, handles auth gate, migration check, drag context
├── Layout/ — Header: date nav, zoom controls, sync status, sign out, gcal, lists toggle
├── Auth/
│   └── LoginPage — Sign in / sign up form (shown when Supabase is configured + no session)
├── DayView/ — Main daily view
│   ├── ModeSelector — Switch between manual / time-effort / time-boxing modes
│   ├── TimeEffortView — Session time slider + ordered task list
│   ├── TimeBoxingView — Morning / afternoon / night buckets
│   ├── TimeEstimatePrompt — Prompt to set time estimates on tasks
│   └── SortableTaskItem — Sortable wrapper for drag-and-drop
├── TaskItem/ — Individual task with signifier, actions, drag handle
│   └── DateRangePopover — Inline date range picker popover
├── Highlight/ — Daily highlight (droppable target for drag-and-drop)
├── ZoomNav/ — Zoom level navigation controls
├── WeekView/ — Weekly view: vertical day list + week tasks panel (nested DndContext)
├── MonthView/ — Monthly calendar view (vertical day list with tasks inline)
├── QuarterView/ — Quarterly view: week rows grouped by month (left) + quarter tasks panel (right)
├── YearView/ — Year view: month rows grouped by quarter (left) + year tasks panel (right)
│   └── YearGrid — (unused) original table-based year overview, preserved for future Year Map feature
├── CalendarEvents/ — Google Calendar events display in DayView
├── Lists/ — ListsPanel (slide-over) + DayDropZone for dragging list items to days
├── TaskDetail/ — Full task detail overlay (edit description, category, dates, subtasks, attachments)
├── DesignSystem/ — Living design system reference (accessible at /#/design-system, no auth required)
└── MigrationFlow/ — Daily migration overlay (yesterday's open tasks + reflection)
```

### Key Patterns
- **Bullet journal signifiers**: ○ open, ● completed, › migrated, ‹ scheduled, × cancelled
- **Status cycling**: open → completed → cancelled → open (via signifier click only — task content click opens TaskDetail)
- **Period-pinning**: Tasks can be pinned to a period (week/month/quarter/year) rather than a specific day. These live in `days[periodKey]` (e.g., `days['2026-W12']`). Each zoom level has a right-panel showing period-pinned tasks.
- **Migration**: On app open, if yesterday has open tasks or a highlight, shows migration flow overlay
- **Highlights**: Independent from tasks but can link via `taskId`. Exist at day/week/month/year levels. Support reflection rating (good/okay/missed).
- **Drag-and-drop**: Open tasks are sortable (grip handle). Dragging onto highlight zone sets it as day's highlight. List items can be dragged to day drop zones. Uses @dnd-kit with TouchSensor for mobile.
- **Date editing**: Calendar icon on tasks opens native date picker to move task to another date (`moveTask` in useTasks).
- **Day organization modes**: Each day can have its own planning mode — manual (default), time-effort (session slider + ordered tasks), or time-boxing (morning/afternoon/night buckets).
- **Task detail**: Full overlay with description, category (with autocomplete), planned date range, deadline, time estimate, subtasks checklist, and file attachments (base64).
- **Auth gate**: If Supabase is configured, app shows LoginPage until authenticated. If not configured, app runs freely.
- **Sync status**: Layout header shows live sync status (idle/syncing/error/offline).
- **Google Calendar**: Optional integration. Connects via OAuth popup → Supabase Edge Function exchanges code for tokens. Shows events alongside tasks in DayView.

### Date Format Conventions
- Day keys: `YYYY-MM-DD` (e.g., `2026-03-02`)
- Week keys: `YYYY-Www` (e.g., `2026-W10`)
- Month keys: `YYYY-MM` (e.g., `2026-03`)
- Quarter keys: `YYYY-Qq` (e.g., `2026-Q1`)
- Year keys: `YYYY` (e.g., `2026`)
- All date utilities in `src/utils/dates.ts`

## Supabase Schema
Tables (in `supabase/migrations/`):
- **`tasks`** — task rows with `user_id`, soft-delete via `deleted` flag
- **`highlights`** — highlight rows with `user_id`, unique on `(user_id, key)`
- **`days`** — day metadata rows with `user_id`
- **`google_tokens`** — stores OAuth tokens for Google Calendar per user

Edge Functions (`supabase/functions/`):
- **`google-calendar`** — handles `exchange` (OAuth code → tokens), `events` (fetch calendar events), `disconnect` actions

## Deployment
- **Vercel** (automatic deploys via GitHub integration)
- CI workflow (`.github/workflows/deploy.yml`) runs build check on every push
- **Production URL**: `https://inception-tasks.vercel.app` (branch: `main`)
- **Preview URL**: `https://inception-tasks-git-dev-raffaaa.vercel.app` (branch: `dev`)
- **GitHub repo**: `raffmarques/inception-tasks`
- Environment variables are set in Vercel dashboard per environment

## Style Conventions
- CSS uses BEM naming: `.component__element--modifier`
- CSS variables defined in `src/index.css` (colors, spacing, font sizes)
- Minimal, paper-like aesthetic with warm tones
- Font: JetBrains Mono (body/monospace) + Lora (display/headings)
- Design tokens: cream/ink/copper/sage palette (`--color-cream`, `--color-ink`, `--color-copper`, `--color-sage`)
