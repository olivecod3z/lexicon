"""Validated, source-grounded multiple-choice question generation."""

import json
import logging
import os
from typing import Literal

from openai import (
    APIStatusError,
    AuthenticationError,
    NotFoundError,
    OpenAI,
    OpenAIError,
    PermissionDeniedError,
    RateLimitError,
)
from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

from app.study_packs import MAX_SOURCE_CHARACTERS
from app.text_chunks import split_text_for_generation

logger = logging.getLogger(__name__)
OptionLabel = Literal["A", "B", "C", "D"]


class MCQOption(BaseModel):
    """One labelled answer option for a multiple-choice question."""

    model_config = ConfigDict(extra="forbid")

    label: OptionLabel
    text: str = Field(min_length=1, max_length=300)


class MCQQuestion(BaseModel):
    """One source-grounded question with one marked correct answer."""

    model_config = ConfigDict(extra="forbid")

    question: str = Field(min_length=5, max_length=400)
    options: list[MCQOption] = Field(min_length=4, max_length=4)
    correct_option: OptionLabel
    explanation: str = Field(min_length=1, max_length=700)
    topic: str = Field(min_length=1, max_length=120)

    @model_validator(mode="after")
    def require_one_complete_set_of_distinct_options(self) -> "MCQQuestion":
        """Reject incomplete, repeated, or ambiguously labelled options."""
        labels = [option.label for option in self.options]
        if set(labels) != {"A", "B", "C", "D"}:
            raise ValueError("MCQs must contain the option labels A, B, C, and D exactly once.")

        option_texts = [option.text.casefold().strip() for option in self.options]
        if len(set(option_texts)) != 4:
            raise ValueError("MCQ options must have distinct text.")

        return self


class MCQSet(BaseModel):
    """The quiz-question shape returned to a Lexicon client."""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=160)
    questions: list[MCQQuestion] = Field(min_length=5, max_length=20)


class GeneratedMCQSet(BaseModel):
    """The smaller fixed-size set requested from OpenAI for each source chunk."""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=160)
    questions: list[MCQQuestion] = Field(min_length=5, max_length=5)


class MCQGenerationError(RuntimeError):
    """Raised when the AI provider cannot produce usable quiz questions."""


INSTRUCTIONS = """You create fair multiple-choice questions for university students.
Use only facts supported by the source material. Generate exactly five questions.
Every question must test one clear idea and have exactly one defensible correct
answer. Provide four distinct options labelled A, B, C, and D. Distractors must be
plausible, belong to the same domain, and must not be trick answers. Do not use
'all of the above', 'none of the above', or unsupported outside knowledge. Explain
why the correct option is correct using only the source. Assign each question to a
topic from the source material. Return the requested JSON structure only."""


def generate_mcqs(source_text: str) -> MCQSet:
    """Generate five questions per safe chunk, keeping a predictable maximum."""
    chunks = split_text_for_generation(source_text)
    chunk_sets = [_generate_mcqs_from_source(chunk) for chunk in chunks]
    questions = [question for chunk_set in chunk_sets for question in chunk_set.questions]

    title = chunk_sets[0].title if len(chunk_sets) == 1 else "Complete material quiz questions"
    return MCQSet(title=title, questions=questions)


def _generate_mcqs_from_source(source_text: str) -> GeneratedMCQSet:
    """Ask OpenAI for five questions about one bounded section of material."""
    if len(source_text) > MAX_SOURCE_CHARACTERS:
        raise MCQGenerationError("Lexicon received a text chunk that is too large to process.")

    api_key = os.environ.get("OPENAI_API_KEY")
    model = os.environ.get("OPENAI_MODEL")
    if not api_key or not model:
        raise MCQGenerationError(
            "MCQ generation is not configured. Set OPENAI_API_KEY and OPENAI_MODEL."
        )

    client = OpenAI(api_key=api_key)
    try:
        response = client.responses.create(
            model=model,
            instructions=INSTRUCTIONS,
            input=f"Source material:\n---\n{source_text}\n---",
            store=False,
            text={
                "format": {
                    "type": "json_schema",
                    "name": "mcq_set",
                    "strict": True,
                    "schema": GeneratedMCQSet.model_json_schema(),
                }
            },
        )
        return GeneratedMCQSet.model_validate(json.loads(response.output_text))
    except AuthenticationError as error:
        logger.warning("OpenAI rejected Lexicon's API key: %s", error.request_id)
        raise MCQGenerationError("OpenAI rejected the API key in Lexicon's .env file.") from error
    except PermissionDeniedError as error:
        logger.warning("OpenAI denied Lexicon access: %s", error.request_id)
        raise MCQGenerationError(
            "This OpenAI project does not have permission to use the selected model."
        ) from error
    except NotFoundError as error:
        logger.warning("Lexicon's selected OpenAI model was not found: %s", error.request_id)
        raise MCQGenerationError("The selected OpenAI model is unavailable to this project.") from error
    except RateLimitError as error:
        logger.warning("OpenAI rate or quota limit reached: %s", error.request_id)
        raise MCQGenerationError(
            "OpenAI rate or billing limits prevented generation. Check the Platform usage page."
        ) from error
    except APIStatusError as error:
        logger.warning("OpenAI rejected the MCQ request: %s", error.request_id)
        raise MCQGenerationError(
            "OpenAI rejected the MCQ request. Check the server terminal for its request ID."
        ) from error
    except (json.JSONDecodeError, ValidationError) as error:
        logger.warning("OpenAI returned an invalid MCQ structure: %s", type(error).__name__)
        raise MCQGenerationError(
            "OpenAI returned quiz questions that did not pass Lexicon's validation."
        ) from error
    except OpenAIError as error:
        logger.warning("Unexpected OpenAI error: %s", type(error).__name__)
        raise MCQGenerationError("Lexicon could not reach OpenAI. Please try again.") from error
