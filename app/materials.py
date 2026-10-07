"""Small local persistence layer for extracted Lexycon materials."""

import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

from app.mcqs import MCQSet

DATABASE_PATH = Path(__file__).resolve().parent.parent / "data" / "lexicon.db"


class MaterialNotFoundError(LookupError):
    """Raised when a requested material identifier does not exist."""


class MaterialStorageError(RuntimeError):
    """Raised when Lexycon cannot read or write its local material store."""


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
    level: str = ""


@dataclass(frozen=True)
class StoredReviewCard:
    """One saved flashcard plus the next time it should be reviewed."""

    id: str
    material_id: str
    course_id: str | None
    card_type: str
    question: str
    answer: str
    topic: str
    due_at: str
    interval_days: int


@dataclass(frozen=True)
class StoredRecallProgress:
    """A small, motivating summary of completed active-recall reviews."""

    reviewed_today: int
    current_streak: int


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
        raise MaterialStorageError("Lexycon could not save this material locally.") from error

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
        raise MaterialStorageError("Lexycon could not read its local material store.") from error

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
        raise MaterialStorageError("Lexycon could not load your saved materials. Please try again.") from error
    return [dict(row) for row in rows]


def save_course(name: str, code: str = "", color: str = "green", level: str = "") -> StoredCourse:
    """Create the first local course used to group related lecture materials."""
    course = StoredCourse(str(uuid4()), name, code, color, datetime.now(UTC).isoformat(), level)
    try:
        with _database_connection() as connection:
            existing = connection.execute("SELECT COUNT(*) FROM courses").fetchone()[0]
            if existing >= 1:
                raise CourseLimitError("The free plan includes one course. More courses will be available with a paid plan.")
            connection.execute(
                "INSERT INTO courses (id, name, code, color, created_at, level) VALUES (?, ?, ?, ?, ?, ?)",
                (course.id, course.name, course.code, course.color, course.created_at, course.level),
            )
    except CourseLimitError:
        raise
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexycon could not save this course locally.") from error
    return course


def list_courses() -> list[StoredCourse]:
    """Return the local student's courses, newest first."""
    try:
        with _database_connection() as connection:
            rows = connection.execute("SELECT id, name, code, color, created_at, level FROM courses ORDER BY created_at DESC").fetchall()
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexycon could not load your courses. Please try again.") from error
    return [StoredCourse(**dict(row)) for row in rows]


def save_flashcards(material_id: str, course_id: str | None, flashcards, now: datetime | None = None) -> list[StoredReviewCard]:
    """Save generated cards as immediately due, ready for a first recall session."""
    due_at = (now or datetime.now(UTC)).isoformat()
    cards = [
        StoredReviewCard(
            id=str(uuid4()), material_id=material_id, course_id=course_id,
            card_type=card.card_type, question=card.question, answer=card.answer,
            topic=card.topic, due_at=due_at, interval_days=0,
        )
        for card in flashcards
    ]
    try:
        with _database_connection() as connection:
            connection.executemany(
                """INSERT INTO review_cards
                (id, material_id, course_id, card_type, question, answer, topic, due_at, interval_days)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [(card.id, card.material_id, card.course_id, card.card_type, card.question, card.answer, card.topic, card.due_at, card.interval_days) for card in cards],
            )
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexycon could not save these flashcards for review.") from error
    return cards


def list_due_flashcards(now: datetime | None = None) -> list[StoredReviewCard]:
    """Return cards due now, oldest first, without exposing future reviews."""
    due_at = (now or datetime.now(UTC)).isoformat()
    try:
        with _database_connection() as connection:
            rows = connection.execute(
                """SELECT id, material_id, course_id, card_type, question, answer, topic, due_at, interval_days
                FROM review_cards WHERE due_at <= ? ORDER BY due_at ASC, id ASC LIMIT 50""",
                (due_at,),
            ).fetchall()
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexycon could not load today's recall. Please try again.") from error
    return [StoredReviewCard(**dict(row)) for row in rows]


def review_flashcard(card_id: str, rating: str, now: datetime | None = None) -> StoredReviewCard:
    """Schedule one reviewed card using a small, explainable spacing rule."""
    if rating not in {"again", "hard", "got_it"}:
        raise ValueError("Choose Again, Hard, or Got it.")
    current_time = now or datetime.now(UTC)
    try:
        with _database_connection() as connection:
            row = connection.execute(
                "SELECT id, material_id, course_id, card_type, question, answer, topic, due_at, interval_days FROM review_cards WHERE id = ?",
                (card_id,),
            ).fetchone()
            if row is None:
                raise MaterialNotFoundError(card_id)
            card = StoredReviewCard(**dict(row))
            days = 1 if rating == "again" else 3 if rating == "hard" else 7 if card.interval_days < 7 else min(card.interval_days * 2, 30)
            updated = StoredReviewCard(**{**card.__dict__, "due_at": (current_time + timedelta(days=days)).isoformat(), "interval_days": days})
            connection.execute("UPDATE review_cards SET due_at = ?, interval_days = ? WHERE id = ?", (updated.due_at, updated.interval_days, card_id))
            connection.execute(
                "INSERT INTO review_events (id, card_id, reviewed_at) VALUES (?, ?, ?)",
                (str(uuid4()), card_id, current_time.isoformat()),
            )
    except MaterialNotFoundError:
        raise
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexycon could not save this review. Please try again.") from error
    return updated


def get_recall_progress(now: datetime | None = None) -> StoredRecallProgress:
    """Count today's completed cards and the uninterrupted run of active days."""
    today = (now or datetime.now(UTC)).date()
    try:
        with _database_connection() as connection:
            rows = connection.execute(
                "SELECT substr(reviewed_at, 1, 10) AS study_day FROM review_events ORDER BY study_day DESC"
            ).fetchall()
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexycon could not load your review progress. Please try again.") from error

    study_days = {datetime.fromisoformat(row["study_day"]).date() for row in rows}
    reviewed_today = sum(datetime.fromisoformat(row["study_day"]).date() == today for row in rows)
    streak = 0
    cursor = today
    while cursor in study_days:
        streak += 1
        cursor -= timedelta(days=1)
    return StoredRecallProgress(reviewed_today=reviewed_today, current_streak=streak)


def delete_material(material_id: str) -> None:
    """Permanently remove one locally stored material and its extracted text."""
    try:
        with _database_connection() as connection:
            result = connection.execute("DELETE FROM materials WHERE id = ?", (material_id,))
    except sqlite3.Error as error:
        raise MaterialStorageError("Lexycon could not delete this material locally.") from error

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
        raise MaterialStorageError("Lexycon could not save this quiz locally.") from error

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
        raise MaterialStorageError("Lexycon could not read its local quiz store.") from error

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
        raise MaterialStorageError("Lexycon could not save this quiz attempt locally.") from error
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
        raise MaterialStorageError("Lexycon could not read saved quiz attempts.") from error
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
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS review_cards (
            id TEXT PRIMARY KEY,
            material_id TEXT NOT NULL,
            course_id TEXT,
            card_type TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            topic TEXT NOT NULL,
            due_at TEXT NOT NULL,
            interval_days INTEGER NOT NULL
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS review_events (
            id TEXT PRIMARY KEY,
            card_id TEXT NOT NULL,
            reviewed_at TEXT NOT NULL,
            FOREIGN KEY (card_id) REFERENCES review_cards (id)
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
    course_columns = {row[1] for row in connection.execute("PRAGMA table_info(courses)").fetchall()}
    if "level" not in course_columns:
        connection.execute("ALTER TABLE courses ADD COLUMN level TEXT NOT NULL DEFAULT ''")
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
