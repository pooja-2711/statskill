
import pytest

from app.services.adaptive_engine import (
    calculate_average_scores,
    get_latest_scores,
    analyze_performance,
    analyze_progress_trend,
    create_next_quiz_plan,
    generate_learning_report,
    validate_learning_history,
)


def test_calculate_average_scores():
    history = {
        "Programming": [80, 90, 70],
        "Statistics": [40, 60],
    }

    result = calculate_average_scores(history)

    assert result == {
        "Programming": 80.0,
        "Statistics": 50.0,
    }


def test_get_latest_scores():
    history = {
        "Programming": [40, 60, 80],
        "Statistics": [50, 70],
    }

    result = get_latest_scores(history)

    assert result == {
        "Programming": 80,
        "Statistics": 70,
    }


def test_analyze_performance():
    scores = {
        "Programming": 40,
        "Statistics": 60,
        "Economics": 85,
    }

    result = analyze_performance(scores)

    assert result["Programming"]["status"] == "Weak"
    assert result["Statistics"]["status"] == "Needs Practice"
    assert result["Economics"]["status"] == "Strong"


def test_analyze_progress_trend():
    history = {
        "Programming": [40, 60],
        "Statistics": [80, 60],
        "Economics": [50, 53],
    }

    result = analyze_progress_trend(history)

    assert result["Programming"]["trend"] == "Improving"
    assert result["Statistics"]["trend"] == "Declining"
    assert result["Economics"]["trend"] == "Maintaining"


def test_create_next_quiz_plan():
    analysis = {
        "Programming": {"score": 40},
        "Statistics": {"score": 60},
        "Economics": {"score": 80},
    }

    result = create_next_quiz_plan(analysis, 10)

    assert sum(
        result["question_distribution"].values()
    ) == 10

    assert result["difficulty"] == "Easy to Medium"


def test_validate_learning_history():
    history = {
        "Programming": [40, 60, 80]
    }

    assert validate_learning_history(history) is True


def test_invalid_learning_history():
    history = {
        "Programming": [40, 120]
    }

    with pytest.raises(ValueError):
        validate_learning_history(history)


def test_empty_learning_report():
    result = generate_learning_report({})

    assert result["latest_scores"] == {}
    assert result["average_scores"] == {}
    assert result["recommendations"] == []
    assert result["next_quiz_plan"]["difficulty"] == "Not available"


def test_invalid_quiz_question_count():
    analysis = {
        "Programming": {"score": 80}
    }

    with pytest.raises(ValueError):
        create_next_quiz_plan(analysis, 0)
