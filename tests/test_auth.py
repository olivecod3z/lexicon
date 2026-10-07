from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app import auth


def test_cloud_run_always_requires_auth(monkeypatch):
    monkeypatch.setenv("K_SERVICE", "lexycon-api")
    monkeypatch.setenv("LEXICON_REQUIRE_AUTH", "false")
    with pytest.raises(HTTPException):
        auth.current_user()


def test_local_development_has_a_safe_placeholder_identity(monkeypatch) -> None:
    monkeypatch.delenv("LEXICON_REQUIRE_AUTH", raising=False)

    user = auth.current_user()

    assert user.uid == "local-development"


def test_hosted_auth_accepts_a_verified_firebase_token(monkeypatch) -> None:
    monkeypatch.setenv("LEXICON_REQUIRE_AUTH", "true")
    verification_calls = []

    def verify_id_token(token):
        verification_calls.append(token)
        return {"uid": "student-1", "email": "student@example.com", "name": "Student"}

    monkeypatch.setattr(auth, "_firebase_auth", lambda: SimpleNamespace(verify_id_token=verify_id_token))

    user = auth.current_user("Bearer verified-token")

    assert user.uid == "student-1"
    assert user.email == "student@example.com"
    assert verification_calls == ["verified-token"]


def test_hosted_auth_rejects_missing_or_invalid_tokens(monkeypatch) -> None:
    monkeypatch.setenv("LEXICON_REQUIRE_AUTH", "true")
    monkeypatch.setattr(auth, "_firebase_auth", lambda: SimpleNamespace(verify_id_token=lambda token: (_ for _ in ()).throw(ValueError("bad token"))))

    with pytest.raises(HTTPException, match="Sign in"):
        auth.current_user()
    with pytest.raises(HTTPException, match="could not be verified"):
        auth.current_user("Bearer invalid-token")
