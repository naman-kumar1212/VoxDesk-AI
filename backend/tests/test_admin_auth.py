import pytest
from app import create_app

@pytest.fixture
def client(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "ADMIN_API_KEY", "secret-test-key")
    app = create_app({"TESTING": True})
    with app.test_client() as client:
        yield client

def test_admin_requires_key(client):
    response = client.get("/api/admin/analytics/summary")
    assert response.status_code == 401
    res = response.get_json()
    assert res["success"] is False
    assert res["error"]["code"] == "UNAUTHORIZED"

def test_admin_rejects_wrong_key(client):
    response = client.get("/api/admin/analytics/summary", headers={"X-Admin-Key": "wrong-key"})
    assert response.status_code == 401
    res = response.get_json()
    assert res["success"] is False
    assert res["error"]["code"] == "UNAUTHORIZED"

