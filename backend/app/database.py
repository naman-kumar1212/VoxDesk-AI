"""
VoxDesk AI — Database module
SQLAlchemy engine and session factory for Supabase Free PostgreSQL.
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

import logging

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


def _make_engine():
    if not settings.DATABASE_URL:
        logger.warning("DATABASE_URL is not set — database features will not work.")
        return None
    return create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,     # validate connections before use
        pool_size=5,
        max_overflow=10,
        connect_args={"connect_timeout": 10},
    )


engine = _make_engine()

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
    # Import models so metadata is populated before create_all
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created.")

