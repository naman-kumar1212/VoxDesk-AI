"""
VoxDesk AI — Admin endpoints
Covers all five admin console sections:
1. Dashboard (KPI overview, workload, distributions, recent activity)
2. Tickets (Paginated query, search, multi-filter, detail, update, events)
3. Analytics (Pandas metrics summary and Matplotlib/Seaborn in-memory PNG charts)
4. Departments (Department CRUD, workload monitoring, safe delete guard)
5. Users (Staff & Admin user management)
"""
import hmac
import io
import json
import logging
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from flask import Blueprint, jsonify, request, send_file
from sqlalchemy import desc, func, or_

# ─────────────────────────────────────────────────────────────────────────────
# IN-MEMORY QUERY & WORKLOAD CACHE (Low-latency navigation with mutation invalidation)
# ─────────────────────────────────────────────────────────────────────────────
_ADMIN_CACHE: dict = {}
_ADMIN_CACHE_LOCK = threading.Lock()
ADMIN_CACHE_TTL = 30.0  # seconds


def invalidate_admin_caches(org_id=None):
    """
    Invalidates administrative query caches.
    Must be called whenever tickets, departments, or users are mutated.
    """
    with _ADMIN_CACHE_LOCK:
        if org_id:
            prefix = str(org_id)
            keys_to_del = [k for k in _ADMIN_CACHE if str(k).startswith(prefix)]
            for k in keys_to_del:
                _ADMIN_CACHE.pop(k, None)
        else:
            _ADMIN_CACHE.clear()
from app.analytics import get_analytics_summary, render_chart_png, invalidate_analytics_cache
from app.auth import create_or_update_admin, verify_admin_jwt
from app.config import settings
from app.database import get_db
from app.models import (
    AdminUser,
    Department,
    Ticket,
    TicketEvent,
    VALID_CATEGORIES,
    VALID_PRIORITIES,
    VALID_STATUSES,
)

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
    return jsonify({
        "success": False,
        "data": None,
        "error": {"code": code, "message": message},
    }), status


def _require_admin():
    """
    Validates admin identity via Supabase Auth Bearer token or legacy admin key.
    Enforces server-side authorization.
    """
    # 1. Check Authorization Bearer token (Primary)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "").strip()
        payload = verify_admin_jwt(token)
        if not payload:
            return _error("UNAUTHORIZED", "Invalid or expired admin session token.", 401)
        role = payload.get("role")
        if role not in ("admin", "staff"):
            return _error("FORBIDDEN", "Administrator privileges required.", 403)
        return None

    # 2. Check X-Admin-Key (Backwards compatibility for existing test suite / CLI)
    provided_key = request.headers.get("X-Admin-Key", "")
    expected_key = settings.ADMIN_API_KEY
    if expected_key and provided_key:
        if hmac.compare_digest(provided_key.encode(), expected_key.encode()):
            return None
        return _error("UNAUTHORIZED", "Invalid admin key.", 401)

    return _error("UNAUTHORIZED", "Admin authentication token required.", 401)


def _ticket_to_dict(ticket: Ticket) -> dict:
    return {
        "id": str(ticket.id),
        "ticket_number": ticket.ticket_number,
        "category": ticket.category,
        "priority": ticket.priority,
        "department": ticket.department,
        "status": ticket.status,
        "escalated": bool(ticket.escalated),
        "escalation_reason": ticket.escalation_reason,
        "summary": ticket.summary,
        "description": ticket.description,
        "transcript": ticket.transcript,
        "analysis_status": ticket.analysis_status,
        "customer_name": ticket.customer_name or "Anonymous Customer",
        "customer_email": ticket.customer_email or "unspecified@example.com",
        "internal_notes": ticket.internal_notes or "",
        "is_demo": bool(ticket.is_demo),
        "session_id": str(ticket.session_id) if ticket.session_id else None,
        "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
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


def _department_to_dict(dept: Department, staff_count: int = 0, ticket_stats: Optional[dict] = None) -> dict:
    stats = ticket_stats or {"total": 0, "open": 0, "in_progress": 0, "resolved": 0, "escalated": 0}
    return {
        "id": str(dept.id),
        "name": dept.name,
        "description": dept.description or "",
        "status": dept.status,
        "staff_count": staff_count,
        "total_tickets": stats["total"],
        "open_tickets": stats["open"],
        "in_progress_tickets": stats["in_progress"],
        "resolved_tickets": stats["resolved"],
        "escalated_tickets": stats["escalated"],
        "created_at": dept.created_at.isoformat(),
        "updated_at": dept.updated_at.isoformat(),
    }


def _user_to_dict(u: AdminUser) -> dict:
    return {
        "id": str(u.id),
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "department": u.department or "General Support",
        "status": u.status,
        "created_at": u.created_at.isoformat(),
        "last_active_at": u.last_active_at.isoformat() if u.last_active_at else None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 1. DASHBOARD OVERVIEW ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.get("/admin/dashboard/summary")
def dashboard_summary():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)
    bypass_cache = request.args.get("bypass_cache", "").lower() in ("1", "true", "yes")

    cache_key = f"{org_id}:dashboard_summary"
    now_ts = time.time()
    if not bypass_cache:
        with _ADMIN_CACHE_LOCK:
            if cache_key in _ADMIN_CACHE:
                ts, cached_data = _ADMIN_CACHE[cache_key]
                if time.time() - ts < ADMIN_CACHE_TTL:
                    return jsonify({"success": True, "data": cached_data, "error": None}), 200

    try:
        db = next(get_db())
        # Consolidated query 1: All counts, status breakdown, and categories in a single scan
        counts = db.query(
            func.count(Ticket.id).label("total"),
            func.count(Ticket.id).filter(Ticket.status == "open").label("open"),
            func.count(Ticket.id).filter(Ticket.status == "in_progress").label("in_progress"),
            func.count(Ticket.id).filter(Ticket.status == "resolved").label("resolved"),
            func.count(Ticket.id).filter(Ticket.escalated == True).label("escalated"),  # noqa: E712
            func.count(Ticket.id).filter(Ticket.priority == "high").label("high_priority"),
            func.count(Ticket.id).filter(Ticket.category == "BILLING").label("cat_billing"),
            func.count(Ticket.id).filter(Ticket.category == "TECHNICAL").label("cat_technical"),
            func.count(Ticket.id).filter(Ticket.category == "ACCOUNT").label("cat_account"),
            func.count(Ticket.id).filter(Ticket.category == "PRODUCT").label("cat_product"),
            func.count(Ticket.id).filter(Ticket.category == "SERVICE").label("cat_service"),
            func.count(Ticket.id).filter(Ticket.category == "OTHER").label("cat_other"),
        ).filter(Ticket.organization_id == org_id).one()

        total = counts.total or 0
        open_count = counts.open or 0
        in_prog_count = counts.in_progress or 0
        resolved_count = counts.resolved or 0
        escalated_count = counts.escalated or 0
        high_priority = counts.high_priority or 0

        status_dist = {
            "open": open_count,
            "in_progress": in_prog_count,
            "resolved": resolved_count,
            "escalated": escalated_count,
        }

        cat_dist = {
            "BILLING": counts.cat_billing or 0,
            "TECHNICAL": counts.cat_technical or 0,
            "ACCOUNT": counts.cat_account or 0,
            "PRODUCT": counts.cat_product or 0,
            "SERVICE": counts.cat_service or 0,
            "OTHER": counts.cat_other or 0,
        }

        # Consolidated query 2: Department workload
        dept_rows = db.query(
            Ticket.department,
            func.count(Ticket.id).label("total"),
            func.count(Ticket.id).filter(Ticket.status == "open").label("open"),
            func.count(Ticket.id).filter(Ticket.status == "in_progress").label("in_progress"),
            func.count(Ticket.id).filter(Ticket.status == "resolved").label("resolved"),
            func.count(Ticket.id).filter(Ticket.escalated == True).label("escalated"),  # noqa: E712
        ).filter(Ticket.organization_id == org_id).group_by(Ticket.department).all()

        dept_workload = [
            {
                "name": row[0],
                "total": row[1],
                "open": row[2],
                "in_progress": row[3],
                "resolved": row[4],
                "escalated": row[5],
            }
            for row in dept_rows
        ]

        db.close()

        payload = {
            "total_tickets": total,
            "open_tickets": open_count,
            "in_progress_tickets": in_prog_count,
            "resolved_tickets": resolved_count,
            "escalated_tickets": escalated_count,
            "high_priority_tickets": high_priority,
            "status_distribution": status_dist,
            "category_distribution": cat_dist,
            "department_workload": dept_workload,
        }

        with _ADMIN_CACHE_LOCK:
            _ADMIN_CACHE[cache_key] = (time.time(), payload)

    except Exception as exc:
        logger.error("Dashboard summary query failed: %s", exc)
        return _error("DB_ERROR", "Failed to fetch dashboard summary.", 503)

    return jsonify({
        "success": True,
        "data": payload,
        "error": None,
    }), 200


@admin_bp.get("/admin/dashboard/recent-activity")
def dashboard_recent_activity():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)
    bypass_cache = request.args.get("bypass_cache", "").lower() in ("1", "true", "yes")

    cache_key = f"{org_id}:dashboard_recent_activity"
    now_ts = time.time()
    if not bypass_cache:
        with _ADMIN_CACHE_LOCK:
            if cache_key in _ADMIN_CACHE:
                ts, cached_data = _ADMIN_CACHE[cache_key]
                if time.time() - ts < ADMIN_CACHE_TTL:
                    return jsonify({"success": True, "data": cached_data, "error": None}), 200

    try:
        db = next(get_db())
        results = (
            db.query(
                TicketEvent.id,
                TicketEvent.event_type,
                TicketEvent.details,
                TicketEvent.created_at,
                Ticket.id.label("ticket_id"),
                Ticket.ticket_number,
                Ticket.category,
                Ticket.priority,
                Ticket.department,
                Ticket.customer_name,
                Ticket.summary,
            )
            .join(Ticket, TicketEvent.ticket_id == Ticket.id)
            .filter(Ticket.organization_id == org_id)
            .order_by(desc(TicketEvent.created_at))
            .limit(20)
            .all()
        )

        activities = [
            {
                "id": str(r.id),
                "event_type": r.event_type,
                "details": r.details,
                "created_at": r.created_at.isoformat(),
                "ticket_id": str(r.ticket_id),
                "ticket_number": r.ticket_number,
                "category": r.category,
                "priority": r.priority,
                "department": r.department,
                "customer_name": r.customer_name or "Customer",
                "summary": r.summary,
            }
            for r in results
        ]
        db.close()

        payload = {"activities": activities}
        with _ADMIN_CACHE_LOCK:
            _ADMIN_CACHE[cache_key] = (time.time(), payload)

    except Exception as exc:
        logger.error("Recent activity query failed: %s", exc)
        return _error("DB_ERROR", "Failed to fetch recent activity.", 503)

    return jsonify({
        "success": True,
        "data": payload,
        "error": None,
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# 2. TICKETS MANAGEMENT ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.get("/admin/tickets")
def list_tickets():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)

    # Filters & Pagination
    status_filter = request.args.get("status")
    priority_filter = request.args.get("priority")
    category_filter = request.args.get("category")
    dept_filter = request.args.get("department")
    search_q = request.args.get("q", "").strip()
    sort_by = request.args.get("sort_by", "created_at")
    sort_dir = request.args.get("sort_dir", "desc")

    try:
        page = max(1, int(request.args.get("page", 1)))
        page_size = min(100, max(1, int(request.args.get("page_size", 50))))
    except ValueError:
        return _error("INVALID_PARAMS", "page and page_size must be integers.", 400)

    bypass_cache = request.args.get("bypass_cache", "").lower() in ("1", "true", "yes")
    cache_key = f"{org_id}:tickets:{status_filter}:{priority_filter}:{category_filter}:{dept_filter}:{search_q}:{sort_by}:{sort_dir}:{page}:{page_size}"
    now_ts = time.time()
    if not bypass_cache and not search_q:
        with _ADMIN_CACHE_LOCK:
            if cache_key in _ADMIN_CACHE:
                ts, cached_data = _ADMIN_CACHE[cache_key]
                if time.time() - ts < ADMIN_CACHE_TTL:
                    return jsonify({"success": True, "data": cached_data, "error": None}), 200

    try:
        db = next(get_db())
        query = db.query(Ticket).filter(Ticket.organization_id == org_id)

        if status_filter and status_filter != "ALL":
            query = query.filter(Ticket.status == status_filter)
        if priority_filter and priority_filter != "ALL":
            query = query.filter(Ticket.priority == priority_filter)
        if category_filter and category_filter != "ALL":
            query = query.filter(Ticket.category == category_filter)
        if dept_filter and dept_filter != "ALL":
            query = query.filter(Ticket.department == dept_filter)

        if search_q:
            ilike_pat = f"%{search_q}%"
            query = query.filter(
                or_(
                    Ticket.ticket_number.ilike(ilike_pat),
                    Ticket.summary.ilike(ilike_pat),
                    Ticket.transcript.ilike(ilike_pat),
                    Ticket.customer_name.ilike(ilike_pat),
                    Ticket.customer_email.ilike(ilike_pat),
                    Ticket.department.ilike(ilike_pat),
                )
            )

        total = query.count()

        # Sorting
        sort_col = Ticket.created_at
        if sort_by == "priority":
            sort_col = Ticket.priority
        elif sort_by == "ticket_number":
            sort_col = Ticket.ticket_number

        query = query.order_by(desc(sort_col) if sort_dir == "desc" else sort_col)
        tickets = query.offset((page - 1) * page_size).limit(page_size).all()

        result = [_ticket_to_dict(t) for t in tickets]
        db.close()

        payload = {
            "tickets": result,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size if page_size else 1,
            },
        }
        if not search_q:
            with _ADMIN_CACHE_LOCK:
                _ADMIN_CACHE[cache_key] = (time.time(), payload)

    except Exception as exc:
        logger.error("Ticket list query failed: %s", exc)
        return _error("DB_ERROR", "Failed to fetch tickets.", 503)

    return jsonify({
        "success": True,
        "data": payload,
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


@admin_bp.get("/admin/tickets/<ticket_uuid>/events")
def get_ticket_events(ticket_uuid: str):
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    try:
        tid = uuid.UUID(ticket_uuid)
    except ValueError:
        return _error("INVALID_ID", "ticket_uuid must be a valid UUID.", 400)

    try:
        db = next(get_db())
        events = db.query(TicketEvent).filter(TicketEvent.ticket_id == tid).order_by(desc(TicketEvent.created_at)).all()
        result = [_event_to_dict(e) for e in events]
        db.close()
    except Exception as exc:
        logger.error("Failed to query ticket events: %s", exc)
        return _error("DB_ERROR", "Failed to fetch events.", 503)

    return jsonify({
        "success": True,
        "data": {"events": result},
        "error": None,
    }), 200


@admin_bp.patch("/admin/tickets/<ticket_uuid>")
@admin_bp.patch("/admin/tickets/<ticket_uuid>/status")
def update_ticket(ticket_uuid: str):
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    try:
        tid = uuid.UUID(ticket_uuid)
    except ValueError:
        return _error("INVALID_ID", "ticket_uuid must be a valid UUID.", 400)

    body = request.get_json(silent=True) or {}
    new_status = body.get("status")
    new_dept = body.get("department")
    new_notes = body.get("internal_notes")
    reason = body.get("reason", "").strip()

    if not any([new_status, new_dept, new_notes is not None]):
        return _error("INVALID_REQUEST", "At least one field (status, department, internal_notes) is required.", 400)

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)
    now = datetime.now(timezone.utc)

    try:
        db = next(get_db())
        ticket = db.query(Ticket).filter(
            Ticket.id == tid, Ticket.organization_id == org_id
        ).with_for_update().first()

        if not ticket:
            db.close()
            return _error("NOT_FOUND", "Ticket not found.", 404)

        # 1. Status Update
        if new_status and new_status != ticket.status:
            clean_status = new_status.strip().lower()
            if clean_status not in VALID_STATUSES:
                db.close()
                return _error("INVALID_STATUS", f"status must be one of: {', '.join(VALID_STATUSES)}", 422)

            allowed = VALID_TRANSITIONS.get(ticket.status, set())
            if clean_status not in allowed:
                db.close()
                return _error("INVALID_TRANSITION", f"Cannot transition from '{ticket.status}' to '{clean_status}'.", 409)

            old_status = ticket.status
            ticket.status = clean_status
            if clean_status == "escalated":
                ticket.escalated = True
                if reason:
                    ticket.escalation_reason = reason
            elif old_status == "escalated":
                ticket.escalated = False

            if clean_status == "resolved":
                ticket.resolved_at = now
            elif old_status == "resolved":
                ticket.resolved_at = None

            db.add(TicketEvent(
                ticket_id=ticket.id,
                event_type="TICKET_ESCALATED" if clean_status == "escalated" else "STATUS_CHANGED",
                details={"from_status": old_status, "to_status": clean_status, "reason": reason or None},
                created_at=now,
            ))

        # 2. Department Reassignment
        if new_dept and new_dept != ticket.department:
            old_dept = ticket.department
            ticket.department = new_dept.strip()
            db.add(TicketEvent(
                ticket_id=ticket.id,
                event_type="DEPARTMENT_REASSIGNED",
                details={"from_department": old_dept, "to_department": ticket.department, "reason": reason or None},
                created_at=now,
            ))

        # 3. Internal Notes Update
        if new_notes is not None and new_notes != ticket.internal_notes:
            ticket.internal_notes = new_notes.strip()
            db.add(TicketEvent(
                ticket_id=ticket.id,
                event_type="NOTE_ADDED",
                details={"preview": (ticket.internal_notes[:100] + "...") if len(ticket.internal_notes) > 100 else ticket.internal_notes},
                created_at=now,
            ))

        ticket.updated_at = now
        db.commit()
        db.refresh(ticket)
        invalidate_analytics_cache(org_id)
        invalidate_admin_caches(org_id)
        ticket_data = _ticket_to_dict(ticket)
        db.close()
    except Exception as exc:
        logger.error("Ticket update failed: %s", exc)
        return _error("DB_ERROR", "Failed to update ticket.", 503)

    return jsonify({
        "success": True,
        "data": {"ticket": ticket_data},
        "error": None,
    }), 200


# ─────────────────────────────────────────────────────────────────────────────
# 3. ANALYTICS (PANDAS + MATPLOTLIB + SEABORN)
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.get("/admin/analytics/summary")
def analytics_summary_endpoint():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)
    range_param = request.args.get("range", "all")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    try:
        summary_data = get_analytics_summary(org_id, range_param, start_date, end_date)
    except Exception as exc:
        logger.error("Analytics computation failed: %s", exc)
        return _error("ANALYTICS_ERROR", "Failed to compute analytics summary.", 500)

    return jsonify({
        "success": True,
        "data": summary_data,
        "error": None,
    }), 200


@admin_bp.get("/admin/analytics/charts/<chart_name>")
def analytics_chart_endpoint(chart_name: str):
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)
    range_param = request.args.get("range", "all")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    try:
        png_bytes = render_chart_png(org_id, chart_name, range_param, start_date, end_date)
        return send_file(io.BytesIO(png_bytes), mimetype="image/png")
    except Exception as exc:
        logger.error("Chart generation failed for '%s': %s", chart_name, exc)
        return _error("CHART_ERROR", f"Failed to generate chart {chart_name}.", 500)


# ─────────────────────────────────────────────────────────────────────────────
# 4. DEPARTMENTS MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.get("/admin/departments")
def list_departments():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)
    bypass_cache = request.args.get("bypass_cache", "").lower() in ("1", "true", "yes")

    cache_key = f"{org_id}:departments_list"
    now_ts = time.time()
    if not bypass_cache:
        with _ADMIN_CACHE_LOCK:
            if cache_key in _ADMIN_CACHE:
                ts, cached_data = _ADMIN_CACHE[cache_key]
                if time.time() - ts < 30.0:
                    return jsonify({"success": True, "data": cached_data, "error": None}), 200

    try:
        db = next(get_db())
        depts = db.query(Department).filter(Department.organization_id == org_id).order_by(Department.name).all()

        # Compute staff count per department
        staff_counts = dict(
            db.query(AdminUser.department, func.count(AdminUser.id))
            .filter(AdminUser.organization_id == org_id, AdminUser.status == "active")
            .group_by(AdminUser.department)
            .all()
        )

        # Compute ticket stats per department
        dept_stats_raw = db.query(
            Ticket.department,
            func.count(Ticket.id).label("total"),
            func.count(Ticket.id).filter(Ticket.status == "open").label("open"),
            func.count(Ticket.id).filter(Ticket.status == "in_progress").label("in_progress"),
            func.count(Ticket.id).filter(Ticket.status == "resolved").label("resolved"),
            func.count(Ticket.id).filter(Ticket.escalated == True).label("escalated"),  # noqa: E712
        ).filter(Ticket.organization_id == org_id).group_by(Ticket.department).all()

        dept_ticket_stats = {
            r[0]: {"total": r[1], "open": r[2], "in_progress": r[3], "resolved": r[4], "escalated": r[5]}
            for r in dept_stats_raw
        }

        result = [
            _department_to_dict(
                d,
                staff_count=staff_counts.get(d.name, 0),
                ticket_stats=dept_ticket_stats.get(d.name),
            )
            for d in depts
        ]
        db.close()

        payload = {"departments": result}
        with _ADMIN_CACHE_LOCK:
            _ADMIN_CACHE[cache_key] = (time.time(), payload)

    except Exception as exc:
        logger.error("List departments failed: %s", exc)
        return _error("DB_ERROR", "Failed to fetch departments.", 503)

    return jsonify({"success": True, "data": payload, "error": None}), 200


@admin_bp.post("/admin/departments")
def create_department():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)
    body = request.get_json(silent=True) or {}

    name = (body.get("name") or "").strip()
    description = (body.get("description") or "").strip()
    status = (body.get("status") or "active").strip().lower()

    if not name or len(name) < 2 or len(name) > 64:
        return _error("VALIDATION_ERROR", "Department name must be between 2 and 64 characters.", 422)

    try:
        db = next(get_db())
        existing = db.query(Department).filter(
            Department.organization_id == org_id,
            func.lower(Department.name) == func.lower(name),
        ).first()

        if existing:
            db.close()
            return _error("CONFLICT", f"Department '{name}' already exists.", 409)

        dept = Department(
            organization_id=org_id,
            name=name,
            description=description,
            status=status if status in ("active", "inactive") else "active",
        )
        db.add(dept)
        db.commit()
        db.refresh(dept)
        invalidate_admin_caches(org_id)
        data = _department_to_dict(dept)
        db.close()
    except Exception as exc:
        logger.error("Create department failed: %s", exc)
        return _error("DB_ERROR", "Failed to create department.", 503)

    return jsonify({"success": True, "data": {"department": data}, "error": None}), 201


@admin_bp.patch("/admin/departments/<dept_uuid>")
def update_department(dept_uuid: str):
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    try:
        did = uuid.UUID(dept_uuid)
    except ValueError:
        return _error("INVALID_ID", "dept_uuid must be a valid UUID.", 400)

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)
    body = request.get_json(silent=True) or {}

    try:
        db = next(get_db())
        dept = db.query(Department).filter(
            Department.id == did, Department.organization_id == org_id
        ).first()

        if not dept:
            db.close()
            return _error("NOT_FOUND", "Department not found.", 404)

        if "name" in body and body["name"]:
            new_name = body["name"].strip()
            # check conflict
            existing = db.query(Department).filter(
                Department.organization_id == org_id,
                func.lower(Department.name) == func.lower(new_name),
                Department.id != did,
            ).first()
            if existing:
                db.close()
                return _error("CONFLICT", f"Department '{new_name}' already exists.", 409)
            dept.name = new_name

        if "description" in body:
            dept.description = body["description"].strip()

        if "status" in body and body["status"] in ("active", "inactive"):
            dept.status = body["status"]

        dept.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(dept)
        invalidate_admin_caches(org_id)
        data = _department_to_dict(dept)
        db.close()
    except Exception as exc:
        logger.error("Update department failed: %s", exc)
        return _error("DB_ERROR", "Failed to update department.", 503)

    return jsonify({"success": True, "data": {"department": data}, "error": None}), 200


@admin_bp.delete("/admin/departments/<dept_uuid>")
def delete_department(dept_uuid: str):
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    try:
        did = uuid.UUID(dept_uuid)
    except ValueError:
        return _error("INVALID_ID", "dept_uuid must be a valid UUID.", 400)

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)

    try:
        db = next(get_db())
        dept = db.query(Department).filter(
            Department.id == did, Department.organization_id == org_id
        ).first()

        if not dept:
            db.close()
            return _error("NOT_FOUND", "Department not found.", 404)

        # Check for assigned tickets
        assigned_tickets = db.query(Ticket).filter(
            Ticket.organization_id == org_id, Ticket.department == dept.name
        ).count()

        if assigned_tickets > 0:
            db.close()
            return _error(
                "CONFLICT",
                f"Cannot delete department '{dept.name}' because {assigned_tickets} tickets are assigned to it. Reassign tickets first or mark department as inactive.",
                409,
            )

        db.delete(dept)
        db.commit()
        invalidate_admin_caches(org_id)
        db.close()
    except Exception as exc:
        logger.error("Delete department failed: %s", exc)
        return _error("DB_ERROR", "Failed to delete department.", 503)

    return jsonify({"success": True, "data": {"message": f"Department '{dept.name}' deleted successfully."}, "error": None}), 200


# ─────────────────────────────────────────────────────────────────────────────
# 5. USERS MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

@admin_bp.get("/admin/users")
def list_users():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)

    role_filter = request.args.get("role")
    dept_filter = request.args.get("department")
    status_filter = request.args.get("status")
    search_q = request.args.get("q", "").strip()
    bypass_cache = request.args.get("bypass_cache", "").lower() in ("1", "true", "yes")

    cache_key = f"{org_id}:users:{role_filter}:{dept_filter}:{status_filter}:{search_q}"
    now_ts = time.time()
    if not bypass_cache and not search_q:
        with _ADMIN_CACHE_LOCK:
            if cache_key in _ADMIN_CACHE:
                ts, cached_data = _ADMIN_CACHE[cache_key]
                if time.time() - ts < ADMIN_CACHE_TTL:
                    return jsonify({"success": True, "data": cached_data, "error": None}), 200

    try:
        db = next(get_db())
        query = db.query(AdminUser).filter(AdminUser.organization_id == org_id)

        if role_filter and role_filter != "ALL":
            query = query.filter(AdminUser.role == role_filter)
        if dept_filter and dept_filter != "ALL":
            query = query.filter(AdminUser.department == dept_filter)
        if status_filter and status_filter != "ALL":
            query = query.filter(AdminUser.status == status_filter)

        if search_q:
            ilike_pat = f"%{search_q}%"
            query = query.filter(
                or_(
                    AdminUser.name.ilike(ilike_pat),
                    AdminUser.email.ilike(ilike_pat),
                )
            )

        users = query.order_by(AdminUser.name).all()
        result = [_user_to_dict(u) for u in users]
        db.close()

        payload = {"users": result}
        if not search_q:
            with _ADMIN_CACHE_LOCK:
                _ADMIN_CACHE[cache_key] = (time.time(), payload)

    except Exception as exc:
        logger.error("List users failed: %s", exc)
        return _error("DB_ERROR", "Failed to fetch users.", 503)

    return jsonify({"success": True, "data": payload, "error": None}), 200


@admin_bp.post("/admin/users")
def create_user():
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)
    body = request.get_json(silent=True) or {}

    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    role = (body.get("role") or "staff").strip().lower()
    dept = (body.get("department") or "General Support").strip()
    password = body.get("password") or ""

    if not name or len(name) < 2:
        return _error("VALIDATION_ERROR", "Name is required.", 422)
    if not email or "@" not in email:
        return _error("VALIDATION_ERROR", "A valid email address is required.", 422)
    if role not in ("admin", "staff"):
        role = "staff"

    try:
        db = next(get_db())
        existing = db.query(AdminUser).filter(
            AdminUser.organization_id == org_id,
            func.lower(AdminUser.email) == email,
        ).first()

        if existing:
            db.close()
            return _error("CONFLICT", f"User with email '{email}' already exists.", 409)

        # If password is provided and role is admin, also seed into auth.users
        auth_user_id = None
        if password and len(password) >= 8:
            try:
                auth_res = create_or_update_admin(email, password, name)
                auth_user_id = uuid.UUID(auth_res["id"])
            except Exception as auth_err:
                logger.warning("Optional auth.users provisioning notice: %s", auth_err)

        user = AdminUser(
            organization_id=org_id,
            auth_user_id=auth_user_id,
            name=name,
            email=email,
            role=role,
            department=dept,
            status="active",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        invalidate_admin_caches(org_id)
        data = _user_to_dict(user)
        db.close()
    except Exception as exc:
        logger.error("Create user failed: %s", exc)
        return _error("DB_ERROR", "Failed to create user.", 503)

    return jsonify({"success": True, "data": {"user": data}, "error": None}), 201


@admin_bp.patch("/admin/users/<user_uuid>")
def update_user(user_uuid: str):
    auth_error = _require_admin()
    if auth_error:
        return auth_error

    try:
        uid = uuid.UUID(user_uuid)
    except ValueError:
        return _error("INVALID_ID", "user_uuid must be a valid UUID.", 400)

    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization not configured.", 503)

    org_id = uuid.UUID(settings.DEMO_ORGANIZATION_ID)
    body = request.get_json(silent=True) or {}

    try:
        db = next(get_db())
        user = db.query(AdminUser).filter(
            AdminUser.id == uid, AdminUser.organization_id == org_id
        ).first()

        if not user:
            db.close()
            return _error("NOT_FOUND", "User not found.", 404)

        if "name" in body and body["name"]:
            user.name = body["name"].strip()
        if "role" in body and body["role"] in ("admin", "staff"):
            user.role = body["role"]
        if "department" in body:
            user.department = body["department"].strip()
        if "status" in body and body["status"] in ("active", "inactive"):
            user.status = body["status"]

        db.commit()
        db.refresh(user)
        invalidate_admin_caches(org_id)
        data = _user_to_dict(user)
        db.close()
    except Exception as exc:
        logger.error("Update user failed: %s", exc)
        return _error("DB_ERROR", "Failed to update user.", 503)

    return jsonify({"success": True, "data": {"user": data}, "error": None}), 200
