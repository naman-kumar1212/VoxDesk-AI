# 01. Product Requirements Document (PRD)

## 1. Summary

VoxDesk AI converts a customer's spoken support complaint into a structured support ticket. It uses Whisper for audio transcription, Gemini for structured complaint analysis, Flask for validation and business actions, Supabase PostgreSQL for persistence, and TTS for verbal confirmation.

## 2. Problem

Manual complaint intake requires a support representative to listen to the customer, summarize the issue, choose a category and priority, assign a department, and create a ticket. VoxDesk AI automates the first-pass intake while preserving human review for escalation and resolution.

## 3. Product objectives

1. Reduce manual data entry during complaint registration.
2. Make complaint intake accessible through voice.
3. Produce consistent, structured ticket records.
4. Surface issues that need human attention.
5. Give support staff a simple queue for review and status management.

## 4. Personas

### Customer

- Wants to report an issue quickly.
- May not know the correct support department.
- Needs confirmation that the complaint was registered.
- Must be able to correct transcription errors.

### Support administrator

- Needs to review all incoming tickets.
- Needs category, priority, summary, department and original transcript.
- Needs to identify escalated complaints.
- Needs to update status and preserve activity history.

## 5. Core user stories

### Customer

- As a customer, I can start a recording and describe my complaint.
- As a customer, I can see the transcription returned by Whisper.
- As a customer, I can correct the transcript before submitting it.
- As a customer, I can submit the complaint and receive a ticket reference.
- As a customer, I can hear the confirmation spoken aloud.
- As a customer, I receive a clear error when recording or transcription fails.

### Administrator

- As an administrator, I can open the ticket dashboard.
- As an administrator, I can filter by category, priority and status.
- As an administrator, I can inspect the transcript and AI summary.
- As an administrator, I can see the escalation reason.
- As an administrator, I can change status to In Progress, Escalated or Resolved.
- As an administrator, I can see the event history of a ticket.

## 6. Functional requirements

### FR-01: Audio recording

- Customer can start and stop microphone recording.
- Browser must request microphone permission.
- Audio must be captured with `MediaRecorder`.
- Recording should be limited to 45 seconds for the MVP.
- Maximum accepted upload size is 25 MB.
- The UI must show Idle, Recording, Uploading and Transcribed states.

### FR-02: Whisper transcription

- Flask accepts multipart audio upload.
- Flask forwards the audio to Groq's OpenAI-compatible transcription API.
- Default model: `whisper-large-v3-turbo`.
- Optional model: `whisper-large-v3`, selected by backend environment variable.
- The model language setting is configurable. Use English (`en`) for the first demo; test Hindi as optional scope.
- Flask returns transcript text and detected language when available.
- Raw audio is not stored in the database.

### FR-03: Transcript review

- Customer can edit the returned transcript.
- Empty or whitespace-only transcripts cannot be submitted.
- Customer explicitly confirms submission to create a ticket.

### FR-04: AI complaint analysis

- Flask sends only the confirmed transcript to Gemini.
- Gemini returns a structured object matching the schema in `07_AI_LOGIC.md`.
- Pydantic validates the response.
- Unknown enum values must be normalized or rejected safely.

### FR-05: Ticket creation

- Flask applies deterministic business rules.
- Flask creates a unique ticket reference.
- Ticket and initial event are persisted in one database transaction.
- Initial status is `escalated` when final Python rules require human review; otherwise it is `open`.
- `escalated` boolean reflects whether the ticket is currently in the escalated state.
- Idempotency prevents duplicate tickets after retries.

### FR-06: Spoken response

- React generates a concise spoken confirmation using browser SpeechSynthesis.
- If browser TTS is unavailable, the text confirmation remains visible. No external TTS provider is called.
- The app must still display the response as text.

### FR-07: Admin dashboard

- Admin can view ticket count, open count, high-priority count and escalated count.
- Admin can filter ticket list by status, priority and category.
- Admin can open ticket details and inspect transcript, AI summary and event history.
- Admin can update status through authorized backend routes.

### FR-08: Ticket event history

- Ticket creation adds a `TICKET_CREATED` event.
- Status changes add a `STATUS_CHANGED` event.
- Escalation adds a `TICKET_ESCALATED` event.
- Event rows are append-only in application behavior.

## 7. Ticket classification values

### Categories

- `payment`
- `orders`
- `delivery`
- `technical`
- `account`
- `refund`
- `other`

### Priority

- `low`
- `medium`
- `high`

### Status

- `open`
- `in_progress`
- `escalated`
- `resolved`

### Departments

- `Billing Support`
- `Order Management`
- `Logistics`
- `Technical Support`
- `Account Support`
- `Returns and Refunds`
- `General Support`

## 8. Non-functional requirements

- API keys remain server-side.
- Only configured frontend origins are allowed by CORS.
- Audio is size- and duration-limited.
- Provider requests have timeouts and clear error handling.
- Database writes use transactions where related rows must remain consistent.
- Ticket creation is idempotent.
- UI remains usable on laptop and mobile screens.
- Backend logs do not contain secrets or unnecessary raw audio/transcript content.
- Free-tier provider use is subject to current account quotas and service policies.

## 9. MVP acceptance criteria

- [ ] Customer can record a complaint in the browser.
- [ ] Flask sends the audio to Whisper and returns a transcript.
- [ ] Customer can edit the transcript.
- [ ] Gemini returns valid structured complaint analysis.
- [ ] Python validates and normalizes the analysis.
- [ ] A ticket is persisted in Supabase PostgreSQL.
- [ ] Duplicate request IDs do not create duplicate tickets.
- [ ] Ticket confirmation is displayed and spoken.
- [ ] Admin can view, filter and update tickets.
- [ ] Status and escalation events are persisted.
- [ ] Publicly deployed frontend can call the deployed backend.

## 10. Product constraints

- Six-hour solo hackathon.
- English-first MVP.
- One demo organization.
- No phone carrier integration.
- No background job queue or separate microservices.
- The app demonstrates intake and routing, not actual complaint resolution.
