
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

Level = Literal["beginner", "intermediate", "advanced"]
DiscoverySource = Literal["cache", "youtube", "cache_fallback"]


class ExternalCourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider: str
    external_id: str
    title: str
    description: str | None = None
    url: str
    thumbnail_url: str | None = None
    channel_or_org: str | None = None
    topic: str | None = None
    level: str | None = None
    is_free: bool
    is_link_only: bool
    fetched_at: datetime


class LinkProviderOut(BaseModel):
    provider: str
    name: str
    url: str
    is_free: bool | None = None
    note: str


class DiscoveryResponse(BaseModel):
    query: str
    source: DiscoverySource
    count: int
    courses: list[ExternalCourseOut]
    link_providers: list[LinkProviderOut]
    notice: str | None = None
