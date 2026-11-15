
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.user import User
from app.models.attempt import QuizAttempt
from app.models.quiz import Quiz
from app.models.course import Course
from app.schemas.personalization import PersonalizationReport
from app.services.adaptive_engine import generate_learning_report


router = APIRouter(
    prefix="/personalization",
    tags=["Personalization"]
)


@router.get("/report", response_model=PersonalizationReport)
def get_personalization_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch the current learner's submitted quiz attempts.
    statement = (
        select(Course.category, QuizAttempt.percentage)
        .join(Quiz, Quiz.course_id == Course.id)
        .join(QuizAttempt, QuizAttempt.quiz_id == Quiz.id)
        .where(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.submitted_at.is_not(None),
            QuizAttempt.total_points > 0
        )
        .order_by(
            QuizAttempt.submitted_at.asc(),
            QuizAttempt.id.asc()
        )
    )

    rows = db.execute(statement).all()

    # Group scores by course category.
    history = {}

    for category, percentage in rows:
        if not category or not category.strip():
            continue

        if percentage is None or not 0 <= percentage <= 100:
            continue

        topic = category.strip()
        history.setdefault(topic, []).append(percentage)

    # Generate the personalized report.
    return generate_learning_report(history)
