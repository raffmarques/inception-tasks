# Architecture

Visual reference for how **bujo** is wired together: the runtime, the hooks, the storage layers, and the external services. All diagrams use [Mermaid](https://mermaid.js.org/) and render natively on GitHub.

> Companion doc: [`user-flow.md`](./user-flow.md) — how a user moves through the app.

---

## 1. System context

What runs where, and how the pieces talk to each other.

```mermaid
flowchart LR
    user(["User"])

    subgraph browser["Browser (PWA)"]
        react["React 19 + TypeScript<br/>App.tsx + hooks + components"]
        sw["Service Worker<br/>(vite-plugin-pwa / Workbox)"]
        ls[("localStorage<br/>bujo-days, bujo-highlights,<br/>bujo-lists, bujo-day-org,<br/>bujo-yearmap")]
    end

    subgraph supabase["Supabase"]
        auth["Auth<br/>(email + password)"]
        db[("Postgres<br/>tasks · highlights · days<br/>google_tokens")]
        ef["Edge Function<br/>google-calendar"]
    end

    google["Google Calendar API<br/>(calendar.readonly)"]
    vercel["Vercel<br/>build + host"]
    gh["GitHub<br/>raffmarques/inception-tasks"]

    user -->|opens app| react
    react <-->|cache, offline| ls
    react <-->|register / update| sw
    react <-->|sign in / out| auth
    react <-->|pull / upsert / soft-delete| db
    react -->|invoke| ef
    ef -->|OAuth + events| google
    ef <--> db

    gh -->|push to main / dev| vercel
    vercel -->|serves PWA| browser

    classDef storage fill:#e8efe5,stroke:#2f3a2c,color:#2f3a2c
    classDef external fill:#f4e7d8,stroke:#a35c2a,color:#3a2412
    classDef primary fill:#faf9f7,stroke:#1f1d1a,color:#1f1d1a
    class ls,db storage
    class google,vercel,gh,auth,ef external
    class react,sw primary
```

The PWA is **offline-first**: all writes hit `localStorage` immediately and React re-renders from there. Supabase is a sync target, not the source of truth at runtime — if `VITE_SUPABASE_URL` is unset the app runs as a pure local app with no login. Google Calendar is reached only through the `google-calendar` Edge Function so client-side code never holds OAuth secrets.

---

## 2. Frontend hook graph

`App.tsx` is the wiring harness. Each domain lives in its own custom hook, and most state ultimately lands in `localStorage` via `useLocalStorage`.

```mermaid
flowchart TD
    app["App.tsx<br/>auth gate · migration check<br/>DndContext · view router"]

    useAuth["useAuth<br/>session, signIn/Up/Out"]
    useTasks["useTasks<br/>CRUD · cycle · migrate · reorder"]
    useHighlights["useHighlights<br/>day/week/month/year · reflection"]
    useNavigation["useNavigation<br/>currentDate · zoom"]
    useSync["useSync<br/>pull · push (debounce 500ms)"]
    useDayOrg["useDayOrganization<br/>manual · time-effort · time-boxing"]
    useLists["useLists<br/>named lists + items"]
    useYearMap["useYearMap<br/>groups · calendars · entries"]
    useGcal["useGoogleCalendar<br/>OAuth popup · events"]
    useNotif["useNotifications<br/>deadline + offset"]

    useLS[("useLocalStorage<br/>generic JSON wrapper")]
    sb[("Supabase client<br/>src/lib/supabase.ts")]
    mappers["syncMappers.ts<br/>taskToRow · mergeDays · mergeHighlights"]

    app --> useAuth
    app --> useTasks
    app --> useHighlights
    app --> useNavigation
    app --> useSync
    app --> useDayOrg
    app --> useLists
    app --> useYearMap
    app --> useGcal
    app --> useNotif

    useTasks --> useLS
    useHighlights --> useLS
    useDayOrg --> useLS
    useLists --> useLS
    useYearMap --> useLS

    useAuth --> sb
    useSync --> useTasks
    useSync --> useHighlights
    useSync --> mappers
    useSync --> sb
    useGcal --> sb
    useNotif -->|window.Notification| ext["Browser notification API"]

    classDef hook fill:#faf9f7,stroke:#1f1d1a,color:#1f1d1a
    classDef storage fill:#e8efe5,stroke:#2f3a2c,color:#2f3a2c
    classDef external fill:#f4e7d8,stroke:#a35c2a,color:#3a2412
    class app,useAuth,useTasks,useHighlights,useNavigation,useSync,useDayOrg,useLists,useYearMap,useGcal,useNotif,mappers hook
    class useLS,sb storage
    class ext external
```

Two things to notice. First, `useSync` is the only module that holds references to *both* the local domain hooks and the Supabase client — every other hook is unaware that Supabase exists. Second, `useNavigation` is pure UI state (no persistence): refreshing the page returns you to today.

---

## 3. Data sync sequence (localStorage ↔ Supabase)

How a single edit propagates from the UI to the cloud, and how a remote change comes back.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant H as Hook (e.g. useTasks)
    participant LS as localStorage
    participant S as useSync
    participant SB as Supabase (tasks/highlights/days)

    Note over U,SB: Write path (debounced push)
    U->>H: edit task
    H->>H: setState
    H->>LS: write JSON
    H-->>S: state change observed
    S->>S: debounce 500ms
    S->>SB: upsert task/day/highlight rows<br/>(chunks of 500, onConflict: id / user_id+key)
    S->>SB: update {deleted:true} for removed ids
    SB-->>S: ack
    S-->>U: syncStatus = idle

    Note over U,SB: Read path (pull on auth / online / focus)
    U->>S: sign in / tab visible / online event
    S->>SB: select * where user_id = me
    SB-->>S: rows
    S->>S: mergeDays / mergeHighlights<br/>(last-write-wins on updated_at)
    S->>LS: write merged state via setDays/setHighlights
    S-->>U: syncStatus = idle
```

Pushes are batched and deletes are *soft* — rows get `deleted: true` rather than being removed, so a future client that comes online late can still detect the deletion. The 500ms debounce coalesces rapid edits (typing, dragging) into a single round-trip.

---

## 4. Google Calendar OAuth + events

The browser never sees Google's client secret. The `google-calendar` Edge Function brokers the OAuth exchange and refresh, and stores tokens in the `google_tokens` table.

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant App as PWA
    participant Pop as OAuth popup
    participant EF as Edge: google-calendar
    participant T as Supabase: google_tokens
    participant G as Google APIs

    Note over U,G: Connect
    U->>App: click "connect google"
    App->>Pop: open Google consent (calendar.readonly)
    Pop->>G: authorize
    G-->>Pop: redirect with auth code
    Pop-->>App: postMessage(code)
    App->>EF: action=exchange { code, redirect_uri }
    EF->>G: exchange code → tokens
    G-->>EF: access_token + refresh_token + expires_in
    EF->>T: upsert { user_id, refresh_token, access_token, expires_at }
    EF-->>App: ok

    Note over U,G: Fetch events (per visible day)
    App->>EF: action=events { date_min, date_max }
    EF->>T: read tokens
    alt expires_at < now + 5min
        EF->>G: refresh_token grant
        G-->>EF: new access_token + expires_in
        EF->>T: update access_token + expires_at
    end
    EF->>G: GET /calendar/v3/calendars/primary/events
    G-->>EF: events
    EF-->>App: events[]

    Note over U,G: Disconnect
    U->>App: click "disconnect"
    App->>EF: action=disconnect
    EF->>T: delete row
    EF-->>App: ok
```

The 5-minute buffer on `expires_at` avoids the race where a token is accepted by us but expires mid-request at Google. The same Edge Function handles all three actions so the client only ever calls one endpoint.

---

## File index

| Concern | File |
|---|---|
| App composition, auth gate, migration check | `src/App.tsx` |
| Sync loop (pull / push / debounce / reconnect) | `src/hooks/useSync.ts` |
| Row mappers + merge functions | `src/utils/syncMappers.ts` |
| Supabase client | `src/lib/supabase.ts` |
| Google Calendar hook | `src/hooks/useGoogleCalendar.ts` |
| Google Calendar Edge Function | `supabase/functions/google-calendar/index.ts` |
| DB schema migrations | `supabase/migrations/*.sql` |
| PWA + build config | `vite.config.ts` |
| Type definitions | `src/types/index.ts` |
