"""Mixed objective and theory practice generated from saved material."""
import json, os
from typing import Annotated, Literal
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.mcqs import MCQQuestion
from app.ai_limits import client_limits, output_limits, record_usage
from app.text_chunks import split_text_for_generation
from app.entitlements import Plan
import hashlib
import re
from difflib import SequenceMatcher

class GapQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")
    prompt: str = Field(min_length=5, max_length=400)
    answer: str = Field(min_length=1, max_length=120)
    topic: str = Field(min_length=1, max_length=120)
    @model_validator(mode="after")
    def one_blank(self):
        if self.prompt.count("____") != 1: raise ValueError("Gap questions need exactly one blank.")
        return self

class TheoryQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")
    prompt: str = Field(min_length=5, max_length=500)
    marking_guidance: str = Field(min_length=1, max_length=700)
    topic: str = Field(min_length=1, max_length=120)

class PracticeSet(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=200)
    source_batches: list[dict] = Field(default_factory=list)
    coverage_note: str = "Coverage refers to extracted text; unreadable pages and original page references are unavailable."
    mcqs: list[MCQQuestion] = Field(min_length=0, max_length=60)
    fill_in_the_gaps: list[GapQuestion] = Field(min_length=0, max_length=60)
    theory_questions: list[TheoryQuestion] = Field(min_length=0, max_length=60)

    @model_validator(mode="after")
    def bounded_question_total(self):
        if not 1 <= len(self.mcqs) + len(self.fill_in_the_gaps) + len(self.theory_questions) <= 60:
            raise ValueError("Practice sets must contain 1-60 questions.")
        return self

class PracticeSubmission(BaseModel):
    model_config = ConfigDict(extra="forbid")
    mcq_answers: list[Literal["A", "B", "C", "D"]] = Field(min_length=0, max_length=60)
    gap_answers: list[str] = Field(min_length=0, max_length=60)

class PracticeResult(BaseModel):
    correct_mcqs: int
    correct_gaps: int
    total_gradable: int = 8
    percentage: float
    mcq_feedback: list["MCQFeedback"]
    gap_feedback: list["GapFeedback"]


class MCQFeedback(BaseModel):
    """Corrective feedback revealed only after a practice submission."""

    selected_option: str
    correct_option: str
    correct_answer: str
    is_correct: bool
    explanation: str


class GapFeedback(BaseModel):
    """Expected keyword feedback revealed only after a practice submission."""

    submitted_answer: str
    expected_answer: str
    is_correct: bool

def score_practice(practice: PracticeSet, submission: PracticeSubmission) -> PracticeResult:
    if len(submission.mcq_answers) != len(practice.mcqs) or len(submission.gap_answers) != len(practice.fill_in_the_gaps):
        raise ValueError("Submit exactly one answer for every objective question.")
    total = len(practice.mcqs) + len(practice.fill_in_the_gaps)
    mcq_feedback = [
        MCQFeedback(
            selected_option=answer,
            correct_option=question.correct_option,
            correct_answer=next(option.text for option in question.options if option.label == question.correct_option),
            is_correct=answer == question.correct_option,
            explanation=question.explanation,
        )
        for answer, question in zip(submission.mcq_answers, practice.mcqs)
    ]
    gap_feedback = [
        GapFeedback(
            submitted_answer=answer,
            expected_answer=question.answer,
            is_correct=answer.strip().casefold() == question.answer.strip().casefold(),
        )
        for answer, question in zip(submission.gap_answers, practice.fill_in_the_gaps)
    ]
    correct_mcqs = sum(item.is_correct for item in mcq_feedback)
    correct_gaps = sum(item.is_correct for item in gap_feedback)
    return PracticeResult(
        correct_mcqs=correct_mcqs,
        correct_gaps=correct_gaps,
        total_gradable=total,
        percentage=round((correct_mcqs + correct_gaps) / total * 100, 2) if total else 0,
        mcq_feedback=mcq_feedback,
        gap_feedback=gap_feedback,
    )

class PracticeGenerationError(RuntimeError): pass

class PracticeOptions(BaseModel):
    model_config = ConfigDict(extra="forbid")
    question_count: int = Field(default=10, ge=1, le=60, strict=True)
    preset: Literal["balanced", "mcq-heavy", "theory-heavy"] = "balanced"
    coverage: Literal["balanced", "selected", "exam-style"] = "balanced"
    question_types: list[Literal["mcq", "gap", "theory"]] = Field(default_factory=lambda: ["mcq", "gap", "theory"], min_length=1, max_length=3)
    selected_sections: list[Annotated[int, Field(strict=True, ge=1)]] = Field(default_factory=list, max_length=60)

    @model_validator(mode="after")
    def canonical_preferences(self):
        self.question_types = [kind for kind in ("mcq", "gap", "theory") if kind in self.question_types]
        self.selected_sections = sorted(set(self.selected_sections))
        return self

    def validate_plan(self, plan: Plan):
        if self.question_count > plan.practice_questions:
            raise ValueError(f"{plan.name} allows up to {plan.practice_questions} questions per practice set.")
        if not plan.custom_practice and self != PracticeOptions():
            raise ValueError("Free includes a balanced 10-question set: 5 MCQs, 3 gaps, 2 theory prompts. Custom mixes require Student or Pro when released.")
        if self.coverage == "selected" and not self.selected_sections:
            raise ValueError("Select at least one source section.")
        if self.coverage != "selected" and self.selected_sections:
            raise ValueError("Section selection requires selected coverage.")

    def cache_kind(self):
        if self == PracticeOptions():
            return "practice"
        return f"practice-v2-{self.question_count}-" + hashlib.sha256(self.model_dump_json().encode()).hexdigest()[:24]


def question_counts(options):
    weights = {"balanced": (5, 3, 2), "mcq-heavy": (8, 1, 1), "theory-heavy": (2, 2, 6)}[options.preset]
    weights = tuple(weight if kind in options.question_types else 0 for kind, weight in zip(("mcq", "gap", "theory"), weights))
    total_weight = sum(weights)
    counts = [options.question_count * weight // total_weight for weight in weights]
    remainders = sorted(range(3), key=lambda i: (options.question_count * weights[i] % total_weight, -i), reverse=True)
    for i in remainders[:options.question_count - sum(counts)]:
        counts[i] += 1
    return counts


def source_sections(source):
    """Paragraph-aligned source regions, not inferred academic topics or page numbers."""
    split_text_for_generation(source)  # Enforce the existing document ceiling.
    paragraphs = [p.strip() for p in source.splitlines() if p.strip()]
    sections, parts, size = [], [], 0
    for paragraph in paragraphs:
        # Bound exceptionally long paragraphs without dropping text.
        for start in range(0, len(paragraph), 6000):
            piece = paragraph[start:start + 6000]
            if parts and size + len(piece) > 6000:
                sections.append("\n".join(parts))
                parts, size = [], 0
            parts.append(piece)
            size += len(piece) + 1
    if parts:
        sections.append("\n".join(parts))
    if not sections:
        raise PracticeGenerationError("No readable source text is available.")
    return sections


def generate_practice(source_text: str, options: PracticeOptions | None = None) -> PracticeSet:
    options = options or PracticeOptions()
    if len(source_text) > 60_000:
        raise PracticeGenerationError("Mixed practice supports up to 60,000 readable characters. Split larger materials into smaller files.")
    sections = source_sections(source_text)
    indexes = list(range(len(sections)))
    if options.coverage == "selected":
        indexes = sorted(set(i - 1 for i in options.selected_sections))
        if not indexes or any(i < 0 or i >= len(sections) for i in indexes):
            raise PracticeGenerationError("Selected source sections are invalid. Reload the section list.")
    key, model = os.getenv("OPENAI_API_KEY"), os.getenv("OPENAI_MODEL")
    if not key or not model:
        raise PracticeGenerationError("Mixed practice is not configured. Set OPENAI_API_KEY and OPENAI_MODEL.")
    # At most 10 prompts per call. Assign contiguous source regions across batches
    # so even the end of the material is supplied; never silently truncate it.
    counts = question_counts(options)
    # Interleave question types proportionally, rather than assigning all MCQs
    # to early source regions and all theory prompts to later ones.
    kinds = [kind for _, kind in sorted(((j + .5) / count, kind)
             for kind, count in enumerate(counts) for j in range(count))]
    batch_count = (len(kinds) + 9) // 10
    all_questions = [[], [], []]
    contributions = []
    try:
        client = OpenAI(api_key=key, **client_limits())
        for batch in range(batch_count):
            batch_kinds = kinds[batch * 10:(batch + 1) * 10]
            wanted = [batch_kinds.count(i) for i in range(3)]
            assigned = indexes[batch * len(indexes) // batch_count:(batch + 1) * len(indexes) // batch_count]
            if not assigned:
                assigned = [indexes[batch % len(indexes)]]
            source = "\n\n".join(f"Source section {i + 1}:\n{sections[i]}" for i in assigned)
            schema = PracticeSet.model_json_schema()
            for metadata in ("source_batches", "coverage_note"):
                schema["properties"].pop(metadata)
            for field, count in zip(("mcqs", "fill_in_the_gaps", "theory_questions"), wanted):
                schema["properties"][field].update(minItems=count, maxItems=count)
            instructions = f"""Create {wanted[0]} MCQs, {wanted[1]} keyword gap questions with exactly one ____ blank, and {wanted[2]} theory prompts using only the supplied source.
Cover all supplied sections where the question count permits, weighting substantive concepts by content density. Do not favor the beginning. Use topic names from the source. MCQs must have one defensible answer. Theory guidance must list source-grounded evaluation criteria. Never invent facts or page references.
Practice style: {options.coverage}. Exam-style means application and comparison where supported, not official exam papers.
Avoid repeated or near-duplicate prompts. Existing prompts to avoid: {[getattr(q, 'question', getattr(q, 'prompt', '')) for group in all_questions for q in group]}"""
            response = client.responses.create(model=model, instructions=instructions, input=source, store=False,
                **output_limits(), text={"format": {"type": "json_schema", "name": "practice_set", "strict": True, "schema": schema}})
            record_usage(response, "practice", model)
            result = PracticeSet.model_validate(json.loads(response.output_text))
            groups = [result.mcqs, result.fill_in_the_gaps, result.theory_questions]
            if [len(group) for group in groups] != wanted:
                raise ValueError("Generated question counts differ from the requested mix.")
            for i, group in enumerate(groups):
                all_questions[i].extend(group)
            contributions.append({"sections": [i + 1 for i in assigned], "questions": len(batch_kinds)})
        prompts = [re.sub(r"\W+", " ", getattr(q, "question", getattr(q, "prompt", "")).casefold()).strip()
                   for group in all_questions for q in group]
        for i, prompt in enumerate(prompts):
            if any(SequenceMatcher(None, prompt, previous).ratio() >= .9 for previous in prompts[:i]):
                raise ValueError("Generated practice contains near-duplicate questions.")
        return PracticeSet(title=result.title, mcqs=all_questions[0], fill_in_the_gaps=all_questions[1], theory_questions=all_questions[2], source_batches=contributions)
    except (OpenAIError, ValueError, json.JSONDecodeError) as error:
        raise PracticeGenerationError("Lexycon could not generate a valid mixed practice set. No pack is charged for a failed new generation.") from error
