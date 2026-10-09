# Pricing and practice: Phase 1

## Delivered

One centralized numeric policy (`shared/plan-policy.json`) supplies the Python backend and marketing pricing page:
- Free: NGN 0, 3 packs/month, 10 questions/set (5 MCQs, 3 gaps, 2 theory prompts).
- Student: NGN 3,000, 30 packs/month, up to 30 questions/set.
- Pro: NGN 7,000, 75 packs/month, up to 60 questions/set.

`app/entitlements.py` resolves account policy and feature availability. All hosted accounts remain Free. No paid billing integration exists to preserve or activate; the frontend cannot submit an account plan. Paid buttons are disabled and launch allowances are labeled unavailable. Custom practice is implemented but disabled in hosted accounts. Exam Simulator, Study Insights, Smart Revision, adaptive recall and Ask My Material are planned, not delivered.

Custom practice has count selection, question-type combinations, balanced/MCQ-heavy/theory-heavy presets, balanced/selected-source-section/exam-style coverage, and source-batch metadata. Server validation rejects Free custom mixes, oversized requests, empty type selection and invalid source selections. Scoring checks answer lengths and uses actual objective counts. Theory criteria support self-review; no AI grading is performed.

## Generation and accounting

Practice preserves the 60,000-character material ceiling. Source regions preserve extraction order and usually line/paragraph boundaries, with bounded splits for long paragraphs. This is a first coverage improvement, not semantic topic extraction or verified page citations. A batch receives its assigned source regions, and generation instructions request content-density weighting. All selected regions are supplied across the calls. Questions are interleaved by type across batches of at most ten. Count/structure validation and a text-similarity duplicate check reject invalid output rather than retry automatically.

`source_batches` records source sections supplied to each batch; it does not prove an individual question's citation or perfect topic coverage. Extraction loses page boundaries and can miss unreadable content. No claim of complete PDF coverage is made. Fewer questions than sections may leave some concepts untested. Difficult-topic coverage awaits recorded performance evidence.

One distinct account/source lecture retains the existing one-pack accounting. Default practice retains the old cache key so existing packs remain reusable. Custom preference keys isolate saved mixes. Cached retries call no AI. Hosted reservations count each possible provider batch against the existing per-account daily and shared daily/monthly safety budgets. A six-batch set reserves six attempts before generation. Failed first generation refunds its pack; attempt reservations remain conservative because provider requests may have incurred cost. Transactions and leases preserve duplicate-request/concurrency protection. Existing UTC month-reset and data-preserving behavior remain unchanged.

Token logging records real input/output consumption per batch without storing lecture content in logs. One live AI smoke check used a synthetic lecture about active recall, spacing and interleaving: the provider returned the expected 5 MCQs, 3 gaps and 2 theory prompts, using 731 input and 1,078 output tokens. This small sample does not establish representative lecture quality, financial savings or actual cost per pack. Price/token monitoring and output quality should be evaluated before enabling paid access. Local generation keeps the existing development behavior and does not simulate hosted Firestore limits.

## Storage, deployment and configuration

No database migration or new table is required. Existing JSON practice storage/cache accepts additive metadata; defaults allow old packs to load. Docker and Cloud Build ignore rules now include the shared policy JSON.

Existing `OPENAI_API_KEY`, `OPENAI_MODEL`, Firebase configuration and generation safety settings remain necessary. Optional `LEXYCON_LOCAL_PLAN=Student` or `Pro` enables local entitlement/UI testing. Default is Free; Cloud Run ignores this switch. Restart the local backend after changing it. This setting does not represent a paid subscription.

Files changed: `.env.example`, `.gitignore`, `.dockerignore`, `.gcloudignore`, `Dockerfile`, `app/entitlements.py`, `app/generation_access.py`, `app/main.py`, `app/practice.py`, `shared/plan-policy.json`, `frontend/src/App.jsx`, `frontend/src/App.css`, `frontend/src/components/StudyResources.jsx`, `frontend/src/components/Practice.jsx`, `landing/app/pricing.tsx`, `landing/app/landing-sections.css`, `tests/test_generation_access.py`, `tests/test_practice_entitlements.py`, and this document.

## Learning exercise and next milestone

Trace a request from `GenerateResource` to `PracticeOptions.validate_plan`, then `generate_resource`, and finally `generate_practice`. Entitlements govern permission, cache keys identify reusable generated content, and attempts bound provider work. Change the local plan to Student, request 12 gap-only questions, and compare it with a balanced set. Inspect `source_batches` and logged token consumption.

Next: persist practice attempts with course/topic metadata and enforce private retrieval. Those real records are the prerequisite for trustworthy Study Insights and Smart Revision. Build the timed Exam Simulator as a separate milestone, then verified subscription activation before paid launch. Scheduling/reminders and retrieval-grounded Ask My Material follow later.

## Validation results

- Full backend regression suite after integration: 271 passed (synthetic providers).
- Frontend regression suite after integration: 30 passed, including collaborator loading-screen, real-App startup, onboarding-copy and browser-library checks.
- Dashboard production build after integration: passed.
- Landing production build and TypeScript checks after integration: passed.
- Pricing browser checks: 390, 768 and 1440 pixel viewports; no horizontal overflow, paid actions disabled, correct 10/30/60 limits.
- `git diff --check`: passed.
- Dependency audit: five high-severity entries in the existing frontend dependency tree (Firebase/Firestore, gRPC and source-map-js). No dependency versions were changed by this feature. These remain for review; no automatic or breaking dependency fix was applied.

Before the latest collaborator integration, manual browser checks used the real dashboard and API with a synthetic identity/provider: Free 10-question generation and 8/8 objective scoring, Student 12 gap-only questions and 12/12 scoring, Pro 60-question generation, disabled out-of-range/empty-section submissions, material-switch resets and 390/768/1440-pixel layouts. These checks do not verify real Firebase sign-in, hosted accounting, or real AI generation together. The isolated fixture is documented in `frontend/tests/practice-release/README.md`; it is not a production authentication bypass. After integration, the regression suites and production builds were repeated, but the manual browser exercise was not repeated.

Collaborator integration includes `b3d4a60` from the dashboard branch and `de7fb3d` plus its predecessors from main. The onboarding and loader components match main at `de7fb3d`; changes to `App.jsx` relative to that commit are limited to practice options and dynamic score totals. Live generation correctness and source fidelity still need representative lecture checks. Paid upgrades/downgrades and payment webhooks cannot be tested until billing exists. No deployment was performed.
