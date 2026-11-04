"""
VoxDesk AI — Deterministic Python business rules
Python owns final category→department mapping, priority overrides and escalation.
Gemini provides recommendations; this module decides the final values.
"""
from __future__ import annotations

import re
from typing import Optional

from app.schemas.pydantic_models import ComplaintAnalysis

# --- Category → Department mapping (Python-owned, not from LLM) ---
CATEGORY_TO_DEPARTMENT: dict[str, str] = {
    "payment": "Billing Support",
    "orders": "Order Management",
    "delivery": "Logistics",
    "technical": "Technical Support",
    "account": "Account Support",
    "refund": "Returns and Refunds",
    "other": "General Support",
}

# Fallback for any unexpected category
DEFAULT_DEPARTMENT = "General Support"


# --- Keyword patterns for deterministic escalation detection ---
_REPEATED_CONTACT_PATTERNS = [
    r"\b(contacted|called|emailed|reached out|tried).{0,30}(twice|multiple times|again|several times|[2-9] times)\b",
    r"\bno (response|reply|resolution|update)\b",
    r"\bstill (not|waiting|unresolved)\b",
    r"\balready contacted\b",
]
_FRAUD_PATTERNS = [
    r"\b(unauthorized|fraudulent|fraud|hacked|compromised|stolen)\b",
    r"\bsomeone (else )?charged\b",
    r"\bcard was used without\b",
]
_MULTIPLE_CHARGES_PATTERNS = [
    r"\b(double|duplicate|multiple) charge[ds]?\b",
    r"\bcharged (twice|two times|multiple times)\b",
]

_RE_REPEATED = [re.compile(p, re.IGNORECASE) for p in _REPEATED_CONTACT_PATTERNS]
_RE_FRAUD = [re.compile(p, re.IGNORECASE) for p in _FRAUD_PATTERNS]
_RE_MULTI_CHARGE = [re.compile(p, re.IGNORECASE) for p in _MULTIPLE_CHARGES_PATTERNS]


def _has_pattern(text: str, patterns: list[re.Pattern]) -> bool:
    return any(p.search(text) for p in patterns)


def apply_business_rules(
    transcript: str,
    ai_result: Optional[ComplaintAnalysis],
    analysis_status: str,
) -> dict:
    """
    Apply deterministic business rules to produce final ticket values.
    Returns a dict with keys: category, priority, department, summary, description,
    escalated, escalation_reason, requires_human_review, customer_reply.
    """
    # --- Fallback defaults when AI is unavailable ---
    if ai_result is None or analysis_status == "fallback":
        return {
            "category": "other",
            "priority": "medium",
            "department": "General Support",
            "summary": "AI analysis unavailable; manual review required.",
            "description": transcript[:1000],
            "escalated": True,
            "escalation_reason": "AI analysis was unavailable; ticket requires manual review.",
            "requires_human_review": True,
            "customer_reply": (
                "Your complaint has been registered but requires manual categorization. "
                "Our support team will review it shortly."
            ),
        }

    # --- Category (validate AI suggestion; fall back to 'other') ---
    valid_categories = set(CATEGORY_TO_DEPARTMENT.keys())
    category = ai_result.category if ai_result.category in valid_categories else "other"

    # --- Department (Python-owned mapping; ignore AI suggestion) ---
    department = CATEGORY_TO_DEPARTMENT.get(category, DEFAULT_DEPARTMENT)

    # --- Priority (start from AI recommendation, apply overrides) ---
    priority = ai_result.priority_recommendation or "medium"

    # Deterministic high-priority overrides
    is_fraud = _has_pattern(transcript, _RE_FRAUD)
    is_multi_charge = _has_pattern(transcript, _RE_MULTI_CHARGE)
    has_repeated_contact = _has_pattern(transcript, _RE_REPEATED)

    if is_fraud or is_multi_charge:
        priority = "high"
    elif has_repeated_contact and category == "payment":
        priority = max_priority(priority, "medium")

    # --- Escalation ---
    requires_human_review = bool(ai_result.requires_human_review)
    escalation_reason = ai_result.escalation_reason or ""

    # Force escalation on deterministic triggers
    if is_fraud or is_multi_charge:
        requires_human_review = True
        escalation_reason = escalation_reason or "Potential fraud or multiple charges detected."
    if has_repeated_contact and not requires_human_review:
        requires_human_review = True
        escalation_reason = escalation_reason or "Customer reports repeated unsuccessful support contact."

    escalated = requires_human_review

    return {
        "category": category,
        "priority": priority,
        "department": department,
        "summary": (ai_result.summary or "")[:500],
        "description": ai_result.description or "",
        "escalated": escalated,
        "escalation_reason": escalation_reason if escalated else None,
        "requires_human_review": requires_human_review,
        "customer_reply": ai_result.customer_reply or (
            "Your complaint has been registered. Our support team will review it shortly."
        ),
    }


def max_priority(a: str, b: str) -> str:
    """Return the higher of two priority strings."""
    order = {"low": 0, "medium": 1, "high": 2}
    return a if order.get(a, 0) >= order.get(b, 0) else b

