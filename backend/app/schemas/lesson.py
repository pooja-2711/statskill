from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LessonCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    content: str | None = None
    video_url: str | None = Field(default=None, max_length=500)
    duration_minutes: int = Field(default=0, ge=0)
    order_index: int = Field(default=1, ge=1)
    is_preview: bool = False


class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    content: str | None = None
    video_url: str | None = Field(default=None, max_length=500)
    duration_minutes: int | None = Field(default=None, ge=0)
    order_index: int | None = Field(default=None, ge=1)
    is_preview: bool | None = None


class LessonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    title: str
    description: str | None
    content: str | None
    video_url: str | None
    duration_minutes: int
    order_index: int
    is_preview: bool
    created_at: datetime
    updated_at: datetime