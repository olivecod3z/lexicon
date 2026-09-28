"""Access gate for the initial single-owner cloud preview."""
import os
import secrets
from starlette.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

async def require_preview_access(request, call_next):
    if request.method == "OPTIONS" or request.url.path == "/health":
        return await call_next(request)
    expected = os.getenv("LEXICON_ACCESS_KEY", "")
    if not expected:
        return JSONResponse({"detail": "Private preview access is not configured."}, status_code=503)
    supplied = request.headers.get("X-Lexicon-Access", "")
    if not secrets.compare_digest(supplied.encode(), expected.encode()):
        return JSONResponse({"detail": "Enter your private preview access code."}, status_code=401)
    if request.method == "POST":
        from app.cloud_store import reserve_request
        from app.materials import MaterialStorageError
        path = request.url.path
        kind = "uploads" if path in ("/materials", "/materials/extract") else "generation"
        if path.endswith(("/submit", "/attempts")):
            kind = "submissions"
        limit = {"uploads": 20, "generation": 30, "submissions": 100}[kind]
        try:
            allowed = await run_in_threadpool(reserve_request, kind, limit)
        except MaterialStorageError:
            return JSONResponse({"detail": "Usage checking is unavailable. Please retry later."}, status_code=503)
        if not allowed:
            return JSONResponse({"detail": "This private preview has reached its daily limit. Try again tomorrow."}, status_code=429)
    response = await call_next(request)
    response.headers["Cache-Control"] = "private, no-store"
    return response
