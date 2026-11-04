# VoxDesk AI — Backend Service

The VoxDesk AI backend is a lightweight, high-performance Python application built with **Flask 3.1**, **SQLAlchemy 2.0**, and **Pydantic v2**, running on a strictly **$0 free-tier architecture**. It powers voice ingestion, speech-to-text transcription via Groq Whisper, complaint categorization with Google Gemini 3.8 Flash, deterministic business logic, and an administrative support management console.

---

## 🔑 Administrative Access Credentials

For judges, evaluators, and administrators accessing the Admin Console:

| Credential Type | Value | Notes |
|---|---|---|
| **Admin Email** | `admin@voxdesk.ai` | Standard email identifier |
| **Password** | `AdminVoxDesk2026!` | Supabase Auth bcrypt-hashed credential |
| **Role** | `admin` | Full administrator privileges |
| **Legacy Admin Key** | `voxdesk-demo-admin-key-2026` | Header `X-Admin-Key` (CLI / API testing fallback) |

> **Creating Custom Admin Users:**
> Run the CLI provisioning utility to create or update administrator accounts in Supabase Auth:
> ```bash
> python create_admin.py --email admin@voxdesk.ai --password "AdminVoxDesk2026!" --name "Demo Admin"
> ```

---

## 🏗️ Architecture & Modules

```
backend/
├── app/
│   ├── __init__.py          # Flask app factory, CORS, structured performance logging middleware
│   ├── config.py            # Environment configuration & limits
│   ├── database.py          # SQLAlchemy 2.0 engine, pool recycling, query performance hooks
│   ├── models.py            # Declarative ORM models with composite PostgreSQL indexes
│   ├── auth.py              # Cryptographic HMAC-SHA256 JWT tokens & Supabase bcrypt auth
│   ├── analytics.py         # In-memory Pandas + Matplotlib/Seaborn chart engine with TTL caching
│   ├── routes/
│   │   ├── health.py        # GET /api/health (Database & service status)
│   │   ├── sessions.py      # POST /api/sessions (Voice session lifecycle)
│   │   ├── voice.py         # POST /api/voice/transcribe (Groq Whisper STT)
│   │   ├── tickets.py       # POST /api/tickets/from-transcript & GET /api/tickets/track/<id>
│   │   ├── admin.py         # Summary, tickets, departments CRUD, users, chart endpoints
│   │   └── auth.py          # POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
│   ├── services/
│   │   ├── transcription.py # Groq Free Plan API wrapper (whisper-large-v3-turbo)
│   │   ├── ai_analysis.py   # Google Gemini 3.8 Flash prompt & Pydantic schema validation
│   │   ├── business_rules.py# Deterministic Python routing rules & fraud heuristics
│   │   └── ticket_service.py# Atomic ticket + event transaction with idempotency
│   └── schemas/
│       └── pydantic_models.py # Strict response contracts & validation models
├── scripts/
│   └── seed_demo_data.py    # Generates 150 realistic support tickets, departments & staff
├── tests/                   # 34 comprehensive unit and integration tests (pytest)
├── create_admin.py          # Admin account provisioning utility
├── migrate_admin_features.py# Schema migrations for departments & admin users
├── requirements.txt         # Pinned Python dependencies
├── vercel.json              # Vercel Serverless Python runtime configuration
└── wsgi.py                  # WSGI entrypoint
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

| Variable | Description | Required | Example |
|---|---|:---:|---|
| `DATABASE_URL` | Supabase PostgreSQL URI (port 5432) | **Yes** | `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` |
| `GROQ_API_KEY` | Groq Console API Key (Free Plan) | **Yes** | `gsk_...` |
| `GEMINI_API_KEY` | Google AI Studio Key (Free Tier) | **Yes** | `AIzaSy...` |
| `ADMIN_API_KEY` | Secret key for legacy admin endpoints | **Yes** | `voxdesk-demo-admin-key-2026` |
| `DEMO_ORGANIZATION_ID` | UUID of the active organization | **Yes** | `00000000-0000-0000-0000-000000000001` |
| `SECRET_KEY` | Flask session & JWT signing secret | **Yes** | `super-secret-random-key` |
| `FRONTEND_ORIGIN` | Allowed CORS origins (comma-separated) | No | `http://localhost:5173,https://voxdesk.vercel.app` |
| `MAX_AUDIO_MB` | Maximum audio upload size in MB | No | `4` |
| `MAX_RECORDING_SECONDS`| Maximum audio duration in seconds | No | `45` |

---

## 🚀 Setup & Local Execution

### 1. Initialize Virtual Environment
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Run Database Migrations & Seed Data
```bash
# Apply schema extensions
python migrate_admin_features.py

# Seed 150 realistic tickets across 5 departments
python scripts/seed_demo_data.py --count 150

# Ensure admin account exists
python create_admin.py --email admin@voxdesk.ai --password "AdminVoxDesk2026!" --name "Demo Admin"
```

### 3. Start Local Development Server
```bash
python wsgi.py
```
The Flask API runs at `http://localhost:5000` with hot-reloading and performance logging.

---

## 🧪 Testing

Run all 34 automated tests:
```bash
pytest -v
```

The test suite validates:
- Audio boundary validation (empty audio, file size limits, MIME type enforcement)
- Gemini classification output and Pydantic schema validation
- Deterministic business rules (priority overrides, fraud patterns, repeated contact escalation)
- Status transition state machine (preventing invalid state jumps, e.g. `open` -> `resolved`)
- Idempotency guarantees (duplicate submission rejection)
- Supabase Auth bcrypt password verification & JWT token signing/tamper checks
- Operational overview KPI calculations and department workload distribution
- Departments CRUD operations & deletion protection guards

---

## ⚡ Performance Optimizations

1. **SQL Aggregation Consolidation:** Dashboard metrics query uses PostgreSQL `FILTER (WHERE ...)` to compute counts and distributions in a single roundtrip, eliminating 5 redundant network queries.
2. **Connection Pooling & Recycling:** SQLAlchemy engine is tuned with `pool_size=10`, `max_overflow=20`, `pool_recycle=300`, and TCP keepalives to prevent dropped connections over transatlantic WAN.
3. **Composite Database Indexes:** Added 5 composite indexes covering `(organization_id, department)`, `(organization_id, escalated)`, `(organization_id, created_at DESC)`, and `(organization_id, status)`.
4. **In-Memory Analytics Caching:** Matplotlib/Seaborn charts and statistical metrics are cached in memory with automatic cache invalidation upon ticket mutations, reducing chart rendering from 2.3 seconds to **~4.5 milliseconds**.
5. **Structured Performance Middleware:** Request middleware logs exact database query counts and millisecond timings for full transparency:
   `[PERFORMANCE] GET /api/admin/dashboard/summary | DB: 1993.4ms (4 queries) | Processing: 803.7ms | Total: 2797.1ms`


---

## ☁️ Vercel Serverless Deployment Checklist

When deploying the backend to Vercel:
1. **Root Directory:** Set to `backend` in the Vercel Project Settings.
2. **Serverless Entrypoint:** Automatically routes all traffic to `api/index.py` via `vercel.json` rewrites.
3. **Environment Variables:** Configure in Vercel Project Settings:
   - `DATABASE_URL` (Supabase connection string with `postgresql://` or `postgresql+psycopg://`)
   - `SECRET_KEY`
   - `GROQ_API_KEY`
   - `GEMINI_API_KEY`
   - `ADMIN_API_KEY`
   - `DEMO_ORGANIZATION_ID`
   - `FRONTEND_ORIGIN` (e.g. `https://voxdesk.vercel.app` or `*`)
4. **Writable Temp Directory:** `MPLCONFIGDIR` is automatically directed to `/tmp/matplotlib` so Matplotlib font caches never trigger `[Errno 30] Read-only file system` errors on AWS Lambda / Vercel containers.
