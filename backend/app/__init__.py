"""
VoxDesk AI — Application Factory
"""
import logging
import time
from flask import Flask, jsonify, request
from flask_cors import CORS

from app.config import settings
from app.routes.health import health_bp
from app.routes.sessions import sessions_bp
from app.routes.voice import voice_bp
from app.routes.tickets import tickets_bp
from app.routes.admin import admin_bp
from app.routes.auth import auth_bp

logger = logging.getLogger(__name__)


def create_app(test_config=None) -> Flask:
    app = Flask(__name__)

    # Basic logging configuration
    logging.basicConfig(
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    if test_config:
        app.config.update(test_config)
    else:
        app.config["SECRET_KEY"] = settings.SECRET_KEY
        app.config["MAX_CONTENT_LENGTH"] = settings.MAX_AUDIO_BYTES

    # Structured Request Performance Middleware
    @app.before_request
    def _record_request_start():
        request._start_time = time.perf_counter()
        request._db_time = 0.0
        request._db_queries = 0

    @app.after_request
    def _record_request_end(response):
        if hasattr(request, "_start_time"):
            total_ms = (time.perf_counter() - request._start_time) * 1000.0
            db_ms = getattr(request, "_db_time", 0.0)
            proc_ms = max(0.0, total_ms - db_ms)
            queries = getattr(request, "_db_queries", 0)
            logger.info(
                f"[PERFORMANCE] {request.method} {request.path} | DB: {db_ms:.1f}ms ({queries} queries) | Processing: {proc_ms:.1f}ms | Total: {total_ms:.1f}ms"
            )
        return response

    # Restrict CORS to configured frontend origin
    # Supports comma-separated origins if needed
    origins = [orig.strip() for orig in settings.FRONTEND_ORIGIN.split(",") if orig.strip()]
    CORS(
        app,
        resources={r"/api/*": {"origins": origins if origins else ["http://localhost:5173"]}},
        supports_credentials=True,
        expose_headers=["Content-Type", "Idempotency-Key", "X-Admin-Key"],
        allow_headers=["Content-Type", "Idempotency-Key", "X-Admin-Key", "Authorization"],
    )

    # Register blueprints under /api
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(sessions_bp, url_prefix="/api")
    app.register_blueprint(voice_bp, url_prefix="/api")
    app.register_blueprint(tickets_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")

    # Global error handlers for consistent JSON envelope
    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({
            "success": False,
            "data": None,
            "error": {"code": "NOT_FOUND", "message": "Resource not found."},
        }), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(e):
        return jsonify({
            "success": False,
            "data": None,
            "error": {"code": "METHOD_NOT_ALLOWED", "message": "Method not allowed."},
        }), 405

    @app.errorhandler(413)
    def handle_payload_too_large(e):
        return jsonify({
            "success": False,
            "data": None,
            "error": {"code": "PAYLOAD_TOO_LARGE", "message": f"Payload exceeds {settings.MAX_AUDIO_MB} MB."},
        }), 413

    @app.errorhandler(500)
    def handle_server_error(e):
        logger.error("Unhandled internal server error: %s", e)
        return jsonify({
            "success": False,
            "data": None,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": "An internal server error occurred."},
        }), 500

    return app

