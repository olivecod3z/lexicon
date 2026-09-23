"""Small local persistence layer for extracted Lexicon materials."""

import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from app.mcqs import MCQSet

DATABASE_PATH = Path(__file__).resolve().parent.parent / "data" / "lexicon.db"


class MaterialNotFoundError(LookupError):
    """Raised when a requested material identifier does not exist."""


class MaterialStorageError(RuntimeError):
    """Raised when Lexicon cannot read or write its local material store."""


@dataclass(frozen=True)
class StoredMaterial:
    """The material metadata and extracted text needed by later features."""

    id: str
    filename: str
    source_text: str
    unit_count: int
    character_count: int
    created_at: str


@dataclass(frozen=True)
class StoredQuiz:
    """A generated MCQ set saved with its answer key for later scoring."""

    id: str
    material_id: str
    mcq_set: MCQSet
    created_at: str


@dataclass(frozen=True)
class StoredAttempt:
    id: str
    quiz_id: str
    result_json: str
    created_at: str


def save_material(filename: str, source_text: str, unit_count: int) -> StoredMaterial:
    """Store extracted text once and return the identifier used by later requests."""
    material = StoredMaterial(
        id=str(uuid4()),
        filename=filename,
        source_text=source_text,
        unit_count=unit_count,
        character_count=len(source_text),
        created_at=datetime.now(UTC).isoformat(),
    )
    try:
        with _database_connection() as connection:
            connection.execute(
                """
                INSERT INTO materials (id, filename, source_text, unit_count, character_count, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    material.id,
                    material.filename,
                    material.source_text,
                    material.unit_count,
                    material.character_count,
                    material.created_at,
                ),
            )
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexicon could not save this material locally.") from error

    return material


def get_material(material_id: str) -> StoredMaterial:
    """Load the material text required to create study features without re-uploading."""
    try:
        with _database_connection() as connection:
            row = connection.execute(
                """
                SELECT id, filename, source_text, unit_count, character_count, created_at
                FROM materials
                WHERE id = ?
                """,
                (material_id,),
            ).fetchone()
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexicon could not read its local material store.") from error

    if row is None:
        raise MaterialNotFoundError(material_id)

    return StoredMaterial(**dict(row))


def list_materials() -> list[dict]:
    """List local library metadata, without loading or exposing lecture text."""
    try:
        with _database_connection() as connection:
            rows = connection.execute(
                "SELECT id, filename, unit_count, character_count, created_at "
                "FROM materials ORDER BY created_at DESC, id DESC"
            ).fetchall()
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexicon could not load your saved materials. Please try again.") from error
    return [dict(row) for row in rows]


def delete_material(material_id: str) -> None:
    """Permanently remove one locally stored material and its extracted text."""
    try:
        with _database_connection() as connection:
            result = connection.execute("DELETE FROM materials WHERE id = ?", (material_id,))
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexicon could not delete this material locally.") from error

    if result.rowcount == 0:
        raise MaterialNotFoundError(material_id)


def save_quiz(material_id: str, mcq_set: MCQSet) -> StoredQuiz:
    """Save an answer-key-bearing quiz so attempts can be scored later."""
    quiz = StoredQuiz(
        id=str(uuid4()),
        material_id=material_id,
        mcq_set=mcq_set,
        created_at=datetime.now(UTC).isoformat(),
    )
    try:
        with _database_connection() as connection:
            connection.execute(
                """
                INSERT INTO quizzes (id, material_id, mcq_set_json, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (quiz.id, quiz.material_id, quiz.mcq_set.model_dump_json(), quiz.created_at),
            )
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexicon could not save this quiz locally.") from error

    return quiz


def get_quiz(quiz_id: str) -> StoredQuiz:
    """Load one saved quiz and its private answer key."""
    try:
        with _database_connection() as connection:
            row = connection.execute(
                """
                SELECT id, material_id, mcq_set_json, created_at
                FROM quizzes
                WHERE id = ?
                """,
                (quiz_id,),
            ).fetchone()
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexicon could not read its local quiz store.") from error

    if row is None:
        raise MaterialNotFoundError(quiz_id)

    return StoredQuiz(
        id=row["id"],
        material_id=row["material_id"],
        mcq_set=MCQSet.model_validate_json(row["mcq_set_json"]),
        created_at=row["created_at"],
    )


def save_attempt(quiz_id: str, result_json: str) -> StoredAttempt:
    """Store one completed quiz result as an immutable history record."""
    attempt = StoredAttempt(str(uuid4()), quiz_id, result_json, datetime.now(UTC).isoformat())
    try:
        with _database_connection() as connection:
            connection.execute(
                "INSERT INTO quiz_attempts (id, quiz_id, result_json, created_at) VALUES (?, ?, ?, ?)",
                (attempt.id, attempt.quiz_id, attempt.result_json, attempt.created_at),
            )
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexicon could not save this quiz attempt locally.") from error
    return attempt


def list_attempts(quiz_id: str) -> list[StoredAttempt]:
    """Return completed attempts newest first for one saved quiz."""
    try:
        with _database_connection() as connection:
            rows = connection.execute(
                "SELECT id, quiz_id, result_json, created_at FROM quiz_attempts WHERE quiz_id = ? ORDER BY created_at DESC",
                (quiz_id,),
            ).fetchall()
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexicon could not read saved quiz attempts.") from error
    return [StoredAttempt(**dict(row)) for row in rows]


def _connect() -> sqlite3.Connection:
    """Open the database and ensure its one required table exists."""
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS materials (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            source_text TEXT NOT NULL,
            unit_count INTEGER NOT NULL,
            character_count INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id TEXT PRIMARY KEY,
            quiz_id TEXT NOT NULL,
            result_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS quizzes (
            id TEXT PRIMARY KEY,
            material_id TEXT NOT NULL,
            mcq_set_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (material_id) REFERENCES materials (id)
        )
        """
    )
    return connection


@contextmanager
def _database_connection():
    """Commit successful work and always close the SQLite file handle."""
    connection = _connect()
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()
