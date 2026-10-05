from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


TEST_DATABASE_PATH = Path(__file__).parent / ".courses-test.db"


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
