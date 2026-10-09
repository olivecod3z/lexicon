"""Account-owned onboarding preferences, separate from course allocation."""
import json
import os
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from app.materials import _database_connection


class StudyProfile(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra='forbid')
    name: str = Field(min_length=1, max_length=40)
    institution: str = Field(default='', max_length=100)
    stage: Literal['University', 'Secondary school', 'Postgraduate', 'Independent learning']
    level: Literal['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', '600 Level', 'Postgraduate', 'Other']
    goals: list[Literal['understand', 'remember', 'exams', 'routine']] = Field(min_length=1, max_length=4)
    minutes: Literal[10, 20, 30]


def read_profile(owner_id):
    if os.getenv('K_SERVICE'):
        from app.cloud_store import database
        from app.generation_access import account_key
        return database().collection('study_profiles').document(account_key(owner_id)).get().to_dict()
    with _database_connection() as connection:
        connection.execute('CREATE TABLE IF NOT EXISTS study_profiles (owner_id TEXT PRIMARY KEY, profile TEXT NOT NULL)')
        row = connection.execute('SELECT profile FROM study_profiles WHERE owner_id = ?', (owner_id,)).fetchone()
        return json.loads(row[0]) if row else None


def write_profile(owner_id, profile):
    value = {**profile.model_dump(), 'onboarding_complete': True}
    if os.getenv('K_SERVICE'):
        from app.cloud_store import database
        from app.generation_access import account_key
        database().collection('study_profiles').document(account_key(owner_id)).set(value)
    else:
        with _database_connection() as connection:
            connection.execute('CREATE TABLE IF NOT EXISTS study_profiles (owner_id TEXT PRIMARY KEY, profile TEXT NOT NULL)')
            connection.execute('INSERT OR REPLACE INTO study_profiles VALUES (?, ?)', (owner_id, json.dumps(value)))
    return value
