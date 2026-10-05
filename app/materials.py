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


class CourseLimitError(RuntimeError):
    """Raised when a student reaches the number of courses their plan allows."""


@dataclass(frozen=True)
class StoredMaterial:
    """The material metadata and extracted text needed by later features."""

    id: str
    filename: str
    source_text: str
    unit_count: int
    character_count: int
    created_at: str
    course_id: str | None = None


@dataclass(frozen=True)
class StoredCourse:
    """A student's named study space for related lectures and future reviews."""

    id: str
    name: str
    code: str
    color: str
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


def save_material(filename: str, source_text: str, unit_count: int, course_id: str | None = None) -> StoredMaterial:
    """Store extracted text once and return the identifier used by later requests."""
    material = StoredMaterial(
        id=str(uuid4()),
        filename=filename,
        source_text=source_text,
        unit_count=unit_count,
        character_count=len(source_text),
        created_at=datetime.now(UTC).isoformat(),
        course_id=course_id,
    )
    try:
        with _database_connection() as connection:
            connection.execute(
                """
                INSERT INTO materials (id, filename, source_text, unit_count, character_count, created_at, course_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    material.id,
                    material.filename,
                    material.source_text,
                    material.unit_count,
                    material.character_count,
                    material.created_at,
                    material.course_id,
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
                SELECT id, filename, source_text, unit_count, character_count, created_at, course_id
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
                "SELECT id, filename, unit_count, character_count, created_at, course_id "
                "FROM materials ORDER BY created_at DESC, id DESC"
            ).fetchall()
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexicon could not load your saved materials. Please try again.") from error
    return [dict(row) for row in rows]


def save_course(name: str, code: str = "", color: str = "green") -> StoredCourse:
    """Create the first local course used to group related lecture materials."""
    course = StoredCourse(str(uuid4()), name, code, color, datetime.now(UTC).isoformat())
    try:
        with _database_connection() as connection:
            existing = connection.execute("SELECT COUNT(*) FROM courses").fetchone()[0]
            if existing >= 1:
                raise CourseLimitError("The free plan includes one course. More courses will be available with a paid plan.")
            connection.execute(
                "INSERT INTO courses (id, name, code, color, created_at) VALUES (?, ?, ?, ?, ?)",
                (course.id, course.name, course.code, course.color, course.created_at),
            )
    except CourseLimitError:
        raise
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexicon could not save this course locally.") from error
    return course


def list_courses() -> list[StoredCourse]:
    """Return the local student's courses, newest first."""
    try:
        with _database_connection() as connection:
            rows = connection.execute("SELECT id, name, code, color, created_at FROM courses ORDER BY created_at DESC").fetchall()
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexicon could not load your courses. Please try again.") from error
    return [StoredCourse(**dict(row)) for row in rows]


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
            created_at TEXT NOT NULL,
            course_id TEXT
        )
        """
    )
    columns = {row[1] for row in connection.execute("PRAGMA table_info(materials)").fetchall()}
    if "course_id" not in columns:
        connection.execute("ALTER TABLE materials ADD COLUMN course_id TEXT")
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            color TEXT NOT NULL,
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
