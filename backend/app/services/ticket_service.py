"""
VoxDesk AI — Ticket creation service
Idempotent ticket creation + initial event in one transaction.
"""
import uuid
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models import Ticket, TicketEvent

logger = logging.getLogger(__name__)


def _generate_ticket_number() -> str:
    """Generate VD-XXXXXXXX format ticket number (VD- + first 8 uppercase hex chars of UUID)."""
    return "VD-" + str(uuid.uuid4()).replace("-", "").upper()[:8]


def get_ticket_by_idempotency(
    db: Session, org_id: uuid.UUID, idempotency_key: uuid.UUID
) -> Ticket | None:
    """Return existing ticket for this idempotency key, or None."""
    return db.query(Ticket).filter(
        Ticket.organization_id == org_id,
        Ticket.idempotency_key == idempotency_key,
    ).first()


def create_ticket_with_event(
    db: Session,
    org_id: uuid.UUID,
    session_id: uuid.UUID | None,
    idempotency_key: uuid.UUID,
    transcript: str,
    analysis: dict,
    analysis_status: str,
) -> Ticket:
    """
    Create a ticket and its TICKET_CREATED event in a single transaction.
    On idempotency key collision (race condition), returns the existing ticket.
    Raises on other DB errors.
    """
    ticket_number = _generate_ticket_number()
    status = "escalated" if analysis.get("escalated") else "open"

    ticket = Ticket(
        ticket_number=ticket_number,
        organization_id=org_id,
        session_id=session_id,
        idempotency_key=idempotency_key,
        transcript=transcript,
        category=analysis["category"],
        priority=analysis["priority"],
        department=analysis["department"],
        summary=analysis["summary"],
        description=analysis.get("description", ""),
        status=status,
        escalated=analysis.get("escalated", False),
        escalation_reason=analysis.get("escalation_reason"),
        analysis_status=analysis_status,
    )

    try:
        db.add(ticket)
        db.flush()  # get ticket.id before committing

        event = TicketEvent(
            ticket_id=ticket.id,
            event_type="TICKET_CREATED",
            details={
                "category": ticket.category,
                "priority": ticket.priority,
                "department": ticket.department,
                "initial_status": ticket.status,
                "analysis_status": analysis_status,
            },
        )
        db.add(event)

        # If escalated at creation, add escalation event too
        if ticket.escalated:
            escalation_event = TicketEvent(
                ticket_id=ticket.id,
                event_type="TICKET_ESCALATED",
                details={
                    "reason": ticket.escalation_reason or "Escalated at creation by business rules.",
                    "from_status": "open",
                    "to_status": "escalated",
                },
            )
            db.add(escalation_event)

        db.commit()
        db.refresh(ticket)
        return ticket

    except IntegrityError:
        db.rollback()
        # Race condition: idempotency key was inserted by another request
        logger.info("Idempotency collision on key %s — returning existing ticket.", idempotency_key)
        existing = get_ticket_by_idempotency(db, org_id, idempotency_key)
        if existing:
            return existing
        raise  # re-raise if still not found (genuine DB error)

