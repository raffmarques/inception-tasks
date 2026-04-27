# User Flow

How a real user moves through **bujo** — entry, daily ritual, navigation, and the side surfaces (lists, year map, calendar). All diagrams are [Mermaid](https://mermaid.js.org/) and render natively on GitHub.

> Companion doc: [`architecture.md`](./architecture.md) — what the app is made of.

---

## 1. App entry

What happens between opening the app and seeing the day.

```mermaid
flowchart TD
    start(["open app"]) --> hash{hash =<br/>#/design-system?}
    hash -- yes --> ds["DesignSystem<br/>(no auth)"]
    hash -- no --> sbcfg{Supabase<br/>configured?}

    sbcfg -- no --> migCheck
    sbcfg -- yes --> sess{has session?}
    sess -- no --> login["LoginPage<br/>sign in / sign up"]
    login -- success --> migCheck
    sess -- yes --> migCheck

    migCheck{yesterday has<br/>open tasks or<br/>highlight?<br/>AND today not<br/>migrated?}
    migCheck -- yes --> mig["MigrationFlow overlay"]
    migCheck -- no --> main
    mig -- onComplete --> main["Layout +<br/>current zoom view"]

    classDef gate fill:#f4e7d8,stroke:#a35c2a,color:#3a2412
    classDef screen fill:#faf9f7,stroke:#1f1d1a,color:#1f1d1a
    class hash,sbcfg,sess,migCheck gate
    class ds,login,mig,main screen
```

The app degrades cleanly: with Supabase unconfigured there is no login, and without yesterday's leftovers there is no migration prompt. The migration check looks at `getDay(today).migrationComplete` plus `getOpenTasksForDate(yesterday)` and `getHighlight('day', yesterday)` — see `src/App.tsx:160-172`.

---

## 2. Zoom navigation

The single navigational primitive in the app: zoom in and out across time.

```mermaid
stateDiagram-v2
    [*] --> Day

    Day --> Week: zoom up
    Week --> Month: zoom up
    Month --> Quarter: zoom up
    Quarter --> Year: zoom up

    Year --> Quarter: zoom down
    Quarter --> Week: click week<br/>(or zoom down → Month)
    Week --> Day: click day
    Month --> Day: click day
    Year --> Month: click month

    Day --> Day: prev / next / today
    Week --> Week: prev / next
    Month --> Month: prev / next
    Quarter --> Quarter: prev / next
    Year --> Year: prev / next

    note right of Week
        right panel: tasks
        pinned to the week
        (key: 2026-W12)
    end note
    note right of Month
        right panel: tasks
        pinned to the month
        (key: 2026-03)
    end note
    note right of Quarter
        right panel: tasks pinned
        to the quarter (2026-Q1)
    end note
    note right of Year
        right panel: tasks pinned
        to the year (2026)
    end note
```

Period-pinned tasks live in the same `days[]` map as daily tasks, just keyed by `2026-W12`, `2026-03`, `2026-Q1`, `2026` instead of `YYYY-MM-DD`. That's why the same `addTask` / `cycleTaskStatus` work at every zoom level.

---

## 3. Daily task lifecycle

Everything you can do to a single task on a single day.

```mermaid
flowchart LR
    add["type in DayView input<br/>+ Enter"] --> open(["○ open"])

    open -->|click signifier| done(["● completed"])
    done -->|click signifier| cancel(["× cancelled"])
    cancel -->|click signifier| open

    open -->|click content| detail["TaskDetail overlay<br/>title · description · category<br/>planned range · deadline<br/>time estimate · notification<br/>subtasks · attachments"]
    open -->|double-click content| inline["inline edit"]
    open -->|drag onto Highlight zone| hl["sets day highlight<br/>(linked via taskId)"]
    open -->|drag in time-effort view| sess["added to session<br/>(slider sums time estimate)"]
    open -->|drag in time-boxing view| bucket["assigned to bucket<br/>(morning · afternoon · night)"]
    open -->|calendar icon| moveDate["pick another date<br/>→ moveTask()"]

    open -. only via<br/>MigrationFlow .-> mig(["› migrated"])

    classDef status fill:#e8efe5,stroke:#2f3a2c,color:#2f3a2c
    classDef action fill:#faf9f7,stroke:#1f1d1a,color:#1f1d1a
    class open,done,cancel,mig status
    class add,detail,inline,hl,sess,bucket,moveDate action
```

The signifier click cycles through only `open → completed → cancelled → open` (`useTasks.ts:66`). `migrated` and `scheduled` are explicit transitions — `migrated` is set during the migration flow when a task moves to a new day, and `scheduled` is set when a task is given a future planned date.

---

## 4. Migration flow

The morning ritual. Triggered automatically by the entry decision in §1.

```mermaid
flowchart TD
    start(["MigrationFlow opens"]) --> hadHL{yesterday had<br/>a highlight?}

    hadHL -- yes --> reflect["Step: Reflect<br/>👍 good · 😑 okay · 👎 missed<br/>+ optional note"]
    hadHL -- no --> tasks
    reflect --> tasks

    tasks["Step: per open task<br/>→ migrate · complete · cancel"]
    tasks --> setHL["Step: set today's highlight<br/>(free text or pick from tasks)"]
    setHL --> done["Done"]
    done -->|setMigrationComplete today| main(["DayView"])

    classDef step fill:#faf9f7,stroke:#1f1d1a,color:#1f1d1a
    classDef terminal fill:#e8efe5,stroke:#2f3a2c,color:#2f3a2c
    class reflect,tasks,setHL,done step
    class start,main terminal
```

Picking *migrate* on a task sets its status to `migrated` on yesterday and re-creates it as `open` on today, preserving the original creation date — that's how `migrateTask(yesterdayKey, taskId, todayKey)` is wired in `App.tsx:218`.

---

## 5. Lists side flow

Reference lists you can drag into a day to turn them into tasks.

```mermaid
flowchart LR
    open["click 'lists' in header"] --> panel["ListsPanel slides in"]
    panel --> add["type list name + Enter<br/>→ addList"]
    add --> items["type item content + Enter<br/>→ addItem"]
    items --> drag["grab item ⠿<br/>drag over a day"]
    drag --> drop["drop on DayDropZone"]
    drop --> created["addTask(date, item.content)<br/>removeItem(listId, itemId)"]
    created --> task(["task appears in DayView,<br/>item is gone from list"])

    classDef screen fill:#faf9f7,stroke:#1f1d1a,color:#1f1d1a
    classDef action fill:#e8efe5,stroke:#2f3a2c,color:#2f3a2c
    class panel,task screen
    class open,add,items,drag,drop,created action
```

The drop is detected by id prefix `day-drop-${date}` in the outer `DndContext` (`App.tsx:117-121`). The inner sortable context for tasks within a day uses a separate `DndContext` so reordering and list-drops don't collide.

---

## 6. Year Map side flow

A year-at-a-glance overlay for vacations, sprints, anything spanning multiple days.

```mermaid
flowchart TD
    open["click 'year map' in header"] --> overlay["YearMap overlay<br/>(month × day grid)"]
    overlay --> grp["addGroup(name, color)<br/>e.g. 'travel' (copper)"]
    grp --> cal["addCalendar(groupId, name)<br/>e.g. 'family trips'"]
    cal --> entry["addEntry(calendarId,<br/>start, end, label)"]
    entry --> shown(["colored bar spans<br/>days on the year grid"])
    overlay -. toggle .-> vis["toggleGroup / toggleCalendar<br/>→ filter visible entries"]

    classDef screen fill:#faf9f7,stroke:#1f1d1a,color:#1f1d1a
    classDef action fill:#e8efe5,stroke:#2f3a2c,color:#2f3a2c
    class overlay,shown screen
    class open,grp,cal,entry,vis action
```

Year Map data is local-only (key `bujo-yearmap`) — it is *not* synced to Supabase today. The 10-color palette and group/calendar/entry hierarchy is enforced by `useYearMap`.

---

## 7. Google Calendar (read-only)

Optional integration. Events appear inline in the DayView; the app never writes back to Google.

```mermaid
flowchart LR
    btn["footer: 'connect google'"] --> popup["OAuth popup<br/>(calendar.readonly)"]
    popup --> ok["edge fn: action=exchange<br/>tokens stored server-side"]
    ok --> connected(["status = connected"])
    connected -->|view a day| fetch["edge fn: action=events<br/>fetchEvents(date, date)"]
    fetch --> show["CalendarEvents card<br/>in DayView<br/>(time · title · location)"]
    connected -->|click 'disconnect'| revoke["edge fn: action=disconnect<br/>tokens deleted"]
    revoke --> dis(["status = disconnected"])

    classDef screen fill:#faf9f7,stroke:#1f1d1a,color:#1f1d1a
    classDef action fill:#e8efe5,stroke:#2f3a2c,color:#2f3a2c
    classDef state fill:#f4e7d8,stroke:#a35c2a,color:#3a2412
    class popup,show screen
    class btn,ok,fetch,revoke action
    class connected,dis state
```

Auto-fetch only fires when `currentZoom === 'day'` and `gcal.status === 'connected'` (`App.tsx:131-135`), so other zoom levels don't burn quota. The technical sequence (token refresh, edge function actions) is in [`architecture.md` §4](./architecture.md#4-google-calendar-oauth--events).

---

## 8. Highlight & reflection

The thing that makes this a *highlight* journal rather than a plain todo list.

```mermaid
flowchart LR
    empty["empty Highlight box<br/>'write one'"] -->|type + Enter| set
    empty -->|drag a task onto it| set
    set(["highlight set<br/>(yellow box, sun icon)"])
    set -->|edit / clear buttons| empty
    set --->|next morning,<br/>migration flow| reflect["rate it:<br/>👍 / 😑 / 👎<br/>+ optional note"]
    reflect --> stored(["reflection stored on<br/>highlight.reflection"])

    classDef screen fill:#faf9f7,stroke:#1f1d1a,color:#1f1d1a
    classDef action fill:#e8efe5,stroke:#2f3a2c,color:#2f3a2c
    class empty,set,stored screen
    class reflect action
```

Highlights exist independently at every zoom level (day / week / month / year), keyed `${level}-${date}`. Only the day-level highlight participates in the next-day reflection prompt.

---

## Component index

| Surface | Components |
|---|---|
| Entry / auth | `src/App.tsx`, `src/components/Auth/LoginPage.tsx` |
| Migration | `src/components/MigrationFlow/*` |
| Day view | `src/components/DayView/*`, `src/components/Highlight/*`, `src/components/TaskItem/*` |
| Day organization modes | `src/components/DayView/{ModeSelector,TimeEffortView,TimeBoxingView}.tsx` |
| Other zoom levels | `src/components/{Week,Month,Quarter,Year}View/*` |
| Task detail overlay | `src/components/TaskDetail/*` |
| Lists | `src/components/Lists/{ListsPanel,DayDropZone}.tsx` |
| Year Map | `src/components/YearMap/*` |
| Google Calendar | `src/components/CalendarEvents/*` |
| Layout shell (header / footer) | `src/components/Layout/Layout.tsx` |
| Zoom navigation | `src/components/ZoomNav/*` |
