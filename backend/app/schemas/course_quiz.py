from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

QUIZ_LABEL = "AI-generated from the course title and description. May contain errors."


class QuizQuestion(BaseModel):
    question: str = Field(min_length=10, max_length=500)
    options: list[str] = Field(min_length=4, max_length=4)
    correct_index: int = Field(ge=0, le=3)
    explanation: str = Field(min_length=5, max_length=600)

    @field_validator("question", "explanation")
    @classmethod
    def strip_text(cls, v: str) -> str:
        return v.strip()

    @field_validator("options")
    @classmethod
    def clean_options(cls, v: list[str]) -> list[str]:
        cleaned = [o.strip() for o in v]
        if any(not o or len(o) > 200 for o in cleaned):
            raise ValueError("each option must be 1-200 characters")
        if len({o.lower() for o in cleaned}) != len(cleaned):
            raise ValueError("options must be distinct")
        return cleaned


class GeneratedQuiz(BaseModel):
    questions: list[QuizQuestion] = Field(min_length=3, max_length=10)


class CourseQuizOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    questions: list[QuizQuestion]
    is_ai_generated: bool
    model_name: str | None = None
    created_at: datetime
    label: str = QUIZ_LABEL