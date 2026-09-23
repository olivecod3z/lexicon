import json
from types import SimpleNamespace

from app.flashcards import FlashcardSet, generate_flashcards


def make_flashcards() -> FlashcardSet:
    return FlashcardSet(
        title="Cell Biology Flashcards",
        flashcards=[
            {"question": "What is a cell?", "answer": "A basic unit of life.", "topic": "Cells", "card_type": "question_answer"},
            {"question": "An organelle is a cell structure with a ____.", "answer": "function", "topic": "Organelles", "card_type": "fill_in_the_blank"},
            {"question": "What is a nucleus?", "answer": "A cell structure described in the lecture.", "topic": "Organelles", "card_type": "question_answer"},
            {"question": "Cells contain structures with different ____.", "answer": "functions", "topic": "Cells", "card_type": "fill_in_the_blank"},
            {"question": "What do organelles do?", "answer": "They perform distinct functions.", "topic": "Organelles", "card_type": "question_answer"},
        ],
    )


def test_generation_requests_validated_flashcard_json(monkeypatch) -> None:
    expected_set = make_flashcards()
    captured_request = {}

    class FakeResponses:
        def create(self, **kwargs):
            captured_request.update(kwargs)
            return SimpleNamespace(output_text=json.dumps(expected_set.model_dump()))

    class FakeClient:
        responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setattr("app.flashcards.OpenAI", lambda api_key: FakeClient())

    result = generate_flashcards("Lecture source text")

    assert result == expected_set
    assert captured_request["store"] is False
    assert captured_request["text"]["format"]["name"] == "flashcard_set"
    assert captured_request["text"]["format"]["strict"] is True


def test_fill_in_the_blank_card_requires_one_blank() -> None:
    invalid_card = {
        "question": "An organelle has a function.",
        "answer": "function",
        "topic": "Organelles",
        "card_type": "fill_in_the_blank",
    }

    try:
        FlashcardSet(title="Invalid cards", flashcards=[invalid_card] * 5)
    except ValueError as error:
        assert "exactly one" in str(error)
    else:
        raise AssertionError("A fill-in-the-blank card without a blank was accepted.")


def test_flashcard_set_requires_both_card_types() -> None:
    question_answer_card = {
        "question": "What is a cell?",
        "answer": "A basic unit of life.",
        "topic": "Cells",
        "card_type": "question_answer",
    }

    try:
        FlashcardSet(title="Incomplete variety", flashcards=[question_answer_card] * 5)
    except ValueError as error:
        assert "both supported" in str(error)
    else:
        raise AssertionError("A one-type flashcard set was accepted.")


def test_long_material_generates_balanced_flashcards_per_chunk(monkeypatch) -> None:
    expected_set = make_flashcards()
    requests = []

    class FakeResponses:
        def create(self, **kwargs):
            requests.append(kwargs)
            return SimpleNamespace(output_text=json.dumps(expected_set.model_dump()))

    class FakeClient:
        responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setattr("app.flashcards.OpenAI", lambda api_key: FakeClient())
    monkeypatch.setattr("app.flashcards.split_text_for_generation", lambda _: ["part one", "part two"])

    result = generate_flashcards("long source")

    assert len(requests) == 2
    assert len(result.flashcards) == 10
    assert {card.card_type for card in result.flashcards} == {
        "question_answer",
        "fill_in_the_blank",
    }
