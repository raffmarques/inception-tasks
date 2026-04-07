# YearMap: Drag-to-Create Events + Pinch/Scroll Zoom

**Date:** 2026-04-07
**Status:** Approved

## Problem

The Year Map's event creation UX is broken — the sidebar form (`AddEntryForm`) requires manually typing date strings and doesn't work reliably. The grid is also too small by default with no way to resize it.

## Solution

Two targeted improvements to `YearMap.tsx` and `YearMap.css`:

1. **Drag-to-create** on the month day rows
2. **Zoom** via CSS custom properties, driven by ctrl/cmd+scroll, trackpad pinch, and ±buttons

---

## Feature 1: Drag-to-Create

### Interaction

1. User mousedowns on a day cell in any month row
2. Drags horizontally across days (green highlight follows)
3. On mouseup: a small floating dark panel appears near the end cell
4. Panel contains:
   - Date range label (e.g. `Apr 3 → Apr 9`)
   - Text input for event name (auto-focused)
   - Calendar selector dropdown (all visible calendars)
   - Hint: `↵ confirm · esc cancel`
5. Press Enter → event created, panel closes, table re-renders
6. Press Escape or click outside → cancel, highlight clears

### Constraints

- Drag is **horizontal only within a single month row**. Cross-month drag is not supported (the month row is the natural boundary in the table layout).
- Only day cells (`yearmap__day`) are drag targets — not block rows or separators.
- If no calendars exist, dragging does nothing (panel won't open with empty calendar list). Default-selected calendar in the dropdown is the first calendar in the list at panel-open time.
- `user-select: none` applied to the table (via a CSS class toggled on drag start/end) to prevent text selection during the drag gesture.
- If user drags to a single day, start === end → single-day event.

### State

```ts
type DragState = { monthIdx: number; startDay: number; endDay: number } | null;
// lo/hi are canonical; ISO dates derived on confirm to avoid dual source-of-truth
type PendingEntry = { monthIdx: number; lo: number; hi: number; anchorRect: DOMRect } | null;
```

Both live as `useState` in `YearMap`. No changes to `useYearMap` hook or data types.

### Implementation

- Attach `onMouseDown` / `onMouseEnter` directly to `<td>` day cells via inline handlers (consistent with existing pattern).
- `onMouseUp` on `document` (via `useEffect` cleanup) to handle mouseup outside the table. Use `mouseup` (not pointer events) for simplicity; the YearMap is not rendered inside a dnd-kit DndContext so no conflict arises.
- Inline input panel: `position: fixed` div rendered at the top of the React tree (inside `.yearmap` root but visually escaped via fixed positioning), positioned via `getBoundingClientRect()` of the last highlighted cell. Must be `fixed` (not `absolute`) to avoid clipping by the scroll container.
- Remove `AddEntryForm` component and its "add block" button from the sidebar — replaced entirely by drag-to-create.

---

## Feature 2: Zoom

### CSS Custom Properties

Replace hardcoded pixel values in `YearMap.css` with three CSS custom properties set on `.yearmap`:

| Property | Default | Description |
|---|---|---|
| `--ym-cell` | `28px` | Day column width + month row height |
| `--ym-block` | `20px` | Entry block row height |
| `--ym-label` | `48px` | Month label column width |

Seven zoom levels (index 0–6):

| Level | `--ym-cell` | `--ym-block` | `--ym-label` |
|---|---|---|---|
| 0 | 16px | 12px | 36px |
| 1 | 20px | 14px | 40px |
| 2 | 24px | 16px | 44px |
| **3 (default)** | **28px** | **20px** | **48px** |
| 4 | 34px | 22px | 56px |
| 5 | 42px | 26px | 64px |
| 6 | 52px | 32px | 80px |

### Triggers

- **ctrl/cmd + scroll wheel**: delta accumulator, threshold 150 units (~20% less sensitive than standard 120-unit notch). Zoom in on negative delta, out on positive.
- **Trackpad pinch**: same wheel event with `ctrlKey`, same accumulator.
- **± buttons**: in the header bar above the grid, step ±1 per click.

### Sensitivity

```ts
let wheelAccum = 0;
const ZOOM_THRESHOLD = 150; // vs standard ~120 = ~20% reduction

function onWheel(e: WheelEvent) {
  if (!e.ctrlKey && !e.metaKey) return;
  e.preventDefault();
  wheelAccum += e.deltaY;
  if (Math.abs(wheelAccum) >= ZOOM_THRESHOLD) {
    adjustZoom(wheelAccum < 0 ? 1 : -1);
    wheelAccum = 0;
  }
}
```

Accumulator resets after each zoom step, preventing runaway jumps.

### Zoom state

`zoomLevel: number` (0–6) as `useState` in `YearMap`, default 3. Applied as inline style on the `.yearmap` wrapper div.

---

## Changes Summary

### `YearMap.tsx`
- Add `zoomLevel` state + `adjustZoom` helper
- Add `wheelAccum` ref for sensitivity accumulator
- Add `useEffect` for `wheel` listener on scroll container (passive: false) and `mouseup` on document
- Add `dragState` + `pendingEntry` state
- Attach `onMouseDown`/`onMouseEnter` to day `<td>` cells
- Add inline entry panel (floating dark div) rendered conditionally
- Remove `AddEntryForm` component
- Remove "add block" button from sidebar

### `YearMap.css`
- Replace hardcoded cell/block/label sizes with CSS custom properties. `--ym-cell` drives day column width and month row height. `--ym-block` drives the block row `<td>` height (currently `20px`) — the inner fill uses `calc(var(--ym-block) - 4px)`. `--ym-label` must be applied to both the `<th>` sticky header and the `<td>` sticky month label column.
- Add `.yearmap--dragging` class (applied to table during drag) setting `user-select: none`
- Add `.yearmap__day--draft` style (green highlight during drag)
- Add `.yearmap__inline-panel` styles for the floating input

### No changes needed
- `useYearMap.ts` — data model and CRUD methods unchanged
- `types/index.ts` — no new types
- `App.tsx` — YearMap props unchanged
