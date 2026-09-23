"""HTTP API for Lexicon's study-material workflow."""

from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.responses import RedirectResponse, Response
from pydantic import BaseModel

from app.document_text import DocumentExtractionError, SUPPORTED_EXTENSIONS, extract_text
from app.flashcards import FlashcardGenerationError, FlashcardSet, generate_flashcards
from app.mcqs import MCQGenerationError, MCQSet, generate_mcqs
from app.materials import (
    MaterialNotFoundError,
    MaterialStorageError,
    StoredMaterial,
    delete_material,
    get_material,
    get_quiz,
    list_attempts,
    list_materials,
    save_material,
    save_attempt,
    save_quiz,
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

    file_bytes = await file.read()
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
    )


def load_material_or_404(material_id: str) -> StoredMaterial:
    """Translate storage-layer exceptions into clear HTTP responses."""
    try:
        return get_material(material_id)
    except MaterialNotFoundError as error:
        raise HTTPException(status_code=404, detail="Material not found.") from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


def load_quiz_or_404(quiz_id: str):
    """Load a saved quiz or turn storage failures into HTTP responses."""
    try:
        return get_quiz(quiz_id)
    except MaterialNotFoundError as error:
        raise HTTPException(status_code=404, detail="Quiz not found.") from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/materials", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(file: UploadFile = File(...)) -> MaterialResponse:
    """Extract and save one material so later study features can reuse it."""
    filename, file_bytes = await read_supported_upload(file)

    try:
        source_text, unit_count = extract_text(filename, file_bytes)
        return material_response(save_material(filename, source_text, unit_count))
    except DocumentExtractionError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/materials", response_model=list[MaterialResponse])
def get_material_library() -> list[MaterialResponse]:
    """Return this local workspace's library, with lecture content excluded."""
    try:
        return [MaterialResponse(**item) for item in list_materials()]
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/materials/{material_id}", response_model=MaterialResponse)
def get_saved_material(material_id: str) -> MaterialResponse:
    """Return saved material metadata, without returning its lecture content."""
    return material_response(load_material_or_404(material_id))


@app.delete("/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_material(material_id: str) -> Response:
    """Allow a student to remove locally stored extracted material."""
    try:
        delete_material(material_id)
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
async def extract_material(file: UploadFile = File(...)) -> ExtractionResponse:
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
async def create_study_pack(file: UploadFile = File(...)) -> StudyPack:
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
async def create_flashcards(file: UploadFile = File(...)) -> FlashcardSet:
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
async def create_mcqs(file: UploadFile = File(...)) -> MCQSet:
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
def create_study_pack_from_saved_material(material_id: str) -> StudyPack:
    """Generate notes from material saved by the upload-once workflow."""
    material = load_material_or_404(material_id)
    try:
        return generate_study_pack(material.source_text)
    except (StudyPackGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/materials/{material_id}/flashcards", response_model=FlashcardSet)
def create_flashcards_from_saved_material(material_id: str) -> FlashcardSet:
    """Generate flashcards from material saved by the upload-once workflow."""
    material = load_material_or_404(material_id)
    try:
        return generate_flashcards(material.source_text)
    except (FlashcardGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/materials/{material_id}/mcqs", response_model=MCQSet)
def create_mcqs_from_saved_material(material_id: str) -> MCQSet:
    """Generate MCQs from material saved by the upload-once workflow."""
    material = load_material_or_404(material_id)
    try:
        return generate_mcqs(material.source_text)
    except (MCQGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/materials/{material_id}/practice", response_model=PracticeSet)
def create_mixed_practice(material_id: str) -> PracticeSet:
    """Generate MCQ, keyword-recall, and theory practice from one material."""
    material = load_material_or_404(material_id)
    try:
        return generate_practice(material.source_text)
    except (PracticeGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

@app.post("/materials/{material_id}/practice-session")
def create_practice_session(material_id: str) -> dict:
    practice = create_mixed_practice(material_id)
    practice_id = str(uuid4())
    practice_sessions[practice_id] = practice
    return {"practice_id": practice_id, "practice": practice}

@app.post("/practice-sessions/{practice_id}/submit", response_model=PracticeResult)
def submit_practice(practice_id: str, submission: PracticeSubmission) -> PracticeResult:
    practice = practice_sessions.get(practice_id)
    if practice is None: raise HTTPException(status_code=404, detail="Practice set not found.")
    return score_practice(practice, submission)


@app.post("/materials/{material_id}/quizzes", response_model=QuizForStudent, status_code=status.HTTP_201_CREATED)
def create_saved_quiz(material_id: str) -> QuizForStudent:
    """Generate and save an MCQ quiz from a material for later quiz-taking."""
    material = load_material_or_404(material_id)
    try:
        quiz = save_quiz(material_id, generate_mcqs(material.source_text))
    except (MCQGenerationError, TextChunkingError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    return quiz_for_student(quiz.id, quiz.material_id, quiz.mcq_set, quiz.created_at)


@app.get("/quizzes/{quiz_id}", response_model=QuizForStudent)
def get_saved_quiz(quiz_id: str) -> QuizForStudent:
    """Return a saved quiz without exposing its correct options."""
    quiz = load_quiz_or_404(quiz_id)
    return quiz_for_student(quiz.id, quiz.material_id, quiz.mcq_set, quiz.created_at)


@app.post("/quizzes/{quiz_id}/attempts", response_model=QuizAttemptResult)
def submit_quiz_attempt(quiz_id: str, attempt: QuizAttemptRequest) -> QuizAttemptResult:
    """Grade student choices using the server-side quiz answer key."""
    quiz = load_quiz_or_404(quiz_id)
    try:
        result = score_quiz(quiz.mcq_set, attempt)
        saved_attempt = save_attempt(quiz_id, result.model_dump_json())
        return result.model_copy(update={"attempt_id": saved_attempt.id, "submitted_at": saved_attempt.created_at})
    except QuizScoringError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/quizzes/{quiz_id}/attempts", response_model=list[QuizAttemptResult])
def get_quiz_attempt_history(quiz_id: str) -> list[QuizAttemptResult]:
    """Return a quiz's saved attempt history, newest first."""
    load_quiz_or_404(quiz_id)
    try:
        return [
            QuizAttemptResult.model_validate_json(attempt.result_json).model_copy(
                update={"attempt_id": attempt.id, "submitted_at": attempt.created_at}
            )
            for attempt in list_attempts(quiz_id)
        ]
    except MaterialStorageError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
