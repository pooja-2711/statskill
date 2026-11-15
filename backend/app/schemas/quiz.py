from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


# -------------------------
# Quiz Schemas
# -------------------------

class QuizCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    time_limit_minutes: int | None = Field(default=None, ge=1)
    passing_score: int = Field(default=60, ge=0, le=100)
    is_published: bool = False


class QuizUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    time_limit_minutes: int | None = Field(default=None, ge=1)
    passing_score: int | None = Field(default=None, ge=0, le=100)
    is_published: bool | None = None


class QuizResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    title: str
    description: str | None
    time_limit_minutes: int | None
    passing_score: int
    is_published: bool
    created_at: datetime
    updated_at: datetime


# -------------------------
# Question Schemas
# -------------------------

class QuestionCreate(BaseModel):
    question_text: str = Field(min_length=1)
    question_type: Literal["MCQ", "TRUE_FALSE"] = "MCQ"
    options: list[str] | None = None
    correct_answer: str = Field(min_length=1, max_length=500)
    points: int = Field(default=1, ge=1)
    order_index: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def validate_question(self):
        if self.question_type == "MCQ":
            if not self.options or len(self.options) < 2:
                raise ValueError("MCQ questions require at least two options.")

            if len(set(self.options)) != len(self.options):
                raise ValueError("Question options must be unique.")

            if self.correct_answer not in self.options:
                raise ValueError("Correct answer must match one of the options.")

        if self.question_type == "TRUE_FALSE":
            if self.options is not None:
                raise ValueError("True/False questions should not provide options.")

            if self.correct_answer not in ["True", "False"]:
                raise ValueError("True/False answer must be True or False.")

        return self


class QuestionUpdate(BaseModel):
    question_text: str | None = Field(default=None, min_length=1)
    question_type: Literal["MCQ", "TRUE_FALSE"] | None = None
    options: list[str] | None = None
    correct_answer: str | None = Field(default=None, min_length=1, max_length=500)
    points: int | None = Field(default=None, ge=1)
    order_index: int | None = Field(default=None, ge=1)


class InstructorQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    question_text: str
    question_type: str
    options: list[str] | None
    correct_answer: str
    points: int
    order_index: int
    created_at: datetime
    updated_at: datetime


class LearnerQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    question_text: str
    question_type: str
    options: list[str] | None
    points: int
    order_index: int