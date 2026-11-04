import io
import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app({"TESTING": True})
    with app.test_client() as client:
        yield client

def test_missing_audio_field(client):
    response = client.post("/api/voice/transcribe", data={})
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "MISSING_AUDIO"

def test_empty_audio_file(client):
    data = {"audio": (io.BytesIO(b""), "test.webm")}
    response = client.post("/api/voice/transcribe", data=data, content_type="multipart/form-data")
    assert response.status_code == 400
    res = response.get_json()
    assert res["success"] is False
    assert res["error"]["code"] == "EMPTY_AUDIO"

def test_unsupported_audio_format(client):
    data = {"audio": (io.BytesIO(b"dummy data"), "test.exe")}
    response = client.post("/api/voice/transcribe", data=data, content_type="multipart/form-data")
    assert response.status_code == 415
    res = response.get_json()
    assert res["success"] is False
    assert res["error"]["code"] == "UNSUPPORTED_FORMAT"

def test_audio_too_large(client, monkeypatch):
    from app import config
    monkeypatch.setattr(config.settings, "MAX_AUDIO_BYTES", 100)
    data = {"audio": (io.BytesIO(b"A" * 150), "test.webm")}
    response = client.post("/api/voice/transcribe", data=data, content_type="multipart/form-data")
    assert response.status_code == 413
    res = response.get_json()
    assert res["success"] is False
    assert res["error"]["code"] == "AUDIO_TOO_LARGE"

