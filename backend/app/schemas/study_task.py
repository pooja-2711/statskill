
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StudyTaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    due_date: date | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title cannot be empty.")
        return value


class StudyTaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    due_date: date | None = None
    done: bool | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Title cannot be empty.")
        return value


class StudyTaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    due_date: date | None
    done: bool
    created_at: datetime
