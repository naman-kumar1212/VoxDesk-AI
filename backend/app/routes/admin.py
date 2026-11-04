"""
VoxDesk AI — Admin endpoints
All routes require X-Admin-Key header (demo gate, not production auth).
"""
import hmac
import logging
import uuid

from flask import Blueprint, jsonify, request
from app.config import settings
from app.database import get_db
from app.models import Ticket, TicketEvent
from sqlalchemy import func, desc

logger = logging.getLogger(__name__)

admin_bp = Blueprint("admin", __name__)

# Valid status transitions (source → allowed targets)
VALID_TRANSITIONS: dict[str, set[str]] = {
    "open": {"in_progress", "escalated"},
    "in_progress": {"escalated", "resolved"},
    "escalated": {"in_progress", "resolved"},
    "resolved": set(),  # terminal
}


def _error(code: str, message: str, status: int):
    return jsonify({"success": False, "data": None, "error": {"code": code, "message": message}}), status


def _require_admin():
    """Returns None if authorized, or an error response tuple."""
    provided_key = request.headers.get("X-Admin-Key", "")
    expected_key = settings.ADMIN_API_KEY
    if not expected_key or not provided_key:
        return _error("UNAUTHORIZED", "Admin key is required.", 401)
    # Constant-time comparison
    if not hmac.compare_digest(provided_key.encode(), expected_key.encode()):
        return _error("UNAUTHORIZED", "Invalid admin key.", 401)
    return None


def _ticket_to_dict(ticket: Ticket) -> dict:
    return {
        "id": str(ticket.id),
        "ticket_number": ticket.ticket_number,
        "category": ticket.category,
        "priority": ticket.priority,
        "department": ticket.department,
        "status": ticket.status,
        "escalated": ticket.escalated,
        "escalation_reason": ticket.escalation_reason,
        "summary": ticket.summary,
        "description": ticket.description,
        "transcript": ticket.transcript,
        "analysis_status": ticket.analysis_status,
        "session_id": str(ticket.session_id) if ticket.session_id else None,
        "created_at": ticket.created_at.isoformat(),
        "updated_at": ticket.updated_at.isoformat(),
    }


def _event_to_dict(event: TicketEvent) -> dict:
    return {
        "id": str(event.id),
        "event_type": event.event_type,
        "details": event.details,
        "created_at": event.created_at.isoformat(),
    }


@admin_bp.get("/admin/analytics/summary")
def analytics_summary():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)

    try:
        db = next(get_db())
        total = db.query(func.count(Ticket.id)).filter(Ticket.organization_id == org_id).scalar()
        open_count = db.query(func.count(Ticket.id)).filter(
            Ticket.organization_id == org_id, Ticket.status == "open"
        ).scalar()
        high_priority = db.query(func.count(Ticket.id)).filter(
            Ticket.organization_id == org_id, Ticket.priority == "high"
        ).scalar()
        escalated = db.query(func.count(Ticket.id)).filter(
            Ticket.organization_id == org_id, Ticket.escalated == True  # noqa: E712
        ).scalar()
        db.close()
    except Exception as exc:
        logger.error("Analytics query failed: %s", exc)
        return _error("DB_ERROR", "Failed to fetch analytics.", 503)

    return jsonify({
        "success": True,
        "data": {
            "total_tickets": total,
            "open_tickets": open_count,
            "high_priority_tickets": high_priority,
            "escalated_tickets": escalated,
        },
        "error": None,
    }), 200


@admin_bp.get("/admin/tickets")
def list_tickets():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)

    # Filters
    status_filter = request.args.get("status")
    priority_filter = request.args.get("priority")
    category_filter = request.args.get("category")
    try:
        page = max(1, int(request.args.get("page", 1)))
        page_size = min(100, max(1, int(request.args.get("page_size", 50))))
    except ValueError:
        return _error("INVALID_PARAMS", "page and page_size must be integers.", 400)

    try:
        db = next(get_db())
        query = db.query(Ticket).filter(Ticket.organization_id == org_id)

        if status_filter:
            query = query.filter(Ticket.status == status_filter)
        if priority_filter:
            query = query.filter(Ticket.priority == priority_filter)
        if category_filter:
            query = query.filter(Ticket.category == category_filter)

        total = query.count()
        tickets = (
            query.order_by(desc(Ticket.created_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        result = [_ticket_to_dict(t) for t in tickets]
        db.close()
    except Exception as exc:
        logger.error("Ticket list query failed: %s", exc)
        return _error("DB_ERROR", "Failed to fetch tickets.", 503)

    return jsonify({
        "success": True,
        "data": {
            "tickets": result,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size if page_size else 1,
            },
        },
        "error": None,
    }), 200


@admin_bp.get("/admin/tickets/<ticket_uuid>")
def get_ticket(ticket_uuid: str):
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    try:
        tid = uuid.UUID(ticket_uuid)
    except ValueError:
        return _error("INVALID_ID", "ticket_uuid must be a valid UUID.", 400)

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)

    try:
        db = next(get_db())
        ticket = db.query(Ticket).filter(
            Ticket.id == tid, Ticket.organization_id == org_id
        ).first()
        if not ticket:
            db.close()
            return _error("NOT_FOUND", "Ticket not found.", 404)

        ticket_data = _ticket_to_dict(ticket)
        events = [_event_to_dict(e) for e in ticket.events]
        db.close()
    except Exception as exc:
        logger.error("Ticket detail query failed: %s", exc)
        return _error("DB_ERROR", "Failed to fetch ticket.", 503)

    return jsonify({
        "success": True,
        "data": {"ticket": ticket_data, "events": events},
        "error": None,
    }), 200


@admin_bp.patch("/admin/tickets/<ticket_uuid>/status")
def update_ticket_status(ticket_uuid: str):
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    try:
        tid = uuid.UUID(ticket_uuid)
    except ValueError:
        return _error("INVALID_ID", "ticket_uuid must be a valid UUID.", 400)

    body = request.get_json(silent=True)
    if not body:
        return _error("INVALID_REQUEST", "JSON body is required.", 400)

    new_status = body.get("status", "").strip()
    reason = body.get("reason", "").strip()

    from app.models import VALID_STATUSES
    if new_status not in VALID_STATUSES:
        return _error(
            "INVALID_STATUS",
            f"status must be one of: {', '.join(VALID_STATUSES)}",
            422,
        )

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)

    try:
        db = next(get_db())
        ticket = db.query(Ticket).filter(
            Ticket.id == tid, Ticket.organization_id == org_id
        ).with_for_update().first()

        if not ticket:
            db.close()
            return _error("NOT_FOUND", "Ticket not found.", 404)

        # Validate transition
        allowed = VALID_TRANSITIONS.get(ticket.status, set())
        if new_status not in allowed:
            db.close()
            return _error(
                "INVALID_TRANSITION",
                f"Cannot transition from '{ticket.status}' to '{new_status}'.",
                409,
            )

        old_status = ticket.status
        ticket.status = new_status

        # Manage escalated flag
        if new_status == "escalated":
            ticket.escalated = True
            if reason:
                ticket.escalation_reason = reason
        elif old_status == "escalated":
            ticket.escalated = False  # leaving escalated state

        # Append event
        event_type = "TICKET_ESCALATED" if new_status == "escalated" else "STATUS_CHANGED"
        event = TicketEvent(
            ticket_id=ticket.id,
            event_type=event_type,
            details={
                "from_status": old_status,
                "to_status": new_status,
                "reason": reason or None,
            },
        )
        db.add(event)
        db.commit()
        db.refresh(ticket)

        ticket_data = _ticket_to_dict(ticket)
        db.close()
    except Exception as exc:
        logger.error("Status update failed: %s", exc)
        return _error("DB_ERROR", "Failed to update ticket status.", 503)

    return jsonify({
        "success": True,
        "data": {"ticket": ticket_data},
        "error": None,
    }), 200

