import pytest
from unittest.mock import MagicMock, patch
from app.services.ai_analysis import analyze_complaint, AIAnalysisError, AIQuotaError
from app.schemas.pydantic_models import ComplaintAnalysis

SAMPLE_GEMINI_RESPONSE = """{
  "category": "payment",
  "priority_recommendation": "high",
  "summary": "Payment deducted without order confirmation.",
  "description": "Customer says payment was deducted 3 days ago.",
  "department_recommendation": "Billing Support",
  "requires_human_review": true,
  "escalation_reason": "Repeated unresolved contact.",
  "customer_reply": "Your payment grievance has been logged."
}"""

def test_analyze_complaint_success(monkeypatch):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = SAMPLE_GEMINI_RESPONSE
    mock_client.models.generate_content.return_value = mock_response

    with patch("google.genai.Client", return_value=mock_client):
        result = analyze_complaint("Payment was deducted twice.")
        assert isinstance(result, ComplaintAnalysis)
        assert result.category == "payment"
        assert result.priority_recommendation == "high"
        assert result.requires_human_review is True

def test_analyze_complaint_empty_response(monkeypatch):
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = ""
    mock_client.models.generate_content.return_value = mock_response

    with patch("google.genai.Client", return_value=mock_client):
        with pytest.raises(AIAnalysisError) as exc_info:
            analyze_complaint("Testing empty response.")
        assert "empty response" in str(exc_info.value).lower()

def test_analyze_complaint_quota_error(monkeypatch):
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("429 Resource has been exhausted (e.g. check quota).")

    with patch("google.genai.Client", return_value=mock_client):
        with pytest.raises(AIQuotaError):
            analyze_complaint("Quota test.")

