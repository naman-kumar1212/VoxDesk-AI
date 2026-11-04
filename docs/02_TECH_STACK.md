# 02. Final Technology Stack: Free-Only

## 1. Stack decision

Use Python, Flask and React. Every required dependency must be open-source, included in a $0 plan, or available inside a clearly documented free API tier. No paid plan or billable fallback is permitted.

| Layer | Selected tool | Use | Cost rule |
|---|---|---|---|
| Frontend | React + Vite | Customer and admin UI | Open-source/free |
| Styling | Tailwind CSS | Responsive UI | Open-source/free |
| HTTP | Native `fetch` | React-to-Flask requests | Browser built-in |
| Audio capture | Browser `MediaRecorder` | Record customer audio | Browser built-in |
| STT API | Groq Free Plan | Hosted Whisper inference | Free-plan quota only; never use Developer tier |
| STT model | `whisper-large-v3-turbo` | Default fast Whisper model | Only while available in Groq Free Plan |
| STT alternative | `whisper-large-v3` | Accuracy alternative | Only if included in the same free plan/quota |
| Local STT fallback | `faster-whisper` + `base` checkpoint | Local CPU fallback | Open-source package/model; runs on developer machine |
| Backend | Python + Flask | REST APIs and orchestration | Open-source/free |
| AI provider | Google AI Studio / Gemini Developer API | Structured complaint analysis | Free Tier only |
| AI model | `gemini-3.8-flash` | Category, summary, priority recommendation, escalation | Only Free Tier quota; no billing upgrade |
| Required TTS | Browser `window.speechSynthesis` | Spoken confirmations | Browser-provided; no API cost |
| Validation | Pydantic v2 | Validate inputs and model outputs | Open-source/free |
| Database | Supabase Free PostgreSQL | Sessions, tickets and events | Free plan only |
| DB access | SQLAlchemy + psycopg | Database operations | Open-source/free |
| CORS | Flask-CORS | Restrict frontend origin | Open-source/free |
| Environment | python-dotenv | Local environment config | Open-source/free |
| Tests | pytest | Backend tests | Open-source/free |
| Frontend hosting | Vercel Hobby | React static build | $0 Hobby plan only |
| Backend hosting | Vercel Hobby Python Function | Flask API | $0 within Hobby quotas; no paid overages |
| Coding assistant | Google Antigravity Individual | Coding agent | $0/month plan; keep overages off |

Do not add paid MCPs. No MCP server is required by the application. The agent may use Antigravity's built-in free workspace capabilities, while the app uses direct HTTP provider APIs and SQLAlchemy.

## 2. Speech-to-text: Groq Free Plan + Whisper

Default model: `whisper-large-v3-turbo`.

Endpoint:

`https://api.groq.com/openai/v1/audio/transcriptions`

Groq's current speech-to-text documentation lists Whisper Large V3 Turbo and Whisper Large V3. The documentation shows a 25 MB max upload on the free tier. Groq's published per-hour model prices refer to metered/paid usage; this project must remain on the $0 Free Plan. Verify the account's active plan and free quota before the hackathon. Do not enable the Developer tier or paid usage.

Rules:

- Use `whisper-large-v3-turbo` first for speed.
- Use `whisper-large-v3` only if its free-plan entitlement is confirmed and accuracy testing justifies it.
- Set `language="en"` for the first demo; test Hindi only after English works.
- Keep recordings <= 45 seconds and below 4 MB to fit Vercel Function request limits.
- If Groq returns 429, quota or billing errors, do not retry via a paid tier.
- Fallback 1: run local `faster-whisper` with a `base` checkpoint and CPU `int8` on the developer machine if time and hardware permit.
- Fallback 2: let the customer enter or correct the complaint using text input.

The local `faster-whisper` implementation is MIT-licensed and supports quantized inference. It is a fallback, not a requirement for the six-hour MVP. Do not deploy it to a free serverless host.

## 3. AI model: Gemini Free Tier

Model ID:

`gemini-3.8-flash`

Use Google AI Studio / Gemini Developer API Free Tier for structured complaint analysis. Current Google pricing lists free input/output for this model, subject to model-specific limits and changes. Check the account's active rate limits before the event.

Rules:

- Use the Free Tier only. Do not attach billing or upgrade the project.
- Do not enable paid grounding, paid tools or any add-on that can incur charges.
- Handle `429 RESOURCE_EXHAUSTED` by showing a retry/manual-review path. Never switch to a paid tier.
- Free-tier content may be used by Google to improve products. Use synthetic demo complaints only.
- Gemini returns structured data; Python validates it and owns all database actions.

## 4. Text-to-speech: zero-cost browser-only

Whisper has no paired TTS model. Keep TTS separate from STT.

Required default:

`window.speechSynthesis` + `SpeechSynthesisUtterance`

This is built into supported browsers and does not require an API key, model download or paid service. Set the locale to `en-IN` when a suitable voice is available; gracefully use the browser's default voice otherwise.

Do not add a hosted TTS API or a separate neural TTS model. Browser SpeechSynthesis is sufficient for the hackathon. If unavailable, show the response as text. Whisper does not provide speech synthesis.

## 5. Dependencies

### Backend required packages

- `Flask`
- `Flask-Cors`
- `SQLAlchemy`
- `psycopg[binary]`
- `pydantic`
- `groq`
- `google-genai`
- `python-dotenv`
- `pytest`

Optional local STT fallback only:

- `faster-whisper`

Do not install optional large ML packages unless the hosted free Whisper path is unavailable and the local fallback is actually needed.

### Frontend

- `react`
- `react-dom`
- `vite`
- `tailwindcss`
- `@tailwindcss/vite` if using Tailwind v4
- `lucide-react`

Use native `fetch`; Axios is optional, not required.

## 6. Audio design

- Capture with `navigator.mediaDevices.getUserMedia({ audio: true })` and `MediaRecorder`.
- Prefer `audio/webm;codecs=opus` when supported.
- Use `MediaRecorder.isTypeSupported` and retain the actual MIME type.
- Upload with `multipart/form-data` to Flask.
- Do not manually set multipart `Content-Type` in browser fetch.
- Delete temporary audio after transcription; do not store raw audio.

## 7. Do not add

Do not add Vapi, Retell, LiveKit, Deepgram, ElevenLabs, paid OpenAI APIs, paid Claude APIs, Redis, Kafka, Celery, paid email/WhatsApp APIs, paid MCP servers or a separate microservice. They are unnecessary for the MVP and violate the free-only rule.
