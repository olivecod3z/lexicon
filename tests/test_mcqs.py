import json
from types import SimpleNamespace

import pytest

from app.mcqs import GeneratedMCQSet, MCQQuestion, generate_mcqs


def make_generated_mcqs() -> GeneratedMCQSet:
    questions = []
    for number in range(1, 6):
        questions.append(
            {
                "question": f"What does lecture concept {number} describe?",
                "options": [
                    {"label": "A", "text": f"Correct description {number}"},
                    {"label": "B", "text": f"Distractor one {number}"},
                    {"label": "C", "text": f"Distractor two {number}"},
                    {"label": "D", "text": f"Distractor three {number}"},
                ],
                "correct_option": "A",
                "explanation": f"The source defines concept {number} this way.",
                "topic": "Lecture concepts",
            }
        )
    return GeneratedMCQSet(title="Lecture MCQs", questions=questions)


def test_generation_requests_validated_mcq_json(monkeypatch) -> None:
    expected_set = make_generated_mcqs()
    captured_request = {}

    class FakeResponses:
        def create(self, **kwargs):
            captured_request.update(kwargs)
            return SimpleNamespace(output_text=json.dumps(expected_set.model_dump()))

    class FakeClient:
        responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setattr("app.mcqs.OpenAI", lambda api_key: FakeClient())

    result = generate_mcqs("Lecture source text")

    assert result.title == expected_set.title
    assert result.questions == expected_set.questions
    assert captured_request["store"] is False
    assert captured_request["text"]["format"]["name"] == "mcq_set"
    assert captured_request["text"]["format"]["strict"] is True


def test_mcq_requires_all_four_option_labels() -> None:
    invalid_question = make_generated_mcqs().questions[0].model_dump()
    invalid_question["options"][3]["label"] = "C"

    with pytest.raises(ValueError, match="A, B, C, and D"):
        MCQQuestion.model_validate(invalid_question)


def test_long_material_generates_five_questions_per_chunk(monkeypatch) -> None:
    expected_set = make_generated_mcqs()
    requests = []

    class FakeResponses:
        def create(self, **kwargs):
            requests.append(kwargs)
            return SimpleNamespace(output_text=json.dumps(expected_set.model_dump()))

    class FakeClient:
        responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setattr("app.mcqs.OpenAI", lambda api_key: FakeClient())
    monkeypatch.setattr("app.mcqs.split_text_for_generation", lambda _: ["part one", "part two"])

    result = generate_mcqs("long source")

    assert len(requests) == 2
    assert result.title == "Complete material quiz questions"
    assert len(result.questions) == 10
