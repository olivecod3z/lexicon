"""Durable storage for the private hosted workspace (local SQLite is unchanged)."""
from dataclasses import asdict
from datetime import UTC, datetime, timedelta
from functools import lru_cache, wraps
from uuid import uuid4

from google.cloud import firestore
from google.api_core.exceptions import GoogleAPICallError
from app.materials import CourseLimitError, MaterialNotFoundError, MaterialStorageError, StoredCourse, StoredMaterial, StoredQuiz, StoredAttempt, StoredRecallProgress, StoredReviewCard
from app.mcqs import MCQSet

@lru_cache
def database():
    return firestore.Client()

def guarded(function):
    @wraps(function)
    def run(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except GoogleAPICallError as error:
            raise MaterialStorageError("Saved materials are temporarily unavailable. Please try again.") from error
    return run

@guarded
def save_course(owner_id, name, code="", color="green"):
    existing = list(database().collection("courses").where("owner_id", "==", owner_id).limit(2).stream())
    if existing:
        raise CourseLimitError("The free plan includes one course. More courses will be available with a paid plan.")
    course = StoredCourse(str(uuid4()), name, code, color, datetime.now(UTC).isoformat())
    database().collection("courses").document(course.id).set({**asdict(course), "owner_id": owner_id})
    return course


@guarded
def list_courses(owner_id):
    return [StoredCourse(**{key: value for key, value in doc.to_dict().items() if key != "owner_id"}) for doc in database().collection("courses").where("owner_id", "==", owner_id).order_by("created_at", direction=firestore.Query.DESCENDING).limit(10).stream()]


@guarded
def get_course(owner_id, course_id):
    value = database().collection("courses").document(course_id).get().to_dict()
    if value is None or value.get("owner_id") != owner_id:
        raise MaterialNotFoundError(course_id)
    return StoredCourse(**{key: value for key, value in value.items() if key != "owner_id"})


@guarded
def save_material(owner_id, filename, source_text, unit_count, course_id=None):
    if len(source_text) > 60000:
        raise MaterialStorageError("For this preview, split lectures into files with at most 60,000 readable characters.")
    if not course_id:
        raise MaterialStorageError("Choose a course before uploading a lecture.")
    get_course(owner_id, course_id)
    material = StoredMaterial(str(uuid4()), filename, source_text, unit_count, len(source_text), datetime.now(UTC).isoformat(), course_id)
    database().collection("materials").document(material.id).set({**asdict(material), "owner_id": owner_id})
    return material

@guarded
def get_material(owner_id, material_id):
    value = database().collection("materials").document(material_id).get().to_dict()
    if value is None or value.get("owner_id") != owner_id:
        raise MaterialNotFoundError(material_id)
    value.pop("owner_id", None)
    return StoredMaterial(**value)

@guarded
def list_materials(owner_id):
    fields = ["id", "filename", "unit_count", "character_count", "created_at", "course_id"]
    return [doc.to_dict() for doc in database().collection("materials").where("owner_id", "==", owner_id).select(fields).order_by("created_at", direction=firestore.Query.DESCENDING).limit(100).stream()]

@guarded
def delete_material(owner_id, material_id):
    get_material(owner_id, material_id)
    database().collection("materials").document(material_id).delete()

@guarded
def save_quiz(owner_id, material_id, mcq_set):
    quiz = StoredQuiz(str(uuid4()), material_id, mcq_set, datetime.now(UTC).isoformat())
    database().collection("quizzes").document(quiz.id).set({"id": quiz.id, "owner_id": owner_id, "material_id": material_id, "mcq_set_json": mcq_set.model_dump_json(), "created_at": quiz.created_at})
    return quiz

@guarded
def get_quiz(owner_id, quiz_id):
    value = database().collection("quizzes").document(quiz_id).get().to_dict()
    if value is None or value.get("owner_id") != owner_id:
        raise MaterialNotFoundError(quiz_id)
    value.pop("owner_id", None)
    value["mcq_set"] = MCQSet.model_validate_json(value.pop("mcq_set_json"))
    return StoredQuiz(**value)

@guarded
def save_attempt(owner_id, quiz_id, result_json):
    attempt = StoredAttempt(str(uuid4()), quiz_id, result_json, datetime.now(UTC).isoformat())
    database().collection("quizzes").document(quiz_id).collection("attempts").document(attempt.id).set({**asdict(attempt), "owner_id": owner_id})
    return attempt

@guarded
def list_attempts(owner_id, quiz_id):
    return [StoredAttempt(**{key: value for key, value in doc.to_dict().items() if key != "owner_id"}) for doc in database().collection("quizzes").document(quiz_id).collection("attempts").where("owner_id", "==", owner_id).order_by("created_at", direction=firestore.Query.DESCENDING).limit(100).stream()]

@guarded
def save_practice(owner_id, practice_id, practice):
    database().collection("practice_sessions").document(practice_id).set({"owner_id": owner_id, "practice": practice.model_dump_json()})

@guarded
def get_practice(owner_id, practice_id):
    from app.practice import PracticeSet
    value = database().collection("practice_sessions").document(practice_id).get().to_dict()
    return PracticeSet.model_validate_json(value["practice"]) if value and value.get("owner_id") == owner_id else None


@guarded
def save_flashcards(owner_id, material_id, course_id, flashcards, now=None):
    due_at = (now or datetime.now(UTC)).isoformat()
    cards = [StoredReviewCard(str(uuid4()), material_id, course_id, card.card_type, card.question, card.answer, card.topic, due_at, 0) for card in flashcards]
    batch = database().batch()
    for card in cards:
        batch.set(database().collection("review_cards").document(card.id), {**asdict(card), "owner_id": owner_id})
    batch.commit()
    return cards


@guarded
def list_due_flashcards(owner_id, now=None):
    cutoff = (now or datetime.now(UTC)).isoformat()
    cards = [
        StoredReviewCard(**{key: value for key, value in document.to_dict().items() if key != "owner_id"})
        for document in database().collection("review_cards").where("owner_id", "==", owner_id).limit(100).stream()
    ]
    return sorted((card for card in cards if card.due_at <= cutoff), key=lambda card: (card.due_at, card.id))[:50]


@guarded
def review_flashcard(owner_id, card_id, rating, now=None):
    if rating not in {"again", "hard", "got_it"}:
        raise ValueError("Choose Again, Hard, or Got it.")
    reference = database().collection("review_cards").document(card_id)
    value = reference.get().to_dict()
    if value is None or value.get("owner_id") != owner_id:
        raise MaterialNotFoundError(card_id)
    card = StoredReviewCard(**{key: value for key, value in value.items() if key != "owner_id"})
    current_time = now or datetime.now(UTC)
    days = 1 if rating == "again" else 3 if rating == "hard" else 7 if card.interval_days < 7 else min(card.interval_days * 2, 30)
    updated = StoredReviewCard(**{**card.__dict__, "due_at": (current_time + timedelta(days=days)).isoformat(), "interval_days": days})
    batch = database().batch()
    batch.update(reference, {"due_at": updated.due_at, "interval_days": updated.interval_days})
    batch.set(database().collection("review_events").document(str(uuid4())), {"owner_id": owner_id, "card_id": card_id, "reviewed_at": current_time.isoformat()})
    batch.commit()
    return updated


@guarded
def get_recall_progress(owner_id, now=None):
    today = (now or datetime.now(UTC)).date()
    events = database().collection("review_events").where("owner_id", "==", owner_id).limit(500).stream()
    study_days = {datetime.fromisoformat(event.to_dict()["reviewed_at"]).date() for event in events}
    # Count individual cards reviewed today; the date set above is only for streak calculation.
    events = database().collection("review_events").where("owner_id", "==", owner_id).limit(500).stream()
    reviewed_today = sum(datetime.fromisoformat(event.to_dict()["reviewed_at"]).date() == today for event in events)
    streak = 0
    cursor = today
    while cursor in study_days:
        streak += 1
        cursor -= timedelta(days=1)
    return StoredRecallProgress(reviewed_today=reviewed_today, current_streak=streak)

@guarded
def reserve_request(kind, limit):
    """Durable daily cap; failed attempts count too, avoiding retry-driven spend."""
    reference = database().collection("usage").document(datetime.now(UTC).date().isoformat() + "-" + kind)
    @firestore.transactional
    def reserve(transaction):
        snapshot = reference.get(transaction=transaction)
        count = (snapshot.to_dict() or {}).get("count", 0)
        if count >= limit:
            return False
        transaction.set(reference, {"count": count + 1})
        return True
    return reserve(database().transaction())
