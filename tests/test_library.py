from fastapi.testclient import TestClient

from app.main import app
from app.materials import MaterialStorageError, save_material


def test_library_returns_newest_first_without_lecture_text(monkeypatch, tmp_path):
    monkeypatch.setattr("app.materials.DATABASE_PATH", tmp_path / "library.db")
    first = save_material("first.txt", "Private lecture text one", 1)
    second = save_material("second.txt", "Private lecture text two", 1)
    response = TestClient(app).get("/materials")
    assert response.status_code == 200
    rows = response.json()
    assert [row["id"] for row in rows] == [second.id, first.id]
    assert all(set(row) == {"id", "filename", "unit_count", "character_count", "created_at"} for row in rows)
    assert "Private lecture text" not in response.text


def test_library_empty_and_storage_failure(monkeypatch, tmp_path):
    monkeypatch.setattr("app.materials.DATABASE_PATH", tmp_path / "library.db")
    client = TestClient(app)
    assert client.get("/materials").json() == []

    def fail():
        raise MaterialStorageError("Library unavailable. Please try again.")

    monkeypatch.setattr("app.main.list_materials", fail)
    response = client.get("/materials")
    assert response.status_code == 503
    assert response.json()["detail"] == "Library unavailable. Please try again."
