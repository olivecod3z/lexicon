from datetime import UTC, datetime, timedelta
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.flashcards import Flashcard, FlashcardSet
from app.main import app
from app.materials import (
    MaterialNotFoundError,
    list_due_flashcards,
    review_flashcard,
    save_material,
    save_flashcards,
)


TEST_DATABASE_PATH = Path(__file__).parent / ".reviews-test.db"


def test_review_ratings_schedule_cards_at_clear_intervals(monkeypatch) -> None:
    TEST_DATABASE_PATH.unlink(missing_ok=True)
    monkeypatch.setattr("app.materials.DATABASE_PATH", TEST_DATABASE_PATH)
    now = datetime(2026, 10, 5, tzinfo=UTC)
    card = Flashcard(card_type="question_answer", question="What is active recall?", answer="Retrieving an idea from memory.", topic="Learning")
    saved = save_flashcards("material-1", "course-1", [card], now=now)[0]

    assert [item.id for item in list_due_flashcards(now=now)] == [saved.id]
    again = review_flashcard(saved.id, "again", now=now)
    assert again.interval_days == 1
    assert again.due_at == (now + timedelta(days=1)).isoformat()
    assert list_due_flashcards(now=now) == []

    hard = review_flashcard(saved.id, "hard", now=now)
    assert hard.interval_days == 3
    got_it = review_flashcard(saved.id, "got_it", now=now)
    assert got_it.interval_days == 7
    second_success = review_flashcard(saved.id, "got_it", now=now)
    assert second_success.interval_days == 14

    TEST_DATABASE_PATH.unlink(missing_ok=True)


def test_review_rejects_unknown_cards_and_ratings(monkeypatch) -> None:
    TEST_DATABASE_PATH.unlink(missing_ok=True)


def test_saved_flashcards_appear_in_today_recall_and_can_be_rated(monkeypatch) -> None:
    TEST_DATABASE_PATH.unlink(missing_ok=True)
    monkeypatch.setattr("app.materials.DATABASE_PATH", TEST_DATABASE_PATH)
    material = save_material("lecture.txt", "Lecture text", 1, "course-1")
    flashcards = FlashcardSet(title="Learning", flashcards=[
        {"card_type": "question_answer", "question": "What is recall?", "answer": "Retrieval from memory.", "topic": "Learning"},
        {"card_type": "fill_in_the_blank", "question": "Recall uses ____.", "answer": "memory", "topic": "Learning"},
        {"card_type": "question_answer", "question": "What reveals gaps?", "answer": "Practice.", "topic": "Learning"},
        {"card_type": "fill_in_the_blank", "question": "Review with ____ between sessions.", "answer": "time", "topic": "Learning"},
        {"card_type": "question_answer", "question": "What should guide revision?", "answer": "Mistakes.", "topic": "Learning"},
    ])
    monkeypatch.setattr("app.main.generate_flashcards", lambda _: flashcards)
    client = TestClient(app)

    generated = client.post(f"/materials/{material.id}/flashcards")
    assert generated.status_code == 200
    due = client.get("/reviews/today")
    assert due.status_code == 200
    assert len(due.json()) == 5

    reviewed = client.post(f"/reviews/{due.json()[0]['id']}", json={"rating": "got_it"})
    assert reviewed.status_code == 200
    assert reviewed.json()["interval_days"] == 7
    assert len(client.get("/reviews/today").json()) == 4

    TEST_DATABASE_PATH.unlink(missing_ok=True)
    monkeypatch.setattr("app.materials.DATABASE_PATH", TEST_DATABASE_PATH)

    with pytest.raises(ValueError):
        review_flashcard("missing", "later")
    with pytest.raises(MaterialNotFoundError):
        review_flashcard("missing", "again")

    TEST_DATABASE_PATH.unlink(missing_ok=True)
