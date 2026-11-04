"""
VoxDesk AI — SQLAlchemy ORM Models
Matches the schema defined in docs/09_DATABASE_SCHEMA.md exactly.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    desc,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)

    sessions = relationship("VoiceSession", back_populates="organization")
    tickets = relationship("Ticket", back_populates="organization")


class VoiceSession(Base):
    __tablename__ = "voice_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    channel = Column(String(32), nullable=False, default="web_voice")
    state = Column(String(24), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)

    organization = relationship("Organization", back_populates="sessions")
    tickets = relationship("Ticket", back_populates="session")


VALID_CATEGORIES = ("payment", "orders", "delivery", "technical", "account", "refund", "other")
VALID_PRIORITIES = ("low", "medium", "high")
VALID_STATUSES = ("open", "in_progress", "escalated", "resolved")
VALID_ANALYSIS_STATUSES = ("completed", "fallback", "pending")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number = Column(String(24), nullable=False, unique=True)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("voice_sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    idempotency_key = Column(UUID(as_uuid=True), nullable=False)
    transcript = Column(Text, nullable=False)
    category = Column(String(24), nullable=False)
    priority = Column(String(16), nullable=False)
    department = Column(String(64), nullable=False)
    summary = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(24), nullable=False, default="open")
    escalated = Column(Boolean, nullable=False, default=False)
    escalation_reason = Column(Text, nullable=True)
    analysis_status = Column(String(24), nullable=False, default="completed")
    customer_name = Column(String(120), nullable=True)
    customer_email = Column(String(255), nullable=True)
    internal_notes = Column(Text, nullable=True)
    is_demo = Column(Boolean, nullable=False, default=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)

    __table_args__ = (
        UniqueConstraint("organization_id", "idempotency_key", name="uq_org_idempotency"),
        CheckConstraint(
            f"category IN {VALID_CATEGORIES}",
            name="ck_ticket_category",
        ),
        CheckConstraint(
            f"priority IN {VALID_PRIORITIES}",
            name="ck_ticket_priority",
        ),
        CheckConstraint(
            f"status IN {VALID_STATUSES}",
            name="ck_ticket_status",
        ),
        CheckConstraint(
            f"analysis_status IN {VALID_ANALYSIS_STATUSES}",
            name="ck_ticket_analysis_status",
        ),
        Index("ix_tickets_org_created", "organization_id", "created_at"),
        Index("ix_tickets_org_status", "organization_id", "status"),
        Index("ix_tickets_org_priority", "organization_id", "priority"),
        Index("ix_tickets_org_category", "organization_id", "category"),
        Index("ix_tickets_org_dept", "organization_id", "department"),
        Index("ix_tickets_org_escalated", "organization_id", "escalated"),
        Index("ix_tickets_org_created_desc", "organization_id", desc("created_at")),
        Index("ix_tickets_org_status_created", "organization_id", "status", desc("created_at")),
        Index("ix_tickets_org_dept_created", "organization_id", "department", desc("created_at")),
        Index("ix_tickets_org_priority_created", "organization_id", "priority", desc("created_at")),
        Index("ix_tickets_org_category_created", "organization_id", "category", desc("created_at")),
    )

    organization = relationship("Organization", back_populates="tickets")
    session = relationship("VoiceSession", back_populates="tickets")
    events = relationship(
        "TicketEvent",
        back_populates="ticket",
        order_by="TicketEvent.created_at",
        cascade="all, delete-orphan",
    )


EVENT_TYPES = (
    "TICKET_CREATED",
    "TICKET_ESCALATED",
    "STATUS_CHANGED",
    "NOTE_ADDED",
    "DEPARTMENT_REASSIGNED",
)


class TicketEvent(Base):
    __tablename__ = "ticket_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type = Column(String(40), nullable=False)
    details = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)

    __table_args__ = (
        Index("ix_ticket_events_ticket_created", "ticket_id", "created_at"),
        Index("ix_ticket_events_created_at_desc", desc("created_at")),
    )

    ticket = relationship("Ticket", back_populates="events")


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name = Column(String(64), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(24), nullable=False, default="active")  # active, inactive
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)

    __table_args__ = (
        UniqueConstraint("organization_id", "name", name="uq_department_org_name"),
    )

    organization = relationship("Organization")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    auth_user_id = Column(UUID(as_uuid=True), nullable=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    role = Column(String(32), nullable=False, default="staff")  # admin, staff
    department = Column(String(64), nullable=True)
    status = Column(String(24), nullable=False, default="active")  # active, inactive
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    last_active_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_admin_users_org_status", "organization_id", "status"),
        Index("ix_admin_users_org_dept", "organization_id", "department"),
    )

    organization = relationship("Organization")


