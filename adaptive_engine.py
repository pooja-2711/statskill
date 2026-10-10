
def analyze_performance(topic_scores):
    results = {}

    for topic, score in topic_scores.items():
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
    if total_questions < 1:
        raise ValueError("Total questions must be at least 1.")

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
    for topic, score in new_scores.items():
        history.setdefault(topic, [])
        history[topic].append(score)

    return history


def calculate_average_scores(history):
    averages = {}

    for topic, scores in history.items():
        averages[topic] = round(sum(scores) / len(scores), 2)

    return averages

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


