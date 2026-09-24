# Lexicon Design System

> Product design source of truth for Codex. Companion to `AGENTS.md` and `Lexicon_Codex_Project_Brief.md`.

## 1. Design North Star

Lexicon is an AI-powered study system for university students.

**Core principle: Calm while studying. Energetic while testing. Rewarding when progressing.**

Lexicon should feel intelligent, modern, focused, youthful without being childish, and premium without feeling corporate. It must not look like a generic AI dashboard or a children's learning game.

When goals conflict, prioritize:
1. Learning clarity
2. Usability
3. Accessibility
4. Consistency
5. Performance
6. Delight
7. Decoration

## 2. Reference Products

These links are for interaction research only. Do not clone branding, layouts, assets, illustrations, or proprietary visual language.

### Wayground (formerly Quizizz)
https://wayground.com/

**Primary reference for quiz UX.** Study its self-paced assessment flows, quiz-card hierarchy, progress visibility, immediate feedback, question transitions, clear actions, and restrained gamification.

### Quizlet
https://quizlet.com/

**Primary reference for the serious study workspace.** Study flashcards, study-set organization, focused learning screens, test preparation, information hierarchy, and content organization.

### Blooket
https://www.blooket.com/

**Reference for motion and reward timing.** Study animated feedback, progression, transitions, and positive reinforcement. Do not copy its game-first identity, characters, or heavy game economy.

### Kahoot!
https://kahoot.com/

**Reference for microinteractions.** Study countdowns, timers, answer reveals, score changes, question pacing, and completion moments. Do not copy the loud multicolor answer-grid aesthetic.

The desired blend is:

**Wayground polish + Quizlet seriousness + Blooket reward timing + Kahoot microinteractions + an original Lexicon identity.**

## 3. Experience Modes

### Workspace Mode — calm
Dashboard, courses, uploads, notes, study packs, settings, analytics. Use whitespace, neutral surfaces, restrained motion, and low cognitive load.

### Study Mode — focused
Notes, flashcards, Ask My Material, revision. Content dominates. Reduce navigation distractions, maintain comfortable reading width, and show progress subtly.

### Test Mode — energetic
Quizzes, timed practice, Exam Mode, answer reveals, results. Use stronger progress, purposeful motion, immediate feedback, and satisfying completion states without visual noise.

## 4. Visual Language

Use clean surfaces, strong typography, soft depth, generous whitespace, rounded-but-not-bubbly components, one dominant brand accent, semantic feedback colors, and polished microinteractions.

Avoid excessive glassmorphism, neon, gradients, giant decorative blobs, rainbow dashboards, heavy shadows, dense borders, excessive emojis, unnecessary 3D decoration, and animation without UX purpose.

## 5. Color System

Use semantic design tokens centrally. Never scatter arbitrary hex values through components.

Define at minimum:

- `--brand-primary`
- `--brand-primary-hover`
- `--brand-primary-subtle`
- `--brand-accent`
- `--background`
- `--surface`
- `--surface-elevated`
- `--surface-muted`
- `--border`
- `--border-strong`
- `--text-primary`
- `--text-secondary`
- `--text-muted`
- `--success` / `--success-subtle`
- `--warning` / `--warning-subtle`
- `--danger` / `--danger-subtle`
- `--info` / `--info-subtle`

The landing page is now the approved color reference (September 2026). Use its forest-green and lime direction in the application:

- Forest `#293E2A`: sidebar, strong text, and dark actions.
- Lime `#A5EB69`: primary actions and selected navigation, paired with dark `#162414` text.
- Off-white `#F9FAF7`: workspace background.
- White `#FFFFFF`: reading surfaces.
- Blue-gray `#D9E6E8`: the continue-studying panel.
- Main text `#17211B`; secondary text `#5D695C`; borders `#E2E7DE`.

Use DM Sans for interface text and Manrope for headings, matching the landing page. The frontend defines these semantic tokens centrally in `src/App.css`. Lime should not be used as small text on white; use forest green for readable text and feedback.

Dashboard counts must reflect real activity. Label current-visit material counts and sample packs explicitly. Do not invent course counts, streaks, or performance. Until persistent practice history is implemented, explain that practice answers and results last while the page is open.

Quiz feedback must never rely on color alone:
- correct = success color + check icon + text
- incorrect = danger color + X icon + explanation
- selected = brand emphasis
- unselected = neutral

Do not assign four random bright colors to answer choices.

## 6. Typography

Use a modern, highly legible sans-serif suitable for long study sessions. Do not introduce extra fonts without a reason.

Suggested scale:
- Display: 40–48px
- H1: 32–36px
- H2: 26–30px
- H3: 20–24px
- H4: 18–20px
- Body large: 18px
- Body: 16px
- Small: 14px
- Caption: 12–13px

Use comfortable line height for educational content and readable line lengths. Avoid ultra-light weights.

## 7. Spacing, Radius and Depth

Use a spacing scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`.

Suggested radii:
- small controls: 8px
- inputs/buttons: 10–12px
- cards: 14–16px
- major study cards: 18–24px
- chips/pills: fully rounded

Use borders for normal separation and subtle shadows for elevation. Avoid heavy shadows around every panel.

## 8. Application Layout

Desktop: restrained application shell with a useful sidebar, main content area, contextual top bar, and optional contextual panel only when valuable. Do not stretch reading content across huge screens.

Mobile is first-class. Collapse the sidebar, use a compact navigation pattern, give answer options generous touch targets, never depend on hover, and avoid normal-content horizontal scrolling.

Tablet layouts should adapt rather than merely shrink desktop.

## 9. Navigation

Likely primary destinations:
- Home
- Courses
- Study
- Progress

Secondary:
- Upload/Create
- Profile
- Settings
- Subscription

Do not expose every feature in permanent navigation.

The dashboard should quickly answer:
- What should I continue?
- What should I study?
- How am I doing?
- How do I add material?

## 10. Dashboard

Prioritize action over analytics.

Suggested hierarchy:
1. contextual study prompt
2. Continue Studying
3. courses
4. upcoming exam/revision priorities
5. recent study packs
6. concise progress snapshot

Analytics must answer a student question. Prefer “Probability Distributions is your weakest topic” over meaningless engagement percentages.

## 11. Course and Material Cards

Show only useful information: course name/code, concise progress, material/study-pack count, and next recommended action.

Keep grids consistent. Do not overload cards with statistics.

## 12. Upload Experience

Uploading is a core action. Support drag/drop and file picker, show supported types, filename/size, upload progress, and distinguish upload from AI processing.

Human-readable processing stages may include:
1. Uploading material
2. Reading document
3. Organizing topics
4. Building your study pack
5. Ready

Never display fake progress precision.

## 13. Study Pack

A Study Pack may contain structured notes, key concepts, flashcards, practice, Ask My Material, and progress.

Do not show everything simultaneously. Use strong hierarchy and clear sections such as:
- Study Notes
- Flashcards
- Practice
- Ask

## 14. Notes

Optimize for comprehension: clear headings, short paragraphs, useful bullets, definitions, concept callouts, formulas/code where relevant, and restrained emphasis.

Do not turn every paragraph into a colorful card.

## 15. Flashcards

Flashcards should feel tactile but mature.

Front: question/term, optional topic label, subtle reveal instruction.
Back: answer, concise explanation, source/context action when available.

Support click/tap, keyboard controls, previous/next, progress, and a fast polished flip animation. Possible self-assessment states: Again, Hard, Got it.

Never make the user wait for animation.

## 16. Quiz Screen

The question must dominate.

Top: exit/back, quiz/topic, progress, optional timer.
Center: question number, question text, optional media/source, answer choices.
Bottom: action/feedback area.

Answer choices need large targets, obvious selected/focus states, keyboard accessibility, consistent shape, and high readability. Avoid arbitrary multicolor answers.

## 17. Immediate Feedback

Correct answers: immediate success state, concise positive feedback, optional explanation, subtle celebration.

Incorrect answers: mark the selected choice, reveal the correct answer, explain why, and make continuing easy.

Do not shake the whole screen, use long failure animations, humiliating copy, or bury the explanation.

## 18. Quiz Progress and Timers

Always make position clear, e.g. `Question 6 of 15`, with a smoothly animated progress indicator.

Normal practice timers should be optional/secondary. Exam Mode may make the timer prominent and reduce distractions. Low-time warnings must be clear without creating needless anxiety or flashing aggressively.

## 19. Results

Results should teach, not merely score.

Hierarchy:
1. result
2. meaningful completion feedback
3. topic performance
4. mistakes/review
5. recommended next action

Useful actions: Review Topic, Retry Missed Questions, Practice Weak Areas, Return to Flashcards.

Do not end with confetti and a dead-end score.

## 20. Progress and Analytics

Useful concepts include mastery by topic, recent performance, revision history, weak topics, improvement over time, and a study streak only if it is genuinely useful.

Avoid vanity metrics. Charts require labels, mobile readability, accessible meaning beyond color, and actionable interpretation.

## 21. Gamification

Gamification supports learning; it is not the product.

Good: completion progress, mastery milestones, subtle XP if justified, personal bests, improvement recognition, brief celebrations.

Avoid initially: complex currencies, loot boxes, distracting avatars, unhealthy leaderboards, or rewards disconnected from studying.

Reward meaningful learning behavior.

## 22. Motion

Motion communicates state or rewards progress.

Micro interactions (hover, press, selection, progress): roughly 100–200ms.
Transitions (dialogs, question changes, answer reveals, flashcard flip): roughly 180–350ms.
Celebrations: brief, non-blocking, and skippable.

Prefer transform/opacity, avoid excessive bounce, never delay important actions, respect `prefers-reduced-motion`, and do not animate every element on page load.

## 23. Microinteractions

Lexicon should respond immediately: subtle button press, clear answer selection, animated progress, instant saved state, reactive upload dropzone, brief correct-answer feedback, restrained completion celebration.

Alive, not busy.

## 24. Buttons and Inputs

Use clear Primary, Secondary, Tertiary/Ghost, and Destructive hierarchies. Normally have one dominant local action. Prefer specific labels like “Start quiz” over “Submit”.

All controls need appropriate hover/focus/active/disabled/loading states.

Inputs require persistent labels, focus states, helper text when needed, inline validation, accessible errors, and must not use placeholders as the only labels.

## 25. Cards and Icons

Cards group meaningful units; not everything needs a card. Avoid card-inside-card “card soup”.

Use one coherent icon family. Important unfamiliar actions should normally have text labels. Do not mix unrelated icon libraries without a reason.

## 26. Loading, Empty and Error States

Use skeletons for known layouts, progress/status for long AI operations, and compact spinners for short actions.

Every empty state should explain what it is, why it is empty, and the next action.

Errors should state what failed and what the student can do. Preserve work where possible and provide safe retry. Technical stack traces belong in logs.

## 27. AI-Specific UI

Never imply certainty that the model cannot guarantee. Support source grounding where available, regeneration/correction where useful, honest processing states, and graceful failure.

Do not plaster “AI” across every component. AI powers Lexicon; it is not the whole visual identity.

## 28. Accessibility

Accessibility is mandatory: WCAG-conscious contrast, keyboard navigation, visible focus, semantic HTML, screen-reader labels, accessible dialogs, generous touch targets, no color-only meaning, reduced-motion support, and readable sizing.

A quiz must be fully usable without a mouse.

## 29. Responsive Behavior

At smaller widths reduce columns, collapse secondary information, preserve primary actions, keep text readable, make quiz choices full-width where appropriate, keep progress visible, and move nonessential controls into menus.

Never merely shrink desktop UI.

## 30. Subscription Plans and Entitlements

Subscriptions must use entitlements and usage limits, not hard-coded checks scattered through the interface. A student must always be able to see their current plan, remaining learning-pack credits, and renewal/reset date.

### Learning-pack credit rules

A learning pack is one uploaded lecture plus the generated study resources for it: structured notes, flashcards, a five-question MCQ quiz, and one standard mixed-practice set.

- Reviewing saved materials and retrying already-generated practice must not consume a credit.
- Generating or regenerating AI content consumes a learning-pack credit.
- A standard mixed-practice set contains up to 10 prompts. An extended set of 11–20 prompts consumes two learning-pack credits.
- Never use vague "unlimited AI" wording in the interface.

### Free — ₦0/month

- 3 learning packs per month.
- Basic notes, flashcards, MCQs, and one fixed balanced practice set per pack: 5 MCQs, 3 fill-in-the-gap questions, and 2 theory prompts.
- Unlimited retries on already-generated practice.
- Limited saved-material and quiz history.
- Ask My Material is not available initially.

### Student — ₦3,000/month

- 30 learning packs per month.
- Saved materials and learning history.
- Flashcard review controls and basic progress/weak-topic feedback when implemented.
- Up to 50 Ask My Material questions per month when implemented.
- Custom practice mixes of up to 10 prompts, including presets such as Balanced, Theory-heavy, and MCQ revision.
- Exam Mode when implemented.

### Pro — ₦7,000/month

- 75 learning packs per month.
- Everything in Student.
- Up to 100 Ask My Material questions per month when implemented.
- Custom practice sets of up to 20 prompts; saved practice templates when implemented.
- Larger/longer lecture-material support, advanced weak-topic analytics, targeted practice, and higher storage when implemented.
- Do not promise priority processing unless Lexicon can reliably provide it.

Theory prompts are currently for self-review; do not describe them as automatically graded until theory feedback has been implemented and validated.

## 31. Dark Mode

Desirable but not an MVP blocker. If implemented, use the same semantic tokens, avoid pure-black-everywhere design, preserve hierarchy, adjust bright accents, and retest all semantic states.

## 32. UI Copy

Copy should be concise, supportive, intelligent, and direct. Avoid baby talk, excessive exclamation marks, patronizing encouragement, and generic AI hype.

Good: “Nice work — you've improved on this topic.”
Avoid: “OMG!!! You're a GENIUS! 🎉🔥🚀”

## 33. Design Tokens and Components

Centralize colors, typography, spacing, radii, shadows, transitions, and breakpoints. If using Tailwind, map these into the theme instead of relying on random arbitrary values.

Reusable primitives may include:
`Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Dialog`, `Tooltip`, `Badge`, `Progress`, `Card`, `Tabs`, `Toast`, `Skeleton`, `EmptyState`.

Lexicon components may include:
`CourseCard`, `MaterialCard`, `StudyPackCard`, `UploadDropzone`, `ProcessingStatus`, `Flashcard`, `QuizQuestion`, `AnswerOption`, `QuizProgress`, `Timer`, `AnswerFeedback`, `ResultsSummary`, `TopicMastery`, `StudyRecommendation`.

Do not abstract prematurely.

## 34. Codex Rules

When implementing UI, Codex must:

1. Read this file before major visual work.
2. Read `AGENTS.md` and `Lexicon_Codex_Project_Brief.md`.
3. Inspect existing components before creating new ones.
4. Reuse tokens and primitives.
5. Keep styling consistent across routes.
6. Build responsive behavior from the start.
7. Implement relevant hover, focus, active, disabled, loading, success, and error states.
8. Include keyboard/accessibility behavior.
9. Explain unfamiliar UI concepts when introduced.
10. Avoid dependencies solely for trivial visual effects.
11. Test important flows at desktop and mobile widths.
12. Respect reduced-motion preferences.
13. Never blindly clone a reference product.
14. If a design decision is not covered here, choose the simplest solution consistent with Lexicon's principles.
15. When a new pattern becomes recurring, update this design system instead of allowing visual drift.

## 35. Anti-Patterns

Lexicon must not become:
- a Wayground clone,
- a Quizlet clone,
- a Kahoot clone,
- a Blooket clone,
- a generic purple AI SaaS dashboard,
- a noisy gamified children's product,
- a pile of unrelated component-library defaults,
- an overanimated portfolio project,
- or a visually impressive interface that makes studying slower.

## 36. Final Standard

A student should be able to upload a difficult lecture, understand what matters, practice it, see where they are weak, and know what to study next without fighting the interface.

Lexicon should be **calm enough for a two-hour study session and engaging enough that practice never feels dead.**

Build the interface around that standard.

## Current dashboard implementation

The dashboard starts with a prominent PDF upload, three direct study tools, and
the real saved local material library. Do not replace these with motivational
slogans, sample packs, invented counts, or decorative statistics. Personalization
comes from the student's selected lecture, generated resources and resume state.

The library survives page refresh. Generated resources and practice answers are
currently scoped to the open page. Course organization, accounts, persistent
study-resource history, RAG and subscriptions remain later milestones.

## Shared implementation — September 2026

`shared/design-system.css` owns the semantic palette, fluid rem-based type scale,
control radii, focus treatment and reduced-motion rules used by both applications.
App-specific role mappings are in `landing/app/design-system.css` and
`frontend/src/design-system.css`. Import these after legacy component styles.
Use Manrope for headings and DM Sans for prose and controls, with bundled fonts.
Use MingCute Core Regular for all interface icons. Decorative SVGs should be
hidden from assistive technology; icon-only buttons require an accessible name.

Normal text pairs must meet 4.5:1 contrast; large text and essential graphical
controls require 3:1. Never place white text on lime. Use `--on-lime` instead.
Default body copy is 16px, controls 14px, captions 12px, and headings use the shared
fluid scale. Illustrative miniatures are not the application's reading text.
Use a 44px control target where layout permits. Preserve keyboard focus, native
semantics, keyboard-operated tabs and text equivalents for feedback.

Animations start paused, have explicit play/pause controls, and respect reduced
motion. Interactive study tabs pause on user interaction. Dialogs use the native
`dialog` element for Escape handling, focus containment and return focus.

Run `node scripts/check-design-contrast.mjs`, frontend lint and the combined build
before publishing. Recheck keyboard navigation, narrow-screen reflow and both
sample quiz states after visual changes. Passing automated checks is not a claim
of complete WCAG 2.2 AA conformance; imagery, gradients and assistive-technology
behavior also require manual evaluation.
