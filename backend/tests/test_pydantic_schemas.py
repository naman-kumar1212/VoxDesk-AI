import pytest
from pydantic import ValidationError
from app.schemas.pydantic_models import ComplaintAnalysis, CreateTicketRequest, TicketStatusUpdateRequest

def test_valid_complaint_analysis():
    data = {
        "category": "delivery",
        "priority_recommendation": "medium",
        "summary": "Late delivery package",
        "description": "Package was supposed to arrive yesterday",
        "department_recommendation": "Logistics",
        "requires_human_review": False,
        "customer_reply": "Your complaint has been noted."
    }
    model = ComplaintAnalysis.model_validate(data)
    assert model.category == "delivery"
    assert model.priority_recommendation == "medium"
    assert model.requires_human_review is False

def test_invalid_category_rejected():
    data = {
        "category": "not_a_category",
        "priority_recommendation": "low",
        "summary": "test",
    }
    with pytest.raises(ValidationError):
        ComplaintAnalysis.model_validate(data)

def test_invalid_priority_rejected():
    data = {
        "category": "orders",
        "priority_recommendation": "urgent_critical",
        "summary": "test",
    }
    with pytest.raises(ValidationError):
        ComplaintAnalysis.model_validate(data)

def test_empty_transcript_rejected():
    with pytest.raises(ValidationError):
        CreateTicketRequest.model_validate({"transcript": "   "})

def test_valid_status_update():
    req = TicketStatusUpdateRequest.model_validate({"status": "in_progress", "reason": "Investigating"})
    assert req.status == "in_progress"

def test_invalid_status_update():
    with pytest.raises(ValidationError):
        TicketStatusUpdateRequest.model_validate({"status": "closed"})

