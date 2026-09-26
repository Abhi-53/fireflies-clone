# Meeting Notes & Transcription Platform (Fireflies Clone)

## Technical Architecture Blueprint

**Stack:** Next.js (TypeScript) · FastAPI (Python) · SQLite **Scope:** ~24 hours of development. No application code in this document — architecture only.

---

## 0. MUST-HAVE vs OPTIONAL (read this first)

**MUST-HAVE (build these, in this order of priority):**

- Meetings library: list, search, filter, sort
- Meeting detail: transcript + speaker labels + timestamps + player area + seek sync
- Transcript search with highlighting
- AI Summary / Action Items / Topics (seeded or mocked)
- Full CRUD on meetings + action items
- Persistence for everything in SQLite
- Fireflies-like UI: navbar, panels, modals, toasts, settings placeholder

**OPTIONAL (only after all must-haves work and are demo-ready):**

- Comments/highlights/soundbites
- Export (PDF/MD/TXT)
- Global search
- Tags/topics filtering
- "Ask a question about this meeting" (LLM chat)
- Dark mode

**PLACEHOLDER ONLY (UI stub, no real implementation):**

- Live meeting bot, real STT, calendar/CRM/Zoom integrations, team collaboration, real auth

Treat the optional list as a backlog you cut from freely if time runs short. The evaluation weighs functionality, DB design, and API design more than bonus breadth.

---

## A. High-Level System Architecture

```
┌─────────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐        SQL         ┌─────────────┐
│   Next.js Frontend       │  ───────────────────►    │   FastAPI Backend         │  ───────────────►  │   SQLite    │
│   (TypeScript, App Router)│  ◄───────────────────    │   (Routers/Services/ORM)  │  ◄───────────────  │   (file DB) │
└─────────────────────────┘        REST API            └──────────────────────────┘                    └─────────────┘
        │                                                        │
        │  <video>/<audio> element                                │  Static file serving
        ▼                                                        ▼
  Local/sample media file                              /media or /static mount for
  played from public/ or                                uploaded/sample audio files
  streamed from backend
```

**Flow in one sentence:** the Next.js frontend never talks to SQLite directly — every read or write goes through a versioned REST API exposed by FastAPI, which owns all business logic and validation and is the only process that touches the SQLite file (via SQLAlchemy).

**Why this split:**

- Clean separation of concerns for the evaluation interview — you can explain "frontend renders and manages UI state, backend owns rules and persistence" in one sentence.
- SQLite is single-writer-friendly; funneling all writes through one FastAPI process avoids file-locking issues you'd hit from multiple direct DB clients.
- REST over JSON keeps the contract simple to mock, test with `curl`/Postman, and document with FastAPI's automatic OpenAPI/Swagger docs (free API documentation for your README).

**Request lifecycle (typical):**

1. User action in browser (click, type, navigate) triggers a fetch from a typed API client in the frontend.
2. Next.js server or client component calls `GET/POST/PATCH/DELETE /api/v1/...`.
3. FastAPI router validates request (Pydantic schema) → calls a service function → service calls the DB layer (SQLAlchemy session) → returns ORM objects.
4. Router serializes ORM objects to a Pydantic response schema → JSON back to client.
5. Frontend updates local/query cache state → re-renders.

---

## B. Frontend Architecture (Next.js + TypeScript)

### B.1 Pages / Routes (App Router)

```
/                          → redirect to /meetings
/meetings                  → Meetings Library / Dashboard
/meetings/[id]             → Meeting Detail (transcript + summary + action items)
/meetings/new               → Create Meeting (form / paste / upload transcript)
/settings                  → Settings placeholder ("Coming soon")
/search                    → (Optional) Global search results page
```

Meeting edit happens as a modal on `/meetings/[id]`, not a separate route (matches Fireflies' in-place editing feel and avoids extra routing complexity).

### B.2 Layout Structure

```
app/
 layout.tsx                → Root layout: <html>, global providers, ToastProvider
 (dashboard)/
   layout.tsx               → Shared shell: Navbar + Sidebar (nav items, profile/settings placeholder)
   meetings/
     page.tsx                → Library page
     new/page.tsx             → Create meeting page
     [id]/page.tsx            → Detail page (server component wrapper) → client components inside
   settings/page.tsx
```

- **Navbar**: logo, global search box (optional), profile avatar dropdown (placeholder), settings link.
- **Sidebar** (optional, Fireflies-style): "My Meetings", "Settings" — simple static nav, no dynamic workspace switching needed.

### B.3 Reusable Components (see also section H)

Organized under `components/`, grouped by feature: `meetings/`, `transcript/`, `summary/`, `action-items/`, `ui/` (generic building blocks: Button, Modal, Toast, Badge, SearchInput, Dropdown).

### B.4 State Management Approach

Keep it deliberately simple — do not reach for Redux/Zustand for a 24-hour assignment:

- **Server state (API data):** `@tanstack/react-query` (TanStack Query). Handles caching, loading/error states, and refetch-on-mutation for meetings list, meeting detail, action items. This alone removes 80% of the "state management" problem and is easy to explain in interview ("cache keyed by query, invalidate on mutation").
- **Local UI state:** plain `useState`/`useReducer` inside components — modal open/closed, active tab (Transcript/Summary), current player time, search query input.
- **Cross-cutting UI state** (toasts, global "current playback time" shared between player and transcript list on the same page): a small React Context (`PlayerSyncContext`) scoped to the meeting detail page only. No global app-wide store needed.

**Why not Redux:** the app has no complex cross-page shared state — everything either lives server-side (fetched per page) or is local to the detail page. Introducing Redux would be over-engineering per the assignment's explicit constraint.

### B.5 API Communication Approach

- A single typed API client module: `lib/api-client.ts` wrapping `fetch`, base URL from `NEXT_PUBLIC_API_URL` env var, with helper functions per resource (`getMeetings()`, `getMeeting(id)`, `createMeeting(payload)`, etc.) and shared error handling (throws a typed `ApiError`).
- TypeScript interfaces mirrored from backend Pydantic schemas live in `types/api.ts` (kept in sync manually — acceptable at this scale; mention in README as a known simplification vs. codegen).
- React Query hooks wrap the client: `useMeetings(filters)`, `useMeeting(id)`, `useCreateMeeting()`, `useUpdateActionItem()`, etc., in `hooks/api/`.
- Mutations call `queryClient.invalidateQueries` on success to refresh affected lists, and trigger a toast notification.

### B.6 Transcript ↔ Player Synchronization Approach

This is the trickiest interactive piece — design it explicitly:

1. Transcript segments are fetched once per meeting, each with `start_time_seconds` (and optionally `end_time_seconds`).
2. A `PlayerSyncContext` on the detail page holds `currentTime` (number, seconds) and a `seekTo(time)` function.
3. The `<MediaPlayer>` component:
    - Owns the actual `<audio>`/`<video>` element ref.
    - On `timeupdate` event, throttles updates (e.g., every 250ms) and writes `currentTime` into context.
    - Exposes `seekTo(time)` which sets `audioRef.current.currentTime = time` and calls `.play()` if desired.
4. The `<TranscriptPanel>`:
    - Reads `currentTime` from context, computes the "active segment" as the last segment whose `start_time_seconds <= currentTime` (simple linear scan is fine for meeting-length transcripts; no need to over-optimize).
    - Applies a highlighted style to that segment and auto-scrolls it into view (`scrollIntoView({ block: 'center', behavior: 'smooth' })`), guarded so user-initiated manual scrolling isn't fought (e.g., pause auto-scroll briefly on manual scroll).
    - Each `<TranscriptLine>` has an `onClick` that calls `seekTo(line.start_time_seconds)` from context.

This keeps the sync logic in one small context instead of prop-drilling or a heavier state library, and is easy to narrate in an interview: "context is the single source of truth for playback position; player writes to it, transcript reads from it."

### B.7 Search / Filter Architecture

**Meetings library search/filter:**

- Controlled inputs (search text, date range, participant) held in local component state, debounced (~300ms) before being sent as query params to `GET /api/v1/meetings?search=&participant=&date_from=&date_to=&sort=recent`.
- Filtering/sorting is done **server-side** (SQL `WHERE`/`ORDER BY`) — not client-side — since it's the backend's job to query the DB efficiently and it keeps behavior consistent with pagination.
- React Query key includes the filter params (`['meetings', filters]`) so each distinct filter combination is cached independently.

**Transcript search (within one meeting):**

- Transcript for a meeting is already fully loaded client-side (it's not paginated — a meeting's transcript is a bounded, already-fetched list).
- Search is done **client-side**: filter the in-memory segment array for a case-insensitive substring match, highlight matches with a `<mark>`-wrapped substring render helper, and provide "next/previous match" navigation via an index into matched segment IDs, plus `scrollIntoView` on navigation.
- Rationale: avoids a round-trip per keystroke for data already in memory; keeps the feature snappy.

**Optional global search** (bonus): a dedicated `GET /api/v1/search?q=` backend endpoint querying across meeting titles + transcript text + summaries, returning grouped results — only build after must-haves are solid.

---

## C. Backend Architecture (FastAPI)

### C.1 High-Level Structure

```
backend/
 app/
   main.py                  → FastAPI app instance, CORS, router mounting, startup (seed check)
   core/
     config.py                → Settings (env vars, DB path, CORS origins) via pydantic-settings
     database.py              → SQLAlchemy engine, SessionLocal, Base, get_db() dependency
   models/                    → SQLAlchemy ORM models (one file per table or grouped logically)
     meeting.py
     participant.py
     transcript.py
     speaker.py
     summary.py
     action_item.py
     topic.py
   schemas/                   → Pydantic request/response schemas (mirrors models, adds validation)
     meeting.py
     transcript.py
     action_item.py
     ...
   routers/                   → Thin HTTP layer: parse request, call service, return response
     meetings.py
     transcripts.py
     action_items.py
     summaries.py
     search.py
   services/                  → Business logic, orchestrates DB calls, independent of HTTP
     meeting_service.py
     transcript_service.py
     action_item_service.py
     seed_service.py
   db/
     seed_data/                → JSON/Python seed fixtures (sample meetings/transcripts)
     seed.py                   → Script/function to populate DB on first run
   utils/
     exceptions.py             → Custom exception classes (NotFoundError, ValidationError)
     pagination.py
 tests/
   test_meetings.py
   test_action_items.py
 requirements.txt
 alembic/ (optional)          → Only if you want migrations; for 24h scope, simpler to
                                  create tables via SQLAlchemy metadata.create_all() at startup
```

### C.2 Layering Rationale

- **Routers** stay thin: parse/validate input (FastAPI + Pydantic does most of this automatically), call one service function, map result/errors to HTTP responses. No SQL or business rules here — this is what you'll point to in interview as "separation of concerns."
- **Services** contain the actual logic: e.g., `create_meeting()` validates participant list, creates `Meeting` + associated `Participant` rows in a transaction, and returns the created object. Services accept a `Session` (DB session) as a parameter and are framework-agnostic (no FastAPI imports) — this makes them independently testable.
- **Models** are pure SQLAlchemy ORM classes mapping to tables (Section D).
- **Schemas** are pure Pydantic classes for input validation and output serialization — kept separate from ORM models so API contracts can differ from DB structure (e.g., a `MeetingListItem` schema that omits full transcript for the library view).

### C.3 Routers (endpoint groups) — see Section E for full endpoint list

- `routers/meetings.py` — CRUD + list/search/filter
- `routers/transcripts.py` — get transcript, upload/paste transcript, transcript search (if server-assisted)
- `routers/summaries.py` — get/regenerate summary & topics
- `routers/action_items.py` — CRUD + complete/toggle
- `routers/search.py` — optional global search

All mounted under `/api/v1` prefix via `APIRouter(prefix="/api/v1/meetings", tags=["meetings"])` etc., included in `main.py`.

### C.4 Database Layer

- SQLAlchemy (Core+ORM) with a synchronous engine — sufficient for SQLite and simpler to reason about than async SQLAlchemy for a 24h assignment (`sqlite:///./data/app.db`, `check_same_thread=False`).
- `get_db()` FastAPI dependency yields a session per request and closes it in a `finally` block.
- Foreign keys enforced via `PRAGMA foreign_keys=ON` set on connection (SQLite disables FK enforcement by default).
- All ORM classes inherit `Base`; `Base.metadata.create_all(engine)` runs at startup if tables don't exist, followed by a seed check (Section I).

### C.5 Error Handling

- Custom exceptions in `utils/exceptions.py`: `NotFoundError`, `ValidationConflictError`.
- A FastAPI exception handler (`@app.exception_handler(NotFoundError)`) maps these to consistent JSON error responses:
  ```json
  { "error": { "code": "MEETING_NOT_FOUND", "message": "Meeting with id 42 does not exist." } }
  ```
- Pydantic validation errors are handled automatically by FastAPI → HTTP 422 with field-level detail (no custom code needed, but document the shape in the README).
- A catch-all handler for unexpected exceptions returns HTTP 500 with a generic message and logs the stack trace server-side (never leak internals to the client).

### C.6 Validation

- Request bodies validated declaratively via Pydantic schemas (e.g., `title: str = Field(min_length=1, max_length=200)`, `participants: list[str] = Field(min_items=1)`).
- Path/query params validated via FastAPI's typed function signatures (`meeting_id: int`, `search: str | None = None`).
- Cross-field/business validation (e.g., "action item due date can't be before meeting date") lives in the service layer, raising typed exceptions caught by the handlers above.

---

## D. Database Schema (SQLite)

### Entity-Relationship Overview

```
meetings 1───* meeting_participants *───1 participants
meetings 1───* transcript_segments *───1 speakers   (speakers scoped per meeting)
meetings 1───1 summaries
meetings 1───* action_items
meetings 1───* topics
```

### D.1 `meetings`

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |  |
| title | TEXT | NOT NULL |  |
| meeting_date | TEXT | NOT NULL | ISO-8601 datetime string (SQLite has no native datetime type) |
| duration_seconds | INTEGER | NOT NULL DEFAULT 0 | Used for library display and player duration |
| media_url | TEXT | NULL | Path/URL to sample audio/video file (placeholder media) |
| created_at | TEXT | NOT NULL DEFAULT (CURRENT_TIMESTAMP) |  |
| updated_at | TEXT | NOT NULL DEFAULT (CURRENT_TIMESTAMP) | Updated on every edit |

**Indexes:** `idx_meetings_date` on `meeting_date` (sorting by recency); `idx_meetings_title` on `title` (search). **Why:** the root entity everything else hangs off; kept lean (denormalized `duration_seconds` avoids recomputing from transcript on every list load).

### D.2 `participants`

| Column | Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL UNIQUE |
| email | TEXT | NULL |

**Why a separate table instead of a text column on `meetings`:** enables filtering meetings *by participant* (a required feature) without string-matching a comma-separated blob, and avoids duplicating participant identity across meetings.

### D.3 `meeting_participants` (join table)

| Column | Type | Constraints |
| --- | --- | --- |
| meeting_id | INTEGER | NOT NULL, FK → meetings(id) ON DELETE CASCADE |
| participant_id | INTEGER | NOT NULL, FK → participants(id) ON DELETE CASCADE |
| PRIMARY KEY | (meeting_id, participant_id) | composite |

**Indexes:** `idx_mp_participant` on `participant_id` (fast "filter meetings by participant"). **Why:** classic many-to-many resolution — a participant attends many meetings, a meeting has many participants.

### D.4 `speakers`

| Column | Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| meeting_id | INTEGER | NOT NULL, FK → meetings(id) ON DELETE CASCADE |
| name | TEXT | NOT NULL |
| color_hex | TEXT | NULL — for UI label coloring, e.g. "#4F46E5" |

**Indexes:** `idx_speakers_meeting` on `meeting_id`. **Why scoped per-meeting rather than reusing `participants`:** a transcript's "Speaker 1/Speaker 2" labels are diarization artifacts that may not map 1:1 to known participants (mirrors how Fireflies actually labels transcripts before you rename speakers). Keeping `speakers` separate from `participants` avoids forcing a fragile identity match; you can optionally add a nullable `participant_id` FK on `speakers` later if you want to link a speaker label to a real participant — worth mentioning as a documented simplification in the README.

### D.5 `transcript_segments`

| Column | Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| meeting_id | INTEGER | NOT NULL, FK → meetings(id) ON DELETE CASCADE |
| speaker_id | INTEGER | NOT NULL, FK → speakers(id) ON DELETE CASCADE |
| start_time_seconds | REAL | NOT NULL |
| end_time_seconds | REAL | NULL |
| text | TEXT | NOT NULL |
| sequence_index | INTEGER | NOT NULL |

**Indexes:** `idx_segments_meeting` on `meeting_id`; `idx_segments_meeting_seq` on `(meeting_id, sequence_index)` (ordered retrieval); optionally `idx_segments_meeting_time` on `(meeting_id, start_time_seconds)` for the "find active segment at time T" query if you ever move that logic server-side. **Why:** the core content table — one row per spoken line, driving both the transcript panel and the player-sync feature. `sequence_index` guards against ties in `start_time_seconds`.

### D.6 `summaries`

| Column | Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| meeting_id | INTEGER | NOT NULL UNIQUE, FK → meetings(id) ON DELETE CASCADE |
| overview_text | TEXT | NOT NULL |
| generated_at | TEXT | NOT NULL DEFAULT (CURRENT_TIMESTAMP) |

**Why one-to-one, own table (not a column on `meetings`):** keeps `meetings` lean for list queries (which never need the full summary text), and models the real domain fact that a summary is a distinct generated artifact tied to a meeting, separate from topics/action items which are collections.

### D.7 `topics` (key topics / outline / chapters)

| Column | Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| meeting_id | INTEGER | NOT NULL, FK → meetings(id) ON DELETE CASCADE |
| title | TEXT | NOT NULL |
| start_time_seconds | REAL | NULL |
| order_index | INTEGER | NOT NULL |

**Indexes:** `idx_topics_meeting` on `meeting_id`. **Why:** modeled as a list (a meeting typically has several topics/chapters), separate from `summaries` since it's a 1-to-many collection, not a single blob — and giving it a `start_time_seconds` lets it double as a chapter marker that seeks the player, reusing existing sync logic for free.

### D.8 `action_items`

| Column | Type | Constraints |
| --- | --- | --- |
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| meeting_id | INTEGER | NOT NULL, FK → meetings(id) ON DELETE CASCADE |
| text | TEXT | NOT NULL |
| assignee | TEXT | NULL |
| is_completed | INTEGER | NOT NULL DEFAULT 0 |
| due_date | TEXT | NULL |
| created_at | TEXT | NOT NULL DEFAULT (CURRENT_TIMESTAMP) |

**Indexes:** `idx_action_items_meeting` on `meeting_id`. **Why:** straightforward 1-to-many off `meetings`; `is_completed` as an integer flag keeps toggling trivial (`PATCH` sets 0/1).

### D.9 Cascade & Integrity Summary

All child tables use `ON DELETE CASCADE` back to `meetings`, so deleting a meeting cleanly removes its participants-link rows, speakers, transcript segments, summary, topics, and action items in one operation — this is the behavior to point to when explaining "deletion" in the interview. `participants` itself is **not** cascade-deleted (a participant may exist independent of any single meeting — only the join row is removed).

### D.10 Full DDL Sketch

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  meeting_date TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  media_url TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
CREATE INDEX idx_meetings_date ON meetings(meeting_date);
CREATE INDEX idx_meetings_title ON meetings(title);

CREATE TABLE participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  email TEXT
);

CREATE TABLE meeting_participants (
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  PRIMARY KEY (meeting_id, participant_id)
);
CREATE INDEX idx_mp_participant ON meeting_participants(participant_id);

CREATE TABLE speakers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color_hex TEXT
);
CREATE INDEX idx_speakers_meeting ON speakers(meeting_id);

CREATE TABLE transcript_segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
  start_time_seconds REAL NOT NULL,
  end_time_seconds REAL,
  text TEXT NOT NULL,
  sequence_index INTEGER NOT NULL
);
CREATE INDEX idx_segments_meeting_seq ON transcript_segments(meeting_id, sequence_index);

CREATE TABLE summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
  overview_text TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time_seconds REAL,
  order_index INTEGER NOT NULL
);
CREATE INDEX idx_topics_meeting ON topics(meeting_id);

CREATE TABLE action_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  assignee TEXT,
  is_completed INTEGER NOT NULL DEFAULT 0,
  due_date TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
CREATE INDEX idx_action_items_meeting ON action_items(meeting_id);
```

---

## E. REST API Design

Base path: `/api/v1`. All bodies/responses are JSON. All list endpoints support pagination via `?limit=&offset=` (defaults `limit=20`).

### Meetings

| Method | URL | Purpose | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | /meetings | List/search/filter/sort meetings | Query: search, participant, date_from, date_to,
 sort=recent, limit, offset | { items: MeetingListItem[], total: number } | 422 invalid params |
| GET | /meetings/{id} | Get meeting detail (metadata + participants; transcript/summary fetched separately) | — | MeetingDetail | 404 not found |
| POST | /meetings | Create meeting (form, or paste/upload transcript) | { title, meeting_date, participants: string[], media_url?, transcript_text?: string } | MeetingDetail (201) | 422 validation |
| PATCH | /meetings/{id} | Edit metadata (title, participants, date) | { title?, meeting_date?, participants?: string[] } | MeetingDetail | 404, 422 |
| DELETE | /meetings/{id} | Delete meeting (cascades) | — | 204 No Content | 404 |

### Transcript

| Method | URL | Purpose | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | /meetings/{id}/transcript | Get full ordered transcript with speakers | — | { segments: TranscriptSegment[], speakers: Speaker[] } | 404 |
| POST | /meetings/{id}/transcript | Upload/paste transcript (replaces existing) | { raw_text?: string } or multipart file upload
 (.txt/.vtt/.json) | { segments: TranscriptSegment[] } (201) | 404, 422 unparsable format |
| GET | /meetings/{id}/transcript/search | (Optional) server-assisted search if not done client-side | Query: q | { matches: {segment_id, snippet}[] } | 404 |

### Summary & Topics

| Method | URL | Purpose | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | /meetings/{id}/summary | Get summary + topics | — | { summary: Summary, topics: Topic[] } | 404 |
| POST | /meetings/{id}/summary/regenerate | (Optional) regenerate mock/LLM summary from transcript | — | { summary: Summary, topics: Topic[] } | 404, 500 (LLM failure) |

### Action Items

| Method | URL | Purpose | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | /meetings/{id}/action-items | List action items for a meeting | — | ActionItem[] | 404 |
| POST | /meetings/{id}/action-items | Create action item | { text, assignee?, due_date? } | ActionItem (201) | 404, 422 |
| PATCH | /action-items/{item_id} | Edit text/assignee/due date | { text?, assignee?, due_date? } | ActionItem | 404, 422 |
| PATCH | /action-items/{item_id}/complete | Toggle completion | { is_completed: boolean } | ActionItem | 404 |
| DELETE | /action-items/{item_id} | Delete action item | — | 204 | 404 |

### Optional / Bonus

| Method | URL | Purpose |
| --- | --- | --- |
| GET | /search?q= | Global search across meeting titles, transcripts, summaries |
| GET | /meetings/{id}/export?format=pdf\|md\|txt | Export transcript/summary |
| POST | /meetings/{id}/ask | Ask-a-question chat over meeting content (LLM) |

### Standard Error Shape (all endpoints)

```json
{ "error": { "code": "MEETING_NOT_FOUND", "message": "Meeting with id 42 does not exist." } }
```

- `404` → resource missing
- `422` → validation failure (FastAPI's default Pydantic shape is acceptable too — document whichever you pick, consistently)
- `500` → unexpected server error

---

## F. Frontend ↔ Backend Data Flow

1. **Loading meetings** — `/meetings` page mounts → `useMeetings({})` (React Query) fires `GET /meetings` → FastAPI `meeting_service.list_meetings()` queries `meetings` (+ joined participants) ordered by `meeting_date DESC` → response cached client-side, rendered as a list/grid.
2. **Searching meetings** — user types in search box → debounced → query param `search` updates → React Query key changes → new `GET /meetings?search=...` → backend does `WHERE title LIKE '%...%' OR EXISTS(...transcript match...)` (title match is required; transcript match is a nice-to-have extension) → new results replace old.
3. **Filtering meetings** — same mechanism as search; `participant` filter joins through `meeting_participants`; `date_from`/`date_to` filter on `meeting_date` range; filters combine with `AND`.
4. **Opening a meeting** — navigate to `/meetings/[id]` → three parallel fetches: `GET /meetings/{id}`, `GET /meetings/{id}/transcript`, `GET /meetings/{id}/summary` (and action items) → each rendered into its panel; loading skeletons shown until resolved.
5. **Searching transcript** — handled entirely client-side against the already-fetched segment array (Section B.7); no network call per keystroke.
6. **Clicking transcript line → player seeks** — `TranscriptLine.onClick` → `seekTo(start_time_seconds)` from `PlayerSyncContext` → sets `<audio>.currentTime` → player emits `timeupdate` → context's `currentTime` updates → transcript re-highlights the (now-active) same line, confirming the loop.
7. **Player timestamp → transcript highlights** — on every throttled `timeupdate`, context `currentTime` updates → `TranscriptPanel` recomputes active segment (`segments.findLast(s => s.start_time_seconds <= currentTime)`) → applies highlight class → auto-scrolls into view.
8. **Creating a meeting** — form/paste/upload on `/meetings/new` → `POST /meetings` (and if transcript pasted/uploaded, either included in the same payload or a follow-up `POST /meetings/{id}/transcript`) → backend parses transcript text into segments (simple line-based parser: `[HH:MM:SS] Speaker: text` format, documented in README) + creates/links participants + creates placeholder or seeded summary → on success, redirect to `/meetings/{id}` + toast "Meeting created."
9. **Editing a meeting** — edit modal on detail page → `PATCH /meetings/{id}` with changed fields → on success, invalidate `['meeting', id]` and `['meetings']` queries → toast "Meeting updated."
10. **Deleting a meeting** — confirm dialog → `DELETE /meetings/{id}` → cascade removes all child rows → invalidate `['meetings']` list query → redirect to `/meetings` → toast "Meeting deleted."
11. **Creating/editing/completing action item** — inline "Add action item" form or checkbox toggle in `ActionItemsPanel` → `POST /meetings/{id}/action-items`, `PATCH /action-items/{id}`, or `PATCH /action-items/{id}/complete` respectively → optimistic UI update (checkbox flips immediately) with React Query `onMutate`, rolled back on error → invalidate `['action-items', meetingId]` on settle.

---

## G. Project Folder Structure

```
fireflies-clone/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── meetings/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── settings/page.tsx
│   ├── components/
│   │   ├── ui/                 (Button, Modal, Toast, Badge, SearchInput, Dropdown, Tabs)
│   │   ├── layout/              (Navbar, Sidebar)
│   │   ├── meetings/            (MeetingCard, MeetingList, MeetingFilters, MeetingForm)
│   │   ├── transcript/          (TranscriptPanel, TranscriptLine, MediaPlayer, SeekBar, TranscriptSearchBar)
│   │   ├── summary/              (SummaryPanel, TopicsList)
│   │   └── action-items/        (ActionItemList, ActionItemRow, ActionItemForm)
│   ├── hooks/
│   │   └── api/                 (useMeetings.ts, useMeeting.ts, useActionItems.ts, ...)
│   ├── lib/
│   │   ├── api-client.ts
│   │   └── format.ts            (time formatting helpers, etc.)
│   ├── context/
│   │   └── PlayerSyncContext.tsx
│   ├── types/
│   │   └── api.ts
│   ├── public/
│   │   └── sample-media/        (placeholder audio/video files)
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/ (config.py, database.py)
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── db/
│   │   │   ├── seed_data/
│   │   │   └── seed.py
│   │   └── utils/
│   ├── tests/
│   ├── data/
│   │   └── app.db                (SQLite file, gitignored, generated on first run)
│   ├── requirements.txt
│   └── .env.example
│
├── README.md
└── .gitignore
```

---

## H. Component Structure (Frontend)

| Component | Responsibility |
| --- | --- |
| Navbar | Logo, global search input, profile/settings placeholder dropdown |
| MeetingList | Renders MeetingCard[], handles empty/loading states |
| MeetingCard | Displays one meeting's title, date, duration, participant avatars; links to detail |
| MeetingFilters | Search box + date range + participant dropdown + sort control; emits filter state up |
| MeetingForm | Create/edit form: title, date, participants (tag input), paste/upload transcript |
| MediaPlayer | Owns <audio>/<video> element, seek bar, play/pause, writes
 currentTime to PlayerSyncContext |
| TranscriptPanel | Renders TranscriptLine[], computes/highlights active line from context, auto-scroll |
| TranscriptLine | One speaker turn: avatar/initial, speaker name, timestamp, text; onClick seeks player |
| TranscriptSearchBar | In-panel search input + match counter + next/prev navigation |
| SummaryPanel | Renders AI summary paragraph |
| TopicsList | Renders topic/chapter list, each clickable to seek player (reuses sync context) |
| ActionItemList | Renders ActionItemRow[], "Add item" trigger |
| ActionItemRow | Checkbox (complete toggle), text, assignee, due date, edit/delete affordances |
| Modal | Generic accessible modal shell used by create/edit/delete-confirm dialogs |
| Toast / ToastProvider | Global notification system for success/error feedback on mutations |
| Tabs | Switches between Transcript / Summary / Action Items panels on the detail page |

---

## I. Database Seeding Strategy

- A `db/seed_data/` directory holds **3–5 realistic meeting fixtures** as structured JSON (or Python dicts), each including: meeting metadata, participant names, a full multi-speaker transcript (20–60 lines is enough to demo scrolling/search/sync convincingly), a summary paragraph, 3–5 topics with timestamps, and 3–6 action items (mix of completed/incomplete, with/without assignee).
- `db/seed.py` exposes `seed_if_empty(session)`: checks `SELECT COUNT(*) FROM meetings`; if zero, inserts fixtures via the ORM (reusing the same service functions the API uses, e.g., `meeting_service.create_meeting(...)`, so seeding exercises the same code path as real creation — a good interview talking point: "seeding isn't special-cased, it calls the same service layer").
- Called once at FastAPI startup (`@app.on_event("startup")` or lifespan handler), so `git clone` → `pip install` → `uvicorn app.main:app` yields an immediately usable app with no manual steps — document this explicitly in the README.
- Vary meeting dates across the fixtures (some this week, some last month) so the recency sort and date-range filter are visibly testable.
- Include realistic touches Fireflies shows: varied speaker counts (2–5), at least one long meeting and one short one, at least one meeting with zero action items (empty-state check), and duration values that make the player/seek bar meaningful.

---

## J. Deployment Architecture

Kept simple and free-tier-friendly, matching the stack:

```
┌────────────────────┐        ┌───────────────────────────┐
│  Vercel             │  API   │  Render / Railway          │
│  (Next.js frontend) │ ─────► │  (FastAPI backend +        │
│                     │        │   SQLite file on disk)     │
└────────────────────┘        └───────────────────────────┘
```

- **Frontend → Vercel**: native Next.js support, set `NEXT_PUBLIC_API_URL` env var to the deployed backend URL, CORS on the backend allows the Vercel origin.
- **Backend → Render or Railway**: both support a plain `uvicorn app.main:app --host 0.0.0.0 --port $PORT` Python web service; attach a small persistent disk (Render's "Disk" feature / Railway volume) mounted at `backend/data/` so the SQLite file survives restarts/deploys — call this out explicitly in the README since SQLite on an ephemeral filesystem loses data on redeploy otherwise.
- **Media files**: ship sample audio/video inside the repo (`frontend/public/sample-media/` or served statically by FastAPI via `StaticFiles` mount) rather than a separate object-storage service — keeps infra to two services total, appropriate for this scope.
- **Environment variables**: `NEXT_PUBLIC_API_URL` (frontend), `DATABASE_URL`/`CORS_ORIGINS` (backend), documented in `.env.example` files in both folders.
- **Optional LLM bonus feature**: if implemented, an `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` env var on the backend only (never exposed to frontend).

This avoids introducing Docker/Kubernetes/managed Postgres/CDN config — all unnecessary for a 24-hour, SQLite-based assignment, per the "avoid over-engineering" constraint.

---

## K. Recommended Development Order

1. **Project initialization** — scaffold `frontend/` (`create-next-app` with TS + Tailwind) and `backend/` (FastAPI + SQLAlchemy + Pydantic + Uvicorn), set up `.gitignore`, root README skeleton, CORS wired early so the two can talk from day one.
2. **Database** — write SQLAlchemy models exactly matching Section D, run `create_all()`, write 1–2 seed fixtures, verify by inspecting `app.db` with a SQLite browser or `sqlite3` CLI.
3. **Backend** — build routers/services/schemas for Meetings CRUD first, then Transcript, then Summary/Topics, then Action Items, in that priority order; verify every endpoint via FastAPI's auto-generated `/docs` (Swagger UI) before touching the frontend at all.
4. **Frontend (static/mock first)** — build the Meetings Library and Meeting Detail UI against hard-coded/mock JSON first (fast iteration on layout/Fireflies look-and-feel without waiting on API wiring), using the component list in Section H.
5. **Integration** — swap mock data for real `fetch`/React Query calls via `lib/api-client.ts`; wire up create/edit/delete forms and modals to real mutations; implement the transcript↔player sync last among "integration" tasks since it depends on both panels already rendering real data.
6. **Testing** — a handful of backend unit tests on services (`test_meetings.py`, `test_action_items.py` using FastAPI's `TestClient` + a temp SQLite file per test run) covering CRUD happy paths and 404 cases; manual click-through test script for the frontend (documented in README as your test plan, given time constraints).
7. **Deployment** — deploy backend first (Render/Railway), confirm `/docs` works publicly, then deploy frontend (Vercel) pointed at the live backend URL, do a final end-to-end smoke test on the deployed links, then finish the README (setup, architecture summary, schema, API overview, assumptions) and submit both links.

**Suggested time budget (24h total):** ~1h init, ~4h DB+backend CRUD, ~2h remaining backend (summary/action items/seed), ~6h frontend UI (Fireflies look), ~4h integration incl. transcript/player sync, ~2h polish (toasts, empty/error states, modals), ~2h testing/bugfix, ~1h deploy, ~2h README + buffer. Cut bonus features first if you're behind schedule — the evaluation prioritizes must-haves, DB design, and API design over bonus breadth.