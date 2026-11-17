import uuid
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

EventType = Literal["exam", "deadline", "study", "assignment", "other"]


def _aware(dt: datetime | None) -> datetime | None:
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class CalendarEventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    type: EventType = "other"
    start_at: datetime
    end_at: datetime | None = None
    all_day: bool = False
    notes: str | None = Field(default=None, max_length=2000)
    remind_minutes_before: int | None = Field(default=None, ge=0, le=10080)
    source_ref: str | None = Field(default=None, max_length=200)

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be blank")
        return v

    @model_validator(mode="after")
    def check_times(self):
        self.start_at = _aware(self.start_at)
        self.end_at = _aware(self.end_at)
        if self.end_at is not None and self.end_at < self.start_at:
            raise ValueError("end_at must not be before start_at")
        return self


class CalendarEventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    type: EventType | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    all_day: bool | None = None
    notes: str | None = Field(default=None, max_length=2000)
    remind_minutes_before: int | None = Field(default=None, ge=0, le=10080)
    source_ref: str | None = Field(default=None, max_length=200)

    @model_validator(mode="after")
    def normalize(self):
        self.start_at = _aware(self.start_at)
        self.end_at = _aware(self.end_at)
        return self


class CalendarEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    type: str
    start_at: datetime
    end_at: datetime | None
    all_day: bool
    notes: str | None
    remind_minutes_before: int | None
    source_ref: str | None
    created_at: datetime