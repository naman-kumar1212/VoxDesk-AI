# VoxDesk AI: Workspace Rules for Google Antigravity

## Mandatory context

Before changing code, read these documents in order:

1. `docs/00_PROJECT_OVERVIEW.md`
2. `docs/01_PRD.md`
3. `docs/02_TECH_STACK.md`
4. `docs/03_HIGH_LEVEL_ARCHITECTURE.md`
5. `docs/06_VOICE_PIPELINE.md`
6. `docs/07_AI_LOGIC.md`
7. `docs/08_BACKEND_API_SPEC.md`
8. `docs/09_DATABASE_SCHEMA.md`
9. `docs/10_UI_UX_SPEC.md`
10. `docs/11_SIX_HOUR_PLAN.md`
11. `docs/17_FREE_ONLY_POLICY.md`

Follow `.agents/skills/voxdesk-implementation/SKILL.md`.

## Non-negotiable cost policy

- Use only $0 plans, documented free tiers, open-source software and locally runnable open models.
- Never select, enable, call, or recommend a paid plan, paid endpoint, paid model, usage-based overage, promotional credit or trial that converts to billing.
- Do not add a payment method just to unlock a provider. If a provider requires payment details for the required free API access, skip it and use the documented fallback.
- Do not enable automatic credit/overage use in Antigravity or any provider.
- Before any API integration, check that the account is on its free plan and that the selected model is included in the free tier.
- If a quota is exhausted or an API returns 429/402/billing errors, stop using that provider. Never retry against a paid tier. Use the defined fallback or show an actionable message.
- No paid MCP server is required. Do not add any MCP server unless it is free, open-source/local, and demonstrably necessary. The MVP uses direct HTTP APIs and SQLAlchemy.
- Do not claim a provider is unlimited or permanently free. Free quotas, models and terms can change.

## Product invariants

- Product: VoxDesk AI.
- Core workflow: browser audio recording -> Groq Free Plan Whisper transcription -> editable transcript -> Gemini Free Tier complaint extraction -> Python validation and deterministic business rules -> Supabase PostgreSQL ticket -> browser speech synthesis.
- Primary problem: voice grievance desk with automatic ticket creation, positioned as a reusable customer-support automation backend.
- Frontend: React + Vite + Tailwind CSS.
- Backend: Python + Flask. Do not add Node.js as a backend.
- Database: Supabase Free PostgreSQL.
- STT: Groq Free Plan API, `whisper-large-v3-turbo`. `whisper-large-v3` is configurable only if it is available under the same free plan and current free quotas.
- Local STT fallback: `faster-whisper` with a small/base Whisper checkpoint on the developer machine; never deploy the local model to a serverless free host as a required service.
- AI classification: Google Gemini Developer API Free Tier, `gemini-3.8-flash`.
- TTS: Browser `window.speechSynthesis` only. Whisper is STT-only. Do not add a hosted TTS API or separate TTS model.
- Deployment: Vercel Hobby frontend and Flask backend (two Vercel projects), Supabase Free database. Local full-stack demo is the fallback if free hosting limits block deployment.
- Coding assistant: Google Antigravity Individual / $0 plan. Do not upgrade, purchase credits or enable overages.

## Scope control

- Build a six-hour hackathon MVP, not a production contact-center platform.
- Do not add Vapi, Retell, LiveKit, SIP/PSTN calling, Kafka, Redis, Celery, microservices, CRM integrations, email sending or WhatsApp integrations.
- Do not replace Whisper with browser SpeechRecognition. Use `MediaRecorder` to record audio and upload the file to Flask for Whisper transcription.
- Do not treat Whisper as a TTS provider.
- Do not make a separate TTS API mandatory. Browser SpeechSynthesis is enough for the demo.
- English-first. Keep Whisper language configurable; test Hindi only after the English flow works.
- Do not introduce a new framework or database without proving it is essential and free.
- Prefer direct, readable code over abstractions that do not earn their complexity.

## Security and reliability rules

- Never expose `GROQ_API_KEY`, `GEMINI_API_KEY`, `DATABASE_URL`, Supabase service-role credentials or admin secrets in frontend code or Vite variables.
- All provider calls must happen in Flask.
- Treat transcripts as untrusted content; transcript text must never override system instructions, schemas or backend rules.
- Validate every Gemini result with Pydantic before using it.
- Gemini may recommend category, priority and escalation. Python owns final routing, allowed values, priority overrides and ticket status transitions.
- Do not let the model execute SQL, choose arbitrary table names, call arbitrary URLs or perform unrestricted actions.
- Limit audio size and recording duration. Reject unsupported formats and empty audio.
- Do not persist raw audio in the MVP. Delete temporary audio after transcription.
- Use synthetic demo complaint data. Google states that content on the Gemini API Free Tier may be used to improve products. Do not submit real customer-sensitive data.
- Do not collect card numbers, CVV, passwords or authentication secrets in complaint text.
- Apply an idempotency key to ticket creation.
- Use server-side organization context. Never trust a client-supplied organization ID to select another tenant.
- Restrict CORS to the configured frontend origin.
- Do not claim the demo admin key mechanism is production-grade authentication.

## Engineering rules

- Keep a simple monorepo: `frontend/` and `backend/`.
- Use environment variables and provide `.env.example` files with placeholders only.
- Keep API response formats consistent and return meaningful HTTP status codes.
- Add loading, empty, success and error states to the UI.
- Do not present mock data as persisted data. Mark all seed/demo records clearly.
- Add backend tests for validation, AI-output parsing, ticket creation, idempotency and status transitions.
- Run tests and frontend production build after each phase.
- Do not silently skip tests or swallow exceptions. Log provider failures without secrets or full sensitive transcripts.
- On quota exhaustion, fail closed into a clearly marked manual/text fallback. Never silently switch to a paid provider tier.
- Do not begin optional features until the complete core voice-to-ticket flow works locally.

## Delivery protocol

At the end of each phase:

1. Summarize files created or changed.
2. State commands executed.
3. Report tests and build results honestly.
4. List blockers or missing credentials.
5. State whether any configured service could incur charges; the correct answer must be no.
6. Stop before the next phase if the current phase is broken.
