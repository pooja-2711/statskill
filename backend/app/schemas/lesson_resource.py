
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ResourceType = Literal[
    "note",
    "video",
    "pdf",
    "exercise",
    "link",
]


class LessonResourceCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    resource_type: ResourceType
    description: str | None = None
    content: str | None = None
    resource_url: str | None = Field(default=None, max_length=1000)
    order_index: int = Field(default=1, ge=1)


class LessonResourceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    resource_type: ResourceType | None = None
    description: str | None = None
    content: str | None = None
    resource_url: str | None = Field(default=None, max_length=1000)
    order_index: int | None = Field(default=None, ge=1)


class LessonResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lesson_id: int
    title: str
    resource_type: str
    description: str | None
    content: str | None
    resource_url: str | None
    order_index: int
    created_at: datetime
    updated_at: datetime
