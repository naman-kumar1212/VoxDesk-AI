# 15. Main Prompt for Google Antigravity

Copy the prompt below into Antigravity after opening this folder as the workspace.

---

You are the senior full-stack engineer implementing **VoxDesk AI**, a six-hour solo hackathon MVP for a backend developer hiring event.

First read root `AGENTS.md`, `docs/17_FREE_ONLY_POLICY.md`, and all relevant documents in `docs/`. Follow `.agents/skills/voxdesk-implementation/SKILL.md`.

## Mandatory cost restriction

Every tool and API must stay at $0. Use only the explicitly listed free plans, free API quotas, open-source packages and local models. Never enable paid billing, metered usage, credits, overages, paid MCPs or automatic provider upgrades. If quota is exceeded, stop and use the documented free fallback. Before implementing a provider, check its current account/model free-tier entitlement. Report any uncertainty before making a provider call.

## Product objective

Build a voice-powered support intake application. A customer records a complaint in the browser. React uploads the audio to Flask. Flask sends the audio to the Groq Free Plan Whisper API (`whisper-large-v3-turbo`) for transcription. React displays an editable transcript. After customer confirmation, Flask sends the text to Gemini Developer API Free Tier (`gemini-3.8-flash`) for structured complaint analysis. Flask validates the result with Pydantic, applies deterministic Python rules, creates a persistent ticket and event in Supabase Free PostgreSQL, and returns a ticket reference. React speaks the confirmation using browser `SpeechSynthesis`. Do not add an external TTS API or TTS model. Admin can inspect tickets and update their status.

## Fixed technology choices

- Frontend: React + Vite + Tailwind CSS.
- Backend: Python + Flask.
- Database: Supabase Free PostgreSQL through SQLAlchemy.
- Audio capture: browser `MediaRecorder`.
- STT: Groq Free Plan + `whisper-large-v3-turbo`.
- Local STT fallback: `faster-whisper` with `base` checkpoint on the developer laptop only; do not add unless hosted free STT is unavailable and local runtime is tested.
- AI: Gemini Developer API Free Tier + `gemini-3.8-flash`.
- Required TTS: browser `SpeechSynthesis`.
- Deployment: Vercel Hobby frontend and Vercel Hobby backend. Local demo is the fallback.
- Coding assistant: Antigravity Individual plan, $0 only.

Do not add Node.js backend, Vapi, Retell, LiveKit, Deepgram, ElevenLabs, OpenAI paid APIs, paid Claude APIs, Redis, Kafka, Celery, SIP/PSTN, CRM, email or WhatsApp integrations.

## Implementation rules

- Work in phases from `docs/11_SIX_HOUR_PLAN.md`.
- Inspect the workspace before changing files.
- Implement Phase 0 and Phase 1 first; report status before continuing.
- Use `.env.example` files with placeholders, not real credentials.
- All provider calls happen in Flask; never expose API keys to React.
- Never enable paid tiers or overages. HTTP 402, quota exceeded or repeated 429 is a hard stop.
- Validate every AI output with Pydantic.
- Python owns category-to-department mapping, final priority, escalation, ticket status and persistence.
- Do not persist raw audio.
- Ticket creation must be idempotent and transactional with the initial event.
- Keep the admin key in React memory and send as `X-Admin-Key`; label as demo-only, not production authentication.
- Use synthetic demo complaint data only.
- Do not add a paid MCP server. No MCP server is needed for the application.

## First tasks

1. Read all relevant docs and report the required free provider accounts/keys.
2. Inspect workspace and report existing files.
3. Create the monorepo structure.
4. Set up React/Vite and Flask.
5. Add `/api/health`.
6. Add browser audio recording through `MediaRecorder`.
7. Implement `/api/voice/transcribe` using Groq Free Plan Whisper.
8. Show the returned transcript in an editable field.
9. If Groq free quota is unavailable, show manual text entry. Do not use a paid fallback.
10. Add tests for missing audio, unsupported format, empty transcript and provider errors.
11. Stop and report Phase 1 acceptance results.

---

## Follow-up prompts

### Phase 2: AI analysis

"Read `docs/07_AI_LOGIC.md` and `docs/11_SIX_HOUR_PLAN.md`. Implement Gemini structured complaint analysis using the Free Tier only, Pydantic validation, deterministic category/priority/escalation rules, safe manual-review fallback behavior and tests. Do not enable billing or a paid model."

### Phase 3: Persistence

"Read `docs/08_BACKEND_API_SPEC.md` and `docs/09_DATABASE_SCHEMA.md`. Implement Supabase Free PostgreSQL models, session creation, idempotent ticket creation, transaction handling and ticket events. Add tests for uniqueness and database failure."

### Phase 4: Admin dashboard

"Read `docs/05_ADMIN_FLOW.md` and `docs/10_UI_UX_SPEC.md`. Implement the admin dashboard, demo admin-key gate, metrics, filters, ticket detail view, status transitions and event history."

### Phase 5: Voice output

"Read `docs/06_VOICE_PIPELINE.md`. Implement browser SpeechSynthesis as the only TTS. Do not add hosted TTS APIs or separate TTS models. If the browser lacks TTS support, retain the visible text confirmation."

### Phase 6: Free deployment

"Read `docs/13_DEPLOYMENT.md` and `docs/17_FREE_ONLY_POLICY.md`. Prepare two Vercel Hobby projects for frontend and Flask backend, health checks, CORS and environment examples. Do not upgrade plans, add paid disks or enable overages. If the free host blocks deployment, report the blocker and provide local run steps."

### Final review

"Run `docs/12_TEST_PLAN.md`. Review secrets, unvalidated AI output, duplicate ticket creation, tenant scoping, status transitions, provider errors and billing safety. Confirm that no paid provider, paid MCP, paid model, paid plan, credits or overages have been configured. Report tests and remaining limitations honestly."
