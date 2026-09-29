"""Durable storage for the private hosted workspace (local SQLite is unchanged)."""
from dataclasses import asdict
from datetime import UTC, datetime
from functools import lru_cache, wraps
from uuid import uuid4

from google.cloud import firestore
from google.api_core.exceptions import GoogleAPICallError
from app.materials import MaterialNotFoundError, MaterialStorageError, StoredMaterial, StoredQuiz, StoredAttempt
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
def save_material(owner_id, filename, source_text, unit_count):
    if len(source_text) > 60000:
        raise MaterialStorageError("For this preview, split lectures into files with at most 60,000 readable characters.")
    material = StoredMaterial(str(uuid4()), filename, source_text, unit_count, len(source_text), datetime.now(UTC).isoformat())
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
    fields = ["id", "filename", "unit_count", "character_count", "created_at"]
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
