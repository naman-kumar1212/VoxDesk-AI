"""
VoxDesk AI — Sessions endpoint
POST /api/sessions  — create a voice session
"""
import uuid
from flask import Blueprint, jsonify, request
from app.config import settings
from app.database import get_db
from app.models import VoiceSession

sessions_bp = Blueprint("sessions", __name__)

ALLOWED_CHANNELS = {"web_voice", "text"}


def _error(code: str, message: str, status: int):
    return jsonify({"success": False, "data": None, "error": {"code": code, "message": message}}), status


@sessions_bp.post("/sessions")
def create_session():
    if not settings.DEMO_ORGANIZATION_ID:
        return _error("CONFIG_ERROR", "Demo organization is not configured.", 503)

    body = request.get_json(silent=True) or {}
    channel = body.get("channel", "web_voice")

    if channel not in ALLOWED_CHANNELS:
        return _error("INVALID_CHANNEL", f"channel must be one of: {', '.join(ALLOWED_CHANNELS)}", 400)

    try:
        db = next(get_db())
        session = VoiceSession(
            organization_id=uuid.UUID(settings.DEMO_ORGANIZATION_ID),
            channel=channel,
            state="active",
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        db.close()
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("Session creation failed: %s", exc)
        return _error("DB_ERROR", "Failed to create session.", 503)

    return jsonify({
        "success": True,
        "data": {"session_id": str(session.id)},
        "error": None,
    }), 201

