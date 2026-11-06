import math
def analyze_performance(topic_scores):
    if not isinstance(topic_scores, dict):
        raise ValueError("Topic scores must be a dictionary.")

    results = {}

    for topic, score in topic_scores.items():

        if not isinstance(topic, str) or not topic.strip():
            raise ValueError("Topic names cannot be empty.")

        if (
            isinstance(score, bool)
            or not isinstance(score, (int, float))
            or not math.isfinite(score)
        ):
            raise ValueError(f"Invalid score for {topic}.")

        if not 0 <= score <= 100:
            raise ValueError(f"Score for {topic} must be between 0 and 100.")

        if score < 50:
            status = "Weak"
            level = "Beginner"
        elif score < 75:
            status = "Needs Practice"
            level = "Intermediate"
        else:
            status = "Strong"
            level = "Advanced"

        results[topic] = {
            "score": score,
            "status": status,
            "level": level
        }

    return results


def recommend_learning(analysis):
    recommendations = []

    for topic, details in analysis.items():
        score = details["score"]

        if score < 50:
            recommendations.append(
                f"{topic}: Study the basics and take an easy quiz."
            )
        elif score < 75:
            recommendations.append(
                f"{topic}: Revise the topic and practise more questions."
            )
        else:
            recommendations.append(
                f"{topic}: Try advanced questions to improve further."
            )

    return recommendations



def create_next_quiz_plan(analysis, total_questions=10):
    if (
        isinstance(total_questions, bool)
        or not isinstance(total_questions, int)
        or total_questions < 1 
    ):
        raise ValueError("Total questions must be a positive integer.")

    # Give more weight to weaker topics.
    weights = {}

    for topic, details in analysis.items():
        score = details["score"]

        if score < 50:
            weights[topic] = 5
        elif score < 75:
            weights[topic] = 3
        else:
            weights[topic] = 1

    if not weights:
        return {
            "question_distribution": {},
            "difficulty": "Not available",
            "message": "No topics available for quiz generation."
        }

    # Allocate questions proportionally.
    weight_total = sum(weights.values())
    exact_counts = {
        topic: total_questions * weight / weight_total
        for topic, weight in weights.items()
    }

    question_counts = {
        topic: int(count)
        for topic, count in exact_counts.items()
    }

    remaining = total_questions - sum(question_counts.values())

    # Allocate leftover questions to the largest fractional parts.
    ranked_topics = sorted(
        weights,
        key=lambda topic: exact_counts[topic] - question_counts[topic],
        reverse=True
    )

    for topic in ranked_topics[:remaining]:
        question_counts[topic] += 1

    weak_topics = [
        topic for topic, details in analysis.items()
        if details["score"] < 50
    ]

    practice_topics = [
        topic for topic, details in analysis.items()
        if 50 <= details["score"] < 75
    ]

    if weak_topics:
        difficulty = "Easy to Medium"
    elif practice_topics:
        difficulty = "Medium"
    else:
        difficulty = "Medium to Hard"

    return {
        "question_distribution": question_counts,
        "difficulty": difficulty
    }



def update_performance_history(history, new_scores):
    validate_learning_history(history)

    validated_scores = analyze_performance(new_scores)

    for topic, details in validated_scores.items():
        history.setdefault(topic, [])
        history[topic].append(details["score"])

    return history


def calculate_average_scores(history):
    validate_learning_history(history)    
    averages = {}

    for topic, scores in history.items():
        if not scores:
            continue

        averages[topic] = round(sum(scores) / len(scores), 2)

    return averages

def get_latest_scores(history):
    validate_learning_history(history)    
    latest_scores = {}

    for topic, scores in history.items():
        if scores:
            latest_scores[topic] = scores[-1]

    return latest_scores

def analyze_learning_history(history):
    latest_scores = get_latest_scores(history)
    average_scores = calculate_average_scores(history)

    performance = analyze_performance(latest_scores)

    return {
        "performance_analysis": performance,
        "latest_scores": latest_scores,
        "average_scores": average_scores
    }

def compare_quiz_attempts(previous_scores, latest_scores):
    comparison = {}

    for topic, latest_score in latest_scores.items():
        previous_score = previous_scores.get(topic)

        if previous_score is None:
            comparison[topic] = {
                "previous_score": None,
                "latest_score": latest_score,
                "change": None,
                "message": "First recorded attempt"
            }
            continue

        change = latest_score - previous_score

        if change > 0:
            message = "Improving"
        elif change < 0:
            message = "Needs attention"
        else:
            message = "No change"

        comparison[topic] = {
            "previous_score": previous_score,
            "latest_score": latest_score,
            "change": change,
            "message": message
        }

    return comparison

def analyze_progress_trend(history):
    validate_learning_history(history)
    trends = {}

    for topic, scores in history.items():
        if len(scores) < 2:
            trends[topic] = {
                "trend": "Insufficient data",
                "change": None
            }
            continue

        change = scores[-1] - scores[0]

        if change >= 5:
            trend = "Improving"
        elif change <= -5:
            trend = "Declining"
        else:
            trend = "Maintaining"

        trends[topic] = {
            "trend": trend,
            "change": change
        }

    return trends

def recommend_based_on_trend(trends):
    recommendations = []

    for topic, details in trends.items():
        trend = details["trend"]

        if trend == "Improving":
            advice = "Continue learning and try harder questions."

        elif trend == "Declining":
            advice = "Revise the topic and practise more questions."

        elif trend == "Maintaining":
            advice = "Practise additional questions to improve."

        else:
            advice = "Complete more quizzes to track your progress."

        recommendations.append({
            "topic": topic,
            "trend": trend,
            "recommendation": advice
        })

    return recommendations

def generate_learning_report(history, total_questions=10):
    learning_analysis = analyze_learning_history(history)

    trends = analyze_progress_trend(history)

    trend_recommendations = recommend_based_on_trend(trends)

    quiz_plan = create_next_quiz_plan(
        learning_analysis["performance_analysis"],
        total_questions
    )

    return {
        "latest_scores": learning_analysis["latest_scores"],
        "average_scores": learning_analysis["average_scores"],
        "performance_analysis": learning_analysis["performance_analysis"],
        "progress_trends": trends,
        "recommendations": trend_recommendations,
        "next_quiz_plan": quiz_plan
    }

def validate_learning_history(history):
    if not isinstance(history, dict):
        raise ValueError("Learning history must be a dictionary.")

    for topic, scores in history.items():

        if not isinstance(topic, str) or not topic.strip():
            raise ValueError("Topic names cannot be empty.")

        if not isinstance(scores, list):
            raise ValueError(f"Scores for {topic} must be a list.")

        for score in scores:
            if (
                isinstance(score, bool)
                or not isinstance(score, (int, float))
                or not math.isfinite(score)
                or not 0 <= score <= 100
            ):
                raise ValueError(
                    f"Invalid historical score for {topic}."
                )

    return True

