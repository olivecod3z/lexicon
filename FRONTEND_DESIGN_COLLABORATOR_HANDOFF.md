# Lexycon Frontend, UI/UX and Motion Handoff

**Prepared:** 7 October 2026
**Audience:** Lexycon design/frontend collaborator and their Codex
**Scope:** Dashboard and landing-page presentation, frontend integration, responsive behaviour, content, animation and micro-interactions

## 1. Role and boundary

Your job is to raise the quality of the Lexycon experience: make the dashboard feel calm, polished, responsive and alive; integrate approved frontend states; create purposeful motion; and keep landing-page content accurate.

Work inside:

- `frontend/` — React/Vite dashboard.
- `landing/` — Next.js landing page and onboarding.
- `shared/design-system.css` — shared visual tokens.
- `DESIGN_SYSTEM.md` — the product's design source of truth.

Do not implement or modify:

- Payment-provider APIs, checkout verification or webhooks.
- Subscription, quota or entitlement business logic.
- Firestore ownership/security rules.
- AI prompts, model calls, token accounting or generation rules.
- Email/push delivery services or background schedulers.
- Cloud Run, Firebase Hosting or DNS configuration.

Frontend work may consume existing API responses and may prepare truthful loading, empty, locked, success and error states for APIs still being built. Do not fake a successful payment, active subscription, generated resource, reminder delivery or saved result. If an API is unavailable, use an explicitly labelled design preview or disabled state.

## 2. Product and visual direction

Lexycon turns course material into a repeatable study loop:

**Upload → Learn → Test → Improve**

It should feel:

- Calm in the workspace.
- Focused during notes and flashcards.
- More energetic during quizzes.
- Rewarding after meaningful progress.
- Serious enough for long university study sessions.

It should not resemble a loud children's game, a generic AI dashboard or an over-animated portfolio. Use the approved forest green, lime, off-white and blue-gray system. Use Manrope for headings, DM Sans for interface text and MingCute for interface icons. Reuse semantic tokens and existing components before creating new patterns.

Read these before beginning major UI work:

1. `AGENTS.md`
2. `Lexycon_Codex_Project_Brief.md`
3. `DESIGN_SYSTEM.md`
4. This handoff

## 3. Current product state and recent changes

### Brand, domains and structure

- The visible product brand is **Lexycon**.
- The landing page is intended for `https://lexycon.site`.
- The dashboard is intended for `https://dashboard.lexycon.site`.
- Old infrastructure identifiers may still contain `lexicon`; do not rename Firebase IDs, API URLs or storage keys as a visual cleanup.
- The landing page and dashboard are separate frontend builds.

### Account experience

- Email/password sign-up and sign-in exist.
- Google sign-in exists.
- Password visibility has an eye toggle with an accessible label.
- Password reset exists.
- Hosted API requests include the Firebase identity token.
- An email-verification state has been added locally before hosted AI generation.
- The dashboard now represents a private study workspace rather than an anonymous shared preview.

### Course setup

- The first dashboard screen creates one Free-plan course workspace.
- Course name, optional course code, colour and level are supported.
- The level list includes 100–600 Level, Postgraduate and Other.
- Dashboard copy now asks for one university course rather than a whole degree/programme.
- The onboarding flow still contains some older “degree, programme or course” wording and must be aligned.

### Materials and study tools

- Students can upload PDF, DOCX, PPTX and TXT files, despite some buttons still saying only “Upload PDF.”
- Uploaded materials appear in a saved material library.
- A material can produce structured notes, flashcards and mixed practice.
- Mixed practice contains MCQs, fill-in-the-gap prompts and theory prompts for self-review.
- Flashcards support Again, Hard and Got it ratings.
- Due flashcards appear in Today's Recall.
- Basic recall intervals and a current streak count exist.
- Practice results currently show within the active dashboard visit; full persistent analytics are unfinished.

### Allowances and plan visibility

The following work exists locally and awaits production deployment/verification:

- A dashboard allowance card showing the current plan, packs used/remaining and reset date.
- A clear explanation that reopening saved resources does not consume another pack.
- Email-verification prompts and actions.
- Server-backed Free-plan allowances and cached generated resources.

Treat these as real frontend integrations once their endpoints are available. Preserve graceful unavailable/loading states because deployment may temporarily lag behind the frontend.

### Landing-page package content

Current test packages are:

#### Free — ₦0/month

- One course.
- 3 learning packs per month.
- Basic notes, flashcards and multiple-choice questions.
- One balanced practice set per pack: 5 MCQs, 3 fill-in-the-gap questions and 2 theory prompts.
- Unlimited retries on already-generated practice.
- Limited saved-material and quiz history.
- Ask My Material is not included at launch.

#### Student — ₦3,000/month

- Proposed maximum of 8 courses.
- 30 learning packs per month.
- Saved materials and learning history.
- Custom practice mixes up to 10 prompts.
- Balanced, theory-heavy and MCQ revision presets.
- Planned scheduled daily recall using due flashcards and saved practice.
- Planned optional email and push reminders at chosen times, with quiet hours and snooze.
- Planned flashcard controls, basic weak-topic feedback, Exam Mode and up to 50 Ask My Material questions monthly.

#### Pro — ₦7,000/month

- Proposed maximum of 20 courses.
- 75 learning packs per month.
- Everything in Student with higher allowances.
- Custom practice sets up to 20 prompts.
- Planned adaptive recall prioritising weak and overdue topics across courses.
- Planned flexible short sessions around study goals and exam dates.
- Planned email and push reminders with quiet hours, snooze and pause.
- Planned larger-material support, advanced weak-topic analytics, targeted practice, higher storage, saved templates and up to 100 Ask My Material questions monthly.

These are test packages. Keep unbuilt features under **Planned additions**. Do not change “subscriptions aren't open yet” until billing has been implemented and approved.

## 4. Priority 0 — establish UI quality foundations

### 4.1 Audit and align the interface

- Audit dashboard and landing components against `DESIGN_SYSTEM.md`.
- Replace one-off colours, spacing, radii and transitions with semantic tokens.
- Make icon size, stroke weight and alignment consistent.
- Ensure the sidebar, top bar, cards, form controls and study surfaces feel like one system.
- Remove visual remnants of the earlier purple dashboard styling.
- Correct visible `Lexicon` spelling while preserving infrastructure identifiers.
- Replace inaccurate “Upload PDF” labels with “Upload material” where DOCX, PPTX and TXT are accepted.
- Align onboarding labels with the one-course product rule.
- Remove or revise stale statements saying automated study tools are unavailable after the live deployment is confirmed.

### 4.2 Create reusable frontend state patterns

Create simple, focused patterns rather than a large component framework:

- `Skeleton` for predictable loading layouts.
- Inline button loader that preserves button width.
- `ProcessingStatus` for longer document/AI operations.
- Toast/status message for short confirmations.
- Empty state with explanation and next action.
- Recoverable error state with Retry.
- Locked-feature state with plan explanation and upgrade action.
- Accessible dialog/drawer for confirmation or plan information.

Every asynchronous surface must have loading, success, empty and failure behaviour. Keep typed answers and selections intact when a retry is possible.

## 5. Priority 1 — elevate the core dashboard loop

### 5.1 Dashboard shell and overview

- Refine desktop, tablet and mobile layout without replacing the current information hierarchy.
- Make the current course clear in the top bar.
- Improve mobile navigation, scrim, focus management and touch targets.
- Give the page-heading transition a restrained fade/translate when navigating sections.
- Keep Upload, Continue Studying, study tools and recent materials prominent.
- Add a useful visual state when no course exists, no material exists or a course has material but no generated resources.
- Avoid decorative charts, invented counts and sample achievements in the signed-in product.

### 5.2 Upload experience

- Make the upload card react to drag enter, drag leave, valid drop and invalid drop.
- Show the selected filename, format and human-readable size before/while uploading.
- Distinguish upload from processing. Suggested honest stages:
  1. Uploading material
  2. Reading document
  3. Organising topics
  4. Building the selected study resource
  5. Ready
- Do not show fake percentages when the server does not provide progress.
- Animate status changes with opacity/transform and keep status text available to screen readers.
- Show a clear cancel action only if cancellation is technically supported.
- Add polished unsupported-file, empty-file, oversize-file, offline and processing-failure states.
- On completion, reveal the material row and primary next action without a blocking celebration.

### 5.3 Material library

- Add skeleton rows while the library loads.
- Refine hover, keyboard-focus and pressed states on each material row.
- Make metadata readable and consistent: filename, upload date, resource readiness and course.
- Add a compact contextual action menu only for actions that actually work.
- Make long filenames truncate visually while remaining available to assistive technology/tooltips.
- Add a gentle enter animation for a newly uploaded material; do not replay it on every render.
- Design deletion confirmation and post-deletion empty states without changing deletion logic.

### 5.4 AI generation states

- Replace generic “Creating…” messages with the shared `ProcessingStatus` pattern.
- Provide distinct visual states for notes, flashcards and practice.
- Explain that generation may take a moment without promising exact duration.
- Disable duplicate actions while generation is in flight.
- When a cached result is returned quickly, avoid forcing the full processing animation.
- Show allowance errors as useful plan messages, with saved-study actions still available.
- Give successful generation a brief check/reveal transition and move focus to the result heading.
- Never use a looping fake progress bar for an unknown-duration model request.

### 5.5 Notes experience

- Strengthen hierarchy for title, overview, learning objectives, sections and key points.
- Use a comfortable reading width and spacing suitable for long sessions.
- Add a compact sticky section navigator only if the document has enough sections to justify it.
- Use subtle section entry transitions; never animate every paragraph.
- Prepare a future source-reference pattern without pretending sources are already mapped.
- Provide print/export controls only after those actions work.

### 5.6 Flashcards

- Add a mature, accessible flip/reveal interaction.
- Support mouse, touch and keyboard (`Space`/`Enter` to reveal; arrow keys only if they do not interfere with scrolling).
- Show current card position and session progress.
- Animate progress width smoothly.
- Keep the answer immediately available when reduced motion is enabled.
- Add clear Again, Hard and Got it pressed/loading feedback.
- On rating, transition to the next card without delaying the saved action.
- Preserve focus sensibly between cards.
- Add a brief, restrained completion state when the session is done.

### 5.7 Practice and quiz experience

- Make the current question, answer selection and progress more prominent.
- Add subtle selection feedback and accessible focus rings.
- Provide correct/incorrect feedback with icon, text and colour—not colour alone.
- Transition between questions without large page movement.
- Add an answer-review state that explains mistakes.
- Turn results into actions: Review missed, Retry, Return to flashcards and Continue studying.
- Keep theory prompts labelled as self-review until automatic theory feedback is implemented.
- Prepare visual variants for balanced, theory-heavy and MCQ presets, but show only available choices as active.

## 6. Priority 1 — scheduled recall experience

Basic Today's Recall exists. Redesign it into a coherent session while preserving its working API behaviour.

### Student-plan UI

- A daily session card showing number of due items and an estimated short duration only when it can be calculated honestly.
- Start, resume and completed states.
- Due flashcards and saved practice grouped into one guided flow when the backend supports it.
- A gentle completion view with the next due date.
- A reminder-settings entry point.

### Pro-plan UI

- A clear explanation of why items were selected: weak topic, overdue, frequently missed or upcoming exam.
- Cross-course session summary.
- Session-length choices such as Quick, Standard and Deep only after supported by the API.
- Upcoming exam/study-goal controls as planned/disabled previews until persistence exists.
- Topic-priority chips that are informative and accessible, not decorative labels.

### Recall motion

- Smooth progress changes.
- Tactile card reveal.
- Fast card replacement after rating.
- Brief completion mark with no full-screen confetti.
- No guilt animation or punishing loss-of-streak treatment.

## 7. Priority 1 — pricing, upgrades and payment-page frontend

The billing backend does not exist yet. Build the frontend so it can later consume server-owned plan and checkout data.

- Add a Subscription/Billing destination in the dashboard's secondary navigation.
- Create a plan overview showing current plan, usage, reset/renewal date and available upgrades.
- Reuse the exact approved plan copy in section 3.
- Distinguish **Available now** from **Planned addition**.
- Create responsive plan cards with a clear Student recommendation, without deceptive urgency.
- Add an upgrade dialog shown when a real entitlement limit is returned by the API.
- Allow the user to close the dialog and continue using saved work.
- Prepare checkout loading, redirecting, success, failure, cancelled and pending-confirmation screens.
- Never mark a plan active based only on a query string or frontend click.
- Do not collect raw card information in Lexycon components; the future provider owns sensitive payment entry.
- Create disabled “Subscriptions opening soon” actions until the payment backend is available.
- Design subscription-management states: active, renewal due, payment failed/grace period, cancelled-at-period-end and expired.
- Design downgrade messaging that explains retained saved materials and reduced future allowances.

## 8. Priority 2 — email and push notification preferences

Student and Pro will support both email and browser/phone push. The frontend task is preferences and permission UX; delivery remains backend work.

- Create a notification-preferences page.
- Separate Email and Push toggles.
- Explain push permission before triggering the browser permission prompt.
- Show unsupported-browser and permission-denied guidance.
- Let users choose one daily reminder by default and optionally add a second.
- Add study-day selection.
- Add timezone display/editing.
- Add quiet hours, proposed default 9 p.m.–8 a.m. local time.
- Add Snooze, Pause reminders and Disable controls.
- Explain the shared maximum of two proactive reminders per day across both channels.
- Show “only when study is due” and “stop after today's session is complete.”
- Add a device list when device-token data becomes available.
- Do not claim a reminder was scheduled until the API confirms it.
- Use generic lock-screen preview copy to protect study privacy.

Suggested tone:

- “You have 8 cards ready for a quick review.”
- “A short recall session is ready when you are.”
- “Reminder paused until Monday.”

Avoid guilt, alarm language, excessive exclamation marks and streak-loss threats.

## 9. Priority 2 — progress and weak-topic presentation

- Replace current-visit-only framing once persistent history is available.
- Design useful topic rows showing current strength, recent direction and next action.
- Make “Practice this topic” the primary action from a weak-topic view.
- Add results history with useful filters, avoiding dense analytics dashboards.
- Design charts only when the underlying data exists and the chart answers a student question.
- Provide accessible text equivalents for every chart.
- Do not invent mastery percentages, course totals, activity or streaks.

## 10. Landing-page work

### Content updates

- Keep Free, Student and Pro pricing aligned with section 3 and `landing/app/pricing.tsx`.
- Add the proposed course allowances once approved for public display: Free 1, Student 8, Pro 20.
- Explain a learning pack in one concise line: one bounded lecture plus its generated notes, flashcards and standard practice.
- Include scheduled recall and gentle email/push reminders under Student planned additions.
- Include adaptive weak/overdue-topic recall and flexible exam-oriented sessions under Pro planned additions.
- Keep unfinished features visibly labelled Planned.
- Keep subscriptions labelled unavailable until checkout and verified billing are live.
- Update dashboard links to `https://dashboard.lexycon.site/`.
- Review all landing copy for old brand spelling and stale availability statements.
- Do not promise grades, guaranteed memory improvement, unlimited AI or priority processing.

### Landing interactions and animation

- Audit existing hero, step and dashboard-preview animations for repetition and CPU cost.
- Keep visible play/pause controls on autonomous demos.
- Pause animations when outside the viewport or when the page is hidden.
- Respect `prefers-reduced-motion` everywhere.
- Avoid several independent looping animations competing on one viewport.
- Give pricing cards restrained hover/focus elevation, not large bouncing movement.
- Add a smooth but accessible anchor transition to Pricing.
- Ensure CTA press/loading behaviour matches the dashboard design system.
- Keep demonstrations explicitly labelled as samples.

## 11. Motion specification

Use motion to explain a state change, maintain spatial continuity or reward completion.

- Button press: 80–140ms, subtle scale/translate, never block the click.
- Hover/focus surface response: 120–180ms.
- Toast/inline status entrance: 160–220ms.
- Card/page-section transition: 180–280ms.
- Dialog/drawer: 200–300ms with correct focus trapping.
- Flashcard reveal: 220–320ms.
- Completion mark: under 500ms and non-blocking.
- Prefer `transform` and `opacity`.
- Avoid layout-shifting height animations unless measured and controlled.
- No animation should delay access to an answer, error or primary action.
- Under reduced motion, replace spatial movement with immediate state changes or a short opacity transition.

Centralise durations and easing tokens. Do not add an animation library unless CSS and the current React code cannot implement the required interaction cleanly.

## 12. Loading-state matrix

| Surface | Preferred treatment | Avoid |
|---|---|---|
| Initial authentication | Simple centred status/skeleton | Branded looping spectacle |
| Dashboard data | Layout-matched skeletons | Full-page spinner |
| Course creation | Button loader + inline status | Clearing the form before success |
| Material upload | File row + real upload state | Fake progress percentage |
| Document processing | Named stages/status | Endless generic spinner |
| AI resource generation | Resource-specific processing panel | Restarting animation for cached results |
| Recall rating | Button-level pending + next-card transition | Freezing the full screen |
| Practice submission | Submit-button loader, preserve answers | Removing student answers |
| Billing redirect | Clear secure-redirect state | Fake in-app card processing |
| Notification save | Inline saved/error confirmation | Claiming success before API response |

## 13. Accessibility requirements

- Full keyboard access for authentication, navigation, upload, flashcards, quizzes, dialogs and settings.
- Visible focus on every interactive element.
- Correct heading order and landmark structure.
- At least 44×44px touch targets where practical.
- No colour-only status or answer feedback.
- Status changes announced through appropriate live regions without excessive repetition.
- Focus moved to meaningful content after navigation or generation completion.
- Focus returned to the opener when dialogs close.
- Escape closes dismissible dialogs and mobile navigation.
- Reduced-motion behaviour tested, not merely declared.
- Contrast checked for normal, hover, disabled, warning, success and error states.
- Screen-reader labels for icon-only buttons.
- Mobile layouts tested at narrow widths without horizontal scrolling.

## 14. Performance requirements

- Avoid adding large animation or component packages for small effects.
- Keep dashboard motion compositor-friendly.
- Lazy-load heavy, route-specific frontend code when routes are introduced.
- Avoid autoplaying large media in the dashboard.
- Preserve quick interaction during AI processing.
- Test landing animations on a low-power/mobile profile.
- Prevent duplicate API requests caused by visual re-renders.
- Do not store sensitive payment or lecture content in visual analytics events.

## 15. Working method and handoff expectations

Implement one coherent milestone at a time. Recommended sequence:

1. State system and dashboard skeletons/loaders.
2. Upload and generation experience.
3. Flashcard and Today's Recall polish.
4. Practice feedback/results polish.
5. Responsive dashboard shell.
6. Billing/upgrade frontend states.
7. Notification preferences.
8. Landing content and animation audit.
9. Progress/weak-topic UI when its data contract exists.

For every milestone:

- Inspect existing components before editing.
- Identify the actual API states; do not invent data.
- Reuse tokens and patterns.
- Test desktop, tablet and mobile.
- Test keyboard and reduced-motion behaviour.
- Run lint and production builds.
- Provide before/after screenshots or a short walkthrough.
- Document any backend data needed, but leave its implementation to the backend owner.
- Clearly mark mocked, disabled or planned states.

## 16. Definition of done

The frontend handoff is successful when a student can:

- Understand what to do immediately after signing in.
- Upload a real lecture and understand every processing state.
- Move from material to notes, flashcards and practice without confusion.
- Complete a recall session smoothly on desktop or mobile.
- Understand their plan and remaining allowance.
- Understand why Student or Pro would help without being forced into an upgrade.
- Configure reminder preferences without surprise notifications.
- Recover from errors without losing work.
- Use all core flows with a keyboard and reduced motion.

The final experience should feel responsive and thoughtful during every wait, click, answer and transition—calm enough for serious study and lively enough to make practice rewarding.
