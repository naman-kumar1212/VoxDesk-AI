"""
VoxDesk AI — Tickets endpoint
POST /api/tickets/from-transcript  — Gemini AI analysis + ticket creation
"""
import logging
import uuid

from flask import Blueprint, jsonify, request
from app.config import settings
from app.database import get_db
from app.services.ai_analysis import analyze_complaint, AIAnalysisError, AIQuotaError
from app.services.business_rules import apply_business_rules
from app.services.ticket_service import create_ticket_with_event, get_ticket_by_idempotency

logger = logging.getLogger(__name__)

tickets_bp = Blueprint("tickets", __name__)


def _error(code: str, message: str, status: int):
    return jsonify({"success": False, "data": None, "error": {"code": code, "message": message}}), status


def _ticket_response(ticket, analysis_status: str = "completed"):
    return {
        "ticket": {
            "id": str(ticket.id),
            "ticket_number": ticket.ticket_number,
            "category": ticket.category,
            "priority": ticket.priority,
            "department": ticket.department,
            "status": ticket.status,
            "escalated": ticket.escalated,
            "summary": ticket.summary,
            "created_at": ticket.created_at.isoformat(),
        },
        "spoken_reply": (
            f"Your complaint has been registered. "
            f"Your ticket reference is {ticket.ticket_number}. "
            f"The {ticket.department} team will review it."
        ),
        "analysis_status": analysis_status,
    }


@tickets_bp.post("/tickets/from-transcript")
def create_from_transcript():
    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization is not configured.", 503)

    # 1. Validate idempotency key
    idempotency_key_str = request.headers.get("Idempotency-Key", "")
    if not idempotency_key_str:
        return _error("MISSING_IDEMPOTENCY_KEY", "Idempotency-Key header is required.", 400)
    try:
        idempotency_key = uuid.UUID(idempotency_key_str)
    except ValueError:
        return _error("INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must be a valid UUID.", 400)

    body = request.get_json(silent=True)
    if not body:
        return _error("INVALID_REQUEST", "JSON body is required.", 400)

    transcript = (body.get("transcript") or "").strip()
    if not transcript:
        return _error("EMPTY_TRANSCRIPT", "A non-empty transcript is required.", 400)

    if len(transcript) > 5000:
        return _error("TRANSCRIPT_TOO_LONG", "Transcript exceeds maximum length.", 400)

    session_id_str = body.get("session_id")
    session_id = None
    if session_id_str:
        try:
            session_id = uuid.UUID(session_id_str)
        except ValueError:
            return _error("INVALID_SESSION_ID", "session_id must be a valid UUID.", 400)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)

    # 2. Idempotency check — return existing ticket if already created
    try:
        db = next(get_db())
        existing = get_ticket_by_idempotency(db, org_id, idempotency_key)
        if existing:
            db.close()
            return jsonify({
                "success": True,
                "data": _ticket_response(existing, existing.analysis_status),
                "error": None,
            }), 200
    except Exception as exc:
        logger.error("Idempotency check failed: %s", exc)
        db.close()
        return _error("DB_ERROR", "Database error during idempotency check.", 503)

    # 3. Gemini AI analysis
    analysis_status = "completed"
    ai_result = None
    customer_reply_text = None

    try:
        ai_result = analyze_complaint(transcript)
    except AIQuotaError as exc:
        logger.warning("Gemini quota exhausted, using fallback: %s", exc)
        analysis_status = "fallback"
    except AIAnalysisError as exc:
        logger.error("Gemini analysis failed, using fallback: %s", exc)
        analysis_status = "fallback"

    # 4. Apply deterministic Python business rules
    final_analysis = apply_business_rules(transcript, ai_result, analysis_status)

    # 5. Create ticket + initial event in one transaction
    try:
        ticket = create_ticket_with_event(
            db=db,
            org_id=org_id,
            session_id=session_id,
            idempotency_key=idempotency_key,
            transcript=transcript,
            analysis=final_analysis,
            analysis_status=analysis_status,
        )
        db.close()
    except Exception as exc:
        logger.error("Ticket creation failed: %s", exc)
        db.close()
        return _error("DB_ERROR", "Failed to persist ticket. Please retry.", 503)

    return jsonify({
        "success": True,
        "data": _ticket_response(ticket, analysis_status),
        "error": None,
    }), 201


@tickets_bp.get("/tickets/track/<ticket_number>")
def track_ticket(ticket_number: str):
    """
    Public ticket tracking endpoint for customers.
    Returns ticket status, details, and event timeline by ticket number.
    """
    clean_number = ticket_number.strip().upper()
    if not clean_number:
        return _error("INVALID_TICKET_NUMBER", "Ticket number is required.", 400)

    from app.models import Ticket, TicketEvent

    try:
        db = next(get_db())
        ticket = db.query(Ticket).filter(Ticket.ticket_number == clean_number).first()
        if not ticket:
            db.close()
            return _error("NOT_FOUND", f"Ticket '{clean_number}' not found.", 404)

        events_data = [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "details": e.details,
                "created_at": e.created_at.isoformat(),
            }
            for e in ticket.events
        ]

        ticket_data = {
            "id": str(ticket.id),
            "ticket_number": ticket.ticket_number,
            "category": ticket.category,
            "priority": ticket.priority,
            "department": ticket.department,
            "status": ticket.status,
            "escalated": ticket.escalated,
            "summary": ticket.summary,
            "created_at": ticket.created_at.isoformat(),
            "updated_at": ticket.updated_at.isoformat(),
            "events": events_data,
        }
        db.close()
        return jsonify({
            "success": True,
            "data": {"ticket": ticket_data},
            "error": None,
        }), 200
    except Exception as exc:
        logger.error("Ticket tracking query failed: %s", exc)
        return _error("DB_ERROR", "Failed to retrieve ticket tracking details.", 503)


