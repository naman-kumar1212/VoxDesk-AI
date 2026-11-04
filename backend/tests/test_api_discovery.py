"""
Tests for API root, API discovery, health checks, and Vercel WSGI routing.
"""
from app import create_app
from api.index import VercelWSGIWrapper


def test_root_service_info():
    app = create_app({"TESTING": True})
    client = app.test_client()
    res = client.get("/")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["service"] == "VoxDesk AI Backend API"
    assert "endpoints" in data
    assert data["endpoints"]["health"] == "/api/health"


def test_api_discovery_endpoint():
    app = create_app({"TESTING": True})
    client = app.test_client()

    res = client.get("/api")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["service"] == "VoxDesk AI API Discovery"
    assert "endpoint_groups" in data
    assert "health" in data["endpoint_groups"]
    assert "tickets" in data["endpoint_groups"]
    assert "admin" in data["endpoint_groups"]

    # Trailing slash test
    res_slash = client.get("/api/")
    assert res_slash.status_code == 200


def test_api_health_endpoint():
    app = create_app({"TESTING": True})
    client = app.test_client()
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["api"] == "ok"


def test_no_fake_api_index_endpoint():
    """Task 9: Verify /api/index is NOT an artificial endpoint and returns 404."""
    app = create_app({"TESTING": True})
    client = app.test_client()
    res = client.get("/api/index")
    assert res.status_code == 404
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"


def test_vercel_wsgi_wrapper_path_recovery():
    """Verify that VercelWSGIWrapper recovers client requested path from X-Forwarded-Uri."""
    app = create_app({"TESTING": True})
    wrapped_app = VercelWSGIWrapper(app.wsgi_app)

    captured = {}

    def mock_start_response(status, headers):
        captured["status"] = status
        captured["headers"] = headers

    # Simulate Vercel edge proxy passing /api/index with X-Forwarded-Uri: /api/health
    environ = {
        "REQUEST_METHOD": "GET",
        "PATH_INFO": "/api/index",
        "SERVER_NAME": "localhost",
        "SERVER_PORT": "5000",
        "wsgi.url_scheme": "http",
        "wsgi.input": None,
        "HTTP_X_FORWARDED_URI": "/api/health",
    }

    response = wrapped_app(environ, mock_start_response)
    assert "200 OK" in captured["status"]
    assert environ["PATH_INFO"] == "/api/health"
