import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app({"TESTING": True})
    with app.test_client() as client:
        yield client

def test_track_ticket_not_found(client):
    response = client.get("/api/tickets/track/VD-NONEXISTENT")
    assert response.status_code == 404
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"

def test_track_ticket_empty_number(client):
    response = client.get("/api/tickets/track/%20")
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_TICKET_NUMBER"
