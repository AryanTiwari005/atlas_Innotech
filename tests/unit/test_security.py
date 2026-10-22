from backend.config import settings


def test_reset_requires_key_when_admin_key_set(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_API_KEY", "s3cret")
    assert client.delete("/api/cases/reset?confirm=true").status_code == 403
    assert client.delete("/api/cases/reset?confirm=true", headers={"X-Admin-Key": "wrong"}).status_code == 403
    assert client.delete("/api/cases/reset?confirm=true", headers={"X-Admin-Key": "s3cret"}).status_code == 200


def test_reset_blocked_in_production_without_key(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_API_KEY", None)
    monkeypatch.setattr(settings, "APP_ENV", "production")
    assert client.delete("/api/cases/reset?confirm=true").status_code == 403


def test_cors_rejects_unlisted_origin(client):
    r = client.get("/api/health", headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in {k.lower() for k in r.headers}


def test_cors_allows_listed_origin(client):
    r = client.options("/api/health", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "GET"})
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_copilot_rejects_overlong_question(client):
    assert client.post("/api/graph/ai-query", json={"question": "x" * 1001}).status_code == 400
