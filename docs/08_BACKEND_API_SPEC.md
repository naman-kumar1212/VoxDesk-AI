# 08. Backend REST API Specification

Base path: `/api`

All JSON endpoints should use a consistent envelope where practical:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

For errors:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A transcript is required."
  }
}
```

## 1. Health check

`GET /api/health`

Purpose: verify Flask process and database connectivity.

Response example:

```json
{
  "success": true,
  "data": {
    "api": "ok",
    "database": "ok"
  },
  "error": null
}
```

Do not expose environment variables, API keys or connection strings.

## 2. Create voice session

`POST /api/sessions`

Request:

```json
{
  "channel": "web_voice"
}
```

Backend assigns the organization based on server configuration and returns a session UUID.

## 3. Transcribe audio

`POST /api/voice/transcribe`

Content type: `multipart/form-data`.

Field:

- `audio`: WebM/WAV/MP3/M4A/FLAC file.

Optional form field:

- `session_id`: valid session UUID.

Response:

```json
{
  "success": true,
  "data": {
    "transcript": "My payment was deducted but my order was not confirmed.",
    "language": "en",
    "provider": "groq",
    "model": "whisper-large-v3-turbo"
  },
  "error": null
}
```

Do not accept model name or provider URL from the client.

## 4. Analyze transcript and create ticket

`POST /api/tickets/from-transcript`

Headers:

- `Content-Type: application/json`
- `Idempotency-Key: <UUID>`

Request:

```json
{
  "session_id": "<session-uuid>",
  "transcript": "My payment was deducted but my order was not confirmed."
}
```

Backend:

1. Validate session and transcript.
2. Resolve organization from server-side context.
3. Check idempotency key for an existing ticket.
4. Call Gemini and validate structured result.
5. Apply Python rules.
6. Create ticket and initial event in a single transaction.
7. Return the existing ticket for a repeated idempotency key.

Response:

```json
{
  "success": true,
  "data": {
    "ticket": {
      "id": "<uuid>",
      "ticket_number": "VD-1A2B3C4D",
      "category": "payment",
      "priority": "medium",
      "department": "Billing Support",
      "status": "open",
      "escalated": false,
      "summary": "Payment deducted without order confirmation."
    },
    "spoken_reply": "Your complaint has been registered. Your ticket reference is VD-1A2B3C4D.",
    "analysis_status": "completed"
  },
  "error": null
}
```

## 5. List tickets

`GET /api/admin/tickets?status=open&priority=high&category=payment&page=1&page_size=50`

Requires `X-Admin-Key`.

Allowed query filters:

- `status`
- `priority`
- `category`
- `page`
- `page_size` (maximum 100)

Response includes ticket rows and pagination metadata.

## 6. Get ticket detail

`GET /api/admin/tickets/<ticket_uuid>`

Requires `X-Admin-Key`.

Return ticket fields, transcript, summary, escalation reason and ordered event history.

## 7. Update ticket status

`PATCH /api/admin/tickets/<ticket_uuid>/status`

Requires `X-Admin-Key`.

Request:

```json
{
  "status": "escalated",
  "reason": "Requires manual billing investigation."
}
```

Validate allowed status and transition. Update the ticket and append an event in one transaction. Return HTTP 409 for invalid transition.

## 8. Analytics summary

`GET /api/admin/analytics/summary`

Requires `X-Admin-Key`.

Return database-derived counts:

- `total_tickets`
- `open_tickets`
- `high_priority_tickets`
- `escalated_tickets`

## 9. Generate TTS audio

`POST /api/voice/synthesize`

Request:

```json
{
  "text": "Your complaint has been registered. Your ticket reference is VD-1A2B3C4D."
}
```

Response:

- Status 200.
- `Content-Type: audio/wav`.
- Body contains generated audio bytes.

Limit text length, for example 500 characters. This endpoint is optional for ticket creation; browser speech synthesis is the fallback.

## 10. Error handling

| HTTP | Use |
|---|---|
| 200 | Successful read or action |
| 201 | New session or ticket created |
| 400 | Invalid request |
| 401 | Missing/invalid admin key |
| 404 | Resource not found |
| 409 | Idempotency conflict or invalid state transition |
| 413 | Audio too large |
| 415 | Unsupported audio format |
| 422 | Valid JSON but invalid schema/field values |
| 429 | Provider/account rate limit |
| 502 | Upstream AI/STT/TTS provider error |
| 503 | Temporarily unavailable |
| 500 | Unexpected server failure |

Never return stack traces or secret values to the client.
