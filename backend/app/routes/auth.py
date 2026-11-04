"""
VoxDesk AI — Admin Authentication Endpoints
Uses Supabase Auth credentials and cryptographically signed session tokens.
"""
import logging
from flask import Blueprint, jsonify, request
from app.auth import authenticate_admin_user, create_admin_jwt, verify_admin_jwt

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__)


def _error(code: str, message: str, status: int):
    return jsonify({
        "success": False,
        "data": None,
        "error": {"code": code, "message": message},
    }), status


@auth_bp.post("/auth/login")
def admin_login():
    """
    Authenticate administrator with Supabase email/password.
    Returns session JWT on success.
    """
    body = request.get_json(silent=True)
    if not body:
        return _error("INVALID_REQUEST", "JSON body with email and password is required.", 400)

    email = (body.get("email") or "").strip()
    password = body.get("password") or ""

    if not email:
        return _error("VALIDATION_ERROR", "Email or Admin ID is required.", 422)
    if not password:
        return _error("VALIDATION_ERROR", "Password is required.", 422)

    user = authenticate_admin_user(email, password)
    if not user:
        return _error("INVALID_CREDENTIALS", "Invalid email or password.", 401)

    token, expires_at = create_admin_jwt(user["id"], user["email"], user["role"])

    logger.info("Admin user '%s' authenticated successfully.", user["email"])
    return jsonify({
        "success": True,
        "data": {
            "user": user,
            "token": token,
            "expires_at": expires_at,
        },
        "error": None,
    }), 200


@auth_bp.get("/auth/me")
def admin_me():
    """
    Returns current authenticated administrator profile.
    """
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip() if auth_header.startswith("Bearer ") else ""

    payload = verify_admin_jwt(token)
    if not payload or payload.get("role") != "admin":
        return _error("UNAUTHORIZED", "Active admin session required.", 401)

    return jsonify({
        "success": True,
        "data": {
            "user": {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "role": payload.get("role"),
            },
            "expires_at": payload.get("exp"),
        },
        "error": None,
    }), 200


@auth_bp.post("/auth/logout")
def admin_logout():
    """
    Secure sign out endpoint.
    """
    return jsonify({
        "success": True,
        "data": {"message": "Signed out successfully."},
        "error": None,
    }), 200
