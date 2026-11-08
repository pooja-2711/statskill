
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuizAttemptStart(BaseModel):
    quiz_id: int = Field(gt=0)


class QuizAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    user_id: int
    score: int
    total_points: int
    percentage: int
    is_passed: bool
    started_at: datetime
    submitted_at: datetime | None


class QuizAttemptResult(BaseModel):
    attempt_id: int
    quiz_id: int
    score: int
    total_points: int
    percentage: int
    is_passed: bool
    submitted_at: datetime | None
class AnswerSubmission(BaseModel):
    question_id: int = Field(gt=0)
    selected_answer: str | None = Field(default=None, max_length=500)


class QuizAttemptSubmit(BaseModel):
    answers: list[AnswerSubmission]