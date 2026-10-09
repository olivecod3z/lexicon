"""Firebase identity verification for Lexycon's hosted API."""

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
    email_verified: bool = False


def authentication_required() -> bool:
    """Keep local lessons/tests usable while requiring auth on Cloud Run."""

    return bool(os.getenv("K_SERVICE")) or os.getenv("LEXICON_REQUIRE_AUTH", "false").lower() == "true"


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
    """Verify the Firebase ID token and return only identity fields Lexycon uses.

    Signature and expiry validation do not require permission to read Firebase
    user records. Revocation checks do, so they are intentionally omitted here.
    """

    if not authentication_required():
        return AuthenticatedUser(uid="local-development", email=None, name=None, email_verified=True)

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in to continue.")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in to continue.")

    try:
        claims = _firebase_auth().verify_id_token(token)
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your sign-in could not be verified. Please sign in again.") from error

    return AuthenticatedUser(uid=claims["uid"], email=claims.get("email"), name=claims.get("name"), email_verified=claims.get("email_verified") is True)
