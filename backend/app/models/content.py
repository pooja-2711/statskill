import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, JSON, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

CATEGORIES = (
    "Polity",
    "Economy",
    "International Relations",
    "Environment",
    "Science & Technology",
    "Defence",
    "Social Issues",
    "Sports",
    "Government Schemes",
    "Miscellaneous",
)
LABELS = ("Official", "Newspaper", "AI-summarised")
SECTIONS = ("newspaper", "current_affairs")


class ContentSource(Base):
    __tablename__ = "content_sources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key: Mapped[str] = mapped_column(String(32), unique=True, index=True)   # e.g. "the-hindu"
    name: Mapped[str] = mapped_column(String(100))                          # display name, e.g. "THE HINDU"
    kind: Mapped[str] = mapped_column(String(20))                           # newspaper | official | ai
    homepage_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    feed_urls: Mapped[list] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_status: Mapped[str | None] = mapped_column(String(20), nullable=True)   # ok | partial | failed
    last_error: Mapped[str | None] = mapped_column(String(300), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ContentItem(Base):
    __tablename__ = "content_items"
    __table_args__ = (Index("ix_content_items_section_published", "section", "published_at"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("content_sources.id", ondelete="SET NULL"), index=True, nullable=True
    )
    source_name: Mapped[str] = mapped_column(String(100), index=True)       # shown above the headline
    section: Mapped[str] = mapped_column(String(20), index=True)            # newspaper | current_affairs
    title: Mapped[str] = mapped_column(String(500))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str] = mapped_column(String(1000))                          # original article link
    category: Mapped[str] = mapped_column(String(40), index=True)
    label: Mapped[str] = mapped_column(String(20))                          # Official | Newspaper | AI-summarised
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True, nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    dedupe_hash: Mapped[str] = mapped_column(String(64), unique=True)