"""Quiz-taking models and deterministic scoring logic."""

from collections import defaultdict
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.mcqs import MCQOption, MCQQuestion, MCQSet

OptionLabel = Literal["A", "B", "C", "D"]


class QuizAnswer(BaseModel):
    """One answer a student submits for a question index."""

    question_index: int = Field(ge=0)
    selected_option: OptionLabel


class QuizAttemptRequest(BaseModel):
    """Answers submitted for one saved quiz."""

    answers: list[QuizAnswer] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def question_indexes_are_unique(self) -> "QuizAttemptRequest":
        indexes = [answer.question_index for answer in self.answers]
        if len(set(indexes)) != len(indexes):
            raise ValueError("Submit only one answer for each question.")
        return self


class QuizQuestionForStudent(BaseModel):
    """A question without the answer key, safe to show before an attempt."""

    question: str
    options: list[MCQOption]
    topic: str


class QuizForStudent(BaseModel):
    """A saved quiz response that intentionally excludes correct answers."""

    id: str
    material_id: str
    title: str
    questions: list[QuizQuestionForStudent]
    created_at: str


class QuestionResult(BaseModel):
    """Feedback revealed after a submitted answer has been scored."""

    question_index: int
    selected_option: OptionLabel | None
    correct_option: OptionLabel
    is_correct: bool
    explanation: str
    topic: str


class TopicResult(BaseModel):
    """Score summary for one topic in the quiz."""

    topic: str
    correct_answers: int
    total_questions: int


class QuizAttemptResult(BaseModel):
    """Complete score and corrective feedback for one quiz attempt."""

    score: int
    total_questions: int
    percentage: float
    question_results: list[QuestionResult]
    topic_results: list[TopicResult]
    attempt_id: str | None = None
    submitted_at: str | None = None


class QuizScoringError(ValueError):
    """Raised when an attempt does not match its saved quiz."""


def quiz_for_student(quiz_id: str, material_id: str, mcq_set: MCQSet, created_at: str) -> QuizForStudent:
    """Remove answers and explanations before returning a quiz to a student."""
    return QuizForStudent(
        id=quiz_id,
        material_id=material_id,
        title=mcq_set.title,
        questions=[
            QuizQuestionForStudent(
                question=question.question,
                options=question.options,
                topic=question.topic,
            )
            for question in mcq_set.questions
        ],
        created_at=created_at,
    )


def score_quiz(mcq_set: MCQSet, attempt: QuizAttemptRequest) -> QuizAttemptResult:
    """Compare submitted labels to the saved answer key and calculate results."""
    submitted = {answer.question_index: answer.selected_option for answer in attempt.answers}
    invalid_indexes = set(submitted) - set(range(len(mcq_set.questions)))
    if invalid_indexes:
        raise QuizScoringError("One or more submitted question indexes do not exist in this quiz.")

    results: list[QuestionResult] = []
    topic_totals: dict[str, int] = defaultdict(int)
    topic_correct: dict[str, int] = defaultdict(int)

    for index, question in enumerate(mcq_set.questions):
        selected = submitted.get(index)
        is_correct = selected == question.correct_option
        topic_totals[question.topic] += 1
        if is_correct:
            topic_correct[question.topic] += 1
        results.append(
            QuestionResult(
                question_index=index,
                selected_option=selected,
                correct_option=question.correct_option,
                is_correct=is_correct,
                explanation=question.explanation,
                topic=question.topic,
            )
        )

    score = sum(result.is_correct for result in results)
    total = len(mcq_set.questions)
    return QuizAttemptResult(
        score=score,
        total_questions=total,
        percentage=round((score / total) * 100, 2),
        question_results=results,
        topic_results=[
            TopicResult(
                topic=topic,
                correct_answers=topic_correct[topic],
                total_questions=total_questions,
            )
            for topic, total_questions in topic_totals.items()
        ],
    )
