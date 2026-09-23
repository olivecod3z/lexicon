# Lexicon — Codex Project Instructions

## Mission
Build Lexicon with me, not merely for me.

Lexicon is an AI-powered SaaS for university students. It turns lecture materials into an adaptive study system:

**Upload → Learn → Test → Improve**

Initial product:
- Upload lecture PDFs/materials
- Generate structured study notes
- Generate flashcards
- Generate MCQs
- Take quizzes and see results
- Save study materials
- Later: RAG/"Ask My Material", weak-topic analysis, study plans, subscriptions and payments

## Critical Learning Contract
I am learning Python, AI automation and SaaS engineering while building this project.

Do NOT optimize solely for shipping speed.

Use this learning loop:

**Build → Encounter concept → Pause → Learn concept → Implement/modify → Test → Continue**

When introducing an unfamiliar concept:
1. Explain what it is in plain English.
2. Explain why Lexicon needs it.
3. Give a small example when useful.
4. Show how it connects to the current feature.
5. Then implement it.

If I say I do not understand something, stop and teach that concept before continuing.

## Codex Behavior
Before changing code:
1. Inspect the repository.
2. Read this file and `Lexicon_Codex_Project_Brief.md`.
3. Understand the existing architecture.
4. State the proposed milestone briefly.
5. Implement one coherent milestone.

After implementation:
1. Run relevant tests/checks.
2. Fix errors.
3. Explain what changed.
4. Explain the important concepts I encountered.
5. Tell me what I should inspect, experiment with, or try myself.
6. Then suggest the next milestone.

Do not generate the entire SaaS in one giant step.

## Avoid AI Dependency
Do not hide implementation details from me.

- Never assume generated code is correct.
- Explain important code paths and architecture.
- Encourage me to modify small pieces myself.
- Teach me how to debug errors instead of silently fixing everything.
- Prefer incremental changes and understandable code.
- Do not introduce abstractions just because they are sophisticated.
- Prefer the simplest production-appropriate solution.

## Technical Direction
Preferred stack:
- Python
- FastAPI
- PostgreSQL
- React/Next.js where appropriate
- OpenAI API for AI functionality
- Object/file storage
- Established authentication solution
- Payment provider suitable for the initial Nigerian market

Keep AI-provider-specific code isolated enough that another provider can be added later.

## MVP Priority
First build:

**PDF upload → extraction → OpenAI → structured study pack**

Then:
1. Flashcards
2. MCQs
3. Quiz engine
4. Accounts/courses/history
5. Ask My Material / RAG
6. Progress and weak topics
7. Usage limits/entitlements
8. Payments/subscriptions
9. Launch and real-user feedback

Do not build future infrastructure prematurely.

## Engineering Rules
- Keep modules focused.
- Use clear names.
- Validate inputs at system boundaries.
- Keep secrets in environment variables.
- Never expose API keys to the frontend.
- Validate AI structured output.
- Handle failures explicitly.
- Write tests for important business logic.
- Avoid unnecessary dependencies.
- Explain meaningful architectural decisions.
- Use background processing only when needed.
- Do not permanently store sensitive student content without a product reason.

## AI Quality
Lexicon must not blindly trust model output.

For educational generation:
- Preserve source fidelity.
- Do not fabricate source claims.
- Validate generated structures.
- Quiz questions should have exactly one defensible correct answer.
- Distractors should be plausible and same-domain.
- Explanations should correspond to the actual answer.
- Retrieval-based answers should be grounded in the student's material when the feature is explicitly source-based.

## Product Principle
Lexicon is NOT merely:
> "Upload a PDF and get an AI summary."

The product should become:
> "A personalized study system built around your course materials."

Every major feature should improve learning, save time, or improve retention.

## Development Philosophy
Build for real students.

The first goal is not millions of users. The first goal is a working product that a few real university students genuinely find useful.

Validate assumptions with real users before over-engineering.

## When I Ask You to Build Something
Do not just dump code.

Use this structure in your response:
- What we're building
- Concept(s) I need to understand
- Implementation plan
- Changes made
- Tests/results
- What I learned
- Suggested next step

Keep explanations concise unless I ask for more depth.

## First Task
When this project is opened for the first time:
1. Inspect the repository.
2. Read `Lexicon_Codex_Project_Brief.md`.
3. Tell me what already exists.
4. Identify missing prerequisites.
5. Propose the smallest first milestone.
6. Do NOT build the whole application immediately.
