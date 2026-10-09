# Lexycon

An AI-powered study workspace for university students:
**Upload → Learn → Test → Improve**.

## Current milestone

- Upload PDF, DOCX, PPTX, or TXT lectures (up to 25 MB).
- Browse the saved local material library.
- Generate structured study notes and flashcards from a selected lecture.
- Generate mixed practice: five MCQs, three keyword gaps and two theory prompts.
- Submit objective answers for scoring, and review current-visit results.
- Use a responsive dashboard matching the landing page's forest-green/lime theme.

The local development mode stores one course, lecture text, recall cards and
practice data in an ignored SQLite database. The hosted dashboard uses Firebase
Authentication and Firestore so each student's course and materials remain
private to that account. Hosted generation is limited to three unique lecture
packs per account per UTC month, with additional daily and shared safety caps.
Subscriptions, payments, Ask My Material, topic-level analytics and durable
practice-result history are not implemented yet.

## Start locally

Install Python (the current tests pass on Python 3.14) and Node.js compatible with
Vite 8. From the repository root:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit your local `.env` with your own OpenAI API key and an available model that
supports structured output. Never commit this file. Then start the backend:

```powershell
python -m uvicorn app.main:app --reload
```

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open http://127.0.0.1:5173. API documentation is at
http://127.0.0.1:8000/docs. Vite proxies API requests to the backend on port 8000.
If your Python installation cannot create a virtual environment, repair its pip
support before continuing; do not commit machine-specific environments.

## Project map

- `app/`: FastAPI routes, document extraction, generation, validation and storage.
- `frontend/src/`: React dashboard, study tools and theme.
- `landing/`: Next.js marketing site, bundled assets and Firebase hosting configuration.
- `tests/`: backend tests; generation is mocked during automated checks.
- `frontend/tests/`: isolated manual UI-test server and synthetic fixtures.
- `AGENTS.md`: the build-and-learn contract for Codex.
- `Lexycon_Codex_Project_Brief.md`: product scope and roadmap.
- `DESIGN_SYSTEM.md`: visual and interaction guidelines.

AI output is validated on the server. Original files are not retained by the
backend, but extracted lecture text is stored locally. Do not use the unprotected
local API as a public production backend.

## Checks

```powershell
python -m pytest -q
cd frontend
npm run build
```

Current validation: 72 backend tests pass and the frontend production build
passes. Manual browser checks cover library navigation, generated notes,
flashcard reveal/self-review, practice submission, results and mobile layout.
These use deterministic fixtures; they do not validate live AI output quality.

See `frontend/README.md` for the repeatable UI check. The Firebase landing-page source is in `landing/`; see `landing/README.md`
for local development and manual deployment instructions.

## Collaboration

Read `CONTRIBUTING.md` before starting a change. Keep work in small milestones,
use a branch per task, and open a pull request for review. Every collaborator uses
their own local `.env`. No API keys, lecture databases, dependencies or generated
builds belong in the repository.



## Combined website preview

Install dependencies with `npm ci --prefix landing` and `npm ci --prefix frontend`.
Run `node scripts/build-hosting.mjs` from the root, then
`firebase deploy --only hosting --project lexicon-study-20260923`.
The landing page is served at `/` and links to the student dashboard at `/dashboard/`.
The hosted dashboard connects to the authenticated Cloud Run API. Firestore stores
each account's course, extracted lecture text, generated-resource cache, review
cards and practice sessions. Original uploaded files are not retained by the
backend; the browser may keep a local copy for reading during the current visit.
