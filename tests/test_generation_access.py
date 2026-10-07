"""Exercise quota state, failure recovery, route coverage and concurrent requests.

The in-memory transaction fixture enforces read-before-write ordering and serializes
commits, but deployment still needs a smoke test against real Firestore.
"""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from datetime import UTC, datetime
from threading import RLock
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel

from app import generation_access as access
from app import main
from app.auth import AuthenticatedUser, current_user
from app.ai_limits import client_limits, output_limits


class Result(BaseModel):
    text: str


class Database:
    def __init__(self):
        self.data = {}
        self.lock = RLock()

    def collection(self, name):
        return SimpleNamespace(document=lambda key: Reference(self, (name, key)))

    def transaction(self):
        return Transaction(self)


class Reference:
    def __init__(self, db, key):
        self.db, self.key = db, key

    def get(self, transaction=None):
        if transaction:
            assert not transaction.writes, 'Firestore does not permit reads after writes'
        value = deepcopy(self.db.data.get(self.key))
        return SimpleNamespace(to_dict=lambda: value, exists=value is not None)


class Transaction:
    def __init__(self, db):
        self.db, self.writes = db, []

    def set(self, ref, value):
        self.writes.append((ref.key, deepcopy(value)))


@pytest.fixture
def db(monkeypatch):
    database = Database()
    def transactional(function):
        def run(transaction):
            with database.lock:
                result = function(transaction)
                for key, value in transaction.writes:
                    database.data[key] = value
                return result
        return run
    monkeypatch.setattr(access, 'database', lambda: database)
    monkeypatch.setattr(access.firestore, 'transactional', transactional)
    monkeypatch.delenv('LEXYCON_FREE_DAILY_AI_ATTEMPTS', raising=False)
    monkeypatch.delenv('LEXYCON_FREE_MONTHLY_AI_ATTEMPTS', raising=False)
    return database


def generate(owner, source, kind='notes', provider=None):
    return access.generate_for_account(owner, source, kind, Result, provider or (lambda _: Result(text='Saved')))


def test_cached_resources_are_private_free_and_share_one_pack(db):
    calls = []
    provider = lambda source: (calls.append(source) or Result(text=source))
    for kind in ['notes', 'cards', 'practice']:
        generate('alice', 'lecture', kind, provider)
        generate('alice', 'lecture', kind, provider)
    assert len(calls) == 3
    assert access.usage_summary('alice')['packs_used'] == 1
    generate('bob', 'lecture', provider=provider)
    assert len(calls) == 4
    assert access.usage_summary('bob')['packs_used'] == 1


def test_fourth_pack_blocked_before_provider_and_cached_work_still_opens(db):
    for i in range(3):
        generate('alice', f'lecture {i}')
    def unexpected(_):
        pytest.fail('Over quota must not call the provider')
    with pytest.raises(access.GenerationAccessError, match='3 free'):
        generate('alice', 'fourth lecture', provider=unexpected)
    assert generate('alice', 'lecture 0', provider=unexpected).text == 'Saved'


def test_new_emails_do_not_bypass_shared_budget_and_failures_count(db, monkeypatch):
    monkeypatch.setenv('LEXYCON_FREE_DAILY_AI_ATTEMPTS', '2')
    def failed(_):
        raise ValueError('provider failed')
    with pytest.raises(ValueError):
        generate('alice', 'lecture', provider=failed)
    assert access.usage_summary('alice')['packs_used'] == 0
    generate('bob', 'lecture')
    with pytest.raises(access.GenerationAccessError, match='capacity'):
        generate('new-email', 'lecture')
    assert generate('bob', 'lecture').text == 'Saved'


def test_simultaneous_requests_cannot_claim_extra_free_packs(db):
    def reserve(index):
        try:
            access.reserve('alice', f'lecture {index}', 'notes')
            return True
        except access.GenerationAccessError:
            return False
    with ThreadPoolExecutor(max_workers=8) as pool:
        assert sum(pool.map(reserve, range(8))) == 3
    assert access.usage_summary('alice')['packs_used'] == 3


def test_duplicate_in_flight_request_and_stale_completion_are_rejected(db):
    now = datetime(2026, 10, 7, tzinfo=UTC)
    ref, old_claim, _ = access.reserve('alice', 'lecture', 'notes', now)
    with pytest.raises(access.GenerationAccessError, match='already'):
        access.reserve('alice', 'lecture', 'cards', now)
    later = datetime(2026, 10, 8, tzinfo=UTC)
    _, new_claim, _ = access.reserve('alice', 'lecture', 'notes', later)
    with pytest.raises(access.GenerationAccessError, match='superseded'):
        access.finish('alice', ref, old_claim, 'notes', Result(text='old'))
    access.finish('alice', ref, new_claim, 'notes', Result(text='new'))


def test_month_rollover_and_shared_monthly_limit(db, monkeypatch):
    monkeypatch.setenv('LEXYCON_FREE_MONTHLY_AI_ATTEMPTS', '1')
    access.reserve('alice', 'lecture', 'notes', datetime(2026, 10, 7, tzinfo=UTC))
    with pytest.raises(access.GenerationAccessError, match='capacity'):
        access.reserve('bob', 'lecture', 'notes', datetime(2026, 10, 8, tzinfo=UTC))
    access.reserve('alice', 'new lecture', 'notes', datetime(2026, 11, 1, tzinfo=UTC))
    assert access.usage_summary('alice', datetime(2026, 11, 1, tzinfo=UTC))['packs_used'] == 1


@pytest.mark.parametrize('source', ['', 'a' * 60_001, '\U0001f600' * 60_000], ids=['empty', 'too-long', 'too-many-bytes'])
def test_invalid_source_never_calls_provider(db, source):
    with pytest.raises(access.GenerationAccessError):
        generate('alice', source)
    assert not db.data


def test_kill_switch_and_invalid_configuration_fail_closed(db, monkeypatch):
    for value in ['0', 'invalid']:
        monkeypatch.setenv('LEXYCON_FREE_DAILY_AI_ATTEMPTS', value)
        with pytest.raises(access.GenerationAccessError):
            generate('alice', 'lecture')
    assert not db.data


@pytest.mark.parametrize('path', [
    '/materials/study-pack', '/materials/flashcards', '/materials/mcqs',
    '/materials/owned/study-pack', '/materials/owned/flashcards', '/materials/owned/mcqs',
    '/materials/owned/practice', '/materials/owned/practice-session', '/materials/owned/quizzes',
])
def test_every_generation_route_checks_the_account_before_ai(monkeypatch, path):
    monkeypatch.setattr(main, 'HOSTED', True)
    monkeypatch.setattr(main, 'get_material', lambda owner, key: SimpleNamespace(source_text='lecture'))
    seen = []
    def refuse(owner, source, kind, model_type, provider):
        seen.append(owner)
        raise access.GenerationAccessError('Allowance exhausted')
    monkeypatch.setattr(main, 'generate_for_account', refuse)
    main.app.dependency_overrides[current_user] = lambda: AuthenticatedUser('alice', 'a@example.com', 'A', True)
    try:
        response = TestClient(main.app).post(path, files={'file': ('lecture.txt', b'lecture notes', 'text/plain')})
        assert response.status_code == 429
        assert seen == ['alice']
    finally:
        main.app.dependency_overrides.clear()


def test_unverified_email_cannot_generate(monkeypatch):
    monkeypatch.setattr(main, 'HOSTED', True)
    with pytest.raises(access.GenerationAccessError, match='Verify your email'):
        main.generate_resource(AuthenticatedUser('alice', 'a@example.com', 'A'), 'lecture', 'notes', Result, lambda _: pytest.fail('must not call AI'))


def test_hosted_provider_has_no_hidden_retries_and_bounded_output(monkeypatch):
    monkeypatch.setenv('K_SERVICE', 'test')
    assert client_limits() == {'max_retries': 0, 'timeout': 60.0}
    assert output_limits() == {'max_output_tokens': 4096}


def test_storage_failure_blocks_generation(monkeypatch):
    monkeypatch.setattr(main, 'HOSTED', True)
    def unavailable(*args):
        raise main.MaterialStorageError('offline')
    monkeypatch.setattr(main, 'generate_for_account', unavailable)
    with pytest.raises(access.GenerationAccessError) as error:
        main.generate_resource(AuthenticatedUser('alice', None, None, True), 'lecture', 'notes', Result, lambda _: None)
    assert error.value.status_code == 503


def test_erasing_cached_content_cannot_refund_an_already_completed_pack(db):
    generate('alice', 'lecture')
    key = ('generated_packs', access.source_key('alice', 'lecture'))
    db.data[key]['resources'] = {}
    def failed(_):
        raise ValueError('failed retry')
    with pytest.raises(ValueError):
        generate('alice', 'lecture', provider=failed)
    assert access.usage_summary('alice')['packs_used'] == 1


def test_concurrent_course_creations_cannot_bypass_single_slot(db, monkeypatch):
    from app import cloud_store
    original_collection = db.collection
    def collection(name):
        result = original_collection(name)
        if name == 'courses':
            result.where = lambda field, op, owner: SimpleNamespace(limit=lambda count: SimpleNamespace(stream=lambda: [
                SimpleNamespace(to_dict=lambda value=value: value)
                for (group, _), value in list(db.data.items())
                if group == 'courses' and value.get('owner_id') == owner
            ][:count]))
        return result
    monkeypatch.setattr(db, 'collection', collection)
    monkeypatch.setattr(cloud_store, 'database', lambda: db)
    def create(index):
        try:
            cloud_store.save_course('alice', f'course {index}')
            return True
        except main.CourseLimitError:
            return False
    with ThreadPoolExecutor(max_workers=8) as pool:
        assert sum(pool.map(create, range(8))) == 1


def test_reopening_cached_flashcards_preserves_review_schedule(db, monkeypatch):
    from app import cloud_store
    monkeypatch.setattr(cloud_store, 'database', lambda: db)
    card = SimpleNamespace(card_type='basic', question='Question?', answer='Answer', topic='Topic')
    saved = cloud_store.save_flashcards('alice', 'material', 'course', [card])
    key = ('review_cards', saved[0].id)
    db.data[key]['interval_days'] = 7
    db.data[key]['due_at'] = '2027-01-01'
    cloud_store.save_flashcards('alice', 'material', 'course', [card])
    assert len(db.data) == 1
    assert db.data[key]['interval_days'] == 7
    assert db.data[key]['due_at'] == '2027-01-01'
