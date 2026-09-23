"""Validated study-pack models and the OpenAI generation boundary."""

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
from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.text_chunks import split_text_for_generation

MAX_SOURCE_CHARACTERS = 60_000
logger = logging.getLogger(__name__)

# Load local development secrets from .env; deployed environments provide them directly.
load_dotenv()


class StudySection(BaseModel):
    """One source-grounded topic in a student's study pack."""

    model_config = ConfigDict(extra="forbid")

    heading: str = Field(min_length=1, max_length=120)
    explanation: str = Field(min_length=1, max_length=1_500)
    key_points: list[str] = Field(min_length=1, max_length=6)


class StudyPack(BaseModel):
    """The first saved-content shape Lexicon will eventually persist."""

    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=160)
    overview: str = Field(min_length=1, max_length=1_000)
    learning_objectives: list[str] = Field(min_length=2, max_length=6)
    sections: list[StudySection] = Field(min_length=2, max_length=6)


class StudyPackGenerationError(RuntimeError):
    """Raised when the AI provider cannot produce a usable study pack."""


INSTRUCTIONS = """You create concise study packs for university students.
Use only claims supported by the source material provided by the user. Do not add
outside knowledge, invented examples, citations, or facts. If a detail is unclear
or absent, omit it. Organize the material into 2 to 6 useful topics and use plain,
accurate language. Return the requested JSON structure only."""

CHUNK_SYNTHESIS_INSTRUCTIONS = """You create one concise, source-grounded study pack for university students.
The input contains study notes generated independently from consecutive parts of one
uploaded document. Use only claims present in those notes. Do not add outside
knowledge or invented examples. Combine overlapping ideas, preserve coverage across
the document, and organize the result into 2 to 6 useful topics. Return the
requested JSON structure only."""


def generate_study_pack(source_text: str) -> StudyPack:
    """Generate one pack directly or combine packs made from safe text chunks."""
    chunks = split_text_for_generation(source_text)
    if len(chunks) == 1:
        return _generate_study_pack_from_source(chunks[0], INSTRUCTIONS)

    part_packs = [
        _generate_study_pack_from_source(chunk, INSTRUCTIONS)
        for chunk in chunks
    ]
    chunk_notes = "\n\n".join(
        f"Part {number}:\n{pack.model_dump_json()}"
        for number, pack in enumerate(part_packs, start=1)
    )
    return _generate_study_pack_from_source(chunk_notes, CHUNK_SYNTHESIS_INSTRUCTIONS)


def _generate_study_pack_from_source(source_text: str, instructions: str) -> StudyPack:
    """Ask OpenAI for one bounded source, then validate the returned structure."""
    if len(source_text) > MAX_SOURCE_CHARACTERS:
        raise StudyPackGenerationError("Lexicon's combined notes were too large to summarize safely.")

    api_key = os.environ.get("OPENAI_API_KEY")
    model = os.environ.get("OPENAI_MODEL")
    if not api_key or not model:
        raise StudyPackGenerationError(
            "Study-pack generation is not configured. Set OPENAI_API_KEY and OPENAI_MODEL."
        )

    client = OpenAI(api_key=api_key)
    try:
        response = client.responses.create(
            model=model,
            instructions=instructions,
            input=f"Source material:\n---\n{source_text}\n---",
            store=False,
            text={
                "format": {
                    "type": "json_schema",
                    "name": "study_pack",
                    "strict": True,
                    "schema": StudyPack.model_json_schema(),
                }
            },
        )
        return StudyPack.model_validate(json.loads(response.output_text))
    except AuthenticationError as error:
        logger.warning("OpenAI rejected Lexicon's API key: %s", error.request_id)
        raise StudyPackGenerationError("OpenAI rejected the API key in Lexicon's .env file.") from error
    except PermissionDeniedError as error:
        logger.warning("OpenAI denied Lexicon access: %s", error.request_id)
        raise StudyPackGenerationError(
            "This OpenAI project does not have permission to use the selected model."
        ) from error
    except NotFoundError as error:
        logger.warning("Lexicon's selected OpenAI model was not found: %s", error.request_id)
        raise StudyPackGenerationError("The selected OpenAI model is unavailable to this project.") from error
    except RateLimitError as error:
        logger.warning("OpenAI rate or quota limit reached: %s", error.request_id)
        raise StudyPackGenerationError(
            "OpenAI rate or billing limits prevented generation. Check the Platform usage page."
        ) from error
    except APIStatusError as error:
        logger.warning("OpenAI rejected the study-pack request: %s", error.request_id)
        raise StudyPackGenerationError(
            "OpenAI rejected the study-pack request. Check the server terminal for its request ID."
        ) from error
    except (json.JSONDecodeError, ValidationError) as error:
        logger.warning("OpenAI returned an invalid study-pack structure: %s", type(error).__name__)
        raise StudyPackGenerationError(
            "OpenAI returned notes that did not pass Lexicon's study-pack validation."
        ) from error
    except OpenAIError as error:
        logger.warning("Unexpected OpenAI error: %s", type(error).__name__)
        raise StudyPackGenerationError("Lexicon could not reach OpenAI. Please try again.") from error
