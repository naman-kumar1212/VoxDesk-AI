---
name: voxdesk-implementation
description: Implements and validates VoxDesk AI, a free-only React and Flask voice-support MVP using Groq Free Plan Whisper, Gemini Free Tier structured analysis, Supabase Free PostgreSQL and browser SpeechSynthesis. Use when building, testing or deploying this project.
---

# VoxDesk AI Implementation Skill

## Purpose

Implement VoxDesk AI as a six-hour solo hackathon MVP with a hard $0 cost ceiling.

## Required reading

- `AGENTS.md`
- `docs/17_FREE_ONLY_POLICY.md`
- Relevant documents under `docs/`
- `docs/11_SIX_HOUR_PLAN.md`

## Cost gate

- Use only free plans and open-source/local models.
- No paid API, paid plan, credit pack, automatic overage or paid MCP.
- Do not add billing details to unlock a provider.
- Treat 402, quota errors and persistent 429 as stop conditions.
- Never switch to a paid plan automatically.
- If a free service is unavailable, use its documented local/text fallback.

## Architecture

- React + Vite + Tailwind frontend.
- Python + Flask backend.
- Browser `MediaRecorder` captures audio.
- Flask forwards audio to Groq Free Plan Whisper `whisper-large-v3-turbo`.
- If unavailable, manual text-entry fallback; optional local faster-whisper `base` on developer laptop.
- Gemini `gemini-3.8-flash` Free Tier returns structured complaint analysis.
- Pydantic validates model output.
- Python applies final routing/priority/escalation rules and database actions.
- Supabase Free PostgreSQL stores sessions, tickets and events.
- Browser `SpeechSynthesis` is required TTS.
- Vercel Hobby for frontend and Flask backend in two projects, local run as fallback.

## Quality gates

- Provider secrets stay server-side.
- Transcript editable and confirmed before ticket creation.
- Raw audio is not persisted.
- AI output is schema-validated.
- Ticket creation is transactional and idempotent.
- Event is recorded for creation/status changes/escalation.
- Admin endpoints require the demo admin key.
- Tenant scope comes from backend config, not untrusted client input.
- TTS failure cannot invalidate ticket creation.
- Free quota exhaustion never triggers a paid provider call.
- Visible success follows confirmed database success.

## Phases

### Phase 1: STT

Implement `MediaRecorder`, audio upload, MIME/size validation, Groq Free Plan Whisper and transcript review. Do not use browser SpeechRecognition as the STT. If free quota is unavailable, implement the manual text fallback.

### Phase 2: AI analysis

Implement Gemini Free Tier structured output, Pydantic validation and manual-review fallback. No billing or paid model.

### Phase 3: Ticket persistence

Implement SQLAlchemy schema, idempotency, transaction logic and event records.

### Phase 4: Admin workflow

Implement demo access gate, filters, details, metrics and status transitions.

### Phase 5: TTS

Use browser SpeechSynthesis only. Do not add hosted TTS APIs or separate TTS models.

### Phase 6: Deployment

Deploy only on free instances/plans. Verify frontend-to-backend-to-database flow. If free hosting is unavailable, document and demo local execution.

## Do not

- Add Vapi, Retell, LiveKit, paid Deepgram/ElevenLabs/OpenAI services, SIP, CRM, WhatsApp, email integrations, Kafka, Redis, Celery or paid MCP.
- Use fake ticket writes or hard-coded analytics as real data.
- Expose API keys in frontend code.
- Persist audio unnecessarily.
- Claim the demo admin key is production-grade authentication.
- Enable provider billing or paid fallback.
