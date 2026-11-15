
from pydantic import BaseModel


class NextQuizPlan(BaseModel):
    question_distribution: dict[str, int]
    difficulty: str
    message: str | None = None


class PersonalizationReport(BaseModel):
    latest_scores: dict[str, float]
    average_scores: dict[str, float]
    performance_analysis: dict
    progress_trends: dict
    recommendations: list[dict]
    next_quiz_plan: NextQuizPlan
