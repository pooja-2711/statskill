from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ContentItemOut(BaseModel):
    """Field order matters: the source name comes first, above the headline."""

    model_config = ConfigDict(from_attributes=True)

    source_name: str
    source_key: str | None = None
    title: str
    category: str
    published_at: datetime | None = None
    summary: str | None = None
    url: str
    label: str
    section: str
    id: UUID
    fetched_at: datetime


class ContentItemDetail(ContentItemOut):
    source_homepage_url: str | None = None


class ContentListResponse(BaseModel):
    items: list[ContentItemOut]
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool


class ContentSourceOut(BaseModel):
    key: str
    name: str
    kind: str
    homepage_url: str | None = None
    item_count: int
    last_fetched_at: datetime | None = None
    last_status: str | None = None


class ContentSourcesResponse(BaseModel):
    sources: list[ContentSourceOut]
    categories: list[str]