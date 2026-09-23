"""Mixed objective and theory practice generated from saved material."""
import json, os
from typing import Literal
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.mcqs import MCQQuestion
from app.study_packs import MAX_SOURCE_CHARACTERS
from app.text_chunks import split_text_for_generation

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
    title: str
    mcqs: list[MCQQuestion] = Field(min_length=5, max_length=5)
    fill_in_the_gaps: list[GapQuestion] = Field(min_length=3, max_length=3)
    theory_questions: list[TheoryQuestion] = Field(min_length=2, max_length=2)

class PracticeSubmission(BaseModel):
    mcq_answers: list[str] = Field(min_length=5, max_length=5)
    gap_answers: list[str] = Field(min_length=3, max_length=3)

class PracticeResult(BaseModel):
    correct_mcqs: int
    correct_gaps: int
    total_gradable: int = 8
    percentage: float

def score_practice(practice: PracticeSet, submission: PracticeSubmission) -> PracticeResult:
    correct_mcqs = sum(answer == question.correct_option for answer, question in zip(submission.mcq_answers, practice.mcqs))
    correct_gaps = sum(answer.strip().casefold() == question.answer.strip().casefold() for answer, question in zip(submission.gap_answers, practice.fill_in_the_gaps))
    return PracticeResult(correct_mcqs=correct_mcqs, correct_gaps=correct_gaps, percentage=round((correct_mcqs + correct_gaps) / 8 * 100, 2))

class PracticeGenerationError(RuntimeError): pass

INSTRUCTIONS = """Create a university mixed practice set using only the supplied source. Return exactly 5 fair MCQs with one defensible answer, 3 keyword fill-in-the-gap prompts with exactly one ____ blank, and 2 theory prompts. Theory marking guidance must list source-grounded points expected in a strong answer. Do not add outside knowledge."""

def generate_practice(source_text: str) -> PracticeSet:
    chunks = split_text_for_generation(source_text)
    if len(chunks) != 1: raise PracticeGenerationError("Mixed practice currently supports materials up to 60,000 readable characters.")
    key, model = os.getenv("OPENAI_API_KEY"), os.getenv("OPENAI_MODEL")
    if not key or not model: raise PracticeGenerationError("Mixed practice is not configured. Set OPENAI_API_KEY and OPENAI_MODEL.")
    try:
        response = OpenAI(api_key=key).responses.create(model=model, instructions=INSTRUCTIONS, input=f"Source material:\n---\n{source_text}\n---", store=False, text={"format":{"type":"json_schema","name":"practice_set","strict":True,"schema":PracticeSet.model_json_schema()}})
        return PracticeSet.model_validate(json.loads(response.output_text))
    except (OpenAIError, ValueError, json.JSONDecodeError) as error:
        raise PracticeGenerationError("Lexicon could not generate a valid mixed practice set.") from error
