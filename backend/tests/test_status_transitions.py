import pytest
from app.routes.admin import VALID_TRANSITIONS

def test_valid_transitions_map():
    # open -> in_progress, escalated
    assert "in_progress" in VALID_TRANSITIONS["open"]
    assert "escalated" in VALID_TRANSITIONS["open"]
    assert "resolved" not in VALID_TRANSITIONS["open"]

    # in_progress -> escalated, resolved
    assert "escalated" in VALID_TRANSITIONS["in_progress"]
    assert "resolved" in VALID_TRANSITIONS["in_progress"]
    assert "open" not in VALID_TRANSITIONS["in_progress"]

    # escalated -> in_progress, resolved
    assert "in_progress" in VALID_TRANSITIONS["escalated"]
    assert "resolved" in VALID_TRANSITIONS["escalated"]
    assert "open" not in VALID_TRANSITIONS["escalated"]

    # resolved is terminal
    assert len(VALID_TRANSITIONS["resolved"]) == 0
