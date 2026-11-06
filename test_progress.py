
import unittest

from adaptive_engine import (
    analyze_performance,
    create_next_quiz_plan,
    compare_quiz_attempts,
    calculate_average_scores,
    get_latest_scores,
    analyze_learning_history,
    analyze_progress_trend,
    recommend_based_on_trend,
    generate_learning_report,
    validate_learning_history
)

class TestStatSkill(unittest.TestCase):

    def test_performance_levels(self):
        scores = {
            "Sampling": 49,
            "GDP": 50,
            "Census": 75,
            "Data Quality": 100
        }

        result = analyze_performance(scores)

        self.assertEqual(result["Sampling"]["status"], "Weak")
        self.assertEqual(result["GDP"]["status"], "Needs Practice")
        self.assertEqual(result["Census"]["status"], "Strong")
        self.assertEqual(result["Data Quality"]["status"], "Strong")

    def test_quiz_question_distribution(self):
        scores = {
            "Sampling": 40,
            "GDP": 85,
            "Data Quality": 60
        }

        analysis = analyze_performance(scores)
        plan = create_next_quiz_plan(analysis, 10)

        total = sum(plan["question_distribution"].values())

        self.assertEqual(total, 10)

    def test_quiz_attempt_comparison(self):
        previous = {"Sampling": 40, "GDP": 85}
        latest = {"Sampling": 70, "GDP": 80}

        result = compare_quiz_attempts(previous, latest)

        self.assertEqual(result["Sampling"]["message"], "Improving")
        self.assertEqual(result["GDP"]["message"], "Needs attention")

    def test_empty_score_history(self):
        history = {
            "Sampling": [],
            "GDP": [80, 90]
        }

        result = calculate_average_scores(history)

        self.assertEqual(result, {"GDP": 85.0})

    def test_latest_scores(self):
        history = {
            "Sampling": [40, 55, 75],
            "GDP": [80, 70, 85],
            "Census": []
        }

        result = get_latest_scores(history)

        self.assertEqual(result, {
            "Sampling": 75,
            "GDP": 85
        })    

    def test_analyze_learning_history(self):
        history = {
            "Sampling": [40, 60, 80],
            "GDP": [90, 70, 80]
        }

        result = analyze_learning_history(history)

        self.assertEqual(result["latest_scores"]["Sampling"], 80)
        self.assertEqual(result["latest_scores"]["GDP"], 80)

        self.assertEqual(result["average_scores"]["Sampling"], 60)
        self.assertEqual(result["average_scores"]["GDP"], 80)

        self.assertEqual(
            result["performance_analysis"]["Sampling"]["status"],
            "Strong"
        )   

    def test_progress_trend(self):
        history = {
            "Sampling": [40, 60, 80],
            "GDP": [90, 70, 60],
            "Census": [70, 72, 73],
            "Data Quality": [80]
        }

        result = analyze_progress_trend(history)

        self.assertEqual(result["Sampling"]["trend"], "Improving")
        self.assertEqual(result["GDP"]["trend"], "Declining")
        self.assertEqual(result["Census"]["trend"], "Maintaining")
        self.assertEqual(result["Data Quality"]["trend"], "Insufficient data")

    def test_recommend_based_on_trend(self):
        trends = {
            "Sampling": {"trend": "Improving", "change": 30},
            "GDP": {"trend": "Declining", "change": -20},
            "Census": {"trend": "Maintaining", "change": 3},
            "Data Quality": {"trend": "Insufficient data", "change": None}
        }

        result = recommend_based_on_trend(trends)

        self.assertEqual(len(result), 4)
        self.assertIn("harder questions", result[0]["recommendation"])
        self.assertIn("Revise", result[1]["recommendation"])
        self.assertIn("additional questions", result[2]["recommendation"])
        self.assertIn("more quizzes", result[3]["recommendation"])      

    def test_generate_learning_report(self):
        history = {
            "Sampling": [40, 60, 80],
            "GDP": [90, 70, 60]
        }

        report = generate_learning_report(history, 10)

        self.assertEqual(report["latest_scores"]["Sampling"], 80)
        self.assertEqual(report["average_scores"]["Sampling"], 60)

        self.assertEqual(
            report["progress_trends"]["Sampling"]["trend"],
            "Improving"
        )

        total = sum(
            report["next_quiz_plan"]["question_distribution"].values()
        )

        self.assertEqual(total, 10)
        self.assertEqual(len(report["recommendations"]), 2) 

    def test_invalid_negative_score(self):
        with self.assertRaises(ValueError):
            analyze_performance({"Sampling": -10})

    def test_invalid_score_above_100(self):
        with self.assertRaises(ValueError):
            analyze_performance({"GDP": 120})

    def test_invalid_topic_name(self):
        with self.assertRaises(ValueError):
            analyze_performance({"": 80})          

    def test_invalid_text_score(self):
        with self.assertRaises(ValueError):
            analyze_performance({"Sampling": "eighty"})

    def test_invalid_boolean_score(self):
        with self.assertRaises(ValueError):
            analyze_performance({"GDP": True})

    def test_invalid_input_type(self):
        with self.assertRaises(ValueError):
            analyze_performance(["Sampling", 80])       

    def test_valid_learning_history(self):
        history = {
            "Sampling": [40, 60, 80],
            "GDP": [75, 85]
        }

        self.assertTrue(validate_learning_history(history))

    def test_invalid_historical_score(self):
        history = {"Sampling": [40, 120]}

        with self.assertRaises(ValueError):
            validate_learning_history(history)

    def test_invalid_historical_score_type(self):
        history = {"GDP": ["eighty"]}

        with self.assertRaises(ValueError):
            validate_learning_history(history)

    def test_invalid_history_format(self):
        history = {"Sampling": 80}

        with self.assertRaises(ValueError):
            validate_learning_history(history)         

if __name__ == "__main__":
    unittest.main()
