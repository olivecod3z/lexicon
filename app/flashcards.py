"""Validated, source-grounded flashcard generation."""

import json
import logging
import os

from openai import (
    APIStatusError,
    AuthenticationError,
    NotFoundError,
    OpenAI,
    OpenAIError,
    PermissionDeniedError,
    RateLimitError,
)
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator
from typing import Literal

from app.study_packs import MAX_SOURCE_CHARACTERS
from app.text_chunks import split_text_for_generation

logger = logging.getLogger(__name__)


class Flashcard(BaseModel):
    """One question-answer pair for active recall practice."""

    model_config = ConfigDict(extra="forbid")

    card_type: Literal["question_answer", "fill_in_the_blank"]
    question: str = Field(min_length=1, max_length=300)
    answer: str = Field(min_length=1, max_length=700)
    topic: str = Field(min_length=1, max_length=120)

    @field_validator("question")
    @classmethod
    def fill_in_the_blank_cards_need_one_blank(cls, question: str, info) -> str:
        """Require cloze cards to visibly test one missing keyword or phrase."""
        if info.data.get("card_type") == "fill_in_the_blank" and question.count("____") != 1:
            raise ValueError("Fill-in-the-blank cards must contain exactly one '____' blank.")
        return question


class FlashcardSet(BaseModel):
    """A validated group of flashcards created from one source document."""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=160)
    flashcards: list[Flashcard] = Field(min_length=5, max_length=20)

    @model_validator(mode="after")
    def require_both_flashcard_types(self) -> "FlashcardSet":
        """Ensure students receive both concept and keyword-recall practice."""
        card_types = {card.card_type for card in self.flashcards}
        if card_types != {"question_answer", "fill_in_the_blank"}:
            raise ValueError("A flashcard set must include both supported flashcard types.")
        return self


class FlashcardGenerationError(RuntimeError):
    """Raised when the AI provider cannot produce usable flashcards."""


INSTRUCTIONS = """You create active-recall flashcards for university students.
Use only facts supported by the source material. Do not introduce outside knowledge,
invented examples, or unsupported claims. Each card must test one clear idea with a
direct question and a concise answer. Avoid duplicate cards and avoid questions that
give away their answers. Include a mix of question_answer cards and
fill_in_the_blank cards. For a fill_in_the_blank card, write a statement based on
the source with exactly one ____ blank, and make its answer the missing keyword or
short phrase. Assign every card to a topic from the source material.
Return the requested JSON structure only."""


def generate_flashcards(source_text: str) -> FlashcardSet:
    """Create cards directly or generate a small, balanced set per text chunk."""
    chunks = split_text_for_generation(source_text)
    if len(chunks) == 1:
        return _generate_flashcards_from_source(chunks[0])

    chunk_sets = [_generate_flashcards_from_source(chunk) for chunk in chunks]
    cards = [card for card_set in chunk_sets for card in _select_chunk_cards(card_set)]
    return FlashcardSet(
        title="Complete material flashcards",
        flashcards=cards,
    )


def _select_chunk_cards(card_set: FlashcardSet) -> list[Flashcard]:
    """Keep five balanced cards from each part, capped at 20 cards overall."""
    question_answer_index = next(
        index
        for index, card in enumerate(card_set.flashcards)
        if card.card_type == "question_answer"
    )
    fill_in_the_blank_index = next(
        index
        for index, card in enumerate(card_set.flashcards)
        if card.card_type == "fill_in_the_blank"
    )
    selected_indexes = [question_answer_index, fill_in_the_blank_index]
    selected_indexes.extend(
        index
        for index in range(len(card_set.flashcards))
        if index not in selected_indexes
    )
    return [card_set.flashcards[index] for index in selected_indexes[:5]]


def _generate_flashcards_from_source(source_text: str) -> FlashcardSet:
    """Ask OpenAI for flashcards from one bounded text source."""
    if len(source_text) > MAX_SOURCE_CHARACTERS:
        raise FlashcardGenerationError("Lexicon received a text chunk that is too large to process.")

    api_key = os.environ.get("OPENAI_API_KEY")
    model = os.environ.get("OPENAI_MODEL")
    if not api_key or not model:
        raise FlashcardGenerationError(
            "Flashcard generation is not configured. Set OPENAI_API_KEY and OPENAI_MODEL."
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
                    "name": "flashcard_set",
                    "strict": True,
                    "schema": FlashcardSet.model_json_schema(),
                }
            },
        )
        return FlashcardSet.model_validate(json.loads(response.output_text))
    except AuthenticationError as error:
        logger.warning("OpenAI rejected Lexicon's API key: %s", error.request_id)
        raise FlashcardGenerationError("OpenAI rejected the API key in Lexicon's .env file.") from error
    except PermissionDeniedError as error:
        logger.warning("OpenAI denied Lexicon access: %s", error.request_id)
        raise FlashcardGenerationError(
            "This OpenAI project does not have permission to use the selected model."
        ) from error
    except NotFoundError as error:
        logger.warning("Lexicon's selected OpenAI model was not found: %s", error.request_id)
        raise FlashcardGenerationError("The selected OpenAI model is unavailable to this project.") from error
    except RateLimitError as error:
        logger.warning("OpenAI rate or quota limit reached: %s", error.request_id)
        raise FlashcardGenerationError(
            "OpenAI rate or billing limits prevented generation. Check the Platform usage page."
        ) from error
    except APIStatusError as error:
        logger.warning("OpenAI rejected the flashcard request: %s", error.request_id)
        raise FlashcardGenerationError(
            "OpenAI rejected the flashcard request. Check the server terminal for its request ID."
        ) from error
    except (json.JSONDecodeError, ValidationError) as error:
        logger.warning("OpenAI returned an invalid flashcard structure: %s", type(error).__name__)
        raise FlashcardGenerationError(
            "OpenAI returned flashcards that did not pass Lexicon's validation."
        ) from error
    except OpenAIError as error:
        logger.warning("Unexpected OpenAI error: %s", type(error).__name__)
        raise FlashcardGenerationError("Lexicon could not reach OpenAI. Please try again.") from error
