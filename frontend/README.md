# Lexicon frontend

The dashboard prioritizes PDF upload, your saved lecture library, and the three
connected tools: study notes, flashcards, and mixed practice.

## Understand the code

- `src/App.jsx`: library loading, selected lecture, navigation, API actions, and
  per-material resource/answer state. Switching lectures preserves practice
  answers during the visit.
- `src/App.css`: semantic colors and responsive layout. Forest, lime, off-white
  and blue-gray match the existing landing page.
- `src/components/UploadCard.jsx`: accessible file picker and drag/drop surface.
- `src/components/StudyResources.jsx`: notes, flashcard review and generate states.
- `src/components/Practice.jsx`: MCQs, gaps, theory and objective scoring UI.
- `src/api.js`: readable API failure handling.

`GET /materials` lists real saved metadata from the local Python backend.
Generation uses the existing `study-pack`, `flashcards` and `practice-session`
endpoints for the selected material. No API keys are sent to the frontend.

The uploaded material library survives refresh. Generated notes, flashcards,
answers and scores currently last only while the page is open. Flashcard
self-ratings last while that review component stays open. Course organization,
accounts and cross-visit study-resource persistence remain future milestones.

## Development

From this folder run `npm ci`, then `npm run dev`. Run the backend on port 8000
as described in the root README. `npm run build` creates the production bundle.

## Manual UI checks without AI calls

Build the frontend, then from the repository root run:

`py frontend/tests/preview_server.py`

Open http://127.0.0.1:5174. This isolated fixture server serves the real production
frontend with synthetic responses. It does not call OpenAI or write to the
lecture database. Never deploy this test server as the application.

1. Confirm Upload PDF is visible immediately and the fixture library loads.
2. Open `study-notes.txt`; generate notes and verify objectives/topics appear.
3. Select Flashcards, create them, reveal with Enter and choose Got it.
4. Select Practice & quiz and create practice. Incomplete submission is disabled.
5. Answer some questions, switch to Dashboard and resume: answers should remain.
6. Choose A for every MCQ and `active` for every gap; submit and check 100% on
   My progress. Change an objective answer: the old result should disappear.
7. Choose `tests/fixtures/unsupported.csv` from Upload PDF: see a type error.
   Choose `study-notes.txt`: the selected lecture opens without duplicate IDs.
8. Check a 390px viewport: upload remains prominent, no horizontal overflow,
   navigation opens/closes, Escape closes it, and closed links are not focusable.

Backend tests also check that the real library response excludes extracted text.
Live AI generation is not exercised by the fixture checks.

## Learning exercise

Change `--surface-blue` in `src/App.css`, then inspect the resume strip. Next trace
how `resources[materialId]` keeps one lecture's answers separate from another.
Colors describe presentation; React state describes the current study session.
