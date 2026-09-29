"""Firebase identity verification for Lexicon's hosted API."""

from dataclasses import dataclass
from functools import lru_cache
import os
from typing import Annotated

from fastapi import Header, HTTPException, status


@dataclass(frozen=True)
class AuthenticatedUser:
    """The small, trusted identity surface the API needs."""

    uid: str
    email: str | None
    name: str | None


def authentication_required() -> bool:
    """Keep local lessons/tests usable while requiring auth on Cloud Run."""

    return os.getenv("LEXICON_REQUIRE_AUTH", "false").lower() == "true"


@lru_cache
def _firebase_auth():
    """Initialise Firebase Admin with Cloud Run's service-account credentials."""

    import firebase_admin
    from firebase_admin import auth

    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(options={"projectId": os.getenv("GOOGLE_CLOUD_PROJECT", "lexicon-aguet-20260928")})
    return auth


def current_user(authorization: Annotated[str | None, Header()] = None) -> AuthenticatedUser:
    """Verify the Firebase ID token and return only identity fields Lexicon uses."""

    if not authentication_required():
        return AuthenticatedUser(uid="local-development", email=None, name=None)

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in to continue.")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in to continue.")

    try:
        claims = _firebase_auth().verify_id_token(token, check_revoked=True)
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your sign-in session has expired. Please sign in again.") from error

    return AuthenticatedUser(uid=claims["uid"], email=claims.get("email"), name=claims.get("name"))
