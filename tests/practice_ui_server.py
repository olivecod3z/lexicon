"""Loopback-only release fixture with real API validation/scoring and synthetic identity/provider.
Run: python -m tests.practice_ui_server (or use runpy with this path).
Never deploy this server. Production Docker includes only app/.
"""
import os
from types import SimpleNamespace
import uvicorn
if os.getenv("K_SERVICE"):
    raise RuntimeError("Release fixtures cannot run on Cloud Run")
os.environ["LEXICON_REQUIRE_AUTH"] = "true"
os.environ["LEXYCON_LOCAL_PLAN"] = "Free"
from app import auth, main
from app.materials import StoredCourse, StoredMaterial
from app.practice import PracticeOptions, PracticeSet, question_counts
from fastapi import HTTPException
from pydantic import BaseModel


def verify(token):
    if token != "release-fixture-token":
        raise ValueError("Invalid test identity")
    return {"uid": "release-fixture", "email": "student@example.test", "email_verified": True}
auth._firebase_auth = lambda: SimpleNamespace(verify_id_token=verify)
source = "Active recall retrieves information from memory. " * 140 + "\n" + "Spaced practice distributes review over time. " * 140
materials = [StoredMaterial(f"fixture-{i}", f"Study lecture {i}.txt", source, 2, len(source), "2026-10-08T00:00:00Z", "fixture-course") for i in (1, 2)]
main.list_materials = lambda: [main.material_response(m).model_dump() for m in materials]
main.get_material = lambda key: next(m for m in materials if m.id == key)
main.list_courses = lambda: [StoredCourse("fixture-course", "Study methods", "STU101", "green", "2026-10-08T00:00:00Z", "100")]
main.read_profile = lambda uid: {"name": "Test student", "institution": "Test University", "level": "100", "goals": ["routine"], "minutes": 10, "onboarding_complete": True}
main.list_due_flashcards = lambda: []
main.get_recall_progress = lambda: SimpleNamespace(reviewed_today=0, current_streak=0)


def provider(source, options=None):
    options = options or PracticeOptions()
    mcqs, gaps, theory = question_counts(options)
    return PracticeSet(title="Practice release fixture", mcqs=[{
        "question": f"Recall check {i + 1}: which action retrieves an idea from memory?",
        "options": [{"label": label, "text": text} for label, text in zip("ABCD", ["Explain it with notes closed", "Highlight a page", "Copy a paragraph", "Reread a heading"])],
        "correct_option": "A", "explanation": "Explaining with notes closed requires retrieval.", "topic": "Active recall"} for i in range(mcqs)],
        fill_in_the_gaps=[{"prompt": f"Gap {i + 1}: ____ recall retrieves ideas from memory.", "answer": "active", "topic": "Active recall"} for i in range(gaps)],
        theory_questions=[{"prompt": f"Theory {i + 1}: explain a spaced review routine.", "marking_guidance": "Describe reviews on separate days and checking errors against the lecture.", "topic": "Spaced practice"} for i in range(theory)])
main.generate_practice = provider

class PlanChoice(BaseModel):
    plan: str
@main.app.post("/fixture/plan")
def plan(choice: PlanChoice):
    if choice.plan not in ("Free", "Student", "Pro"):
        raise HTTPException(422)
    os.environ["LEXYCON_LOCAL_PLAN"] = choice.plan
    return {"plan": choice.plan}

if __name__ == "__main__":
    uvicorn.run(main.app, host="127.0.0.1", port=8176)
