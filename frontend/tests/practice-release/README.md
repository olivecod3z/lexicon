# Local practice release fixture

This fixture runs the real dashboard and FastAPI routes with a synthetic identity,
in-memory materials and synthetic questions. It exercises controls, validation and
scoring; it does not validate Firebase authentication, Firestore accounting or AI
quality. Production Vite configuration never imports this fixture's auth module.
The backend binds to loopback and refuses to start with `K_SERVICE` set.

From the repository root, start the backend:

```text
python -c "import runpy; runpy.run_path('tests/practice_ui_server.py', run_name='__main__')"
```

In a separate terminal, from `frontend/`:

```text
npx vite --config tests/practice-release/vite.config.mjs
```

Open `http://127.0.0.1:4176/tests/practice-release/index.html` and sign in with
`student@example.test` / `fixture-password`. The banner switches test plans; it
does not create a subscription. Nothing should be deployed from these servers.

Check Free's fixed 5/3/2 mix, Student's 12 gap-only questions, Pro's 60-question
mix, objective scores, invalid counts, selected-section requirements and switching
materials. Inspect at narrow and wide widths. Answers are synthetic: A for MCQs,
"active" for gaps. Theory prompts use self-review rather than automatic scoring.
