import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, Boolean, DateTime, ForeignKey, JSON, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base  # adjust to your Base


class ExternalCourse(Base):
    __tablename__ = "external_courses"
    __table_args__ = (UniqueConstraint("provider", "external_id", name="uq_external_course_provider_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String(32), index=True)       # youtube | coursera | udemy | nptel | link
    external_id: Mapped[str] = mapped_column(String(128))               # video/playlist id, or url hash for link-only
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str] = mapped_column(String(1000))
    thumbnail_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    channel_or_org: Mapped[str | None] = mapped_column(String(200), nullable=True)
    topic: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    level: Mapped[str | None] = mapped_column(String(20), nullable=True)  # beginner | intermediate | advanced
    is_free: Mapped[bool] = mapped_column(Boolean, default=True)
    is_link_only: Mapped[bool] = mapped_column(Boolean, default=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserGoal(Base):
    __tablename__ = "user_goals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)  # match your User.id type
    title: Mapped[str] = mapped_column(String(200))
    topic: Mapped[str | None] = mapped_column(String(100), nullable=True)
    level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    target_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CourseQuiz(Base):
    __tablename__ = "course_quizzes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("external_courses.id", ondelete="CASCADE"), index=True)
    questions: Mapped[list] = mapped_column(JSON)          # validated list of MCQs
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=True)
    model_name: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())