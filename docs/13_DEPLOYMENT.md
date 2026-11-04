# 13. Local Setup and Free-Tier Deployment

## 1. Cost constraint

This project must run on $0 plans only. Do not attach paid services, turn on automatic overages, purchase credits or use metered paid endpoints. If a host or provider requires payment to continue, stop and use the local demo path.

## 2. Repository structure

```text
voxdesk-ai/
├── AGENTS.md
├── README.md
├── docs/
├── .agents/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
└── backend/
    ├── app/
    ├── tests/
    ├── requirements.txt
    ├── wsgi.py
    └── .env.example
```

## 3. Backend environment

Create `backend/.env.example`:

```env
FLASK_ENV=development
SECRET_KEY=replace-me
FRONTEND_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql+psycopg://user:password@host:5432/postgres
GROQ_API_KEY=free_plan_key_only
WHISPER_MODEL=whisper-large-v3-turbo
WHISPER_LANGUAGE=en
GEMINI_API_KEY=google_ai_studio_free_tier_key
GEMINI_MODEL=gemini-3.8-flash
TTS_PROVIDER=browser
ADMIN_API_KEY=replace-with-long-random-secret
DEMO_ORGANIZATION_ID=replace-with-seeded-organization-uuid
MAX_AUDIO_MB=4
MAX_RECORDING_SECONDS=45
```

Browser SpeechSynthesis is the only TTS. No TTS API key or model setting is required.

Never commit `.env` files or actual API keys.

## 4. Frontend environment

Create `frontend/.env.example`:

```env
VITE_API_BASE_URL=https://YOUR-VERCEL-BACKEND.vercel.app/api
```

For local development use `http://localhost:5000/api`.

No Gemini key, Groq key, database password or Supabase service-role key belongs in a Vite variable.

## 5. Local run

Backend, from `backend/`:

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
flask --app wsgi run --debug
```

Frontend, from `frontend/`:

```bash
npm install
npm run dev
```

Use localhost or HTTPS for microphone access.

## 6. Supabase Free PostgreSQL

1. Create a Supabase project on the Free plan.
2. Confirm database size, egress and project limits in the account dashboard.
3. Create schema from `docs/09_DATABASE_SCHEMA.md`.
4. Seed one demo organization.
5. Put the database connection URL in backend `DATABASE_URL` only.
6. Do not enable paid compute or paid add-ons.

Supabase Free includes limited database and project allowances; free projects can pause after inactivity. Verify current limits before the event. Use SQLAlchemy with conservative connection pooling because Flask runs as serverless functions in the hosted deployment.

## 7. Vercel Hobby deployment for Flask backend

Vercel supports Flask on its Python runtime. Create a separate Vercel project from the same Git repository:

- Project name: `voxdesk-api`.
- Root directory: `backend`.
- Framework preset: allow Vercel to detect Flask/Python.
- Ensure `backend/wsgi.py` exports a top-level WSGI variable named `app`, for example `app = create_app()`.
- Keep `requirements.txt` inside `backend/` with only required packages.
- Configure backend environment variables in the Vercel project settings.
- Do not use a paid Vercel plan or additional paid services.

The backend is deployed as a serverless Flask application, not as a continuously running Gunicorn server. Keep request handling stateless and store all persistent data in Supabase.

## 8. Vercel Hobby deployment for React frontend

Create a second Vercel project from the same Git repository:

- Project name: `voxdesk-web`.
- Root directory: `frontend`.
- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Set `VITE_API_BASE_URL` to the deployed Flask backend URL plus `/api`.
- Set backend `FRONTEND_ORIGIN` to the exact frontend URL.
- Keep both projects on eligible $0 Hobby plan; do not upgrade.

Vercel Hobby is intended for personal, non-commercial projects. This deployment is for an individual hackathon/portfolio prototype. Do not use Hobby to host a commercial production service.

## 9. Vercel request and execution limits

Vercel Functions document a 4.5 MB request/response payload limit. Set `MAX_AUDIO_MB=4`, use compressed WebM/Opus and limit voice clips to 30-45 seconds. Reject larger files before forwarding them to Groq.

Keep STT and Gemini calls short. Verify current Hobby function duration, memory and usage quotas. The free plan blocks or limits use when quotas are exhausted; do not add a paid fallback. No raw audio or large model weights should be stored in the function bundle.

## 10. CORS and secrets

Allow only localhost for local development and the exact deployed Vercel frontend origin in production. Do not use wildcard CORS. Never expose provider credentials or database connection strings to React.

## 11. Provider quota behavior

- Groq Free Plan: stop on quota/429. Do not enable Developer tier. Offer manual text entry; optional local `faster-whisper` fallback can run on the developer laptop.
- Gemini Free Tier: stop on quota/429. Do not attach billing or upgrade. Use a clearly labeled manual-review fallback if necessary.
- TTS: browser SpeechSynthesis only. If unavailable, retain text confirmation.
- Do not repeatedly retry quota failures.

## 12. Fully local demo fallback

If Vercel deployment or free quota is unavailable, run React and Flask locally on the laptop. Keep Supabase Free as the database. If Supabase is unavailable, use local SQLite for the local presentation only and label it as a local fallback, not the deployed database.

## 13. Pre-demo billing check

Before the event, confirm:

- Antigravity is on the $0 Individual plan and AI-credit overages are off.
- Groq account is on the Free Plan, not Developer tier.
- Google AI Studio project is on Free Tier and has no billing attached for this project.
- Gemini model IDs are available in the active Free Tier.
- Supabase is on Free plan.
- Both Vercel projects are on Hobby.
- No paid MCP, paid add-on, credit pack or automatic overage is enabled.
