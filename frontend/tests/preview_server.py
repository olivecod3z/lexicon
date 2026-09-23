"""Manual UI test server: serve the production build with deterministic API fixtures.

Run from the repository root: py frontend/tests/preview_server.py
Open http://127.0.0.1:5174. No OpenAI calls or database writes are made.
Never use this server for the real application.
"""

import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DIST = Path(__file__).resolve().parents[1] / "dist"
PRACTICE = {
    "title": "Study habits — UI test fixture",
    "mcqs": [
        {"question": f"Recall check {i + 1}: which activity requires active recall?",
         "options": [{"label": "A", "text": "Explain an idea with notes closed"},
                     {"label": "B", "text": "Read the same paragraph again"},
                     {"label": "C", "text": "Highlight the paragraph"},
                     {"label": "D", "text": "Copy the paragraph"}]}
        for i in range(5)
    ],
    "fill_in_the_gaps": [{"prompt": f"Recall check {i + 1}: ____ recall retrieves ideas from memory."} for i in range(3)],
    "theory_questions": [{"prompt": "Explain how you could revise a lecture using active recall."},
                         {"prompt": "Describe how you could space your revision sessions."}],
}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def respond(self, data, status=200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/materials":
            return self.respond([{"id": "ui-test", "filename": "study-notes.txt", "character_count": 280,
                                  "unit_count": 1, "created_at": "2026-09-23T00:00:00Z"}])
        return super().do_GET()

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        if self.path == "/materials":
            if b"fail-upload.txt" in body:
                return self.respond({"detail": "Test upload failure. Please try again."}, 503)
            return self.respond({"id": "ui-test", "filename": "study-notes.txt", "character_count": 280,
                                 "unit_count": 1, "created_at": "2026-09-23T00:00:00Z"}, 201)
        if self.path == "/materials/ui-test/practice-session":
            return self.respond({"practice_id": "ui-test", "practice": PRACTICE})
        if self.path == "/materials/ui-test/study-pack":
            return self.respond({"title": "Study habits", "overview": "Use recall and spaced review to study.",
                                 "learning_objectives": ["Explain active recall", "Describe spaced repetition"],
                                 "sections": [{"heading": "Active recall", "explanation": "Explain an idea with notes closed.", "key_points": ["Check your explanation against your notes."]},
                                              {"heading": "Spaced repetition", "explanation": "Review material across sessions.", "key_points": ["Leave time between reviews."]}]})
        if self.path == "/materials/ui-test/flashcards":
            return self.respond({"title": "Study habits flashcards", "flashcards": [
                {"card_type": "question_answer", "question": "What is active recall?", "answer": "Retrieving information from memory.", "topic": "Active recall"},
                {"card_type": "fill_in_the_blank", "question": "____ repetition separates reviews over time.", "answer": "Spaced", "topic": "Review"}]})
        if self.path == "/practice-sessions/ui-test/submit":
            data = json.loads(body)
            mcqs = sum(answer == "A" for answer in data["mcq_answers"])
            gaps = sum(answer.strip().lower() == "active" for answer in data["gap_answers"])
            return self.respond({"correct_mcqs": mcqs, "correct_gaps": gaps,
                                 "total_gradable": 8, "percentage": (mcqs + gaps) / 8 * 100})
        self.respond({"detail": "Unknown fixture endpoint"}, 404)


if __name__ == "__main__":
    print("UI TEST FIXTURES ONLY: http://127.0.0.1:5174", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 5174), Handler).serve_forever()
