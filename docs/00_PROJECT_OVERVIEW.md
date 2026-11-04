# 00. Project Overview

## Product

**VoxDesk AI** is a voice-powered customer-support intake and ticket-management MVP.

## Problem statement

Customers often explain a problem verbally, but support teams still need to manually listen, understand, classify, prioritize and register the issue. This creates repetitive work and inconsistent ticket records.

VoxDesk AI lets a customer describe a complaint by voice. The system transcribes the audio using Whisper, extracts structured information with Gemini, applies backend business rules, creates a support ticket, and returns a spoken confirmation. A simple admin console lets support staff review, escalate and update tickets.

## Product positioning

Position the project as a reusable customer-support automation backend with a voice interface. The first demonstration scenario is an e-commerce support desk, but the data model and APIs should not hard-code the product to one retailer.

This is relevant to a backend developer hiring event at VocalLabs because it demonstrates:

- Audio ingestion and third-party model integration.
- REST API design and request validation.
- LLM-based structured extraction with schema validation.
- Deterministic backend business rules.
- Persistent relational data and event history.
- Idempotent ticket creation and status transitions.
- Graceful provider failure handling.

This is a project-fit rationale, not a claim about VocalLabs' private hiring rubric.

## Primary demo scenario

Customer says:

> "I ordered a laptop three days ago. The payment was deducted, but I did not receive an order confirmation. I have already contacted support twice."

Expected system behavior:

1. Record the browser microphone input.
2. Upload the audio to Flask.
3. Transcribe it with Groq Whisper Large V3 Turbo.
4. Show the transcript for customer review and correction.
5. Send the confirmed transcript to Gemini 3.8 Flash.
6. Validate the model's structured complaint analysis.
7. Apply Python category, priority, department and escalation rules.
8. Create a ticket and ticket-created event in Supabase PostgreSQL.
9. Return a ticket reference and customer-friendly message.
10. Speak the confirmation with browser SpeechSynthesis. No external TTS API is used.

## Target users

### Customer

A person who needs to register a support complaint without navigating a long form.

### Support administrator

A support team member who reviews incoming tickets, sees the transcript and AI summary, and changes ticket status or escalation state.

## MVP goals

- Complete one end-to-end audio-to-ticket flow.
- Make transcript review and correction possible before ticket creation.
- Persist tickets and status events in PostgreSQL.
- Provide an admin view with ticket filtering and details.
- Demonstrate basic human escalation.
- Deploy frontend and backend publicly for the judging demo.

## Explicit non-goals

- Actual PSTN, SIP or telephone-call answering.
- Full contact-center platform.
- CRM, ERP, email, WhatsApp or payment gateway integration.
- Real identity verification, payment investigation or refunds.
- Automated resolution of customer complaints.
- Production-grade multi-tenant authentication and authorization.
- Real-time streaming audio or speaker diarization.
- Medical, legal or emergency advice.

## Success definition

The MVP is successful only when a live spoken complaint becomes a database-backed ticket and the customer receives a spoken confirmation. A chatbot-only interaction is not a successful implementation.
