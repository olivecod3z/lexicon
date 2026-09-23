from pathlib import Path

import pytest

from app.materials import MaterialNotFoundError, delete_material, get_material, save_material


TEST_DATABASE_PATH = Path(__file__).parent / ".materials-test.db"


def test_saved_material_can_be_loaded_and_deleted(monkeypatch) -> None:
    TEST_DATABASE_PATH.unlink(missing_ok=True)
    monkeypatch.setattr("app.materials.DATABASE_PATH", TEST_DATABASE_PATH)

    saved = save_material("lecture.txt", "Cell biology notes", unit_count=1)
    loaded = get_material(saved.id)

    assert loaded == saved

    delete_material(saved.id)
    with pytest.raises(MaterialNotFoundError):
        get_material(saved.id)

    TEST_DATABASE_PATH.unlink(missing_ok=True)
