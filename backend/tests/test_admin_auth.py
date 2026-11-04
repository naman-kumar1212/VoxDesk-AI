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

def test_admin_bearer_jwt_auth_success(client):
    from app.auth import create_admin_jwt
    token, _ = create_admin_jwt("user-123", "admin@voxdesk.ai", "admin")
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    res = response.get_json()
    assert res["success"] is True
    assert res["data"]["user"]["role"] == "admin"
    assert res["data"]["user"]["email"] == "admin@voxdesk.ai"

def test_admin_bearer_jwt_rejects_non_admin_role(client):
    from app.auth import create_admin_jwt
    token, _ = create_admin_jwt("user-customer", "cust@voxdesk.ai", "customer")
    response = client.get("/api/admin/analytics/summary", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    res = response.get_json()
    assert res["success"] is False
    assert res["error"]["code"] == "FORBIDDEN"

def test_admin_bearer_jwt_rejects_tampered_token(client):
    response = client.get("/api/admin/analytics/summary", headers={"Authorization": "Bearer invalid.tampered.token"})
    assert response.status_code == 401
    res = response.get_json()
    assert res["success"] is False
    assert res["error"]["code"] == "UNAUTHORIZED"


