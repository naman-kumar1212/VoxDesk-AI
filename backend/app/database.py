"""
VoxDesk AI — Database module
SQLAlchemy engine and session factory for Supabase Free PostgreSQL.
Configured with connection pooling, recycling, pre-ping, and query performance tracking.
"""
import logging
import time
from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


def _make_engine():
    if not settings.DATABASE_URL:
        logger.warning("DATABASE_URL is not set — database features will not work.")
        return None
    return create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,       # Validate connections before returning from pool
        pool_size=10,             # Keep 10 warm connections in pool
        max_overflow=20,          # Allow up to 20 burst connections
        pool_recycle=300,         # Recycle connections every 5 minutes (prevents stale drops)
        pool_timeout=15,          # Timeout waiting for pool connection
        connect_args={
            "connect_timeout": 10,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        },
    )


engine = _make_engine()

# Performance instrumentation: track total database query time per Flask request
if engine:
    @event.listens_for(engine, "before_cursor_execute")
    def _before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        context._query_start_time = time.perf_counter()

    @event.listens_for(engine, "after_cursor_execute")
    def _after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        if hasattr(context, "_query_start_time"):
            elapsed_ms = (time.perf_counter() - context._query_start_time) * 1000.0
            try:
                from flask import has_request_context, request
                if has_request_context():
                    request._db_time = getattr(request, "_db_time", 0.0) + elapsed_ms
                    request._db_queries = getattr(request, "_db_queries", 0) + 1
            except Exception:
                pass


SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
) if engine else None


def get_db():
    """Dependency — yields a database session and closes it after use."""
    if SessionLocal is None:
        raise RuntimeError("Database is not configured. Set DATABASE_URL.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Returns True if the database is reachable."""
    if engine is None:
        return False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error("Database health check failed: %s", exc)
        return False


def create_tables():
    """Create all tables from SQLAlchemy models. Call once at startup."""
    if engine is None:
        logger.warning("Skipping table creation — no database configured.")
        return
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created.")


