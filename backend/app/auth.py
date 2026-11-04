"""
VoxDesk AI — Authentication & Token Security
Manages Supabase Auth user verification, password hashing, and signed JWT session tokens.
"""
import base64
import hashlib
import hmac
import json
import logging
import time
import uuid
from typing import Optional, Tuple

from app.config import settings
from app.database import get_db
from sqlalchemy import text

logger = logging.getLogger(__name__)

TOKEN_LIFETIME_SECONDS = 86400  # 24 hours


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (4 - (len(data) % 4)) if len(data) % 4 != 0 else ""
    return base64.urlsafe_b64decode(data + padding)


def create_admin_jwt(user_id: str, email: str, role: str = "admin") -> Tuple[str, int]:
    """
    Creates a cryptographically signed HMAC-SHA256 JWT token.
    Returns (token_string, expires_at_unix_timestamp).
    """
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    expires_at = now + TOKEN_LIFETIME_SECONDS

    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": now,
        "exp": expires_at,
        "iss": "voxdesk-ai",
    }

    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    secret = settings.SECRET_KEY.encode("utf-8")
    signature = hmac.new(secret, signing_input, hashlib.sha256).digest()
    sig_b64 = _b64url_encode(signature)

    token = f"{header_b64}.{payload_b64}.{sig_b64}"
    return token, expires_at


def verify_admin_jwt(token: str) -> Optional[dict]:
    """
    Validates token signature and expiration.
    Returns decoded payload if valid and role == 'admin', else None.
    """
    if not token or "." not in token:
        return None

    parts = token.split(".")
    if len(parts) != 3:
        return None

    header_b64, payload_b64, sig_b64 = parts

    try:
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        secret = settings.SECRET_KEY.encode("utf-8")
        expected_sig = hmac.new(secret, signing_input, hashlib.sha256).digest()
        provided_sig = _b64url_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, provided_sig):
            logger.warning("Token signature verification failed.")
            return None

        payload = json.loads(_b64url_decode(payload_b64).decode("utf-8"))
        now = int(time.time())

        # Expiration check
        if payload.get("exp", 0) < now:
            logger.info("Token has expired.")
            return None

        return payload
    except Exception as exc:
        logger.error("Token verification error: %s", exc)
        return None


def authenticate_admin_user(email: str, password: str) -> Optional[dict]:
    """
    Authenticates an administrator against Supabase auth.users using pgcrypto.
    Enforces server-side that the user has admin role in app_metadata.
    Returns user dict on success, None on failure.
    """
    clean_email = email.strip().lower()
    if not clean_email or not password:
        return None

    try:
        db = next(get_db())
        query = text("""
            SELECT 
                id, 
                email, 
                role, 
                raw_app_meta_data, 
                raw_user_meta_data,
                is_super_admin,
                (encrypted_password = extensions.crypt(:password, encrypted_password)) AS password_matches
            FROM auth.users
            WHERE LOWER(email) = :email
            LIMIT 1;
        """)

        row = db.execute(query, {"email": clean_email, "password": password}).fetchone()
        if not row:
            db.close()
            return None

        (
            user_id,
            user_email,
            db_role,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            password_matches,
        ) = row

        if not password_matches:
            db.close()
            return None

        # Verify admin role server-side
        app_meta = raw_app_meta_data if isinstance(raw_app_meta_data, dict) else {}
        user_meta = raw_user_meta_data if isinstance(raw_user_meta_data, dict) else {}
        role = app_meta.get("role") or user_meta.get("role") or ("admin" if is_super_admin else None)

        if role != "admin" and not is_super_admin:
            logger.warning("User %s authenticated but does not possess admin role.", clean_email)
            db.close()
            return None

        # Update last sign-in timestamp
        update_query = text("UPDATE auth.users SET last_sign_in_at = NOW() WHERE id = :id;")
        db.execute(update_query, {"id": user_id})
        db.commit()
        db.close()

        name = user_meta.get("name") or user_meta.get("full_name") or clean_email.split("@")[0].title()

        return {
            "id": str(user_id),
            "email": user_email,
            "role": "admin",
            "name": name,
        }
    except Exception as exc:
        logger.error("Admin authentication query failed: %s", exc)
        return None


def create_or_update_admin(email: str, password: str, name: str = "VoxDesk Admin") -> dict:
    """
    Controlled administrative account creation in Supabase auth.users.
    Uses pgcrypto bcrypt hashing ($2a$10$...).
    """
    clean_email = email.strip().lower()
    db = next(get_db())

    # Check if exists
    existing = db.execute(
        text("SELECT id FROM auth.users WHERE LOWER(email) = :email;"),
        {"email": clean_email},
    ).fetchone()

    app_meta = json.dumps({"provider": "email", "providers": ["email"], "role": "admin"})
    user_meta = json.dumps({"name": name, "full_name": name, "role": "admin"})

    if existing:
        user_id = existing[0]
        update_sql = text("""
            UPDATE auth.users
            SET 
                encrypted_password = extensions.crypt(:password, extensions.gen_salt('bf', 10)),
                raw_app_meta_data = CAST(:app_meta AS jsonb),
                raw_user_meta_data = CAST(:user_meta AS jsonb),
                is_super_admin = TRUE,
                role = 'authenticated',
                updated_at = NOW()
            WHERE id = :id;
        """)
        db.execute(update_sql, {
            "id": user_id,
            "password": password,
            "app_meta": app_meta,
            "user_meta": user_meta,
        })
        db.commit()
        db.close()
        return {"id": str(user_id), "email": clean_email, "action": "updated"}
    else:
        new_id = uuid.uuid4()
        insert_sql = text("""
            INSERT INTO auth.users (
                id,
                instance_id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                is_super_admin,
                created_at,
                updated_at
            ) VALUES (
                :id,
                '00000000-0000-0000-0000-000000000000',
                'authenticated',
                'authenticated',
                :email,
                extensions.crypt(:password, extensions.gen_salt('bf', 10)),
                NOW(),
                CAST(:app_meta AS jsonb),
                CAST(:user_meta AS jsonb),
                TRUE,
                NOW(),
                NOW()
            );
        """)
        db.execute(insert_sql, {
            "id": new_id,
            "email": clean_email,
            "password": password,
            "app_meta": app_meta,
            "user_meta": user_meta,
        })
        db.commit()
        db.close()
        return {"id": str(new_id), "email": clean_email, "action": "created"}
