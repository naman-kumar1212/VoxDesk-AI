# VoxDesk AI

> Voice-first customer grievance intake and automated support dispatch platform.

VoxDesk AI turns spoken customer complaints into structured, validated, and routed support tickets. By combining speech-to-text transcription, generative intent extraction, and deterministic policy rules, it eliminates mobile form fatigue for users and triage bottlenecks for support operations.

---

### 🌐 Quick Links

| Resource | Link | Status |
|:---|:---|:---:|
| 🚀 **Live Application** | [https://voxdesk-web-lac.vercel.app](https://voxdesk-web-lac.vercel.app) | `Active` |
| 💻 **GitHub Repository** | [https://github.com/naman-kumar1212/VoxDesk-AI](https://github.com/naman-kumar1212/VoxDesk-AI) | `Public` |
| ⚡ **Backend API** | [https://voxdesk-api.vercel.app](https://voxdesk-api.vercel.app) | `Active` |
| 🩺 **API Health Probe** | [https://voxdesk-api.vercel.app/api/health](https://voxdesk-api.vercel.app/api/health) | `200 OK` |
| 🎬 **Walkthrough Video** | [docs/media/voxdesk-demo.mp4](docs/media/voxdesk-demo.mp4) | `1080p MP4` |
| 🖼️ **Interactive Demo GIF** | [docs/media/voxdesk-demo.gif](docs/media/voxdesk-demo.gif) | `Animated GIF` |

<p align="left">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="MIT License" /></a>
  <a href="frontend/"><img src="https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb?style=flat-square&logo=react" alt="React 18" /></a>
  <a href="frontend/"><img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" /></a>
  <a href="backend/"><img src="https://img.shields.io/badge/Backend-Python%203.13%20%2B%20Flask-3776ab?style=flat-square&logo=python" alt="Python Flask" /></a>
  <a href="https://groq.com"><img src="https://img.shields.io/badge/STT-Groq%20Whisper-f55036?style=flat-square" alt="Groq Whisper" /></a>
  <a href="https://aistudio.google.com"><img src="https://img.shields.io/badge/Classifier-Google%20Gemini-4285f4?style=flat-square&logo=google" alt="Google Gemini" /></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e?style=flat-square&logo=supabase" alt="Supabase" /></a>
  <a href="backend/tests/"><img src="https://img.shields.io/badge/Tests-39%2F39%20Passing-brightgreen?style=flat-square" alt="39/39 Tests Passing" /></a>
</p>

---

## ✨ Why VoxDesk AI?

* **The Problem:** Customers struggle to articulate technical grievances through rigid dropdown forms and cramped mobile keyboards. Support teams waste significant time manually reading, categorizing, and re-assigning misdirected tickets across departments.
* **The Solution:** VoxDesk AI provides a voice-first intake interface. Customers speak naturally for up to 45 seconds; Groq Whisper transcribes the speech in sub-seconds; Google Gemini extracts structured summaries, sentiment, and urgency; and deterministic business rules route the ticket to the correct team.
* **The Outcome:** Customers obtain an immediate ticket reference with audible confirmation, public progress tracking without login requirements, and operations teams gain an actionable administrative console with workload oversight.

---

## 🎬 Product Demo

<p align="center">
  <a href="https://voxdesk-web-lac.vercel.app">
    <img src="docs/media/voxdesk-demo.gif" alt="VoxDesk AI interactive product demo" width="900" style="border-radius: 10px; border: 1px solid #DCE3EC; box-shadow: 0 10px 30px rgba(0,0,0,0.08);" />
  </a>
</p>

<p align="center">
  <em>Interactive walkthrough of VoxDesk AI demonstrating voice intake, verification, AI classification, ticket confirmation, and the operations dashboard.</em>
</p>

<p align="center">
  <a href="https://voxdesk-web-lac.vercel.app"><strong>🚀 Try the Live Application</strong></a> &nbsp;•&nbsp;
  <a href="docs/media/voxdesk-demo.mp4"><strong>🎥 Watch Full Walkthrough (MP4, 1440×900)</strong></a>
</p>

### ⏱️ Walkthrough Scene Breakdown

| Timestamp | Screen | User Action | Highlighted Capability |
|:---:|:---|:---|:---|
| **00:00 - 00:06** | **Landing Page** | Cursor moves across hero; scrolls to pipeline | Value proposition, Acoustic Intake Console card, and 4-step workflow |
| **00:06 - 00:13** | **Voice Intake (`/report`)** | Switches to manual text mode and types issue | Live audio frequency visualizer, 45-second timer, and text fallback |
| **00:13 - 00:20** | **Verification (`/review`)** | Reviews transcript and detected routing | Real-time intent classification preview (Category, Department, Urgency) |
| **00:20 - 00:26** | **Confirmation (`/confirmation`)** | Inspects ticket stamp and voice audio bar | Tabular reference ID (`VD-XXXXXXXX`), routing allocation, and speech playback |
| **00:26 - 00:31** | **Tracking (`/track`)** | Navigates to online tracker | Real-time lifecycle milestone progression and chronological event log |
| **00:31 - 00:37** | **Admin Login (`/admin`)** | Enters admin credentials securely | Role-based access control with Supabase authentication |
| **00:37 - 00:43** | **Operations Dashboard** | Reviews operational overview | 6 live KPI cards, category breakdown, and department workloads |
| **00:43 - 00:51** | **Queue & Management** | Hops through Tickets, Analytics, Depts, Users | Paginated ticket triage drawer, statistical charts, and RBAC directory |

---

## 🧠 How It Works

```mermaid
flowchart LR
    A["Customer Speaks<br/>(≤ 45s audio)"] --> B["Groq Whisper<br/>(Sub-second STT)"]
    B --> C["Transcript Review<br/>(Customer Verification)"]
    C --> D["Google Gemini<br/>(Structured Extraction)"]
    D --> E["Deterministic Rules<br/>(Routing & Fraud Guard)"]
    E --> F["Supabase DB<br/>(Atomic Commit)"]
    F --> G["Spoken Playback<br/>(SpeechSynthesis API)"]
    F --> H["Public Tracker<br/>(Real-Time Status)"]
    F --> I["Admin Console<br/>(Triage & Metrics)"]
```

1. **Audio Capture:** Customer records speech via HTML5 `MediaRecorder` with real-time Web Audio API frequency visualization.
2. **Audio Transcription:** Audio blob is processed by Groq Whisper Large v3 Turbo, returning verbatim text in under 800ms.
3. **Transcript Verification:** Customer inspects and edits misheard names or order numbers on the verification screen.
4. **Structured AI Extraction:** Google Gemini extracts concise root problem, category, urgency, and sentiment into strict Pydantic models.
5. **Deterministic Policy Rules:** Python business rules validate inputs, flag fraud patterns, enforce priority overrides, and confirm department routing.
6. **Atomic Database Commit:** A PostgreSQL transaction records the ticket and appends the initial creation event to the audit ledger.
7. **Spoken Verbal Confirmation:** Browser's native `SpeechSynthesis` API speaks confirmation aloud with playback controls.
8. **Lifecycle Tracking & Triage:** Customers track status on `/track` without logging in; staff manage queues on `/admin`.

---

## 🚀 Key Features

### For Customers
* **Voice-First Complaint Intake:** One-click audio recording with live frequency visualizer and 45-second duration limits.
* **Editable Transcript Review:** Transparent inspection and manual correction of speech text prior to submission.
* **Accessible Text Fallback:** Manual text input with 1-click sample complaints for quiet or noisy environments.
* **Immediate Spoken Confirmation:** Client-side speech synthesis readout of reference ID and assigned department.
* **Public Ticket Tracking:** Instant status tracking by ticket reference (`VD-XXXXXXXX`) with milestone dots and event log.

### For Support Teams
* **Operational Overview Dashboard:** 6 core KPI metrics (Total, Open, In Progress, Resolved, Escalated, High Priority).
* **Paginated Tickets Management:** Server-side paginated queue with multi-filtering (Status, Priority, Department) and search.
* **Ticket Inspector Drawer:** Slide-over drawer with status transitions, department reassignment, and staff notes.
* **Chronological Audit Timeline:** Human-readable history log transforming raw audit events into readable timeline entries.
* **Department Workload Monitoring:** Real-time visibility into open ticket counts and capacity per department.

### For Administrators
* **Statistical Analytics Engine:** Cached in-memory charts covering ingestion volume, status distribution, and resolution spread.
* **Department Management:** Add, update, and inspect departments with safe deletion guards protecting active queues.
* **Role-Based Access Control (RBAC):** Manage staff accounts with defined privilege levels (`admin`, `staff`, `viewer`).
* **Design Token Discipline:** Exact, calm interface adhering to WCAG 2.2 AA contrast standards with zero horizontal overflow.

---

## 🖥️ Application Screens

### Customer Intake & Verification Flow

| 1. Landing Page Hero | 2. Voice Intake Desk |
|:---:|:---:|
| <img src="demo-assets/hero.png" alt="VoxDesk AI Landing Page Hero" width="440" /> | <img src="demo-assets/voice-recording.png" alt="Voice Grievance Intake Desk" width="440" /> |

| 3. Transcript Review & AI Intent | 4. Ticket Confirmation & Audio Stamp |
|:---:|:---:|
| <img src="demo-assets/transcript-review.png" alt="Transcript Review and AI Preview" width="440" /> | <img src="demo-assets/ticket-confirmation.png" alt="Ticket Confirmation and Speech Playback" width="440" /> |

---

### Public Tracking & Mobile Experience

| 5. Public Grievance Tracker (`/track`) | 6. Mobile Viewport (390×844) |
|:---:|:---:|
| <img src="demo-assets/public-tracking.png" alt="Public Grievance Tracker" width="440" /> | <img src="demo-assets/mobile-viewport.png" alt="Mobile Touch Viewport" width="220" /> |

---

### Enterprise Administrative Console

| 7. Operational Dashboard (`/admin/dashboard`) | 8. Tickets Management & Inspector (`/admin/tickets`) |
|:---:|:---:|
| <img src="demo-assets/admin-dashboard.png" alt="Administrative Operational Dashboard" width="440" /> | <img src="demo-assets/admin-tickets.png" alt="Paginated Tickets Queue and Inspector" width="440" /> |

| 9. Statistical Analytics (`/admin/analytics`) | 10. Department Routing Directory (`/admin/departments`) |
|:---:|:---:|
| <img src="demo-assets/admin-analytics.png" alt="Statistical Analytics and Distribution Charts" width="440" /> | <img src="demo-assets/admin-departments.png" alt="Departments Management Directory" width="440" /> |

| 11. Staff & RBAC Directory (`/admin/users`) |
|:---:|
| <img src="demo-assets/admin-users.png" alt="Staff Directory and Role Management" width="440" /> |

---

## 🏗️ Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Tier (Browser)"]
        UI["React 18 + Vite SPA"]
        Audio["MediaRecorder API"]
        AudioVis["Web Audio AnalyserNode"]
        Speech["SpeechSynthesis API"]
        SWR["In-Memory Cache (30s TTL)"]
    end

    subgraph CDN ["Edge Routing Tier"]
        VercelEdge["Vercel Edge Network"]
    end

    subgraph Services ["External AI Services"]
        Groq["Groq Cloud (Whisper Large v3 Turbo)"]
        Gemini["Google Gemini API (3.8 Flash)"]
    end

    subgraph BackendTier ["Backend Tier (Python / Flask)"]
        API["Flask Application Factory"]
        AuthMid["HMAC-SHA256 Token Auth"]
        RulesEngine["Deterministic Business Logic"]
        AnalyticsEngine["In-Memory Chart Visualizer"]
    end

    subgraph DatabaseTier ["Persistence Tier (Supabase)"]
        Postgres[("PostgreSQL 15+")]
        TicketsTable["tickets table"]
        EventsTable["ticket_events audit ledger"]
        DeptsTable["departments table"]
        UsersTable["users table"]
    end

    Audio -->|Raw WebM/Opus| UI
    AudioVis -->|16-band Frequency Spectrum| UI
    UI -->|HTTPS Requests| VercelEdge
    VercelEdge --> API
    API --> AuthMid
    API -->|Audio stream| Groq
    API -->|Cleaned prompt & strict JSON schema| Gemini
    API --> RulesEngine
    RulesEngine -->|Atomic transaction| Postgres
    Postgres --> TicketsTable
    Postgres --> EventsTable
    Postgres --> DeptsTable
    Postgres --> UsersTable
    API -->|Spoken confirmation text| UI
    UI --> Speech
    UI --> SWR
```

### Architectural Safeguards
* **Client-Side Audio Streaming:** Uses standard HTML5 `MediaRecorder` with automatic MIME negotiation (`audio/webm;codecs=opus`, `audio/mp4`). Stream tracks are terminated immediately upon completion.
* **Deterministic Rules Engine:** Machine-learning recommendations are bounded by Python business rules: fraud keywords escalate priority automatically, and departmental bindings override probabilistic category suggestions.
* **Atomic Transaction Isolation:** Ticket inserts and initial `TICKET_CREATED` events execute within a single PostgreSQL transaction block.
* **Zero Client-Side Speech Costs:** Spoken confirmations leverage the browser's native `window.speechSynthesis` API, eliminating third-party TTS infrastructure overhead.

---

## 🛠️ Tech Stack

| Layer | Technology | Selection Rationale |
|:---|:---|:---|
| **Frontend** | React 18, Vite | Fast single-page application with component modularity |
| **Styling** | Tailwind CSS v3 | Design-token consistency, sub-10KB stylesheet, WCAG 2.2 AA compliance |
| **Icons** | Lucide React | Semantic, lightweight vector iconography |
| **Backend** | Python 3.13, Flask 3.1 | Minimalist, high-performance WSGI microservice architecture |
| **ORM / Data** | SQLAlchemy 2.0 | Declarative models, composite PostgreSQL indexing, pool recycling |
| **Validation** | Pydantic v2 | Strict JSON schema enforcement and type normalization |
| **Speech-to-Text** | Groq Whisper Large v3 Turbo | Sub-second audio transcription (< 800ms) |
| **AI Classification** | Google Gemini 3.8 Flash | Structured JSON intent classification and sentiment scoring |
| **Database** | Supabase PostgreSQL | Managed relational persistence, atomic transactions, row locking |
| **Automation** | Playwright Chromium | End-to-end user journey recording and automated visual audits |
| **Hosting** | Vercel Serverless | Edge routing, asset optimization, and automatic continuous deployment |

---

## ⚡ Performance Optimizations

1. **Consolidated SQL Aggregation:**
   Dashboard counters compute in a single PostgreSQL query via `FILTER (WHERE ...)` clauses instead of 6 separate sequential roundtrips:
   ```sql
   SELECT
     count(id) AS total,
     count(id) FILTER (WHERE status = 'open') AS open,
     count(id) FILTER (WHERE status = 'in_progress') AS in_progress,
     count(id) FILTER (WHERE status = 'resolved') AS resolved,
     count(id) FILTER (WHERE escalated = true) AS escalated,
     count(id) FILTER (WHERE priority = 'high') AS high_priority
   FROM tickets WHERE organization_id = :org_id;
   ```
2. **Client-Side SWR In-Memory Caching:**
   Read queries in `api.js` cache responses in memory for 30 seconds. Tab switches across the admin console resolve in under 1ms with automatic cache busting on mutations.
3. **Database Connection Recycling:**
   SQLAlchemy engine implements `pool_size=10`, `max_overflow=20`, and `pool_recycle=300` with TCP keepalives to prevent connection dropouts over transatlantic networks.
4. **Debounced Search Inputs:**
   300ms debounce timers on ticket and staff search inputs prevent premature API query spamming.
5. **Zero Layout Shift Skeletons:**
   Accessible loading skeletons match exact visual dimensions of loaded cards and table rows, ensuring zero Cumulative Layout Shift (CLS = 0.00).

---

## 🔌 API Overview

All API endpoints return standard JSON responses with `{ success, data, error }` envelopes.

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `GET` | `/api/health` | Service and database connectivity probe | None |
| `POST` | `/api/voice/transcribe` | Transcribes audio payload via Groq Whisper Turbo | None |
| `POST` | `/api/tickets/from-transcript` | Classifies transcript with Gemini & creates ticket | None |
| `GET` | `/api/tickets/track/<id>` | Public ticket status and chronological event log | None |
| `POST` | `/api/auth/login` | Administrator session login via email & password | None |
| `GET` | `/api/auth/me` | Validates session token and returns active user | Bearer Token |
| `GET` | `/api/admin/dashboard/summary` | Consolidated KPI counters and queue distribution | Bearer Token |
| `GET` | `/api/admin/tickets` | Paginated ticket queue with search and multi-filtering | Bearer Token |
| `PATCH` | `/api/admin/tickets/<id>` | Updates ticket status, priority, or department | Bearer Token |
| `GET` | `/api/admin/departments` | Department capacity list with ticket counters | Bearer Token |
| `POST` | `/api/admin/departments` | Creates a new operational department | Bearer Token |
| `GET` | `/api/admin/users` | Lists administrative and support staff accounts | Bearer Token |

<details>
<summary><strong>View Example Request & Response Payloads</strong></summary>

#### Create Ticket from Transcript
`POST /api/tickets/from-transcript`
```json
{
  "transcript": "My account was billed twice for the annual plan on Nov 2nd. Please refund the duplicate $120 charge.",
  "customer_name": "Demo Customer",
  "customer_email": "customer@example.com"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "ticket": {
      "ticket_number": "VD-426CC831",
      "status": "open",
      "priority": "high",
      "category": "Billing / Payments",
      "department_name": "Billing & Finance",
      "summary": "Duplicate billing charge for annual renewal.",
      "created_at": "2026-11-10T14:30:00Z"
    },
    "spoken_reply": "Your grievance has been registered under reference VD-426CC831 and dispatched to Billing & Finance."
  },
  "error": null
}
```
</details>

---

## 🧪 Testing

The backend includes 39 unit and integration tests validating audio constraints, business rules, Gemini schema parsing, state machine transitions, and database transactions:

```bash
cd backend
python -m pytest tests
```

Output:
```
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-8.3.5
collected 39 items

tests/test_admin_auth.py .....                                           [ 12%]
tests/test_admin_expansion.py .....                                      [ 25%]
tests/test_ai_analysis.py ...                                            [ 33%]
tests/test_api_discovery.py .....                                        [ 46%]
tests/test_audio_validation.py ....                                      [ 56%]
tests/test_business_rules.py ....                                        [ 66%]
tests/test_health.py ..                                                  [ 71%]
tests/test_pydantic_schemas.py ......                                    [ 87%]
tests/test_status_transitions.py .                                       [ 89%]
tests/test_ticket_service.py ..                                          [ 94%]
tests/test_tracking.py ..                                                [100%]

============================= 39 passed in 40.51s =============================
```

---

## 📦 Local Setup

### Prerequisites
* **Node.js** 18+ and **npm**
* **Python** 3.11+ (Python 3.13 recommended)
* **Supabase** PostgreSQL database (or local PostgreSQL instance)
* **Groq API Key** (Free Tier available at [console.groq.com](https://console.groq.com))
* **Google Gemini API Key** (Free Tier available at [aistudio.google.com](https://aistudio.google.com))

---

### Step 1: Clone Repository
```bash
git clone https://github.com/naman-kumar1212/VoxDesk-AI.git
cd VoxDesk-AI
```

---

### Step 2: Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # macOS / Linux
# .venv\Scripts\activate        # Windows PowerShell

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgresql://postgres:your-db-password@db.your-ref.supabase.co:5432/postgres
SECRET_KEY=your-secure-random-secret-key
ADMIN_API_KEY=your-secure-admin-key
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
DEMO_ORGANIZATION_ID=00000000-0000-0000-0000-000000000001
MAX_AUDIO_MB=4
MAX_RECORDING_SECONDS=45
```

Provision an administrator account:
```bash
python create_admin.py --email your-admin-email@example.com --password your-strong-password --name "Demo Administrator"
```

Start the Flask server:
```bash
python wsgi.py
```
Backend API will be live at `http://localhost:5000`.

---

### Step 3: Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend will be live at `http://localhost:5173`.

---

### Step 4: Demo Asset Regeneration

All documentation assets can be regenerated using the automated Playwright workflow:

```bash
# 1. Run Playwright walkthrough recording & capture all 11 UI screenshots
node scripts/demo.mjs

# 2. Convert raw video into compressed MP4 and animated GIF
python scripts/generate_media.py
```

<details>
<summary><strong>Manual FFmpeg Commands (Optional)</strong></summary>

If you prefer running FFmpeg directly:

```bash
# Convert raw WebM recording to compressed H.264 MP4
ffmpeg -y -i demo-assets/voxdesk-demo.webm -c:v libx264 -crf 22 -preset slow -pix_fmt yuv420p -an docs/media/voxdesk-demo.mp4

# Convert core interaction window to high-framerate animated GIF
ffmpeg -y -ss 00:00:06 -to 00:00:18 -i demo-assets/voxdesk-demo.webm -vf "fps=12,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" docs/media/voxdesk-demo.gif
```
</details>

---

## 📁 Project Structure

```
VoxDesk-AI/
├── backend/
│   ├── app/
│   │   ├── routes/              # Health, voice, tickets, admin, and auth endpoints
│   │   ├── services/            # Groq Whisper STT, Gemini AI, and business rules
│   │   ├── schemas/             # Strict Pydantic models for request/response validation
│   │   ├── database.py          # SQLAlchemy engine, pool configuration, and session scopes
│   │   ├── models.py            # Declarative database models with composite indexes
│   │   └── auth.py              # Cryptographic JWT signing and Supabase auth utilities
│   ├── tests/                   # 39 passing pytest unit and integration tests
│   ├── requirements.txt         # Pinned Python package dependencies
│   ├── vercel.json              # Serverless Python runtime configuration
│   └── wsgi.py                  # WSGI application entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/          # Navigation, status badges, and admin layout modules
│   │   │   └── admin/           # Dashboard, tickets table, analytics, depts, and users views
│   │   ├── pages/               # Home, VoiceComplaint, Review, Confirmation, Track, Admin
│   │   ├── services/api.js      # Client API wrapper with 30s SWR in-memory caching
│   │   ├── index.css            # Tailwind design token configuration and custom utilities
│   │   └── App.jsx              # Client-side router configuration
│   ├── package.json             # NPM dependencies and scripts
│   ├── tailwind.config.js       # Design tokens (Acoustic palette, typography, radii)
│   └── vite.config.js           # Vite development and production configuration
├── demo-assets/                 # Full HD video walkthrough and 11 high-resolution screenshots
├── docs/
│   └── media/                   # Embedded demo GIF and compressed walkthrough MP4
├── scripts/
│   ├── demo.mjs                 # Playwright 35–45s product walkthrough generator
│   ├── generate_media.py        # Standalone FFmpeg MP4 and animated GIF converter
│   └── generate_gif.py          # Standalone GIF generator utility
├── LICENSE                      # MIT Open Source License
└── README.md                    # Project documentation
```

---

## 🔮 Roadmap

- [ ] **Multi-Lingual Transcription:** Add language detection and automatic translation via Whisper multilingual models.
- [ ] **Webhook Integrations:** Dispatch notifications to Slack, Discord, or webhooks upon ticket escalation.
- [ ] **Customer Email Updates:** Send automated status change emails via Resend or SendGrid.
- [ ] **SLA Breach Monitoring:** Background cron worker calculating countdown timers for high-priority tickets.

---

## 🤝 Contributing

Contributions are welcomed. To contribute:
1. Fork the repository.
2. Create a descriptive feature branch (`git checkout -b feature/issue-description`).
3. Commit your changes with clear messages (`git commit -m "feat: add feature description"`).
4. Verify backend tests pass (`python -m pytest tests`).
5. Open a Pull Request against `main`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Naman Kumar**
* GitHub: [@naman-kumar1212](https://github.com/naman-kumar1212)
* Repository: [https://github.com/naman-kumar1212/VoxDesk-AI](https://github.com/naman-kumar1212/VoxDesk-AI)
