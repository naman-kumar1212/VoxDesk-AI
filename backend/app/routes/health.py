"""
VoxDesk AI — Health endpoint
GET /api/health  — returns Flask + database status
"""
from flask import Blueprint, jsonify
from app.database import check_db_connection

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    db_ok = check_db_connection()
    return jsonify({
        "success": True,
        "data": {
            "api": "ok",
            "database": "ok" if db_ok else "unavailable",
        },
        "error": None,
    }), 200

