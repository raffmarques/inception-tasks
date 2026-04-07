# Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current IBM Plex Mono / Inter aesthetic with the approved "Typographer's Field Notes" design — warm cream ground, near-black ink, Lora serif + JetBrains Mono, copper accent, sage for completion.

**Architecture:** Primarily CSS, with targeted TSX changes in 5 components: `Layout.tsx` (header restructure + mobile nav), `TaskItem.tsx` (new signifier-cell grid), `DayView.tsx` (add-task row + DragOverlay), `Highlight.tsx` (add label div), and `TaskDetail.tsx` (class name align). All color tokens live in `index.css`. No new dependencies.

**Tech Stack:** React + TypeScript + Vite, CSS modules (BEM), Google Fonts (Lora + JetBrains Mono)

**Design reference:** `bujo-redesign-prototype.html` (root of repo) — open in browser alongside the app while implementing.

---

## Token Map (old → new)

| Old token | New value | Purpose |
|---|---|---|
| `--bg` | `#F6F1E7` (cream) | Page background |
| `--bg-elevated` | `#EDE7D6` (cream-mid) | Cards, inputs |
| `--bg-highlight` | `#F0DDD0` (copper-pale) | Highlight zone |
| `--border` | `#E0D8C4` (cream-dark) | Dividers |
| `--border-light` | `#EDE7D6` | Subtle dividers |
| `--text` | `#1A1612` (ink) | Primary text |
| `--text-muted` | `#7A6F65` (ink-faint) | Secondary text |
| `--text-faint` | `#B8AFA4` (ink-ghost) | Disabled / metadata |
| `--accent` | `#B85C28` (copper) | CTA, highlights, migration |
| `--accent-light` | `#F0DDD0` (copper-pale) | Accent backgrounds |
| `--success` | `#3D5246` (sage) | Completed tasks |
| `--font-mono` | `'JetBrains Mono', 'Courier New', monospace` | All task text, UI labels |
| `--font-display` | `'Lora', Georgia, serif` | New — headings, highlight content |

New tokens to add:
- `--ink-mid: #3A342D`
- `--copper-light: #D4784A`
- `--sage-light: #6E8B7C`
- `--sage-pale: #D6E4DE`

---

## File Map

| File | Change type | What changes |
|---|---|---|
| `index.html` | Modify | Swap IBM Plex Mono + Inter → Lora + JetBrains Mono font URLs; update theme-color |
| `src/index.css` | Modify | Replace all token values; add `--font-display`; add grain body texture |
| `src/components/Layout/Layout.css` | Modify | New header style: brand italic, 2px bottom border, zoom strip, date-row, mobile bottom nav |
| `src/components/Layout/Layout.tsx` | Modify | Add zoom-strip row in JSX; add mobile bottom-nav bar |
| `src/components/ZoomNav/ZoomNav.css` | Modify | Pill style — active = ink bg + cream text |
| `src/components/TaskItem/TaskItem.css` | Modify | Task row with 44px signifier column (left border), content hover → copper, status colors |
| `src/components/DayView/DayView.css` | Modify | Mode selector style, add-task row |
| `src/components/Highlight/Highlight.css` | Modify | Dashed copper border, copper-pale bg, Lora italic content |
| `src/components/FlowView/FlowView.css` | Modify | Column styles matching prototype: copper top-line on current, task hover |
| `src/components/FlowView/PeriodPeekSidebar.tsx` | No change | Already uses FlowView.css via `.peek-sidebar` |
| `src/components/MigrationFlow/MigrationFlow.css` | Modify | Modal: 2px ink border, 6px 6px shadow, Lora title, copper eyebrow |
| `src/components/TaskDetail/TaskDetail.css` | Modify | Right slide panel → bottom sheet on mobile; Lora italic title |
| `src/components/Auth/LoginPage.css` | Modify | Token refresh only (minimal — uses --bg, --accent etc) |
| `src/App.css` | Modify | Token refresh |

---

## Task 1 — Font Import + Token Foundation

**Files:**
- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Step 1.1: Update font import in index.html**

Replace the existing Google Fonts link with:
```html
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />
```
Also update `<meta name="theme-color" content="#F6F1E7" />`.

- [ ] **Step 1.2: Replace token block in `src/index.css`**

Replace the entire `:root { ... }` block with:
```css
:root {
  /* Palette */
  --cream:       #F6F1E7;
  --cream-mid:   #EDE7D6;
  --cream-dark:  #E0D8C4;
  --ink:         #1A1612;
  --ink-mid:     #3A342D;
  --ink-faint:   #7A6F65;
  --ink-ghost:   #B8AFA4;
  --copper:      #B85C28;
  --copper-light:#D4784A;
  --copper-pale: #F0DDD0;
  --sage:        #3D5246;
  --sage-light:  #6E8B7C;
  --sage-pale:   #D6E4DE;

  /* Semantic aliases — keep old names so component CSS doesn't break yet */
  --bg:              var(--cream);
  --bg-elevated:     var(--cream-mid);
  --bg-highlight:    var(--copper-pale);
  --border:          var(--cream-dark);
  --border-light:    var(--cream-mid);
  --text:            var(--ink);
  --text-muted:      var(--ink-faint);
  --text-faint:      var(--ink-ghost);
  --accent:          var(--copper);
  --accent-light:    var(--copper-pale);
  --danger:          #C0392B;
  --success:         var(--sage);

  /* Typography */
  --font-mono:    'JetBrains Mono', 'Courier New', monospace;
  --font-display: 'Lora', Georgia, serif;
  --font-sans:    var(--font-mono); /* no longer used separately */

  /* Scale */
  --fs-xs:   0.65rem;
  --fs-sm:   0.78rem;
  --fs-base: 0.88rem;
  --fs-lg:   1rem;
  --fs-xl:   1.25rem;
  --fs-2xl:  1.6rem;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  --radius:    3px;
  --radius-lg: 6px;

  --max-width: 600px;
}
```

- [ ] **Step 1.3: Add paper grain texture + font-smoothing to body**

In the `body { }` rule in `index.css`, add after the existing properties:
```css
body {
  /* existing... */
  -webkit-font-smoothing: antialiased;
  position: relative;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
  opacity: 0.35;
}
```

- [ ] **Step 1.4: Build check**
```bash
npm run build
```
Expected: exits 0. Token aliases mean no visual breakage yet — just font swap and color warmup.

- [ ] **Step 1.5: Commit**
```bash
git add index.html src/index.css
git commit -m "design: swap tokens to cream/ink/copper/sage palette, Lora + JetBrains Mono"
```

---

## Task 2 — Layout Header

The header needs a new look: `bujo` italic serif brand, 2px ink bottom border, zoom as scrollable pills below brand line, date nav row separated.

**Files:**
- Modify: `src/components/Layout/Layout.css`
- Modify: `src/components/Layout/Layout.tsx`
- Modify: `src/components/ZoomNav/ZoomNav.css`

- [ ] **Step 2.1: Replace `Layout.css` content**

Full replacement (keep the `.layout` base and `.layout--flow` but redo header/content):
```css
.layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.layout--flow { overflow: hidden; }

/* ── Header ── */
.layout__header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--cream);
  border-bottom: 2px solid var(--ink);
}

.layout__header--flow { /* no max-width constraint in flow */ }

.layout__top-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 20px 20px 14px;
  max-width: var(--max-width);
  margin: 0 auto;
  width: 100%;
}

.layout__brand {
  font-family: var(--font-display);
  font-size: 1rem;
  font-style: italic;
  font-weight: 400;
  color: var(--ink);
  letter-spacing: 0.01em;
}

.layout__date-sub {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--ink-faint);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-left: 10px;
}

.layout__top-left {
  display: flex;
  align-items: baseline;
  gap: 0;
}

.layout__top-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Zoom strip */
.layout__zoom-strip {
  display: flex;
  padding: 0 20px 0;
  border-bottom: 1px solid var(--cream-dark);
  max-width: var(--max-width);
  margin: 0 auto;
  width: 100%;
  overflow-x: auto;
}
.layout__zoom-strip::-webkit-scrollbar { display: none; }
.layout__header--flow .layout__zoom-strip { max-width: none; }

/* Mode toggle (focus/flow) */
.layout__mode-btn {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: var(--radius);
  color: var(--ink-ghost);
  border: 1px solid transparent;
  transition: all 0.12s;
}
.layout__mode-btn:hover {
  color: var(--ink);
  border-color: var(--cream-dark);
}
.layout__mode-btn--active {
  background: var(--ink);
  color: var(--cream);
  border-color: var(--ink);
}

/* Today button */
.layout__today-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 0.6rem;
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--copper);
  border: 1px solid var(--copper-light);
  border-radius: var(--radius);
  transition: all 0.12s;
}
.layout__today-btn:hover { background: var(--copper-pale); }

/* Sync dot */
.layout__sync { display: flex; align-items: center; cursor: default; }
.layout__sync-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  transition: background 0.3s;
}
.layout__sync--idle    .layout__sync-dot { background: var(--sage-light); }
.layout__sync--syncing .layout__sync-dot { background: var(--copper-light); animation: sync-pulse 1.2s ease-in-out infinite; }
.layout__sync--error   .layout__sync-dot { background: var(--danger); }
.layout__sync--offline .layout__sync-dot { background: var(--ink-ghost); }
@keyframes sync-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

/* Icon buttons (gcal, lists, signout) */
.layout__gcal-btn,
.layout__lists-btn,
.layout__signout-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius);
  color: var(--ink-ghost);
  border: 1px solid var(--cream-dark);
  transition: all 0.12s;
}
.layout__gcal-btn:hover,
.layout__lists-btn:hover,
.layout__signout-btn:hover {
  color: var(--ink);
  border-color: var(--ink-faint);
  background: var(--cream-mid);
}
.layout__gcal-btn--connected { color: #4285f4; border-color: #4285f4; }
.layout__gcal-btn--loading   { color: var(--ink-ghost); animation: sync-pulse 1s ease-in-out infinite; }
.layout__lists-btn--active   { color: var(--copper); border-color: var(--copper-light); }

/* Date nav row */
.layout__date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  max-width: var(--max-width);
  margin: 0 auto;
  width: 100%;
}
.layout__nav-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--cream-dark);
  border-radius: var(--radius);
  color: var(--ink-mid);
  transition: all 0.12s;
}
.layout__nav-btn:hover { border-color: var(--ink-faint); background: var(--cream-mid); }

.layout__date-title {
  font-family: var(--font-display);
  font-size: var(--fs-xl);
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--ink);
  text-align: center;
}

/* Content area */
.layout__content {
  flex: 1;
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-md);
  padding-bottom: var(--space-2xl);
}
.layout__content--flow {
  max-width: none;
  padding: 0;
  overflow: hidden;
}

/* Footer */
.layout__footer { text-align: center; padding: var(--space-md) 0; }
.layout__design-link { font-size: var(--fs-xs); color: var(--ink-ghost); font-family: var(--font-mono); }
.layout__design-link:hover { color: var(--copper); }

/* Mobile bottom nav */
.layout__bottom-nav {
  display: none;
}

@media (max-width: 640px) {
  .layout__top-row { padding: 12px 16px 10px; }
  .layout__zoom-strip { padding: 0 16px; }
  .layout__date-row   { padding: 8px 16px; }
  .layout__content    { padding: var(--space-sm); padding-bottom: 80px; }

  .layout__bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    border-top: 2px solid var(--ink);
    background: var(--cream);
    z-index: 20;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .layout__bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 4px;
    gap: 3px;
    border: none;
    background: none;
    border-right: 1px solid var(--cream-dark);
    position: relative;
    cursor: pointer;
    transition: background 0.1s;
  }
  .layout__bottom-nav-item:last-child { border-right: none; }
  .layout__bottom-nav-item:hover { background: var(--cream-mid); }

  .layout__bottom-nav-item.active::before {
    content: '';
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 24px; height: 2px;
    background: var(--copper);
  }

  .layout__bottom-nav-icon  { font-size: 0.85rem; color: var(--ink-ghost); }
  .layout__bottom-nav-label { font-family: var(--font-mono); font-size: 0.5rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-ghost); }
  .layout__bottom-nav-item.active .layout__bottom-nav-icon,
  .layout__bottom-nav-item.active .layout__bottom-nav-label { color: var(--ink); }

  /* Hide top view tabs on mobile — replaced by bottom nav */
  .layout__mode-btn { display: none; }
}
```

- [ ] **Step 2.2: Update Layout.tsx JSX structure**

In `Layout.tsx`, replace the entire `return (...)` with this updated structure (keeping all the same prop usage, just reorganizing the DOM):

```tsx
return (
  <div className={`layout ${isFlow ? 'layout--flow' : ''}`}>
    <header className={`layout__header ${isFlow ? 'layout__header--flow' : ''}`}>
      {/* Brand row */}
      <div className="layout__top-row">
        <div className="layout__top-left">
          <span className="layout__brand">bujo</span>
          <span className="layout__date-sub">{getHeader(currentZoom, currentDate).toLowerCase()}</span>
        </div>
        <div className="layout__top-right">
          <button
            className={`layout__mode-btn${viewMode === 'focus' ? ' layout__mode-btn--active' : ''}`}
            onClick={() => onViewModeChange('focus')}
          >focus</button>
          <button
            className={`layout__mode-btn${viewMode === 'flow' ? ' layout__mode-btn--active' : ''}`}
            onClick={() => onViewModeChange('flow')}
          >flow</button>
          <span className={`layout__sync layout__sync--${syncStatus}`} title={syncLabels[syncStatus]}>
            <span className="layout__sync-dot" />
          </span>
          {!isToday && (
            <button className="layout__today-btn" onClick={onGoToday}>
              <FontAwesomeIcon icon={faCircleDot} size="xs" />
              Today
            </button>
          )}
          {gcalEnabled && gcalStatus === 'disconnected' && (
            <button className="layout__gcal-btn" onClick={onGcalConnect} title="Connect Google Calendar">
              <FontAwesomeIcon icon={faCalendar} size="sm" />
            </button>
          )}
          {gcalEnabled && gcalStatus === 'connected' && (
            <button className="layout__gcal-btn layout__gcal-btn--connected" onClick={onGcalDisconnect} title="Disconnect Google Calendar">
              <FontAwesomeIcon icon={faCalendar} size="sm" />
            </button>
          )}
          {gcalEnabled && gcalStatus === 'loading' && (
            <span className="layout__gcal-btn layout__gcal-btn--loading" title="Connecting...">
              <FontAwesomeIcon icon={faCalendar} size="sm" />
            </span>
          )}
          {onToggleLists && (
            <button
              className={`layout__lists-btn${listsOpen ? ' layout__lists-btn--active' : ''}`}
              onClick={onToggleLists}
              title="Lists"
            >
              <FontAwesomeIcon icon={faList} size="sm" />
            </button>
          )}
          {onSignOut && (
            <button className="layout__signout-btn" onClick={onSignOut} title="Sign out">
              <FontAwesomeIcon icon={faRightFromBracket} size="sm" />
            </button>
          )}
        </div>
      </div>

      {/* Zoom strip */}
      <div className="layout__zoom-strip">
        <ZoomNav currentZoom={currentZoom} onZoomChange={onZoomChange} />
      </div>

      {/* Date nav — focus mode only */}
      {!isFlow && (
        <div className="layout__date-row">
          <button className="layout__nav-btn" onClick={() => onNavigate('prev')}>
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <h1 className="layout__date-title">{getHeader(currentZoom, currentDate)}</h1>
          <button className="layout__nav-btn" onClick={() => onNavigate('next')}>
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      )}
    </header>

    <main className={`layout__content ${isFlow ? 'layout__content--flow' : ''}`}>{children}</main>

    <footer className="layout__footer">
      <a className="layout__design-link" href="#/design-system">Design System</a>
    </footer>

    {/* Mobile bottom nav */}
    <nav className="layout__bottom-nav">
      <button
        className={`layout__bottom-nav-item${viewMode === 'focus' ? ' active' : ''}`}
        onClick={() => onViewModeChange('focus')}
      >
        <span className="layout__bottom-nav-icon">○</span>
        <span className="layout__bottom-nav-label">focus</span>
      </button>
      <button
        className={`layout__bottom-nav-item${viewMode === 'flow' ? ' active' : ''}`}
        onClick={() => onViewModeChange('flow')}
      >
        <span className="layout__bottom-nav-icon">≡</span>
        <span className="layout__bottom-nav-label">flow</span>
      </button>
      {onToggleLists && (
        <button
          className={`layout__bottom-nav-item${listsOpen ? ' active' : ''}`}
          onClick={onToggleLists}
        >
          <span className="layout__bottom-nav-icon">⊞</span>
          <span className="layout__bottom-nav-label">lists</span>
        </button>
      )}
    </nav>
  </div>
);
```

Note: remove the old `import { ZoomNav }` if it was previously inline — it's still used but now inside the zoom-strip div.

- [ ] **Step 2.3: Update ZoomNav.css**

Replace `ZoomNav.css` with pills matching the new design:
```css
.zoom-nav {
  display: flex;
  gap: 0;
  padding: 4px 0;
}

.zoom-nav__btn {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid transparent;
  background: none;
  color: var(--ink-ghost);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s;
}

.zoom-nav__btn:hover {
  color: var(--ink);
}

.zoom-nav__btn--active {
  background: var(--ink);
  color: var(--cream);
}
```

- [ ] **Step 2.4: Build check + visual check**
```bash
npm run build && npm run dev
```
Open localhost:5173. Confirm: `bujo` in Lora italic, zoom pills below, date nav separated.

- [ ] **Step 2.5: Commit**
```bash
git add src/components/Layout/ src/components/ZoomNav/ZoomNav.css
git commit -m "design: new Layout header — brand strip, zoom strip, date nav row, mobile bottom nav"
```

---

## Task 3 — TaskItem

The task row needs a dedicated 44px signifier column separated by a vertical line from the content.

**Files:**
- Modify: `src/components/TaskItem/TaskItem.css`

- [ ] **Step 3.1: Replace TaskItem.css**

```css
/* ── Base row ── */
.task-item {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: stretch;
  border-bottom: 1px solid var(--cream-dark);
  min-height: 48px;
  position: relative;
  transition: background 0.1s;
}
.task-item:first-child { border-top: 1px solid var(--cream-dark); }
.task-item:hover { background: var(--cream-mid); }
.task-item--dragging { opacity: 0.4; }
.task-item--overlay {
  background: var(--cream);
  border: 1px solid var(--copper);
  border-radius: var(--radius);
  box-shadow: 2px 2px 0 var(--ink);
}

/* ── Signifier cell ── */
.task-item__signifier-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--cream-dark);
  cursor: pointer;
  transition: background 0.1s;
  flex-shrink: 0;
}
.task-item__signifier-cell:hover { background: var(--cream-mid); }
.task-item__signifier-cell:active { background: var(--cream-dark); }

.task-item__signifier {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  color: var(--ink-mid);
  user-select: none;
  transition: transform 0.1s;
}
.task-item__signifier-cell:hover .task-item__signifier { transform: scale(1.2); }

/* Status colors */
.task-item--completed .task-item__signifier { color: var(--sage); }
.task-item--migrated  .task-item__signifier,
.task-item--scheduled .task-item__signifier { color: var(--copper); }
.task-item--cancelled .task-item__signifier { color: var(--ink-ghost); }

/* ── Body (content + badges) ── */
.task-item__body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  padding: 10px 12px;
  min-width: 0;
}

.task-item__content {
  font-family: var(--font-mono);
  font-size: var(--fs-base);
  line-height: 1.45;
  color: var(--ink);
  user-select: none;
}
.task-item__content--clickable { cursor: pointer; }
.task-item__content--clickable:hover { color: var(--copper); }

.task-item--completed .task-item__content {
  text-decoration: line-through;
  text-decoration-color: var(--sage);
  color: var(--ink-ghost);
}
.task-item--cancelled .task-item__content {
  text-decoration: line-through;
  color: var(--ink-ghost);
}
.task-item--migrated .task-item__content,
.task-item--scheduled .task-item__content {
  color: var(--ink-ghost);
  font-style: italic;
}

/* Badges row */
.task-item__badges { display: flex; gap: 4px; flex-wrap: wrap; }

.task-item__badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  font-size: 0.58rem;
  font-family: var(--font-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: 2px;
  cursor: pointer;
}
.task-item__badge--planned   { background: var(--copper-pale); color: var(--copper); }
.task-item__badge--deadline  { background: var(--cream-dark);  color: var(--ink-faint); }
.task-item__badge--overdue   { background: #fde8e8; color: var(--danger); font-weight: 600; }
.task-item__badge--today     { background: var(--copper-pale); color: var(--copper); font-weight: 600; }
.task-item__badge--future    { background: var(--cream-dark);  color: var(--ink-faint); }

.task-item__subtask-count {
  font-size: 0.58rem;
  font-family: var(--font-mono);
  color: var(--ink-ghost);
  background: var(--cream-dark);
  padding: 0 4px;
  border-radius: 2px;
}

.task-item__category-badge {
  font-size: 0.58rem;
  font-family: var(--font-mono);
  color: var(--sage);
  background: var(--sage-pale);
  padding: 0 5px;
  border-radius: 2px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Edit input */
.task-item__edit-input {
  width: 100%;
  padding: 4px 8px;
  font-size: var(--fs-base);
  border: 1px solid var(--copper);
}

/* ── Actions column ── */
.task-item__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
  opacity: 0;
  transition: opacity 0.15s;
}
.task-item:hover .task-item__actions { opacity: 1; }
@media (hover: none) { .task-item__actions { opacity: 1; } }

.task-item__drag-handle {
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--fs-sm);
  color: var(--ink-ghost);
  cursor: grab;
  touch-action: none;
  border-radius: var(--radius);
}
.task-item__drag-handle:hover { color: var(--ink-faint); background: var(--cream-dark); }
.task-item__drag-handle:active { cursor: grabbing; }

.task-item__action-wrapper { position: relative; }
.task-item__action {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--fs-sm);
  color: var(--ink-ghost);
  border-radius: var(--radius);
  transition: all 0.1s;
}
.task-item__action:hover           { background: var(--cream-dark); color: var(--ink-faint); }
.task-item__action--active         { color: var(--copper); }
.task-item__action--planned:hover  { color: var(--copper); }
.task-item__action--deadline:hover { color: var(--danger); }
.task-item__action--delete:hover   { color: var(--danger); }

/* Hidden date input */
.task-item__date-input {
  position: absolute; width: 0; height: 0; overflow: hidden; opacity: 0; pointer-events: none;
}

/* Date popover */
.date-popover {
  position: absolute;
  top: 100%; right: 0;
  z-index: 100;
  min-width: 220px;
  background: var(--cream);
  border: 1px solid var(--ink);
  border-radius: var(--radius-lg);
  box-shadow: 3px 3px 0 var(--ink);
  padding: var(--space-sm);
  margin-top: 4px;
}
.date-popover__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-sm); }
.date-popover__title  { font-size: var(--fs-sm); font-weight: 600; color: var(--ink); font-family: var(--font-mono); }
.date-popover__clear  { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: var(--fs-sm); color: var(--ink-ghost); border-radius: var(--radius); }
.date-popover__clear:hover { background: var(--cream-dark); color: var(--danger); }
.date-popover__fields { display: flex; flex-direction: column; gap: var(--space-xs); }
.date-popover__label  { display: flex; align-items: center; gap: var(--space-sm); }
.date-popover__label-text { font-size: var(--fs-xs); font-family: var(--font-mono); color: var(--ink-faint); width: 32px; flex-shrink: 0; }
.date-popover__input  { flex: 1; padding: 4px 8px; font-size: var(--fs-sm); border: 1px solid var(--cream-dark); border-radius: var(--radius); background: var(--cream-mid); color: var(--ink); outline: none; }
.date-popover__input:focus { border-color: var(--copper); }
.date-popover__footer { display: flex; justify-content: flex-end; margin-top: var(--space-sm); }
.date-popover__btn { padding: 4px 10px; font-size: var(--fs-xs); font-family: var(--font-mono); border-radius: var(--radius); cursor: pointer; }
.date-popover__btn--save { background: var(--ink); color: var(--cream); border: none; }
.date-popover__btn--save:hover { opacity: 0.85; }
```

- [ ] **Step 3.2: Update TaskItem.tsx — signifier cell + drag handle relocation**

Current JSX structure (line 65+):
```tsx
<div className="task-item ...">
  {dragListeners && (
    <div className="task-item__drag-handle" {...dragListeners}>⠿</div>
  )}
  <button className="task-item__signifier" onClick={onStatusChange}>
    {SIGNIFIERS[task.status]}
  </button>
  <div className="task-item__body">...</div>
  <div className="task-item__actions">...</div>
</div>
```

New structure — drag handle moves into the actions column (the `auto` third column); signifier gets its own 44px cell:
```tsx
<div className="task-item ...">
  {/* Col 1: 44px signifier cell */}
  <div className="task-item__signifier-cell" onClick={onStatusChange}>
    <span className="task-item__signifier">{SIGNIFIERS[task.status]}</span>
  </div>

  {/* Col 2: body */}
  <div className="task-item__body">
    {/* existing body content unchanged */}
  </div>

  {/* Col 3: actions (drag handle + action buttons) */}
  <div className="task-item__actions">
    {dragListeners && (
      <div className="task-item__drag-handle" {...dragListeners}>
        <FontAwesomeIcon icon={faGripLines} />
      </div>
    )}
    {/* existing action buttons unchanged */}
  </div>
</div>
```

Note: remove `onClick` from the old `<button className="task-item__signifier">` — the new `task-item__signifier-cell` div handles the click.

- [ ] **Step 3.3: Update DragOverlay in DayView.tsx**

`DayView.tsx` lines 323-330 render a bare overlay when dragging. Update to match the new grid structure:
```tsx
<DragOverlay>
  {activeTask ? (
    <div className="task-item task-item--overlay">
      <div className="task-item__signifier-cell">
        <span className="task-item__signifier">{SIGNIFIERS[activeTask.status]}</span>
      </div>
      <div className="task-item__body">
        <span className="task-item__content">{activeTask.content}</span>
      </div>
      <div className="task-item__actions" />
    </div>
  ) : null}
</DragOverlay>
```

- [ ] **Step 3.4: Build + visual check**
```bash
npm run build && npm run dev
```
Confirm: task rows have a left 44px signifier column with vertical divider, content to the right, drag handle inside the actions column. Try dragging a task — the overlay should render correctly.

- [ ] **Step 3.5: Commit**
```bash
git add src/components/TaskItem/ src/components/DayView/DayView.tsx
git commit -m "design: TaskItem — 44px signifier column, drag handle in actions, DragOverlay updated"
```

---

## Task 4 — Highlight Zone

**Files:**
- Modify: `src/components/Highlight/Highlight.css`

- [ ] **Step 4.1: Replace Highlight.css**

```css
.highlight {
  border: 1.5px dashed var(--copper-light);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  background: var(--copper-pale);
  margin-bottom: var(--space-lg);
}

.highlight--drop-active {
  border-style: solid;
  border-color: var(--copper);
  box-shadow: 0 0 0 2px var(--copper-pale);
}

.highlight__icon { color: var(--copper); flex-shrink: 0; }

/* Label */
.highlight__label {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--copper);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Empty state */
.highlight--empty .highlight__prompt {
  display: flex; align-items: center; gap: var(--space-sm);
  color: var(--ink-faint);
  margin-bottom: var(--space-sm);
  font-size: var(--fs-base);
}
.highlight--empty .highlight__actions {
  display: flex; gap: var(--space-sm);
  margin-left: calc(var(--space-sm) + 14px + var(--space-sm));
}
.highlight__btn {
  padding: 4px 10px; font-size: var(--fs-sm);
  color: var(--copper); border: 1px solid var(--copper-light);
  border-radius: var(--radius);
  transition: all 0.12s;
}
.highlight__btn:hover { background: var(--copper-pale); }
.highlight__btn--secondary { color: var(--ink-faint); border-color: var(--cream-dark); }
.highlight__btn--secondary:hover { background: var(--cream-mid); }

/* Set state */
.highlight--set { display: flex; align-items: flex-start; gap: var(--space-sm); }
.highlight__content {
  flex: 1;
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--fs-lg);
  font-weight: 400;
  color: var(--ink);
  line-height: 1.45;
}
.highlight__set-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
.highlight--set:hover .highlight__set-actions { opacity: 1; }
@media (hover: none) { .highlight__set-actions { opacity: 1; } }

.highlight__edit-btn,
.highlight__clear-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--fs-sm); color: var(--ink-ghost);
  border-radius: var(--radius);
}
.highlight__edit-btn:hover  { background: var(--cream-dark); color: var(--ink-faint); }
.highlight__clear-btn:hover { background: var(--cream-dark); color: var(--danger); }

/* Editing state */
.highlight--editing { display: flex; align-items: flex-start; gap: var(--space-sm); }
.highlight--editing .highlight__icon { margin-top: 6px; }
.highlight__edit-row { flex: 1; display: flex; gap: 4px; }
.highlight__input {
  flex: 1;
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--fs-lg);
  padding: 4px 8px;
  border: 1px solid var(--copper);
  border-radius: var(--radius);
  background: var(--cream);
}
.highlight__confirm,
.highlight__cancel {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius); color: var(--ink-faint);
}
.highlight__confirm:hover { background: var(--sage); color: var(--cream); }
.highlight__cancel:hover  { background: var(--cream-dark); color: var(--danger); }

/* Task picker */
.highlight__task-picker { display: flex; flex-direction: column; gap: 4px; margin-top: var(--space-sm); }
.highlight--editing .highlight__task-picker { flex: 1; margin-top: 0; }
.highlight__task-option {
  text-align: left; padding: 8px var(--space-md);
  border: 1px solid var(--cream-dark); border-radius: var(--radius);
  font-size: var(--fs-base); color: var(--ink);
  background: var(--cream);
  transition: all 0.12s;
}
.highlight__task-option:hover { border-color: var(--copper); background: var(--copper-pale); color: var(--copper); }

/* Reflection rating */
.highlight__reflection { margin-top: var(--space-sm); display: flex; flex-direction: column; gap: 4px; }
.highlight__rating-group { display: flex; gap: 6px; }
.highlight__rating-btn {
  font-family: var(--font-mono);
  font-size: 0.62rem; letter-spacing: 0.08em;
  padding: 4px 10px; border-radius: var(--radius);
  border: 1px solid var(--cream-dark);
  background: none; color: var(--ink-faint);
  cursor: pointer; transition: all 0.12s;
}
.highlight__rating-btn--good.active   { background: var(--sage-pale);   color: var(--sage);   border-color: var(--sage-light); }
.highlight__rating-btn--okay.active   { background: var(--copper-pale); color: var(--copper); border-color: var(--copper-light); }
.highlight__rating-btn--missed.active { background: var(--cream-dark);  color: var(--ink-faint); border-color: var(--ink-ghost); }
```

- [ ] **Step 4.2: Add `.highlight__label` to Highlight.tsx**

The current `Highlight.tsx` has no label element — it only has the sun icon + prompt text in `highlight__prompt`. Add a label div to the **set** state (line ~131 area) so the "today's highlight" eyebrow appears above the italic content:

In the `highlight--set` block (`src/components/Highlight/Highlight.tsx` ~line 131):
```tsx
<div ref={setNodeRef} className={`highlight highlight--set${isOver ? ' highlight--drop-active' : ''}`}>
  {/* Add this label div: */}
  <div className="highlight__label">
    <FontAwesomeIcon icon={faSun} className="highlight__icon" />
    today's highlight
  </div>
  {/* existing content and set-actions unchanged */}
  <span className="highlight__content">{highlight!.content}</span>
  <div className="highlight__set-actions">
    ...
  </div>
</div>
```

Also remove the standalone `<FontAwesomeIcon icon={faSun} className="highlight__icon" />` that currently sits outside the label (line ~132) since it's now inside the label div.

- [ ] **Step 4.3: Build + visual check**

The highlight zone should look like: dashed copper border, copper-pale background, Lora italic for the content text.

- [ ] **Step 4.4: Commit**
```bash
git add src/components/Highlight/
git commit -m "design: Highlight zone — dashed copper border, Lora italic content, rating buttons"
```

---

## Task 5 — DayView + ModeSelector

**Files:**
- Modify: `src/components/DayView/DayView.css`
- Modify: `src/components/DayView/ModeSelector.css`

- [ ] **Step 5.1: Update DayView.css**

The main changes: add-task row at bottom (not top), remove the input/button style that fights global input styles.

Replace `DayView.css`:
```css
.day-view {
  display: flex;
  flex-direction: column;
}

/* Add task — inline row at bottom of list */
.day-view__add-task {
  display: grid;
  grid-template-columns: 44px 1fr;
  align-items: center;
  min-height: 48px;
  opacity: 0.5;
  transition: opacity 0.15s;
  border-bottom: 1px solid var(--cream-dark);
}
.day-view__add-task:focus-within { opacity: 1; }

.day-view__add-sig {
  display: flex; align-items: center; justify-content: center;
  border-right: 1px solid var(--cream-dark);
  height: 100%;
  font-family: var(--font-mono);
  font-size: 0.95rem;
  color: var(--ink-ghost);
}

.day-view__add-input {
  flex: 1;
  font-family: var(--font-mono);
  font-size: var(--fs-base);
  background: none;
  border: none;
  outline: none;
  color: var(--ink);
  padding: 0 12px;
  width: 100%;
}
.day-view__add-input::placeholder { color: var(--ink-ghost); }

.day-view__add-btn { display: none; } /* hidden — Enter submits */

/* Task list */
.day-view__tasks { display: flex; flex-direction: column; }
.day-view__divider { height: 1px; background: var(--cream-dark); margin: 4px 0; }
.day-view__empty {
  text-align: center;
  padding: var(--space-xl) var(--space-md);
  color: var(--ink-ghost);
  font-size: var(--fs-sm);
}
```

- [ ] **Step 5.2: Update ModeSelector.css**

```css
.mode-selector {
  display: flex;
  gap: 4px;
  margin-bottom: var(--space-lg);
}

.mode-selector__btn {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 5px 12px;
  border: 1px solid var(--cream-dark);
  border-radius: var(--radius);
  background: none;
  color: var(--ink-faint);
  cursor: pointer;
  transition: all 0.12s;
}
.mode-selector__btn:hover { color: var(--ink); border-color: var(--ink-faint); }
.mode-selector__btn--active {
  background: var(--cream-mid);
  color: var(--ink);
  border-color: var(--ink-mid);
}
```

- [ ] **Step 5.3: Check DayView.tsx add-task row structure**

Open `DayView.tsx`. The add-task row currently likely renders an `<input>` + `<button>`. Update it to match the new two-column grid:
```tsx
<div className="day-view__add-task">
  <span className="day-view__add-sig">○</span>
  <input
    className="day-view__add-input"
    placeholder="new task..."
    value={newTask}
    onChange={e => setNewTask(e.target.value)}
    onKeyDown={e => { if (e.key === 'Enter' && newTask.trim()) { onAddTask(newTask.trim()); setNewTask(''); } }}
  />
</div>
```

- [ ] **Step 5.4: Build + visual check**
- [ ] **Step 5.5: Commit**
```bash
git add src/components/DayView/
git commit -m "design: DayView add-task inline row, ModeSelector pill buttons"
```

---

## Task 6 — FlowView

**Files:**
- Modify: `src/components/FlowView/FlowView.css`

- [ ] **Step 6.1: Replace FlowView.css**

```css
/* ── Container ── */
.flow-view {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.flow-view__scroll {
  display: flex;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--ink-ghost) transparent;
}
.flow-view__scroll::-webkit-scrollbar { height: 4px; }
.flow-view__scroll::-webkit-scrollbar-track { background: var(--cream-mid); }
.flow-view__scroll::-webkit-scrollbar-thumb { background: var(--ink-ghost); border-radius: 2px; }

/* ── Column ── */
.flow-view__col {
  flex: 0 0 75vw;
  max-width: 360px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--cream-dark);
  scroll-snap-align: start;
  height: calc(100dvh - 100px);
  transition: background 0.15s;
  position: relative;
}
.flow-view__col:first-child { border-left: 1px solid var(--cream-dark); }

.flow-view__col--current {
  background: var(--cream-mid);
}
.flow-view__col--current::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--copper);
}

.flow-view__col--drop-over {
  background: var(--copper-pale);
}

/* ── Column header ── */
.flow-view__col-header {
  padding: var(--space-md);
  cursor: pointer;
  flex-shrink: 0;
  border-bottom: 1px solid var(--cream-dark);
  transition: background 0.12s;
}
.flow-view__col-header:hover { background: rgba(0,0,0,0.02); }
.flow-view__col-header:hover .flow-view__col-title { color: var(--copper); }

.flow-view__col-title {
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  font-weight: 500;
  color: var(--ink);
  transition: color 0.12s;
}
.flow-view__col-title--current { color: var(--ink); }

.flow-view__col-subtitle {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  color: var(--ink-ghost);
  letter-spacing: 0.05em;
  margin-top: 2px;
}
.flow-view__col-subtitle--current { color: var(--ink-ghost); }

/* ── Column body ── */
.flow-view__col-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-sm) var(--space-md) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Highlight item ── */
.flow-view__highlight-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 8px;
  background: var(--copper-pale);
  border-radius: var(--radius);
  margin-bottom: 8px;
}
.flow-view__highlight-icon { font-size: 0.7rem; color: var(--copper); flex-shrink: 0; margin-top: 1px; }
.flow-view__highlight-item span:last-child {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 0.78rem;
  color: var(--ink-mid);
  line-height: 1.35;
}

/* ── Task row ── */
.flow-view__task {
  display: flex;
  gap: 6px;
  padding: 5px 0;
  border-bottom: 1px dotted var(--cream-dark);
  cursor: pointer;
}
.flow-view__task:last-of-type { border: none; }

.flow-view__signifier {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: var(--ink-mid);
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.1s;
  user-select: none;
  min-width: 14px;
}
.flow-view__signifier:hover { transform: scale(1.3); }

.flow-view__task--completed .flow-view__signifier { color: var(--sage); }
.flow-view__task--migrated  .flow-view__signifier,
.flow-view__task--scheduled .flow-view__signifier { color: var(--copper); }
.flow-view__task--cancelled .flow-view__signifier { color: var(--ink-ghost); }

.flow-view__task-content {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--ink-mid);
  line-height: 1.4;
  transition: color 0.1s;
}
.flow-view__task:hover .flow-view__task-content { color: var(--copper); }
.flow-view__task--completed .flow-view__task-content { text-decoration: line-through; color: var(--ink-ghost); }
.flow-view__task--cancelled .flow-view__task-content { text-decoration: line-through; color: var(--ink-ghost); }

/* ── Add input ── */
.flow-view__add {
  display: flex; gap: 6px; padding: 5px 0;
  opacity: 0.45; transition: opacity 0.15s;
}
.flow-view__add:focus-within { opacity: 1; }
.flow-view__signifier--add { color: var(--ink-ghost); }
.flow-view__add-input {
  font-family: var(--font-mono); font-size: 0.78rem;
  background: none; border: none; outline: none;
  color: var(--ink); width: 100%; min-width: 0;
}
.flow-view__add-input::placeholder { color: var(--ink-ghost); }

/* ── Zoom label edge button ── */
.flow-view__zoom-label {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  flex-shrink: 0;
  border-left: 1px solid var(--cream-dark);
  cursor: pointer;
  background: none;
  border-top: none; border-right: none; border-bottom: none;
  transition: background 0.12s;
}
.flow-view__zoom-label:hover { background: var(--cream-mid); }
.flow-view__zoom-label span {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  font-family: var(--font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-ghost);
  white-space: nowrap;
}
.flow-view__zoom-label:hover span { color: var(--copper); }

/* ── PeriodPeekSidebar ── */
.peek-sidebar {
  flex-shrink: 0;
  border-left: 2px solid var(--ink);
  background: var(--cream);
  overflow: hidden;
  width: 48px;
  transition: width 0.2s ease;
}
.peek-sidebar--expanded { width: 240px; }

.peek-sidebar__strip {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  padding: 16px 14px;
  width: 48px;
  height: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-faint);
  white-space: nowrap;
  cursor: pointer;
  border: none;
  background: none;
  transition: color 0.12s;
}
.peek-sidebar__strip:hover { color: var(--copper); }

.peek-sidebar__strip-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px; height: 16px;
  background: var(--copper);
  color: var(--cream);
  border-radius: 50%;
  font-size: 0.58rem;
  transform: rotate(180deg);
  writing-mode: horizontal-tb;
  flex-shrink: 0;
}

.peek-sidebar__strip-star { font-size: 0.65rem; color: var(--copper); }

.peek-sidebar__panel {
  padding: 16px;
  width: 240px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.peek-sidebar__panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--cream-dark);
  flex-shrink: 0;
}
.peek-sidebar__panel-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 500;
  color: var(--ink);
}
.peek-sidebar__panel-meta {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  color: var(--ink-ghost);
  margin-left: 8px;
}
.peek-sidebar__close {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  color: var(--ink-ghost);
  cursor: pointer;
  background: none;
  border: none;
  padding: 2px 4px;
}
.peek-sidebar__close:hover { color: var(--ink); }

.peek-sidebar__highlight {
  display: flex; gap: 6px; align-items: flex-start;
  padding: 6px 8px;
  background: var(--copper-pale);
  border-radius: var(--radius);
  margin-bottom: 10px;
  flex-shrink: 0;
}
.peek-sidebar__highlight-icon { font-size: 0.65rem; color: var(--copper); flex-shrink: 0; margin-top: 2px; }
.peek-sidebar__highlight span {
  font-family: var(--font-display); font-style: italic;
  font-size: 0.75rem; color: var(--ink-mid); line-height: 1.35;
}

.peek-sidebar__tasks { flex: 1; overflow-y: auto; }

.peek-sidebar__task {
  display: flex; gap: 6px;
  padding: 5px 0;
  border-bottom: 1px dotted var(--cream-dark);
  cursor: pointer;
}
.peek-sidebar__task:last-child { border: none; }
.peek-sidebar__task:hover .peek-sidebar__task-content { color: var(--copper); }

.peek-sidebar__signifier {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ink-mid);
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.1s;
  user-select: none;
}
.peek-sidebar__signifier:hover { transform: scale(1.2); }
.peek-sidebar__task--completed .peek-sidebar__signifier { color: var(--sage); }
.peek-sidebar__task--migrated  .peek-sidebar__signifier { color: var(--copper); }
.peek-sidebar__task--cancelled .peek-sidebar__signifier { color: var(--ink-ghost); }

.peek-sidebar__task-content {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-mid);
  line-height: 1.4;
  transition: color 0.1s;
}
.peek-sidebar__task--completed .peek-sidebar__task-content { text-decoration: line-through; color: var(--ink-ghost); }

.peek-sidebar__add {
  display: flex; gap: 6px; padding: 5px 0;
  margin-top: 4px;
  opacity: 0.45; transition: opacity 0.15s;
  flex-shrink: 0;
}
.peek-sidebar__add:focus-within { opacity: 1; }
.peek-sidebar__add-input {
  font-family: var(--font-mono); font-size: 0.75rem;
  background: none; border: none; outline: none;
  color: var(--ink); width: 100%;
}
.peek-sidebar__add-input::placeholder { color: var(--ink-ghost); }
```

- [ ] **Step 6.2: Build + visual check in flow mode**

Switch to flow mode in the app. Columns should have: Lora serif title, copper top border on today's column, highlight in copper-pale chip, dotted task dividers.

- [ ] **Step 6.3: Commit**
```bash
git add src/components/FlowView/FlowView.css
git commit -m "design: FlowView + PeriodPeekSidebar — copper column marker, Lora headers, dotted task rows"
```

---

## Task 7 — MigrationFlow

**Files:**
- Modify: `src/components/MigrationFlow/MigrationFlow.css`

- [ ] **Step 7.1: Replace MigrationFlow.css (using actual TSX class names)**

The component renders 3 steps as separate `migration-flow` cards (no overlay — overlay is in `App.tsx`). Actual class names from `MigrationFlow.tsx`:

```css
/* The card (rendered inside App.tsx overlay) */
.migration-flow {
  background: var(--cream);
  border: 2px solid var(--ink);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modal-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 6px 6px 0 var(--ink);
}
@keyframes modal-in { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:none} }

/* Header */
.migration-flow__header {
  padding: 22px 26px 16px;
  border-bottom: 1px solid var(--cream-dark);
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.migration-flow__step-label {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--copper);
  font-weight: 600;
}
.migration-flow__counter,
.migration-flow__date {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--ink-faint);
}

/* Body */
.migration-flow__body {
  padding: 18px 26px;
  overflow-y: auto;
  flex: 1;
}
.migration-flow__prompt {
  color: var(--ink-faint);
  margin-bottom: var(--space-md);
  display: flex; align-items: center; gap: var(--space-sm);
  font-size: var(--fs-sm);
}
.migration-flow__sun { color: var(--copper); }

/* Highlight display (reflect + migrate steps) */
.migration-flow__highlight-display {
  display: flex; align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--copper-pale);
  border-left: 3px solid var(--copper);
  border-radius: var(--radius);
  margin-bottom: var(--space-lg);
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--fs-lg);
  color: var(--ink);
  line-height: 1.4;
}

/* Task display (migrate step — one task at a time) */
.migration-flow__task-display {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 0;
  margin-bottom: var(--space-md);
  border-bottom: 1px solid var(--cream-dark);
}
.migration-flow__signifier {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  color: var(--ink-ghost);
  flex-shrink: 0;
}
.migration-flow__task-text {
  font-family: var(--font-mono);
  font-size: var(--fs-base);
  color: var(--ink-mid);
  line-height: 1.4;
}

/* Migration action buttons (carry/migrate/etc) */
.migration-flow__migrate-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: var(--space-lg);
}
.migration-flow__migrate-btn {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 10px 14px;
  border-radius: var(--radius);
  border: 1px solid var(--cream-dark);
  background: none;
  color: var(--ink-faint);
  cursor: pointer;
  transition: all 0.12s;
  text-align: left;
}
.migration-flow__migrate-btn:hover { border-color: var(--ink-faint); color: var(--ink); background: var(--cream-mid); }

/* Distinguish carry (sage) and migrate (copper) by position — 1st=carry, 2nd=tomorrow, 3rd=later, 4th=cancel */
.migration-flow__migrate-btn:nth-child(1) { border-color: var(--sage-light); color: var(--sage); }
.migration-flow__migrate-btn:nth-child(1):hover { background: var(--sage-pale); }
.migration-flow__migrate-btn:nth-child(2),
.migration-flow__migrate-btn:nth-child(3) { border-color: var(--copper-light); color: var(--copper); }
.migration-flow__migrate-btn:nth-child(2):hover,
.migration-flow__migrate-btn:nth-child(3):hover { background: var(--copper-pale); }

/* Reflection buttons (reflect step) */
.migration-flow__reflect-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.migration-flow__reflect-btn {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  padding: 6px 14px;
  border-radius: var(--radius);
  border: 1px solid var(--cream-dark);
  background: none;
  color: var(--ink-faint);
  cursor: pointer;
  transition: all 0.12s;
}
.migration-flow__reflect-btn:hover { border-color: var(--ink-faint); color: var(--ink); }
/* Active state — matching rating-btn pattern from prototype */
.migration-flow__reflect-btn--good   { border-color: var(--sage-light);   color: var(--sage); }
.migration-flow__reflect-btn--good:hover,
.migration-flow__reflect-btn--good.active   { background: var(--sage-pale); }
.migration-flow__reflect-btn--okay   { border-color: var(--copper-light);  color: var(--copper); }
.migration-flow__reflect-btn--okay:hover,
.migration-flow__reflect-btn--okay.active   { background: var(--copper-pale); }
.migration-flow__reflect-btn--missed { }
.migration-flow__reflect-btn--missed.active { background: var(--cream-dark); color: var(--ink-faint); border-color: var(--ink-ghost); }

/* Highlight input (highlight step) */
.migration-flow__highlight-input-row {
  display: flex;
  gap: 8px;
  margin-bottom: var(--space-md);
}
.migration-flow__highlight-input {
  flex: 1;
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--fs-lg);
  background: var(--cream-mid);
  border: 1px solid var(--cream-dark);
  border-radius: var(--radius);
  padding: 8px 12px;
  color: var(--ink);
  outline: none;
}
.migration-flow__highlight-input:focus { border-color: var(--copper); }
.migration-flow__highlight-actions { display: flex; gap: 8px; justify-content: flex-end; }

/* Primary button + skip */
.migration-flow__primary-btn {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 9px 20px;
  background: var(--ink);
  color: var(--cream);
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: opacity 0.12s;
}
.migration-flow__primary-btn:hover { opacity: 0.85; }
.migration-flow__primary-btn:disabled { opacity: 0.35; cursor: default; }

.migration-flow__skip {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  color: var(--ink-ghost);
  cursor: pointer;
  background: none; border: none;
  transition: color 0.12s;
  align-self: center;
}
.migration-flow__skip:hover { color: var(--ink-faint); }
```

Also update the `App.tsx` overlay wrapper (the backdrop div that wraps `<MigrationFlow>`). Find it in `App.tsx` and ensure it has these styles inline or via a class:
```css
/* In App.css or inline — the overlay backdrop in App.tsx */
.migration-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 22, 18, 0.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: var(--space-md);
  animation: backdrop-in 0.2s ease;
}
@keyframes backdrop-in { from{opacity:0} to{opacity:1} }
```

Check `App.tsx` — if the overlay backdrop already has a class like `migration-flow__backdrop`, use that. Otherwise add `className="migration-overlay"` to the wrapper div and put the CSS in `App.css`.

- [ ] **Step 7.2: No TSX class name changes needed**

The CSS in Step 7.1 is written to match the actual TSX class names. No changes to `MigrationFlow.tsx` are required.

- [ ] **Step 7.3: Build + visual check**

Trigger migration overlay. Should appear: 2px border, box-shadow offset, Lora serif title, copper eyebrow label.

- [ ] **Step 7.4: Commit**
```bash
git add src/components/MigrationFlow/
git commit -m "design: MigrationFlow — ink border, box shadow, Lora title, copper action buttons"
```

---

## Task 8 — TaskDetail

**Files:**
- Modify: `src/components/TaskDetail/TaskDetail.css`

- [ ] **Step 8.1: Update TaskDetail.css**

The overlay is currently full-screen. Keep that behavior but restyle it:
```css
/* Full-screen overlay */
.task-detail__overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(26, 22, 18, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: flex-end;
  animation: backdrop-in 0.2s ease;
}
@keyframes backdrop-in { from{opacity:0} to{opacity:1} }

.task-detail {
  background: var(--cream);
  border-left: 2px solid var(--ink);
  width: 440px;
  max-width: 100vw;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  animation: panel-in 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: -4px 0 24px rgba(26,22,18,0.1);
}
@keyframes panel-in { from{transform:translateX(100%)} to{transform:none} }

/* Header */
.task-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 24px 16px;
  border-bottom: 1px solid var(--cream-dark);
  flex-shrink: 0;
  gap: 12px;
}

.task-detail__back {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink-ghost);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
  margin-top: 3px;
  transition: color 0.12s;
}
.task-detail__back:hover { color: var(--ink); }

/* Title — Lora italic. TSX uses task-detail__title-row (line 172 of TaskDetail.tsx) */
.task-detail__title-row { flex: 1; display: flex; align-items: flex-start; gap: 8px; }
.task-detail__signifier {
  font-family: var(--font-mono);
  font-size: 1rem;
  color: var(--ink-mid);
  cursor: pointer;
  margin-right: 8px;
  transition: transform 0.1s;
  user-select: none;
}
.task-detail__signifier:hover { transform: scale(1.2); }

.task-detail__title-input {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--ink);
  background: none;
  border: none;
  outline: none;
  resize: none;
  width: 100%;
  line-height: 1.35;
  padding: 0;
}

.task-detail__header-actions { display: flex; gap: 4px; }
.task-detail__header-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  font-size: var(--fs-sm); color: var(--ink-ghost);
  border-radius: var(--radius); transition: all 0.1s;
}
.task-detail__header-btn:hover { background: var(--cream-dark); color: var(--ink-faint); }

/* Body */
.task-detail__body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Section */
.task-detail__section { display: flex; flex-direction: column; gap: 6px; }
.task-detail__section-label {
  font-family: var(--font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-ghost);
}

/* Field inputs — override global */
.task-detail__input,
.task-detail__textarea {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  background: var(--cream-mid);
  border: 1px solid var(--cream-dark);
  border-radius: var(--radius);
  padding: 8px 10px;
  color: var(--ink);
  outline: none;
  transition: border-color 0.12s;
  width: 100%;
}
.task-detail__input:focus,
.task-detail__textarea:focus { border-color: var(--ink-faint); }
.task-detail__textarea { resize: vertical; min-height: 72px; line-height: 1.6; }

.task-detail__row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

/* Subtasks */
.task-detail__subtask-list { display: flex; flex-direction: column; gap: 4px; }
.task-detail__subtask-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px;
  background: var(--cream-mid);
  border-radius: var(--radius);
  border: 1px solid var(--cream-dark);
}
.task-detail__subtask-item input[type="checkbox"] { accent-color: var(--sage); cursor: pointer; }
.task-detail__subtask-text { font-family: var(--font-mono); font-size: var(--fs-sm); color: var(--ink-mid); flex: 1; }
.task-detail__subtask-text--done { text-decoration: line-through; color: var(--ink-ghost); }

/* Category autocomplete */
.task-detail__autocomplete {
  position: relative;
}
.task-detail__suggestions {
  position: absolute;
  top: 100%; left: 0; right: 0;
  background: var(--cream);
  border: 1px solid var(--ink);
  border-radius: var(--radius);
  box-shadow: 2px 2px 0 var(--ink);
  z-index: 10;
  max-height: 160px;
  overflow-y: auto;
}
.task-detail__suggestion {
  padding: 7px 10px;
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  color: var(--ink-mid);
  cursor: pointer;
  transition: background 0.1s;
}
.task-detail__suggestion:hover,
.task-detail__suggestion--active { background: var(--cream-mid); color: var(--copper); }

/* Footer */
.task-detail__footer {
  padding: 14px 24px;
  border-top: 1px solid var(--cream-dark);
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}
.task-detail__delete-btn {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 7px 14px;
  background: none;
  border: 1px solid var(--cream-dark);
  border-radius: var(--radius);
  color: var(--ink-ghost);
  cursor: pointer;
  transition: all 0.12s;
}
.task-detail__delete-btn:hover { border-color: var(--danger); color: var(--danger); }

.task-detail__save-btn {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 8px 18px;
  background: var(--ink);
  color: var(--cream);
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  transition: opacity 0.12s;
}
.task-detail__save-btn:hover { opacity: 0.85; }

/* Mobile: bottom sheet */
@media (max-width: 640px) {
  .task-detail__overlay { justify-content: flex-end; align-items: flex-end; }
  .task-detail {
    width: 100%;
    height: 90vh;
    border-left: none;
    border-top: 2px solid var(--ink);
    border-radius: 16px 16px 0 0;
    animation: sheet-in 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 -4px 24px rgba(26,22,18,0.12);
  }
  @keyframes sheet-in { from{transform:translateY(100%)} to{transform:none} }
  .task-detail__header { padding-top: 8px; }
  .task-detail__header::before {
    content: '';
    display: block;
    width: 36px; height: 4px;
    background: var(--cream-dark);
    border-radius: 2px;
    margin: 0 auto 14px;
  }
}
```

- [ ] **Step 8.2: Check TaskDetail.tsx uses matching class names**

Key classes to verify exist in `TaskDetail.tsx`: `task-detail__overlay`, `task-detail__title-input` (or whatever the title textarea uses), `task-detail__delete-btn`, `task-detail__save-btn`. Update class names in TSX if they differ.

- [ ] **Step 8.3: Build + visual check**

Click a task. TaskDetail should slide in from the right on desktop, up from the bottom on mobile. Title should use Lora italic.

- [ ] **Step 8.4: Commit**
```bash
git add src/components/TaskDetail/
git commit -m "design: TaskDetail — right panel on desktop, bottom sheet on mobile, Lora italic title"
```

---

## Task 9 — Remaining components + final polish

**Files:**
- Modify: `src/App.css`
- Modify: `src/components/Auth/LoginPage.css`
- Modify: `src/components/Lists/ListsPanel.css`
- Modify: `src/components/DayView/TimeEffortView.css`
- Modify: `src/components/DayView/TimeBoxingView.css`
- Modify: `src/components/MonthView/MonthView.css`
- Modify: `src/components/WeekView/WeekView.css`

- [ ] **Step 9.1: Auth / LoginPage**

`LoginPage.css` — token refresh only. Key changes:
- Any hardcoded hex colors → use token variables
- Page background → `var(--cream)`
- Card border → `1px solid var(--ink)` + `box-shadow: 4px 4px 0 var(--ink)`
- Submit button → `background: var(--ink); color: var(--cream)`
- Title → `font-family: var(--font-display); font-style: italic`

- [ ] **Step 9.2: ListsPanel**

`ListsPanel.css` — token refresh:
- Background: `var(--cream)`
- Panel border: `border-left: 2px solid var(--ink)`
- Header: Lora display font for panel title
- List items: same task row pattern as `task-item`

- [ ] **Step 9.3: WeekView + MonthView**

These views use task item rows inline. Main change: ensure they pick up the `task-item` CSS changes from Task 3 (they likely embed `<TaskItem>` components so no CSS change needed). Check header/title elements use `var(--font-display)` where appropriate.

- [ ] **Step 9.4: TimeEffortView + TimeBoxingView**

These are mode views inside DayView. Token refresh: replace hardcoded colors with the new variables. No structural changes.

- [ ] **Step 9.5: App.css**

`App.css` likely has minimal styles. Token refresh only.

- [ ] **Step 9.6: Full visual pass**

Open `localhost:5173` and check every view:
- [ ] Day view (focus)
- [ ] Week view
- [ ] Month view
- [ ] Year view
- [ ] Flow view
- [ ] Migration overlay (click migrate button)
- [ ] Task detail (click a task)
- [ ] Lists panel
- [ ] Login page (if Supabase configured)
- [ ] Mobile (DevTools 390×844)

- [ ] **Step 9.7: Final build check**
```bash
npm run build
```

- [ ] **Step 9.8: Commit**
```bash
git add src/
git commit -m "design: token refresh on remaining components — auth, lists, week/month views"
```

---

## Task 10 — Push + PR

- [ ] **Step 10.1: Push to remote**
```bash
git push
```

- [ ] **Step 10.2: Verify Vercel preview deploy**

Check GitHub Actions for build pass. Confirm preview URL renders correctly on mobile.

---

## Notes

- The prototype file `bujo-redesign-prototype.html` in the repo root is the reference — open it alongside the running app.
- Semantic aliases in `index.css` (e.g. `--bg: var(--cream)`) mean component CSS using old token names still works. This is intentional — it allows incremental component-by-component updates without breaking anything.
- The `--font-sans` alias pointing to `--font-mono` is intentional: the new design is mono-only (Lora is display, not body sans).
- If a component's CSS file uses class names that differ from what's documented here, update the CSS to match the existing JSX class names (don't rename JSX classes — that would require updating TSX files unnecessarily).
