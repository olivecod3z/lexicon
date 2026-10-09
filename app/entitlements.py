"""Plan policy. Paid activation awaits verified billing; clients cannot choose a plan."""
import os
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class Plan:
    name: str
    monthly_price: int
    packs_per_month: int
    practice_questions: int
    custom_practice: bool


import json
from pathlib import Path

_policy = json.loads((Path(__file__).resolve().parents[1] / "shared" / "plan-policy.json").read_text(encoding="utf-8"))
PLANS = {name: Plan(name=name, **values) for name, values in _policy.items()}
FEATURE_STATUS = {
    "custom_practice": "implemented_disabled",
    "exam_simulator": "planned",
    "study_insights": "planned",
    "smart_revision": "planned",
    "adaptive_revision": "planned",
    "ask_my_material": "planned",
}


def account_plan():
    # A local-only switch lets developers test paid policy without enabling sales.
    # Hosted accounts stay Free until a verified subscription resolver is added.
    name = "Free" if os.getenv("K_SERVICE") else os.getenv("LEXYCON_LOCAL_PLAN", "Free")
    if name not in PLANS:
        raise ValueError("LEXYCON_LOCAL_PLAN must be Free, Student, or Pro.")
    return PLANS[name]


def public_entitlements():
    return {**asdict(account_plan()), "features": FEATURE_STATUS,
            "subscriptions_available": False}
