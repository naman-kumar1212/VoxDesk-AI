import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app({"TESTING": True})
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert "api" in data["data"]
    assert data["data"]["api"] == "ok"
    assert "database" in data["data"]
    assert data["error"] is None

def test_not_found_envelope(client):
    response = client.get("/api/nonexistent")
    assert response.status_code == 404
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"

