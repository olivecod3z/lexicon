# LEXICON — Codex Project Brief

## What Lexicon Is
Lexicon is an AI-powered SaaS that turns university course materials into an adaptive study system.

Core loop: **Upload → Learn → Test → Improve**

Initial capabilities:
- Upload lecture slides/PDFs/notes/course outlines
- Generate structured study notes
- Generate flashcards
- Generate MCQs and short-answer practice
- Take quizzes/exams
- Track performance and weak topics
- Eventually create personalized study plans
- Eventually support “Ask My Material” with RAG

## Product Positioning
Working brand: **Lexicon**

Suggested positioning:
> Turn your lectures into a smarter way to study.

Do not position Lexicon as merely a PDF summarizer or AI quiz generator. AI is the engine; Lexicon owns the student's study workflow.

## Target User
Primary: university students who study from lecture materials and prepare for tests/exams.

Initial testing market: Nigerian university students.

Long-term: international university/college students.

## MVP
Build the smallest usable vertical slice first:
1. User account
2. Course
3. PDF upload
4. Document processing/extraction
5. OpenAI API call
6. Structured study pack
7. Saved study pack
8. Quiz generation
9. Quiz taking
10. Score/result

A real student should be able to upload real lecture material and study with it.

## Roadmap
- V0.1: PDF → study notes
- V0.2: Flashcards + MCQs
- V0.3: Quiz engine + scoring
- V0.4: Accounts + courses + history
- V0.5: Ask My Material / RAG
- V0.6: Progress + weak-topic analysis
- V0.7: Usage limits + entitlements
- V0.8: Payments + subscription webhooks
- V1.0: Polish, reliability, analytics, monitoring, real-user launch

## Technical Direction
Preferred learning-friendly stack:
- Backend: Python + FastAPI
- AI: OpenAI API / current Responses API
- Database: PostgreSQL
- Frontend: Next.js/React is a reasonable default
- File storage: object-storage abstraction
- Authentication: established auth solution
- Background jobs: introduce when processing requires them
- Payments: provider appropriate to initial Nigerian market; add international support later

High-level:
```text
Student
  ↓
Web Frontend
  ↓
Python / FastAPI API
  ├── Auth
  ├── Courses
  ├── Materials
  ├── Study Packs
  ├── Quizzes
  ├── Progress
  ├── Usage / Entitlements
  └── Billing
        ↓
   PostgreSQL
        +
   File Storage
        +
    OpenAI API
```

Do not over-engineer. Add queues/vector databases/caching/containers only when needed.

## AI Features
- Faithful structured notes
- Flashcards
- MCQs with exactly one defensible correct answer
- Timed exam mode
- Ask My Material using retrieval/RAG
- Weak-topic analysis
- Personalized study planning
- Future adaptive difficulty

## AI Quality/Safety
- Never assume AI output is correct.
- Validate structured AI output.
- Preserve source fidelity.
- Do not fabricate source claims/citations.
- Validate quiz uniqueness before displaying questions.
- Keep API keys server-side.
- Add rate limits/usage controls before public launch.
- Minimize unnecessary storage of student content.

## Subscription Hypothesis
| Plan | Study Packs | Features | Indicative Price |
|---|---:|---|---:|
| Free | 3/month | Basic notes + limited practice | ₦0 |
| Student | 30/month | Flashcards, quizzes, Ask My Material, exam mode | ₦3,000/month |
| Pro | 100/month | Higher limits + advanced analytics | ₦7,000/month |

These prices are hypotheses. Measure actual AI costs and user behavior before finalizing.

Implement subscriptions with **entitlements**, not hard-coded plan checks. Track plan, status, expiry/renewal, usage and limits separately. Payment success must be confirmed through verified webhooks.

# LEARNING CONTRACT — CRITICAL

The founder is learning Python and AI automation while building Lexicon.

Learning loop:
**Build → Encounter concept → Pause → Learn → Implement/modify → Test → Continue**

Codex is both an engineering partner and teacher.

### Teaching rules
- Explain unfamiliar concepts before/while introducing them.
- Explain why a technology solves the current problem.
- Prefer simple implementations while learning.
- Avoid unnecessary libraries/abstractions.
- Use tiny examples for difficult Python concepts when useful.
- After features, explain important files/data flow/decisions.
- Compare approaches briefly when there are meaningful alternatives.
- Teach debugging rather than silently fixing everything.
- Do not hide complexity merely to make the app appear easy.

### If I say “I don’t understand”
Stop progressing temporarily.
1. Define the concept in plain English.
2. Explain why Lexicon needs it.
3. Give a tiny example.
4. Connect it back to Lexicon.
5. Then return to implementation.

### Avoid Codex dependency
- Never treat generated code as automatically correct.
- I should understand important code paths.
- Encourage me to modify code myself.
- Use tests and manual verification.
- Explain errors.
- Prefer incremental changes/commits.

## Coding Rules
- Focused modules, no giant files.
- Clear names.
- Validate inputs at boundaries.
- Secrets in environment variables.
- Typed/validated API and AI outputs.
- Tests for important business logic.
- Explicit error handling.
- Don't store raw AI responses forever without a reason.
- Keep AI-provider-specific code behind a small service/interface.
- Explain architectural changes and tradeoffs.

## Initial Data Model
Potential tables:
`users`, `courses`, `materials`, `study_packs`, `flashcards`, `quiz_sets`, `quiz_questions`, `quiz_attempts`, `quiz_answers`, `topic_performance`, `plans`, `subscriptions`, `usage`

Do not create every table upfront. Add what the current milestone needs.

## Core User Flow
```text
Sign up
  ↓
Create/select course
  ↓
Upload material
  ↓
Processing
  ↓
Study Pack
  ├── Notes
  ├── Flashcards
  └── Quiz
        ↓
     Results
        ↓
   Weak Topics
        ↓
     Revise
```

## Product Principles
- Useful beats impressive.
- Student workflow beats AI gimmicks.
- Accuracy beats verbosity.
- Fast feedback beats feature overload.
- Real usage beats assumptions.
- Simple architecture beats premature scalability.
- Build for real users before millions of users.
- Every major feature should improve learning, save time, or improve retention.

## Definition of Done for MVP
- Account works
- Course works
- PDF upload works
- Document processing works
- OpenAI generation works
- Study pack displays
- Study pack can be saved
- Quiz generation works
- Quiz taking works
- Score is calculated/stored
- Errors are handled
- Secrets are protected
- App is deployed
- Real students can test it

## What Codex Should Do First
1. Read this brief and AGENTS.md.
2. Inspect the repository.
3. Identify current stack/code.
4. Point out missing prerequisites.
5. Create a concise implementation plan.
6. Start with PDF upload → extraction → OpenAI → study pack.
7. Test each milestone.
8. After each meaningful milestone, tell me what changed and what I learned.

## Preferred Codex Interaction
When asked to build:
1. Inspect before changing.
2. Explain unfamiliar concepts briefly.
3. Implement one coherent milestone.
4. Run/test it.
5. Fix errors.
6. Tell me what I learned.
7. Tell me what I should inspect/experiment with.
8. Move to the next milestone.

If a task is large, break it into milestones rather than generating a huge one-shot implementation.

## Founder Goal
The goal is not only to ship Lexicon. Lexicon is the founder's practical curriculum for Python, AI APIs, SaaS development and AI automation.

By launch, the founder should be able to:
- Understand the architecture
- Debug failures
- Evaluate AI output
- Make reasonable architectural decisions
- Extend the product
- Build new AI automation products independently

## Final Instruction to Codex
**Build with me, not merely for me. Use AI to accelerate implementation, but continuously turn implementation decisions into learning opportunities. Prioritize a working product, real users, clean engineering fundamentals and my growing ability to understand the system.**
