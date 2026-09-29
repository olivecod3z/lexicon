from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app import auth


def test_local_development_has_a_safe_placeholder_identity(monkeypatch) -> None:
    monkeypatch.delenv("LEXICON_REQUIRE_AUTH", raising=False)

    user = auth.current_user()

    assert user.uid == "local-development"


def test_hosted_auth_accepts_a_verified_firebase_token(monkeypatch) -> None:
    monkeypatch.setenv("LEXICON_REQUIRE_AUTH", "true")
    monkeypatch.setattr(auth, "_firebase_auth", lambda: SimpleNamespace(verify_id_token=lambda token, check_revoked: {"uid": "student-1", "email": "student@example.com", "name": "Student"}))

    user = auth.current_user("Bearer verified-token")

    assert user.uid == "student-1"
    assert user.email == "student@example.com"


def test_hosted_auth_rejects_missing_or_invalid_tokens(monkeypatch) -> None:
    monkeypatch.setenv("LEXICON_REQUIRE_AUTH", "true")
    monkeypatch.setattr(auth, "_firebase_auth", lambda: SimpleNamespace(verify_id_token=lambda token, check_revoked: (_ for _ in ()).throw(ValueError("bad token"))))

    with pytest.raises(HTTPException, match="Sign in"):
        auth.current_user()
    with pytest.raises(HTTPException, match="expired"):
        auth.current_user("Bearer invalid-token")
