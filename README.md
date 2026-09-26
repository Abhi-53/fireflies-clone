# MeetFlow — Meeting Notes & Transcription Platform (Fireflies Clone)

An end-to-end, AI-powered meeting transcription, summary, and action item tracking platform built with **Next.js (TypeScript)**, **FastAPI (Python)**, and **SQLite**.

---

## Important Notes

### UI Design Reference
The frontend user interface is designed to closely resemble the **Fireflies.ai** visual design language. The Fireflies UI/UX was studied extensively as a visual design reference, incorporating:
- **Dark Theme & Obsidian Palette**: Deep obsidian canvases (`#0d0e12`), dark elevated surface cards (`#111217`, `#14151e`), and popovers (`#1a1b26`).
- **Signature Accents**: Electric violet accents (`#6E44FF` / `#7c4ee6`), subtle purple tinted active pills (`#241a4a`), and emerald green AI indicators (`#10b981` / `#34d399`).
- **Typography & Proportions**: Clean typography hierarchy using Inter, with high-contrast text and subtle 1px borders (`rgba(255, 255, 255, 0.08)`).
- **Controls & Navigation**: Pill filters (`Hosted by me`, `Shared with me`, `Filters`), dark jewel-toned avatar stacks, floating action toolbars, interactive audio waveform player bar, and the **Ask Fred** companion copilot panel.

### Original Work
The implementation of both the frontend and backend in this repository is **original work**. It was constructed specifically for this platform based on the technical architecture blueprint and does not copy source code from existing repositories.

### Sample Data
The application comes pre-configured with rich sample data so it is fully functional and demo-ready immediately upon launch:
- **What is included:** Several meetings containing realistic multi-speaker transcripts with exact start/end timestamps, structured AI summaries, chapter topics with seek points, and categorized action items (with completed/incomplete states and assignees).
- **Seeded Meetings:**
  1. *Product Roadmap & Sprint Planning (Q3)*: 4 speakers, ~16 min, 6 action items, 5 topics.
  2. *Weekly Engineering Standup & Tech Debt Review*: 3 speakers, ~8 min, 4 action items, 3 topics.
  3. *Executive Strategy & Go-To-Market Alignment*: 5 speakers, ~31 min, 5 action items, 4 topics.
  4. *Quick 1-on-1 Design Sync: Component Styling*: 2 speakers, ~4 min, **0 action items** (tests empty state).
- **How to access seeded data:**
  - In the UI, navigate to **All Meetings** (`http://localhost:3000/meetings?tab=all`) to browse all seeded meetings, filter by duration or date, and click into any meeting to inspect the transcript, waveform sync, and AI summary.

---

## Deliverables

This submission consists of:
1. **Source Code**:
   - `frontend/`: Next.js 14 App Router, TypeScript, vanilla CSS design tokens, TanStack Query client.
   - `backend/`: FastAPI REST API, SQLAlchemy ORM models, Pydantic schemas, seed scripts, pytest suite.
2. **Documentation**:
   - `README.md`: Complete setup instructions, prerequisites, architecture overview, database schema, API reference, and assumptions.
   - `Fireflies Clone — Technical Architecture Blueprint.md`: Complete architectural specification.
3. **Demo**:
   - Local: `http://localhost:3000` (frontend) & `http://127.0.0.1:8000/docs` (interactive Swagger API).
   - Hosted deployment links can be deployed to Vercel (frontend) and Render/Railway (backend) as outlined in Section 8.

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14 (App Router)** | Server & Client Components, page routing, static optimization |
| **Frontend Language** | **TypeScript** | Strict end-to-end type safety mirrored from backend schemas |
| **Styling** | **Vanilla CSS** (`globals.css`) | Custom design system tokens matching Fireflies aesthetic |
| **Data Fetching / State** | **TanStack Query (React Query v5)** | Server state caching, optimistic mutations, refetch invalidation |
| **Icons** | **Lucide React** | Modern icon set matching Fireflies interface |
| **Backend Framework** | **FastAPI (Python 3.10+)** | High-performance asynchronous REST API, auto OpenAPI/Swagger |
| **ORM & Data Access** | **SQLAlchemy 2.0** | Relational mapping, foreign key cascades, session dependency injection |
| **Data Validation** | **Pydantic v2** | Request validation, type coercion, response serialization |
| **Database** | **SQLite** | Zero-configuration file database (`data/app.db`) with `PRAGMA foreign_keys=ON` |
| **Testing** | **Pytest & HTTPX** | Automated test suite verifying CRUD, search, and transcript ingestion |

---

## Architecture Overview

The system strictly adheres to a decoupled client-server architecture:

```
┌───────────────────────────────────────┐              HTTPS / JSON REST API              ┌───────────────────────────────────────┐
│           Next.js Frontend            │ ──────────────────────────────────────────────> │            FastAPI Backend            │
│  - App Router (/meetings, /settings)  │ <────────────────────────────────────────────── │  - Routers (/meetings, /transcripts)  │
│  - TanStack Query Cache               │                                                 │  - Service Layer (business logic)     │
│  - PlayerSyncContext (Audio ↔ Text)   │                                                 │  - Pydantic Validation & Schemas      │
└───────────────────────────────────────┘                                                 └───────────────────────────────────────┘
                   │                                                                                          │
                   │ <audio> element                                                                          │ SQLAlchemy ORM
                   ▼                                                                                          ▼
       Local sample media playback                                                                  ┌───────────────────┐
       (/media or public fallback)                                                                  │   SQLite DB       │
                                                                                                    │   (data/app.db)   │
                                                                                                    └───────────────────┘
```

### Key Architectural Tenets
1. **Sole Source of Database Truth**: The frontend never connects directly to SQLite. Every read and write passes through versioned REST endpoints (`/api/v1/...`) exposed by FastAPI.
2. **Synchronized Playback Loop**: The meeting notepad uses `PlayerSyncContext` as a single source of truth for playback position. As audio plays, throttled time updates highlight the active transcript utterance; clicking any transcript line or topic instantly seeks audio playback.
3. **Server-Side vs. Client-Side Search**:
   - Library search and filters (`search`, `participant`, `date_from`, `date_to`) execute server-side via SQL `WHERE` queries with pagination.
   - In-meeting transcript search executes client-side over pre-loaded segment arrays for instant keystroke highlighting without round-trips.
   - Global search queries titles, transcript text, and summaries across all meetings via `GET /api/v1/search?q=`.

---

## Database Design & Schema

The relational database is implemented using **SQLite** with strict foreign key constraints (`PRAGMA foreign_keys = ON;`) and cascading deletes.

```
meetings 1 ──────< meeting_participants >────── 1 participants
meetings 1 ──────< speakers ──────< transcript_segments
meetings 1 ──────1 summaries
meetings 1 ──────< topics
meetings 1 ──────< action_items
```

### Main Tables & Important Fields

#### 1. `meetings` (Root Entity)
- `id` (INTEGER, Primary Key, Autoincrement)
- `title` (TEXT, NOT NULL)
- `meeting_date` (TEXT, ISO-8601 string, NOT NULL)
- `duration_seconds` (INTEGER, NOT NULL DEFAULT 0)
- `media_url` (TEXT, Nullable, audio/video path)
- `created_at` / `updated_at` (TEXT, ISO timestamp)
- *Indexes*: `idx_meetings_date` on `meeting_date`, `idx_meetings_title` on `title`.

#### 2. `participants` (Workspace Members & Guests)
- `id` (INTEGER, Primary Key, Autoincrement)
- `name` (TEXT, NOT NULL UNIQUE)
- `email` (TEXT, Nullable)

#### 3. `meeting_participants` (Many-to-Many Join Table)
- `meeting_id` (INTEGER, FK → `meetings.id` ON DELETE CASCADE)
- `participant_id` (INTEGER, FK → `participants.id` ON DELETE CASCADE)
- *Primary Key*: Composite `(meeting_id, participant_id)`
- *Index*: `idx_mp_participant` on `participant_id`

#### 4. `speakers` (Per-Meeting Diarization Entities)
- `id` (INTEGER, Primary Key, Autoincrement)
- `meeting_id` (INTEGER, FK → `meetings.id` ON DELETE CASCADE)
- `name` (TEXT, NOT NULL)
- `color_hex` (TEXT, Nullable, UI label color)
- *Index*: `idx_speakers_meeting` on `meeting_id`

#### 5. `transcript_segments` (Spoken Utterances)
- `id` (INTEGER, Primary Key, Autoincrement)
- `meeting_id` (INTEGER, FK → `meetings.id` ON DELETE CASCADE)
- `speaker_id` (INTEGER, FK → `speakers.id` ON DELETE CASCADE)
- `start_time_seconds` (REAL, NOT NULL)
- `end_time_seconds` (REAL, Nullable)
- `text` (TEXT, NOT NULL)
- `sequence_index` (INTEGER, NOT NULL)
- *Indexes*: `idx_segments_meeting_seq` on `(meeting_id, sequence_index)`, `idx_segments_meeting` on `meeting_id`

#### 6. `summaries` (AI Meeting Overview)
- `id` (INTEGER, Primary Key, Autoincrement)
- `meeting_id` (INTEGER, UNIQUE, FK → `meetings.id` ON DELETE CASCADE)
- `overview_text` (TEXT, NOT NULL)
- `generated_at` (TEXT, ISO timestamp)

#### 7. `topics` (Chapters / Outline Points)
- `id` (INTEGER, Primary Key, Autoincrement)
- `meeting_id` (INTEGER, FK → `meetings.id` ON DELETE CASCADE)
- `title` (TEXT, NOT NULL)
- `start_time_seconds` (REAL, Nullable seek timestamp)
- `order_index` (INTEGER, NOT NULL)
- *Index*: `idx_topics_meeting` on `meeting_id`

#### 8. `action_items` (Tasks & Follow-ups)
- `id` (INTEGER, Primary Key, Autoincrement)
- `meeting_id` (INTEGER, FK → `meetings.id` ON DELETE CASCADE)
- `text` (TEXT, NOT NULL)
- `assignee` (TEXT, Nullable)
- `is_completed` (INTEGER, 0 or 1, NOT NULL DEFAULT 0)
- `due_date` (TEXT, Nullable)
- `created_at` (TEXT, ISO timestamp)
- *Index*: `idx_action_items_meeting` on `meeting_id`

---

## REST API Overview

All API endpoints are prefixed with `/api/v1` and speak JSON.

### Meetings (`/api/v1/meetings`)
- `GET /api/v1/meetings`: List, search, and filter meetings (query params: `search`, `participant`, `date_from`, `date_to`, `sort`, `limit`, `offset`).
- `GET /api/v1/meetings/{id}`: Retrieve meeting detail metadata.
- `POST /api/v1/meetings`: Create a new meeting (title, date, attendees, optional transcript).
- `PATCH /api/v1/meetings/{id}`: Edit meeting title, date, or attendees.
- `DELETE /api/v1/meetings/{id}`: Delete meeting (cascades to all transcript segments, summaries, topics, and action items).

### Transcripts (`/api/v1/meetings/{id}/transcript`)
- `GET /api/v1/meetings/{id}/transcript`: Retrieve ordered transcript segments with speaker diarization.
- `POST /api/v1/meetings/{id}/transcript`: Ingest transcript via raw text or multipart file (`.txt`, `.vtt`, `.srt`, `.json`).
- `GET /api/v1/meetings/{id}/transcript/search?q=...`: Server-assisted transcript query.
- `GET /api/v1/meetings/{id}/export?format=md|txt|json`: Export transcript & summary to Markdown, Plain Text, or JSON.

### Summaries & AI Notes (`/api/v1/meetings/{id}/summary`)
- `GET /api/v1/meetings/{id}/summary`: Retrieve overview summary and chapter topics.
- `POST /api/v1/meetings/{id}/summary/regenerate`: Trigger summary & topic re-generation.
- `POST /api/v1/meetings/{id}/ask`: Ask Fred conversational question answering over meeting content.

### Action Items (`/api/v1/action-items`)
- `GET /api/v1/meetings/{id}/action-items`: Retrieve all action items for a meeting.
- `POST /api/v1/meetings/{id}/action-items`: Add an action item (`text`, `assignee`, `due_date`).
- `PATCH /api/v1/action-items/{item_id}`: Edit action item fields.
- `PATCH /api/v1/action-items/{item_id}/complete`: Toggle completion status (`{ is_completed: boolean }`).
- `DELETE /api/v1/action-items/{item_id}`: Remove an action item.

### Global Search (`/api/v1/search`)
- `GET /api/v1/search?q=...`: Search across meeting titles, transcript utterances, and summary texts.

---

## Setup & Running Instructions

### Prerequisites
- **Python**: Version `3.10` or higher
- **Node.js**: Version `18.17` or higher (`npm` included)

---

### Step 1: Run the Backend (FastAPI)

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. (Recommended) Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - **API Base**: `http://127.0.0.1:8000`
   - **Interactive API Documentation (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **Alternative ReDoc Docs**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### Step 2: How to Seed the Database

- **Automatic Seeding**: On initial startup, the backend automatically inspects the database file (`backend/data/app.db`). If no meetings exist, it automatically invokes `seed_if_empty()` to populate the 4 realistic fixtures.
- **Manual / Re-seeding**: To force a clean re-seed at any time, run:
   ```bash
   cd backend
   python -m app.db.seed
   ```
   This will verify or insert the sample meetings into `data/app.db`.

---

### Step 3: Run the Frontend (Next.js)

1. Open a second terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify that `frontend/.env.local` points to your backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_API_ORIGIN=http://localhost:8000
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

### Step 4: Running Automated Tests

To run the automated backend test suite:
```bash
cd backend
python -m pytest
```
*Executes all 11 tests covering meeting CRUD, cascading deletes, action item toggle persistence, search, and transcript ingestion.*

To run a production build and type-check of the frontend:
```bash
cd frontend
npm run build
```

---

## Assumptions Made

1. **Authentication**: As specified in the architecture blueprint (Section 0), real user authentication is mocked. The application operates with a default demo session for user **Abhi** (`abhi@meetflow.ai`) in workspace **MeetFlow HQ**. Real OAuth2 and SAML SSO are marked as "Coming Soon" placeholders.
2. **Audio Decoding**: Direct raw audio-to-text decoding via a live Whisper model is marked as a "Coming Soon" placeholder. The application fully supports uploading and parsing pre-transcribed files (`.txt`, `.vtt`, `.srt`, `.json`) into timestamped speaker turns.
3. **Local Media**: Sample audio files are served from local backend mounts or public assets, avoiding external S3/cloud storage dependencies for standalone evaluation.
4. **Single-Writer Database**: SQLite is utilized with synchronous engine settings (`check_same_thread=False`), keeping file access single-writer safe and avoiding complex multi-container setup.

---

## Project Folder Structure

```
Fireflies.ai/
├── README.md                                          # This documentation
├── Fireflies Clone — Technical Architecture Blueprint (1).html # Source architecture blueprint
├── backend/
│   ├── app/
│   │   ├── main.py                                    # FastAPI application factory & CORS
│   │   ├── core/
│   │   │   ├── config.py                              # Settings via pydantic-settings
│   │   │   └── database.py                            # SQLite engine, SessionLocal, get_db()
│   │   ├── models/                                    # SQLAlchemy ORM models
│   │   │   ├── meeting.py
│   │   │   ├── participant.py
│   │   │   ├── speaker.py
│   │   │   ├── transcript.py
│   │   │   ├── summary.py
│   │   │   ├── topic.py
│   │   │   └── action_item.py
│   │   ├── schemas/                                   # Pydantic request & response schemas
│   │   ├── routers/                                   # Thin API endpoints (/api/v1)
│   │   │   ├── meetings.py
│   │   │   ├── transcripts.py
│   │   │   ├── summaries.py
│   │   │   ├── action_items.py
│   │   │   └── search.py
│   │   ├── services/                                  # Business logic layer
│   │   └── db/
│   │       ├── seed.py                                # Auto and manual seeding logic
│   │       └── seed_data/fixtures.json                # Sample meeting fixtures
│   ├── data/
│   │   └── app.db                                     # SQLite file database
│   ├── tests/                                         # Pytest automated test suite
│   └── requirements.txt
│
└── frontend/
    ├── app/
    │   ├── layout.tsx                                 # Root layout & providers
    │   ├── globals.css                                # Design system & Fireflies dark theme tokens
    │   └── (dashboard)/
    │       ├── layout.tsx                             # App shell (TopNavbar, AppRail, AskFredPanel)
    │       ├── meetings/
    │       │   ├── page.tsx                           # Meetings Library / Dashboard
    │       │   ├── [id]/page.tsx                      # Meeting Detail Notepad
    │       │   └── new/page.tsx                       # Upload / Create Meeting form
    │       ├── settings/page.tsx                      # Workspace Settings
    │       ├── analytics/page.tsx                     # Talk-time & meeting metrics
    │       ├── integrations/page.tsx                  # Apps & integrations directory
    │       └── soundbites/page.tsx                    # Clipped soundbites
    ├── components/
    │   ├── layout/                                    # TopNavbar, AppRail, AskFredPanel, GlobalSearchModal
    │   ├── meetings/                                  # MeetingsLibrary, MeetingForm, ShareModal
    │   ├── notepad/                                   # MeetingDetailView, ToolsRail
    │   ├── transcript/                                # MediaPlayer, TranscriptPane, UtteranceBlock
    │   ├── summary/                                   # SummaryPane, ActionItemsPane
    │   └── ui/                                        # Button, Modal, Toast, Badge, Dropdown, Avatar
    ├── context/
    │   ├── PlayerSyncContext.tsx                      # Transcript ↔ Audio synchronization
    │   └── ToastContext.tsx                           # Global notification toast alerts
    ├── hooks/api/                                     # React Query hooks wrapping API client
    ├── lib/
    │   ├── api-client.ts                              # Typed fetch client with error handling
    │   └── format.ts                                  # Date, time, and avatar helpers
    ├── types/api.ts                                   # TypeScript interfaces mirrored from Pydantic schemas
    └── package.json
```
