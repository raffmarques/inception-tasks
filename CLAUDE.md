# bujo — Bullet Journal Daily Highlight Task Manager

## Project Overview
A PWA bullet journal task manager built with React + TypeScript + Vite. Designed for mobile-first use on Android (installable via PWA). Uses localStorage for all data persistence — no backend.

## Tech Stack
- **Framework**: React 19 + TypeScript
- **Build**: Vite 7 with vite-plugin-pwa
- **Icons**: FontAwesome (free-solid-svg-icons via @fortawesome/react-fontawesome)
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Dates**: date-fns
- **IDs**: uuid v13

## Commands
- `npm run dev` — Start dev server (localhost:5173)
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint
- `npm run preview` — Preview production build locally

## Architecture

### State Management
All state lives in custom hooks using `useLocalStorage`:
- **`useTasks`** — Tasks stored in localStorage key `bujo-days` as `Record<string, DayData>`. Each day has an array of tasks with an `order` field for sorting.
- **`useHighlights`** — Highlights stored in localStorage key `bujo-highlights` as `Record<string, Highlight>` keyed by `${level}-${date}` (e.g., `day-2026-03-02`).
- **`useNavigation`** — Current date and zoom level (day/week/month).

### Key Data Types (src/types/index.ts)
- **Task**: `{ id, content, status, createdDate, scheduledDate?, migratedTo?, order }`
- **TaskStatus**: `'open' | 'completed' | 'migrated' | 'scheduled' | 'cancelled'`
- **Highlight**: `{ id, content, level, date, taskId?, reflection? }`
- **DayData**: `{ date, tasks[], migrationComplete }`

### Component Structure
```
App.tsx — Root, wires hooks to views (wrapped in outer DndContext for Lists drag)
├── Layout/ — Header with date nav and zoom controls
├── DayView/ — Main daily view
│   ├── Highlight — Daily highlight (droppable target for drag-and-drop)
│   ├── SortableTaskItem — Sortable wrapper for drag-and-drop
│   └── TaskItem — Individual task with signifier, actions, drag handle
├── WeekView/ — Weekly view: vertical day list + week tasks panel (nested DndContext)
├── MonthView/ — Monthly calendar view (vertical day list with tasks inline)
├── YearView/ — Year overview
├── FlowView/ — Alternative flow/stream view
├── Lists/ — ListsPanel (slide-over) + DayDropZone for dragging list items to days
├── TaskDetail/ — Task detail overlay
└── MigrationFlow/ — Daily migration overlay (yesterday's open tasks)
```

### Key Patterns
- **Bullet journal signifiers**: ○ open, ● completed, › migrated, ‹ scheduled, × cancelled
- **Status cycling**: open → completed → cancelled → open (via signifier click)
- **Migration**: On app open, if yesterday has open tasks, shows migration flow overlay
- **Highlights**: Independent from tasks but can link via `taskId`. Exist at day/week/month levels.
- **Drag-and-drop**: Open tasks are sortable (grip handle). Dragging onto highlight zone sets it as day's highlight. Uses @dnd-kit with TouchSensor (200ms delay) for mobile.
- **Date editing**: Calendar icon on tasks opens native date picker to move task to another date (`moveTask` in useTasks).
- **Mobile touch support**: Action buttons use `@media (hover: none)` to stay visible on touch devices.

### Date Format Conventions
- Day keys: `YYYY-MM-DD` (e.g., `2026-03-02`)
- Week keys: `YYYY-Www` (e.g., `2026-W10`)
- Month keys: `YYYY-MM` (e.g., `2026-03`)
- All date utilities in `src/utils/dates.ts`

## Deployment
- **Vercel** (automatic deploys via GitHub integration)
- CI workflow (`.github/workflows/deploy.yml`) runs build check on every push
- Live URL: `https://personal-task-manager-black.vercel.app`
- GitHub repo: `raffmarques/personal-task-manager`

## Style Conventions
- CSS uses BEM naming: `.component__element--modifier`
- CSS variables defined in `src/index.css` (colors, spacing, font sizes)
- Minimal, paper-like aesthetic with warm tones
- Font: IBM Plex Mono (headings) + Inter (body)
