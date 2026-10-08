"""Hosted free-plan reservations and private, reusable generated resources.

Firestore transactions serialize concurrent reservations across Cloud Run instances.
Counts are attempts, not a claim about exact money spent. Paid billing is not enabled.
"""

import hashlib
import os
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from google.cloud import firestore

from app.cloud_store import database, guarded
from app.entitlements import account_plan

FREE_PACKS_PER_MONTH = 3  # Compatibility; active policy is centralized in entitlements.
MAX_SOURCE_CHARACTERS = 60_000
MAX_SOURCE_BYTES = 180_000
LEASE_SECONDS = 420


class GenerationAccessError(RuntimeError):
    def __init__(self, message, status_code=429):
        super().__init__(message)
        self.status_code = status_code


def source_key(owner_id, source):
    # Cache stays private to the account and survives filename changes/re-uploads.
    return hashlib.sha256((owner_id + "\0" + source).encode("utf-8")).hexdigest()


def account_key(owner_id):
    return hashlib.sha256(owner_id.encode("utf-8")).hexdigest()


def counter_limit(name, default):
    # Invalid configuration fails closed; zero is a deliberate generation kill switch.
    try:
        return max(0, int(os.getenv(name, str(default))))
    except ValueError as error:
        raise GenerationAccessError("New study resources are temporarily unavailable. Your saved work is still available.", 503) from error


def reservation_changes(pack, account, daily, shared_daily, shared_monthly, kind, now, claim):
    """Pure policy: validate every limit before proposing any writes."""
    cached = pack.get("resources", {}).get(kind)
    if cached is not None:
        return cached, None
    if pack.get("lease_until", 0) > now.timestamp():
        raise GenerationAccessError("This lecture is already being prepared. Please try again shortly.", 409)
    if not pack.get("charged") and account.get("packs", 0) >= account_plan().packs_per_month:
        raise GenerationAccessError("You've used your 3 free learning packs this month. Keep studying your saved resources; new packs become available next month.")
    # Custom practice can make several provider calls; reserve all billable batches.
    attempt_count = (int(kind.split("-")[2]) + 9) // 10 if kind.startswith("practice-v2-") else 1
    limits = [
        (daily, 12, "You've reached today's generation limit. Keep studying your saved resources and try new generation tomorrow."),
        (shared_daily, counter_limit("LEXYCON_FREE_DAILY_AI_ATTEMPTS", 30), "Today's free generation capacity is full. Your saved resources are still available. Please try again tomorrow."),
        (shared_monthly, counter_limit("LEXYCON_FREE_MONTHLY_AI_ATTEMPTS", 300), "Free generation capacity is temporarily full. You can still study your saved resources."),
    ]
    for counter, limit, message in limits:
        if counter.get("attempts", 0) + attempt_count > limit:
            raise GenerationAccessError(message)
    is_new = not pack.get("charged")
    updated_pack = {**pack, "charged": True, "claim": claim,
                    "lease_until": now.timestamp() + LEASE_SECONDS,
                    "month": pack.get("month") if not is_new else now.strftime("%Y-%m")}
    changes = [updated_pack, {**account, "packs": account.get("packs", 0) + int(is_new)}]
    changes.extend({"attempts": counter.get("attempts", 0) + attempt_count} for counter, _, _ in limits)
    return None, changes


@guarded
def reserve(owner_id, source, kind, now=None):
    now = now or datetime.now(UTC)
    month, day = now.strftime("%Y-%m"), now.date().isoformat()
    db = database()
    refs = [db.collection("generated_packs").document(source_key(owner_id, source)),
            db.collection("account_usage").document(account_key(owner_id) + "-" + month),
            db.collection("account_usage").document(account_key(owner_id) + "-" + day),
            db.collection("generation_budget").document(day),
            db.collection("generation_budget").document(month)]
    claim = str(uuid4())

    @firestore.transactional
    def run(transaction):
        values = [ref.get(transaction=transaction).to_dict() or {} for ref in refs]
        cached, changes = reservation_changes(*values, kind, now, claim)
        if changes is not None:
            for ref, value in zip(refs, changes):
                transaction.set(ref, value)
        return cached

    return refs[0], claim, run(db.transaction())


@guarded
def finish(owner_id, reference, claim, kind, result=None):
    """Release a lease; refund a new pack on failure, but retain attempt counters."""
    db = database()

    @firestore.transactional
    def run(transaction):
        pack = reference.get(transaction=transaction).to_dict() or {}
        if pack.get("claim") != claim:
            raise GenerationAccessError("This generation was superseded. Please reopen the lecture.", 409)
        if result is None and not pack.get("completed"):
            usage_ref = db.collection("account_usage").document(account_key(owner_id) + "-" + pack["month"])
            usage = usage_ref.get(transaction=transaction).to_dict() or {}
            transaction.set(usage_ref, {**usage, "packs": max(0, usage.get("packs", 0) - 1)})
            pack["charged"] = False
        if result is not None:
            pack["completed"] = True
            pack["resources"] = {**pack.get("resources", {}), kind: result.model_dump_json()}
        pack.update(claim=None, lease_until=0)
        transaction.set(reference, pack)

    run(db.transaction())


def generate_for_account(owner_id, source, kind, model_type, generate):
    if not source.strip() or len(source) > MAX_SOURCE_CHARACTERS or len(source.encode("utf-8")) > MAX_SOURCE_BYTES:
        raise GenerationAccessError("Choose a lecture with 1–60,000 readable characters. Split longer materials into smaller files.", 422)
    reference, claim, cached = reserve(owner_id, source, kind)
    if cached is not None:
        return model_type.model_validate_json(cached)
    try:
        result = generate(source)
    except Exception:
        finish(owner_id, reference, claim, kind)
        raise
    finish(owner_id, reference, claim, kind, result)
    return result


@guarded
def usage_summary(owner_id, now=None):
    now = now or datetime.now(UTC)
    month = now.strftime("%Y-%m")
    usage = database().collection("account_usage").document(account_key(owner_id) + "-" + month).get().to_dict() or {}
    next_month = (now.replace(day=28) + timedelta(days=4)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return {"plan": account_plan().name, "packs_used": usage.get("packs", 0), "packs_limit": account_plan().packs_per_month,
            "resets_at": next_month.isoformat(), "subscriptions_available": False}
