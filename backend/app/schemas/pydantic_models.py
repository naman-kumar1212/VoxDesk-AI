"""
VoxDesk AI — Pydantic schemas
Validates all AI output and API request/response shapes.
"""
from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator


# --- Allowed enum values ---
CategoryLiteral = Literal["payment", "orders", "delivery", "technical", "account", "refund", "other"]
PriorityLiteral = Literal["low", "medium", "high"]
StatusLiteral = Literal["open", "in_progress", "escalated", "resolved"]


class ComplaintAnalysis(BaseModel):
    """Validated output from Gemini complaint analysis."""

    category: CategoryLiteral
    priority_recommendation: PriorityLiteral
    summary: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(default=None, max_length=2000)
    department_recommendation: Optional[str] = Field(default=None, max_length=64)
    requires_human_review: bool = False
    escalation_reason: Optional[str] = Field(default=None, max_length=500)
    customer_reply: Optional[str] = Field(default=None, max_length=500)

    @field_validator("summary", "description", "escalation_reason", "customer_reply", mode="before")
    @classmethod
    def strip_whitespace(cls, v):
        if isinstance(v, str):
            return v.strip() or None
        return v

    model_config = {"extra": "ignore"}  # ignore unknown keys from AI output


class CreateTicketRequest(BaseModel):
    """Validated request body for POST /api/tickets/from-transcript."""

    session_id: Optional[str] = None
    transcript: str = Field(..., min_length=1, max_length=5000)

    @field_validator("transcript", mode="before")
    @classmethod
    def normalize_transcript(cls, v):
        if isinstance(v, str):
            v = v.strip()
        if not v:
            raise ValueError("transcript must not be empty or whitespace only")
        return v


class TicketStatusUpdateRequest(BaseModel):
    """Validated request body for PATCH /api/admin/tickets/:id/status."""

    status: StatusLiteral
    reason: Optional[str] = Field(default=None, max_length=500)

