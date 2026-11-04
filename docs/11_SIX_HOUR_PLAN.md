# 11. Six-Hour Free-Only Implementation Plan

## Before the event

- Install Python, Node.js and Git.
- Install Google Antigravity Individual ($0 plan) and confirm the weekly quota is available. Do not enable credits/overages.
- Create a Groq Free Plan account and test `whisper-large-v3-turbo` with a short audio file. Do not upgrade to a paid plan.
- Create a Google AI Studio project on Free Tier and test `gemini-3.8-flash`. Do not attach billing.
- Create a Supabase Free project and test PostgreSQL connection.
- Create two Vercel Hobby projects (frontend and Flask backend) only if eligible. Do not upgrade.
- Prepare a local demo fallback.

## Phase 0: Project setup (0:00-0:30)

- Create React/Vite and Flask structure.
- Add `/api/health`.
- Configure `.env.example` files.
- Create Supabase schema.
- Verify all provider accounts are on free plans.

Exit: frontend and backend run locally and database connection succeeds.

## Phase 1: Voice capture and Whisper STT (0:30-1:30)

- Implement `MediaRecorder` UI.
- Upload audio with `multipart/form-data`.
- Implement `/api/voice/transcribe` with Groq Free Plan `whisper-large-v3-turbo`.
- Display editable transcript.
- Add manual text entry as free-tier fallback.

Exit: one voice recording produces a visible editable transcript, or the user can enter text if free quota is unavailable. No paid call is made.

## Phase 2: Gemini analysis (1:30-2:15)

- Implement Gemini `gemini-3.8-flash` on Free Tier.
- Define JSON schema and Pydantic model.
- Implement deterministic Python category, priority and escalation rules.
- Handle 429/quota errors with manual-review fallback.

Exit: confirmed transcript returns validated structured complaint data or an explicit fallback state.

## Phase 3: Ticket persistence (2:15-3:15)

- Implement SQLAlchemy models.
- Create ticket and first event transactionally.
- Add idempotency key.
- Implement list/detail/status endpoints.

Exit: ticket persists in Supabase Free PostgreSQL and survives refresh.

## Phase 4: Admin dashboard (3:15-4:00)

- Build metrics cards, ticket list, filters and ticket detail.
- Add status updates and escalation display.
- Record ticket events.

Exit: admin updates are persisted and visible after refresh.

## Phase 5: TTS and hardening (4:00-4:30)

- Implement browser SpeechSynthesis as default TTS.
- Do not add a separate TTS model or API. Browser SpeechSynthesis is the only TTS path.
- Test microphone denial, empty audio, STT 429, Gemini 429, DB errors and duplicate submission.

Exit: ticket confirmation is visible and spoken by browser TTS. No paid provider is required.

## Phase 6: Free deployment (4:30-5:00)

- Deploy frontend to Vercel Hobby.
- Deploy Flask backend as a Vercel Python/Flask project with `backend/` as root directory.
- Connect to Supabase Free database.
- Test deployed voice-to-ticket flow.
- If any free plan blocks deployment, stop and demo locally.

Exit: public demo is reachable or local demo fallback is ready.

## Phase 7: Demo rehearsal (5:00-6:00)

- Prepare three synthetic complaints: payment, delivery and technical support.
- Rehearse the three-minute presentation.
- Keep a typed complaint fallback ready if a microphone/provider quota fails.
- Verify no billing or paid overage is enabled.

## Strict priority order

1. Audio capture and Whisper transcription.
2. Gemini structured extraction.
3. Database-backed ticket creation.
4. Browser TTS confirmation.
5. Admin dashboard.
6. Deployment.

If time is short, simplify the dashboard, not the core voice-to-action flow.

## Not in scope

Phone calls, SIP/PSTN, Vapi, Retell, LiveKit, Deepgram, ElevenLabs, paid TTS, email, WhatsApp, CRM, Redis, Kafka, Celery, full authentication, multi-tenant onboarding or advanced analytics.
