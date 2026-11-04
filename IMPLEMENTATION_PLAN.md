# VoxDesk AI — Implementation Plan

> Last updated: Phase 0 (Documentation Review) ✅

---

## Documentation Review Summary

All 17 documentation files and the skill SKILL.md have been read in full.

---

## Project Objective

Convert a customer's spoken support complaint into a structured, database-backed ticket using a fully free-tier technology stack. The core pipeline is:

```
Browser audio → Flask (Groq Whisper STT) → Editable transcript
→ Flask (Gemini AI) → Pydantic validation → Python rules
→ Supabase PostgreSQL ticket → Browser SpeechSynthesis confirmation
→ Admin dashboard for review and status management
```

---

## Functional Requirements

| ID | Requirement | Status |
|---|---|---|
| FR-01 | Browser MediaRecorder audio capture (45s limit, 4 MB max) | ⬜ |
| FR-02 | Groq Whisper `whisper-large-v3-turbo` transcription via Flask | ⬜ |
| FR-03 | Editable transcript before ticket submission | ⬜ |
| FR-04 | Gemini `gemini-3.8-flash` structured complaint analysis | ⬜ |
| FR-05 | Idempotent ticket creation with transaction (ticket + event) | ⬜ |
| FR-06 | Browser SpeechSynthesis spoken confirmation (no external TTS) | ⬜ |
| FR-07 | Admin dashboard with metrics, filters, detail, status updates | ⬜ |
| FR-08 | Ticket event history (TICKET_CREATED, STATUS_CHANGED, TICKET_ESCALATED) | ⬜ |

---

## Non-Functional Requirements

- API keys **never** exposed to frontend — server-side only
- CORS restricted to configured frontend origin
- Audio size ≤ 4 MB, duration ≤ 45 seconds
- Pydantic validates every AI output
- Python owns final routing, priority, escalation, status
- Idempotent ticket creation (no duplicate tickets on retry)
- All providers on documented free tiers — $0 cost ceiling
- On quota exhaustion: fail closed, offer text fallback, never switch to paid tier
- Backend logs must not contain secrets or full sensitive transcripts

---

## Architecture

### Frontend (React + Vite + Tailwind)

```
frontend/
├── src/
│   ├── components/
│   │   ├── VoiceRecorder.jsx         # MediaRecorder + state machine
│   │   ├── TranscriptReview.jsx      # Editable transcript + confirm
│   │   ├── TicketConfirmation.jsx    # Ticket result display
│   │   ├── AudioReplyPlayer.jsx      # SpeechSynthesis wrapper
│   │   ├── TextFallback.jsx          # Manual text entry fallback
│   │   ├── AdminAccessGate.jsx       # Admin key entry
│   │   ├── DashboardMetrics.jsx      # 4 metric cards
│   │   ├── TicketFilters.jsx         # Status / priority / category filters
│   │   ├── TicketTable.jsx           # Paginated ticket list
│   │   ├── TicketDetail.jsx          # Detail panel / drawer
│   │   └── TicketEventTimeline.jsx   # Event history
│   ├── pages/
│   │   ├── CustomerPage.jsx          # Route /
│   │   ├── AdminPage.jsx             # Route /admin
│   │   └── TicketDetailPage.jsx      # Route /admin/tickets/:id
│   ├── services/
│   │   └── api.js                    # fetch wrappers for all endpoints
│   ├── utils/
│   │   └── tts.js                    # speakConfirmation(text)
│   ├── App.jsx
│   └── main.jsx
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env.example
```

### Backend (Python + Flask)

```
backend/
├── app/
│   ├── __init__.py                   # Flask app factory
│   ├── config.py                     # Settings from env vars
│   ├── models.py                     # SQLAlchemy ORM models
│   ├── database.py                   # Engine + session factory
│   ├── routes/
│   │   ├── health.py                 # GET /api/health
│   │   ├── sessions.py               # POST /api/sessions
│   │   ├── voice.py                  # POST /api/voice/transcribe
│   │   ├── tickets.py                # POST /api/tickets/from-transcript
│   │   └── admin.py                  # GET/PATCH /api/admin/*
│   ├── services/
│   │   ├── transcription.py          # Groq Whisper integration
│   │   ├── ai_analysis.py            # Gemini integration
│   │   ├── business_rules.py         # Deterministic priority/escalation/dept
│   │   └── ticket_service.py         # Ticket creation + idempotency
│   ├── schemas/
│   │   └── pydantic_models.py        # ComplaintAnalysis, CreateTicketRequest, etc.
│   └── prompts/
│       └── complaint_analysis.py     # Fixed system instruction
├── tests/
│   ├── test_audio_validation.py
│   ├── test_ai_analysis.py
│   ├── test_business_rules.py
│   ├── test_ticket_creation.py
│   └── test_status_transitions.py
├── wsgi.py                           # WSGI entrypoint: app = create_app()
├── requirements.txt
└── .env.example
```

---

## Database Schema

| Table | Key Fields |
|---|---|
| `organizations` | id, name, created_at |
| `voice_sessions` | id, organization_id, channel, state, created_at |
| `tickets` | id, ticket_number (VD-XXXXXXXX), organization_id, session_id, idempotency_key, transcript, category, priority, department, summary, description, status, escalated, escalation_reason, analysis_status, created_at, updated_at |
| `ticket_events` | id, ticket_id, event_type, details (JSONB), created_at |

Unique constraint: `tickets(organization_id, idempotency_key)`.

---

## API Contract Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Flask + DB health |
| POST | `/api/sessions` | None | Create voice session |
| POST | `/api/voice/transcribe` | None | Whisper STT |
| POST | `/api/tickets/from-transcript` | None | AI → ticket creation |
| GET | `/api/admin/tickets` | X-Admin-Key | List/filter tickets |
| GET | `/api/admin/tickets/:id` | X-Admin-Key | Ticket detail + events |
| PATCH | `/api/admin/tickets/:id/status` | X-Admin-Key | Status transition |
| GET | `/api/admin/analytics/summary` | X-Admin-Key | 4 dashboard metrics |

---

## Status Transitions

```
open → in_progress
open → escalated
in_progress → escalated
in_progress → resolved
escalated → in_progress
escalated → resolved
(resolved is terminal — reject any further transitions with HTTP 409)
```

---

## Customer Workflow

1. Open `/` → microphone permission request
2. Record complaint (MediaRecorder, ≤ 45s)
3. Upload audio → `POST /api/voice/transcribe` → Groq Whisper
4. Display editable transcript
5. Customer confirms → `POST /api/tickets/from-transcript` with idempotency key
6. Flask: Gemini analysis → Pydantic validation → Python rules → DB transaction
7. Frontend receives ticket reference + spoken_reply text
8. Browser SpeechSynthesis speaks confirmation
9. Ticket confirmation card displayed

**Fallbacks:**
- Mic denied → text entry fallback
- Groq quota → text entry fallback
- Gemini quota → manual-review ticket (category: other, escalated: true)
- DB error → visible error, same idempotency key for retry

---

## Admin Workflow

1. Open `/admin` → enter X-Admin-Key
2. Dashboard loads metrics + ticket list
3. Filter by status/priority/category
4. Click ticket → detail panel (transcript, AI summary, events)
5. Change status → `PATCH /api/admin/tickets/:id/status`
6. Event appended, dashboard refreshes

---

## Technical Risks and Inconsistencies Identified

> [!WARNING]
> **Model ID risk**: Docs specify `gemini-3.8-flash`. Verify the exact model string against Google AI Studio's current API on the day of the hackathon — it may be `gemini-1.5-flash` or `gemini-2.0-flash`. The code must use a backend env var `GEMINI_MODEL` so it can be corrected without a code change.

> [!WARNING]
> **Backend deployment inconsistency**: `AGENTS.md` mentions "Vercel Hobby frontend and Flask backend (two Vercel projects)" as the deployment. `docs/13_DEPLOYMENT.md` section 7 also says Vercel Python runtime. However the master starter prompt also mentions "Render Free for Flask backend". The plan will use **Vercel Hobby** for both (as stated in `docs/`) with local Flask as fallback. `AGENTS.md` takes precedence.

> [!WARNING]
> **Vercel 4.5 MB limit**: Audio uploads must be validated and rejected at ≤ 4 MB before hitting Groq. WebM/Opus compression at 45s is typically 1–3 MB, so this is achievable but must be monitored.

> [!NOTE]
> **`google-genai` SDK vs `google-generativeai`**: The tech stack doc lists `google-genai` as the package name. Verify the correct pip package (`google-genai` is the newer Gen AI SDK). Use `from google import genai`.

> [!NOTE]
> **Supabase inactivity pause**: Free Supabase projects pause after 1 week of inactivity. For the demo, verify the project is awake beforehand.

> [!NOTE]
> **SpeechSynthesis `en-IN`**: Not all browsers have an Indian English voice. The TTS utility must gracefully fall back to any English voice before silently degrading to text-only.

> [!NOTE]
> **No existing application code**: The workspace contains only documentation and skill files. The repo is not yet initialized. All application code must be created from scratch.

---

## Implementation Checklist

### Phase 0 — Documentation Review ✅ COMPLETE

- [x] Read AGENTS.md
- [x] Read README.md
- [x] Read all docs/ files (00–17)
- [x] Read .agents/skills/voxdesk-implementation/SKILL.md
- [x] Identify risks and inconsistencies
- [x] Create IMPLEMENTATION_PLAN.md
- [ ] Initialize git repository
- [ ] Create develop branch
- [ ] Push to GitHub

---

### Phase 1 — Project Foundation ✅ COMPLETE

**Files created:**
- `frontend/` (React + Vite + Tailwind scaffold)
- `frontend/src/App.jsx`, `main.jsx`, routes
- `frontend/src/services/api.js`
- `frontend/src/pages/CustomerPage.jsx`
- `frontend/src/pages/AdminPage.jsx`
- `frontend/.env.example`
- `frontend/package.json`, `vite.config.js`, `tailwind.config.js`
- `backend/app/__init__.py` (app factory)
- `backend/app/config.py`
- `backend/app/database.py`
- `backend/app/models.py`
- `backend/app/routes/health.py`
- `backend/app/routes/sessions.py`
- `backend/app/routes/voice.py`
- `backend/app/routes/tickets.py`
- `backend/app/routes/admin.py`
- `backend/app/services/transcription.py`
- `backend/app/services/ai_analysis.py`
- `backend/app/services/business_rules.py`
- `backend/app/services/ticket_service.py`
- `backend/app/schemas/pydantic_models.py`
- `backend/app/prompts/complaint_analysis.py`
- `backend/wsgi.py`
- `backend/seed.py`
- `backend/requirements.txt`
- `backend/.env.example`

**Acceptance criteria:**
- [x] `npm run build` passes production build with zero errors
- [x] Flask app factory with strict CORS and JSON error envelopes configured
- [x] `GET /api/health` returns `{"success": true, "data": {"api": "ok", "database": "ok"}}`
- [x] 21 backend unit tests pass (`pytest`) in 1.04s
- [x] No secrets committed; `.env` in `.gitignore`

---

### Phase 2 — Voice Recording and Whisper STT ⬜

**Files to create/modify:**
- `frontend/src/components/VoiceRecorder.jsx`
- `frontend/src/components/TranscriptReview.jsx`
- `frontend/src/components/TextFallback.jsx`
- `frontend/src/pages/CustomerPage.jsx`
- `backend/app/routes/voice.py`
- `backend/app/services/transcription.py`
- `backend/tests/test_audio_validation.py`

**Acceptance criteria:**
- [ ] Customer can grant microphone permission
- [ ] Customer can start/stop recording (45s auto-stop)
- [ ] Audio uploaded as multipart/form-data to Flask
- [ ] Groq Whisper returns transcript
- [ ] Transcript displayed in editable textarea
- [ ] Text fallback available on mic denial or Groq quota error
- [ ] Empty/zero-byte audio rejected (HTTP 400)
- [ ] Audio > 4 MB rejected (HTTP 413)
- [ ] Unsupported MIME rejected (HTTP 415)
- [ ] Raw audio deleted after transcription

---

### Phase 3 — Gemini AI Processing ⬜

**Files to create/modify:**
- `backend/app/services/ai_analysis.py`
- `backend/app/services/business_rules.py`
- `backend/app/schemas/pydantic_models.py`
- `backend/app/prompts/complaint_analysis.py`
- `backend/tests/test_ai_analysis.py`
- `backend/tests/test_business_rules.py`

**Acceptance criteria:**
- [ ] Gemini returns valid structured JSON (category, priority, summary, etc.)
- [ ] Pydantic validates all fields; unknown values rejected
- [ ] Python category→department mapping applied (not Gemini's)
- [ ] Deterministic priority override rules applied
- [ ] Escalation rules applied deterministically
- [ ] On Gemini failure: fallback ticket (other/medium/manual-review) created
- [ ] Prompt injection in transcript does not affect system instructions

---

### Phase 4 — Ticket Creation and Persistence ⬜

**Files to create/modify:**
- `backend/app/models.py`
- `backend/app/database.py` (create_all, seed org)
- `backend/app/routes/sessions.py`
- `backend/app/routes/tickets.py`
- `backend/app/services/ticket_service.py`
- `backend/tests/test_ticket_creation.py`

**Acceptance criteria:**
- [ ] SQLAlchemy models match schema in doc 09
- [ ] `POST /api/sessions` creates and returns session UUID
- [ ] `POST /api/tickets/from-transcript` with Idempotency-Key creates ticket + TICKET_CREATED event in one transaction
- [ ] Same idempotency key returns existing ticket (no duplicate)
- [ ] Ticket number generated as `VD-` + 8 uppercase hex chars
- [ ] DB failure returns error (not fake success)
- [ ] organization_id comes from backend config, not client

---

### Phase 5 — Customer Voice Response (TTS) ⬜

**Files to create/modify:**
- `frontend/src/utils/tts.js`
- `frontend/src/components/AudioReplyPlayer.jsx`
- `frontend/src/components/TicketConfirmation.jsx`
- `frontend/src/pages/CustomerPage.jsx` (integrate TTS)

**Acceptance criteria:**
- [ ] `speakConfirmation(text)` uses `window.speechSynthesis`
- [ ] Prefers `en-IN` voice; falls back to any English voice
- [ ] TTS failure does not invalidate ticket creation
- [ ] Text confirmation always visible (TTS is additive only)
- [ ] No external TTS API or model

---

### Phase 6 — Admin Dashboard ⬜

**Files to create/modify:**
- `backend/app/routes/admin.py`
- `backend/tests/test_status_transitions.py`
- `frontend/src/components/AdminAccessGate.jsx`
- `frontend/src/components/DashboardMetrics.jsx`
- `frontend/src/components/TicketFilters.jsx`
- `frontend/src/components/TicketTable.jsx`
- `frontend/src/components/TicketDetail.jsx`
- `frontend/src/components/TicketEventTimeline.jsx`
- `frontend/src/pages/AdminPage.jsx`
- `frontend/src/pages/TicketDetailPage.jsx`

**Acceptance criteria:**
- [ ] `GET /api/admin/analytics/summary` returns 4 real DB-derived counts
- [ ] `GET /api/admin/tickets` returns paginated list with filters
- [ ] `GET /api/admin/tickets/:id` returns full detail + events
- [ ] `PATCH /api/admin/tickets/:id/status` validates transition; appends event
- [ ] Invalid transition returns HTTP 409
- [ ] All admin endpoints reject missing/invalid X-Admin-Key with HTTP 401
- [ ] Admin UI shows metric cards, filtered table, ticket detail

---

### Phase 7 — Integration Testing ⬜

**Tests to run:**
- [ ] Complete voice-to-ticket E2E (Scenario A: payment + escalation)
- [ ] Scenario B: delivery delay
- [ ] Scenario C: general enquiry (low priority)
- [ ] Scenario D: prompt injection (safe classification)
- [ ] Scenario E: Whisper failure → text fallback
- [ ] Scenario E: Gemini failure → manual-review fallback
- [ ] Scenario E: TTS failure → text-only confirmation
- [ ] Duplicate idempotency key → no duplicate ticket
- [ ] Invalid audio → 400/413/415
- [ ] Invalid status transition → 409
- [ ] Missing admin key → 401
- [ ] All backend unit tests pass (`pytest`)
- [ ] Frontend production build passes (`npm run build`)

---

### Phase 8 — Deployment ⬜

**Steps:**
- [ ] Vercel Hobby project 1: React frontend (root: `frontend/`, build: `npm run build`, out: `dist`)
- [ ] Vercel Hobby project 2: Flask backend (root: `backend/`, entrypoint: `wsgi.py`)
- [ ] Supabase schema + demo org seed applied to production DB
- [ ] All env vars configured in Vercel settings (never committed)
- [ ] CORS set to exact frontend Vercel URL
- [ ] `GET /api/health` returns ok on deployed backend
- [ ] Live end-to-end voice-to-ticket flow passes on deployed app
- [ ] No billing, overages or paid plans enabled

---

### Phase 9 — Final Documentation and Demo ⬜

- [ ] README.md updated with setup and deployment instructions
- [ ] Demo script rehearsed with 3 synthetic complaints
- [ ] Known limitations documented
- [ ] Final billing safety check (all providers on free plans)

---

## Required API Keys and Free-Service Setup

| Service | Account required | Key/credential | Where used |
|---|---|---|---|
| Groq | groq.com Free Plan | `GROQ_API_KEY` | `backend/.env` only |
| Google AI Studio | aistudio.google.com | `GEMINI_API_KEY` | `backend/.env` only |
| Supabase | supabase.com Free | `DATABASE_URL` (PostgreSQL connection string) | `backend/.env` only |
| Vercel Hobby | vercel.com | Vercel CLI / GitHub integration | Deployment only |

**Frontend env (safe, no secrets):**
- `VITE_API_BASE_URL` = deployed backend URL + `/api`

---

## GitHub Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, never force-pushed, merge only on explicit user approval |
| `develop` | All implementation work; committed and pushed after each phase |

**Commit message convention:**
```
chore: initialize project structure and git repo        [Phase 0]
feat: add Flask health endpoint and React scaffold      [Phase 1]
feat: implement browser audio recording and Whisper STT [Phase 2]
feat: implement Gemini AI analysis and business rules   [Phase 3]
feat: add ticket persistence and idempotency            [Phase 4]
feat: implement browser TTS voice confirmation          [Phase 5]
feat: build admin dashboard and status management       [Phase 6]
test: integration and unit test suite                   [Phase 7]
deploy: configure Vercel and Supabase production env    [Phase 8]
docs: update README and final demo instructions         [Phase 9]
```

---

## Phase Dependencies

```
Phase 0 (docs) ──► Phase 1 (foundation)
Phase 1 ──► Phase 2 (STT) ──► Phase 3 (AI)
Phase 3 ──► Phase 4 (persistence)
Phase 4 ──► Phase 5 (TTS) ──► Phase 6 (admin)
Phase 5 + Phase 6 ──► Phase 7 (integration testing)
Phase 7 ──► Phase 8 (deployment)
Phase 8 ──► Phase 9 (docs + demo)
```

Phases 2 and 3 can be built together since they share the transcript-to-ticket endpoint. Phases 5 and 6 can be built in parallel (independent UI concerns).

---

## Free-Tier Billing Safety Summary

| Provider | Plan required | Paid trigger to avoid |
|---|---|---|
| Groq | Free Plan | Developer tier upgrade; quota retry |
| Gemini | Free Tier (AI Studio) | Billing attachment; paid grounding |
| Supabase | Free | Paid compute; storage add-ons |
| Vercel | Hobby | Pro upgrade; function overages |
| Antigravity | Individual ($0) | Credits; Pro/Ultra upgrade |

---

*This document will be updated after each completed phase with ✅ checkmarks, commit SHAs and test results.*

