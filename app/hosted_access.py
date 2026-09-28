"""Daily usage limits for the shared hosted preview."""
from starlette.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

async def enforce_preview_limits(request, call_next):
    if request.method == "OPTIONS" or request.url.path == "/health":
        return await call_next(request)
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
            return JSONResponse({"detail": "This preview has reached its daily limit. Try again tomorrow."}, status_code=429)
    response = await call_next(request)
    response.headers["Cache-Control"] = "private, no-store"
    return response
