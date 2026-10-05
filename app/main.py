"""HTTP API for Lexicon's study-material workflow."""

import os
from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.responses import RedirectResponse, Response
from pydantic import BaseModel

from app.document_text import DocumentExtractionError, SUPPORTED_EXTENSIONS, extract_text
from app.auth import AuthenticatedUser, current_user
from app.flashcards import FlashcardGenerationError, FlashcardSet, generate_flashcards
from app.mcqs import MCQGenerationError, MCQSet, generate_mcqs
from app.materials import (
    MaterialNotFoundError,
    MaterialStorageError,
    StoredMaterial,
    StoredCourse,
    StoredReviewCard,
    CourseLimitError,
    delete_material,
    get_material,
    get_quiz,
    list_attempts,
    list_materials,
    save_material,
    save_attempt,
    save_quiz,
    save_course,
    list_courses,
    save_flashcards,
    list_due_flashcards,
    review_flashcard,
    get_recall_progress,
)
from app.quizzes import (
    QuizAttemptRequest,
    QuizAttemptResult,
    QuizForStudent,
    QuizScoringError,
    quiz_for_student,
    score_quiz,
)
from app.practice import PracticeGenerationError, PracticeSet, PracticeSubmission, PracticeResult, generate_practice, score_practice
from app.study_packs import StudyPack, StudyPackGenerationError, generate_study_pack
from app.text_chunks import TextChunkingError

MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024
TEXT_PREVIEW_LENGTH = 500

app = FastAPI(title="Lexicon API", version="0.1.0")
practice_sessions: dict[str, PracticeSet] = {}
HOSTED = bool(os.getenv("K_SERVICE"))
if HOSTED:
    from app.cloud_store import (save_material, get_material, list_materials, delete_material,
        save_quiz, get_quiz, save_attempt, list_attempts, save_practice, get_practice,
        save_course, list_courses, save_flashcards, list_due_flashcards, review_flashcard, get_recall_progress)
    from app.hosted_access import enforce_preview_limits
    from fastapi.middleware.cors import CORSMiddleware
    app.middleware("http")(enforce_preview_limits)
    app.add_middleware(CORSMiddleware,
        allow_origins=["https://lexicon-aguet-20260928.web.app", "https://lexicon-aguet-20260928.firebaseapp.com"],
        allow_methods=["GET", "POST", "DELETE"], allow_headers=["Content-Type", "Authorization"])



class ExtractionResponse(BaseModel):
    """A compact confirmation that Lexicon read the uploaded material."""

    filename: str
    unit_count: int
    character_count: int
    preview: str


class MaterialResponse(BaseModel):
    """The safe material metadata returned after saving an upload."""

    id: str
    filename: str
    unit_count: int
    character_count: int
    created_at: str
    course_id: str | None = None


class CourseCreate(BaseModel):
    """The small amount of information needed to name a study space."""

    name: str
    code: str = ""
    color: str = "green"


class CourseResponse(BaseModel):
    id: str
    name: str
    code: str
    color: str
    created_at: str


class ReviewCardResponse(BaseModel):
    id: str
    material_id: str
    course_id: str | None
    card_type: str
    question: str
    answer: str
    topic: str
    due_at: str
    interval_days: int


class ReviewSubmission(BaseModel):
    rating: Literal["again", "hard", "got_it"]


class RecallProgressResponse(BaseModel):
    reviewed_today: int
    current_streak: int


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    """Send local visitors to the interactive API documentation."""
    return RedirectResponse(url="/docs")


@app.get("/health")
def health_check() -> dict[str, str]:
    """A lightweight endpoint for confirming that the API is running."""
    return {"status": "ok"}


async def read_supported_upload(file: UploadFile) -> tuple[str, bytes]:
    """Read one supported upload after applying Lexicon's shared boundary rules."""
    filename = file.filename or "uploaded-file"
    extension = Path(filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        allowed = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise HTTPException(status_code=400, detail=f"Please upload one of: {allowed}.")

    file_bytes = await file.read(MAX_UPLOAD_SIZE_BYTES + 1)
    if not file_bytes:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(file_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Files must be 25 MB or smaller.")

    return filename, file_bytes


def material_response(material: StoredMaterial) -> MaterialResponse:
    """Return metadata without exposing stored lecture text unnecessarily."""
    return MaterialResponse(
        id=material.id,
        filename=material.filename,
        unit_count=material.unit_count,
        character_count=material.character_count,
        created_at=material.created_at,
        course_id=material.course_id,
    )


def course_response(course: StoredCourse) -> CourseResponse:
    return CourseResponse(**course.__dict__)


def review_card_response(card: StoredReviewCard) -> ReviewCardResponse:
    return ReviewCardResponse(**card.__dict__)


def validate_course(data: CourseCreate) -> CourseCreate:
    name = data.name.strip()
    code = data.code.strip()
    if not name or len(name) > 100:
        raise HTTPException(status_code=422, detail="Course names must be between 1 and 100 characters.")
    if len(code) > 16:
        raise HTTPException(status_code=422, detail="Course codes must be 16 characters or fewer.")
    if data.color not in {"green", "blue", "rose", "yellow"}:
        raise HTTPException(status_code=422, detail="Choose one of Lexicon's course colours.")
    return CourseCreate(name=name, code=code, color=data.color)


def load_material_or_404(owner_id: str, material_id: str) -> StoredMaterial:
    """Translate storage-layer exceptions into clear HTTP responses."""
    try:
        return get_material(owner_id, material_id) if HOSTED else get_material(material_id)
    except MaterialNotFoundError as error:
        raise HTTPException(status_code=404, detail="Material not found.") from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


def load_quiz_or_404(owner_id: str, quiz_id: str):
    """Load a saved quiz or turn storage failures into HTTP responses."""
    try:
        return get_quiz(owner_id, quiz_id) if HOSTED else get_quiz(quiz_id)
    except MaterialNotFoundError as error:
        raise HTTPException(status_code=404, detail="Quiz not found.") from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/materials", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(file: UploadFile = File(...), course_id: str | None = Form(None), user: AuthenticatedUser = Depends(current_user)) -> MaterialResponse:
    """Extract and save one material so later study features can reuse it."""
    filename, file_bytes = await read_supported_upload(file)

    try:
        source_text, unit_count = extract_text(filename, file_bytes)
        saved = save_material(user.uid, filename, source_text, unit_count, course_id) if HOSTED else save_material(filename, source_text, unit_count, course_id)
        return material_response(saved)
    except DocumentExtractionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/courses", response_model=list[CourseResponse])
def get_courses(user: AuthenticatedUser = Depends(current_user)) -> list[CourseResponse]:
    """List the signed-in student's course workspaces."""
    try:
        courses = list_courses(user.uid) if HOSTED else list_courses()
        return [course_response(course) for course in courses]
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(data: CourseCreate, user: AuthenticatedUser = Depends(current_user)) -> CourseResponse:
    """Create the one full-featured course included in the free plan."""
    data = validate_course(data)
    try:
        course = save_course(user.uid, data.name, data.code, data.color) if HOSTED else save_course(data.name, data.code, data.color)
        return course_response(course)
    except CourseLimitError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/materials", response_model=list[MaterialResponse])
def get_material_library(user: AuthenticatedUser = Depends(current_user)) -> list[MaterialResponse]:
    """Return this local workspace's library, with lecture content excluded."""
    try:
        items = list_materials(user.uid) if HOSTED else list_materials()
        return [MaterialResponse(**item) for item in items]
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/reviews/today", response_model=list[ReviewCardResponse])
def get_todays_recall(user: AuthenticatedUser = Depends(current_user)) -> list[ReviewCardResponse]:
    """Return this student's saved flashcards that are ready for recall today."""
    try:
        cards = list_due_flashcards(user.uid) if HOSTED else list_due_flashcards()
        return [review_card_response(card) for card in cards]
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/reviews/progress", response_model=RecallProgressResponse)
def get_recall_progress_summary(user: AuthenticatedUser = Depends(current_user)) -> RecallProgressResponse:
    """Return the student's completed recall count and current-day streak."""
    try:
        progress = get_recall_progress(user.uid) if HOSTED else get_recall_progress()
        return RecallProgressResponse(**progress.__dict__)
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/reviews/{card_id}", response_model=ReviewCardResponse)
def schedule_review(card_id: str, submission: ReviewSubmission, user: AuthenticatedUser = Depends(current_user)) -> ReviewCardResponse:
    """Save the student's recall rating and schedule the next review."""
    try:
        card = review_flashcard(user.uid, card_id, submission.rating) if HOSTED else review_flashcard(card_id, submission.rating)
        return review_card_response(card)
    except MaterialNotFoundError as error:
        raise HTTPException(status_code=404, detail="Review card not found.") from error
    except (MaterialStorageError, ValueError) as error:
        raise HTTPException(status_code=503 if isinstance(error, MaterialStorageError) else 422, detail=str(error)) from error


@app.get("/materials/{material_id}", response_model=MaterialResponse)
def get_saved_material(material_id: str, user: AuthenticatedUser = Depends(current_user)) -> MaterialResponse:
    """Return saved material metadata, without returning its lecture content."""
    return material_response(load_material_or_404(user.uid, material_id))


@app.delete("/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_material(material_id: str, user: AuthenticatedUser = Depends(current_user)) -> Response:
    """Allow a student to remove locally stored extracted material."""
    try:
        delete_material(user.uid, material_id) if HOSTED else delete_material(material_id)
    except MaterialNotFoundError as error:
        raise HTTPException(status_code=404, detail="Material not found.") from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post(
    "/materials/extract",
    response_model=ExtractionResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
async def extract_material(file: UploadFile = File(...), user: AuthenticatedUser = Depends(current_user)) -> ExtractionResponse:
    """Accept one supported material file and return a preview of its text."""
    filename, file_bytes = await read_supported_upload(file)

    try:
        text, unit_count = extract_text(filename, file_bytes)
    except DocumentExtractionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    return ExtractionResponse(
        filename=filename,
        unit_count=unit_count,
        character_count=len(text),
        preview=text[:TEXT_PREVIEW_LENGTH],
    )


@app.post("/materials/study-pack", response_model=StudyPack, include_in_schema=False)
async def create_study_pack(file: UploadFile = File(...), user: AuthenticatedUser = Depends(current_user)) -> StudyPack:
    """Extract a supported file and generate source-grounded study notes."""
    filename, file_bytes = await read_supported_upload(file)

    try:
        text, _ = extract_text(filename, file_bytes)
        return generate_study_pack(text)
    except DocumentExtractionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except (StudyPackGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/materials/flashcards", response_model=FlashcardSet, include_in_schema=False)
async def create_flashcards(file: UploadFile = File(...), user: AuthenticatedUser = Depends(current_user)) -> FlashcardSet:
    """Extract a supported file and create validated active-recall flashcards."""
    filename, file_bytes = await read_supported_upload(file)

    try:
        text, _ = extract_text(filename, file_bytes)
        return generate_flashcards(text)
    except DocumentExtractionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except (FlashcardGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/materials/mcqs", response_model=MCQSet, include_in_schema=False)
async def create_mcqs(file: UploadFile = File(...), user: AuthenticatedUser = Depends(current_user)) -> MCQSet:
    """Extract a supported file and create validated quiz questions."""
    filename, file_bytes = await read_supported_upload(file)

    try:
        text, _ = extract_text(filename, file_bytes)
        return generate_mcqs(text)
    except DocumentExtractionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except (MCQGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/materials/{material_id}/study-pack", response_model=StudyPack)
def create_study_pack_from_saved_material(material_id: str, user: AuthenticatedUser = Depends(current_user)) -> StudyPack:
    """Generate notes from material saved by the upload-once workflow."""
    material = load_material_or_404(user.uid, material_id)
    try:
        return generate_study_pack(material.source_text)
    except (StudyPackGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/materials/{material_id}/flashcards", response_model=FlashcardSet)
def create_flashcards_from_saved_material(material_id: str, user: AuthenticatedUser = Depends(current_user)) -> FlashcardSet:
    """Generate flashcards from material saved by the upload-once workflow."""
    material = load_material_or_404(user.uid, material_id)
    try:
        flashcards = generate_flashcards(material.source_text)
        if HOSTED:
            save_flashcards(user.uid, material.id, material.course_id, flashcards.flashcards)
        else:
            save_flashcards(material.id, material.course_id, flashcards.flashcards)
        return flashcards
    except (FlashcardGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/materials/{material_id}/mcqs", response_model=MCQSet)
def create_mcqs_from_saved_material(material_id: str, user: AuthenticatedUser = Depends(current_user)) -> MCQSet:
    """Generate MCQs from material saved by the upload-once workflow."""
    material = load_material_or_404(user.uid, material_id)
    try:
        return generate_mcqs(material.source_text)
    except (MCQGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/materials/{material_id}/practice", response_model=PracticeSet)
def create_mixed_practice(material_id: str, user: AuthenticatedUser = Depends(current_user)) -> PracticeSet:
    """Generate MCQ, keyword-recall, and theory practice from one material."""
    material = load_material_or_404(user.uid, material_id)
    try:
        return generate_practice(material.source_text)
    except (PracticeGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

@app.post("/materials/{material_id}/practice-session")
def create_practice_session(material_id: str, user: AuthenticatedUser = Depends(current_user)) -> dict:
    practice = create_mixed_practice(material_id, user)
    practice_id = str(uuid4())
    if HOSTED:
        try:
            save_practice(user.uid, practice_id, practice)
        except MaterialStorageError as error:
            raise HTTPException(status_code=503, detail=str(error)) from error
    else:
        practice_sessions[practice_id] = practice
    return {"practice_id": practice_id, "practice": practice}

@app.post("/practice-sessions/{practice_id}/submit", response_model=PracticeResult)
def submit_practice(practice_id: str, submission: PracticeSubmission, user: AuthenticatedUser = Depends(current_user)) -> PracticeResult:
    try:
        practice = get_practice(user.uid, practice_id) if HOSTED else practice_sessions.get(practice_id)
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    if practice is None: raise HTTPException(status_code=404, detail="Practice set not found.")
    return score_practice(practice, submission)


@app.post("/materials/{material_id}/quizzes", response_model=QuizForStudent, status_code=status.HTTP_201_CREATED)
def create_saved_quiz(material_id: str, user: AuthenticatedUser = Depends(current_user)) -> QuizForStudent:
    """Generate and save an MCQ quiz from a material for later quiz-taking."""
    material = load_material_or_404(user.uid, material_id)
    try:
        quiz = save_quiz(user.uid, material_id, generate_mcqs(material.source_text)) if HOSTED else save_quiz(material_id, generate_mcqs(material.source_text))
    except (MCQGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    return quiz_for_student(quiz.id, quiz.material_id, quiz.mcq_set, quiz.created_at)


@app.get("/quizzes/{quiz_id}", response_model=QuizForStudent)
def get_saved_quiz(quiz_id: str, user: AuthenticatedUser = Depends(current_user)) -> QuizForStudent:
    """Return a saved quiz without exposing its correct options."""
    quiz = load_quiz_or_404(user.uid, quiz_id)
    return quiz_for_student(quiz.id, quiz.material_id, quiz.mcq_set, quiz.created_at)


@app.post("/quizzes/{quiz_id}/attempts", response_model=QuizAttemptResult)
def submit_quiz_attempt(quiz_id: str, attempt: QuizAttemptRequest, user: AuthenticatedUser = Depends(current_user)) -> QuizAttemptResult:
    """Grade student choices using the server-side quiz answer key."""
    quiz = load_quiz_or_404(user.uid, quiz_id)
    try:
        result = score_quiz(quiz.mcq_set, attempt)
        saved_attempt = save_attempt(user.uid, quiz_id, result.model_dump_json()) if HOSTED else save_attempt(quiz_id, result.model_dump_json())
        return result.model_copy(update={"attempt_id": saved_attempt.id, "submitted_at": saved_attempt.created_at})
    except QuizScoringError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/quizzes/{quiz_id}/attempts", response_model=list[QuizAttemptResult])
def get_quiz_attempt_history(quiz_id: str, user: AuthenticatedUser = Depends(current_user)) -> list[QuizAttemptResult]:
    """Return a quiz's saved attempt history, newest first."""
    load_quiz_or_404(user.uid, quiz_id)
    try:
        return [
            QuizAttemptResult.model_validate_json(attempt.result_json).model_copy(
                update={"attempt_id": attempt.id, "submitted_at": attempt.created_at}
            )
            for attempt in (list_attempts(user.uid, quiz_id) if HOSTED else list_attempts(quiz_id))
        ]
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
