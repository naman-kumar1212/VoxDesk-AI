from app.services.business_rules import apply_business_rules, CATEGORY_TO_DEPARTMENT
from app.schemas.pydantic_models import ComplaintAnalysis

def test_category_to_department_mapping():
    assert CATEGORY_TO_DEPARTMENT["payment"] == "Billing Support"
    assert CATEGORY_TO_DEPARTMENT["orders"] == "Order Management"
    assert CATEGORY_TO_DEPARTMENT["delivery"] == "Logistics"
    assert CATEGORY_TO_DEPARTMENT["technical"] == "Technical Support"
    assert CATEGORY_TO_DEPARTMENT["account"] == "Account Support"
    assert CATEGORY_TO_DEPARTMENT["refund"] == "Returns and Refunds"
    assert CATEGORY_TO_DEPARTMENT["other"] == "General Support"

def test_fallback_when_ai_unavailable():
    result = apply_business_rules("My order is missing", None, "fallback")
    assert result["category"] == "other"
    assert result["department"] == "General Support"
    assert result["priority"] == "medium"
    assert result["escalated"] is True
    assert "manual review" in result["escalation_reason"].lower()

def test_repeated_contact_forces_escalation():
    analysis = ComplaintAnalysis(
        category="payment",
        priority_recommendation="low",
        summary="Payment issue",
        description="Payment was deducted",
        department_recommendation="Billing Support",
        requires_human_review=False,
    )
    transcript = "I have already contacted support twice about this payment issue."
    result = apply_business_rules(transcript, analysis, "completed")
    assert result["category"] == "payment"
    assert result["department"] == "Billing Support"
    assert result["escalated"] is True
    assert result["requires_human_review"] is True
    assert "repeated" in result["escalation_reason"].lower()

def test_fraud_pattern_triggers_high_priority_and_escalation():
    analysis = ComplaintAnalysis(
        category="payment",
        priority_recommendation="low",
        summary="Card issue",
        description="Unauthorized charge",
        department_recommendation="Billing Support",
        requires_human_review=False,
    )
    transcript = "I noticed an unauthorized charge on my account."
    result = apply_business_rules(transcript, analysis, "completed")
    assert result["priority"] == "high"
    assert result["escalated"] is True
    assert result["requires_human_review"] is True

