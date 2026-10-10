
from adaptive_engine import compare_quiz_attempts

previous_scores = {
    "Sampling": 40,
    "GDP": 85,
    "Data Quality": 60
}

latest_scores = {
    "Sampling": 70,
    "GDP": 80,
    "Data Quality": 60
}

results = compare_quiz_attempts(
    previous_scores,
    latest_scores
)

print("=== StatSkill Learning Progress ===")

for topic, details in results.items():
    print(f"\nTopic: {topic}")
    print("Previous:", details["previous_score"])
    print("Latest:", details["latest_score"])
    print("Change:", details["change"])
    print("Status:", details["message"])
