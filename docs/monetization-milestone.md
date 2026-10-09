# Packages and cost protection — 7 October 2026

## Product proposal, not a revenue guarantee

Keep the current test prices: Free at ₦0, Student at ₦3,000/month and Pro at
₦7,000/month. The published allowances (3, 30 and 75 learning packs/month) are
hypotheses until real processing costs and willingness to pay have been measured.

- Free: one course and three bounded lecture packs/month, including notes,
  flashcards and mixed practice. Let students complete the learning loop.
- Student: the main paid product, proposed support for eight courses and 30 packs
  per month, with saved work and progress across visits. Include scheduled daily
  recall sessions using due flashcards and saved practice, plus optional gentle
  reminders. Sell regular semester use.
- Pro: proposed support for 20 courses and 75 packs/month. Add adaptive recall
  sessions prioritising weak and overdue topics across courses, with flexible
  short sessions around study goals and exam dates;
  add targeted revision and source-grounded material questions only when built,
  separately metered and tested. Never advertise unfinished features as available.
- Reopening existing resources and retrying existing questions should not spend
  generation allowance. Show the remaining allowance and reset date before a limit
  becomes an unpleasant surprise. Keep saved learning accessible when limits hit.

A pack is one bounded source document's generated notes/cards/practice, not one
click. Keep per-document input limits; an uploaded textbook must not silently cost
the same as a short lecture. Define larger-document pricing before adding it.

Aim to test a 70% contribution margin (a target, not an observed result): at
₦3,000, direct delivery costs must stay below ₦900; at ₦7,000, below ₦2,100.
That allowance covers AI, payment fees and attributable storage/hosting costs.
At full advertised usage, even ₦30/Student pack or ₦28/Pro pack would consume
the entire direct-cost allowance before other costs. Measure actual model token
costs, failures and currency conversion before selling these capacities.
Contribution margin excludes salaries, marketing, tax and fixed overhead.

The existing survey analysis is small (23 respondents) and reports limited prior
payment. Do not interpret interest as conversion. Test with real paying students;
track first completed pack, repeat study visits, upgrades, delivery cost and renewal.

## Implemented in this milestone

Hosted Cloud Run only; local lessons still use their existing unmetered flow.
Everyone remains Free. No paid entitlement or payment verification is simulated.

- Authentication cannot be disabled through LEXICON_REQUIRE_AUTH on Cloud Run.
- A verified Firebase email claim is required before hosted AI generation.
  This is friction against abuse, not proof of a unique human.
- Atomic persistent one-course allocation prevents simultaneous create requests
  from creating multiple free courses. Existing courses are respected.
- Every AI route uses the account guard, including old direct-file routes and quizzes.
- Three unique source documents per account per UTC calendar month. A first
  generation reserves a pack. If it fails, the unused pack is refunded; billable
  attempt counters stay spent. Subsequent resource types share the same pack.
- Source hashes are private to each account. Renaming/re-uploading identical text
  reuses cached resources. Changed text is a different source. Successful caches
  persist across visits and months without resetting the free allowance.
- A five-minute lease blocks concurrent generation of the same source. Claims
  fence out stale workers. A crash may temporarily hold a pack reservation until
  the source is retried; do not describe crash recovery as automatic refunds.
- Per-account maximum of 12 generation attempts/day. Shared free caps default
  to 30/day and 300/month; failures count. New accounts share these caps.
- These are conservative beta **attempt caps, not dollar budgets**. With 60,000
  source characters (180,000 UTF-8 bytes) maximum, the existing generators make
  one model call per admitted request. Output is capped at 4,096 tokens, SDK
  retries are disabled, and each call has a 60-second timeout.
- Model/input/output token counts are logged without lecture text or account email.
- Cached resources remain available after shared caps are reached. Flashcards
  saved by this version use stable IDs so reopening does not reset their schedule.
- Deleting a material clears its generated cache and cancels pending cache writes,
  while retaining quota markers. Existing quiz/review deletion semantics are unchanged.
- The dashboard reports allowance, email verification and planned packages. Course
  setup asks for a single course rather than an entire degree/programme.

## Configuration and rollout

LEXYCON_FREE_DAILY_AI_ATTEMPTS and LEXYCON_FREE_MONTHLY_AI_ATTEMPTS control
the shared beta caps. Zero pauses new generation; cached resources still open.
Malformed values fail closed. An attacker can still exhaust the free pool and
deny new free generation; these limits bound AI attempts, not all infrastructure
spending or the number of human identities. Existing global preview upload and
submission limits remain in place.

Before deployment, validate real Firestore transactions and email verification
on a staging account. New collections are generated_packs, account_usage,
generation_budget and course_slots. Browser clients must NOT be able to write
these collections or courses/materials directly: this app uses the authenticated
backend for that work. Check deployed Firestore security rules rather than assuming
they are closed. Verify model quality within the new output cap using bounded tests.

Automated tests use a serializing in-memory transaction fixture, not Firestore's
emulator. They check racing requests, failures/refunds, cache reuse, month rollover,
shared budgets across accounts, invalid configuration and all generation endpoints.

These changes have not been deployed. No payment-provider account/keys have been
configured, no money has been charged, and no public paid plan has been activated.

## Next milestone

Integrate a suitable payment provider. Use authenticated checkout, server-selected
prices, verified signed webhooks, idempotent payment events, subscription expiry,
cancellation/refund handling, and server-owned entitlements. Separate paid capacity
from the free pool so free-account abuse cannot consume paying students' capacity.
Add per-plan storage and actual cost accounting before a paid public launch.

## Scheduled recall and reminders — agreed direction, implementation pending

The current Today's Recall screen and basic review intervals already exist. Keep
basic/manual review accessible on Free; do not remove an existing learning feature.
Student adds a planned daily session. Pro adds adaptive topic selection and flexible
sessions across courses. Reminder volume is not the upgrade incentive.

Proposed reminder defaults for both paid plans:
- Explicit opt-in; one chosen reminder per study day, with an optional second.
- User-selected times and timezone; quiet hours (proposed default 21:00–08:00 local).
- Send only when work is due and the planned session remains incomplete.
- Completing the day's session cancels later reminders for that day.
- Snooze, pause and disable controls; no guilt-based wording or missed-streak threats.
- At most two proactive messages per day across all channels combined.
- Link directly to the relevant short session; keep lock-screen text generic.
- Reuse saved flashcards/questions. Scheduling and reminders do not trigger fresh AI.
- Check current paid entitlement and preferences at send time; cancellation stops
  future paid reminders without removing access to previously saved materials.

Delivery channel still needs a product choice: email, web push, or both. Web push
requires permission and browser/device support; an open-tab timer is not a reliable
notification service. Production delivery needs durable scheduled jobs, duplicate
prevention, opt-out handling and cancellation when a session is completed. No
notifications were scheduled or sent by this package-definition change.
