from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.hosted_access import enforce_preview_limits


def client():
    app = FastAPI()
    app.middleware("http")(enforce_preview_limits)
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


def test_library_opens_without_passcode():
    response = client().get("/materials")
    assert response.status_code == 200
    assert response.headers["cache-control"] == "private, no-store"
    assert client().get("/health").status_code == 200


def test_daily_cap_still_blocks_upload(monkeypatch):
    monkeypatch.setattr("app.cloud_store.reserve_request", lambda kind, limit: False)
    assert client().post("/materials").status_code == 429


def test_upload_within_daily_limit(monkeypatch):
    monkeypatch.setattr("app.cloud_store.reserve_request", lambda kind, limit: True)
    assert client().post("/materials").status_code == 200
