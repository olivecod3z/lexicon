from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.hosted_access import require_preview_access


def client():
    app = FastAPI()
    app.middleware("http")(require_preview_access)
    @app.get("/materials")
    def materials():
        return []
    @app.get("/health")
    def health():
        return {"status": "ok"}
    @app.post("/materials")
    def upload():
        return {"saved": True}
    return TestClient(app)


def test_access_requires_configured_secret(monkeypatch):
    monkeypatch.delenv("LEXICON_ACCESS_KEY", raising=False)
    assert client().get("/materials").status_code == 503
    assert client().get("/health").status_code == 200


def test_access_and_no_cache(monkeypatch):
    monkeypatch.setenv("LEXICON_ACCESS_KEY", "test-only-code")
    assert client().get("/materials").status_code == 401
    assert client().get("/materials", headers={"X-Lexicon-Access": "wrong"}).status_code == 401
    response = client().get("/materials", headers={"X-Lexicon-Access": "test-only-code"})
    assert response.status_code == 200
    assert response.headers["cache-control"] == "private, no-store"


def test_daily_cap_blocks_upload(monkeypatch):
    monkeypatch.setenv("LEXICON_ACCESS_KEY", "test-only-code")
    monkeypatch.setattr("app.cloud_store.reserve_request", lambda kind, limit: False)
    assert client().post("/materials", headers={"X-Lexicon-Access": "test-only-code"}).status_code == 429
