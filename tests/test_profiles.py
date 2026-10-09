import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.auth import current_user, AuthenticatedUser


@pytest.fixture
def profile_client(tmp_path, monkeypatch):
    monkeypatch.delenv('K_SERVICE', raising=False)
    monkeypatch.setattr('app.materials.DATABASE_PATH', tmp_path / 'profiles.db')
    app.dependency_overrides[current_user] = lambda: AuthenticatedUser('alice', None, None)
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_profile_roundtrip_and_account_isolation(profile_client):
    client = profile_client
    assert client.get('/account/profile').json() == {'profile': None}
    value = dict(name=' Olive ', institution='Uni', stage='University', level='200 Level', goals=['remember'], minutes=20)
    response = client.post('/account/profile', json=value)
    assert response.status_code == 200
    assert response.json()['profile']['name'] == 'Olive'
    assert client.get('/account/profile').json()['profile']['onboarding_complete'] is True
    app.dependency_overrides[current_user] = lambda: AuthenticatedUser('bob', None, None)
    assert client.get('/account/profile').json() == {'profile': None}


@pytest.mark.parametrize('change', [{'name': ' '}, {'level': ''}, {'goals': []}, {'minutes': 99}, {'owner_id': 'bob'}])
def test_invalid_profiles_never_mark_onboarding_complete(profile_client, change):
    value = dict(name='Olive', institution='', stage='University', level='200 Level', goals=['remember'], minutes=20)
    assert profile_client.post('/account/profile', json={**value, **change}).status_code == 422
    assert profile_client.get('/account/profile').json() == {'profile': None}
