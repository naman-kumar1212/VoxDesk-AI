import io
import pytest
from app import create_app
from app.auth import create_admin_jwt

@pytest.fixture
def client(monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "ADMIN_API_KEY", "secret-test-key")
    app = create_app({"TESTING": True})
    with app.test_client() as client:
        yield client

@pytest.fixture
def admin_headers():
    token, _ = create_admin_jwt("test-admin-id", "admin@voxdesk.ai", "admin")
    return {"Authorization": f"Bearer {token}"}

def test_dashboard_summary(client, admin_headers):
    response = client.get("/api/admin/dashboard/summary", headers=admin_headers)
    assert response.status_code == 200
    res = response.get_json()
    assert res["success"] is True
    data = res["data"]
    assert "total_tickets" in data
    assert "status_distribution" in data
    assert "category_distribution" in data
    assert "department_workload" in data
    assert data["total_tickets"] >= 100

def test_dashboard_recent_activity(client, admin_headers):
    response = client.get("/api/admin/dashboard/recent-activity", headers=admin_headers)
    assert response.status_code == 200
    res = response.get_json()
    assert res["success"] is True
    assert "activities" in res["data"]
    assert len(res["data"]["activities"]) > 0

def test_departments_crud(client, admin_headers):
    # 1. List departments
    res = client.get("/api/admin/departments", headers=admin_headers)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert len(data["departments"]) >= 5

    # 2. Create test department
    create_res = client.post("/api/admin/departments", headers=admin_headers, json={
        "name": "Quality Assurance Testing Dept",
        "description": "Handles QA audits and edge test cases",
        "status": "active"
    })
    assert create_res.status_code in (201, 409)
    if create_res.status_code == 201:
        dept_id = create_res.get_json()["data"]["department"]["id"]
        # 3. Patch department
        patch_res = client.patch(f"/api/admin/departments/{dept_id}", headers=admin_headers, json={
            "description": "Updated QA audit description"
        })
        assert patch_res.status_code == 200
        # 4. Safe delete (no tickets assigned)
        del_res = client.delete(f"/api/admin/departments/{dept_id}", headers=admin_headers)
        assert del_res.status_code == 200

def test_users_crud(client, admin_headers):
    res = client.get("/api/admin/users", headers=admin_headers)
    assert res.status_code == 200
    users = res.get_json()["data"]["users"]
    assert len(users) >= 8

def test_analytics_summary_and_charts(client, admin_headers):
    # Summary
    res = client.get("/api/admin/analytics/summary?range=30d", headers=admin_headers)
    assert res.status_code == 200
    summary = res.get_json()["data"]
    assert "total_volume" in summary
    assert "escalation_rate" in summary
    assert "resolution_rate" in summary

    # Chart in-memory PNG stream
    chart_res = client.get("/api/admin/analytics/charts/volume_over_time?range=30d", headers=admin_headers)
    assert chart_res.status_code == 200
    assert chart_res.mimetype == "image/png"
    assert len(chart_res.data) > 1000  # valid PNG binary
