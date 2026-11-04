# 17. Free-Only Provider and Billing Policy

## 1. Non-negotiable rule

The hackathon application and its development workflow must cost **$0**. Use free plans, free APIs with explicit quotas, open-source packages and locally runnable open-weight models. Never enable metered billing, paid tiers, automatic overages or credits.

This document is an allowlist. Antigravity must not add providers outside it without asking the user.

## 2. Approved stack

| Need | Approved choice | Cost boundary | Fallback |
|---|---|---|---|
| Coding agent | Google Antigravity Individual | $0/month plan; weekly quota only | Manual coding / wait for quota refresh |
| Speech-to-text | Groq Free Plan + `whisper-large-v3-turbo` | Free plan only; no Developer tier | Local faster-whisper `base` if preinstalled; otherwise text input |
| STT model alternative | Groq Free Plan + `whisper-large-v3` | Use only if still included in free plan and quota | Same as above |
| AI complaint analysis | Gemini Developer API Free Tier + `gemini-3.8-flash` | No billing; free quota only | Deterministic Python rules marked as manual fallback |
| Text-to-speech | Browser SpeechSynthesis | Browser built-in; no API charge | Text confirmation if unavailable |
| Database | Supabase Free PostgreSQL | Free project only | Local SQLite for local demo only, clearly identified |
| Frontend deploy | Vercel Hobby | $0 Hobby plan; personal project terms | Local React dev server |
| Backend deploy | Vercel Hobby Python/Flask Function | Free within Hobby function quotas; separate Vercel project | Local Flask server |
| UI and backend packages | React, Vite, Flask, SQLAlchemy, Pydantic, pytest | Open-source/free | Not applicable |

## 3. Provider-specific restrictions

### Google Antigravity

- Use Individual plan listed at $0/month.
- Do not upgrade to Google AI Pro/Ultra for this task.
- Do not enable AI-credit overages or consumption-based APIs.
- Antigravity's baseline quota is limited and subject to change. If exhausted, wait or code manually; do not purchase credits.

### Groq Whisper

- Select Free Plan only.
- Use `whisper-large-v3-turbo` as first choice.
- Current Groq STT docs list a 25 MB upload cap for free tier. Keep recordings short (<=45 seconds) and small.
- Groq publishes metered per-hour pricing for paid usage. Those paid prices are not permission to use the paid tier. This project must remain on Free Plan.
- If the account dashboard indicates billing or requires a paid plan, stop and use local faster-whisper or text input.
- On 429/free quota exhaustion, do not retry with a paid key, alternate paid provider or paid tier.

### Gemini

- Use `gemini-3.8-flash` only under the Free Tier.
- Google's current pricing page lists free input/output for the model; rate limits are project- and model-specific and can change.
- Free-tier content may be used to improve Google's products. Use synthetic test data, not real support tickets.
- Do not turn on billing, paid grounding or paid tools.
- On rate limit/quota exhaustion, do not upgrade. Return a controlled manual-review path.

### TTS

- Browser SpeechSynthesis is the required TTS. It costs nothing to call and does not need a provider account.
- Whisper has no TTS output or companion TTS function.
- Do not use ElevenLabs, OpenAI TTS, paid Google Cloud TTS, paid voice cloning or any paid speech service.

### Hosting

- Supabase Free: check current DB/storage/egress limits and inactivity pause policy.
- Vercel Hobby: $0 for eligible personal/non-commercial projects, with function quotas and a 4.5 MB request/response payload limit. Do not upgrade to Pro.
- If a host presents a charge/upgrade prompt, stop and run locally.

## 4. TTS and MCP policy

Browser SpeechSynthesis is the only TTS implementation. Do not add a hosted TTS API or separate TTS model. Whisper is STT-only.

No MCP server is required by the application.

The app communicates with Groq and Gemini using their free API tiers and accesses PostgreSQL through SQLAlchemy. MCP is not part of the runtime architecture. Do not add a paid MCP server or connector. Antigravity may use any built-in capabilities that are included in its free Individual quota; never enable paid integrations or external services.

## 5. Hard billing safeguards

- Do not add a card to enable billing for any project.
- Do not attach a billing account to Google AI Studio for this project.
- Do not upgrade the Groq organization to Developer tier.
- Do not buy Antigravity credits or enable overages.
- Do not upgrade hosting instances.
- Set provider-level spend caps to zero/disabled if such a control exists, but do not rely on a cap as a substitute for staying on a free plan.
- The code must not implement automatic provider switching to any paid model.
- Treat HTTP 402, billing errors, quota exceeded and repeated 429 as hard stops, not retry invitations.

## 6. Free does not mean unlimited

Free tiers have rate limits, project limits, sleeping/cold starts, content-use terms and service availability constraints. Check the current dashboards on hackathon day. The goal is a no-charge demo, not a production service-level guarantee.
