# 16. Official References and Free-Tier Checks

Check these links again before the hackathon. Model names, quotas, terms and free tiers can change. Do not treat a previous check as a permanent guarantee.

## Groq Whisper STT

- Speech-to-text API and model IDs: https://console.groq.com/docs/speech-to-text
- Rate limits: https://console.groq.com/docs/rate-limits
- Whisper Large V3 Turbo model page: https://console.groq.com/docs/model/whisper-large-v3-turbo
- Groq pricing: https://groq.com/pricing/
- Groq Free Plan FAQ: https://community.groq.com/t/do-i-get-charged-for-anything-on-the-groq-free-plan/832
- Current model selected: `whisper-large-v3-turbo`.
- Official STT docs identify the free-tier max upload as 25 MB. The model page also lists metered pricing for paid usage; this project must stay on Groq Free Plan and must stop when free quota is unavailable.

## Local Whisper fallback

- Faster-Whisper repository and implementation details: https://github.com/SYSTRAN/faster-whisper
- License: https://github.com/SYSTRAN/faster-whisper/blob/master/LICENSE
- Faster-Whisper is an MIT-licensed implementation. Use a small/base Whisper checkpoint with CPU int8 only as a local fallback; do not deploy it to a free host as a required component.

## Gemini complaint analysis

- Gemini API models: https://ai.google.dev/gemini-api/docs/models
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini rate limits: https://ai.google.dev/gemini-api/docs/rate-limits
- Deprecations/model status: https://ai.google.dev/gemini-api/docs/deprecations
- Selected model: `gemini-3.8-flash`.
- Current Google pricing page lists free input/output for Gemini 3.8 Flash. Check the actual project's rate limits in AI Studio. Free-tier content may be used to improve Google's products; use synthetic complaints.

## Browser TTS

- SpeechSynthesis: https://developer.mozilla.org/docs/Web/API/SpeechSynthesis
- SpeechSynthesisUtterance: https://developer.mozilla.org/docs/Web/API/SpeechSynthesisUtterance
- Browser SpeechSynthesis is the only TTS implementation in the project. Whisper is speech-to-text only and does not synthesize speech.

## Browser APIs

- MediaRecorder: https://developer.mozilla.org/docs/Web/API/MediaRecorder
- SpeechSynthesis: https://developer.mozilla.org/docs/Web/API/SpeechSynthesis
- SpeechSynthesisUtterance: https://developer.mozilla.org/docs/Web/API/SpeechSynthesisUtterance

## Supabase Free

- Pricing: https://supabase.com/pricing
- Billing and plan details: https://supabase.com/docs/guides/platform/billing-on-supabase
- Free plan currently lists a limited PostgreSQL database, egress and project allowance. Free projects can pause after inactivity. Check current quota and avoid paid upgrades.

## Vercel Hobby: frontend and Flask backend

- Hobby plan: https://vercel.com/docs/plans/hobby
- Python runtime: https://vercel.com/docs/functions/runtimes/python
- Flask on Vercel: https://vercel.com/docs/frameworks/backend/flask
- Function limits: https://vercel.com/docs/functions/limitations
- Vercel documents Flask support on the Python runtime and a 4.5 MB request/response payload limit for Functions. Keep audio uploads below 4 MB.
- Hobby is free for eligible personal/non-commercial projects, within current usage quotas. Check the current dashboard and do not upgrade.

## Google Antigravity

- Pricing: https://www.antigravity.google/pricing
- Plans: https://www.antigravity.google/docs/plans
- Current Individual plan is listed at $0/month with baseline weekly limits. Do not upgrade or enable AI-credit overages.
