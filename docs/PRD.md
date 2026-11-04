# VoxDesk AI — Product Requirements Document (PRD)

> **Document Version:** 1.0.0  
> **Status:** Released / Production  
> **Author:** Naman Kumar  
> **Target:** VocalLabs Voice AI Hackathon & Production Deployment  
> **Repository:** [https://github.com/naman-kumar1212/VoxDesk-AI](https://github.com/naman-kumar1212/VoxDesk-AI)  
> **Live URL:** [https://voxdesk-web-lac.vercel.app](https://voxdesk-web-lac.vercel.app)

---

## 1. Executive Summary

Traditional customer grievance desks create massive user friction: users must navigate confusing multi-level dropdowns, type lengthy descriptions on mobile keyboards, and guess which department handles their problem. Meanwhile, customer support teams are overwhelmed with unstructured, poorly categorized tickets that bounce between teams before reaching the right agent.

**VoxDesk AI** eliminates this friction with a voice-first, AI-orchestrated support desk. Customers speak their grievance naturally (in under 45 seconds). The platform transcribes the speech in sub-second time via Groq Whisper Turbo, extracts structured intent and sentiment via Google Gemini 3.8 Flash, validates schemas with Pydantic v2, and routes tickets deterministically using an organizational rules engine to the right department. A synthesized spoken voice confirms receipt, and managers oversee all queues via a unified 5-module administrative console.

Crucially, the entire system is architected under a **strictly enforced $0 free-tier invariant**.

---

## 2. Product Goals & Objectives

1. **Zero-Friction Intake:** Enable customers to report issues in under 60 seconds without typing, filling out extensive forms, or selecting departments.
2. **Sub-Second Audio Transcription:** Transcribe speech to text in < 800ms to maintain real-time conversational momentum.
3. **Structured Classification Accuracy:** Extract category, severity priority, actionable summary, and customer sentiment with 100% schema compliance.
4. **Deterministic Department Routing:** Prevent misrouted complaints by enforcing business policy rules over raw LLM outputs.
5. **Full Operational Transparency:** Provide public real-time tracking for customers and a comprehensive administrative command center for support managers.
6. **Strictly $0 Service Cost:** Run all production services within free quotas (Groq, Gemini, Supabase, Vercel) without subscription fees or risk of billing spikes.

---

## 3. User Personas

| Persona | Role | Key Pain Points | VoxDesk Solution |
|---|---|---|---|
| **Sarah (Consumer)** | Mobile shopper with an unreceived delivery | Annoyed by typing long paragraphs on her phone; gets lost in FAQ trees. | Presses mic, speaks for 15s, verifies transcript, receives instant audio confirmation and tracking link. |
| **David (Support Agent)** | Tier-1 support specialist | Wastes 40% of time re-routing miscategorized tickets and asking for clarifying info. | Receives tickets already categorized with urgency scores, structured summaries, and audit logs. |
| **Priya (Support Lead)** | Operations Director | Lacks real-time visibility into department bottlenecks and escalation trends. | Uses Admin Console KPIs, real-time ticket queues, and in-memory analytics to balance team capacity. |

---

## 4. Functional Requirements

### 4.1. Customer-Facing Features

#### FR-01: Voice Audio Capture
- Uses HTML5 `MediaRecorder` with automatic MIME negotiation (`audio/webm;codecs=opus`, `audio/mp4`).
- Real-time animated canvas waveform visualizer reflecting active speech volume.
- Hard guardrails: Maximum recording time of 45 seconds with visual countdown timer; maximum payload cap of 4 MB.
- In-flight recording controls: "Done & Submit" and "Cancel" buttons.
- Clean microphone stream teardown on unmount or cancellation to prevent hardware lockup.

#### FR-02: Speech-to-Text (STT) Processing
- Uploads audio blob to `/api/voice/transcribe`.
- Transcribes using Groq's high-speed LPU infrastructure running `whisper-large-v3-turbo`.
- Typical processing latency: ≤ 800ms.
- Fallback text input mode available with single-click sample complaints.

#### FR-03: Editable Transcript Verification
- Transcribed speech is presented to the user in an editable textarea prior to final ticket creation.
- Users can correct misheard names, order IDs, or amounts.
- Live heuristic preview card dynamically predicts detected category and department in real time.

#### FR-04: Grievance Creation & Confirmation
- Customer confirms transcript with a client-generated UUID `Idempotency-Key` to prevent duplicate submissions.
- Assigns a human-readable unique reference: `VD-XXXXXXXX`.
- Triggers a client-side synthesized spoken confirmation via browser `window.speechSynthesis` with voice control buttons (play/pause/repeat).

#### FR-05: Public Grievance Tracking
- Accessible at `/track` without requiring user registration or login.
- Search by ticket number (`VD-XXXX`) with sub-100ms response time.
- Displays current status badge, priority allocation, assigned department, and the human-readable `ActivityTimeline`.

---

### 4.2. Administrative Operational Console

#### FR-06: Administrator Authentication
- Secure email/password login powered by Supabase Auth with bcrypt hashing.
- Password visibility toggle and rate-limiting safeguards.
- Fallback support for legacy `X-Admin-Key` header for automated testing and CLI administration.

#### FR-07: Overview Dashboard (`/admin/dashboard`)
- 6 primary operational KPI cards: Total Tickets, Open, In Progress, Resolved, Escalated, and High Priority.
- Department workload distribution meters showing active ticket allocation.
- Recent activity stream summarizing chronological operational updates.

#### FR-08: Tickets Management (`/admin/tickets`)
- Server-side paginated data table (25 per page).
- Real-time text search across ticket ID, customer name, customer email, and complaint text.
- Multi-filtering: Status (Open, In Progress, Escalated, Resolved), Priority (High, Medium, Low), Category, and Department.
- Detail inspection drawer featuring:
  - Full grievance transcript and AI-generated summary.
  - Interactive status transition controls adhering to state machine policies.
  - Department reassignment dropdown.
  - Internal staff notes editor.
  - Human-readable `ActivityTimeline` component.

#### FR-09: In-Memory Analytics & Statistical Visualizations (`/admin/analytics`)
- 4 primary analytical visualizations:
  1. **Ticket Volume Over Time:** Daily ingestion trajectory.
  2. **Status Distribution:** Lifecycle distribution across stages.
  3. **Department Workload:** Ranked operational load per team.
  4. **Resolution Time Spread:** Mean, median, and outlier spreads.
- Date range filtering: 7 Days, 30 Days, 90 Days, All Time, and Custom Range.
- Sub-5ms response times via in-memory caching (`_DF_CACHE`, `_SUMMARY_CACHE`, `_CHART_CACHE`).

#### FR-10: Department & Staff Management (`/admin/departments`, `/admin/users`)
- Directory of operational departments with active ticket load meters.
- Directory of support staff and administrators with role-based access control (RBAC).

---

## 5. Non-Functional Requirements

### 5.1. Strictly $0 Free-Tier Invariant
- Every external dependency must operate sustainably within $0 free tiers:
  - **STT:** Groq Whisper Large v3 Turbo (free tier quota).
  - **LLM:** Google Gemini 3.8 Flash (free tier 15 RPM).
  - **Database:** Supabase PostgreSQL 15 (free compute and storage tier).
  - **TTS:** Browser Web Speech API ($0 network and service cost).
  - **Hosting:** Vercel Hobby tier ($0 serverless compute and CDN).

### 5.2. Performance & Latency Budgets
- Speech-to-Text inference: < 1,000ms.
- Gemini classification & validation: < 600ms.
- Ticket creation transaction: < 400ms.
- Admin dashboard summary load: < 500ms (post SQL consolidation).
- Analytics cached chart retrieval: < 5ms.
- Client-side tab navigation: < 1ms (via client SWR cache).

### 5.3. Reliability & Fallbacks
- **Fail-Closed AI Fallback:** If Groq or Gemini API quotas are exhausted, complaints automatically fall back into an `analysis_status: 'fallback'` state, assign to General Support, and flag for manual human review without crashing.
- **Idempotency Protection:** Double-clicking "Submit" or re-sending requests with the same `Idempotency-Key` returns the existing ticket without duplicating rows.

### 5.4. Data Privacy & Zero-Data-Leak
- Raw voice audio recordings are processed in memory and discarded immediately after transcription; no raw audio files are stored to disk or cloud buckets.
- API keys exist exclusively in server environments and are never bundled into client distributions.

---

## 6. Success Metrics & KPIs

| Metric | Target | Verification Method |
|---|---|---|
| **Intake Completion Time** | < 60 seconds | User session telemetry |
| **STT Latency** | < 1.0 second | API benchmark logging |
| **Classification Accuracy** | > 95% | Automated validation tests |
| **API Test Suite Pass Rate** | 100% (39/39 tests) | `pytest` CI/CD verification |
| **Total Monthly Cloud Bill** | **$0.00** | Cloud provider billing dashboards |

