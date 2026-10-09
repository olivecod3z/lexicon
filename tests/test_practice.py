from app.practice import PracticeSet, PracticeSubmission, score_practice


def test_practice_scoring_reveals_correct_answers_after_submission() -> None:
    practice = PracticeSet(
        title="Practice",
        mcqs=[
            {
                "question": f"Question {index}?",
                "options": [
                    {"label": "A", "text": "Correct answer"},
                    {"label": "B", "text": "Wrong answer"},
                    {"label": "C", "text": "Another wrong answer"},
                    {"label": "D", "text": "Final wrong answer"},
                ],
                "correct_option": "A",
                "explanation": "The lecture supports the first option.",
                "topic": "Topic",
            }
            for index in range(5)
        ],
        fill_in_the_gaps=[
            {"prompt": f"Gap {index} is ____.", "answer": "expected", "topic": "Topic"}
            for index in range(3)
        ],
        theory_questions=[
            {"prompt": "Explain the topic.", "marking_guidance": "Mention the source point.", "topic": "Topic"},
            {"prompt": "Compare the topic.", "marking_guidance": "Use the lecture.", "topic": "Topic"},
        ],
    )

    result = score_practice(
        practice,
        PracticeSubmission(
            mcq_answers=["B", "A", "A", "A", "A"],
            gap_answers=["wrong", "expected", "expected"],
        ),
    )

    assert result.correct_mcqs == 4
    assert result.correct_gaps == 2
    assert result.mcq_feedback[0].correct_answer == "Correct answer"
    assert result.mcq_feedback[0].explanation == "The lecture supports the first option."
    assert not result.mcq_feedback[0].is_correct
    assert result.gap_feedback[0].expected_answer == "expected"
    assert not result.gap_feedback[0].is_correct
