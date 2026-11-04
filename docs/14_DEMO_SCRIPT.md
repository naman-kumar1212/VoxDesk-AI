# 14. Three-Minute Hackathon Demo Script

## Demo objective

Show that VoxDesk AI performs a real workflow: spoken complaint -> Whisper transcript -> Gemini extraction -> backend business logic -> database-backed ticket -> spoken confirmation -> admin review.

## Preparation

Before judging:

- Open the deployed customer page.
- Open the deployed admin dashboard in a second tab.
- Verify microphone permission.
- Check the Vercel Flask API `/api/health` endpoint.
- Confirm Groq and Gemini quotas.
- Keep the admin demo key available privately.
- Prepare a text-input fallback.
- Use synthetic complaint content only.

## 0:00-0:25: Problem and product

Say:

> "Support teams receive complaints in unstructured language. Someone must listen, understand, classify and manually register each issue. VoxDesk AI automates the first-pass intake while keeping humans in control of investigation and resolution."

## 0:25-1:10: Voice-to-ticket live flow

Speak:

> "I ordered a laptop three days ago. The payment was deducted, but I did not receive order confirmation. I have already contacted support twice."

Show:

1. MediaRecorder recording state.
2. Audio upload to Flask.
3. Whisper transcript returned.
4. Editable transcript.
5. Customer confirmation.

## 1:10-1:45: AI and action

Show the ticket result:

- Category: Payment.
- Department: Billing Support.
- Priority: Medium/High according to rules.
- Escalation: Yes because repeated support attempts were reported.
- Status: Escalated because repeated unsuccessful support contact was reported.

Explain that Gemini returns structured data, Pydantic validates it, and Python rules decide the final routing and escalation.

Show ticket number and spoken confirmation.

## 1:45-2:25: Admin workflow

Open admin dashboard.

- Find the ticket.
- Open details.
- Show original transcript and AI summary.
- Show ticket event history.
- Change status to In Progress or Resolved.
- Show the persisted update.

## 2:25-3:00: Backend engineering

Show a short architecture diagram or API list.

Say:

> "The frontend only captures audio and displays results. Flask owns the orchestration, provider calls, validation, business rules and database transactions. Whisper handles transcription, Gemini returns structured complaint data, and PostgreSQL stores the ticket and event history. Ticket creation is idempotent, so a retry does not create duplicate tickets."

Do not claim features that are not implemented. Do not claim production-ready security or real telephone integration.
