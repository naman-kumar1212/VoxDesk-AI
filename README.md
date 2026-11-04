# VoxDesk AI — Voice AI Grievance Desk

VoxDesk AI is an automated, voice-driven customer support intake and grievance registration platform built on a strictly **$0 free-tier stack**. It accepts spoken customer complaints, transcribes them using Groq Whisper, extracts structured insights using Google Gemini, applies deterministic backend routing rules, persists tickets in Supabase PostgreSQL, and returns spoken confirmations via browser SpeechSynthesis.

---

## 🎯 Architecture & Workflow

```
[Customer Speaks]
       │
       ▼
[MediaRecorder Audio Capture] (≤ 45s, WebM/Opus, ≤ 4 MB)
       │
       ▼
[Flask API: POST /api/voice/transcribe]
       │
       ▼
[Groq Free Plan Whisper Large V3 Turbo]
       │
       ▼
[Editable Transcript Review in React UI]
       │
       ▼ (Customer Confirms with Idempotency Key)
[Flask API: POST /api/tickets/from-transcript]
       │
       ├──► [Gemini 3.8 Flash Free Tier: Structured JSON Analysis]
       │         │
       │         ▼
       ├──► [Pydantic Validation & Normalization]
       │         │
       │         ▼
       ├──► [Deterministic Python Business Rules (Dept, Priority, Escalation)]
       │         │
       │         ▼
       └──► [Supabase Free PostgreSQL Transaction: Ticket + Event Log]
                 │
                 ▼
[Customer Confirmation Card + Browser SpeechSynthesis Voice Response]
                 │
                 ▼
[Admin Console: Metrics, Category/Priority Filters, Ticket Detail & Status Transitions]
```

---

## 🛠️ Technology Stack (Strictly $0 / Free Tier)

| Component | Technology | Cost / Plan Tier |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React | Open Source / Free |
| **Backend** | Python 3.13, Flask 3.1, SQLAlchemy 2.0, Pydantic v2 | Open Source / Free |
| **STT Engine** | Groq Free Plan API (`whisper-large-v3-turbo`) | $0 Free Plan Quota |
| **AI Intelligence** | Google Gemini API (`gemini-3.8-flash`) | $0 Free Tier |
| **Database** | Supabase PostgreSQL | $0 Free Tier |
| **TTS Engine** | Browser `window.speechSynthesis` | Built-in / $0 |
| **Deployment** | Vercel Hobby (Frontend & Serverless Python Backend) | $0 Hobby Tier |

---

## 🚀 Local Quickstart

### Prerequisites
- Node.js (v18+)
- Python (3.12 or 3.13)
- Free API keys from [Groq Console](https://console.groq.com) and [Google AI Studio](https://aistudio.google.com)
- Free PostgreSQL instance from [Supabase](https://supabase.com)

### 1. Backend Setup
```bash
cd backend
uv venv --python 3.13
.venv\Scripts\activate   # Windows (.venv/bin/activate on Linux/macOS)
uv pip install -r requirements.txt

# Configure your environment
cp .env.example .env
# Edit .env with your GROQ_API_KEY, GEMINI_API_KEY, and DATABASE_URL

# Run migration & demo organization seeder
python seed.py

# Start Flask server (port 5000)
python wsgi.py
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Test Suite

Run the full backend test suite:
```bash
cd backend
.venv\Scripts\python -m pytest -v
```
All 24 automated unit tests verify:
- Audio validation (missing file, empty audio, unsupported MIME, payload limits)
- Gemini schema validation with Pydantic
- Deterministic business rules (priority overrides, fraud pattern detection, repeated contact escalation)
- Status transition state machine & terminal `resolved` state
- Ticket reference generation (`VD-XXXXXXXX`) and uniqueness
- Admin key authentication gate (`X-Admin-Key`)

---

## 🔒 Security & Reliability Guarantees

1. **Zero Secrets in Frontend**: All Groq, Gemini, and Supabase credentials remain strictly in Flask environment variables.
2. **Untrusted Data Boundary**: Spoken transcripts are treated strictly as untrusted data in Gemini prompts; prompt injection attempts cannot modify system schema or business rules.
3. **Idempotency Protection**: Ticket generation requires a client-supplied UUID `Idempotency-Key` header, guaranteeing network retries never duplicate tickets.
4. **Deterministic Authority**: Gemini provides recommendations, but Python rules strictly enforce allowed categories, department assignment, and escalation flags.
5. **Fail-Closed Fallback**: If Whisper or Gemini quotas are exceeded, the UI seamlessly provides manual text fallback and logs tickets for human investigation without ever triggering paid service tiers.

---

## 👥 Hackathon Demo Script (3-Minute Walkthrough)

1. **Customer Voice Grievance**:
   - Navigate to `/` (Customer Desk).
   - Click **Record** and speak: *"I ordered a laptop three days ago. The payment was deducted, but I did not receive an order confirmation. I have already contacted support twice."*
   - Observe real-time recording timer (≤ 45s limit) and click **Stop**.
2. **Review & AI Classification**:
   - Groq Whisper returns the transcript within ~1 second.
   - Click **Confirm & Submit Ticket**.
   - Gemini classifies category as `payment`, department as `Billing Support`, priority as `high`, and triggers **Escalated Review** due to repeated contact.
   - Browser speaks the audio confirmation aloud automatically.
3. **Admin Dashboard Review**:
   - Navigate to `/admin`. Enter the admin key.
   - Inspect the real-time metrics (Total, Open, High Priority, Escalated).
   - Click the created ticket to open the details drawer.
   - Inspect the customer transcript, AI summary, and event timeline (`TICKET_CREATED`, `TICKET_ESCALATED`).
   - Transition status to `In Progress` or `Resolved`.
