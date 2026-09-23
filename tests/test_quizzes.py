from app.mcqs import MCQSet
from app.quizzes import QuizAttemptRequest, score_quiz


def test_quiz_scoring_returns_feedback_and_topic_results() -> None:
    questions = []
    for index in range(5):
        questions.append({"question": f"Question {index} text?", "options": [{"label": "A", "text": "Correct"}, {"label": "B", "text": "Wrong one"}, {"label": "C", "text": "Wrong two"}, {"label": "D", "text": "Wrong three"}], "correct_option": "A", "explanation": "The material supports A.", "topic": "Topic"})
    result = score_quiz(MCQSet(title="Quiz", questions=questions), QuizAttemptRequest(answers=[{"question_index": 0, "selected_option": "A"}, {"question_index": 1, "selected_option": "B"}]))
    assert result.score == 1
    assert result.total_questions == 5
    assert result.question_results[2].selected_option is None
    assert result.topic_results[0].correct_answers == 1
