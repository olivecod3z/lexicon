import pytest
import httpx2
from openai import AuthenticationError, RateLimitError

from app.study_packs import StudyPack, StudyPackGenerationError, generate_study_pack


def make_response(status_code: int) -> httpx2.Response:
    return httpx2.Response(
        status_code,
        request=httpx2.Request("POST", "https://api.openai.com/v1/responses"),
    )


def test_generation_explains_rejected_api_key(monkeypatch) -> None:
    class FakeResponses:
        def create(self, **kwargs):
            raise AuthenticationError(
                "bad key",
                response=make_response(401),
                body=None,
            )

    class FakeClient:
        responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setattr("app.study_packs.OpenAI", lambda api_key: FakeClient())

    with pytest.raises(StudyPackGenerationError, match="rejected the API key"):
        generate_study_pack("Lecture source text")


def test_generation_explains_billing_or_rate_limit(monkeypatch) -> None:
    class FakeResponses:
        def create(self, **kwargs):
            raise RateLimitError(
                "rate limited",
                response=make_response(429),
                body=None,
            )

    class FakeClient:
        responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setattr("app.study_packs.OpenAI", lambda api_key: FakeClient())

    with pytest.raises(StudyPackGenerationError, match="rate or billing limits"):
        generate_study_pack("Lecture source text")


def test_long_material_generates_part_packs_then_a_combined_pack(monkeypatch) -> None:
    expected_pack = StudyPack(
        title="Cells",
        overview="Lecture notes about cells.",
        learning_objectives=["Identify cells.", "Explain organelles."],
        sections=[
            {"heading": "Cells", "explanation": "Cells are described.", "key_points": ["Cells matter."]},
            {"heading": "Organelles", "explanation": "Organelles are described.", "key_points": ["Organelles matter."]},
        ],
    )
    requests = []

    class FakeResponses:
        def create(self, **kwargs):
            requests.append(kwargs)
            return type("Response", (), {"output_text": expected_pack.model_dump_json()})()

    class FakeClient:
        responses = FakeResponses()

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setattr("app.study_packs.OpenAI", lambda api_key: FakeClient())
    monkeypatch.setattr("app.study_packs.split_text_for_generation", lambda _: ["part one", "part two"])

    assert generate_study_pack("long source") == expected_pack
    assert len(requests) == 3
    assert "independently from consecutive parts" in requests[-1]["instructions"]
