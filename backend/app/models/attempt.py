
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    quiz_id: Mapped[int] = mapped_column(
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    total_points: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    percentage: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    is_passed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
