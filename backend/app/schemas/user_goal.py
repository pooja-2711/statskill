from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.course_discovery import Level


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    topic: str | None = Field(default=None, max_length=100)
    level: Level | None = None
    target_date: datetime | None = None

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("title must not be blank")
        return v

    @field_validator("topic")
    @classmethod
    def clean_topic(cls, v: str | None) -> str | None:
        return _clean(v)


class GoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    topic: str | None = Field(default=None, max_length=100)
    level: Level | None = None
    target_date: datetime | None = None

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("title must not be blank")
        return v

    @field_validator("topic")
    @classmethod
    def clean_topic(cls, v: str | None) -> str | None:
        return _clean(v)


class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    topic: str | None = None
    level: str | None = None
    target_date: datetime | None = None
    created_at: datetime