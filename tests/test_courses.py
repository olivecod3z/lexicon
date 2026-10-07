from pathlib import Path
import sqlite3

from fastapi.testclient import TestClient

from app.main import app


TEST_DATABASE_PATH = Path(__file__).parent / ".courses-test.db"


def test_level_is_saved_and_invalid_level_rejected(monkeypatch, tmp_path):
    monkeypatch.setattr("app.materials.DATABASE_PATH", tmp_path / "levels.db")
    client = TestClient(app)
    assert client.post("/courses", json={"name": "IT", "level": "invalid"}).status_code == 422
    created = client.post("/courses", json={"name": "IT", "level": "300 Level"})
    assert created.status_code == 201
    assert created.json()["level"] == "300 Level"
    assert client.get("/courses").json()[0]["level"] == "300 Level"


def test_existing_courses_without_level_still_load(monkeypatch, tmp_path):
    database = tmp_path / "legacy.db"
    with sqlite3.connect(database) as connection:
        connection.execute("CREATE TABLE courses (id TEXT PRIMARY KEY, name TEXT, code TEXT, color TEXT, created_at TEXT)")
        connection.execute("INSERT INTO courses VALUES ('old', 'IT', '', 'green', '2026-10-06')")
    monkeypatch.setattr("app.materials.DATABASE_PATH", database)
    courses = TestClient(app).get("/courses").json()
    assert courses[0]["id"] == "old"
    assert courses[0]["level"] == ""


def test_free_course_workspace_is_created_and_limited(monkeypatch) -> None:
    TEST_DATABASE_PATH.unlink(missing_ok=True)
    monkeypatch.setattr("app.materials.DATABASE_PATH", TEST_DATABASE_PATH)
    client = TestClient(app)

    created = client.post("/courses", json={"name": "Introduction to Psychology", "code": "PSY 101", "color": "green"})
    assert created.status_code == 201
    assert created.json()["name"] == "Introduction to Psychology"
    assert created.json()["code"] == "PSY 101"

    courses = client.get("/courses")
    assert courses.status_code == 200
    assert [course["id"] for course in courses.json()] == [created.json()["id"]]

    limited = client.post("/courses", json={"name": "Biology"})
    assert limited.status_code == 409
    assert "one course" in limited.json()["detail"]

    TEST_DATABASE_PATH.unlink(missing_ok=True)
