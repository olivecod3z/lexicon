"""Phase 1 policy, coverage, validation, and cache identity regression checks."""
import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app import main, practice
from app.entitlements import PLANS, account_plan, public_entitlements
from app.practice import PracticeOptions, PracticeGenerationError, question_counts


@pytest.mark.parametrize("name,packs,questions", [("Free", 3, 10), ("Student", 30, 30), ("Pro", 75, 60)])
def test_plan_boundaries(name, packs, questions):
    plan = PLANS[name]
    assert plan.packs_per_month == packs
    PracticeOptions(question_count=questions).validate_plan(plan)
    if questions < 60:
        with pytest.raises(ValueError):
            PracticeOptions(question_count=questions + 1).validate_plan(plan)


def test_free_cannot_customize_and_hosted_cannot_use_local_override(monkeypatch):
    with pytest.raises(ValueError, match="Free includes"):
        PracticeOptions(question_count=9).validate_plan(PLANS["Free"])
    monkeypatch.setenv("LEXYCON_LOCAL_PLAN", "Pro")
    monkeypatch.delenv("K_SERVICE", raising=False)
    assert account_plan().name == "Pro"
    monkeypatch.setenv("K_SERVICE", "hosted")
    assert account_plan().name == "Free"
    assert public_entitlements()["features"]["exam_simulator"] == "planned"
    assert not public_entitlements()["subscriptions_available"]


@pytest.mark.parametrize("count", range(1, 61))
@pytest.mark.parametrize("preset", ["balanced", "mcq-heavy", "theory-heavy"])
def test_mix_counts_always_match_selection(count, preset):
    assert sum(question_counts(PracticeOptions(question_count=count, preset=preset))) == count


def test_cache_keys_preserve_default_and_distinguish_mixes():
    assert PracticeOptions().cache_kind() == "practice"
    assert PracticeOptions(question_count=30).cache_kind() != PracticeOptions(question_count=30, preset="mcq-heavy").cache_kind()


def test_free_api_bypass_rejected_before_ai(monkeypatch):
    monkeypatch.setattr(main, "load_material_or_404", lambda *args: SimpleNamespace(source_text="lecture"))
    monkeypatch.setattr(main, "generate_resource", lambda *args: pytest.fail("must not generate"))
    monkeypatch.setenv("LEXYCON_LOCAL_PLAN", "Free")
    response = TestClient(main.app).post("/materials/owned/practice-session", json={"question_count": 30})
    assert response.status_code == 422


def fake_provider(monkeypatch, duplicate=False):
    calls = []
    def create(**kwargs):
        calls.append(kwargs)
        properties = kwargs["text"]["format"]["schema"]["properties"]
        count = properties["theory_questions"]["minItems"]
        # Distinct phrases keep this fixture outside near-duplicate thresholds.
        words = ["photosynthesis sunlight chlorophyll", "mitosis chromosome spindle", "osmosis membrane concentration",
                 "respiration glucose mitochondria", "enzymes catalysts activation", "genetics inheritance alleles"]
        questions = [{"prompt": f"Explain {words[(len(calls)-1) % len(words)]} using source argument {i}.",
                      "marking_guidance": "Use the stated lecture criteria.", "topic": "Biology"} for i in range(count)]
        # Use distinct per-question strings for validation tests, rather than numerical variants.
        for i, q in enumerate(questions):
            q["prompt"] = f"Discuss {words[i % len(words)]}." if duplicate else f"{words[i % len(words)]}: {['Describe', 'Compare', 'Evaluate', 'Explain', 'Outline', 'Identify'][i % 6]} the evidence in batch {len(calls)}."
        return SimpleNamespace(output_text=json.dumps({"title": "Practice", "mcqs": [], "fill_in_the_gaps": [], "theory_questions": questions}), usage=None)
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setattr(practice, "OpenAI", lambda **kwargs: SimpleNamespace(responses=SimpleNamespace(create=create)))
    return calls


def test_generation_receives_beginning_middle_and_end(monkeypatch):
    # Use three one-question source sections, so each batch carries distinct evidence.
    calls = fake_provider(monkeypatch)
    def create(**kwargs):
        calls.append(kwargs)
        count = kwargs["text"]["format"]["schema"]["properties"]["mcqs"]["minItems"]
        data = []
        concepts = ["Photosynthesis converts sunlight into chemical energy", "Mitosis separates duplicated chromosomes into daughter cells", "Osmosis moves water across a selectively permeable membrane"]
        for i in range(count):
            data.append({"question": concepts[i], "options": [{"label": label, "text": label} for label in "ABCD"], "correct_option": "A", "explanation": "Source supports this.", "topic": "Biology"})
        return SimpleNamespace(output_text=json.dumps({"title": "Practice", "mcqs": data, "fill_in_the_gaps": [], "theory_questions": []}), usage=None)
    monkeypatch.setattr(practice, "OpenAI", lambda **kwargs: SimpleNamespace(responses=SimpleNamespace(create=create)))
    source = "START " + "a" * 5900 + "\nMIDDLE " + "b" * 5900 + "\nEND " + "c" * 5900
    # MCQ-heavy three-question mix contains only MCQs after rounding.
    result = practice.generate_practice(source, PracticeOptions(question_count=3, preset="mcq-heavy"))
    assert all(marker in calls[0]["input"] for marker in ["START", "MIDDLE", "END"])
    assert result.source_batches[0]["sections"] == [1, 2, 3]
    assert "page references are unavailable" in result.coverage_note


def test_duplicate_generation_fails_without_silent_retry(monkeypatch):
    calls = fake_provider(monkeypatch, duplicate=True)
    with pytest.raises(PracticeGenerationError):
        practice.generate_practice("Source facts", PracticeOptions(question_count=11, preset="theory-heavy"))
    # Incorrect mix returned by provider must fail, rather than silently spend again.
    assert len(calls) == 1


def test_answer_length_mismatch_does_not_produce_partial_score():
    data = practice.PracticeSet(title="Theory", mcqs=[], fill_in_the_gaps=[], theory_questions=[{"prompt": "Explain the source.", "marking_guidance": "Use evidence.", "topic": "Topic"}])
    with pytest.raises(ValueError, match="exactly one"):
        practice.score_practice(data, practice.PracticeSubmission(mcq_answers=["A"], gap_answers=[]))
    assert practice.score_practice(data, practice.PracticeSubmission(mcq_answers=[], gap_answers=[])).total_gradable == 0


def test_selected_types_and_sections_are_validated():
    options = PracticeOptions(question_count=30, question_types=["gap"], coverage="selected", selected_sections=[2, 1, 2])
    options.validate_plan(PLANS["Student"])
    assert question_counts(options) == [0, 30, 0]
    assert options.selected_sections == [1, 2]
    with pytest.raises(ValueError, match="Select at least"):
        PracticeOptions(coverage="selected").validate_plan(PLANS["Student"])


def test_sixty_questions_use_six_bounded_batches(monkeypatch):
    import hashlib
    calls = []
    def create(**kwargs):
        calls.append(kwargs)
        properties = kwargs["text"]["format"]["schema"]["properties"]
        groups = {"mcqs": [], "fill_in_the_gaps": [], "theory_questions": []}
        for kind in groups:
            for index in range(properties[kind]["minItems"]):
                # Distinct deterministic IDs avoid artificial near-duplicate fixtures.
                phrase = hashlib.sha256(f"{len(calls)}-{kind}-{index}".encode()).hexdigest()
                if kind == "mcqs":
                    q = {"question": phrase, "options": [{"label": label, "text": label} for label in "ABCD"], "correct_option": "A", "explanation": "Source explains the answer.", "topic": "Topic"}
                elif kind == "fill_in_the_gaps":
                    q = {"prompt": phrase + " ____", "answer": "keyword", "topic": "Topic"}
                else:
                    q = {"prompt": phrase, "marking_guidance": "Use evidence.", "topic": "Topic"}
                groups[kind].append(q)
        return SimpleNamespace(output_text=json.dumps({"title": "Practice", **groups}), usage=None)
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    monkeypatch.setattr(practice, "OpenAI", lambda **kwargs: SimpleNamespace(responses=SimpleNamespace(create=create)))
    source = "\n".join(f"SECTION{i} " + "x" * 5900 for i in range(10))
    result = practice.generate_practice(source, PracticeOptions(question_count=60))
    assert len(calls) == 6
    assert [len(result.mcqs), len(result.fill_in_the_gaps), len(result.theory_questions)] == [30, 18, 12]
    assert {i for batch in result.source_batches for i in batch["sections"]} == set(range(1, 11))
    assert all(batch["questions"] <= 10 for batch in result.source_batches)


def test_repeated_provider_prompts_rejected(monkeypatch):
    calls = fake_provider(monkeypatch, duplicate=True)
    with pytest.raises(PracticeGenerationError):
        practice.generate_practice("Lecture", PracticeOptions(question_count=10, question_types=["theory"]))
    assert len(calls) == 1
