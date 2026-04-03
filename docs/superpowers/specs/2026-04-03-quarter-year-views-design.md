# Quarter View + Year View Redesign

**Date:** 2026-04-03
**Status:** Approved

---

## Overview

Add a Quarter View and redesign the Year View to follow the same two-column layout pattern used by Week View and Month View.

---

## Quarter View

### Left column — weeks list

Weeks are the rows, grouped by month (January / February / March headers). Each week row shows:

- **Week label** (W9), **date range** (Mar 9–15)
- **Tasks**: behaviour differs by time position:
  - **Past weeks** — all tasks that were completed/actioned during that week (status: completed, migrated, cancelled)
  - **Current week** — all tasks currently scheduled for the week (day-specific or week-pinned, any status)
  - **Future weeks** — all tasks scheduled for the week (day-specific or week-pinned, open/scheduled)
- **Date badge** — tasks with a specific day get a small inline badge (e.g. `Mar 14`) after the task text. Past date badges are muted grey; upcoming are copper.
- **Week highlight** — if the week has a highlight set, it appears as a short italic label at the end of the row, with a left border accent.

**Current week styling:** warm background (`#fef6ec`) + copper left inset border. Clearly distinct but not loud.

### Right column — quarter tasks panel

- Header: `Q1 2026` (or current quarter key)
- Lists quarter-pinned tasks with bullet signifiers (○ / ●)
- `+ add quarter task` at the bottom

### Quarter highlight

Copper left-bordered block at the top of the left column, same as Week/Month views.

### Data sources

- Week rows pull from `days[weekKey]` (e.g. `days['2026-W09']`) for week-pinned tasks, **plus** day-specific tasks by iterating each day in the week range from `days[dateKey]`. Both past and current/future weeks aggregate across both sources.
- Quarter tasks from `days[quarterKey]` (e.g. `days['2026-Q1']`)
- Quarter highlight from `highlights['quarter-2026-Q1']` (key format: `${level}-${date}` → `quarter-2026-Q1`, confirmed against `toQuarterKey` in `src/utils/dates.ts`)

---

## Year View

Renamed from the current grid-based Year View. The table grid is **preserved as-is** — it becomes an additional view accessible from within the year zoom level (details TBD, out of scope for now).

### Left column — months list

12 months grouped by quarter (Q1 / Q2 / Q3 / Q4 section headers). Each month row shows:

- **Month label** (January, February…)
- **Tasks**: same past/future logic as Quarter View but at month granularity:
  - **Past months** — completed/actioned tasks from `days[monthKey]`
  - **Current month** — all tasks from `days[monthKey]` (any status)
  - **Future months** — open/scheduled tasks from `days[monthKey]`
- **Month note** — the month highlight content (`highlights['month-2026-03']`), displayed as short italic text at the end of the row with a left border accent. Current month note is copper. No new data field needed.
- Empty months show a `—` placeholder.

**Current month styling:** same warm background + copper left inset border as Quarter View's current week.

### Right column — year tasks panel

- Header: `2026` (current year)
- Lists year-pinned tasks with bullet signifiers
- `+ add year task` at the bottom

### Year highlight

Copper left-bordered block at the top, same pattern as all other views.

### Data sources

- Month rows show only **month-pinned tasks** from `days[monthKey]` (e.g. `days['2026-03']`). Unlike Quarter View's week rows, they do not aggregate individual day tasks — the year level is intentionally high-level.
- Year tasks from `days[yearKey]` (e.g. `days['2026']`)
- Year highlight from `highlights['year-2026']`

---

## What stays the same

- The existing `YearView` table grid component is **not deleted** — it may be repurposed or toggled later (Year Map feature, noted for future)
- All existing data keys and hook interfaces remain unchanged
- The zoom level stays `'year'`; the new layout component lives at `src/components/YearView/YearView.tsx` (replacing the current file). The old table grid is extracted to `src/components/YearView/YearGrid.tsx` and kept but not rendered for now.
- New component: `src/components/QuarterView/QuarterView.tsx` + `QuarterView.css`, following the same directory convention as WeekView and MonthView.

---

## Future / out of scope

- **Year Map** (calendar group blocks): multi-calendar layer system with named groups and toggle — noted, not in this spec
- Clicking a month row to navigate to Month View (can be added trivially post-implementation)
- Clicking a week row to navigate to Week View

